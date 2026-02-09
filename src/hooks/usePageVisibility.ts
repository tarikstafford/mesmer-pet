'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that returns a boolean indicating whether the browser tab is visible/active
 * Used to pause animations when the tab is inactive (battery saving)
 *
 * @returns true if the page is visible, false otherwise
 */
export function usePageVisibility(): boolean {
  // SSR-safe initialization
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document !== 'undefined') {
      return !document.hidden;
    }
    return true; // Default to visible on server
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
