import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
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
  { platform: "instagram", label: "Instagram Business or Creator", color: "from-pink-500 to-purple-600" },
  { platform: "facebook", label: "Facebook Page", color: "from-blue-600 to-blue-700" },
  { platform: "twitter", label: "Twitter / X Profile", color: "from-zinc-700 to-zinc-900" },
  { platform: "linkedin", label: "LinkedIn Profile", color: "from-blue-500 to-blue-700" },
  { platform: "tiktok", label: "TikTok Profile", color: "from-zinc-800 to-zinc-900" },
  { platform: "youtube", label: "YouTube Channel", color: "from-red-500 to-red-700" },
  { platform: "pinterest", label: "Pinterest Profile", color: "from-red-600 to-red-700" },
  { platform: "threads", label: "Threads Profile", color: "from-zinc-600 to-zinc-800" },
];

const STEPS = ["Role", "Goal", "Socials"];

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const { upsertProfile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [connectedSocials, setConnectedSocials] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const toggleSocial = async (platform: string) => {
    const next = new Set(connectedSocials);
    if (next.has(platform)) {
      next.delete(platform);
      await supabase.from("social_connections").delete().eq("user_id", user.id).eq("platform", platform);
    } else {
      next.add(platform);
      await supabase.from("social_connections").insert({ user_id: user.id, platform, connected: true, connected_at: new Date().toISOString() });
    }
    setConnectedSocials(next);
  };

  const handleFinish = async () => {
    setSaving(true);
    const { error } = await upsertProfile({ role, goal, onboarding_completed: true }) ?? {};
    setSaving(false);
    if (error) {
      toast({ title: "Could not save profile", variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const canAdvance = step === 0 ? !!role : step === 1 ? !!goal : true;

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
                <h1 className="text-2xl font-bold">Connect your socials</h1>
                <p className="text-muted-foreground">Select the platforms you want to create content for.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOCIALS.map(({ platform, label, color }) => {
                  const connected = connectedSocials.has(platform);
                  return (
                    <Card
                      key={platform}
                      onClick={() => toggleSocial(platform)}
                      className={`cursor-pointer transition-all ${
                        connected ? "ring-2 ring-primary shadow-glow" : "hover:-translate-y-0.5 hover:shadow-glow"
                      }`}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color}`}>
                          <span className="text-sm font-bold text-white">{platform[0].toUpperCase()}</span>
                        </div>
                        <p className="text-sm font-medium flex-1">{label}</p>
                        {connected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                You can always add more platforms later from settings.
              </p>
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
    </div>
  );
}
