import { useState, useEffect } from "react";
import { Shield, Key, Eye, EyeOff, Trash2, Loader2, Plus, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  isTauri,
  listCredentials,
  getCredential,
  deleteCredential,
  setCredential,
  detectOs,
} from "@/hooks/useTauriCommands";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getKeychainName(os: string): string {
  if (os === "windows") return "Windows Credential Manager";
  if (os === "macos") return "macOS Keychain";
  return "Secret Service";
}

/** Parse "adlai-studio-{framework}-{envVar}" into parts */
function parseCredKey(key: string): { framework: string; envVar: string } {
  const prefix = "adlai-studio-";
  const rest = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  const dash = rest.indexOf("-");
  if (dash === -1) return { framework: "unknown", envVar: rest };
  return { framework: rest.slice(0, dash), envVar: rest.slice(dash + 1) };
}

// ---------------------------------------------------------------------------
// Per-credential row
// ---------------------------------------------------------------------------

function CredentialRow({
  credKey,
  onDeleted,
}: {
  credKey: string;
  onDeleted: () => void;
}) {
  const { framework, envVar } = parseCredKey(credKey);
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setRevealedValue(null);
      return;
    }
    setLoading(true);
    try {
      const val = await getCredential(credKey);
      setRevealedValue(val);
      setRevealed(true);
    } catch (err: any) {
      toast.error(`Failed to retrieve: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCredential(credKey);
      toast.success(`Deleted ${envVar}`);
      onDeleted();
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    }
    setConfirming(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80">
      <Key className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-medium text-foreground truncate">{envVar}</code>
          <Badge variant="outline" className="text-[10px] capitalize shrink-0">{framework}</Badge>
        </div>
        <div className="mt-1 font-mono text-xs text-muted-foreground">
          {revealed && revealedValue != null ? revealedValue : "••••••••••••••••"}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleReveal}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : revealed ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </Button>

        {confirming ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="destructive" className="h-7 text-[11px]" onClick={handleDelete}>
              Confirm
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add credential form
// ---------------------------------------------------------------------------

function AddCredentialForm({
  osName,
  onAdded,
}: {
  osName: string;
  onAdded: () => void;
}) {
  const [framework, setFramework] = useState("openclaw");
  const [envVar, setEnvVar] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!envVar.trim() || !value.trim()) return;
    const key = `adlai-studio-${framework}-${envVar.trim()}`;
    setSaving(true);
    try {
      await setCredential(key, value.trim());
      toast.success(`Saved to ${getKeychainName(osName)}`);
      setEnvVar("");
      setValue("");
      onAdded();
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 space-y-3">
      <h4 className="text-sm font-medium text-foreground">Add Credential</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Framework</label>
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
          >
            <option value="openclaw">OpenClaw</option>
            <option value="zeroclaw">ZeroClaw</option>
            <option value="nanobot">Nanobot</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Env Var Name</label>
          <input
            value={envVar}
            onChange={(e) => setEnvVar(e.target.value.toUpperCase())}
            placeholder="ANTHROPIC_API_KEY"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Value</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
      <Button
        size="sm"
        className="h-7 text-xs gap-1.5"
        disabled={!envVar.trim() || !value.trim() || saving}
        onClick={handleSave}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
        Save to Keychain
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Credentials() {
  const isDesktop = isTauri();
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [osName, setOsName] = useState("windows");

  const loadKeys = async () => {
    setLoading(true);
    try {
      const k = await listCredentials();
      setKeys(k);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDesktop) { setLoading(false); return; }
    loadKeys();
    detectOs().then((info) => { if (info) setOsName(info.os); });
  }, [isDesktop]);

  // Group by framework
  const grouped: Record<string, string[]> = {};
  for (const key of keys) {
    const { framework } = parseCredKey(key);
    if (!grouped[framework]) grouped[framework] = [];
    grouped[framework].push(key);
  }

  // Browser fallback
  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
          <Monitor className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Desktop App Required</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Install the Adl._.Ai Studio desktop app to manage API keys securely in your OS keychain. Credentials are never stored in the cloud.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Credential Manager</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            API keys stored securely in your {getKeychainName(osName)}.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 shrink-0"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Credential
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddCredentialForm
          osName={osName}
          onAdded={() => { loadKeys(); setShowAddForm(false); }}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Credential list */}
      {!loading && keys.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
          <Key className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No credentials stored yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add API keys through the Setup Wizard or the button above.</p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([framework, credKeys]) => (
        <div key={framework} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">
            {framework}
          </h3>
          {credKeys.map((credKey) => (
            <CredentialRow key={credKey} credKey={credKey} onDeleted={loadKeys} />
          ))}
        </div>
      ))}
    </div>
  );
}
