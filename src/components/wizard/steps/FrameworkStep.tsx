import { cn } from "@/lib/utils";
import { Check, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Framework } from "@/types/wizard";

interface FrameworkOption {
  slug: Framework;
  name: string;
  description: string;
  language: string;
  status: "Supported" | "Coming Soon";
  color: string;
  requirements: string;
}

const frameworks: FrameworkOption[] = [
  {
    slug: "openclaw",
    name: "OpenClaw",
    description: "The original. 300K+ stars. Full-featured AI assistant.",
    language: "Node.js",
    status: "Supported",
    color: "hsl(265, 70%, 60%)",
    requirements: "Requires: Node.js 22+, 4GB RAM, ~500MB storage",
  },
  {
    slug: "zeroclaw",
    name: "ZeroClaw",
    description: "Ultra-lightweight Rust runtime. Under 5MB.",
    language: "Rust",
    status: "Supported",
    color: "hsl(20, 85%, 55%)",
    requirements: "Requires: Rust toolchain or Homebrew, <5MB storage",
  },
  {
    slug: "nanobot",
    name: "Nanobot",
    description: "OpenClaw in 4,000 lines of Python.",
    language: "Python",
    status: "Supported",
    color: "hsl(190, 85%, 55%)",
    requirements: "Requires: Python 3.11+, ~50MB storage",
  },
  {
    slug: "nanoclaw",
    name: "NanoClaw",
    description: "Security-first with Docker container isolation.",
    language: "TypeScript",
    status: "Coming Soon",
    color: "hsl(340, 75%, 55%)",
    requirements: "",
  },
  {
    slug: "picoclaw",
    name: "PicoClaw",
    description: "Built for IoT and embedded devices.",
    language: "Go",
    status: "Coming Soon",
    color: "hsl(160, 84%, 39%)",
    requirements: "",
  },
];

interface FrameworkStepProps {
  value: Framework | null;
  onChange: (v: Framework) => void;
}

export function FrameworkStep({ value, onChange }: FrameworkStepProps) {
  const selected = frameworks.find((f) => f.slug === value);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Choose Your Agent Framework</h2>
        <p className="mt-2 text-muted-foreground">
          Select which AI agent you want to install.{" "}
          <span className="font-mono font-semibold text-foreground">Adl._.Ai</span>{" "}
          <span className="text-foreground">Studio</span> will customize the entire setup flow for your choice.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((fw) => {
          const isSupported = fw.status === "Supported";
          const isSelected = value === fw.slug;

          const card = (
            <button
              key={fw.slug}
              type="button"
              disabled={!isSupported}
              onClick={() => isSupported && onChange(fw.slug)}
              className={cn(
                "relative flex flex-col items-center rounded-2xl border p-6 text-center transition-all duration-300",
                isSupported && !isSelected && "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(265,70%,60%,0.15)]",
                isSelected && "border-primary ring-1 ring-primary/30 bg-primary/5 -translate-y-0.5",
                !isSupported && "cursor-not-allowed opacity-50 border-border bg-card"
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full gradient-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              <div
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
                style={{ background: fw.color }}
              >
                {fw.name[0]}
              </div>

              <h3 className="font-heading text-base font-semibold text-foreground">{fw.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{fw.description}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {fw.language}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    isSupported
                      ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
                      : "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                  )}
                >
                  {fw.status}
                </span>
              </div>
            </button>
          );

          if (!isSupported) {
            return (
              <Tooltip key={fw.slug}>
                <TooltipTrigger asChild>{card}</TooltipTrigger>
                <TooltipContent>Join the waitlist</TooltipContent>
              </Tooltip>
            );
          }

          return card;
        })}
      </div>

      {selected && selected.requirements && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-secondary" />
          {selected.requirements}
        </div>
      )}
    </div>
  );
}
