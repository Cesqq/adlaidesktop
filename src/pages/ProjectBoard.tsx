import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardColumn } from "@/components/board/BoardColumn";
import { MobileColumnTabs } from "@/components/board/MobileColumnTabs";
import { StepDetailPanel } from "@/components/board/StepDetailPanel";
import { LiveOutputDrawer } from "@/components/board/LiveOutputDrawer";
import { HealthMonitorTab } from "@/components/premium/HealthMonitorTab";
import { useProjectBoard, COLUMNS, getNextStatus, type BoardStep, type BoardStatus } from "@/hooks/useProjectBoard";
import { useProjectPlans, useCreatePlan } from "@/hooks/useCommandPlan";
import { useMachines, isOnline } from "@/hooks/useMachines";
import { useCommandRealtime } from "@/hooks/useCommandRealtime";
import { useMachinePresence } from "@/hooks/useMachinePresence";
import { useStepVerification } from "@/hooks/useStepVerification";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { project, steps, isLoading, moveStep } = useProjectBoard(id);
  const { machines } = useMachines();
  const { data: plans } = useProjectPlans(id);
  const createPlan = useCreatePlan();
  const isMobile = useIsMobile();
  const [detailStep, setDetailStep] = useState<BoardStep | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [drawerPlanId, setDrawerPlanId] = useState<string | null>(null);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) ?? null;
  const machineOnline = selectedMachine ? isOnline(selectedMachine) : false;

  // Realtime command state tracking
  const { commandStates, hasFailedPlan } = useCommandRealtime({
    projectId: id,
    plans,
    steps,
    moveStep,
  });

  const hasRunningPlan = Array.from(commandStates.values()).some((s) => s.hasRunning);

  const { onlineMachineIds, connectionLost } = useMachinePresence({
    userId: user?.id,
    selectedMachineId,
    hasRunningPlan,
  });

  // Step verification
  const { results: verifyResults, verifyAllProgress, verifySingle, verifyAll, isDesktop } = useStepVerification({
    onStepPassed: (stepId) => {
      const step = steps.find((s) => s.id === stepId);
      if (step) {
        moveStep.mutate({ stepStatusId: step.id, newStatus: getNextStatus(step.status) });
        toast.success(`${step.title} — verified ✓`);
      }
    },
  });

  const handleVerify = (step: BoardStep) => verifySingle(step);
  const handleVerifyAll = () => {
    verifyAll(steps).then(() => {
      const vp = verifyAllProgress;
      if (vp && !vp.running) {
        const needs = vp.failed;
        toast(
          needs > 0
            ? `${vp.passed}/${vp.total} steps verified. ${needs} need attention.`
            : `All ${vp.total} steps verified! ✓`,
        );
      }
    });
  };
  const handleMarkComplete = (step: BoardStep) => handleAction(step);

  // Plan tracking maps
  const planStatusMap = new Map<string, { status: string; createdAt: string; planId: string }>();
  (plans ?? []).forEach((p) => {
    if (!planStatusMap.has(p.step_id)) {
      planStatusMap.set(p.step_id, { status: p.status, createdAt: p.created_at, planId: p.id });
    }
  });

  const stepPlanMap = new Map<string, string>();
  (plans ?? []).forEach((p) => {
    if (!stepPlanMap.has(p.step_id)) stepPlanMap.set(p.step_id, p.id);
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as BoardStatus;
    const stepStatusId = result.draggableId;
    if (steps.find((s) => s.id === stepStatusId)?.status === newStatus) return;
    moveStep.mutate({ stepStatusId, newStatus });
    toast.success(`Moved to ${COLUMNS.find((c) => c.key === newStatus)?.label}`);
  };

  const handleAction = (step: BoardStep) => {
    const next = getNextStatus(step.status);
    moveStep.mutate({ stepStatusId: step.id, newStatus: next });
    toast.success(`Moved to ${COLUMNS.find((c) => c.key === next)?.label}`);
  };

  const handleAdvance = (step: BoardStep) => {
    handleAction(step);
    setDetailStep(null);
  };

  const handleRunOnMachine = async (step: BoardStep) => {
    if (!selectedMachine || !id) return;
    try {
      const plan = await createPlan.mutateAsync({
        projectId: id,
        stepId: step.step_id,
        machineId: selectedMachine.id,
        stepCode: step.step_code,
      });
      toast.success(`Command plan sent to ${selectedMachine.machine_label}`);
      setDrawerPlanId(plan.id);
    } catch {
      toast.error("Failed to create command plan");
    }
  };

  const handleViewOutput = (step: BoardStep) => {
    const planId = stepPlanMap.get(step.step_id);
    if (planId) setDrawerPlanId(planId);
  };

  const drawerStep = drawerPlanId
    ? steps.find((s) => {
        const plan = (plans ?? []).find((p) => p.id === drawerPlanId);
        return plan && s.step_id === plan.step_id;
      })
    : null;
  const drawerMachine = drawerPlanId
    ? machines.find((m) => {
        const plan = (plans ?? []).find((p) => p.id === drawerPlanId);
        return plan && m.id === plan.machine_id;
      })
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/projects">
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      {connectionLost && selectedMachine && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Connection to <span className="font-semibold">{selectedMachine.machine_label}</span> lost. Commands may still be running on the machine.
        </div>
      )}

      <BoardHeader
        project={project}
        steps={steps}
        selectedMachineId={selectedMachineId}
        onMachineChange={setSelectedMachineId}
        hasFailedPlan={hasFailedPlan}
        onVerifyAll={handleVerifyAll}
        verifyAllProgress={verifyAllProgress}
        isDesktop={isDesktop}
      />

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="health">Health Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          {isMobile ? (
            <MobileColumnTabs
              steps={steps}
              onAction={handleAction}
              onCardClick={setDetailStep}
              selectedMachineId={selectedMachineId}
              selectedMachineOnline={machineOnline}
              stepPlanMap={stepPlanMap}
              planStatusMap={planStatusMap}
              commandStates={commandStates}
              onRunOnMachine={handleRunOnMachine}
              onViewOutput={handleViewOutput}
            />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-6 gap-3 min-h-[400px]">
                {COLUMNS.map((col) => (
                  <BoardColumn
                    key={col.key}
                    columnKey={col.key}
                    label={col.label}
                    color={col.color}
                    steps={steps.filter((s) => s.status === col.key)}
                    onAction={handleAction}
                    onCardClick={setDetailStep}
                    selectedMachineId={selectedMachineId}
                    selectedMachineOnline={machineOnline}
                    stepPlanMap={stepPlanMap}
                    planStatusMap={planStatusMap}
                    commandStates={commandStates}
                    onRunOnMachine={handleRunOnMachine}
                    onViewOutput={handleViewOutput}
                    verifyResults={verifyResults}
                    onVerify={handleVerify}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
              </div>
            </DragDropContext>
          )}
        </TabsContent>

        <TabsContent value="health">
          <HealthMonitorTab />
        </TabsContent>
      </Tabs>

      <StepDetailPanel
        step={detailStep}
        open={!!detailStep}
        onClose={() => setDetailStep(null)}
        onAdvance={handleAdvance}
        projectMode={project.mode}
        selectedMachineId={selectedMachineId}
        selectedMachineOnline={machineOnline}
        activePlanId={detailStep ? stepPlanMap.get(detailStep.step_id) ?? null : null}
        onRunOnMachine={handleRunOnMachine}
        onViewOutput={handleViewOutput}
      />

      <LiveOutputDrawer
        planId={drawerPlanId}
        open={!!drawerPlanId}
        onClose={() => setDrawerPlanId(null)}
        stepTitle={drawerStep?.title}
        machineLabel={drawerMachine?.machine_label}
      />
    </div>
  );
}
