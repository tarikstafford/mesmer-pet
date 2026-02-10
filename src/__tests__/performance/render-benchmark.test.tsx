import { render } from '@testing-library/react';
import React, { Profiler, ProfilerOnRenderCallback } from 'react';
import { generatePetTraits } from '@/lib/traits/generation';
import { AnimatedPetSVG } from '@/components/pet-svg';
import { describe, it, expect } from 'vitest';

/**
 * Performance Benchmark Test Suite
 *
 * Validates PERF-01 through PERF-05 requirements:
 * - PERF-01: Single pet render <16ms (60fps budget)
 * - PERF-02: Trait generation <10ms per pet
 * - PERF-03: 10 simultaneous pets each <16ms
 * - PERF-05: Total page load overhead for 10 pets <100ms
 *
 * Note: jsdom performance timings may be faster than browser.
 * Thresholds are generous enough for both environments.
 */

describe('PERF-01: Single pet rendering', () => {
  it('completes initial mount in under 16ms', () => {
    const renderTimings: number[] = [];
    const traits = generatePetTraits('perf-test-single');

    const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
      renderTimings.push(actualDuration);
    };

    render(
      <Profiler id="single-pet" onRender={onRender}>
        <AnimatedPetSVG petId="perf-test-single" traits={traits} size="medium" />
      </Profiler>
    );

    expect(renderTimings.length).toBeGreaterThan(0);
    expect(Math.max(...renderTimings)).toBeLessThan(16);
  });
});

describe('PERF-02: Trait generation performance', () => {
  it('generates traits in under 10ms per pet', () => {
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      generatePetTraits(`perf-gen-${i}`);
    }

    const elapsed = performance.now() - start;
    const avgPerPet = elapsed / iterations;

    expect(avgPerPet).toBeLessThan(10);
  });
});

describe('PERF-03: Multiple pet rendering', () => {
  it('renders 10 simultaneous pets with each under 16ms', () => {
    const renderTimings: Map<string, number[]> = new Map();

    const pets = Array.from({ length: 10 }, (_, i) => ({
      id: `perf-multi-${i}`,
      traits: generatePetTraits(`perf-multi-${i}`)
    }));

    const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
      if (!renderTimings.has(id)) renderTimings.set(id, []);
      renderTimings.get(id)!.push(actualDuration);
    };

    render(
      <div>
        {pets.map(pet => (
          <Profiler key={pet.id} id={pet.id} onRender={onRender}>
            <AnimatedPetSVG petId={pet.id} traits={pet.traits} size="medium" />
          </Profiler>
        ))}
      </div>
    );

    // Each individual pet should render in under 16ms
    for (const [id, timings] of renderTimings) {
      expect(Math.max(...timings)).toBeLessThan(16);
    }

    // Verify all 10 pets were rendered
    expect(renderTimings.size).toBe(10);
  });
});

describe('PERF-05: Page load overhead', () => {
  it('10 pets add less than 100ms total render overhead', () => {
    const pets = Array.from({ length: 10 }, (_, i) => ({
      id: `perf-load-${i}`,
      traits: generatePetTraits(`perf-load-${i}`)
    }));

    let totalDuration = 0;
    const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
      if (phase === 'mount') {
        totalDuration += actualDuration;
      }
    };

    render(
      <Profiler id="page-load" onRender={onRender}>
        <div>
          {pets.map(pet => (
            <AnimatedPetSVG key={pet.id} petId={pet.id} traits={pet.traits} size="medium" />
          ))}
        </div>
      </Profiler>
    );

    expect(totalDuration).toBeLessThan(100);
  });
});

describe('React.memo optimization', () => {
  it('AnimatedPetSVG is wrapped with React.memo', () => {
    // Verify that AnimatedPetSVG is a memoized component
    // React.memo returns an object with $$typeof symbol
    expect(AnimatedPetSVG).toBeDefined();
    expect(typeof AnimatedPetSVG).toBe('object');

    // Verify it can render without errors
    const traits = generatePetTraits('memo-test');
    const { container } = render(
      <AnimatedPetSVG petId="memo-test" traits={traits} size="medium" />
    );

    // Should render an SVG element inside
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
