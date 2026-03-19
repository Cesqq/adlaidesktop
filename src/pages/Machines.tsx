import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Monitor, Download, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PairMachineDialog } from "@/components/machines/PairMachineDialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import mascotPointing from "@/assets/mascot-pointing.png";

const OS_BADGE: Record<string, { label: string; className: string }> = {
  macos: { label: "macOS", className: "bg-muted text-muted-foreground" },
  linux: { label: "Linux", className: "bg-[hsl(40,92%,55%)]/20 text-[hsl(40,92%,55%)]" },
  windows: { label: "Windows", className: "bg-[hsl(190,85%,55%)]/20 text-[hsl(190,85%,55%)]" },
  wsl2: { label: "WSL2", className: "bg-[hsl(160,84%,39%)]/20 text-[hsl(160,84%,39%)]" },
};

function isOnline(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000;
}

export default function Machines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pairOpen, setPairOpen] = useState(false);

  const { data: machines, isLoading } = useQuery({
    queryKey: ["machines", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("machines")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      toast({ title: "Machine revoked", description: "The companion app on this machine has been disconnected." });
    },
  });

  const isEmpty = !isLoading && (!machines || machines.length === 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Machines</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your paired companion agents</p>
        </div>
        <Button onClick={() => setPairOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Pair New Machine
        </Button>
      </div>

      {/* Machine list */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse border-border bg-card">
              <CardContent className="p-5 h-28" />
            </Card>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <img src={mascotPointing} alt="No machines" className="h-28 w-auto object-contain mb-6 opacity-80" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No machines paired yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Download the companion app and pair it to get started.
          </p>
          <Button onClick={() => setPairOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Pair New Machine
          </Button>
        </div>
      )}

      {machines && machines.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {machines.map((m) => {
            const online = isOnline(m.last_seen_at);
            const os = OS_BADGE[m.os_family] ?? { label: m.os_family, className: "bg-muted text-muted-foreground" };
            return (
              <Card
                key={m.id}
                className="border-border bg-card hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{m.machine_label}</span>
                    </div>
                    <Badge variant="outline" className={os.className + " text-xs border-0"}>
                      {os.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`h-2 w-2 rounded-full ${online ? "bg-[hsl(var(--success))]" : "bg-muted-foreground/40"}`}
                    />
                    {online ? "Online" : "Offline"}
                    {m.last_seen_at && (
                      <span className="ml-1">
                        · {formatDistanceToNow(new Date(m.last_seen_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke machine?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will disconnect the companion app on this machine. You can pair it again later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => revokeMutation.mutate(m.id)}
                          >
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Download Companion */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="gap-2 text-muted-foreground w-full justify-start">
            <Download className="h-4 w-4" />
            Download Companion App
            <ChevronDown className="h-4 w-4 ml-auto" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <Card className="border-border bg-card">
            <CardContent className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">~5 MB download. Runs in your system tray.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/YOUR_ORG/openclaw-companion/releases/latest/download/openclaw-companion-setup.exe">
                    Windows (.exe)
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/YOUR_ORG/openclaw-companion/releases/latest/download/openclaw-companion.dmg">
                    macOS (.dmg)
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/YOUR_ORG/openclaw-companion/releases/latest/download/openclaw-companion.AppImage">
                    Linux (.AppImage)
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <PairMachineDialog open={pairOpen} onOpenChange={setPairOpen} />
    </div>
  );
}
