import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const url = new URL(req.url);
    const clientId = Deno.env.get("LINKEDIN_CLIENT_ID")!;
    const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // The redirect URI points back to this edge function with action=callback
    const functionUrl = `${supabaseUrl}/functions/v1/linkedin-oauth`;
    const redirectUri = `${functionUrl}?action=callback`;

    const action = url.searchParams.get("action") || "start";

    // Step 1: Start OAuth — redirect user to LinkedIn authorization
    if (action === "start") {
      const state = crypto.randomUUID();
      const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "openid profile w_member_social");
      authUrl.searchParams.set("state", state);

      console.log("Redirecting to LinkedIn authorization:", authUrl.toString());

      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl.toString(),
          ...corsHeaders,
        },
      });
    }

    // Step 2: Callback — exchange code for access token
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const errorDesc = url.searchParams.get("error_description");

      if (error) {
        console.error("LinkedIn OAuth error:", error, errorDesc);
        return new Response(
          renderHtml(`❌ LinkedIn OAuth Error: ${errorDesc || error}`, false),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      if (!code) {
        console.error("No authorization code received");
        return new Response(
          renderHtml("❌ No authorization code received", false),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      console.log("Exchanging authorization code for access token...");

      // Exchange code for token
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const tokenText = await tokenRes.text();
      console.log("Token response status:", tokenRes.status);

      if (!tokenRes.ok) {
        console.error("Token exchange failed:", tokenText);
        return new Response(
          renderHtml(`❌ Token exchange failed: ${tokenText}`, false),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      const tokenData = JSON.parse(tokenText);
      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in;

      console.log("Access token obtained! Expires in:", expiresIn, "seconds");

      // Store the token as a Supabase secret by updating the vault
      // We'll use the management API to update the secret
      const supabase = createClient(supabaseUrl, serviceKey);

      // Verify the token works by fetching the user profile
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profileText = await profileRes.text();
      let profileName = "Unknown";
      
      if (profileRes.ok) {
        try {
          const profile = JSON.parse(profileText);
          profileName = profile.name || profile.given_name || "LinkedIn User";
          console.log("Verified token for user:", profileName);
        } catch {
          console.log("Profile parsed but name not found");
        }
      } else {
        console.warn("Could not verify profile, but token was issued:", profileText);
      }

      // Return the token to the user in a nice HTML page
      // They can copy it and update the secret
      const expiryDate = new Date(Date.now() + expiresIn * 1000).toLocaleDateString();

      return new Response(
        renderHtml(
          `✅ LinkedIn OAuth Success!\n\nConnected as: ${profileName}\nToken expires: ${expiryDate}\n\nYour access token (copy this):\n\n${accessToken}\n\nNow go back to Lovable and update the LINKEDIN_ACCESS_TOKEN secret with this value.`,
          true
        ),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("linkedin-oauth error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function renderHtml(message: string, success: boolean): string {
  const color = success ? "#10b981" : "#ef4444";
  const tokenMatch = message.match(/Your access token \(copy this\):\n\n(.+?)\n\nNow/s);
  const token = tokenMatch ? tokenMatch[1] : "";
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>LinkedIn OAuth</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }
    .card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid ${color}33; }
    h1 { color: ${color}; font-size: 1.5rem; }
    .token { background: #0f172a; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 0.85rem; margin: 16px 0; user-select: all; border: 1px solid #334155; }
    .copy-btn { background: ${color}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
    .copy-btn:hover { opacity: 0.9; }
    p { line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${success ? "✅ LinkedIn Connected!" : "❌ Error"}</h1>
    <pre style="white-space: pre-wrap;">${message.replace(/<[^>]*>/g, "")}</pre>
    ${token ? `<div class="token" id="token">${token}</div>
    <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('token').textContent).then(() => this.textContent = 'Copied!')">Copy Token</button>` : ""}
  </div>
</body>
</html>`;
}
