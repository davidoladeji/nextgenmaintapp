'use client';

import { useEffect } from 'react';
import { usePlatformSettings } from '@/lib/store';

/**
 * Client component that loads platform settings on app start
 * and applies accent colors to CSS variables
 */
export default function PlatformSettingsLoader() {
  const { loadSettings } = usePlatformSettings();

  useEffect(() => {
    // Load platform settings on mount
    loadSettings().catch((error) => {
      console.error('Failed to load platform settings on app start:', error);
    });
  }, [loadSettings]);

  return null; // This component doesn't render anything
}
