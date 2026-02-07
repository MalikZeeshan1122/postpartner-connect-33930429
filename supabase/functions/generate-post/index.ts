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

    const { intent, platform, tone, cta, extraContext, brandVoice, visualIdentity, variationCount = 3, existingCaption, userFeedback, formats = ["single"] } = await req.json();

    console.log("Generating posts for:", { intent, platform, tone, variationCount, formats });

    const isIteration = !!existingCaption && !!userFeedback;

    const systemPrompt = `You are an expert social media copywriter and strategist. You create high-quality, on-brand social media posts.

Brand Voice: ${JSON.stringify(brandVoice || {})}
Visual Identity: ${JSON.stringify(visualIdentity || {})}

Rules:
- Write posts optimized for ${platform === 'both' ? 'LinkedIn and Instagram' : platform}
- Keep LinkedIn posts professional but engaging, 150-300 words, use line breaks for readability
- Keep Instagram posts punchy, use emojis strategically, include relevant hashtags (5-10)
- Always include a clear CTA
- Maintain brand voice consistency
- Text overlays should be SHORT (5-8 words max), impactful, and readable on mobile

Requested formats: ${formats.join(', ')}
- "single": Standard single-image post
- "carousel": Multi-slide carousel (3-5 slides). Provide a "carouselSlides" array with textOverlay per slide
- "story": Instagram/LinkedIn story format (vertical 9:16). Keep text very short and punchy`;

    let userPrompt: string;

    if (isIteration) {
      userPrompt = `The user wants to improve this existing post:

EXISTING CAPTION:
${existingCaption}

USER FEEDBACK:
${userFeedback}

Generate ${variationCount} improved variations based on the feedback. Do NOT start from scratch - iterate on the existing post.`;
    } else {
      userPrompt = `Create ${variationCount} post variations for the following:

Intent: ${intent}
Platform: ${platform}
${tone ? `Tone: ${tone}` : ''}
${cta ? `CTA: ${cta}` : ''}
${extraContext ? `Additional Context: ${extraContext}` : ''}`;
    }

    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_post_variations",
            description: "Create social media post variations with captions and image suggestions",
            parameters: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      platform: { type: "string", enum: ["linkedin", "instagram"] },
                      format: { type: "string", enum: ["single", "carousel", "story"], description: "Post format type" },
                      caption: { type: "string", description: "The full post caption text" },
                      textOverlay: { type: "string", description: "Short text for image overlay (5-8 words)" },
                      imagePrompt: { type: "string", description: "A detailed prompt for generating the background image. Should include brand colors, style, and mood." },
                      ctaText: { type: "string", description: "The call to action text" },
                      carouselSlides: {
                        type: "array",
                        description: "Array of slides for carousel format (3-5 slides). Only for carousel format.",
                        items: {
                          type: "object",
                          properties: {
                            textOverlay: { type: "string", description: "Short text for this slide (5-8 words)" },
                          },
                          required: ["textOverlay"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["platform", "format", "caption", "textOverlay", "imagePrompt", "ctaText"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_post_variations" } },
      }),
    });

    if (!toolResponse.ok) {
      const errText = await toolResponse.text();
      console.error("AI gateway error:", toolResponse.status, errText);
      if (toolResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (toolResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${toolResponse.status}`);
    }

    const aiResult = await toolResponse.json();
    console.log("AI result received");

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const variations = JSON.parse(toolCall.function.arguments);

    // Self-feedback loop: evaluate and improve
    console.log("Running self-feedback loop...");
    const feedbackPrompt = `Review these social media post variations and score each one. For any scoring below 8/10, provide specific improvements.

Evaluation criteria:
1. Brand consistency (voice, tone, messaging)
2. Message clarity and impact
3. CTA effectiveness
4. Text overlay readability (must be ≤8 words)
5. Platform optimization (LinkedIn vs Instagram norms)
6. Mobile readability

Posts to review:
${JSON.stringify(variations.variations, null, 2)}`;

    const feedbackResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a social media quality reviewer. Be critical but constructive." },
          { role: "user", content: feedbackPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "review_posts",
            description: "Review and score post variations",
            parameters: {
              type: "object",
              properties: {
                reviews: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number" },
                      score: { type: "number", description: "Score out of 10" },
                      feedback: { type: "string" },
                      improvedCaption: { type: "string", description: "Improved version if score < 8, otherwise same as original" },
                      improvedTextOverlay: { type: "string", description: "Improved overlay if needed" },
                    },
                    required: ["index", "score", "feedback", "improvedCaption", "improvedTextOverlay"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["reviews"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "review_posts" } },
      }),
    });

    let finalVariations = variations.variations;
    let feedbackData: any[] = [];

    if (feedbackResponse.ok) {
      const fbResult = await feedbackResponse.json();
      const fbToolCall = fbResult.choices?.[0]?.message?.tool_calls?.[0];
      if (fbToolCall) {
        const reviews = JSON.parse(fbToolCall.function.arguments);
        feedbackData = reviews.reviews || [];

        // Apply improvements from first feedback round
        finalVariations = finalVariations.map((v: any, i: number) => {
          const review = feedbackData.find((r: any) => r.index === i);
          if (review && review.score < 8) {
            return {
              ...v,
              caption: review.improvedCaption || v.caption,
              textOverlay: review.improvedTextOverlay || v.textOverlay,
            };
          }
          return v;
        });
        console.log("Round 1 self-feedback applied");

        // --- Round 2: Second self-feedback iteration ---
        const needsRound2 = feedbackData.some((r: any) => r.score < 7);
        if (needsRound2) {
          console.log("Running round 2 self-feedback (some scores < 7)...");
          const round2Prompt = `These posts were already improved once but some still score below 7. Do a final polish pass focusing on brand voice consistency, mobile readability, and CTA clarity.

Posts:
${JSON.stringify(finalVariations, null, 2)}

Original brand voice: ${JSON.stringify(brandVoice || {})}`;

          const round2Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "You are a senior social media editor doing a final quality pass. Be concise." },
                { role: "user", content: round2Prompt },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "review_posts",
                  description: "Final review and polish of post variations",
                  parameters: {
                    type: "object",
                    properties: {
                      reviews: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            index: { type: "number" },
                            score: { type: "number" },
                            feedback: { type: "string" },
                            improvedCaption: { type: "string" },
                            improvedTextOverlay: { type: "string" },
                          },
                          required: ["index", "score", "feedback", "improvedCaption", "improvedTextOverlay"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["reviews"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "review_posts" } },
            }),
          });

          if (round2Response.ok) {
            const r2Result = await round2Response.json();
            const r2ToolCall = r2Result.choices?.[0]?.message?.tool_calls?.[0];
            if (r2ToolCall) {
              const r2Reviews = JSON.parse(r2ToolCall.function.arguments);
              const r2Data = r2Reviews.reviews || [];

              finalVariations = finalVariations.map((v: any, i: number) => {
                const review = r2Data.find((r: any) => r.index === i);
                if (review && review.improvedCaption) {
                  return {
                    ...v,
                    caption: review.improvedCaption,
                    textOverlay: review.improvedTextOverlay || v.textOverlay,
                  };
                }
                return v;
              });

              // Merge round 2 feedback with round 1
              feedbackData = feedbackData.map((fb: any) => {
                const r2 = r2Data.find((r: any) => r.index === fb.index);
                if (r2) {
                  return { ...fb, score: r2.score, feedback: `${fb.feedback} → Final: ${r2.feedback}` };
                }
                return fb;
              });

              console.log("Round 2 self-feedback applied");
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      variations: finalVariations,
      feedback: feedbackData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-post error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
