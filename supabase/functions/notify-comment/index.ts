import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);

    const { shared_post_id, author_name, comment } = await req.json();
    if (!shared_post_id || !author_name || !comment) {
      throw new Error("Missing required fields: shared_post_id, author_name, comment");
    }

    console.log(`New comment by ${author_name} on shared post ${shared_post_id}`);

    // Look up the shared post and the post owner's email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: post, error: postErr } = await supabase
      .from("shared_posts")
      .select("id, caption, platform, brand_name, user_id")
      .eq("id", shared_post_id)
      .single();

    if (postErr || !post) {
      console.error("Post lookup failed:", postErr);
      throw new Error("Shared post not found");
    }

    // Get the post owner's email from auth
    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(post.user_id);
    if (userErr || !userData?.user?.email) {
      console.error("User lookup failed:", userErr);
      throw new Error("Could not find post owner email");
    }

    const ownerEmail = userData.user.email;
    const brandLabel = post.brand_name ? ` (${post.brand_name})` : "";
    const captionPreview = post.caption.length > 80 ? post.caption.slice(0, 80) + "…" : post.caption;

    console.log(`Sending notification to ${ownerEmail}`);

    const { error: emailErr } = await resend.emails.send({
      from: "Notifications <onboarding@resend.dev>",
      to: [ownerEmail],
      subject: `💬 New comment from ${author_name} on your ${post.platform} post`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #333; margin-bottom: 4px;">New Stakeholder Comment</h2>
          <p style="color: #666; font-size: 14px; margin-top: 0;">
            <strong>${author_name}</strong> left feedback on your <strong>${post.platform}</strong> post${brandLabel}
          </p>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap;">${comment}</p>
          </div>
          <p style="color: #888; font-size: 12px;">Post preview: "${captionPreview}"</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 11px;">You received this because a stakeholder commented on a post you shared for review.</p>
        </div>
      `,
    });

    if (emailErr) {
      console.error("Resend error:", emailErr);
      throw new Error(`Email send failed: ${JSON.stringify(emailErr)}`);
    }

    console.log("Notification email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("notify-comment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
