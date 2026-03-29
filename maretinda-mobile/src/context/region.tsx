import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getRegions } from '@/lib/products';
import { getRegionId, setRegionId } from '@/lib/storage';
import type { Region } from '@/types';

interface RegionContextType {
  region: Region | null;
  regions: Region[];
  setRegion: (region: Region) => Promise<void>;
}

const RegionContext = createContext<RegionContextType | null>(null);

const DEFAULT_REGION_CODE =
  process.env.EXPO_PUBLIC_DEFAULT_REGION || 'ph';

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegionState] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    getRegions().then(async (all) => {
      setRegions(all);
      const savedId = await getRegionId();
      const saved = all.find((r: Region) => r.id === savedId);
      if (saved) {
        setRegionState(saved);
        return;
      }
      // Default to PH region
      const defaultRegion = all.find((r: Region) =>
        r.countries?.some((c) => c.iso_2 === DEFAULT_REGION_CODE),
      ) ?? all[0];
      if (defaultRegion) {
        setRegionState(defaultRegion);
        await setRegionId(defaultRegion.id);
      }
    });
  }, []);

  const setRegion = useCallback(async (r: Region) => {
    setRegionState(r);
    await setRegionId(r.id);
  }, []);

  return (
    <RegionContext.Provider value={{ region, regions, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within RegionProvider');
  return ctx;
}
