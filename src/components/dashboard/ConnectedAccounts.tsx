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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" />
              Connected Accounts
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 gap-1"
              onClick={() => navigate("/settings")}
            >
              <Plus className="h-3 w-3" /> Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-6">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-muted mb-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                No accounts connected yet
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/settings")}
                className="gap-1 gradient-primary text-primary-foreground"
              >
                <Plus className="h-3 w-3" /> Connect Account
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {connections.map((conn, i) => {
                const icon = socialIcons[conn.platform];
                const color = platformColors[conn.platform] || "from-gray-500 to-gray-400";
                return (
                  <motion.div
                    key={conn.platform}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color}`}
                    >
                      {icon
                        ? icon({ className: "h-4 w-4 text-white" })
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
                        <p className="text-xs text-muted-foreground truncate">
                          {conn.account_name}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
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
