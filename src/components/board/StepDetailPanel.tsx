import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ArrowRight, Check, Clock, AlertTriangle, ChevronDown, ExternalLink, SkipForward, CircleCheck, Circle, Terminal, Eye } from "lucide-react";
import { type BoardStep, COLUMNS, getNextStatus, CATEGORY_COLORS } from "@/hooks/useProjectBoard";
import { STEP_CONTENT } from "@/data/stepContent";
import { CommandBlock } from "./CommandBlock";

interface Props {
  step: BoardStep | null;
  open: boolean;
  onClose: () => void;
  onAdvance: (step: BoardStep) => void;
  projectMode?: string;
  selectedMachineId?: string | null;
  selectedMachineOnline?: boolean;
  activePlanId?: string | null;
  onRunOnMachine?: (step: BoardStep) => void;
  onViewOutput?: (step: BoardStep) => void;
}

export function StepDetailPanel({ step, open, onClose, onAdvance, projectMode, selectedMachineId, selectedMachineOnline, activePlanId, onRunOnMachine, onViewOutput }: Props) {
  const [verified, setVerified] = useState(false);
  const [stuckOpen, setStuckOpen] = useState(false);

  if (!step) return null;

  const col = COLUMNS.find((c) => c.key === step.status);
  const isLive = step.status === "live";
  const nextStatus = getNextStatus(step.status);
  const nextCol = COLUMNS.find((c) => c.key === nextStatus);
  const content = STEP_CONTENT[step.step_code];
  const canRun = !!selectedMachineId && !!selectedMachineOnline && !activePlanId;
  const catColor = CATEGORY_COLORS[step.category] ?? { bg: "rgba(100,100,100,0.15)", text: "#999" };

  const actionLabel: Record<string, string> = {
    plan: "Start",
    ready: "Begin Setup",
    needs_info: "Add Info",
    setup: "Continue",
    validate: "Verify & Complete",
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setVerified(false); setStuckOpen(false); } }}>
      <SheetContent className="sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {step.title}
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: col?.color, color: col?.color }}
            >
              {col?.label}
            </Badge>
          </SheetTitle>
          <SheetDescription className="sr-only">Step details for {step.title}</SheetDescription>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{ backgroundColor: catColor.bg, color: catColor.text }}
            >
              {step.category}
            </span>
            {step.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{step.estimated_minutes} min
              </span>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Framework step description */}
            {step.description && (
              <section>
                <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </section>
            )}

            {/* Verify command from framework_setup_steps */}
            {step.verify_command && (
              <section>
                <h4 className="text-sm font-semibold text-foreground mb-2">Verify This Step</h4>
                <CommandBlock label="Run this command" command={step.verify_command} />
                {step.verify_expected && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 font-medium text-foreground">Expected:</span>
                    <span>{step.verify_expected}</span>
                  </div>
                )}
              </section>
            )}

            {content && (
              <section>
                <h4 className="text-sm font-semibold text-foreground mb-2">Why It Matters</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{content.whyItMatters}</p>
              </section>
            )}

            {content && (
              <section>
                <h4 className="text-sm font-semibold text-foreground mb-2">Instructions</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                  {content.instructions.map((inst, i) => (
                    <li key={i} className="leading-relaxed">{inst}</li>
                  ))}
                </ol>

                {content.commands && (
                  <div className="mt-3 space-y-2">
                    {content.commands.map((c, i) => (
                      <CommandBlock key={i} label={c.label} command={c.cmd} />
                    ))}
                  </div>
                )}

                {content.tabs && (
                  <Tabs defaultValue={content.tabs[0].name} className="mt-3">
                    <TabsList className="bg-muted/50">
                      {content.tabs.map((t) => (
                        <TabsTrigger key={t.name} value={t.name} className="text-xs">
                          {t.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {content.tabs.map((t) => (
                      <TabsContent key={t.name} value={t.name} className="space-y-2 mt-2">
                        {t.commands.map((c, i) => (
                          <CommandBlock key={i} label={c.label} command={c.cmd} />
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </section>
            )}

            {content?.verification && (
              <section>
                <h4 className="text-sm font-semibold text-foreground mb-2">Verify This Step</h4>
                <CommandBlock label="Run this command" command={content.verification.command} />
                <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 font-medium text-foreground">Expected:</span>
                  <span>{content.verification.expectedOutput}</span>
                </div>
                <button
                  onClick={() => setVerified(!verified)}
                  className="mt-3 flex items-center gap-2 text-sm transition-colors"
                  style={{ color: verified ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}
                >
                  {verified ? <CircleCheck className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {verified ? "Verified — looks good!" : "I've verified this step"}
                </button>
              </section>
            )}

            {content?.commonIssues && (
              <Collapsible open={stuckOpen} onOpenChange={setStuckOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-warning hover:text-warning/80 transition-colors">
                  <AlertTriangle className="h-4 w-4" />
                  I'm Stuck
                  <ChevronDown className={`h-3 w-3 transition-transform ${stuckOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Common Issues</h4>
                  <ul className="space-y-2">
                    {content.commonIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://docs.openclaw.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                  >
                    OpenClaw Documentation <ExternalLink className="h-3 w-3" />
                  </a>
                </CollapsibleContent>
              </Collapsible>
            )}

            {!content && (
              <p className="text-sm text-muted-foreground">Complete this setup step to continue.</p>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="shrink-0 border-t border-border px-6 py-4 space-y-2">
          {!isLive && (
            <Button className="w-full" onClick={() => onAdvance(step)}>
              {step.status === "validate" ? (
                <><Check className="mr-2 h-4 w-4" /> Mark Complete</>
              ) : (
                <><ArrowRight className="mr-2 h-4 w-4" /> {actionLabel[step.status] ?? "Next"}</>
              )}
            </Button>
          )}

          {/* Run on Machine */}
          {!isLive && onRunOnMachine && (
            <Button
              variant="outline"
              className="w-full"
              disabled={!canRun}
              onClick={() => onRunOnMachine(step)}
            >
              <Terminal className="mr-2 h-4 w-4" /> Run on Machine
            </Button>
          )}

          {/* View Output */}
          {activePlanId && onViewOutput && (
            <Button
              variant="ghost"
              className="w-full text-primary"
              onClick={() => onViewOutput(step)}
            >
              <Eye className="mr-2 h-4 w-4" /> View Output
            </Button>
          )}

          {isLive && (
            <div className="flex items-center justify-center gap-2 py-2" style={{ color: "hsl(var(--success))" }}>
              <Check className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
          )}

          {!isLive && projectMode === "builder" && (
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => onAdvance(step)}>
              <SkipForward className="mr-2 h-4 w-4" /> Skip
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
