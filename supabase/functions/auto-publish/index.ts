import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function publishToLinkedIn(caption: string, imageUrl: string | null, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get LinkedIn user profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      const text = await profileRes.text();
      throw new Error(`LinkedIn profile fetch failed [${profileRes.status}]: ${text}`);
    }
    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Create a share post
    const shareBody: any = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(shareBody),
    });

    if (!postRes.ok) {
      const text = await postRes.text();
      throw new Error(`LinkedIn post failed [${postRes.status}]: ${text}`);
    }

    console.log("LinkedIn post published successfully");
    return { success: true };
  } catch (err: any) {
    console.error("LinkedIn publish error:", err.message);
    return { success: false, error: err.message };
  }
}

async function publishToInstagram(caption: string, imageUrl: string | null, accessToken: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!imageUrl) {
      throw new Error("Instagram requires an image to publish");
    }

    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${userId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Instagram container creation failed [${createRes.status}]: ${text}`);
    }

    const { id: containerId } = await createRes.json();
    console.log("Instagram media container created:", containerId);

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${userId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const text = await publishRes.text();
      throw new Error(`Instagram publish failed [${publishRes.status}]: ${text}`);
    }

    console.log("Instagram post published successfully");
    return { success: true };
  } catch (err: any) {
    console.error("Instagram publish error:", err.message);
    return { success: false, error: err.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const linkedinToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
    const instagramToken = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
    const instagramUserId = Deno.env.get("INSTAGRAM_USER_ID");

    // Find scheduled posts that are due (scheduled_at <= now and status = 'scheduled')
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchErr } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (fetchErr) {
      console.error("Error fetching due posts:", fetchErr);
      throw new Error(`Failed to fetch due posts: ${fetchErr.message}`);
    }

    if (!duePosts || duePosts.length === 0) {
      console.log("No posts due for publishing");
      return new Response(JSON.stringify({ published: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${duePosts.length} posts due for publishing`);

    const results: Array<{ id: string; platform: string; success: boolean; error?: string }> = [];

    for (const post of duePosts) {
      let result: { success: boolean; error?: string };

      if (post.platform === "linkedin") {
        if (!linkedinToken) {
          result = { success: false, error: "LINKEDIN_ACCESS_TOKEN not configured" };
        } else {
          result = await publishToLinkedIn(post.caption, post.image_url, linkedinToken);
        }
      } else if (post.platform === "instagram") {
        if (!instagramToken || !instagramUserId) {
          result = { success: false, error: "Instagram credentials not configured" };
        } else {
          result = await publishToInstagram(post.caption, post.image_url, instagramToken, instagramUserId);
        }
      } else {
        result = { success: false, error: `Unsupported platform: ${post.platform}` };
      }

      // Update post status
      const newStatus = result.success ? "published" : "failed";
      await supabase
        .from("scheduled_posts")
        .update({ status: newStatus })
        .eq("id", post.id);

      results.push({ id: post.id, platform: post.platform, ...result });
      console.log(`Post ${post.id} (${post.platform}): ${newStatus}`, result.error || "");
    }

    return new Response(JSON.stringify({ published: results.filter((r) => r.success).length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("auto-publish error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
