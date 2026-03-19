export type SkillLevel = 'beginner' | 'comfortable' | 'advanced';
export type OS = 'windows' | 'macos' | 'linux';
export type WindowsMode = 'wsl2' | 'powershell';
export type Framework = 'openclaw' | 'zeroclaw' | 'nanobot' | 'nanoclaw' | 'picoclaw';

export interface WizardState {
  framework: Framework | null;
  os: OS | null;
  windowsMode: WindowsMode | null;
  prerequisitesVerified: Record<string, boolean>;
  modelProvider: string | null;
  channels: string[];
}

export const initialWizardState: WizardState = {
  framework: null,
  os: null,
  windowsMode: null,
  prerequisitesVerified: {},
  modelProvider: null,
  channels: [],
};

// Steps: 1=framework, 2=os, 3=prerequisites, 4=llm_provider, 5=channels, 6=review
export function getVisibleSteps(_state: WizardState): number[] {
  return [1, 2, 3, 4, 5, 6];
}
