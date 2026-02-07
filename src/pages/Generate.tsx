import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Check, RefreshCw, Linkedin, Instagram, MessageSquare, ImageIcon, Eye } from "lucide-react";
import PostPreview from "@/components/PostPreview";
import ContentSuggestions from "@/components/ContentSuggestions";
import LinkedInMockup, { InstagramMockup } from "@/components/PlatformMockups";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Generate = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("itemId");
  const urlIntent = searchParams.get("intent");
  const urlPlatform = searchParams.get("platform");

  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [intent, setIntent] = useState(urlIntent || "");
  const [platform, setPlatform] = useState(urlPlatform || "both");
  const [tone, setTone] = useState("");
  const [cta, setCta] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [editFeedback, setEditFeedback] = useState("");
  const [iterating, setIterating] = useState(false);
  const [previewVariation, setPreviewVariation] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchBrands();
  }, [user]);

  useEffect(() => {
    if (itemId && user) loadPlanItem(itemId);
  }, [itemId, user]);

  const fetchBrands = async () => {
    const { data } = await supabase.from("brands").select("*");
    setBrands(data || []);
    if (data?.length === 1) setSelectedBrand(data[0]);
  };

  const loadPlanItem = async (id: string) => {
    const { data } = await supabase.from("plan_items").select("*, content_plans(brand_id)").eq("id", id).single();
    if (data) {
      setIntent(data.intent);
      setPlatform(data.platform);
      setTone(data.tone || "");
      setCta(data.cta || "");
      setExtraContext(data.extra_context || "");
      // Load brand
      const { data: brand } = await supabase.from("brands").select("*").eq("id", data.content_plans?.brand_id).single();
      if (brand) setSelectedBrand(brand);
    }
  };

  const handleGenerate = async () => {
    if (!intent.trim()) {
      toast({ title: "Please enter a post intent", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setVariations([]);
    setFeedback([]);
    setSelectedVariation(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: {
          intent,
          platform,
          tone,
          cta,
          extraContext,
          brandVoice: selectedBrand?.brand_voice,
          visualIdentity: selectedBrand?.visual_identity,
          variationCount: 3,
        },
      });

      if (error) throw error;
      setVariations(data.variations || []);
      setFeedback(data.feedback || []);
      toast({ title: `Generated ${data.variations?.length || 0} variations with AI feedback!` });
    } catch (e: any) {
      toast({ title: e.message || "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImage = async (index: number) => {
    const v = variations[index];
    if (!v?.imagePrompt) return;

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: v.imagePrompt,
          textOverlay: v.textOverlay,
          brandColors: selectedBrand?.visual_identity?.primaryColors || [],
        },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setVariations((prev) =>
          prev.map((item, i) => (i === index ? { ...item, imageUrl: data.imageUrl } : item))
        );
        toast({ title: "Image generated!" });
      }
    } catch (e: any) {
      toast({ title: e.message || "Image generation failed", variant: "destructive" });
    }
  };

  const handleGenerateAllImages = async () => {
    for (let i = 0; i < variations.length; i++) {
      if (!variations[i].imageUrl) {
        await handleGenerateImage(i);
      }
    }
  };

  const handleIterate = async () => {
    if (selectedVariation === null || !editFeedback.trim()) {
      toast({ title: "Select a variation and provide feedback", variant: "destructive" });
      return;
    }
    setIterating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: {
          intent,
          platform,
          tone,
          cta,
          extraContext,
          brandVoice: selectedBrand?.brand_voice,
          visualIdentity: selectedBrand?.visual_identity,
          variationCount: 2,
          existingCaption: variations[selectedVariation]?.caption,
          userFeedback: editFeedback,
        },
      });

      if (error) throw error;
      setVariations((prev) => [...prev, ...(data.variations || [])]);
      setFeedback((prev) => [...prev, ...(data.feedback || [])]);
      setEditFeedback("");
      toast({ title: "New iterations generated!" });
    } catch (e: any) {
      toast({ title: e.message || "Iteration failed", variant: "destructive" });
    } finally {
      setIterating(false);
    }
  };

  const handleSaveVariation = async (variation: any, index: number) => {
    if (!itemId) {
      toast({ title: "Variation approved! (Save to plan by generating from the planner)" });
      return;
    }

    try {
      await supabase.from("post_variations").insert({
        plan_item_id: itemId,
        user_id: user!.id,
        platform: variation.platform,
        caption: variation.caption,
        image_prompt: variation.imagePrompt,
        image_url: variation.imageUrl || null,
        text_overlay: variation.textOverlay,
        feedback_score: feedback[index]?.score || null,
        feedback_notes: feedback[index] ? [feedback[index]] : [],
        is_selected: true,
      });

      await supabase.from("plan_items").update({ status: "approved" }).eq("id", itemId);
      toast({ title: "Post approved and saved!" });
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  if (authLoading) return <AppLayout><div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Generate Posts</h1>
          <p className="text-muted-foreground">AI creates multiple on-brand variations with self-feedback</p>
        </div>

        {/* Input form */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Brand</label>
                <Select
                  value={selectedBrand?.id || ""}
                  onValueChange={(v) => setSelectedBrand(brands.find((b) => b.id === v))}
                >
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Post Intent *</label>
              <Textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder='e.g. "Announce our hackathon with a Super Bowl theme — prizes, speakers, and registration CTA"'
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Tone (e.g. exciting)" />
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="CTA (e.g. Register now)" />
              <Input value={extraContext} onChange={(e) => setExtraContext(e.target.value)} placeholder="Extra context" />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gradient-primary gap-2"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating & reviewing...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Variations</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Content Suggestions */}
        <ContentSuggestions
          brand={selectedBrand}
          onUseSuggestion={(suggestedIntent, suggestedPlatform) => {
            setIntent(suggestedIntent);
            setPlatform(suggestedPlatform);
            toast({ title: "Suggestion applied! Click Generate to create posts." });
          }}
        />

        {/* Variations */}
        {variations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generated Variations ({variations.length})</h2>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handleGenerateAllImages}
              >
                <ImageIcon className="h-4 w-4" /> Generate All Images
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {variations.map((v, i) => (
                <PostPreview
                  key={i}
                  variation={v}
                  index={i}
                  isSelected={selectedVariation === i}
                  feedbackItem={feedback[i]}
                  onSelect={() => setSelectedVariation(i)}
                  onApprove={() => handleSaveVariation(v, i)}
                  onGenerateImage={handleGenerateImage}
                  onPreview={() => setPreviewVariation(v)}
                />
              ))}
            </div>

            {/* Iterate */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" /> Iterate on Selected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedVariation !== null
                    ? `Selected: Variation ${selectedVariation + 1}. Provide feedback to improve it.`
                    : "Click a variation to select it, then provide feedback."}
                </p>
                <Textarea
                  value={editFeedback}
                  onChange={(e) => setEditFeedback(e.target.value)}
                  placeholder='e.g. "Make it more casual, add a sports metaphor, shorter CTA"'
                  rows={2}
                />
                <Button
                  onClick={handleIterate}
                  disabled={iterating || selectedVariation === null}
                  variant="outline"
                  className="gap-2"
                >
                  {iterating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Iterating...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4" /> Generate Improved Versions</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Platform Preview Dialog */}
        <Dialog open={!!previewVariation} onOpenChange={(open) => !open && setPreviewVariation(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Platform Preview</DialogTitle>
            </DialogHeader>
            {previewVariation && (
              <Tabs defaultValue={previewVariation.platform === "instagram" ? "instagram" : "linkedin"}>
                <TabsList className="mb-4">
                  <TabsTrigger value="linkedin" className="gap-1">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </TabsTrigger>
                  <TabsTrigger value="instagram" className="gap-1">
                    <Instagram className="h-3 w-3" /> Instagram
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="linkedin">
                  <LinkedInMockup
                    caption={previewVariation.caption}
                    textOverlay={previewVariation.textOverlay}
                    imageUrl={previewVariation.imageUrl}
                    brandName={selectedBrand?.name}
                  />
                </TabsContent>
                <TabsContent value="instagram">
                  <InstagramMockup
                    caption={previewVariation.caption}
                    textOverlay={previewVariation.textOverlay}
                    imageUrl={previewVariation.imageUrl}
                    brandName={selectedBrand?.name}
                  />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Generate;
