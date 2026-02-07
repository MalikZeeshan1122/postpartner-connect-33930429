import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, CalendarDays, Trash2 } from "lucide-react";

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
    const { data } = await supabase.from("content_plans").select("*, brands(name)").order("created_at", { ascending: false });
    setPlans(data || []);
    setLoading(false);
  };

  const fetchItems = async (planId: string) => {
    const { data } = await supabase.from("plan_items").select("*").eq("plan_id", planId).order("scheduled_date");
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
      fetchItems(selectedPlan);
    }
  };

  const deleteItem = async (id: string) => {
    await supabase.from("plan_items").delete().eq("id", id);
    if (selectedPlan) fetchItems(selectedPlan);
  };

  if (authLoading || loading) return <AppLayout><div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div></AppLayout>;

  const activePlan = plans.find((p) => p.id === selectedPlan);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Planner</h1>
            <p className="text-muted-foreground">Schedule and organize your posts</p>
          </div>
          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2">
                <Plus className="h-4 w-4" /> New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Content Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder="Plan title" />
                <Select value={planBrand} onValueChange={setPlanBrand}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Description (optional)" rows={2} />
                <Button onClick={createPlan} className="w-full gradient-primary">Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-6">
          {/* Plan list */}
          <div className="w-64 space-y-2 flex-shrink-0">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${selectedPlan === plan.id ? "ring-2 ring-primary shadow-glow" : "hover:bg-muted/50"}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">{plan.title}</h4>
                  <p className="text-xs text-muted-foreground">{plan.brands?.name}</p>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Create your first plan</p>
            )}
          </div>

          {/* Plan items */}
          <div className="flex-1 space-y-4">
            {selectedPlan ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{activePlan?.title}</h2>
                  <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="h-3 w-3" /> Add Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Post to Plan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Post Intent *</label>
                          <Input value={itemIntent} onChange={(e) => setItemIntent(e.target.value)} placeholder='e.g. "Announce hackathon winners"' />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Platform</label>
                          <Select value={itemPlatform} onValueChange={setItemPlatform}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="both">Both</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input type="date" value={itemDate} onChange={(e) => setItemDate(e.target.value)} />
                        <Input value={itemTone} onChange={(e) => setItemTone(e.target.value)} placeholder="Tone (e.g. exciting, formal)" />
                        <Input value={itemCta} onChange={(e) => setItemCta(e.target.value)} placeholder="CTA (e.g. Register now!)" />
                        <Textarea value={itemContext} onChange={(e) => setItemContext(e.target.value)} placeholder="Extra context (speakers, prizes...)" rows={3} />
                        <Button onClick={createItem} className="w-full gradient-primary">Add Post</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {planItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mb-3 opacity-50" />
                    <p>No posts in this plan yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {planItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.intent}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{item.platform}</span>
                              {item.scheduled_date && <span className="text-xs text-muted-foreground">{item.scheduled_date}</span>}
                              {item.tone && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{item.tone}</span>}
                              <span className={`rounded-full px-2 py-0.5 text-xs ${item.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/generate?itemId=${item.id}&planId=${selectedPlan}`)}
                            >
                              Generate
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a plan or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Planner;
