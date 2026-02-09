'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import seedrandom from 'seedrandom';
import type { PetTraits } from '@/lib/traits/types';
import { loadTraits } from '@/lib/traits/migration';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PetSVG } from './PetSVG';

export interface AnimatedPetSVGProps {
  petId: string;
  traits: PetTraits;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Animated wrapper around PetSVG with breathing, blinking, pause, and accessibility
 * Keeps animation state OUTSIDE PetSVG to preserve React.memo optimization
 *
 * Features:
 * - ANIM-01: Subtle breathing animation (3-4 second cycle)
 * - ANIM-02: Random blinking (3-5 second intervals, 200ms duration)
 * - ANIM-03: Body-size-specific timing (small=2.5s, medium=3.5s, large=4.5s)
 * - ANIM-04: Pause animations when tab inactive
 * - ANIM-05: Disable animations when user prefers reduced motion
 * - ANIM-06: GPU-only animations (transform and opacity)
 * - ANIM-07: Unique phase offset per pet ID (no sync between pets)
 * - PERSIST-01: Validates traits via loadTraits before rendering
 */
export const AnimatedPetSVG: React.FC<AnimatedPetSVGProps> = ({
  petId,
  traits,
  size = 'medium',
  className
}) => {
  // PERSIST-01: Validate and migrate traits before rendering
  const validatedTraits = useMemo(() => loadTraits(traits, petId), [traits, petId]);

  // Page visibility and accessibility hooks
  const isVisible = usePageVisibility();
  const reducedMotion = useReducedMotion();

  // Blink state
  const [isBlinking, setIsBlinking] = useState(false);

  // Ref to track timeout IDs for cleanup
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ANIM-07: Unique animation offset per pet (deterministic from petId)
  const breathingDelay = useMemo(() => {
    const rng = seedrandom(petId);
    // Negative delay starts animation at different point in cycle
    return -(rng() * 3.5);
  }, [petId]);

  // ANIM-03: Body-size-specific breathing duration
  const breathingDuration = useMemo(() => {
    switch (validatedTraits.bodySize) {
      case 'small':
        return 2.5;
      case 'large':
        return 4.5;
      default:
        return 3.5;
    }
  }, [validatedTraits.bodySize]);

  // ANIM-02: Random blink scheduling
  useEffect(() => {
    // Only schedule blinks when visible and motion not reduced
    if (!isVisible || reducedMotion) {
      // Clean up any pending blink
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
        blinkTimeoutRef.current = null;
      }
      setIsBlinking(false);
      return;
    }

    // Recursive scheduling pattern for blinks
    const scheduleBlink = () => {
      // Randomized interval (not deterministic - each blink should be unpredictable)
      const rng = seedrandom(`${petId}-blink-${Date.now()}`);
      const nextBlinkDelay = 3000 + rng() * 2000; // 3-5 seconds

      blinkTimeoutRef.current = setTimeout(() => {
        // Trigger blink
        setIsBlinking(true);

        // Clear blink after 200ms
        const clearBlinkTimeout = setTimeout(() => {
          setIsBlinking(false);
          // Schedule next blink after clearing
          scheduleBlink();
        }, 200);

        // Store the clear timeout for cleanup (will be cleared by next scheduleBlink call)
        blinkTimeoutRef.current = clearBlinkTimeout;
      }, nextBlinkDelay);
    };

    // Start the blink cycle
    scheduleBlink();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
        blinkTimeoutRef.current = null;
      }
    };
  }, [petId, isVisible, reducedMotion]);

  // Determine if animations should be active
  const shouldAnimate = isVisible && !reducedMotion;

  // Build SVG className string (no external cn utility needed)
  let svgClassName = 'pet-svg-animated';
  if (shouldAnimate) {
    svgClassName += ' pet-animate-breathing';
  }
  if (!isVisible && !reducedMotion) {
    // Tab hidden but not reduced motion - pause instead of remove
    svgClassName += ' pet-paused';
  }
  if (isBlinking) {
    svgClassName += ' pet-blinking';
  }

  return (
    <div
      className={className}
      style={{
        // CSS custom properties for animation timing
        '--pet-breathing-duration': `${breathingDuration}s`,
        '--pet-breathing-delay': `${breathingDelay}s`
      } as React.CSSProperties}
    >
      <PetSVG
        traits={validatedTraits}
        size={size}
        className={svgClassName}
      />
    </div>
  );
};
