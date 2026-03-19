// Companion Bridge database types

export interface Machine {
  id: string;
  user_id: string;
  machine_label: string;
  os_family: 'windows' | 'macos' | 'linux' | 'wsl2';
  machine_fingerprint: string | null;
  created_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
}

export interface MachineInsert {
  id?: string;
  user_id: string;
  machine_label: string;
  os_family: 'windows' | 'macos' | 'linux' | 'wsl2';
  machine_fingerprint?: string | null;
  created_at?: string;
  last_seen_at?: string | null;
  revoked_at?: string | null;
}

export interface MachineUpdate {
  id?: string;
  user_id?: string;
  machine_label?: string;
  os_family?: 'windows' | 'macos' | 'linux' | 'wsl2';
  machine_fingerprint?: string | null;
  created_at?: string;
  last_seen_at?: string | null;
  revoked_at?: string | null;
}

export interface PairingCode {
  code: string;
  user_id: string;
  expires_at: string;
  consumed_at: string | null;
  consumed_machine_id: string | null;
  created_at: string;
}

export interface PairingCodeInsert {
  code: string;
  user_id: string;
  expires_at: string;
  consumed_at?: string | null;
  consumed_machine_id?: string | null;
  created_at?: string;
}

export interface PairingCodeUpdate {
  code?: string;
  user_id?: string;
  expires_at?: string;
  consumed_at?: string | null;
  consumed_machine_id?: string | null;
  created_at?: string;
}

export type CommandPlanStatus = 'queued' | 'awaiting_approval' | 'running' | 'succeeded' | 'failed' | 'canceled';

export interface CommandPlan {
  id: string;
  project_id: string;
  step_id: string;
  machine_id: string;
  status: CommandPlanStatus;
  created_at: string;
  updated_at: string;
}

export interface CommandPlanInsert {
  id?: string;
  project_id: string;
  step_id: string;
  machine_id: string;
  status?: CommandPlanStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CommandPlanUpdate {
  id?: string;
  project_id?: string;
  step_id?: string;
  machine_id?: string;
  status?: CommandPlanStatus;
  created_at?: string;
  updated_at?: string;
}

export type RiskTier = 'low' | 'medium' | 'high' | 'critical';
export type CommandState = 'queued' | 'sent' | 'received' | 'approved' | 'running' | 'succeeded' | 'failed' | 'skipped';

export interface Command {
  id: string;
  plan_id: string;
  seq: number;
  argv_json: unknown;
  cwd: string | null;
  env_allowlist_json: unknown | null;
  risk_tier: RiskTier;
  requires_approval: boolean;
  state: CommandState;
  exit_code: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommandInsert {
  id?: string;
  plan_id: string;
  seq: number;
  argv_json: unknown;
  cwd?: string | null;
  env_allowlist_json?: unknown | null;
  risk_tier: RiskTier;
  requires_approval?: boolean;
  state?: CommandState;
  exit_code?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommandUpdate {
  id?: string;
  plan_id?: string;
  seq?: number;
  argv_json?: unknown;
  cwd?: string | null;
  env_allowlist_json?: unknown | null;
  risk_tier?: RiskTier;
  requires_approval?: boolean;
  state?: CommandState;
  exit_code?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CommandEventActor = 'web' | 'desktop' | 'user' | 'system';

export interface CommandEvent {
  id: string;
  command_id: string;
  event_type: string;
  actor: CommandEventActor;
  details: unknown | null;
  created_at: string;
}

export interface CommandEventInsert {
  id?: string;
  command_id: string;
  event_type: string;
  actor: CommandEventActor;
  details?: unknown | null;
  created_at?: string;
}

export interface CommandOutput {
  command_id: string;
  output_text: string;
  truncated: boolean;
  created_at: string;
}

export interface CommandOutputInsert {
  command_id: string;
  output_text: string;
  truncated?: boolean;
  created_at?: string;
}
