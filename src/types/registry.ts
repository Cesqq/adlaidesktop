export interface ProviderRegistry {
  id: string;
  provider_slug: string;
  provider_name: string;
  provider_type: 'llm' | 'image_gen' | 'video_gen' | 'audio' | 'search' | 'code_exec' | 'vision' | 'scheduling';
  env_var_name: string | null;
  signup_url: string | null;
  pricing_note: string | null;
  supports_capabilities: string[];
  logo_icon: string | null;
  display_order: number;
  created_at: string;
}

export interface CapabilityRegistry {
  id: string;
  capability_slug: string;
  capability_name: string;
  description: string;
  icon: string | null;
  compatible_provider_types: string[];
  display_order: number;
  created_at: string;
}

export interface ProjectCapability {
  id: string;
  project_id: string;
  capability: string;
  notes: string | null;
  provider_slug: string | null;
  model: string | null;
  config_json: Record<string, unknown> | null;
  priority: number;
  created_at: string;
}
