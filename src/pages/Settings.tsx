import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import SocialConnectDialog from "@/components/SocialConnectDialog";
import { socialIcons } from "@/components/icons/SocialIcons";
import {
  Briefcase,
  Building2,
  Megaphone,
  Users,
  Heart,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  CheckCircle2,
  Link2,
  X,
  Save,
} from "lucide-react";

const ROLES = [
  { value: "founder", label: "Founder / CEO", icon: Briefcase },
  { value: "marketer", label: "Marketer", icon: Megaphone },
  { value: "agency", label: "Agency", icon: Building2 },
  { value: "creator", label: "Creator", icon: Heart },
  { value: "smm", label: "Social Media Manager", icon: Users },
];

const GOALS = [
  { value: "grow_audience", label: "Grow Audience", icon: TrendingUp },
  { value: "drive_sales", label: "Drive Sales", icon: Target },
  { value: "save_time", label: "Save Time", icon: Zap },
  { value: "brand_awareness", label: "Brand Awareness", icon: Sparkles },
];

const SOCIALS = [
  { platform: "instagram", label: "Instagram Business or Creator", color: "from-pink-500 to-purple-600", placeholder: "@yourbrand", helpUrl: "https://help.instagram.com/502981923235522", helpText: "Connect your Instagram Business or Creator account." },
  { platform: "facebook", label: "Facebook Page", color: "from-blue-600 to-blue-700", placeholder: "@yourpage", helpUrl: "https://www.facebook.com/business/help", helpText: "Link your Facebook Page." },
  { platform: "twitter", label: "Twitter / X Profile", color: "from-zinc-700 to-zinc-900", placeholder: "@yourhandle", helpUrl: "https://help.twitter.com/en/using-x", helpText: "Connect your X account." },
  { platform: "linkedin", label: "LinkedIn Profile or Page", color: "from-blue-500 to-blue-700", placeholder: "@yourname", helpUrl: "https://www.linkedin.com/help/linkedin", helpText: "Link your LinkedIn profile or page." },
  { platform: "tiktok", label: "TikTok Profile", color: "from-zinc-800 to-zinc-900", placeholder: "@yourhandle", helpUrl: "https://www.tiktok.com/creators/creator-portal", helpText: "Connect your TikTok account." },
  { platform: "youtube", label: "YouTube Channel", color: "from-red-500 to-red-700", placeholder: "@yourchannel", helpUrl: "https://support.google.com/youtube/answer/1646861", helpText: "Link your YouTube channel." },
  { platform: "pinterest", label: "Pinterest Profile", color: "from-red-600 to-red-700", placeholder: "@yourprofile", helpUrl: "https://help.pinterest.com/en/business", helpText: "Connect your Pinterest account." },
  { platform: "threads", label: "Threads Profile", color: "from-zinc-600 to-zinc-800", placeholder: "@yourhandle", helpUrl: "https://help.instagram.com/788669719351498", helpText: "Link your Threads profile." },
];

interface ConnectedAccount {
  platform: string;
  account_name: string;
}

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, upsertProfile } = useProfile();
  const navigate = useNavigate();

  const [role, setRole] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SOCIALS[0] | null>(null);

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      setGoal(profile.goal);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("social_connections")
      .select("platform, account_name")
      .eq("user_id", user.id)
      .eq("connected", true)
      .then(({ data }) => {
        if (data) setConnectedAccounts(data.map((d) => ({ platform: d.platform, account_name: d.account_name ?? "" })));
      });
  }, [user]);

  if (authLoading || profileLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) { navigate("/auth"); return null; }

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = (await upsertProfile({ role, goal })) ?? {};
    setSaving(false);
    setDirty(false);
    if (error) toast({ title: "Could not save", variant: "destructive" });
    else toast({ title: "Settings saved!" });
  };

  const handleConnect = async (platform: string, accountName: string) => {
    await supabase.from("social_connections").upsert(
      { user_id: user.id, platform, account_name: accountName, connected: true, connected_at: new Date().toISOString() },
      { onConflict: "user_id,platform" }
    );
    setConnectedAccounts((prev) => [...prev.filter((a) => a.platform !== platform), { platform, account_name: accountName }]);
  };

  const handleDisconnect = async (platform: string) => {
    await supabase.from("social_connections").delete().eq("user_id", user.id).eq("platform", platform);
    setConnectedAccounts((prev) => prev.filter((a) => a.platform !== platform));
    toast({ title: `Disconnected ${platform}` });
  };

  const getConnected = (platform: string) => connectedAccounts.find((a) => a.platform === platform);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Role</CardTitle>
            <CardDescription>What best describes you?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                size="sm"
                variant={role === value ? "default" : "outline"}
                className={role === value ? "gradient-primary" : ""}
                onClick={() => { setRole(value); setDirty(true); }}
              >
                <Icon className="h-4 w-4 mr-1" /> {label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Goal</CardTitle>
            <CardDescription>What are you trying to achieve?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {GOALS.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                size="sm"
                variant={goal === value ? "default" : "outline"}
                className={goal === value ? "gradient-primary" : ""}
                onClick={() => { setGoal(value); setDirty(true); }}
              >
                <Icon className="h-4 w-4 mr-1" /> {label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {dirty && (
          <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary">
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}

        {/* Connected Socials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Accounts</CardTitle>
            <CardDescription>Manage your linked social media profiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SOCIALS.map((social) => {
              const connected = getConnected(social.platform);
              const SocialIcon = socialIcons[social.platform];
              return (
                <div key={social.platform} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${social.color}`}>
                    {SocialIcon ? <SocialIcon className="h-4 w-4 text-white" /> : <span className="text-xs font-bold text-white">{social.platform[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{social.label}</p>
                    {connected ? (
                      <p className="text-xs text-primary">@{connected.account_name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not connected</p>
                    )}
                  </div>
                  {connected ? (
                    <Button size="sm" variant="ghost" onClick={() => handleDisconnect(social.platform)} className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4 mr-1" /> Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedPlatform(social); setConnectDialogOpen(true); }}>
                      <Link2 className="h-3.5 w-3.5 mr-1" /> Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>

      <SocialConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        platform={selectedPlatform}
        onConnect={handleConnect}
      />
    </AppLayout>
  );
}
