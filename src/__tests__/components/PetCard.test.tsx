import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PetCard, { PetCardProps } from '@/components/PetCard'

// Mock AnimatedPetSVG component
vi.mock('@/components/pet-svg/AnimatedPetSVG', () => ({
  AnimatedPetSVG: ({ petId, size }: { petId: string; size: string }) => (
    <div data-testid="animated-pet-svg" data-pet-id={petId} data-size={size}>
      Mocked AnimatedPetSVG
    </div>
  ),
}))

// Mock loadTraits utility
vi.mock('@/lib/traits/migration', () => ({
  loadTraits: (traits: any, petId: string) => ({
    body: { color: '#3b82f6' },
    pattern: { type: 'none' as const, color: '#000000' },
    accessory: { type: 'none' as const, color: '#000000' },
    expression: { type: 'happy' as const, color: '#000000' },
    rarity: 'common' as const,
    traitVersion: 1,
  }),
}))

describe('PetCard Component', () => {
  const mockPetData: PetCardProps = {
    id: 'pet-123',
    name: 'Fluffy',
    health: 85,
    hunger: 30,
    happiness: 75,
    energy: 60,
    friendliness: 80,
    energyTrait: 70,
    curiosity: 65,
    patience: 55,
    playfulness: 90,
    generation: 2,
    parent1Id: 'parent-1',
    parent2Id: 'parent-2',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastInteractionAt: '2024-01-10T12:00:00.000Z',
    traits: null,
    petTraits: [
      {
        trait: {
          id: 'trait-1',
          traitName: 'Sparkling Eyes',
          traitType: 'visual',
          rarity: 'rare',
          description: 'Beautiful sparkling eyes',
        },
        inheritanceSource: 'parent1',
      },
      {
        trait: {
          id: 'trait-2',
          traitName: 'Fluffy Tail',
          traitType: 'visual',
          rarity: 'common',
          description: 'A very fluffy tail',
        },
        inheritanceSource: 'parent2',
      },
      {
        trait: {
          id: 'trait-3',
          traitName: 'Golden Fur',
          traitType: 'visual',
          rarity: 'legendary',
          description: 'Rare golden colored fur',
        },
        inheritanceSource: 'mutation',
      },
    ],
    petSkills: [
      {
        skill: {
          id: 'skill-1',
          skillName: 'Chess Master',
          category: 'games',
          description: 'Expert at playing chess',
        },
        proficiency: 85,
        activatedDate: '2024-01-05T00:00:00.000Z',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render pet name correctly', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByText('Fluffy')).toBeInTheDocument()
    })

    it('should render generation information', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByText('Generation 2')).toBeInTheDocument()
    })

    it('should render the AnimatedPetSVG with correct props', () => {
      render(<PetCard {...mockPetData} />)
      const svg = screen.getByTestId('animated-pet-svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('data-pet-id', 'pet-123')
      expect(svg).toHaveAttribute('data-size', 'large')
    })

    it('should display bred indicator when pet has parents', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByText('(Bred)')).toBeInTheDocument()
    })

    it('should not display bred indicator for first generation', () => {
      const firstGenPet = { ...mockPetData, generation: 1, parent1Id: null, parent2Id: null }
      render(<PetCard {...firstGenPet} />)
      expect(screen.queryByText('(Bred)')).not.toBeInTheDocument()
    })
  })

  describe('Stats Display', () => {
    it('should render health stat with correct value', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('stat-health-value')).toHaveTextContent('85/100')
    })

    it('should render happiness stat with correct value', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('stat-happiness-value')).toHaveTextContent('75/100')
    })

    it('should render energy stat with correct value', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('stat-energy-value')).toHaveTextContent('60/100')
    })

    it('should render hunger stat with correct value', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('stat-hunger-value')).toHaveTextContent('30/100')
    })

    it('should render stat bars with correct widths', () => {
      render(<PetCard {...mockPetData} />)
      const healthBar = screen.getByTestId('stat-health-bar')
      const happinessBar = screen.getByTestId('stat-happiness-bar')
      const energyBar = screen.getByTestId('stat-energy-bar')
      const hungerBar = screen.getByTestId('stat-hunger-bar')

      expect(healthBar).toHaveStyle({ width: '85%' })
      expect(happinessBar).toHaveStyle({ width: '75%' })
      expect(energyBar).toHaveStyle({ width: '60%' })
      expect(hungerBar).toHaveStyle({ width: '30%' })
    })

    it('should apply green color to high stats (>70)', () => {
      render(<PetCard {...mockPetData} />)
      const healthValue = screen.getByTestId('stat-health-value')
      expect(healthValue).toHaveClass('text-green-600')
    })

    it('should apply yellow color to medium stats (40-70)', () => {
      render(<PetCard {...mockPetData} />)
      const energyValue = screen.getByTestId('stat-energy-value')
      expect(energyValue).toHaveClass('text-yellow-600')
    })

    it('should apply red color to low stats (<40)', () => {
      const lowStatPet = { ...mockPetData, health: 25 }
      render(<PetCard {...lowStatPet} />)
      const healthValue = screen.getByTestId('stat-health-value')
      expect(healthValue).toHaveClass('text-red-600')
    })
  })

  describe('Visual Traits', () => {
    it('should render visual traits section', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('visual-traits')).toBeInTheDocument()
      expect(screen.getByText('Visual Traits')).toBeInTheDocument()
    })

    it('should display all visual traits (up to 4)', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByText('Sparkling Eyes')).toBeInTheDocument()
      expect(screen.getByText('Fluffy Tail')).toBeInTheDocument()
      expect(screen.getByText('Golden Fur')).toBeInTheDocument()
    })

    it('should apply correct rarity colors to traits', () => {
      render(<PetCard {...mockPetData} />)
      const legendaryTrait = screen.getByText('Golden Fur')
      const rareTrait = screen.getByText('Sparkling Eyes')
      const commonTrait = screen.getByText('Fluffy Tail')

      expect(legendaryTrait).toHaveClass('text-yellow-600', 'bg-yellow-100')
      expect(rareTrait).toHaveClass('text-purple-600', 'bg-purple-100')
      expect(commonTrait).toHaveClass('text-gray-600', 'bg-gray-100')
    })

    it('should show trait description as title attribute', () => {
      render(<PetCard {...mockPetData} />)
      const trait = screen.getByText('Sparkling Eyes')
      expect(trait).toHaveAttribute('title', 'Beautiful sparkling eyes')
    })

    it('should only show maximum of 4 visual traits', () => {
      const manyTraitsPet = {
        ...mockPetData,
        petTraits: [
          ...mockPetData.petTraits,
          {
            trait: {
              id: 'trait-4',
              traitName: 'Extra Trait 1',
              traitType: 'visual',
              rarity: 'common',
              description: 'Extra trait',
            },
            inheritanceSource: 'random',
          },
          {
            trait: {
              id: 'trait-5',
              traitName: 'Extra Trait 2',
              traitType: 'visual',
              rarity: 'common',
              description: 'Extra trait',
            },
            inheritanceSource: 'random',
          },
        ],
      }
      render(<PetCard {...manyTraitsPet} />)

      // Only first 4 should be visible
      const visualTraits = screen.getByTestId('visual-traits')
      const traitBadges = visualTraits.querySelectorAll('span[title]')
      expect(traitBadges).toHaveLength(4)
    })
  })

  describe('Personality Profile', () => {
    it('should render personality profile section', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('personality-profile')).toBeInTheDocument()
      expect(screen.getByText('Personality Profile')).toBeInTheDocument()
    })

    it('should display personality summary when provided', () => {
      const petWithSummary = { ...mockPetData, personalitySummary: 'A friendly and playful companion' }
      render(<PetCard {...petWithSummary} />)
      expect(screen.getByTestId('personality-summary')).toBeInTheDocument()
      expect(screen.getByText('"A friendly and playful companion"')).toBeInTheDocument()
    })

    it('should not display personality summary when not provided', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.queryByTestId('personality-summary')).not.toBeInTheDocument()
    })

    it('should render all personality trait bars with correct values', () => {
      render(<PetCard {...mockPetData} />)

      expect(screen.getByTestId('personality-friendliness')).toBeInTheDocument()
      expect(screen.getByText('80/100')).toBeInTheDocument()

      expect(screen.getByTestId('personality-energy')).toBeInTheDocument()
      expect(screen.getByText('70/100')).toBeInTheDocument()

      expect(screen.getByTestId('personality-curiosity')).toBeInTheDocument()
      expect(screen.getByText('65/100')).toBeInTheDocument()

      expect(screen.getByTestId('personality-patience')).toBeInTheDocument()
      expect(screen.getByText('55/100')).toBeInTheDocument()

      expect(screen.getByTestId('personality-playfulness')).toBeInTheDocument()
      expect(screen.getByText('90/100')).toBeInTheDocument()
    })
  })

  describe('Critical State', () => {
    it('should display critical banner when isCritical is true', () => {
      const criticalPet = { ...mockPetData, isCritical: true }
      render(<PetCard {...criticalPet} />)
      expect(screen.getByTestId('critical-banner')).toBeInTheDocument()
      expect(screen.getByText('CRITICAL STATE')).toBeInTheDocument()
    })

    it('should not display critical banner when isCritical is false', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.queryByTestId('critical-banner')).not.toBeInTheDocument()
    })

    it('should show recovery button when recovery is available', () => {
      const criticalPet = { ...mockPetData, isCritical: true, recoveryAvailable: true, onRecover: vi.fn() }
      render(<PetCard {...criticalPet} />)
      expect(screen.getByTestId('recover-button')).toBeInTheDocument()
      expect(screen.getByText('💊 Use Health Potion')).toBeInTheDocument()
    })

    it('should show no recovery message when recovery is not available', () => {
      const criticalPet = { ...mockPetData, isCritical: true, recoveryAvailable: false }
      render(<PetCard {...criticalPet} />)
      expect(screen.getByTestId('no-recovery-message')).toBeInTheDocument()
      expect(screen.getByText(/No recovery items available/)).toBeInTheDocument()
    })

    it('should call onRecover when recovery button is clicked', () => {
      const onRecover = vi.fn()
      const criticalPet = { ...mockPetData, isCritical: true, recoveryAvailable: true, onRecover }
      render(<PetCard {...criticalPet} />)

      const recoverButton = screen.getByTestId('recover-button')
      fireEvent.click(recoverButton)

      expect(onRecover).toHaveBeenCalledWith('pet-123')
    })

    it('should disable feed button when pet is critical', () => {
      const criticalPet = { ...mockPetData, isCritical: true, onFeed: vi.fn() }
      render(<PetCard {...criticalPet} />)

      const feedButton = screen.getByTestId('feed-button')
      expect(feedButton).toBeDisabled()
      expect(feedButton).toHaveTextContent('❌ Cannot Feed (Critical)')
    })

    it('should disable chat button when pet is critical', () => {
      const criticalPet = { ...mockPetData, isCritical: true, onChat: vi.fn() }
      render(<PetCard {...criticalPet} />)

      const chatButton = screen.getByTestId('chat-button')
      expect(chatButton).toBeDisabled()
      expect(chatButton).toHaveTextContent('❌ Cannot Chat (Critical)')
    })

    it('should display health penalty message when penalty exists', () => {
      const criticalPet = { ...mockPetData, isCritical: true, maxHealthPenalty: 15 }
      render(<PetCard {...criticalPet} />)
      expect(screen.getByTestId('health-penalty-message')).toBeInTheDocument()
      expect(screen.getByText(/Max health reduced by 15%/)).toBeInTheDocument()
    })

    it('should apply red ring when pet is critical', () => {
      const criticalPet = { ...mockPetData, isCritical: true }
      render(<PetCard {...criticalPet} />)

      const card = screen.getByTestId('pet-card')
      expect(card).toHaveClass('ring-4', 'ring-red-500')
    })
  })

  describe('Warnings', () => {
    it('should display warnings when provided and pet is not critical', () => {
      const petWithWarnings = {
        ...mockPetData,
        warnings: [
          { type: 'health', severity: 'warning', message: 'Health is low', timestamp: '2024-01-10T12:00:00.000Z' },
          { type: 'hunger', severity: 'critical', message: 'Urgent: Pet is very hungry', timestamp: '2024-01-10T13:00:00.000Z' },
        ],
      }
      render(<PetCard {...petWithWarnings} />)

      expect(screen.getByTestId('warnings-section')).toBeInTheDocument()
      expect(screen.getByText('Health is low')).toBeInTheDocument()
      expect(screen.getByText('Urgent: Pet is very hungry')).toBeInTheDocument()
    })

    it('should not display warnings when pet is critical', () => {
      const criticalPetWithWarnings = {
        ...mockPetData,
        isCritical: true,
        warnings: [
          { type: 'health', severity: 'warning', message: 'Health is low', timestamp: '2024-01-10T12:00:00.000Z' },
        ],
      }
      render(<PetCard {...criticalPetWithWarnings} />)

      expect(screen.queryByTestId('warnings-section')).not.toBeInTheDocument()
    })

    it('should apply correct styling for critical warnings', () => {
      const petWithWarnings = {
        ...mockPetData,
        warnings: [
          { type: 'health', severity: 'critical', message: 'Critical warning', timestamp: '2024-01-10T12:00:00.000Z' },
        ],
      }
      render(<PetCard {...petWithWarnings} />)

      const warning = screen.getByTestId('warning-critical')
      expect(warning).toHaveClass('bg-red-100', 'border-red-400', 'text-red-900')
      expect(warning).toHaveTextContent('🚨')
    })

    it('should apply correct styling for warning level warnings', () => {
      const petWithWarnings = {
        ...mockPetData,
        warnings: [
          { type: 'hunger', severity: 'warning', message: 'Regular warning', timestamp: '2024-01-10T12:00:00.000Z' },
        ],
      }
      render(<PetCard {...petWithWarnings} />)

      const warning = screen.getByTestId('warning-warning')
      expect(warning).toHaveClass('bg-yellow-100', 'border-yellow-400', 'text-yellow-900')
      expect(warning).toHaveTextContent('⚠️')
    })
  })

  describe('Action Buttons', () => {
    it('should render feed button when onFeed is provided', () => {
      const onFeed = vi.fn()
      render(<PetCard {...mockPetData} onFeed={onFeed} />)
      expect(screen.getByTestId('feed-button')).toBeInTheDocument()
    })

    it('should call onFeed with pet id when feed button is clicked', () => {
      const onFeed = vi.fn()
      render(<PetCard {...mockPetData} onFeed={onFeed} />)

      const feedButton = screen.getByTestId('feed-button')
      fireEvent.click(feedButton)

      expect(onFeed).toHaveBeenCalledWith('pet-123')
    })

    it('should disable feed button when feeding is in progress', () => {
      const onFeed = vi.fn()
      render(<PetCard {...mockPetData} onFeed={onFeed} feedingPetId="pet-123" />)

      const feedButton = screen.getByTestId('feed-button')
      expect(feedButton).toBeDisabled()
      expect(feedButton).toHaveTextContent('🔄 Feeding...')
    })

    it('should render chat button when onChat is provided', () => {
      const onChat = vi.fn()
      render(<PetCard {...mockPetData} onChat={onChat} />)
      expect(screen.getByTestId('chat-button')).toBeInTheDocument()
    })

    it('should call onChat with pet id when chat button is clicked', () => {
      const onChat = vi.fn()
      render(<PetCard {...mockPetData} onChat={onChat} />)

      const chatButton = screen.getByTestId('chat-button')
      fireEvent.click(chatButton)

      expect(onChat).toHaveBeenCalledWith('pet-123')
    })

    it('should render lineage button when onLineage is provided', () => {
      const onLineage = vi.fn()
      render(<PetCard {...mockPetData} onLineage={onLineage} />)
      expect(screen.getByTestId('lineage-button')).toBeInTheDocument()
    })

    it('should call onLineage with pet id when lineage button is clicked', () => {
      const onLineage = vi.fn()
      render(<PetCard {...mockPetData} onLineage={onLineage} />)

      const lineageButton = screen.getByTestId('lineage-button')
      fireEvent.click(lineageButton)

      expect(onLineage).toHaveBeenCalledWith('pet-123')
    })

    it('should render AR button when onViewAR is provided', () => {
      const onViewAR = vi.fn()
      render(<PetCard {...mockPetData} onViewAR={onViewAR} />)
      expect(screen.getByTestId('ar-button')).toBeInTheDocument()
    })

    it('should call onViewAR with pet id when AR button is clicked', () => {
      const onViewAR = vi.fn()
      render(<PetCard {...mockPetData} onViewAR={onViewAR} />)

      const arButton = screen.getByTestId('ar-button')
      fireEvent.click(arButton)

      expect(onViewAR).toHaveBeenCalledWith('pet-123')
    })

    it('should not render action buttons section when no handlers are provided', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument()
    })

    it('should stop propagation on button clicks when onClick is provided', () => {
      const onClick = vi.fn()
      const onFeed = vi.fn()
      render(<PetCard {...mockPetData} onClick={onClick} onFeed={onFeed} />)

      const feedButton = screen.getByTestId('feed-button')
      fireEvent.click(feedButton)

      expect(onFeed).toHaveBeenCalledWith('pet-123')
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Skills Display', () => {
    it('should render active skills section when skills are present', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByTestId('active-skills')).toBeInTheDocument()
      expect(screen.getByText('Active Skills')).toBeInTheDocument()
    })

    it('should display skill names', () => {
      render(<PetCard {...mockPetData} />)
      expect(screen.getByText('Chess Master')).toBeInTheDocument()
    })

    it('should show skill description and proficiency in title', () => {
      render(<PetCard {...mockPetData} />)
      const skillBadge = screen.getByTestId('skill-badge')
      expect(skillBadge).toHaveAttribute('title', 'Expert at playing chess (Proficiency: 85)')
    })

    it('should not render skills section when no skills are present', () => {
      const petWithoutSkills = { ...mockPetData, petSkills: [] }
      render(<PetCard {...petWithoutSkills} />)
      expect(screen.queryByTestId('active-skills')).not.toBeInTheDocument()
    })
  })

  describe('Metadata Display', () => {
    it('should display creation date', () => {
      render(<PetCard {...mockPetData} />)
      const metadata = screen.getByTestId('metadata')
      // Date format may vary by locale, just check it contains the year
      expect(metadata).toHaveTextContent('Created:')
      expect(metadata.textContent).toMatch(/2024/)
    })

    it('should display last interaction timestamp', () => {
      render(<PetCard {...mockPetData} />)
      const metadata = screen.getByTestId('metadata')
      // The exact format depends on the current time, so just check it exists
      expect(metadata).toHaveTextContent('Last interaction:')
    })

    it('should display "Never" when no last interaction', () => {
      const petNoInteraction = { ...mockPetData, lastInteractionAt: null }
      render(<PetCard {...petNoInteraction} />)
      const metadata = screen.getByTestId('metadata')
      expect(metadata).toHaveTextContent('Never')
    })
  })

  describe('Card Interactions', () => {
    it('should call onClick when card is clicked', () => {
      const onClick = vi.fn()
      render(<PetCard {...mockPetData} onClick={onClick} />)

      const card = screen.getByTestId('pet-card')
      fireEvent.click(card)

      expect(onClick).toHaveBeenCalled()
    })

    it('should add cursor-pointer class when onClick is provided', () => {
      const onClick = vi.fn()
      render(<PetCard {...mockPetData} onClick={onClick} />)

      const card = screen.getByTestId('pet-card')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('should not add cursor-pointer class when onClick is not provided', () => {
      render(<PetCard {...mockPetData} />)

      const card = screen.getByTestId('pet-card')
      expect(card).not.toHaveClass('cursor-pointer')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing optional props gracefully', () => {
      const minimalPet: PetCardProps = {
        id: 'pet-minimal',
        name: 'Minimal Pet',
        health: 100,
        hunger: 0,
        happiness: 100,
        energy: 100,
        friendliness: 50,
        energyTrait: 50,
        curiosity: 50,
        patience: 50,
        playfulness: 50,
        generation: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        petTraits: [],
      }

      expect(() => render(<PetCard {...minimalPet} />)).not.toThrow()
      expect(screen.getByText('Minimal Pet')).toBeInTheDocument()
    })

    it('should handle zero stats correctly', () => {
      const zeroStatPet = { ...mockPetData, health: 0, hunger: 0, happiness: 0, energy: 0 }
      render(<PetCard {...zeroStatPet} />)

      expect(screen.getByTestId('stat-health-value')).toHaveTextContent('0/100')
      expect(screen.getByTestId('stat-health-bar')).toHaveStyle({ width: '0%' })
    })

    it('should handle 100% stats correctly', () => {
      const maxStatPet = { ...mockPetData, health: 100, hunger: 100, happiness: 100, energy: 100 }
      render(<PetCard {...maxStatPet} />)

      expect(screen.getByTestId('stat-health-value')).toHaveTextContent('100/100')
      expect(screen.getByTestId('stat-health-bar')).toHaveStyle({ width: '100%' })
    })

    it('should handle empty traits array', () => {
      const noTraitsPet = { ...mockPetData, petTraits: [] }
      render(<PetCard {...noTraitsPet} />)

      const visualTraits = screen.getByTestId('visual-traits')
      const traitBadges = visualTraits.querySelectorAll('span[title]')
      expect(traitBadges).toHaveLength(0)
    })

    it('should filter out non-visual traits', () => {
      const mixedTraitsPet = {
        ...mockPetData,
        petTraits: [
          ...mockPetData.petTraits,
          {
            trait: {
              id: 'trait-personality',
              traitName: 'Friendly',
              traitType: 'personality',
              rarity: 'common',
              description: 'Very friendly',
            },
            inheritanceSource: 'random',
          },
        ],
      }
      render(<PetCard {...mixedTraitsPet} />)

      // Should only show visual traits
      expect(screen.getByText('Sparkling Eyes')).toBeInTheDocument()
      expect(screen.queryByText('Friendly')).not.toBeInTheDocument()
    })
  })
})
