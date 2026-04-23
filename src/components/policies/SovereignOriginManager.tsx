'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { isStandardSatellite, getOriginFromUrl } from '@/lib/utils/url-utils';

/**
 * SovereignOriginManager - Persists the satellite origin throughout the remediation session.
 */
export function SovereignOriginManager() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const from = searchParams.get('from');
    const referrer = document.referrer;
    
    // 1. Unified Origin Capture
    let detectedOrigin = from || referrer;

    if (isStandardSatellite(detectedOrigin)) {
      const origin = getOriginFromUrl(detectedOrigin);
      if (origin) {
        console.log(`[Sovereign_Sentinel] Mission Anchored: ${origin}`);
        localStorage.setItem('sovereign_return_path', detectedOrigin);
      }
    }
  }, [searchParams]);

  return null;
}
