import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Cpu, Globe, Server, ExternalLink, Shield, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  frameworkSlug: string;
  value: string | null;
  onChange: (provider: string) => void;
}

interface CredReq {
  id: string;
  env_var_name: string;
  display_name: string;
  format_hint: string | null;
  provider: string | null;
  docs_url: string | null;
  sort_order: number;
}

const providerIcons: Record<string, React.ReactNode> = {
  anthropic: <Brain className="h-5 w-5" />,
  openai: <Cpu className="h-5 w-5" />,
  openrouter: <Globe className="h-5 w-5" />,
  ollama: <Server className="h-5 w-5" />,
};

const providerDescriptions: Record<string, string> = {
  anthropic: "Claude models. Best for reasoning and code.",
  openai: "GPT-4o and o1 models. Widely supported.",
  openrouter: "Route to 100+ models from one API key.",
  ollama: "Run models locally. No API key needed.",
};

export function LLMProviderStep({ frameworkSlug, value, onChange }: Props) {
  const { data: providers, isLoading } = useQuery({
    queryKey: ["framework-llm-providers", frameworkSlug],
    queryFn: async () => {
      const { data: fw } = await (supabase as any)
        .from("frameworks")
        .select("id")
        .eq("slug", frameworkSlug)
        .single();
      if (!fw) return [];

      const { data, error } = await (supabase as any)
        .from("framework_credential_requirements")
        .select("*")
        .eq("framework_id", fw.id)
        .eq("category", "llm_provider")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CredReq[];
    },
    enabled: !!frameworkSlug,
  });

  const selected = (providers ?? []).find((p) => p.provider === value);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Choose Your AI Provider</h2>
        <p className="mt-2 text-muted-foreground">
          Which AI model provider will power your agent? You can change this later.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(providers ?? []).map((p) => {
            const isSelected = value === p.provider;
            return (
              <button
                key={p.id}
                onClick={() => onChange(p.provider!)}
                className={cn(
                  "relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300",
                  "hover:border-primary/50 hover:-translate-y-0.5",
                  isSelected && "border-primary ring-1 ring-primary/30 bg-primary/5",
                  !isSelected && "border-border bg-card"
                )}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full gradient-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    {providerIcons[p.provider ?? ''] ?? <Key className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="font-heading text-base font-semibold text-foreground">{p.display_name.replace(' API Key', '')}</span>
                    {p.provider === 'anthropic' && (
                      <span className="ml-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {providerDescriptions[p.provider ?? ''] ?? p.display_name}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected provider details */}
      {selected && (
        <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">Environment variable:</span>
            <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">{selected.env_var_name}</code>
          </div>
          {selected.format_hint && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Format:</span>{" "}
              <code className="font-mono">{selected.format_hint}</code>
            </div>
          )}
          {selected.docs_url && (
            <a
              href={selected.docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Get your API key <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Shield className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your API key will be stored securely in your OS keychain by the desktop companion. It is never sent to our servers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
