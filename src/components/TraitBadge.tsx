'use client'

export interface TraitBadgeProps {
  traitName: string
  rarity: string
  description?: string
  icon?: string
  showTooltip?: boolean
  testId?: string
}

export default function TraitBadge({
  traitName,
  rarity,
  description,
  icon,
  showTooltip = true,
  testId,
}: TraitBadgeProps) {
  // Rarity color mapping
  const getRarityColor = () => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-600',
          border: 'border-yellow-400',
        }
      case 'rare':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          border: 'border-purple-400',
        }
      case 'uncommon':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'border-blue-400',
        }
      default: // common
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          border: 'border-gray-300',
        }
    }
  }

  const colors = getRarityColor()

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm border-2 ${colors.bg} ${colors.text} ${colors.border} transition-all hover:scale-105 hover:shadow-md`}
      title={showTooltip && description ? description : undefined}
      data-testid={testId}
      data-rarity={rarity}
    >
      {icon && <span data-testid={`${testId}-icon`}>{icon}</span>}
      <span data-testid={`${testId}-name`}>{traitName}</span>
    </span>
  )
}
