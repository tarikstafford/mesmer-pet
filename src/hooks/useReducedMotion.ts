'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that returns a boolean indicating whether the user prefers reduced motion
 * Used to disable animations for accessibility (respects user OS preferences)
 *
 * @returns true if user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
  // SSR-safe initialization
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false; // Default to animations enabled on server
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers support addEventListener on MediaQueryList
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
