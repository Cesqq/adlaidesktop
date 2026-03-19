import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { type ReactNode } from "react";

interface WizardCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  badge?: { label: string; color: 'green' | 'cyan' | 'amber' | 'muted' };
  onClick?: () => void;
}

const badgeColors = {
  green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function WizardCard({ title, description, icon, selected, disabled, badge, onClick }: WizardCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300",
        "hover:border-primary/50 hover:-translate-y-0.5",
        selected && "border-primary ring-1 ring-primary/30 bg-primary/5",
        !selected && !disabled && "border-border bg-card",
        disabled && "cursor-not-allowed opacity-40 hover:translate-y-0 hover:border-border"
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full gradient-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-heading text-base font-semibold text-foreground">{title}</span>
          {badge && (
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", badgeColors[badge.color])}>
              {badge.label}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </button>
  );
}
