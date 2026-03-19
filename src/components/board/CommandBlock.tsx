import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label?: string;
  command: string;
}

export function CommandBlock({ label, command }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
      <div className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 font-mono text-sm text-foreground">
        <code className="flex-1 overflow-x-auto whitespace-pre">{command}</code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Copy command"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
