import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMachines, isOnline } from "@/hooks/useMachines";
import { cn } from "@/lib/utils";

const OS_COLORS: Record<string, string> = {
  macos: "bg-muted-foreground/60 text-muted-foreground",
  linux: "bg-amber-500/20 text-amber-400",
  windows: "bg-cyan-500/20 text-cyan-400",
  wsl2: "bg-green-500/20 text-green-400",
};

interface Props {
  value: string | null;
  onChange: (id: string) => void;
}

export function TargetMachineSelector({ value, onChange }: Props) {
  const { machines, isLoading } = useMachines();

  if (isLoading) return null;

  if (machines.length === 0) {
    return (
      <Link
        to="/machines"
        className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
      >
        No machines paired — set one up
      </Link>
    );
  }

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-[220px] h-8 text-xs bg-card border-border">
        <SelectValue placeholder="Select target machine" />
      </SelectTrigger>
      <SelectContent>
        {machines.map((m) => {
          const online = isOnline(m);
          return (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full shrink-0", online ? "bg-green-500" : "bg-muted-foreground/40")} />
                <span className="truncate">{m.machine_label}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", OS_COLORS[m.os_family] ?? "bg-muted text-muted-foreground")}>
                  {m.os_family}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
