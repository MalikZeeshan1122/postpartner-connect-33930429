import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  Heart,
  MessageCircle,
  Share2,
  Linkedin,
  Instagram,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface AnalyticsRow {
  id: string;
  scheduled_post_id: string;
  views: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  recorded_at: string;
}

interface PostWithAnalytics {
  id: string;
  platform: string;
  caption: string;
  image_url: string | null;
  status: string;
  scheduled_at: string;
  totalViews: number;
  totalClicks: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagement: number;
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [posts, setPosts] = useState<PostWithAnalytics[]>([]);
  const [dateRange, setDateRange] = useState("30");
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, dateRange, platformFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const since = subDays(new Date(), parseInt(dateRange)).toISOString();

    const [{ data: analyticsData }, { data: postsData }] = await Promise.all([
      supabase
        .from("post_analytics")
        .select("*")
        .gte("recorded_at", format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd"))
        .order("recorded_at", { ascending: true }),
      supabase
        .from("scheduled_posts")
        .select("*")
        .in("status", ["published", "scheduled"])
        .order("scheduled_at", { ascending: false }),
    ]);

    setAnalytics((analyticsData as AnalyticsRow[]) || []);

    // Aggregate analytics per post
    const postMap = new Map<string, PostWithAnalytics>();
    for (const post of (postsData || []) as any[]) {
      if (platformFilter !== "all" && post.platform !== platformFilter) continue;
      postMap.set(post.id, {
        id: post.id,
        platform: post.platform,
        caption: post.caption,
        image_url: post.image_url,
        status: post.status,
        scheduled_at: post.scheduled_at,
        totalViews: 0,
        totalClicks: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        avgEngagement: 0,
      });
    }

    for (const row of (analyticsData as AnalyticsRow[]) || []) {
      const p = postMap.get(row.scheduled_post_id);
      if (p) {
        p.totalViews += row.views;
        p.totalClicks += row.clicks;
        p.totalLikes += row.likes;
        p.totalComments += row.comments;
        p.totalShares += row.shares;
      }
    }

    for (const p of postMap.values()) {
      const total = p.totalViews || 1;
      p.avgEngagement = ((p.totalLikes + p.totalComments + p.totalShares + p.totalClicks) / total) * 100;
    }

    setPosts(Array.from(postMap.values()));
    setLoading(false);
  };

  // Build set of post IDs matching the platform filter
  const filteredPostIds = new Set(posts.map(p => p.id));

  // Aggregate daily totals for chart (only for filtered posts)
  const dailyData = analytics.reduce<Record<string, { date: string; views: number; clicks: number; engagement: number }>>((acc, row) => {
    if (!filteredPostIds.has(row.scheduled_post_id)) return acc;
    if (!acc[row.recorded_at]) {
      acc[row.recorded_at] = { date: row.recorded_at, views: 0, clicks: 0, engagement: 0 };
    }
    acc[row.recorded_at].views += row.views;
    acc[row.recorded_at].clicks += row.clicks;
    acc[row.recorded_at].engagement += row.likes + row.comments + row.shares;
    return acc;
  }, {});

  const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

  const totals = {
    views: posts.reduce((s, p) => s + p.totalViews, 0),
    clicks: posts.reduce((s, p) => s + p.totalClicks, 0),
    likes: posts.reduce((s, p) => s + p.totalLikes, 0),
    comments: posts.reduce((s, p) => s + p.totalComments, 0),
    shares: posts.reduce((s, p) => s + p.totalShares, 0),
    avgEngagement: posts.length > 0 ? posts.reduce((s, p) => s + p.avgEngagement, 0) / posts.length : 0,
  };

  if (authLoading) {
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Post Analytics</h1>
            <p className="text-muted-foreground">Track performance metrics across your published content</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Views", value: totals.views, icon: Eye, color: "text-blue-500" },
            { label: "Clicks", value: totals.clicks, icon: MousePointerClick, color: "text-green-500" },
            { label: "Likes", value: totals.likes, icon: Heart, color: "text-red-500" },
            { label: "Comments", value: totals.comments, icon: MessageCircle, color: "text-amber-500" },
            { label: "Shares", value: totals.shares, icon: Share2, color: "text-purple-500" },
            { label: "Avg Engagement", value: `${totals.avgEngagement.toFixed(1)}%`, icon: TrendingUp, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Views Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Engagement Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" />
                    <Bar dataKey="engagement" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No analytics data yet</p>
              <p className="text-xs text-muted-foreground">Analytics will appear once posts are published and tracked.</p>
            </CardContent>
          </Card>
        )}

        {/* Top posts */}
        {posts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Post Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.slice(0, 10).map((post) => {
                const isLI = post.platform === "linkedin";
                return (
                  <div key={post.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          {isLI ? <Linkedin className="h-4 w-4 text-muted-foreground/40" /> : <Instagram className="h-4 w-4 text-muted-foreground/40" />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          {isLI ? <Linkedin className="h-2.5 w-2.5" /> : <Instagram className="h-2.5 w-2.5" />}
                          {post.platform}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(post.scheduled_at), "MMM d")}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-1">{post.caption}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.totalViews}</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {post.totalClicks}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.totalLikes}</span>
                      <span className="font-medium text-foreground">{post.avgEngagement.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Analytics;
