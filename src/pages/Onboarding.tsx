import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import SocialConnectDialog from "@/components/SocialConnectDialog";
import { socialIcons } from "@/components/icons/SocialIcons";
import {
  Sparkles,
  Briefcase,
  Building2,
  Megaphone,
  Users,
  TrendingUp,
  Target,
  Zap,
  Heart,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Link2,
  X,
  Shield,
  Lock,
} from "lucide-react";

const ROLES = [
  { value: "founder", label: "Founder / CEO", icon: Briefcase, desc: "Running my own business" },
  { value: "marketer", label: "Marketer", icon: Megaphone, desc: "Managing brand presence" },
  { value: "agency", label: "Agency", icon: Building2, desc: "Managing multiple brands" },
  { value: "creator", label: "Creator", icon: Heart, desc: "Building a personal brand" },
  { value: "smm", label: "Social Media Manager", icon: Users, desc: "Handling social accounts" },
];

const GOALS = [
  { value: "grow_audience", label: "Grow Audience", icon: TrendingUp, desc: "Increase followers & reach" },
  { value: "drive_sales", label: "Drive Sales", icon: Target, desc: "Convert followers to customers" },
  { value: "save_time", label: "Save Time", icon: Zap, desc: "Automate content creation" },
  { value: "brand_awareness", label: "Brand Awareness", icon: Sparkles, desc: "Build recognition & trust" },
];

const SOCIALS = [
  {
    platform: "instagram",
    label: "Instagram Business or Creator Profile",
    color: "from-pink-500 to-purple-600",
    placeholder: "@yourbrand or instagram.com/yourbrand",
    helpUrl: "https://help.instagram.com/502981923235522",
    helpText: "Connect your Instagram Business or Creator account to schedule posts and stories directly.",
  },
  {
    platform: "facebook",
    label: "Facebook Page",
    color: "from-blue-600 to-blue-700",
    placeholder: "@yourpage or facebook.com/yourpage",
    helpUrl: "https://www.facebook.com/business/help",
    helpText: "Link your Facebook Page to publish and schedule content. Personal profiles are not supported.",
  },
  {
    platform: "twitter",
    label: "Twitter Profile",
    color: "from-zinc-700 to-zinc-900",
    placeholder: "@yourhandle",
    helpUrl: "https://help.twitter.com/en/using-x",
    helpText: "Connect your X account to compose and schedule tweets with AI-generated content.",
  },
  {
    platform: "linkedin",
    label: "LinkedIn Personal Profile",
    color: "from-blue-500 to-blue-700",
    placeholder: "@yourname or linkedin.com/in/yourname",
    helpUrl: "https://www.linkedin.com/help/linkedin",
    helpText: "Link your LinkedIn personal profile to publish professional content.",
  },
  {
    platform: "linkedin_page",
    label: "LinkedIn Page",
    color: "from-blue-500 to-blue-700",
    placeholder: "linkedin.com/company/yourcompany",
    helpUrl: "https://www.linkedin.com/help/linkedin",
    helpText: "Link your LinkedIn company page to publish content on behalf of your organization.",
  },
  {
    platform: "google_business",
    label: "Google My Business",
    color: "from-green-500 to-blue-500",
    placeholder: "Your business name",
    helpUrl: "https://support.google.com/business",
    helpText: "Connect your Google Business Profile to manage posts and updates for local search.",
  },
  {
    platform: "pinterest",
    label: "Pinterest Profile",
    color: "from-red-600 to-red-700",
    placeholder: "@yourprofile or pinterest.com/yourprofile",
    helpUrl: "https://help.pinterest.com/en/business",
    helpText: "Connect your Pinterest business account to schedule pins and idea pins.",
  },
  {
    platform: "tiktok",
    label: "TikTok Profile",
    color: "from-zinc-800 to-zinc-900",
    placeholder: "@yourhandle",
    helpUrl: "https://www.tiktok.com/creators/creator-portal",
    helpText: "Connect your TikTok account to plan and schedule short-form video content.",
  },
  {
    platform: "youtube",
    label: "YouTube Channel",
    color: "from-red-500 to-red-700",
    placeholder: "@yourchannel or youtube.com/@yourchannel",
    helpUrl: "https://support.google.com/youtube/answer/1646861",
    helpText: "Link your YouTube channel to plan video content and community posts.",
  },
  {
    platform: "threads",
    label: "Threads Profile",
    color: "from-zinc-600 to-zinc-800",
    placeholder: "@yourhandle",
    helpUrl: "https://help.instagram.com/788669719351498",
    helpText: "Link your Threads profile to create and plan text-based social content.",
  },
  {
    platform: "bluesky",
    label: "BlueSky Profile",
    color: "from-sky-400 to-sky-600",
    placeholder: "@yourhandle.bsky.social",
    helpUrl: "https://bsky.social",
    helpText: "Connect your BlueSky account to publish and schedule posts on the decentralized network.",
  },
];

const STEPS = ["Role", "Goal", "Socials"];

interface ConnectedAccount {
  platform: string;
  account_name: string;
}

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { upsertProfile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof SOCIALS[0] | null>(null);

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

  if (authLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const openConnect = (social: typeof SOCIALS[0]) => {
    setSelectedPlatform(social);
    setConnectDialogOpen(true);
  };

  const handleConnect = async (platform: string, accountName: string) => {
    await supabase.from("social_connections").upsert(
      { user_id: user.id, platform, account_name: accountName, connected: true, connected_at: new Date().toISOString() },
      { onConflict: "user_id,platform" }
    );
    setConnectedAccounts((prev) => {
      const filtered = prev.filter((a) => a.platform !== platform);
      return [...filtered, { platform, account_name: accountName }];
    });
  };

  const handleDisconnect = async (platform: string) => {
    await supabase.from("social_connections").delete().eq("user_id", user.id).eq("platform", platform);
    setConnectedAccounts((prev) => prev.filter((a) => a.platform !== platform));
  };

  const handleFinish = async () => {
    setSaving(true);
    const { error } = (await upsertProfile({ role, goal, onboarding_completed: true })) ?? {};
    setSaving(false);
    if (error) {
      toast({ title: "Could not save profile", variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const canAdvance = step === 0 ? !!role : step === 1 ? !!goal : true;
  const getConnected = (platform: string) => connectedAccounts.find((a) => a.platform === platform);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="border-b bg-card px-6 py-4">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6">
          {/* Step 0: Role */}
          {step === 0 && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">What best describes you?</h1>
                <p className="text-muted-foreground">This helps us tailor PostPartner to your workflow.</p>
              </div>
              <div className="grid gap-3">
                {ROLES.map(({ value, label, icon: Icon, desc }) => (
                  <Card
                    key={value}
                    onClick={() => setRole(value)}
                    className={`cursor-pointer transition-all hover:shadow-glow ${
                      role === value ? "ring-2 ring-primary shadow-glow" : "hover:-translate-y-0.5"
                    }`}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${role === value ? "gradient-primary" : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${role === value ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      {role === value && <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Step 1: Goal */}
          {step === 1 && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">What's your main goal?</h1>
                <p className="text-muted-foreground">We'll prioritize features that help you achieve this.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOALS.map(({ value, label, icon: Icon, desc }) => (
                  <Card
                    key={value}
                    onClick={() => setGoal(value)}
                    className={`cursor-pointer transition-all hover:shadow-glow ${
                      goal === value ? "ring-2 ring-primary shadow-glow" : "hover:-translate-y-0.5"
                    }`}
                  >
                    <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${goal === value ? "gradient-primary" : "bg-muted"}`}>
                        <Icon className={`h-6 w-6 ${goal === value ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Socials */}
          {step === 2 && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Connect your social accounts</h1>
                <p className="text-muted-foreground">
                  Connect at least 1 social account to get started.
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                To get started, click on a social account below and follow the prompts.{" "}
                <a href="https://support.google.com/business" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Learn more</a>
              </p>

              <div className="grid gap-2">
                {SOCIALS.map((social) => {
                  const connected = getConnected(social.platform);
                  return (
                    <div
                      key={social.platform}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                        connected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      onClick={() => !connected && openConnect(social)}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${social.color}`}
                      >
                        {socialIcons[social.platform]
                          ? socialIcons[social.platform]({ className: "h-4 w-4 text-white" })
                          : <span className="text-xs font-bold text-white">{social.label[0]}</span>
                        }
                      </div>
                      <span className="flex-1 text-sm font-medium truncate">
                        {social.label}
                        {connected && (
                          <span className="ml-2 text-xs text-primary">@{connected.account_name}</span>
                        )}
                      </span>
                      {connected ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDisconnect(social.platform); }}
                          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Disconnect"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> We never collect or store your social media passwords</span>
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Officially approved by social networks</span>
                <span className="flex items-center gap-1"><X className="h-3.5 w-3.5" /> Revoke access anytime</span>
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Minimum permissions only</span>
              </div>

              {/* Testimonial */}
              <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-2">
                <p className="text-sm italic text-muted-foreground">
                  "I've been using PostPartner for years now and it's hands down the best social media tool out there."
                </p>
                <p className="text-xs font-medium text-foreground">Ash — Founder & Social Media Manager</p>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canAdvance} className="gradient-primary">
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving} className="gradient-primary">
                {saving ? "Saving..." : "Get Started"} <Sparkles className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <SocialConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        platform={selectedPlatform}
        onConnect={handleConnect}
      />
    </div>
  );
}
