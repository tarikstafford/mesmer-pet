import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock next/dynamic to avoid Three.js issues
vi.mock('next/dynamic', () => ({
  default: (importFn: any, options?: any) => {
    const Component = ({ traitNames, health }: { traitNames: string[]; health: number }) => (
      <div data-testid="pet-model-3d" data-trait-names={traitNames.join(',')} data-health={health}>
        Mocked 3D Model
      </div>
    )
    return Component
  },
}))

// Import after mocks
import BreedingPage from '@/app/breed/page'

describe('BreedingInterface Component', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }

  const mockSearchParams = {
    get: vi.fn(),
  }

  // Mock localStorage
  const mockLocalStorage = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      clear: () => {
        store = {}
      },
    }
  })()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    mockLocalStorage.setItem('authToken', 'test-token')

    global.localStorage = mockLocalStorage as any
    global.fetch = vi.fn()
    global.alert = vi.fn()

    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSearchParams as any).mockReturnValue(mockSearchParams)

    // Default mock for searchParams.get
    mockSearchParams.get.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Loading State', () => {
    it('should display loading spinner while fetching pets', () => {
      ;(global.fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<BreedingPage />)

      expect(screen.getByText('Loading your pets...')).toBeInTheDocument()
    })

    it('should show loading spinner with correct styling', () => {
      ;(global.fetch as any).mockImplementation(() => new Promise(() => {}))

      render(<BreedingPage />)

      const loadingText = screen.getByText('Loading your pets...')
      expect(loadingText).toHaveClass('text-gray-600', 'font-medium', 'text-lg')
    })
  })

  describe('Pet Fetching', () => {
    it('should fetch pets from API on mount', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: [] }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pets', {
          headers: {
            Authorization: 'Bearer test-token',
          },
        })
      })
    })

    it('should display error message when pet fetch fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load your pets')).toBeInTheDocument()
      })
    })

    it('should handle network error during pet fetch', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      render(<BreedingPage />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
        expect(screen.getByText('Failed to load your pets')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })
  })

  describe('Not Enough Pets Warning', () => {
    it('should show warning when user has 0 pets', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: [] }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.getByText('Not Enough Pets')).toBeInTheDocument()
        expect(screen.getByText(/You need at least 2 pets to breed/)).toBeInTheDocument()
      })
    })

    it('should show warning when user has 1 pet', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pets: [
            {
              id: 'pet-1',
              name: 'Solo',
              generation: 1,
              health: 100,
              hunger: 20,
              happiness: 80,
              energy: 70,
              createdAt: new Date().toISOString(),
              petTraits: [],
            },
          ],
        }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.getByText('Not Enough Pets')).toBeInTheDocument()
      })
    })

    it('should not show warning when user has 2 or more pets', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pets: [
            {
              id: 'pet-1',
              name: 'Pet 1',
              generation: 1,
              health: 100,
              createdAt: new Date().toISOString(),
              petTraits: [],
            },
            {
              id: 'pet-2',
              name: 'Pet 2',
              generation: 1,
              health: 100,
              createdAt: new Date().toISOString(),
              petTraits: [],
            },
          ],
        }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.queryByText('Not Enough Pets')).not.toBeInTheDocument()
      })
    })
  })

  describe('Parent Selection', () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        generation: 1,
        health: 100,
        hunger: 20,
        happiness: 80,
        energy: 70,
        friendliness: 75,
        energyTrait: 60,
        curiosity: 70,
        patience: 65,
        playfulness: 80,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days old
        petTraits: [
          {
            trait: {
              id: 'trait-1',
              traitName: 'Blue Eyes',
              traitType: 'visual',
              rarity: 'common',
            },
          },
        ],
      },
      {
        id: 'pet-2',
        name: 'Sparkle',
        generation: 1,
        health: 90,
        hunger: 30,
        happiness: 70,
        energy: 80,
        friendliness: 85,
        energyTrait: 70,
        curiosity: 80,
        patience: 75,
        playfulness: 70,
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days old
        petTraits: [
          {
            trait: {
              id: 'trait-2',
              traitName: 'Pink Fur',
              traitType: 'visual',
              rarity: 'rare',
            },
          },
        ],
      },
    ]

    it('should render parent selection dropdowns', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.getByText('Parent 1')).toBeInTheDocument()
        expect(screen.getByText('Parent 2')).toBeInTheDocument()
      })
    })

    it('should populate dropdowns with available pets', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const fluffyOptions = screen.getAllByText('Fluffy (Gen 1)')
        const sparkleOptions = screen.getAllByText('Sparkle (Gen 1)')
        // Should appear in both parent dropdowns
        expect(fluffyOptions.length).toBeGreaterThan(0)
        expect(sparkleOptions.length).toBeGreaterThan(0)
      })
    })

    it('should allow selecting parent 1', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const parent1Select = selects[0]
        fireEvent.change(parent1Select, { target: { value: 'pet-1' } })

        expect(parent1Select).toHaveValue('pet-1')
      })
    })

    it('should allow selecting parent 2', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const parent2Select = selects[1]
        fireEvent.change(parent2Select, { target: { value: 'pet-2' } })

        expect(parent2Select).toHaveValue('pet-2')
      })
    })

    it('should prevent selecting same pet for both parents', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const parent1Select = selects[0]
        const parent2Select = selects[1]

        fireEvent.change(parent1Select, { target: { value: 'pet-1' } })

        // Parent 2 dropdown should not include pet-1
        const parent2Options = Array.from(parent2Select.querySelectorAll('option'))
        const hasPet1Option = parent2Options.some(opt => (opt as HTMLOptionElement).value === 'pet-1')

        expect(hasPet1Option).toBe(false)
      })
    })

    it('should display pet details for selected parent 1', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
      })

      await waitFor(() => {
        expect(screen.getByText('100/100')).toBeInTheDocument() // Health display
        expect(screen.getByText(/8 days/)).toBeInTheDocument() // Age
        expect(screen.getByText('Gen 1')).toBeInTheDocument() // Generation
      })
    })

    it('should display 3D model for selected parents', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: mockPets }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const models = screen.getAllByTestId('pet-model-3d')
        expect(models).toHaveLength(2)
        expect(models[0]).toHaveAttribute('data-trait-names', 'Blue Eyes')
        expect(models[1]).toHaveAttribute('data-trait-names', 'Pink Fur')
      })
    })

    it('should disable dropdowns when less than 2 pets', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          pets: [mockPets[0]], // Only 1 pet
        }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects[0]).toBeDisabled()
        expect(selects[1]).toBeDisabled()
      })
    })
  })

  describe('Breeding Compatibility Check', () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        generation: 1,
        health: 100,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        petTraits: [],
      },
      {
        id: 'pet-2',
        name: 'Sparkle',
        generation: 1,
        health: 90,
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        petTraits: [],
      },
    ]

    it('should check breeding compatibility when both parents selected', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/pets/check-breeding?parent1Id=pet-1&parent2Id=pet-2',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer test-token',
            },
          })
        )
      })
    })

    it('should display compatibility score when pets can breed', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        expect(screen.getByText('85/100')).toBeInTheDocument()
        expect(screen.getByText('Excellent')).toBeInTheDocument()
        expect(screen.getByText('These pets can breed!')).toBeInTheDocument()
      })
    })

    it('should display correct compatibility labels', async () => {
      const testCases = [
        { score: 85, label: 'Excellent' },
        { score: 65, label: 'Good' },
        { score: 45, label: 'Fair' },
        { score: 25, label: 'Poor' },
      ]

      for (const { score, label } of testCases) {
        ;(global.fetch as any)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ pets: mockPets }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              canBreed: true,
              compatibility: score,
              parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
              parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
            }),
          })

        const { unmount } = render(<BreedingPage />)

        await waitFor(() => {
          const selects = screen.getAllByRole('combobox')
          fireEvent.change(selects[0], { target: { value: 'pet-1' } })
          fireEvent.change(selects[1], { target: { value: 'pet-2' } })
        })

        await waitFor(() => {
          expect(screen.getByText(label)).toBeInTheDocument()
        })

        unmount()
        vi.clearAllMocks()
      }
    })

    it('should show error message when pets cannot breed', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: false,
            reason: 'Pets are too young to breed',
            compatibility: 50,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 5 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 6 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const errorText = screen.getByText('Pets are too young to breed')
        expect(errorText).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should hide breeding form when pets cannot breed', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: false,
            reason: 'Health too low',
            compatibility: 30,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 40, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter a name...')).not.toBeInTheDocument()
      })
    })

    it('should handle breeding check API error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: false,
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
        expect(screen.getByText('Failed to check breeding eligibility')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })
  })

  describe('Breeding Form', () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        generation: 1,
        health: 100,
        createdAt: new Date().toISOString(),
        petTraits: [],
      },
      {
        id: 'pet-2',
        name: 'Sparkle',
        generation: 1,
        health: 90,
        createdAt: new Date().toISOString(),
        petTraits: [],
      },
    ]

    it('should show offspring name input when pets can breed', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter a name...')).toBeInTheDocument()
      })
    })

    it('should allow entering offspring name', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...') as HTMLInputElement
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
        expect(nameInput.value).toBe('Baby Fluffy')
      })
    })

    it('should enforce max length of 50 characters for offspring name', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...') as HTMLInputElement
        expect(nameInput).toHaveAttribute('maxLength', '50')
      })
    })

    it('should disable breed button when offspring name is empty', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const breedButton = screen.getByText('🐣 Breed Pets').closest('button')
        expect(breedButton).toBeDisabled()
      })
    })

    it('should enable breed button when offspring name is provided', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      await waitFor(() => {
        const breedButton = screen.getByText('🐣 Breed Pets').closest('button')
        expect(breedButton).not.toBeDisabled()
      })
    })

    it('should disable breed button when breeding is in progress', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockImplementation(() => new Promise(() => {})) // Never resolves to keep in loading state

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        expect(screen.getByText('Breeding...')).toBeInTheDocument()
        expect(breedButton).toBeDisabled()
      })
    })

    it('should show loading spinner when breeding', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockImplementation(() => new Promise(() => {}))

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        expect(screen.getByText('Breeding...')).toBeInTheDocument()
      })
    })
  })

  describe('Breeding Execution', () => {
    const mockPets = [
      {
        id: 'pet-1',
        name: 'Fluffy',
        generation: 1,
        health: 100,
        createdAt: new Date().toISOString(),
        petTraits: [],
      },
      {
        id: 'pet-2',
        name: 'Sparkle',
        generation: 1,
        health: 90,
        createdAt: new Date().toISOString(),
        petTraits: [],
      },
    ]

    it('should call breed API with correct parameters', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            offspring: {
              id: 'offspring-1',
              name: 'Baby Fluffy',
              generation: 2,
            },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/pets/breed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            parent1Id: 'pet-1',
            parent2Id: 'pet-2',
            offspringName: 'Baby Fluffy',
          }),
        })
      })
    })

    it('should trim whitespace from offspring name before submitting', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            offspring: { id: 'offspring-1', name: 'Baby', generation: 2 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: '  Baby  ' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        const call = (global.fetch as any).mock.calls.find(
          (call: any) => call[0] === '/api/pets/breed'
        )
        const body = JSON.parse(call[1].body)
        expect(body.offspringName).toBe('Baby')
      })
    })

    it('should show success alert and redirect on successful breeding', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            offspring: {
              id: 'offspring-1',
              name: 'Baby Fluffy',
              generation: 2,
            },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Success! Baby Fluffy was born!')
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?breedSuccess=true')
      })
    })

    it('should handle breeding API error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Breeding cooldown active' }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        expect(screen.getByText('Breeding cooldown active')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })

    it('should handle network error during breeding', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'))

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter a name...')
        fireEvent.change(nameInput, { target: { value: 'Baby Fluffy' } })
      })

      const breedButton = screen.getByText('🐣 Breed Pets').closest('button')!
      fireEvent.click(breedButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      consoleError.mockRestore()
    })

    it('should validate that both parents are selected before breeding', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ pets: mockPets }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        // Don't select parent 2
      })

      // Since parent 2 is not selected, breeding check won't run and form won't appear
      expect(screen.queryByPlaceholderText('Enter a name...')).not.toBeInTheDocument()
    })
  })

  describe('URL Parameter Handling', () => {
    it('should pre-select pets from URL parameters', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'pet1') return 'pet-1'
        if (key === 'pet2') return 'pet-2'
        return null
      })

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            pets: [
              { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, createdAt: new Date().toISOString(), petTraits: [] },
              { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, createdAt: new Date().toISOString(), petTraits: [] },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: true,
            compatibility: 85,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect((selects[0] as HTMLSelectElement).value).toBe('pet-1')
        expect((selects[1] as HTMLSelectElement).value).toBe('pet-2')
      })
    })
  })

  describe('Navigation', () => {
    it('should have back to dashboard button', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: [] }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
      })
    })

    it('should navigate to dashboard when back button clicked', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: [] }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const backButton = screen.getByText('Back to Dashboard').closest('button')!
        fireEvent.click(backButton)
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Requirements Display', () => {
    it('should display breeding requirements information', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pets: [] }),
      })

      render(<BreedingPage />)

      await waitFor(() => {
        expect(screen.getByText('Breeding Requirements:')).toBeInTheDocument()
        expect(screen.getByText('Both pets must be at least 7 days old')).toBeInTheDocument()
        expect(screen.getByText(/Both pets must have health/)).toBeInTheDocument()
        expect(screen.getByText('Neither pet can be in Critical state')).toBeInTheDocument()
        expect(screen.getByText(/breeding cooldown/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message with correct styling', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
      })

      render(<BreedingPage />)

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load your pets')
        expect(errorMessage).toBeInTheDocument()
        // Check that the error is displayed in the page
        const errorContainer = errorMessage.closest('div')
        expect(errorContainer).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should clear error when selecting different parents', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            pets: [
              { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, createdAt: new Date().toISOString(), petTraits: [] },
              { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, createdAt: new Date().toISOString(), petTraits: [] },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            canBreed: false,
            reason: 'Test error',
            compatibility: 30,
            parent1: { id: 'pet-1', name: 'Fluffy', generation: 1, health: 100, age: 8 },
            parent2: { id: 'pet-2', name: 'Sparkle', generation: 1, health: 90, age: 9 },
          }),
        })

      render(<BreedingPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        fireEvent.change(selects[0], { target: { value: 'pet-1' } })
        fireEvent.change(selects[1], { target: { value: 'pet-2' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })
    })
  })
})
