import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TraitBadge, { TraitBadgeProps } from '@/components/TraitBadge'

describe('TraitBadge Component', () => {
  const defaultProps: TraitBadgeProps = {
    traitName: 'Sparkling Eyes',
    rarity: 'rare',
    description: 'Beautiful sparkling eyes that shimmer in the light',
    testId: 'trait-badge',
  }

  describe('Basic Rendering', () => {
    it('renders trait name', () => {
      render(<TraitBadge {...defaultProps} />)
      expect(screen.getByTestId('trait-badge-name')).toHaveTextContent('Sparkling Eyes')
    })

    it('renders with custom testId', () => {
      render(<TraitBadge {...defaultProps} testId="custom-trait" />)
      expect(screen.getByTestId('custom-trait')).toBeInTheDocument()
    })

    it('renders data-rarity attribute', () => {
      render(<TraitBadge {...defaultProps} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('data-rarity', 'rare')
    })

    it('renders without description', () => {
      render(<TraitBadge traitName="Simple Trait" rarity="common" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge-name')).toHaveTextContent('Simple Trait')
    })
  })

  describe('Icon Support', () => {
    it('renders icon when provided', () => {
      render(<TraitBadge {...defaultProps} icon="✨" />)
      expect(screen.getByTestId('trait-badge-icon')).toHaveTextContent('✨')
    })

    it('does not render icon element when not provided', () => {
      render(<TraitBadge {...defaultProps} />)
      expect(screen.queryByTestId('trait-badge-icon')).not.toBeInTheDocument()
    })

    it('renders icon before trait name', () => {
      const { container } = render(<TraitBadge {...defaultProps} icon="🔥" />)
      const badge = screen.getByTestId('trait-badge')
      const text = badge.textContent || ''
      expect(text).toBe('🔥Sparkling Eyes')
    })

    it('renders multiple emoji icons', () => {
      render(<TraitBadge {...defaultProps} icon="🌟✨" />)
      expect(screen.getByTestId('trait-badge-icon')).toHaveTextContent('🌟✨')
    })
  })

  describe('Tooltip Support', () => {
    it('shows tooltip with description by default', () => {
      render(<TraitBadge {...defaultProps} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('title', 'Beautiful sparkling eyes that shimmer in the light')
    })

    it('shows tooltip when showTooltip is true', () => {
      render(<TraitBadge {...defaultProps} showTooltip={true} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('title', 'Beautiful sparkling eyes that shimmer in the light')
    })

    it('hides tooltip when showTooltip is false', () => {
      render(<TraitBadge {...defaultProps} showTooltip={false} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).not.toHaveAttribute('title')
    })

    it('hides tooltip when no description provided', () => {
      render(<TraitBadge traitName="No Description" rarity="common" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).not.toHaveAttribute('title')
    })

    it('shows empty tooltip when description is empty string', () => {
      render(<TraitBadge {...defaultProps} description="" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).not.toHaveAttribute('title')
    })

    it('shows tooltip with long description', () => {
      const longDescription = 'This is a very long description that explains all the details about this amazing trait in great detail with many words.'
      render(<TraitBadge {...defaultProps} description={longDescription} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('title', longDescription)
    })
  })

  describe('Rarity - Legendary', () => {
    it('applies legendary colors', () => {
      render(<TraitBadge traitName="Legendary Trait" rarity="legendary" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-600')
      expect(badge).toHaveClass('border-yellow-400')
    })

    it('handles case-insensitive legendary', () => {
      render(<TraitBadge traitName="Test" rarity="LEGENDARY" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-yellow-100')
    })

    it('sets data-rarity attribute for legendary', () => {
      render(<TraitBadge traitName="Test" rarity="legendary" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('data-rarity', 'legendary')
    })
  })

  describe('Rarity - Rare', () => {
    it('applies rare colors', () => {
      render(<TraitBadge traitName="Rare Trait" rarity="rare" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-purple-100')
      expect(badge).toHaveClass('text-purple-600')
      expect(badge).toHaveClass('border-purple-400')
    })

    it('handles case-insensitive rare', () => {
      render(<TraitBadge traitName="Test" rarity="Rare" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-purple-100')
    })

    it('sets data-rarity attribute for rare', () => {
      render(<TraitBadge traitName="Test" rarity="rare" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('data-rarity', 'rare')
    })
  })

  describe('Rarity - Uncommon', () => {
    it('applies uncommon colors', () => {
      render(<TraitBadge traitName="Uncommon Trait" rarity="uncommon" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-600')
      expect(badge).toHaveClass('border-blue-400')
    })

    it('handles case-insensitive uncommon', () => {
      render(<TraitBadge traitName="Test" rarity="UNCOMMON" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-blue-100')
    })

    it('sets data-rarity attribute for uncommon', () => {
      render(<TraitBadge traitName="Test" rarity="uncommon" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('data-rarity', 'uncommon')
    })
  })

  describe('Rarity - Common', () => {
    it('applies common colors', () => {
      render(<TraitBadge traitName="Common Trait" rarity="common" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-600')
      expect(badge).toHaveClass('border-gray-300')
    })

    it('handles case-insensitive common', () => {
      render(<TraitBadge traitName="Test" rarity="Common" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-gray-100')
    })

    it('defaults to common colors for unknown rarity', () => {
      render(<TraitBadge traitName="Test" rarity="unknown" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-600')
      expect(badge).toHaveClass('border-gray-300')
    })

    it('defaults to common colors for empty rarity', () => {
      render(<TraitBadge traitName="Test" rarity="" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('bg-gray-100')
    })

    it('sets data-rarity attribute for common', () => {
      render(<TraitBadge traitName="Test" rarity="common" testId="trait-badge" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveAttribute('data-rarity', 'common')
    })
  })

  describe('Styling', () => {
    it('applies base styling classes', () => {
      render(<TraitBadge {...defaultProps} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('items-center')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('font-bold')
      expect(badge).toHaveClass('shadow-sm')
      expect(badge).toHaveClass('border-2')
    })

    it('applies interactive hover classes', () => {
      render(<TraitBadge {...defaultProps} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('hover:scale-105')
      expect(badge).toHaveClass('hover:shadow-md')
      expect(badge).toHaveClass('transition-all')
    })

    it('applies text size and padding', () => {
      render(<TraitBadge {...defaultProps} />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('px-3')
      expect(badge).toHaveClass('py-1.5')
    })

    it('applies gap between icon and name', () => {
      render(<TraitBadge {...defaultProps} icon="✨" />)
      const badge = screen.getByTestId('trait-badge')
      expect(badge).toHaveClass('gap-1.5')
    })
  })

  describe('Edge Cases', () => {
    it('handles very long trait names', () => {
      const longName = 'This is a very long trait name that should still render correctly without breaking the layout'
      render(<TraitBadge traitName={longName} rarity="rare" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge-name')).toHaveTextContent(longName)
    })

    it('handles trait names with special characters', () => {
      const specialName = 'Trait\'s "Special" & <Cool>'
      render(<TraitBadge traitName={specialName} rarity="rare" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge-name')).toHaveTextContent(specialName)
    })

    it('handles trait names with numbers', () => {
      render(<TraitBadge traitName="Trait 123" rarity="rare" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge-name')).toHaveTextContent('Trait 123')
    })

    it('handles empty trait name', () => {
      render(<TraitBadge traitName="" rarity="rare" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge-name')).toBeInTheDocument()
    })

    it('handles single character trait name', () => {
      render(<TraitBadge traitName="X" rarity="legendary" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge-name')).toHaveTextContent('X')
    })

    it('handles trait name with only spaces', () => {
      render(<TraitBadge traitName="   " rarity="common" testId="trait-badge" />)
      // DOM normalizes whitespace, so just check the element exists
      expect(screen.getByTestId('trait-badge-name')).toBeInTheDocument()
    })

    it('renders multiple badges independently', () => {
      const { container } = render(
        <>
          <TraitBadge traitName="Trait 1" rarity="common" testId="trait-1" />
          <TraitBadge traitName="Trait 2" rarity="rare" testId="trait-2" />
          <TraitBadge traitName="Trait 3" rarity="legendary" testId="trait-3" />
        </>
      )
      expect(screen.getByTestId('trait-1')).toBeInTheDocument()
      expect(screen.getByTestId('trait-2')).toBeInTheDocument()
      expect(screen.getByTestId('trait-3')).toBeInTheDocument()
    })
  })

  describe('All Rarity Levels Combined', () => {
    it('displays all rarity levels with correct colors', () => {
      const { rerender } = render(<TraitBadge traitName="Test" rarity="common" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge')).toHaveClass('bg-gray-100')

      rerender(<TraitBadge traitName="Test" rarity="uncommon" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge')).toHaveClass('bg-blue-100')

      rerender(<TraitBadge traitName="Test" rarity="rare" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge')).toHaveClass('bg-purple-100')

      rerender(<TraitBadge traitName="Test" rarity="legendary" testId="trait-badge" />)
      expect(screen.getByTestId('trait-badge')).toHaveClass('bg-yellow-100')
    })
  })

  describe('Integration Examples', () => {
    it('renders complete trait badge with all props', () => {
      render(
        <TraitBadge
          traitName="Mystical Aura"
          rarity="legendary"
          description="A shimmering mystical aura surrounds the pet"
          icon="✨"
          showTooltip={true}
          testId="complete-badge"
        />
      )
      const badge = screen.getByTestId('complete-badge')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveAttribute('title', 'A shimmering mystical aura surrounds the pet')
      expect(screen.getByTestId('complete-badge-icon')).toHaveTextContent('✨')
      expect(screen.getByTestId('complete-badge-name')).toHaveTextContent('Mystical Aura')
    })

    it('renders minimal trait badge with required props only', () => {
      render(<TraitBadge traitName="Basic Trait" rarity="common" testId="minimal-badge" />)
      const badge = screen.getByTestId('minimal-badge')
      expect(badge).toBeInTheDocument()
      expect(screen.getByTestId('minimal-badge-name')).toHaveTextContent('Basic Trait')
      expect(screen.queryByTestId('minimal-badge-icon')).not.toBeInTheDocument()
    })
  })
})
