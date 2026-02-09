/**
 * Tests for AR/3D rendering components
 * US-TEST-026: Comprehensive test coverage for PetModel3D and ARPetViewer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PetModel3D from '@/components/PetModel3D';
import ARPetViewer from '@/components/ARPetViewer';
import { getPetModelConfig } from '@/lib/petModelConfig';

// Mock @react-three/fiber and @react-three/drei
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div data-testid="three-canvas" data-props={JSON.stringify(props)}>
      {typeof children === 'function' ? children({}) : children}
    </div>
  ),
  useFrame: (callback: any) => {
    // Mock animation frame callback
    return null;
  },
  useThree: () => ({
    gl: {
      xr: {
        enabled: false,
      },
    },
    scene: {},
    camera: {},
  }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Environment: ({ preset, environmentIntensity }: any) => (
    <div data-testid="environment" data-preset={preset} data-intensity={environmentIntensity} />
  ),
  ContactShadows: ({ opacity, scale, blur }: any) => (
    <div data-testid="contact-shadows" data-opacity={opacity} data-scale={scale} data-blur={blur} />
  ),
}));

// Mock Three.js objects
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Color: class MockColor {
      r = 1;
      g = 1;
      b = 1;
      constructor(color?: string | number) {}
      multiplyScalar(s: number) {
        return this;
      }
      lerp(target: any, alpha: number) {
        return this;
      }
      getHexString() {
        return 'cccccc';
      }
    },
    MeshStandardMaterial: class MockMeshStandardMaterial {
      constructor(public props: any) {}
    },
    MeshPhysicalMaterial: class MockMeshPhysicalMaterial {
      constructor(public props: any) {}
    },
    Group: class MockGroup {
      position = { x: 0, y: 0, z: 0 };
      rotation = { x: 0, y: 0, z: 0 };
    },
    ACESFilmicToneMapping: 4,
  };
});

// Mock error logger
vi.mock('@/lib/errorLogger', () => ({
  logARSessionCrash: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('PetModel3D Component', () => {
  describe('Rendering', () => {
    it('renders Three.js canvas', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
    });

    it('renders with default dimensions', () => {
      const { container } = render(<PetModel3D traitNames={['Sky Blue']} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBe('400px');
      expect(wrapper.style.height).toBe('400px');
    });

    it('renders with custom dimensions', () => {
      const { container } = render(
        <PetModel3D traitNames={['Sky Blue']} width={600} height={800} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.width).toBe('600px');
      expect(wrapper.style.height).toBe('800px');
    });

    it('renders OrbitControls', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    });

    it('renders Environment with sunset preset', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      const env = screen.getByTestId('environment');
      expect(env).toHaveAttribute('data-preset', 'sunset');
      expect(env).toHaveAttribute('data-intensity', '0.8');
    });

    it('renders ContactShadows', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      const shadows = screen.getByTestId('contact-shadows');
      expect(shadows).toBeInTheDocument();
      expect(shadows).toHaveAttribute('data-opacity', '0.5');
    });
  });

  describe('Trait Mapping', () => {
    it('applies Sky Blue base color', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      const config = getPetModelConfig(['Sky Blue']);
      expect(config.baseColor).toBe('#87CEEB');
    });

    it('applies Leaf Green base color', () => {
      render(<PetModel3D traitNames={['Leaf Green']} />);
      const config = getPetModelConfig(['Leaf Green']);
      expect(config.baseColor).toBe('#90EE90');
    });

    it('applies Glowing Eyes trait', () => {
      render(<PetModel3D traitNames={['Glowing Eyes']} />);
      const config = getPetModelConfig(['Glowing Eyes']);
      expect(config.hasGlowingEyes).toBe(true);
    });

    it('applies Crystal Horns trait', () => {
      render(<PetModel3D traitNames={['Crystal Horns']} />);
      const config = getPetModelConfig(['Crystal Horns']);
      expect(config.hasCrystalHorns).toBe(true);
    });

    it('applies Rainbow Shimmer trait', () => {
      render(<PetModel3D traitNames={['Rainbow Shimmer']} />);
      const config = getPetModelConfig(['Rainbow Shimmer']);
      expect(config.hasRainbowShimmer).toBe(true);
    });

    it('applies Galaxy Pattern trait', () => {
      render(<PetModel3D traitNames={['Galaxy Pattern']} />);
      const config = getPetModelConfig(['Galaxy Pattern']);
      expect(config.hasGalaxyPattern).toBe(true);
    });

    it('applies Striped Pattern', () => {
      render(<PetModel3D traitNames={['Striped Pattern']} />);
      const config = getPetModelConfig(['Striped Pattern']);
      expect(config.patternType).toBe('striped');
      expect(config.patternColor).toBe('#333333');
    });

    it('applies Spotted Pattern', () => {
      render(<PetModel3D traitNames={['Spotted Pattern']} />);
      const config = getPetModelConfig(['Spotted Pattern']);
      expect(config.patternType).toBe('spotted');
      expect(config.patternColor).toBe('#444444');
    });

    it('handles multiple traits', () => {
      render(<PetModel3D traitNames={['Sky Blue', 'Glowing Eyes', 'Crystal Horns', 'Striped Pattern']} />);
      const config = getPetModelConfig(['Sky Blue', 'Glowing Eyes', 'Crystal Horns', 'Striped Pattern']);
      expect(config.baseColor).toBe('#87CEEB');
      expect(config.hasGlowingEyes).toBe(true);
      expect(config.hasCrystalHorns).toBe(true);
      expect(config.patternType).toBe('striped');
    });

    it('uses default gray for unknown traits', () => {
      render(<PetModel3D traitNames={['Unknown Trait']} />);
      const config = getPetModelConfig(['Unknown Trait']);
      expect(config.baseColor).toBe('#CCCCCC');
    });
  });

  describe('Health States', () => {
    it('renders healthy pet with health=100', () => {
      render(<PetModel3D traitNames={['Sky Blue']} health={100} />);
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
    });

    it('renders sick pet with health=30', () => {
      render(<PetModel3D traitNames={['Sky Blue']} health={30} />);
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
    });

    it('renders critical pet with health=10', () => {
      render(<PetModel3D traitNames={['Sky Blue']} health={10} />);
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
    });

    it('renders with health=0', () => {
      render(<PetModel3D traitNames={['Sky Blue']} health={0} />);
      expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
    });
  });

  describe('AutoRotate', () => {
    it('enables autoRotate by default', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    });

    it('disables autoRotate when prop is false', () => {
      render(<PetModel3D traitNames={['Sky Blue']} autoRotate={false} />);
      expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    });
  });

  describe('Canvas Configuration', () => {
    it('configures camera position and FOV', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      const canvas = screen.getByTestId('three-canvas');
      const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
      expect(props.camera).toEqual({ position: [0, 1.2, 4], fov: 45 });
    });

    it('enables shadows', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      const canvas = screen.getByTestId('three-canvas');
      const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
      expect(props.shadows).toBe(true);
    });

    it('configures performance settings', () => {
      render(<PetModel3D traitNames={['Sky Blue']} />);
      const canvas = screen.getByTestId('three-canvas');
      const props = JSON.parse(canvas.getAttribute('data-props') || '{}');
      expect(props.performance).toEqual({ min: 0.5 });
    });
  });
});

describe('ARPetViewer Component', () => {
  let mockNavigator: any;

  beforeEach(() => {
    // Mock navigator.xr
    mockNavigator = {
      xr: {
        isSessionSupported: vi.fn(),
      },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      wakeLock: {
        request: vi.fn().mockResolvedValue({
          release: vi.fn().mockResolvedValue(undefined),
        }),
      },
    };
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });

    // Mock window APIs
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AR Support Detection', () => {
    it('shows loading state while checking AR support', () => {
      mockNavigator.xr.isSessionSupported.mockReturnValue(new Promise(() => {}));
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Checking AR support...')).toBeInTheDocument();
    });

    it('shows AR supported message when WebXR is available', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });

    it('shows AR not supported message when WebXR is unavailable', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(false);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('AR Not Available')).toBeInTheDocument();
      });
    });

    it('handles AR support check error', async () => {
      mockNavigator.xr.isSessionSupported.mockRejectedValue(new Error('XR error'));
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('AR Not Available')).toBeInTheDocument();
      });
    });

    it('shows AR not available when navigator.xr is missing', async () => {
      const navigatorWithoutXR = { ...mockNavigator };
      delete navigatorWithoutXR.xr;
      Object.defineProperty(global, 'navigator', {
        value: navigatorWithoutXR,
        writable: true,
        configurable: true,
      });

      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('AR Not Available')).toBeInTheDocument();
      });
    });
  });

  describe('UI Rendering', () => {
    it('displays pet name in header', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('AR View: Fluffy')).toBeInTheDocument();
      });
    });

    it('displays close button', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('✕ Close AR')).toBeInTheDocument();
      });
    });

    it('shows 3D preview when AR is supported but not active', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('🚀 Launch AR Session')).toBeInTheDocument();
      });
    });

    it('shows requirements list when AR not supported', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(false);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText(/A mobile device with AR capabilities/)).toBeInTheDocument();
        expect(screen.getByText(/A compatible browser/)).toBeInTheDocument();
        expect(screen.getByText(/Camera permissions enabled/)).toBeInTheDocument();
      });
    });

    it('shows back to dashboard button', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(false);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('AR Session Management', () => {
    it('starts AR session on launch button click', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      const { addBreadcrumb } = await import('@/lib/errorLogger');

      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('🚀 Launch AR Session')).toBeInTheDocument();
      });

      const launchButton = screen.getByText('🚀 Launch AR Session');
      launchButton.click();

      await waitFor(() => {
        expect(addBreadcrumb).toHaveBeenCalledWith(
          'AR session started',
          'ar',
          expect.objectContaining({ petId: 1, userId: 1, petName: 'Fluffy' })
        );
      });
    });

    it('closes AR session and calls onClose', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      const onClose = vi.fn();

      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={onClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('✕ Close AR')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('✕ Close AR');
      closeButton.click();

      expect(onClose).toHaveBeenCalled();
    });

    it('handles AR session start error', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      const { logARSessionCrash } = await import('@/lib/errorLogger');

      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });
  });

  describe('Animation States', () => {
    it('starts with idle animation state', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });

    it('renders with custom health value', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          health={50}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });
  });

  describe('Interaction Callbacks', () => {
    it('accepts onFeed callback', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      const onFeed = vi.fn();
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
          onFeed={onFeed}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });

    it('accepts onChat callback', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      const onChat = vi.fn().mockResolvedValue('Hello!');
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
          onChat={onChat}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });
  });

  describe('Error Display', () => {
    it('shows error message in UI', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(false);
      render(
        <ARPetViewer
          traitNames={['Sky Blue']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('AR Not Available')).toBeInTheDocument();
      });
    });
  });

  describe('Trait Rendering in AR', () => {
    it('renders pet with multiple traits in preview', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={['Sky Blue', 'Glowing Eyes', 'Crystal Horns']}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });

    it('handles empty trait array', async () => {
      mockNavigator.xr.isSessionSupported.mockResolvedValue(true);
      render(
        <ARPetViewer
          traitNames={[]}
          petName="Fluffy"
          petId={1}
          userId={1}
          onClose={vi.fn()}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Ready to View in AR')).toBeInTheDocument();
      });
    });
  });
});

describe('getPetModelConfig', () => {
  describe('Base Colors', () => {
    it('returns Sky Blue color', () => {
      const config = getPetModelConfig(['Sky Blue']);
      expect(config.baseColor).toBe('#87CEEB');
    });

    it('returns Leaf Green color', () => {
      const config = getPetModelConfig(['Leaf Green']);
      expect(config.baseColor).toBe('#90EE90');
    });

    it('returns Sunset Orange color', () => {
      const config = getPetModelConfig(['Sunset Orange']);
      expect(config.baseColor).toBe('#FF8C42');
    });

    it('returns Bubblegum Pink color', () => {
      const config = getPetModelConfig(['Bubblegum Pink']);
      expect(config.baseColor).toBe('#FF69B4');
    });

    it('returns Lavender Purple color', () => {
      const config = getPetModelConfig(['Lavender Purple']);
      expect(config.baseColor).toBe('#E6E6FA');
    });

    it('returns default gray for unknown color', () => {
      const config = getPetModelConfig(['Unknown Color']);
      expect(config.baseColor).toBe('#CCCCCC');
    });
  });

  describe('Pattern Types', () => {
    it('detects striped pattern', () => {
      const config = getPetModelConfig(['Striped Pattern']);
      expect(config.patternType).toBe('striped');
      expect(config.patternColor).toBe('#333333');
    });

    it('detects spotted pattern', () => {
      const config = getPetModelConfig(['Spotted Pattern']);
      expect(config.patternType).toBe('spotted');
      expect(config.patternColor).toBe('#444444');
    });

    it('detects gradient fur', () => {
      const config = getPetModelConfig(['Gradient Fur']);
      expect(config.patternType).toBe('gradient');
      expect(config.patternColor).toBeUndefined();
    });

    it('defaults to no pattern', () => {
      const config = getPetModelConfig(['Sky Blue']);
      expect(config.patternType).toBe('none');
      expect(config.patternColor).toBeUndefined();
    });
  });

  describe('Special Traits', () => {
    it('detects glowing eyes', () => {
      const config = getPetModelConfig(['Glowing Eyes']);
      expect(config.hasGlowingEyes).toBe(true);
    });

    it('detects crystal horns', () => {
      const config = getPetModelConfig(['Crystal Horns']);
      expect(config.hasCrystalHorns).toBe(true);
    });

    it('detects rainbow shimmer', () => {
      const config = getPetModelConfig(['Rainbow Shimmer']);
      expect(config.hasRainbowShimmer).toBe(true);
    });

    it('detects galaxy pattern', () => {
      const config = getPetModelConfig(['Galaxy Pattern']);
      expect(config.hasGalaxyPattern).toBe(true);
    });

    it('defaults all special traits to false', () => {
      const config = getPetModelConfig(['Sky Blue']);
      expect(config.hasGlowingEyes).toBe(false);
      expect(config.hasCrystalHorns).toBe(false);
      expect(config.hasRainbowShimmer).toBe(false);
      expect(config.hasGalaxyPattern).toBe(false);
    });
  });

  describe('Multiple Traits', () => {
    it('combines color and special traits', () => {
      const config = getPetModelConfig(['Sky Blue', 'Glowing Eyes', 'Crystal Horns']);
      expect(config.baseColor).toBe('#87CEEB');
      expect(config.hasGlowingEyes).toBe(true);
      expect(config.hasCrystalHorns).toBe(true);
    });

    it('combines all trait types', () => {
      const config = getPetModelConfig([
        'Leaf Green',
        'Striped Pattern',
        'Glowing Eyes',
        'Crystal Horns',
        'Rainbow Shimmer',
      ]);
      expect(config.baseColor).toBe('#90EE90');
      expect(config.patternType).toBe('striped');
      expect(config.hasGlowingEyes).toBe(true);
      expect(config.hasCrystalHorns).toBe(true);
      expect(config.hasRainbowShimmer).toBe(true);
    });

    it('handles empty trait array', () => {
      const config = getPetModelConfig([]);
      expect(config.baseColor).toBe('#CCCCCC');
      expect(config.patternType).toBe('none');
      expect(config.hasGlowingEyes).toBe(false);
      expect(config.hasCrystalHorns).toBe(false);
      expect(config.hasRainbowShimmer).toBe(false);
      expect(config.hasGalaxyPattern).toBe(false);
    });
  });

  describe('Priority and Overrides', () => {
    it('uses first matching color trait', () => {
      const config = getPetModelConfig(['Sky Blue', 'Leaf Green']);
      expect(config.baseColor).toBe('#87CEEB');
    });

    it('prefers striped over spotted pattern', () => {
      const config = getPetModelConfig(['Striped Pattern', 'Spotted Pattern']);
      expect(config.patternType).toBe('striped');
    });
  });
});
