'use client'

export interface StatBarProps {
  label: string
  value: number
  max?: number
  showCritical?: boolean
  testId?: string
}

export default function StatBar({ label, value, max = 100, showCritical = true, testId }: StatBarProps) {
  // Clamp value to [0, max] range
  const clampedValue = Math.max(0, Math.min(value, max))
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0

  // Color thresholds: green > 60, yellow 30-60, red < 30
  const getStatColor = () => {
    if (percentage > 60) return { bar: 'bg-green-500', text: 'text-green-600' }
    if (percentage >= 30) return { bar: 'bg-yellow-500', text: 'text-yellow-600' }
    return { bar: 'bg-red-500', text: 'text-red-600' }
  }

  const isCritical = showCritical && percentage < 20
  const colors = getStatColor()

  return (
    <div data-testid={testId}>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-700 font-semibold flex items-center gap-2">
          {label}
          {isCritical && (
            <span className="text-red-600 text-xs animate-pulse" data-testid={`${testId}-critical-indicator`}>
              ⚠️
            </span>
          )}
        </span>
        <span className={`font-bold ${colors.text}`} data-testid={`${testId}-value`}>
          {clampedValue}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
        <div
          className={`${colors.bar} h-3 rounded-full transition-all duration-500 shadow-sm`}
          style={{ width: `${percentage}%` }}
          data-testid={`${testId}-bar`}
        />
      </div>
    </div>
  )
}
