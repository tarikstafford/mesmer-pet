import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LazyPetGrid } from '@/components/pet-svg';
import { generatePetTraits } from '@/lib/traits/generation';
import type { LazyPetItem } from '@/components/pet-svg';

describe('PERF-04: LazyPetGrid viewport culling', () => {
  const generatePets = (count: number): LazyPetItem[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `lazy-test-${i}`,
      traits: generatePetTraits(`lazy-test-${i}`)
    }));

  // Spy on IntersectionObserver to verify it's being used
  let observeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    observeSpy = vi.spyOn(window.IntersectionObserver.prototype, 'observe');
  });

  afterEach(() => {
    observeSpy.mockRestore();
  });

  it('renders a grid container with correct number of child elements', () => {
    const pets = generatePets(25);
    const { container } = render(React.createElement(LazyPetGrid, { pets }));

    // Grid should exist with children for each pet
    const grid = container.firstChild as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.children.length).toBe(25);
  });

  it('creates IntersectionObserver instances for viewport tracking', () => {
    const pets = generatePets(5);
    render(React.createElement(LazyPetGrid, { pets }));

    // IntersectionObserver.observe should have been called for each pet
    expect(observeSpy).toHaveBeenCalled();
    // Should be called at least once (exact count depends on React rendering)
    expect(observeSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('applies correct grid column classes', () => {
    const pets = generatePets(3);
    const { container } = render(
      React.createElement(LazyPetGrid, { pets, columns: 'grid-cols-4' })
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain('grid-cols-4');
  });

  it('renders with custom renderCard function', () => {
    const pets = generatePets(2);
    const renderCard = (pet: LazyPetItem, svg: React.ReactNode) =>
      React.createElement(
        'div',
        { 'data-testid': `custom-card-${pet.id}`, key: pet.id },
        [
          React.createElement('span', { key: 'span' }, pet.id),
          svg
        ]
      );

    render(React.createElement(LazyPetGrid, { pets, renderCard }));

    expect(screen.getByTestId('custom-card-lazy-test-0')).toBeTruthy();
    expect(screen.getByTestId('custom-card-lazy-test-1')).toBeTruthy();
  });

  it('handles empty pets array gracefully', () => {
    const { container } = render(React.createElement(LazyPetGrid, { pets: [] }));
    const grid = container.firstChild as HTMLElement;
    expect(grid.children.length).toBe(0);
  });

  it('renders 20+ pets without error', () => {
    // PERF-04: Must handle 20+ pets
    const pets = generatePets(30);
    const { container } = render(React.createElement(LazyPetGrid, { pets }));

    const grid = container.firstChild as HTMLElement;
    expect(grid.children.length).toBe(30);
  });
});
