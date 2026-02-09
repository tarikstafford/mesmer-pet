import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PetSVG } from '@/components/pet-svg';
import type { PetTraits } from '@/lib/traits/types';

// Sample valid pet traits for testing
const validTraits: PetTraits = {
  bodyColor: { h: 200, s: 65, l: 55 },
  patternType: 'striped',
  patternColor: { h: 180, s: 70, l: 50 },
  accessory: 'crown',
  bodySize: 'medium',
  expression: 'happy',
  rarity: 'uncommon',
  traitVersion: 1
};

const minimalTraits: PetTraits = {
  bodyColor: { h: 120, s: 60, l: 50 },
  patternType: 'none',
  accessory: 'none',
  bodySize: 'small',
  expression: 'neutral',
  rarity: 'common',
  traitVersion: 1
};

describe('PetSVG Rendering', () => {
  it('renders an SVG element with correct viewBox', () => {
    const { container } = render(<PetSVG traits={validTraits} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('renders at small size (120x120)', () => {
    const { container } = render(<PetSVG traits={validTraits} size="small" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('120');
  });

  it('renders at medium size (240x240) by default', () => {
    const { container } = render(<PetSVG traits={validTraits} />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('240');
    expect(svg?.getAttribute('height')).toBe('240');
  });

  it('renders at large size (480x480)', () => {
    const { container } = render(<PetSVG traits={validTraits} size="large" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('480');
    expect(svg?.getAttribute('height')).toBe('480');
  });

  it('applies className prop to svg element', () => {
    const { container } = render(<PetSVG traits={validTraits} className="test-class" />);
    const svg = container.querySelector('svg');

    expect(svg?.classList.contains('test-class')).toBe(true);
  });

  it('has accessible aria-label', () => {
    render(<PetSVG traits={validTraits} />);
    const svg = screen.getByRole('img');

    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-label')).toContain('uncommon');
    expect(svg.getAttribute('aria-label')).toContain('happy');
  });
});

describe('PetSVG Fallback Behavior', () => {
  it('renders fallback pet when traits are undefined', () => {
    // Bypass TypeScript to test runtime fallback behavior
    const { container } = render(<PetSVG traits={undefined as any} />);
    const svg = container.querySelector('svg');

    // Should still render without crash
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('renders fallback pet when traits fail validation', () => {
    const invalidTraits = {
      bodyColor: { h: 500, s: 150, l: 200 }, // Invalid HSL ranges
      patternType: 'invalid-pattern',
      accessory: 'invalid-accessory',
      bodySize: 'invalid-size',
      expression: 'invalid-expression',
      rarity: 'invalid-rarity',
      traitVersion: -1
    } as any;

    const { container } = render(<PetSVG traits={invalidTraits} />);
    const svg = container.querySelector('svg');

    // Should still render without crash
    expect(svg).toBeTruthy();
  });

  it('logs warning when using fallback traits', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const invalidTraits = {
      bodyColor: { h: 500, s: 150, l: 200 },
      patternType: 'invalid'
    } as any;

    render(<PetSVG traits={invalidTraits} />);

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Invalid pet traits');

    consoleWarnSpy.mockRestore();
  });

  it('renders fallback pet when showFallback is true', () => {
    const { container } = render(<PetSVG traits={validTraits} showFallback={true} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeTruthy();
    // Fallback traits have 'common' rarity and 'happy' expression
    expect(svg?.getAttribute('aria-label')).toContain('common');
    expect(svg?.getAttribute('aria-label')).toContain('happy');
  });
});

describe('PetSVG Layer Composition', () => {
  it('renders body layer with correct color', () => {
    const { container } = render(<PetSVG traits={validTraits} />);

    // Body layer contains ellipse and circle elements
    const ellipses = container.querySelectorAll('ellipse');
    const circles = container.querySelectorAll('circle');

    expect(ellipses.length).toBeGreaterThan(0);
    expect(circles.length).toBeGreaterThan(0);

    // Check that body color is applied (hsl(200, 65%, 55%))
    const bodyElements = [...Array.from(ellipses), ...Array.from(circles)] as SVGElement[];
    const hasBodyColor = bodyElements.some(el =>
      el.getAttribute('fill')?.includes('hsl(200')
    );
    expect(hasBodyColor).toBe(true);
  });

  it('does not render pattern when type is none', () => {
    const { container } = render(<PetSVG traits={minimalTraits} />);

    // Pattern layer should not add any path elements for stripes
    // Check for pattern-specific elements (paths with stroke for stripes)
    const paths = container.querySelectorAll('path[stroke]');

    // Only expression layer should have paths (for mouth)
    // Pattern layer with type='none' should not add any
    const patternPaths = Array.from(paths).filter(path =>
      path.getAttribute('opacity') === '0.7' // Pattern stripes have opacity 0.7
    );

    expect(patternPaths.length).toBe(0);
  });

  it('does not render accessory when type is none', () => {
    const { container } = render(<PetSVG traits={minimalTraits} />);

    // Accessory layer should not add polygons for horns/crown
    const polygons = container.querySelectorAll('polygon');

    expect(polygons.length).toBe(0);
  });

  it('renders pattern layer when type is striped', () => {
    const { container } = render(<PetSVG traits={validTraits} />);

    // Should have stripe paths with opacity 0.7
    const paths = container.querySelectorAll('path[opacity="0.7"]');

    expect(paths.length).toBeGreaterThan(0);
  });

  it('renders accessory layer when type is crown', () => {
    const { container } = render(<PetSVG traits={validTraits} />);

    // Should have polygon for crown
    const polygons = container.querySelectorAll('polygon');

    expect(polygons.length).toBeGreaterThan(0);

    // Crown is filled with gold color
    const hasCrown = Array.from(polygons).some(polygon =>
      polygon.getAttribute('fill')?.includes('#FFD700')
    );
    expect(hasCrown).toBe(true);
  });
});

describe('PetSVG Three.js Coexistence', () => {
  it('does not import or reference Three.js', async () => {
    // Read the PetSVG.tsx source file to verify no Three.js imports
    const fs = await import('fs');
    const path = await import('path');

    const petSVGPath = path.resolve(__dirname, '../../components/pet-svg/PetSVG.tsx');
    const content = fs.readFileSync(petSVGPath, 'utf-8');

    // Check for Three.js references
    expect(content.toLowerCase()).not.toContain('three');
    expect(content).not.toContain('@react-three');
    expect(content).not.toContain('THREE');
  });
});
