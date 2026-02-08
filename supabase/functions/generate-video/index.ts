import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { imageUrl, prompt, brandName } = await req.json();
    if (!imageUrl && !prompt) throw new Error("Either imageUrl or prompt is required");

    console.log("Generating animated image for:", prompt?.substring(0, 80) || "image-based");

    // Generate a stylized "cinematic" version of the image as a motion-style still
    const enhancedPrompt = imageUrl
      ? `Re-imagine this social media post image with a dramatic cinematic style: add motion blur streaks, light flares, dynamic lighting, and a sense of movement. Make it look like a freeze-frame from a professional video ad. Keep the brand message and composition intact. ${prompt || ""}`
      : `Create a dramatic, cinematic social media post image with motion blur, light flares, and dynamic energy. Professional marketing content for ${brandName || "a brand"}. ${prompt}`;

    const requestBody: any = {
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: imageUrl
            ? [
                { type: "text", text: enhancedPrompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ]
            : enhancedPrompt,
        },
      ],
      modalities: ["image", "text"],
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Image gen error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`Image gen error: ${response.status}`);
    }

    const result = await response.json();
    const generatedImage = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(result).substring(0, 300));
      throw new Error("Image generation failed - no output returned");
    }

    // Upload to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `post-videos/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabaseClient.storage
      .from("post-assets")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ videoUrl: generatedImage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabaseClient.storage
      .from("post-assets")
      .getPublicUrl(fileName);

    console.log("Animated image generated and uploaded:", publicUrl.publicUrl);

    return new Response(JSON.stringify({ videoUrl: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
