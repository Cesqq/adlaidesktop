/**
 * Tauri IPC wrapper with browser fallback.
 *
 * Every function checks isTauri() first. When running in a browser,
 * functions return null so callers can fall back to manual behavior.
 * When running inside Tauri, they call the Rust backend via invoke().
 */
import { invoke, Channel } from "@tauri-apps/api/core";

// ---------------------------------------------------------------------------
// Tauri detection
// ---------------------------------------------------------------------------

/** True when running inside the Tauri desktop shell. */
export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window as any).__TAURI_INTERNALS__
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OsInfo {
  os: string;
  arch: string;
  version: string;
  hostname: string;
}

export interface PrereqResult {
  name: string;
  installed: boolean;
  version?: string | null;
  meets_requirement: boolean;
  error?: string | null;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_bytes: number;
}

export interface HealthStatus {
  agent: string;
  status: "healthy" | "unhealthy" | "unreachable" | "running" | "not_running";
  port?: number;
  pid?: number;
  status_code?: number;
  response_time_ms?: number;
  error?: string;
  checked_at: string;
}

export interface OutputLine {
  stream: "stdout" | "stderr";
  line: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// System commands
// ---------------------------------------------------------------------------

export async function detectOs(): Promise<OsInfo | null> {
  if (!isTauri()) return null;
  return await invoke<OsInfo>("detect_os");
}

export async function checkPrerequisite(
  name: string,
  command: string,
  expectedVersion?: string | null,
): Promise<PrereqResult | null> {
  if (!isTauri()) return null;
  return await invoke<PrereqResult>("check_prerequisite", {
    name,
    command,
    expectedVersion: expectedVersion ?? null,
  });
}

// ---------------------------------------------------------------------------
// CLI execution
// ---------------------------------------------------------------------------

/**
 * Run a command with streaming stdout/stderr output via Tauri Channel.
 * Returns the process exit code.
 */
export async function runCommand(
  command: string,
  args: string[],
  onOutput: (data: OutputLine) => void,
): Promise<number> {
  if (!isTauri()) throw new Error("runCommand requires Tauri desktop app");
  const channel = new Channel<OutputLine>();
  channel.onmessage = onOutput;
  return await invoke<number>("run_command", {
    command,
    args,
    onOutput: channel,
  });
}

/** Start a process detached (fire-and-forget). Returns the PID. */
export async function runCommandDetached(
  command: string,
  args: string[],
): Promise<number> {
  if (!isTauri()) throw new Error("runCommandDetached requires Tauri desktop app");
  return await invoke<number>("run_command_detached", { command, args });
}

/** Kill a process by PID. */
export async function killProcess(pid: number): Promise<void> {
  if (!isTauri()) throw new Error("killProcess requires Tauri desktop app");
  await invoke("kill_process", { pid });
}

/** List running processes matching the given filter names. */
export async function listRunningProcesses(
  filterNames: string[],
): Promise<ProcessInfo[]> {
  if (!isTauri()) return [];
  return await invoke<ProcessInfo[]>("list_running_processes", { filterNames });
}

// ---------------------------------------------------------------------------
// Health checks
// ---------------------------------------------------------------------------

export async function checkAgentHealth(
  agentName: string,
  port?: number | null,
): Promise<HealthStatus | null> {
  if (!isTauri()) return null;
  return await invoke<HealthStatus>("check_agent_health", {
    agentName,
    port: port ?? null,
  });
}

// ---------------------------------------------------------------------------
// Credential management (OS keychain)
// ---------------------------------------------------------------------------

export async function getCredential(key: string): Promise<string | null> {
  if (!isTauri()) return null;
  return await invoke<string | null>("get_credential", { key });
}

export async function setCredential(key: string, value: string): Promise<void> {
  if (!isTauri()) throw new Error("setCredential requires Tauri desktop app");
  await invoke("set_credential", { key, value });
}

export async function deleteCredential(key: string): Promise<void> {
  if (!isTauri()) throw new Error("deleteCredential requires Tauri desktop app");
  await invoke("delete_credential", { key });
}

export async function listCredentials(): Promise<string[]> {
  if (!isTauri()) return [];
  return await invoke<string[]>("list_credentials");
}

// ---------------------------------------------------------------------------
// Tray updates
// ---------------------------------------------------------------------------

export interface TrayAgentInfo {
  name: string;
  status: string;
  pid?: number | null;
}

/** Update the system tray menu with current agent status. */
export async function updateTrayMenu(agents: TrayAgentInfo[]): Promise<void> {
  if (!isTauri()) return;
  await invoke("update_tray_menu", { agents });
}
