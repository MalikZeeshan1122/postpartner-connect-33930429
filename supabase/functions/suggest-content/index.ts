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

    const { brandName, brandVoice, contentThemes, existingPostIntents } = await req.json();

    console.log("Generating content suggestions for:", brandName);

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a social media strategist. Suggest creative, timely post ideas for brands. Today is ${today}. Consider current events, trending topics, and seasonal opportunities. Be specific and actionable.`,
          },
          {
            role: "user",
            content: `Suggest 5-8 social media post ideas for "${brandName}".

Brand voice: ${JSON.stringify(brandVoice || {})}
Content themes: ${JSON.stringify(contentThemes || [])}
${existingPostIntents?.length ? `Already planned posts (avoid duplicates):\n${existingPostIntents.join("\n")}` : ""}

Include a mix of:
- Trending/timely content (current events, sports events like Super Bowl, Olympics, major tech events)
- Evergreen brand content
- Engagement-focused content (polls, questions, behind-the-scenes)
- Product/service promotion`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_content",
              description: "Return content suggestions for social media",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short title for the post idea" },
                        intent: { type: "string", description: "Detailed post intent description" },
                        platform: { type: "string", enum: ["linkedin", "instagram", "both"] },
                        category: { type: "string", enum: ["trending", "evergreen", "engagement", "promotion"] },
                        urgency: { type: "string", enum: ["now", "this_week", "this_month", "anytime"] },
                        reasoning: { type: "string", description: "Why this post is a good idea right now" },
                      },
                      required: ["title", "intent", "platform", "category", "urgency", "reasoning"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_content" } },
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
    if (!toolCall) throw new Error("No suggestions returned");

    const suggestions = JSON.parse(toolCall.function.arguments);
    console.log("Generated", suggestions.suggestions?.length, "suggestions");

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
