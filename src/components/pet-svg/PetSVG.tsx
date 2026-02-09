'use client';

import React from 'react';
import type { PetTraits } from '@/lib/traits/types';
import { PetTraitsSchema } from '@/lib/traits/validation';
import { BodyLayer } from './BodyLayer';
import { PatternLayer } from './PatternLayer';
import { AccessoryLayer } from './AccessoryLayer';
import { ExpressionLayer } from './ExpressionLayer';

export interface PetSVGProps {
  traits: PetTraits;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showFallback?: boolean;
}

// Default fallback traits for error states
const DEFAULT_TRAITS: PetTraits = {
  bodyColor: { h: 200, s: 65, l: 55 }, // Pleasant blue
  patternType: 'none',
  patternColor: undefined,
  accessory: 'none',
  bodySize: 'medium',
  expression: 'happy',
  rarity: 'common',
  traitVersion: 1
};

const PetSVGComponent: React.FC<PetSVGProps> = ({
  traits,
  size = 'medium',
  className,
  showFallback = false
}) => {
  // Determine which traits to use (fallback or provided)
  let effectiveTraits = traits;

  try {
    if (showFallback) {
      effectiveTraits = DEFAULT_TRAITS;
    } else {
      // Validate traits with Zod schema
      const validation = PetTraitsSchema.safeParse(traits);

      if (!validation.success) {
        console.warn('Invalid pet traits, using fallback:', validation.error);
        effectiveTraits = DEFAULT_TRAITS;
      }
    }
  } catch (error) {
    console.warn('Error processing pet traits, using fallback:', error);
    effectiveTraits = DEFAULT_TRAITS;
  }

  // Dimension mapping for sizes
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 240, height: 240 },
    large: { width: 480, height: 480 }
  };

  const { width, height } = dimensions[size];

  // Generate accessible aria-label
  const ariaLabel = `A ${effectiveTraits.rarity} pet with ${effectiveTraits.expression} expression`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      {/* Layer order: Body -> Pattern -> Accessory -> Expression (z-index via document order) */}
      <BodyLayer
        color={effectiveTraits.bodyColor}
        size={effectiveTraits.bodySize}
      />
      <PatternLayer
        type={effectiveTraits.patternType}
        color={effectiveTraits.patternColor || effectiveTraits.bodyColor}
        size={effectiveTraits.bodySize}
      />
      <AccessoryLayer
        type={effectiveTraits.accessory}
        size={effectiveTraits.bodySize}
      />
      <ExpressionLayer
        type={effectiveTraits.expression}
        size={effectiveTraits.bodySize}
      />
    </svg>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: PetSVGProps,
  nextProps: PetSVGProps
): boolean => {
  // Compare traits via JSON.stringify (deep comparison for nested color objects)
  const traitsEqual = JSON.stringify(prevProps.traits) === JSON.stringify(nextProps.traits);

  // Compare size directly
  const sizeEqual = prevProps.size === nextProps.size;

  // Compare showFallback
  const showFallbackEqual = prevProps.showFallback === nextProps.showFallback;

  // Skip className comparison (cosmetic, doesn't affect SVG content)
  return traitsEqual && sizeEqual && showFallbackEqual;
};

export const PetSVG = React.memo(PetSVGComponent, arePropsEqual);
