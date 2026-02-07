import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, CalendarDays, PenTool, Sparkles, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Hero */}
        <div className="rounded-2xl gradient-primary p-8 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-3xl font-bold">PostPartner AI</h1>
          </div>
          <p className="text-lg opacity-90 max-w-xl">
            Your AI companion for creating on-brand LinkedIn & Instagram posts. 
            From brand analysis to published content — at machine speed.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="cursor-pointer transition-all hover:shadow-glow hover:-translate-y-1" onClick={() => navigate("/brands")}>
            <CardHeader className="pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Setup Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Define your brand voice, colors, and visual identity using AI analysis.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-glow hover:-translate-y-1" onClick={() => navigate("/planner")}>
            <CardHeader className="pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 mb-2">
                <CalendarDays className="h-5 w-5 text-accent-foreground" />
              </div>
              <CardTitle className="text-lg">Plan Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Create a content calendar with post intents, platforms, and scheduling.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Plan posts <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-glow hover:-translate-y-1" onClick={() => navigate("/generate")}>
            <CardHeader className="pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
                <PenTool className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Generate Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                AI generates multiple on-brand variations with self-feedback loops.
              </p>
              <div className="flex items-center text-sm font-medium text-primary">
                Create now <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { step: "1", title: "Brand Setup", desc: "AI analyzes your brand from website, posts & guidelines" },
                { step: "2", title: "Plan Content", desc: "Define post intents, platforms, and scheduling" },
                { step: "3", title: "AI Generates", desc: "Multiple variations with self-feedback improvement" },
                { step: "4", title: "You Refine", desc: "Select, edit, and iterate until perfect" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
