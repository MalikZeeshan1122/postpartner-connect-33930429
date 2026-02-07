import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Palette, Globe, FileText } from "lucide-react";

const Brands = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [samplePosts, setSamplePosts] = useState("");
  const [guidelines, setGuidelines] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchBrands();
  }, [user]);

  const fetchBrands = async () => {
    const { data } = await supabase.from("brands").select("*").order("created_at", { ascending: false });
    setBrands(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Brand name is required", variant: "destructive" });
      return;
    }
    setAnalyzing(true);

    try {
      // Call AI to analyze brand
      const { data: analysis, error: fnError } = await supabase.functions.invoke("analyze-brand", {
        body: {
          websiteUrl,
          samplePosts: samplePosts ? samplePosts.split("\n---\n") : [],
          guidelines,
        },
      });

      if (fnError) throw fnError;

      const { error: insertError } = await supabase.from("brands").insert({
        user_id: user!.id,
        name,
        website_url: websiteUrl || null,
        brand_voice: analysis?.brandVoice || {},
        visual_identity: analysis?.visualIdentity || {},
        sample_posts: samplePosts ? samplePosts.split("\n---\n") : [],
        guidelines: guidelines || null,
      });

      if (insertError) throw insertError;

      toast({ title: "Brand created with AI analysis!" });
      setDialogOpen(false);
      setName("");
      setWebsiteUrl("");
      setSamplePosts("");
      setGuidelines("");
      fetchBrands();
    } catch (e: any) {
      toast({ title: e.message || "Failed to create brand", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading || loading) return <AppLayout><div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Brand Profiles</h1>
            <p className="text-muted-foreground">AI analyzes your brand voice and visual identity</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="h-4 w-4" /> New Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Brand Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Brand Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hack-Nation" />
                </div>
                <div>
                  <label className="text-sm font-medium">Website URL</label>
                  <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Sample Posts</label>
                  <Textarea
                    value={samplePosts}
                    onChange={(e) => setSamplePosts(e.target.value)}
                    placeholder="Paste existing posts separated by ---"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Brand Guidelines</label>
                  <Textarea
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    placeholder="Describe your brand tone, colors, values..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreate} disabled={analyzing} className="w-full gradient-primary">
                  {analyzing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing with AI...</>
                  ) : (
                    "Create & Analyze"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {brands.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Palette className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No brands yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first brand profile to get started</p>
              <Button onClick={() => setDialogOpen(true)} className="gradient-primary gap-2">
                <Plus className="h-4 w-4" /> Create Brand
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {brands.map((brand) => (
              <Card key={brand.id} className="transition-all hover:shadow-glow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{brand.name}</CardTitle>
                      {brand.website_url && (
                        <CardDescription className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {brand.website_url}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {brand.brand_voice?.tone && (
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {brand.brand_voice.tone}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {brand.brand_voice.formality}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Emoji: {brand.brand_voice.emojiUsage}
                      </span>
                    </div>
                  )}
                  {brand.visual_identity?.primaryColors?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Colors:</span>
                      {brand.visual_identity.primaryColors.map((c: string, i: number) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full border"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Brands;
