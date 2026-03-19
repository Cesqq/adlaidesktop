import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { FrameworkStep } from "@/components/wizard/steps/FrameworkStep";
import { EnvironmentStep } from "@/components/wizard/steps/EnvironmentStep";
import { PrerequisitesStep } from "@/components/wizard/steps/PrerequisitesStep";
import { LLMProviderStep } from "@/components/wizard/steps/LLMProviderStep";
import { MessagingChannelStep } from "@/components/wizard/steps/MessagingChannelStep";
import { ReviewStep } from "@/components/wizard/steps/ReviewStep";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type WizardState,
  type Framework,
  initialWizardState,
  getVisibleSteps,
} from "@/types/wizard";

const stepLabels: Record<number, string> = {
  1: "Framework",
  2: "Environment",
  3: "Prerequisites",
  4: "AI Provider",
  5: "Channels",
  6: "Review",
};

export default function NewProject() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<WizardState>(() => {
    const fw = searchParams.get("framework") as Framework | null;
    const validFrameworks: Framework[] = ["openclaw", "zeroclaw", "nanobot"];
    if (fw && validFrameworks.includes(fw)) {
      return { ...initialWizardState, framework: fw };
    }
    return initialWizardState;
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const fw = searchParams.get("framework") as Framework | null;
    const validFrameworks: Framework[] = ["openclaw", "zeroclaw", "nanobot"];
    return fw && validFrameworks.includes(fw) ? 1 : 0;
  });
  const [direction, setDirection] = useState(1);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const visibleSteps = getVisibleSteps(state);
  const currentStep = visibleSteps[currentStepIndex] ?? 1;
  const isLast = currentStepIndex === visibleSteps.length - 1;
  const isFirst = currentStepIndex === 0;

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return !!state.framework;
      case 2: return !!state.os && (state.os !== "windows" || !!state.windowsMode);
      case 3: return true; // Prerequisites are optional to verify
      case 4: return !!state.modelProvider;
      case 5: return true; // Channels are optional
      case 6: return true;
      default: return false;
    }
  };

  const next = () => {
    if (!canProceed()) return;
    setDirection(1);
    setCurrentStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  };

  const back = () => {
    setDirection(-1);
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
  };

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const createProject = async () => {
    if (!user || !state.framework) return;
    setCreating(true);
    try {
      // Look up framework_id from slug
      const { data: fwRow, error: fwErr } = await (supabase as any)
        .from("frameworks")
        .select("id")
        .eq("slug", state.framework)
        .single();
      if (fwErr || !fwRow) throw new Error("Framework not found");

      // Create project
      const { data: project, error: projErr } = await supabase
        .from("setup_projects")
        .insert({
          user_id: user.id,
          mode: "simple",
          status: "active",
          framework_id: fwRow.id,
        } as any)
        .select()
        .single();
      if (projErr) throw projErr;

      // Insert child records in parallel
      const promises: PromiseLike<any>[] = [];

      // Environment
      if (state.os) {
        promises.push(
          supabase
            .from("project_environment")
            .insert({
              project_id: project.id,
              os: state.os,
              windows_mode: state.os === "windows" ? state.windowsMode : null,
            })
            .then()
        );
      }

      // Channels
      if (state.channels.length > 0) {
        promises.push(
          supabase
            .from("project_channels")
            .insert(
              state.channels.map((ch, i) => ({
                project_id: project.id,
                channel: ch,
                is_primary: i === 0,
              }))
            )
            .then()
        );
      }

      await Promise.all(promises);

      // Copy framework_setup_steps into project_step_status
      const { data: rawFwSteps } = await (supabase as any)
        .from("framework_setup_steps")
        .select("*")
        .eq("framework_id", fwRow.id)
        .order("sort_order");
      const fwSteps = (rawFwSteps ?? []) as any[];

      if (fwSteps.length > 0) {
        const stepStatusRows = fwSteps.map((fs: any) => ({
          project_id: project.id,
          step_id: fs.id,
          status: fs.column_name,
        }));
        await supabase.from("project_step_status").insert(stepStatusRows);
      }

      toast.success("Setup project created!");
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <FrameworkStep value={state.framework} onChange={(v) => update("framework", v)} />;
      case 2:
        return (
          <EnvironmentStep
            os={state.os}
            windowsMode={state.windowsMode}
            onOsChange={(v) => update("os", v)}
            onWindowsModeChange={(v) => update("windowsMode", v)}
          />
        );
      case 3:
        return (
          <PrerequisitesStep
            frameworkSlug={state.framework!}
            os={state.os}
            verified={state.prerequisitesVerified}
            onVerifiedChange={(v) => update("prerequisitesVerified", v)}
          />
        );
      case 4:
        return (
          <LLMProviderStep
            frameworkSlug={state.framework!}
            value={state.modelProvider}
            onChange={(v) => update("modelProvider", v)}
          />
        );
      case 5:
        return (
          <MessagingChannelStep
            frameworkSlug={state.framework!}
            value={state.channels}
            onChange={(v) => update("channels", v)}
          />
        );
      case 6:
        return <ReviewStep state={state} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-heading text-3xl font-bold text-foreground">New Project</h1>

      <WizardProgress
        currentStep={currentStepIndex + 1}
        totalSteps={visibleSteps.length}
        stepLabels={visibleSteps.map((s) => stepLabels[s])}
      />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between pt-4">
        {!isFirst ? (
          <Button variant="ghost" onClick={back}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        ) : (
          <div />
        )}

        {isLast ? (
          <Button
            onClick={createProject}
            disabled={creating || !canProceed()}
            className="gradient-primary text-primary-foreground"
          >
            <Rocket className="mr-2 h-4 w-4" />
            {creating ? "Creating…" : "Create Setup Project"}
          </Button>
        ) : (
          <Button onClick={next} disabled={!canProceed()} className="gradient-primary text-primary-foreground">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
