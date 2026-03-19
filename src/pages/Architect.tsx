import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { type BlueprintIntake, type Blueprint } from "@/lib/generateBlueprint";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Crown, Sparkles, Zap, Shield, TrendingUp, RefreshCw,
  Check, X, ArrowRight, Loader2, Download, Rocket,
} from "lucide-react";

const FEATURE_CARDS = [
  { icon: Sparkles, title: "Personalized Setup Blueprint", desc: "AI analyzes your goals and recommends the optimal architecture." },
  { icon: TrendingUp, title: "Staged Expansion Plans", desc: "Know exactly what to add next and when." },
  { icon: Shield, title: "Credential Strategy", desc: "Which keys to get, in what order, with cost estimates." },
  { icon: RefreshCw, title: "Ongoing Recommendations", desc: "As OpenClaw updates, your blueprint updates too." },
];

const COMPARISON = [
  { feature: "Setup Board", free: true, pro: true },
  { feature: "Step-by-step guidance", free: true, pro: true },
  { feature: "Verification center", free: true, pro: true },
  { feature: "Personalized blueprint", free: false, pro: true },
  { feature: "Credential cost estimates", free: false, pro: true },
  { feature: "Expansion roadmap", free: false, pro: true },
  { feature: "Security recommendations", free: false, pro: true },
  { feature: "Apply blueprint to project", free: false, pro: true },
];

const USE_CASES = ["Personal Assistant", "Customer Support", "Content Creation", "Code Assistant", "Research", "Education", "Automation", "Other"];
const CHANNELS = ["Dashboard", "Telegram", "Discord", "WhatsApp", "Slack"];
const PROVIDERS = ["Anthropic", "OpenAI", "OpenRouter", "Ollama"];
const CAPABILITIES = ["web_search", "image_gen", "code_execution", "automation", "files", "custom"];
const BUDGETS = ["<$10", "$10-30", "$30-70", "$70+", "No limit"];

function UpsellPage({ onCheckout, loading }: { onCheckout: () => void; loading: boolean }) {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center space-y-4">
        <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
          <Crown className="h-3 w-3" /> Premium
        </Badge>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">
          Lumina AI Setup Architect
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Let AI design your perfect OpenClaw setup.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_CARDS.map((f) => (
          <Card key={f.title} className="p-6 border-border bg-card hover:border-primary/50 transition-colors">
            <f.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </Card>
        ))}
      </div>

      {/* Pricing */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-baseline gap-1">
          <span className="font-heading text-5xl font-bold text-foreground">$25</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="text-sm text-muted-foreground">Cancel anytime</p>
        <Button size="lg" className="gradient-primary text-primary-foreground" onClick={onCheckout} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
          Start Lumina Pro
        </Button>
      </div>

      {/* Comparison */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-3 bg-muted/30 px-6 py-3 text-sm font-medium text-muted-foreground">
          <span>Feature</span>
          <span className="text-center">Free</span>
          <span className="text-center">Lumina Pro</span>
        </div>
        {COMPARISON.map((row) => (
          <div key={row.feature} className="grid grid-cols-3 px-6 py-3 border-t border-border text-sm">
            <span className="text-foreground">{row.feature}</span>
            <span className="text-center">{row.free ? <Check className="h-4 w-4 text-[hsl(var(--success))] mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</span>
            <span className="text-center"><Check className="h-4 w-4 text-[hsl(var(--success))] mx-auto" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntakeForm({ onGenerate, generating }: { onGenerate: (intake: BlueprintIntake) => void; generating: boolean }) {
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [channels, setChannels] = useState<string[]>(["dashboard"]);
  const [providers, setProviders] = useState<string[]>([]);
  const [deploymentModel, setDeploymentModel] = useState<"local" | "cloud" | "hybrid">("cloud");
  const [skillLevel, setSkillLevel] = useState<"beginner" | "comfortable" | "advanced">("beginner");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [usage, setUsage] = useState<"personal" | "business">("personal");

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const canGenerate = description && useCase && providers.length > 0 && budget;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">AI Setup Architect</h1>
        <p className="text-muted-foreground mt-1">Tell us about your ideal setup and we'll generate a personalized blueprint.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>What do you want your AI to do?</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your ideal AI assistant setup..." className="min-h-[100px]" />
        </div>

        <div className="space-y-2">
          <Label>Primary use case</Label>
          <Select value={useCase} onValueChange={setUseCase}>
            <SelectTrigger><SelectValue placeholder="Select use case" /></SelectTrigger>
            <SelectContent>{USE_CASES.map((u) => <SelectItem key={u} value={u.toLowerCase().replace(/ /g, "_")}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preferred channels</Label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => {
              const val = ch.toLowerCase();
              const selected = channels.includes(val);
              return (
                <Button key={ch} variant={selected ? "default" : "outline"} size="sm" onClick={() => setChannels(toggleArr(channels, val))}>
                  {ch}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preferred providers</Label>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => {
              const val = p.toLowerCase();
              const selected = providers.includes(val);
              return (
                <Button key={p} variant={selected ? "default" : "outline"} size="sm" onClick={() => setProviders(toggleArr(providers, val))}>
                  {p}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Deployment model</Label>
          <RadioGroup value={deploymentModel} onValueChange={(v) => setDeploymentModel(v as any)} className="flex gap-4">
            {(["local", "cloud", "hybrid"] as const).map((m) => (
              <div key={m} className="flex items-center gap-2">
                <RadioGroupItem value={m} id={m} />
                <Label htmlFor={m} className="capitalize cursor-pointer">{m}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Current skill level</Label>
          <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Desired capabilities</Label>
          <div className="grid grid-cols-2 gap-2">
            {CAPABILITIES.map((cap) => (
              <div key={cap} className="flex items-center gap-2">
                <Checkbox
                  id={cap}
                  checked={capabilities.includes(cap)}
                  onCheckedChange={() => setCapabilities(toggleArr(capabilities, cap))}
                />
                <Label htmlFor={cap} className="capitalize cursor-pointer text-sm">{cap.replace(/_/g, " ")}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Monthly budget comfort</Label>
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger>
            <SelectContent>{BUDGETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Personal or business use</Label>
          <RadioGroup value={usage} onValueChange={(v) => setUsage(v as any)} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal" className="cursor-pointer">Personal</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="business" id="business" />
              <Label htmlFor="business" className="cursor-pointer">Business</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <Button
        size="lg"
        disabled={!canGenerate || generating}
        onClick={() => onGenerate({ description, useCase, channels, providers, deploymentModel, skillLevel, capabilities, budget, usage })}
      >
        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
        {generating ? "Generating..." : "Generate Blueprint"}
      </Button>
    </div>
  );
}

function BlueprintDisplay({ blueprint, onSave, onApply, saving }: {
  blueprint: Blueprint;
  onSave: () => void;
  onApply: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">Your Setup Blueprint</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSave} disabled={saving}>
            <Download className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Blueprint"}
          </Button>
          <Button onClick={onApply} disabled={saving}>
            <ArrowRight className="mr-2 h-4 w-4" /> Apply to Project
          </Button>
        </div>
      </div>

      {/* Architecture */}
      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-heading text-lg font-semibold text-foreground">{blueprint.architecture.title}</h3>
          <Badge variant="outline" className="ml-auto text-xs">{blueprint.architecture.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{blueprint.architecture.description}</p>
      </Card>

      {/* Install order */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Installation Order</h3>
        <div className="space-y-2">
          {blueprint.installOrder.map((s) => (
            <div key={s.step} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{s.step}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{s.estimated}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Credentials */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Required Credentials</h3>
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-4 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Name</span><span>Env Var</span><span>Provider</span><span>Est. Cost</span>
          </div>
          {blueprint.credentials.map((c) => (
            <div key={c.envVar} className="grid grid-cols-4 px-4 py-2.5 border-t border-border text-sm">
              <span className="text-foreground">{c.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{c.envVar}</span>
              <span className="capitalize text-muted-foreground">{c.provider}</span>
              <span className="text-muted-foreground">{c.monthlyCost}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Channel order */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Channel Deployment Order</h3>
        <div className="space-y-2">
          {blueprint.channelOrder.map((ch) => (
            <div key={ch.order} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">{ch.order}</span>
              <span className="font-medium text-foreground text-sm">{ch.channel}</span>
              <span className="text-xs text-muted-foreground ml-auto">{ch.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Security Recommendations</h3>
        <ul className="space-y-1.5">
          {blueprint.security.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Expansion */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Expansion Roadmap</h3>
        <ul className="space-y-1.5">
          {blueprint.expansion.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {e}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Architect() {
  const { isPro, isLoading: subLoading } = useSubscription();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [intake, setIntake] = useState<BlueprintIntake | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleGenerate = async (intakeData: BlueprintIntake) => {
    setIntake(intakeData);
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blueprint", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: intakeData,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBlueprint(data.blueprint);
      toast.success("Blueprint generated!");
    } catch (e: any) {
      toast.error(e?.message === "Active Lumina Pro subscription required"
        ? "An active Lumina Pro subscription is required."
        : "Failed to generate blueprint. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!blueprint || !intake) return;
    setSaving(true);
    try {
      // Get any existing project or use a placeholder
      const { data: projects } = await supabase.from("setup_projects").select("id").limit(1);
      let projectId = projects?.[0]?.id;

      if (!projectId) {
        // Look up OpenClaw framework_id as default
        const { data: fwData } = await (supabase as any).from("frameworks").select("id").eq("slug", "openclaw").single();
        const { data: newProject } = await supabase.from("setup_projects").insert({
          user_id: session!.user.id,
          name: "Blueprint Project",
          mode: "builder",
          framework_id: fwData!.id,
        }).select("id").single();
        projectId = newProject?.id;
      }

      if (projectId) {
        await supabase.from("blueprint_runs").insert({
          project_id: projectId,
          blueprint: { intake, result: blueprint } as any,
        });
        toast.success("Blueprint saved!");
      }
    } catch {
      toast.error("Failed to save blueprint.");
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!blueprint || !intake) return;
    setSaving(true);
    try {
      const { data: fwRow } = await (supabase as any).from("frameworks").select("id").eq("slug", "openclaw").single();
      const { data: project, error } = await supabase.from("setup_projects").insert({
        user_id: session!.user.id,
        name: `Blueprint: ${intake.useCase.replace(/_/g, " ")}`,
        mode: "builder",
        skill_level: intake.skillLevel,
        status: "active",
        framework_id: fwRow!.id,
      }).select("id").single();

      if (error) throw error;
      const projectId = project.id;

      // Insert channels, capabilities, environment
      const channelInserts = intake.channels.map((ch, i) => ({
        project_id: projectId,
        channel: ch,
        is_primary: i === 0,
      }));
      const capInserts = intake.capabilities.map((cap) => ({
        project_id: projectId,
        capability: cap,
      }));

      await Promise.all([
        supabase.from("project_channels").insert(channelInserts),
        supabase.from("project_capabilities").insert(capInserts),
        supabase.from("project_goals").insert({
          project_id: projectId,
          goal: intake.useCase,
          description: intake.description,
        }),
        supabase.from("project_environment").insert({
          project_id: projectId,
          os: intake.deploymentModel === "local" ? "linux" : "cloud",
        }),
        supabase.from("blueprint_runs").insert({
          project_id: projectId,
          blueprint: { intake, result: blueprint } as any,
        }),
      ]);

      toast.success("Project created from blueprint!");
      navigate(`/projects/${projectId}`);
    } catch {
      toast.error("Failed to create project.");
    } finally {
      setSaving(false);
    }
  };

  if (subLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!isPro) {
    return <UpsellPage onCheckout={handleCheckout} loading={checkoutLoading} />;
  }

  if (blueprint) {
    return <BlueprintDisplay blueprint={blueprint} onSave={handleSave} onApply={handleApply} saving={saving} />;
  }

  return <IntakeForm onGenerate={handleGenerate} generating={saving} />;
}
