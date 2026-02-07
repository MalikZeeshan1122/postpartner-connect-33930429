import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import CalendarGrid from "@/components/CalendarGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, CalendarDays, Trash2, List, LayoutGrid } from "lucide-react";
import { format } from "date-fns";

const Planner = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [planItems, setPlanItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [prefillDate, setPrefillDate] = useState("");

  // Plan form
  const [planTitle, setPlanTitle] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planBrand, setPlanBrand] = useState("");

  // Item form
  const [itemIntent, setItemIntent] = useState("");
  const [itemPlatform, setItemPlatform] = useState("both");
  const [itemDate, setItemDate] = useState("");
  const [itemTone, setItemTone] = useState("");
  const [itemCta, setItemCta] = useState("");
  const [itemContext, setItemContext] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchBrands();
      fetchPlans();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPlan) fetchItems(selectedPlan);
  }, [selectedPlan]);

  const fetchBrands = async () => {
    const { data } = await supabase.from("brands").select("id, name");
    setBrands(data || []);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("content_plans")
      .select("*, brands(name)")
      .order("created_at", { ascending: false });
    setPlans(data || []);
    if (data && data.length > 0 && !selectedPlan) {
      setSelectedPlan(data[0].id);
    }
    setLoading(false);
  };

  const fetchItems = async (planId: string) => {
    const { data } = await supabase
      .from("plan_items")
      .select("*")
      .eq("plan_id", planId)
      .order("scheduled_date");
    setPlanItems(data || []);
  };

  const createPlan = async () => {
    if (!planTitle || !planBrand) {
      toast({ title: "Title and brand are required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("content_plans").insert({
      user_id: user!.id,
      brand_id: planBrand,
      title: planTitle,
      description: planDesc || null,
    });
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan created!" });
      setPlanDialogOpen(false);
      setPlanTitle("");
      setPlanDesc("");
      fetchPlans();
    }
  };

  const createItem = async () => {
    if (!itemIntent || !selectedPlan) {
      toast({ title: "Post intent is required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("plan_items").insert({
      plan_id: selectedPlan,
      user_id: user!.id,
      intent: itemIntent,
      platform: itemPlatform,
      scheduled_date: itemDate || null,
      tone: itemTone || null,
      cta: itemCta || null,
      extra_context: itemContext || null,
    });
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post added to plan!" });
      setItemDialogOpen(false);
      setItemIntent("");
      setItemTone("");
      setItemCta("");
      setItemContext("");
      setItemDate("");
      setPrefillDate("");
      fetchItems(selectedPlan);
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from("plan_items").delete().eq("id", id);
    if (selectedPlan) fetchItems(selectedPlan);
  };

  const handleItemDrop = async (itemId: string, newDate: string) => {
    const { error } = await supabase
      .from("plan_items")
      .update({ scheduled_date: newDate })
      .eq("id", itemId);
    if (error) {
      toast({ title: "Failed to reschedule", variant: "destructive" });
    } else {
      // Optimistic update
      setPlanItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, scheduled_date: newDate } : item
        )
      );
      toast({ title: `Rescheduled to ${newDate}` });
    }
  };

  const handleDayClick = (date: Date) => {
    if (!selectedPlan) {
      toast({ title: "Select or create a plan first", variant: "destructive" });
      return;
    }
    const formatted = format(date, "yyyy-MM-dd");
    setPrefillDate(formatted);
    setItemDate(formatted);
    setItemDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const activePlan = plans.find((p) => p.id === selectedPlan);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Schedule and organize your posts</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Plan selector */}
            {plans.length > 0 && (
              <Select value={selectedPlan ?? ""} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View toggle */}
            <div className="flex rounded-lg border">
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-2 ${viewMode === "calendar" ? "bg-muted" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3 w-3" /> New Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Content Plan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="Plan title"
                  />
                  <Select value={planBrand} onValueChange={setPlanBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={planDesc}
                    onChange={(e) => setPlanDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <Button onClick={createPlan} className="w-full gradient-primary">
                    Create Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              className="gradient-primary gap-1"
              disabled={!selectedPlan}
              onClick={() => {
                setItemDate("");
                setPrefillDate("");
                setItemDialogOpen(true);
              }}
            >
              <Plus className="h-3 w-3" /> New
            </Button>
          </div>
        </div>

        {/* Calendar or List view */}
        {viewMode === "calendar" ? (
          <CalendarGrid
            items={planItems}
            onDayClick={handleDayClick}
            onItemClick={(item) =>
              navigate(`/generate?itemId=${item.id}&planId=${selectedPlan}`)
            }
            onItemDrop={handleItemDrop}
          />
        ) : (
          <div className="space-y-3">
            {planItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
                <p>No posts in this plan yet</p>
                <p className="text-sm">Click "New" to add a post</p>
              </div>
            ) : (
              planItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.intent}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {item.platform}
                        </span>
                        {item.scheduled_date && (
                          <span className="text-xs text-muted-foreground">
                            {item.scheduled_date}
                          </span>
                        )}
                        {item.tone && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {item.tone}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            item.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/generate?itemId=${item.id}&planId=${selectedPlan}`
                          )
                        }
                      >
                        Generate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Add item dialog */}
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Post to Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Post Intent *</label>
                <Input
                  value={itemIntent}
                  onChange={(e) => setItemIntent(e.target.value)}
                  placeholder='e.g. "Announce hackathon winners"'
                />
              </div>
              <div>
                <label className="text-sm font-medium">Platform</label>
                <Select value={itemPlatform} onValueChange={setItemPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="date"
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
              />
              <Input
                value={itemTone}
                onChange={(e) => setItemTone(e.target.value)}
                placeholder="Tone (e.g. exciting, formal)"
              />
              <Input
                value={itemCta}
                onChange={(e) => setItemCta(e.target.value)}
                placeholder="CTA (e.g. Register now!)"
              />
              <Textarea
                value={itemContext}
                onChange={(e) => setItemContext(e.target.value)}
                placeholder="Extra context (speakers, prizes...)"
                rows={3}
              />
              <Button onClick={createItem} className="w-full gradient-primary">
                Add Post
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Planner;
