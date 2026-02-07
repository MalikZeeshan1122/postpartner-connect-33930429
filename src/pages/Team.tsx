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
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Pencil,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye,
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const Team = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchTeam();
  }, [user]);

  const fetchTeam = async () => {
    setLoading(true);

    const [{ data: roles }, { data: invites }] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.from("team_invitations").select("*").order("created_at", { ascending: false }),
    ]);

    const members = (roles || []) as TeamMember[];
    setMembers(members);
    setInvitations((invites as Invitation[]) || []);
    setIsOwner(members.some((m) => m.user_id === user?.id && m.role === "owner"));
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Enter an email address", variant: "destructive" });
      return;
    }

    setInviting(true);
    try {
      const { error } = await supabase.from("team_invitations").insert([{
        invited_by: user!.id,
        email: inviteEmail.trim(),
        role: inviteRole as "admin" | "editor" | "viewer",
      }]);

      if (error) throw error;
      toast({ title: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
      fetchTeam();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Member removed" });
    }
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Team
          </h1>
          <p className="text-muted-foreground">Manage team members and their roles</p>
        </div>

        {/* Invite form */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Invite Team Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting} className="gradient-primary gap-1">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current members */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Team Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.map((m) => {
                  const RoleIcon = roleIcons[m.role] || Eye;
                  const isCurrentUser = m.user_id === user?.id;

                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <RoleIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isCurrentUser ? "You" : m.user_id.slice(0, 8) + "..."}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Joined {format(new Date(m.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[m.role] || m.role}
                      </Badge>
                      {isOwner && !isCurrentUser && m.role !== "owner" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive/70 hover:text-destructive"
                          onClick={() => handleRemoveRole(m.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pending Invitations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Invited {format(new Date(inv.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        {roleLabels[inv.role] || inv.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={inv.status === "accepted" ? "text-green-600" : "text-amber-600"}
                      >
                        {inv.status === "accepted" ? (
                          <><CheckCircle2 className="h-3 w-3 mr-0.5" /> Accepted</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-0.5" /> Pending</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
