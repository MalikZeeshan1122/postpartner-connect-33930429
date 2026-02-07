import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Lightbulb, Loader2, Zap, Clock, TrendingUp, Megaphone } from "lucide-react";

interface Suggestion {
  title: string;
  intent: string;
  platform: string;
  category: string;
  urgency: string;
  reasoning: string;
}

interface ContentSuggestionsProps {
  brand: any;
  existingIntents?: string[];
  onUseSuggestion?: (intent: string, platform: string) => void;
}

const categoryIcons: Record<string, typeof Zap> = {
  trending: TrendingUp,
  evergreen: Clock,
  engagement: Zap,
  promotion: Megaphone,
};

const urgencyColors: Record<string, string> = {
  now: "bg-destructive/10 text-destructive",
  this_week: "bg-amber-500/10 text-amber-600",
  this_month: "bg-primary/10 text-primary",
  anytime: "bg-muted text-muted-foreground",
};

export default function ContentSuggestions({ brand, existingIntents, onUseSuggestion }: ContentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    if (!brand) {
      toast({ title: "Select a brand first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-content", {
        body: {
          brandName: brand.name,
          brandVoice: brand.brand_voice,
          contentThemes: brand.brand_voice?.contentThemes || [],
          existingPostIntents: existingIntents || [],
        },
      });
      if (error) throw error;
      setSuggestions(data?.suggestions || []);
    } catch (e: any) {
      toast({ title: e.message || "Failed to get suggestions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            AI Content Suggestions
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchSuggestions} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
            {suggestions.length ? "Refresh" : "Get Ideas"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Get Ideas" to receive AI-powered post suggestions based on your brand and current trends
          </p>
        )}
        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing trends and brand strategy...
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const CatIcon = categoryIcons[s.category] || Zap;
              return (
                <div
                  key={i}
                  className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <CatIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold">{s.title}</h4>
                      <Badge variant="outline" className="text-[10px]">{s.platform}</Badge>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${urgencyColors[s.urgency] || ""}`}>
                        {s.urgency.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.reasoning}</p>
                  </div>
                  {onUseSuggestion && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onUseSuggestion(s.intent, s.platform)}
                    >
                      Use
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
