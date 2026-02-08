import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { socialIcons } from "@/components/icons/SocialIcons";
import { Link2, Plus, CheckCircle2 } from "lucide-react";

interface Connection {
  platform: string;
  account_name: string | null;
}

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  linkedin_page: "LinkedIn Page",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  threads: "Threads",
  google_business: "Google Business",
  bluesky: "BlueSky",
};

const platformColors: Record<string, string> = {
  instagram: "from-pink-500 to-purple-500",
  facebook: "from-blue-600 to-blue-500",
  twitter: "from-gray-800 to-gray-700",
  linkedin: "from-blue-700 to-blue-600",
  linkedin_page: "from-blue-700 to-blue-600",
  tiktok: "from-gray-900 to-gray-800",
  youtube: "from-red-600 to-red-500",
  pinterest: "from-red-700 to-red-600",
  threads: "from-gray-800 to-gray-700",
  google_business: "from-green-600 to-blue-500",
  bluesky: "from-sky-500 to-sky-400",
};

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("social_connections")
      .select("platform, account_name")
      .eq("user_id", user.id)
      .eq("connected", true)
      .then(({ data }) => {
        setConnections(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Link2 className="h-3.5 w-3.5 text-primary" />
              </div>
              Connected Accounts
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/settings")}
            >
              <Plus className="h-3 w-3" /> Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-muted mb-4">
                <Link2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">No accounts connected yet</p>
              <p className="text-xs text-muted-foreground/70 mb-4">Connect your social accounts to start publishing</p>
              <Button
                size="sm"
                onClick={() => navigate("/settings")}
                className="gap-1.5 gradient-primary text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Connect Account
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {connections.map((conn, i) => {
                const IconComp = socialIcons[conn.platform];
                const color = platformColors[conn.platform] || "from-gray-500 to-gray-400";
                return (
                  <motion.div
                    key={conn.platform}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-sm`}
                    >
                      {IconComp
                        ? IconComp({ className: "h-4 w-4 text-white" })
                        : <span className="text-xs font-bold text-white">
                            {conn.platform[0].toUpperCase()}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {platformLabels[conn.platform] || conn.platform}
                      </p>
                      {conn.account_name && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {conn.account_name}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
