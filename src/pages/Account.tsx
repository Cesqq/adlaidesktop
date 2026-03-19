import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Crown, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function Account() {
  const { user, signOut, session } = useAuth();
  const { isPro, currentPeriodEnd: subscriptionEnd } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      toast.success("Welcome to Lumina Pro! Your subscription is now active.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to open subscription management.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const { data: projects } = await supabase.from("setup_projects").select("id").eq("user_id", user!.id);
    if (projects) {
      for (const p of projects) {
        await Promise.all([
          supabase.from("project_step_status").delete().eq("project_id", p.id),
          supabase.from("project_goals").delete().eq("project_id", p.id),
          supabase.from("project_environment").delete().eq("project_id", p.id),
          supabase.from("project_capabilities").delete().eq("project_id", p.id),
          supabase.from("project_channels").delete().eq("project_id", p.id),
          supabase.from("credential_requirements").delete().eq("project_id", p.id),
          supabase.from("blueprint_runs").delete().eq("project_id", p.id),
          supabase.from("validation_runs").delete().eq("project_id", p.id),
        ]);
        await supabase.from("setup_projects").delete().eq("id", p.id);
      }
    }
    // subscriptions row is managed by service_role only; skip client-side delete
    toast.success("Account data deleted. You've been signed out.");
    setDeleting(false);
    signOut();
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-heading text-3xl font-bold text-foreground">Account Settings</h1>

      {/* Profile */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Profile</h2>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-foreground">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="font-mono text-xs text-muted-foreground">{user?.id}</p>
        </div>
      </section>

      {/* Change Password */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Change Password</h2>
        <div className="grid gap-3 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="pr-10" />
              <button type="button" tabIndex={-1} onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="pr-10" />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPassword || !newPassword} className="w-fit">
            {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </div>
      </section>

      {/* Subscription */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Subscription</h2>
        <div className="flex items-center gap-3">
          <Badge variant={isPro ? "default" : "outline"} className={isPro ? "gap-1" : ""}>
            {isPro && <Crown className="h-3 w-3" />}
            {isPro ? "Lumina Pro" : "Community — Free"}
          </Badge>
          {isPro && subscriptionEnd && (
            <span className="text-xs text-muted-foreground">
              Renews {new Date(subscriptionEnd).toLocaleDateString()}
            </span>
          )}
        </div>
        {isPro ? (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleManageSubscription} disabled={portalLoading}>
            {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Manage Subscription
          </Button>
        ) : (
          <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10" asChild>
            <a href="/architect"><Crown className="mr-2 h-4 w-4" /> Upgrade to Lumina Pro</a>
          </Button>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-destructive/30 bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="font-heading text-lg font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This will permanently delete all your projects and sign you out. This cannot be undone.
        </p>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteDialog(true)}>
          Delete Account Data
        </Button>
      </section>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your projects, setup data, and sign you out. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAccount}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
