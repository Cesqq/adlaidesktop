import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Check, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { AIArchitectPreview } from "@/components/premium/AIArchitectPreview";
import type { WizardState } from "@/types/wizard";

interface Props {
  state: WizardState;
}

const osLabels: Record<string, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

function Row({ label, value, badge }: { label: string; value: string | null | undefined; badge?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {badge ? (
        <Badge variant="secondary" className="text-xs">{value}</Badge>
      ) : (
        <span className="text-sm font-medium text-foreground">{value}</span>
      )}
    </div>
  );
}

export function ReviewStep({ state }: Props) {
  const { isPremium } = useSubscription();
  const { data: framework } = useQuery({
    queryKey: ["framework-review", state.framework],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("frameworks")
        .select("name, language, icon_letter, icon_color")
        .eq("slug", state.framework)
        .single();
      return data as { name: string; language: string; icon_letter: string; icon_color: string } | null;
    },
    enabled: !!state.framework,
  });

  const prereqCount = Object.values(state.prerequisitesVerified).filter(Boolean).length;

  const providerLabels: Record<string, string> = {
    anthropic: "Anthropic (Claude)",
    openai: "OpenAI (GPT-4o)",
    openrouter: "OpenRouter",
    ollama: "Ollama (Local)",
  };

  const channelLabels: Record<string, string> = {
    telegram: "Telegram",
    discord: "Discord",
    whatsapp: "WhatsApp",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Review Your Setup</h2>
        <p className="mt-2 text-muted-foreground">
          Everything look good? Hit create to generate your personalized setup board.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-0">
        {/* Framework */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">Framework</span>
          <div className="flex items-center gap-2">
            {framework && (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
                style={{ backgroundColor: framework.icon_color }}
              >
                {framework.icon_letter}
              </div>
            )}
            <span className="text-sm font-medium text-foreground">
              {framework?.name ?? state.framework}
            </span>
            {framework?.language && (
              <Badge variant="outline" className="text-[10px]">{framework.language}</Badge>
            )}
          </div>
        </div>

        <Row label="Operating System" value={state.os ? osLabels[state.os] : null} />

        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">Prerequisites</span>
          <span className="flex items-center gap-1 text-sm font-medium text-foreground">
            {prereqCount > 0 && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            {prereqCount} verified
          </span>
        </div>

        <Row
          label="AI Provider"
          value={state.modelProvider ? (providerLabels[state.modelProvider] ?? state.modelProvider) : "Not selected"}
        />

        <div className="flex items-center justify-between py-3 border-b border-border">
          <span className="text-sm text-muted-foreground">Channels</span>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {state.channels.length === 0 ? (
              <span className="text-sm text-muted-foreground">None (add later)</span>
            ) : (
              state.channels.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">
                  {channelLabels[c] ?? c}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security defaults */}
      <div className="rounded-2xl border border-border bg-muted/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">Security Defaults</span>
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-emerald-400 shrink-0" /> Loopback-only gateway binding
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-emerald-400 shrink-0" /> Token authentication enabled
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-emerald-400 shrink-0" /> Allowlist DM policy
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-emerald-400 shrink-0" /> API keys stored in OS keychain only
          </li>
        </ul>
      </div>

      {/* AI Architect preview — premium gate */}
      {!isPremium && <AIArchitectPreview />}
    </div>
  );
}
