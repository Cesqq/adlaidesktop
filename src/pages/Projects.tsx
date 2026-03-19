import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { FolderPlus, ArrowRight, Loader2, Trash2, Target, Monitor, Apple, Terminal } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeCard } from "@/components/premium/UpgradeCard";
import { toast } from "sonner";
import { motion } from "framer-motion";

const osIcons: Record<string, React.ElementType> = {
  macos: Apple,
  linux: Terminal,
  windows: Monitor,
};

export default function Projects() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-dashboard", user?.id],
    queryFn: async () => {
      const { data: projs, error } = await supabase
        .from("setup_projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Get all framework IDs
      const fwIds = [...new Set((projs ?? []).map((p) => p.framework_id).filter(Boolean))];
      let fwMap = new Map<string, any>();
      if (fwIds.length > 0) {
        const { data: fws } = await (supabase as any)
          .from("frameworks")
          .select("id, name, icon_letter, icon_color, language")
          .in("id", fwIds);
        if (fws) fwMap = new Map(fws.map((f) => [f.id, f]));
      }

      // Fetch related data for all projects in parallel
      const enriched = await Promise.all(
        (projs ?? []).map(async (p) => {
          const [stepsRes, goalsRes, envRes] = await Promise.all([
            supabase
              .from("project_step_status")
              .select("status")
              .eq("project_id", p.id),
            supabase
              .from("project_goals")
              .select("goal")
              .eq("project_id", p.id)
              .limit(1),
            supabase
              .from("project_environment")
              .select("os")
              .eq("project_id", p.id)
              .limit(1),
          ]);

          const allSteps = stepsRes.data ?? [];
          const liveCount = allSteps.filter((s) => s.status === "live").length;
          const totalCount = allSteps.length;
          const fw = fwMap.get(p.framework_id) ?? null;

          return {
            ...p,
            goal: goalsRes.data?.[0]?.goal ?? null,
            os: envRes.data?.[0]?.os ?? null,
            liveCount,
            totalCount,
            progress: totalCount > 0 ? Math.round((liveCount / totalCount) * 100) : 0,
            framework_name: fw?.name ?? null,
            framework_icon_letter: fw?.icon_letter ?? null,
            framework_icon_color: fw?.icon_color ?? null,
          };
        })
      );

      return enriched;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      // Delete child tables first (no cascade FK in some cases)
      await Promise.all([
        supabase.from("project_step_status").delete().eq("project_id", projectId),
        supabase.from("project_goals").delete().eq("project_id", projectId),
        supabase.from("project_environment").delete().eq("project_id", projectId),
        supabase.from("project_capabilities").delete().eq("project_id", projectId),
        supabase.from("project_channels").delete().eq("project_id", projectId),
        supabase.from("credential_requirements").delete().eq("project_id", projectId),
        supabase.from("blueprint_runs").delete().eq("project_id", projectId),
        supabase.from("validation_runs").delete().eq("project_id", projectId),
      ]);
      const { error } = await supabase.from("setup_projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-dashboard"] });
      toast.success("Project deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete project"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-foreground">My Projects</h1>
        <Link to="/projects/new">
          <Button className="gradient-primary border-0 text-primary-foreground">
            <FolderPlus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (!projects || projects.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[350px] items-center justify-center rounded-2xl border border-dashed border-border"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FolderPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground"><p className="mt-1 text-sm text-muted-foreground">Create your first project to get started.</p></p>
            </div>
            <Link to="/projects/new">
              <Button className="gradient-primary border-0 text-primary-foreground">
                Create Your First Project
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {projects && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((p) => {
            const OsIcon = p.os ? osIcons[p.os] ?? Monitor : null;
            return (
              <div
                key={p.id}
                className="group rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-primary/50 hover:-translate-y-0.5"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  {p.framework_icon_letter && (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: p.framework_icon_color || '#6366F1' }}
                    >
                      {p.framework_icon_letter}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">{p.name}</h3>
                    {p.framework_name && (
                      <p className="text-[11px] text-muted-foreground">{p.framework_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize border-primary/40 text-primary">
                    {p.mode}
                  </Badge>
                  {p.os && OsIcon && (
                    <Badge variant="outline" className="text-[10px] capitalize gap-1">
                      <OsIcon className="h-3 w-3" /> {p.os}
                    </Badge>
                  )}
                </div>

                {/* Goal */}
                {p.goal && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate capitalize">{p.goal.replace(/_/g, " ")}</span>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.liveCount}/{p.totalCount} steps complete</span>
                    <span>{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-2" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link to={`/projects/new?edit=${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                        Edit
                      </Button>
                    </Link>
                    <Link to={`/projects/${p.id}`}>
                      <Button size="sm" className="h-7 text-xs gradient-primary border-0 text-primary-foreground">
                        Continue <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Premium upsell */}
          {!isPremium && projects.length > 1 && (
            <UpgradeCard
              title="Manage unlimited projects"
              description="Manage unlimited projects with Lumina Premium"
              className="min-h-[200px] flex flex-col justify-center"
            />
          )}

          {/* New Project card */}
          <Link
            to="/projects/new"
            className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 transition-all hover:border-primary/50 hover:bg-card"
          >
            <div className="text-center space-y-2">
              <FolderPlus className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">New Project</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its setup data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
