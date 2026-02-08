import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Lightbulb,
  Loader2,
  Zap,
  Clock,
  TrendingUp,
  Megaphone,
  PenTool,
  Plus,
  RefreshCw,
} from "lucide-react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStats from "@/components/dashboard/DashboardStats";
import QuickActions from "@/components/dashboard/QuickActions";
import ConnectedAccounts from "@/components/dashboard/ConnectedAccounts";

interface Suggestion {
  title: string;
  intent: string;
  platform: string;
  category: string;
  urgency: string;
  reasoning: string;
}

const categoryIcons: Record<string, typeof Zap> = {
  trending: TrendingUp,
  evergreen: Clock,
  engagement: Zap,
  promotion: Megaphone,
};

const categoryLabels: Record<string, string> = {
  trending: "Trending",
  evergreen: "Evergreen",
  engagement: "Engagement",
  promotion: "Promotion",
};

const urgencyColors: Record<string, string> = {
  now: "bg-destructive/10 text-destructive border-destructive/20",
  this_week: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  this_month: "bg-primary/10 text-primary border-primary/20",
  anytime: "bg-muted text-muted-foreground border-border",
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [stats, setStats] = useState({
    totalPosts: 0,
    approvedPosts: 0,
    scheduledThisWeek: 0,
    brands: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchBrands();
      fetchStats();
    }
  }, [user, loading]);

  const fetchBrands = async () => {
    const { data } = await supabase.from("brands").select("*");
    setBrands(data || []);
    if (data?.length) setSelectedBrand(data[0]);
  };

  const fetchStats = async () => {
    const [planItems, approved, brands] = await Promise.all([
      supabase.from("plan_items").select("id", { count: "exact", head: true }),
      supabase.from("plan_items").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("brands").select("id", { count: "exact", head: true }),
    ]);

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const { count: weekCount } = await supabase
      .from("plan_items")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_date", now.toISOString().split("T")[0])
      .lte("scheduled_date", weekEnd.toISOString().split("T")[0]);

    setStats({
      totalPosts: planItems.count || 0,
      approvedPosts: approved.count || 0,
      scheduledThisWeek: weekCount || 0,
      brands: brands.count || 0,
    });
  };

  const fetchSuggestions = async () => {
    if (!selectedBrand) {
      toast({ title: "Select a brand first", variant: "destructive" });
      return;
    }
    setLoadingSuggestions(true);
    try {
      const { data: existingItems } = await supabase
        .from("plan_items")
        .select("intent")
        .limit(20);

      const { data, error } = await supabase.functions.invoke("suggest-content", {
        body: {
          brandName: selectedBrand.name,
          brandVoice: selectedBrand.brand_voice,
          contentThemes: selectedBrand.brand_voice?.contentThemes || [],
          existingPostIntents: existingItems?.map((i) => i.intent) || [],
        },
      });
      if (error) throw error;
      setSuggestions(data?.suggestions || []);
    } catch (e: any) {
      toast({ title: e.message || "Failed to get suggestions", variant: "destructive" });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleUseSuggestion = (suggestion: Suggestion) => {
    navigate(`/generate?intent=${encodeURIComponent(suggestion.intent)}&platform=${suggestion.platform}`);
  };

  const handleAddToPlan = async (suggestion: Suggestion) => {
    const { data: plans } = await supabase
      .from("content_plans")
      .select("id")
      .limit(1);

    if (!plans?.length) {
      toast({ title: "Create a content plan in the Calendar first", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("plan_items").insert({
      plan_id: plans[0].id,
      user_id: user!.id,
      intent: suggestion.intent,
      platform: suggestion.platform,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Added to your content plan!" });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <DashboardHero />
        <DashboardStats stats={stats} />
        <QuickActions />
        <ConnectedAccounts />

        {/* AI Content Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                  </motion.div>
                  AI Content Ideas
                </CardTitle>
                <div className="flex items-center gap-2">
                  {brands.length > 1 && (
                    <Select
                      value={selectedBrand?.id || ""}
                      onValueChange={(v) => setSelectedBrand(brands.find((b) => b.id === v))}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue placeholder="Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm"
                    onClick={fetchSuggestions}
                    disabled={loadingSuggestions || !selectedBrand}
                    className="gap-1 gradient-primary text-primary-foreground"
                  >
                    {loadingSuggestions ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : suggestions.length ? (
                      <RefreshCw className="h-3 w-3" />
                    ) : (
                      <Lightbulb className="h-3 w-3" />
                    )}
                    {suggestions.length ? "Refresh" : "Get AI Ideas"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedBrand && brands.length === 0 && (
                <div className="text-center py-10">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10">
                      <Lightbulb className="h-8 w-8 text-primary" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up a brand first to get AI-powered content ideas
                  </p>
                  <Button size="sm" onClick={() => navigate("/brands")} className="gap-1 gradient-primary text-primary-foreground">
                    <Plus className="h-3 w-3" /> Create Brand
                  </Button>
                </div>
              )}

              {selectedBrand && suggestions.length === 0 && !loadingSuggestions && (
                <div className="text-center py-10">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-4"
                  >
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-500/10">
                      <Lightbulb className="h-8 w-8 text-amber-500" />
                    </div>
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    Click <span className="font-semibold text-foreground">"Get AI Ideas"</span> to receive content suggestions based on your brand and current trends
                  </p>
                </div>
              )}

              {loadingSuggestions && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-8 w-8 text-primary" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">
                    Analyzing trends, brand strategy, and current events...
                  </span>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((s, i) => {
                    const CatIcon = categoryIcons[s.category] || Zap;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="group flex items-start gap-3 rounded-xl border p-3 transition-all hover:bg-muted/50 hover:shadow-glow hover:-translate-y-0.5 duration-200"
                      >
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <CatIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-semibold">{s.title}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {s.platform}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${urgencyColors[s.urgency] || ""}`}
                            >
                              {s.urgency.replace("_", " ")}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {categoryLabels[s.category] || s.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {s.reasoning}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2"
                            onClick={() => handleAddToPlan(s)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Plan
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-7 px-2 gradient-primary text-primary-foreground"
                            onClick={() => handleUseSuggestion(s)}
                          >
                            <PenTool className="h-3 w-3 mr-1" /> Generate
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
