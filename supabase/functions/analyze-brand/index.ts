import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { websiteUrl, samplePosts, guidelines } = await req.json();

    console.log("Analyzing brand:", { websiteUrl, postsCount: samplePosts?.length });

    const userPrompt = `Analyze the following brand information and extract the brand voice and visual identity:

${websiteUrl ? `Website: ${websiteUrl}` : ''}
${samplePosts?.length ? `Sample Posts:\n${samplePosts.join('\n---\n')}` : ''}
${guidelines ? `Brand Guidelines:\n${guidelines}` : ''}

Based on this information, infer the brand's characteristics.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a brand analyst. Extract brand voice and visual identity from provided materials." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_brand_profile",
            description: "Extract brand voice and visual identity characteristics",
            parameters: {
              type: "object",
              properties: {
                brandVoice: {
                  type: "object",
                  properties: {
                    tone: { type: "string", description: "e.g. professional, playful, authoritative" },
                    formality: { type: "string", enum: ["very_formal", "formal", "neutral", "casual", "very_casual"] },
                    emojiUsage: { type: "string", enum: ["none", "minimal", "moderate", "heavy"] },
                    ctaStyle: { type: "string", description: "How CTAs are typically phrased" },
                    keyPhrases: { type: "array", items: { type: "string" }, description: "Recurring phrases or patterns" },
                    contentThemes: { type: "array", items: { type: "string" }, description: "Main topics and themes" },
                  },
                  required: ["tone", "formality", "emojiUsage", "ctaStyle", "keyPhrases", "contentThemes"],
                  additionalProperties: false,
                },
                visualIdentity: {
                  type: "object",
                  properties: {
                    primaryColors: { type: "array", items: { type: "string" }, description: "Main brand colors as hex codes" },
                    style: { type: "string", description: "e.g. modern, minimalist, bold, playful" },
                    imageStyle: { type: "string", description: "Preferred image style for social media" },
                    layoutPreference: { type: "string", description: "Layout tendencies" },
                  },
                  required: ["primaryColors", "style", "imageStyle", "layoutPreference"],
                  additionalProperties: false,
                },
                summary: { type: "string", description: "A 2-3 sentence summary of the brand" },
              },
              required: ["brandVoice", "visualIdentity", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_brand_profile" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const brandProfile = JSON.parse(toolCall.function.arguments);
    console.log("Brand profile extracted successfully");

    return new Response(JSON.stringify(brandProfile), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze-brand error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
