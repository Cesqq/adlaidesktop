import { useState, useCallback, useRef } from "react";
import { isTauri, runCommand, type OutputLine } from "./useTauriCommands";
import type { BoardStep } from "./useProjectBoard";

export type VerifyStatus = "idle" | "running" | "passed" | "failed";

export interface VerifyResult {
  status: VerifyStatus;
  output?: string;
  error?: string;
}

export interface VerifyAllProgress {
  running: boolean;
  total: number;
  completed: number;
  passed: number;
  failed: number;
}

/**
 * Hook for running verify_command on kanban board steps.
 * Supports single-step verification and batch "Verify All".
 * In browser mode, all operations are no-ops.
 */
export function useStepVerification(opts: {
  onStepPassed: (stepId: string) => void;
}) {
  const [results, setResults] = useState<Record<string, VerifyResult>>({});
  const [verifyAllProgress, setVerifyAllProgress] = useState<VerifyAllProgress | null>(null);
  const isDesktop = isTauri();
  const abortRef = useRef(false);

  const verifySingle = useCallback(
    async (step: BoardStep): Promise<VerifyResult> => {
      if (!isDesktop || !step.verify_command) {
        return { status: "idle" };
      }

      setResults((prev) => ({ ...prev, [step.id]: { status: "running" } }));

      const outputLines: string[] = [];

      try {
        const exitCode = await runCommand(step.verify_command, [], (data: OutputLine) => {
          outputLines.push(data.line);
        });

        const fullOutput = outputLines.join("\n").trim();

        // Check if output matches expected pattern
        let passed = false;
        if (step.verify_expected) {
          // Case-insensitive substring match
          passed = fullOutput.toLowerCase().includes(step.verify_expected.toLowerCase());
        } else {
          // No expected output defined — pass if exit code is 0
          passed = exitCode === 0;
        }

        const result: VerifyResult = passed
          ? { status: "passed", output: fullOutput }
          : {
              status: "failed",
              output: fullOutput,
              error: step.verify_expected
                ? `Expected "${step.verify_expected}" in output`
                : `Command exited with code ${exitCode}`,
            };

        setResults((prev) => ({ ...prev, [step.id]: result }));

        if (passed) {
          opts.onStepPassed(step.id);
        }

        return result;
      } catch (err: any) {
        const result: VerifyResult = {
          status: "failed",
          error: err.message || "Verification command failed",
          output: outputLines.join("\n").trim() || undefined,
        };
        setResults((prev) => ({ ...prev, [step.id]: result }));
        return result;
      }
    },
    [isDesktop, opts.onStepPassed],
  );

  const verifyAll = useCallback(
    async (steps: BoardStep[]) => {
      if (!isDesktop) return;

      const verifiable = steps.filter(
        (s) => s.verify_command && s.status !== "live",
      );

      if (verifiable.length === 0) return;

      abortRef.current = false;
      const progress: VerifyAllProgress = {
        running: true,
        total: verifiable.length,
        completed: 0,
        passed: 0,
        failed: 0,
      };
      setVerifyAllProgress({ ...progress });

      for (const step of verifiable) {
        if (abortRef.current) break;

        const result = await verifySingle(step);
        progress.completed++;
        if (result.status === "passed") progress.passed++;
        else if (result.status === "failed") progress.failed++;
        setVerifyAllProgress({ ...progress });
      }

      progress.running = false;
      setVerifyAllProgress({ ...progress });
    },
    [isDesktop, verifySingle],
  );

  const cancelVerifyAll = useCallback(() => {
    abortRef.current = true;
  }, []);

  const clearResult = useCallback((stepId: string) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  }, []);

  const clearAllProgress = useCallback(() => {
    setVerifyAllProgress(null);
  }, []);

  return {
    results,
    verifyAllProgress,
    verifySingle,
    verifyAll,
    cancelVerifyAll,
    clearResult,
    clearAllProgress,
    isDesktop,
  };
}
