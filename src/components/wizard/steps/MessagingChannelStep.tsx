import { useQuery } from "@tanstack/react-query";
import { Send, MessageSquare, Phone, ExternalLink, Key, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  frameworkSlug: string;
  value: string[];
  onChange: (channels: string[]) => void;
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

const channelIcons: Record<string, React.ReactNode> = {
  telegram: <Send className="h-5 w-5" />,
  discord: <MessageSquare className="h-5 w-5" />,
  whatsapp: <Phone className="h-5 w-5" />,
};

const channelDescriptions: Record<string, string> = {
  telegram: "Best first channel. Just needs a BotFather token.",
  discord: "Set up a Discord bot for your server.",
  whatsapp: "Connect via WhatsApp Cloud API.",
};

export function MessagingChannelStep({ frameworkSlug, value, onChange }: Props) {
  const { data: channels, isLoading } = useQuery({
    queryKey: ["framework-channels", frameworkSlug],
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
        .eq("category", "messaging_channel")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CredReq[];
    },
    enabled: !!frameworkSlug,
  });

  const toggleChannel = (provider: string) => {
    if (value.includes(provider)) {
      onChange(value.filter((c) => c !== provider));
    } else {
      onChange([...value, provider]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Messaging Channels</h2>
        <p className="mt-2 text-muted-foreground">
          How will you talk to your agent? Select one or more channels. You can skip this and add channels later.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(channels ?? []).map((ch) => {
            const provider = ch.provider ?? '';
            const isSelected = value.includes(provider);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(provider)}
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
                    {channelIcons[provider] ?? <MessageSquare className="h-5 w-5" />}
                  </div>
                  <span className="font-heading text-base font-semibold text-foreground">
                    {ch.display_name.replace(' Bot Token', '').replace(' Cloud API Token', '')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {channelDescriptions[provider] ?? ch.display_name}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Details for selected channels */}
      {value.length > 0 && (channels ?? []).length > 0 && (
        <div className="space-y-3">
          {value.map((provider) => {
            const ch = (channels ?? []).find((c) => c.provider === provider);
            if (!ch) return null;
            return (
              <div key={provider} className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{ch.display_name}:</span>
                  <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-foreground">{ch.env_var_name}</code>
                </div>
                {ch.format_hint && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Format:</span>{" "}
                    <code className="font-mono">{ch.format_hint}</code>
                  </p>
                )}
                {ch.docs_url && (
                  <a
                    href={ch.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Setup guide <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        No channels selected? That's okay — you can always configure channels from your project board later.
      </p>
    </div>
  );
}
