import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Link2,
  X,
  Save,
  Camera,
  Bell,
  Mail,
  CalendarClock,
  BarChart3,
  Loader2,
  User as UserIcon,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SOCIALS[0] | null>(null);

  // Notifications
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(true);
  const [notifyPostReminders, setNotifyPostReminders] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      setGoal(profile.goal);
      setAvatarUrl(profile.avatar_url);
      setNotifyEmailDigest(profile.notify_email_digest);
      setNotifyPostReminders(profile.notify_post_reminders);
      setNotifyWeeklyReport(profile.notify_weekly_report);
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
    const { error } = (await upsertProfile({
      role,
      goal,
      notify_email_digest: notifyEmailDigest,
      notify_post_reminders: notifyPostReminders,
      notify_weekly_report: notifyWeeklyReport,
    })) ?? {};
    setSaving(false);
    setDirty(false);
    if (error) toast({ title: "Could not save", variant: "destructive" });
    else toast({ title: "Settings saved!" });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await upsertProfile({ avatar_url: publicUrl });
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    toast({ title: "Profile photo updated!" });
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

  const handleToggleNotification = (setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    setDirty(true);
  };

  const getConnected = (platform: string) => connectedAccounts.find((a) => a.platform === platform);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            <div className="relative group">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading..." : "Change Photo"}
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>Choose what updates you'd like to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Email Digests</Label>
                  <p className="text-xs text-muted-foreground">Daily summary of your content performance</p>
                </div>
              </div>
              <Switch
                checked={notifyEmailDigest}
                onCheckedChange={(v) => handleToggleNotification(setNotifyEmailDigest, v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Post Reminders</Label>
                  <p className="text-xs text-muted-foreground">Get reminded when scheduled posts are due</p>
                </div>
              </div>
              <Switch
                checked={notifyPostReminders}
                onCheckedChange={(v) => handleToggleNotification(setNotifyPostReminders, v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Weekly Report</Label>
                  <p className="text-xs text-muted-foreground">Weekly analytics summary across all platforms</p>
                </div>
              </div>
              <Switch
                checked={notifyWeeklyReport}
                onCheckedChange={(v) => handleToggleNotification(setNotifyWeeklyReport, v)}
              />
            </div>
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
