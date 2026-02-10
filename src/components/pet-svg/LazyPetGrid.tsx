'use client';

import React from 'react';
import { useInView } from 'react-intersection-observer';
import type { PetTraits } from '@/lib/traits/types';
import { AnimatedPetSVG } from './AnimatedPetSVG';

export interface LazyPetItem {
  id: string;
  traits: PetTraits;
}

export interface LazyPetGridProps {
  pets: LazyPetItem[];
  size?: 'small' | 'medium' | 'large';
  columns?: string;  // Tailwind grid class override (default: responsive 1-2-3 cols)
  className?: string;
  renderCard?: (pet: LazyPetItem, petSvg: React.ReactNode) => React.ReactNode;
}

/**
 * Size dimensions mapping for consistent placeholder/content sizing
 */
const SIZE_DIMENSIONS = {
  small: 120,
  medium: 240,
  large: 480
};

/**
 * Inner component for each pet card with viewport culling
 * Uses IntersectionObserver to only render AnimatedPetSVG when in/near viewport
 */
const LazyPetCard = React.memo<{
  pet: LazyPetItem;
  size: 'small' | 'medium' | 'large';
  renderCard?: (pet: LazyPetItem, petSvg: React.ReactNode) => React.ReactNode;
}>(({ pet, size, renderCard }) => {
  // PERF-04: 200px preload margin prevents scroll pop-in
  // triggerOnce: false allows re-culling when scrolled out
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
    triggerOnce: false
  });

  const dimension = SIZE_DIMENSIONS[size];

  // Render either AnimatedPetSVG or placeholder skeleton
  const petSvg = inView ? (
    <AnimatedPetSVG
      petId={pet.id}
      traits={pet.traits}
      size={size}
    />
  ) : (
    // Placeholder skeleton maintains layout when out of view
    <div
      className="bg-gray-100 rounded-lg animate-pulse"
      style={{ width: dimension, height: dimension }}
      aria-hidden="true"
    />
  );

  // If custom renderCard provided, use it; otherwise use default card wrapper
  const cardContent = renderCard ? (
    renderCard(pet, petSvg)
  ) : (
    <div className="bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
      {petSvg}
    </div>
  );

  return (
    <div ref={ref} key={pet.id}>
      {cardContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // Re-render only if pet ID or size changes
  return prevProps.pet.id === nextProps.pet.id && prevProps.size === nextProps.size;
});

LazyPetCard.displayName = 'LazyPetCard';

/**
 * LazyPetGrid - Viewport-culled pet grid for 20+ pet scenarios
 *
 * PERF-04: Only renders AnimatedPetSVG components near viewport
 *
 * Features:
 * - IntersectionObserver-based viewport culling
 * - 200px preload margin (no pop-in during scroll)
 * - Placeholder skeleton maintains layout for off-screen pets
 * - Responsive grid (default 1-2-3 columns, customizable)
 * - Custom card rendering via renderCard prop
 *
 * @param pets - Array of pet items (id + traits)
 * @param size - Pet SVG size (small=120px, medium=240px, large=480px)
 * @param columns - Tailwind grid column class (default: responsive)
 * @param className - Additional CSS classes for grid container
 * @param renderCard - Optional custom card renderer (receives pet and petSvg)
 */
export const LazyPetGrid: React.FC<LazyPetGridProps> = ({
  pets,
  size = 'medium',
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  className = '',
  renderCard
}) => {
  return (
    <div className={`grid ${columns} gap-6 ${className}`}>
      {pets.map((pet) => (
        <LazyPetCard
          key={pet.id}
          pet={pet}
          size={size}
          renderCard={renderCard}
        />
      ))}
    </div>
  );
};
