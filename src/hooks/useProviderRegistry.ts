import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProviderRegistry, CapabilityRegistry } from "@/types/registry";

interface UseProviderRegistryReturn {
  providers: ProviderRegistry[];
  capabilities: CapabilityRegistry[];
  providersBySlug: Record<string, ProviderRegistry>;
  loading: boolean;
}

let cachedProviders: ProviderRegistry[] | null = null;
let cachedCapabilities: CapabilityRegistry[] | null = null;

export function useProviderRegistry(): UseProviderRegistryReturn {
  const [providers, setProviders] = useState<ProviderRegistry[]>(cachedProviders ?? []);
  const [capabilities, setCapabilities] = useState<CapabilityRegistry[]>(cachedCapabilities ?? []);
  const [loading, setLoading] = useState(!cachedProviders);

  useEffect(() => {
    if (cachedProviders && cachedCapabilities) return;

    const fetch = async () => {
      const [provRes, capRes] = await Promise.all([
        supabase.from('provider_registry').select('*').order('display_order'),
        supabase.from('capability_registry').select('*').order('display_order'),
      ]);

      const p = (provRes.data ?? []) as unknown as ProviderRegistry[];
      const c = (capRes.data ?? []) as unknown as CapabilityRegistry[];
      cachedProviders = p;
      cachedCapabilities = c;
      setProviders(p);
      setCapabilities(c);
      setLoading(false);
    };
    fetch();
  }, []);

  const providersBySlug = useMemo(() => {
    const map: Record<string, ProviderRegistry> = {};
    for (const p of providers) map[p.provider_slug] = p;
    return map;
  }, [providers]);

  return { providers, capabilities, providersBySlug, loading };
}
