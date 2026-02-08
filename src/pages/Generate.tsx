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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, RefreshCw, MessageSquare, ImageIcon, Video, Download, Send } from "lucide-react";
import PostPreview from "@/components/PostPreview";
import CarouselPreview from "@/components/CarouselPreview";
import StoryPreview from "@/components/StoryPreview";
import VideoPreview from "@/components/VideoPreview";
import ContentSuggestions from "@/components/ContentSuggestions";
import LinkedInMockup, { InstagramMockup } from "@/components/PlatformMockups";
import ScheduleDialog from "@/components/ScheduleDialog";
import BulkScheduleDialog from "@/components/BulkScheduleDialog";
import ExportPostButton from "@/components/ExportPostButton";
import { useSharePost } from "@/hooks/useSharePost";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Linkedin, Instagram, Check, Eye, CalendarDays, Share2 } from "lucide-react";

const FORMAT_OPTIONS = [
  { id: "single", label: "Single Post" },
  { id: "carousel", label: "Carousel" },
  { id: "story", label: "Story" },
] as const;

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
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["single"]);
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<any[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("pp_variations") || "[]"); } catch { return []; }
  });
  const [feedback, setFeedback] = useState<any[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("pp_feedback") || "[]"); } catch { return []; }
  });
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [editFeedback, setEditFeedback] = useState("");
  const [iterating, setIterating] = useState(false);
  const [previewVariation, setPreviewVariation] = useState<any>(null);
  const [scheduleVariation, setScheduleVariation] = useState<any>(null);
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false);
  const { sharePost, sharing } = useSharePost();
  const [publishingIndex, setPublishingIndex] = useState<number | null>(null);

  // Persist variations & feedback to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("pp_variations", JSON.stringify(variations));
  }, [variations]);
  useEffect(() => {
    sessionStorage.setItem("pp_feedback", JSON.stringify(feedback));
  }, [feedback]);

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
      const { data: brand } = await supabase.from("brands").select("*").eq("id", data.content_plans?.brand_id).single();
      if (brand) setSelectedBrand(brand);
    }
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
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
          intent, platform, tone, cta, extraContext,
          brandVoice: selectedBrand?.brand_voice,
          visualIdentity: selectedBrand?.visual_identity,
          variationCount: 3,
          formats: selectedFormats,
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

  const handleGenerateVideo = async (index: number) => {
    const v = variations[index];
    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          imageUrl: v.imageUrl || undefined,
          prompt: v.imagePrompt,
          brandName: selectedBrand?.name,
        },
      });

      if (error) throw error;
      if (data?.videoUrl) {
        setVariations((prev) =>
          prev.map((item, i) => (i === index ? { ...item, videoUrl: data.videoUrl } : item))
        );
        toast({ title: "Video generated!" });
      }
    } catch (e: any) {
      toast({ title: e.message || "Video generation failed", variant: "destructive" });
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
          intent, platform, tone, cta, extraContext,
          brandVoice: selectedBrand?.brand_voice,
          visualIdentity: selectedBrand?.visual_identity,
          variationCount: 2,
          existingCaption: variations[selectedVariation]?.caption,
          userFeedback: editFeedback,
          formats: selectedFormats,
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

  const handlePublishNow = async (variation: any, index: number) => {
    setPublishingIndex(index);
    try {
      // 1. Create a scheduled post with status 'scheduled' and scheduled_at = now
      const { data: post, error: insertError } = await supabase.from("scheduled_posts").insert({
        user_id: user!.id,
        platform: variation.platform,
        caption: variation.caption,
        image_url: variation.imageUrl || null,
        text_overlay: variation.textOverlay || null,
        cta_text: variation.ctaText || null,
        format: variation.format || "single",
        brand_id: selectedBrand?.id || null,
        scheduled_at: new Date().toISOString(),
        status: "scheduled",
      }).select().single();

      if (insertError) throw insertError;

      // 2. Trigger the auto-publish edge function
      const { data: result, error: pubError } = await supabase.functions.invoke("auto-publish", {
        body: {},
      });

      if (pubError) throw pubError;

      const published = result?.results?.find((r: any) => r.id === post.id);
      if (published?.success) {
        toast({ title: `Published to ${variation.platform} successfully! 🎉` });
      } else {
        // Post was created but publish may have failed - update user
        const errorMsg = published?.error || "Check your connected account tokens in Settings";
        toast({ title: `Post queued but publish failed: ${errorMsg}`, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: e.message || "Publish failed", variant: "destructive" });
    } finally {
      setPublishingIndex(null);
    }
  };

  const exportImage = (v: any) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const size = 1080;
    canvas.width = size;
    canvas.height = size;

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, size, size);
      if (v.textOverlay) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;
        ctx.fillText(v.textOverlay, size / 2, size / 2);
      }
      const link = document.createElement("a");
      link.download = `${v.platform}-post-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Image exported!" });
    };

    if (v.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { ctx.drawImage(img, 0, 0, size, size); draw(); };
      img.onerror = () => {
        const grad = ctx.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, "#7c3aed33");
        grad.addColorStop(1, "#14b8a633");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        draw();
      };
      img.src = v.imageUrl;
    } else {
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, "#7c3aed33");
      grad.addColorStop(1, "#14b8a633");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      draw();
    }
  };

  const exportCaption = (v: any) => {
    const text = [v.caption, "", v.ctaText ? `CTA: ${v.ctaText}` : "", `Platform: ${v.platform}`].filter(Boolean).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = `${v.platform}-caption-${Date.now()}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast({ title: "Caption exported!" });
  };

  const renderVariation = (v: any, i: number) => {
    const fmt = v.format || "single";

    if (fmt === "carousel" && v.carouselSlides?.length) {
      return (
        <div key={i} className="space-y-2">
          <CarouselPreview slides={v.carouselSlides} platform={v.platform} caption={v.caption} brandName={selectedBrand?.name} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => setPreviewVariation(v)}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setScheduleVariation(v)}>
              <CalendarDays className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => sharePost(v, { brandName: selectedBrand?.name })} disabled={sharing}>
              {sharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="gap-1 flex-1 gradient-primary" onClick={() => handleSaveVariation(v, i)}>
              <Check className="h-3 w-3" /> Approve
            </Button>
            <Button size="sm" variant="default" className="gap-1" onClick={() => handlePublishNow(v, i)} disabled={publishingIndex === i}>
              {publishingIndex === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Publish
            </Button>
          </div>
          <ExportPostButton variation={v} brandName={selectedBrand?.name} />
        </div>
      );
    }

    if (fmt === "story") {
      return (
        <div key={i} className="space-y-2">
          <StoryPreview textOverlay={v.textOverlay} imageUrl={v.imageUrl} brandName={selectedBrand?.name} ctaText={v.ctaText} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => handleGenerateImage(i)}>
              <ImageIcon className="h-3 w-3" /> Image
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setScheduleVariation(v)}>
              <CalendarDays className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => sharePost(v, { brandName: selectedBrand?.name })} disabled={sharing}>
              {sharing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="gap-1 flex-1 gradient-primary" onClick={() => handleSaveVariation(v, i)}>
              <Check className="h-3 w-3" /> Approve
            </Button>
            <Button size="sm" variant="default" className="gap-1" onClick={() => handlePublishNow(v, i)} disabled={publishingIndex === i}>
              {publishingIndex === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Publish
            </Button>
          </div>
          <ExportPostButton variation={v} brandName={selectedBrand?.name} />
        </div>
      );
    }

    // Default: single post
    return (
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
        onSchedule={() => setScheduleVariation(v)}
        onShare={() => sharePost(v, { brandName: selectedBrand?.name, feedbackScore: feedback[i]?.score, feedbackNotes: feedback[i]?.feedback })}
        sharing={sharing}
        onExportImage={() => exportImage(v)}
        onExportCaption={() => exportCaption(v)}
        onPublish={() => handlePublishNow(v, i)}
        publishing={publishingIndex === i}
      />
    );
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

            {/* Format selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Post Formats</label>
              <div className="flex flex-wrap gap-4">
                {FORMAT_OPTIONS.map((fmt) => (
                  <label key={fmt.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedFormats.includes(fmt.id)}
                      onCheckedChange={() => toggleFormat(fmt.id)}
                    />
                    <span className="text-sm">{fmt.label}</span>
                  </label>
                ))}
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
            <Button onClick={handleGenerate} disabled={generating} className="gradient-primary gap-2">
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold">Generated Variations ({variations.length})</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setBulkScheduleOpen(true)}>
                  <CalendarDays className="h-4 w-4" /> Bulk Schedule
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={handleGenerateAllImages}>
                  <ImageIcon className="h-4 w-4" /> Generate All Images
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {variations.map((v, i) => renderVariation(v, i))}
            </div>

            {/* Video generation section */}
            {variations.some((v) => v.imageUrl) && (
              <Card className="border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Video className="h-5 w-5" /> Animated Video Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate 5-second animated versions of your posts for higher engagement.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {variations.map((v, i) =>
                      v.imageUrl ? (
                        <VideoPreview
                          key={`video-${i}`}
                          imageUrl={v.imageUrl}
                          videoUrl={v.videoUrl}
                          textOverlay={v.textOverlay}
                          platform={v.platform}
                          onGenerateVideo={() => handleGenerateVideo(i)}
                        />
                      ) : null
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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

        {/* Schedule Dialog */}
        {scheduleVariation && (
          <ScheduleDialog
            open={!!scheduleVariation}
            onOpenChange={(open) => !open && setScheduleVariation(null)}
            variation={scheduleVariation}
            brandId={selectedBrand?.id}
          />
        )}

        {/* Bulk Schedule Dialog */}
        <BulkScheduleDialog
          open={bulkScheduleOpen}
          onOpenChange={setBulkScheduleOpen}
          variations={variations}
          brandId={selectedBrand?.id}
        />
      </div>
    </AppLayout>
  );
};

export default Generate;
