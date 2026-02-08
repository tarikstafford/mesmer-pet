import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatBar from '@/components/StatBar'

describe('StatBar Component', () => {
  describe('Basic Rendering', () => {
    it('should render with label and value', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      expect(screen.getByText('Health')).toBeInTheDocument()
      expect(screen.getByTestId('health-stat-value')).toHaveTextContent('75/100')
    })

    it('should render with custom max value', () => {
      render(<StatBar label="Energy" value={40} max={50} testId="energy-stat" />)

      expect(screen.getByTestId('energy-stat-value')).toHaveTextContent('40/50')
    })

    it('should render the stat bar element', () => {
      render(<StatBar label="Happiness" value={60} testId="happiness-stat" />)

      const bar = screen.getByTestId('happiness-stat-bar')
      expect(bar).toBeInTheDocument()
      expect(bar).toHaveClass('rounded-full')
    })

    it('should apply testId to container', () => {
      render(<StatBar label="Test" value={50} testId="custom-test-id" />)

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
    })
  })

  describe('Bar Width Calculation', () => {
    it('should set bar width to percentage of max value', () => {
      render(<StatBar label="Health" value={75} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '75%' })
    })

    it('should calculate percentage correctly with custom max', () => {
      render(<StatBar label="Energy" value={30} max={60} testId="energy-stat" />)

      const bar = screen.getByTestId('energy-stat-bar')
      // 30/60 = 50%
      expect(bar).toHaveStyle({ width: '50%' })
    })

    it('should show 100% width when value equals max', () => {
      render(<StatBar label="Happiness" value={100} max={100} testId="happiness-stat" />)

      const bar = screen.getByTestId('happiness-stat-bar')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('should show 0% width when value is 0', () => {
      render(<StatBar label="Health" value={0} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '0%' })
    })

    it('should handle fractional percentages', () => {
      render(<StatBar label="Energy" value={33} max={100} testId="energy-stat" />)

      const bar = screen.getByTestId('energy-stat-bar')
      expect(bar).toHaveStyle({ width: '33%' })
    })
  })

  describe('Color Thresholds', () => {
    it('should show green color when value > 60%', () => {
      render(<StatBar label="Health" value={80} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      const valueText = screen.getByTestId('health-stat-value')

      expect(bar).toHaveClass('bg-green-500')
      expect(valueText).toHaveClass('text-green-600')
    })

    it('should show green color at exactly 61%', () => {
      render(<StatBar label="Health" value={61} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveClass('bg-green-500')
    })

    it('should show yellow color when value is 60%', () => {
      render(<StatBar label="Health" value={60} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      const valueText = screen.getByTestId('health-stat-value')

      expect(bar).toHaveClass('bg-yellow-500')
      expect(valueText).toHaveClass('text-yellow-600')
    })

    it('should show yellow color when value is between 30-60%', () => {
      render(<StatBar label="Happiness" value={45} max={100} testId="happiness-stat" />)

      const bar = screen.getByTestId('happiness-stat-bar')
      const valueText = screen.getByTestId('happiness-stat-value')

      expect(bar).toHaveClass('bg-yellow-500')
      expect(valueText).toHaveClass('text-yellow-600')
    })

    it('should show yellow color at exactly 30%', () => {
      render(<StatBar label="Health" value={30} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveClass('bg-yellow-500')
    })

    it('should show red color when value < 30%', () => {
      render(<StatBar label="Energy" value={25} max={100} testId="energy-stat" />)

      const bar = screen.getByTestId('energy-stat-bar')
      const valueText = screen.getByTestId('energy-stat-value')

      expect(bar).toHaveClass('bg-red-500')
      expect(valueText).toHaveClass('text-red-600')
    })

    it('should show red color at exactly 29%', () => {
      render(<StatBar label="Health" value={29} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveClass('bg-red-500')
    })

    it('should show red color at 0%', () => {
      render(<StatBar label="Health" value={0} max={100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveClass('bg-red-500')
    })

    it('should calculate color based on percentage with custom max', () => {
      // 40/50 = 80% -> green
      render(<StatBar label="Energy" value={40} max={50} testId="energy-stat" />)

      const bar = screen.getByTestId('energy-stat-bar')
      expect(bar).toHaveClass('bg-green-500')
    })

    it('should calculate color based on percentage with custom max (yellow range)', () => {
      // 20/50 = 40% -> yellow
      render(<StatBar label="Energy" value={20} max={50} testId="energy-stat" />)

      const bar = screen.getByTestId('energy-stat-bar')
      expect(bar).toHaveClass('bg-yellow-500')
    })

    it('should calculate color based on percentage with custom max (red range)', () => {
      // 10/50 = 20% -> red
      render(<StatBar label="Energy" value={10} max={50} testId="energy-stat" />)

      const bar = screen.getByTestId('energy-stat-bar')
      expect(bar).toHaveClass('bg-red-500')
    })
  })

  describe('Critical Indicator', () => {
    it('should show critical indicator when value < 20', () => {
      render(<StatBar label="Health" value={15} testId="health-stat" />)

      const criticalIndicator = screen.getByTestId('health-stat-critical-indicator')
      expect(criticalIndicator).toBeInTheDocument()
      expect(criticalIndicator).toHaveTextContent('⚠️')
    })

    it('should show critical indicator at exactly 19', () => {
      render(<StatBar label="Health" value={19} testId="health-stat" />)

      expect(screen.getByTestId('health-stat-critical-indicator')).toBeInTheDocument()
    })

    it('should NOT show critical indicator at exactly 20', () => {
      render(<StatBar label="Health" value={20} testId="health-stat" />)

      expect(screen.queryByTestId('health-stat-critical-indicator')).not.toBeInTheDocument()
    })

    it('should NOT show critical indicator when value >= 20', () => {
      render(<StatBar label="Health" value={50} testId="health-stat" />)

      expect(screen.queryByTestId('health-stat-critical-indicator')).not.toBeInTheDocument()
    })

    it('should show critical indicator at value 0', () => {
      render(<StatBar label="Health" value={0} testId="health-stat" />)

      expect(screen.getByTestId('health-stat-critical-indicator')).toBeInTheDocument()
    })

    it('should NOT show critical indicator when showCritical is false', () => {
      render(<StatBar label="Health" value={10} showCritical={false} testId="health-stat" />)

      expect(screen.queryByTestId('health-stat-critical-indicator')).not.toBeInTheDocument()
    })

    it('should calculate critical based on percentage with custom max', () => {
      // 8/50 = 16% -> critical
      render(<StatBar label="Energy" value={8} max={50} testId="energy-stat" />)

      expect(screen.getByTestId('energy-stat-critical-indicator')).toBeInTheDocument()
    })

    it('should NOT be critical with custom max when percentage >= 20%', () => {
      // 10/50 = 20% -> not critical
      render(<StatBar label="Energy" value={10} max={50} testId="energy-stat" />)

      expect(screen.queryByTestId('energy-stat-critical-indicator')).not.toBeInTheDocument()
    })

    it('should have animate-pulse class on critical indicator', () => {
      render(<StatBar label="Health" value={10} testId="health-stat" />)

      const criticalIndicator = screen.getByTestId('health-stat-critical-indicator')
      expect(criticalIndicator).toHaveClass('animate-pulse')
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative values by clamping to 0', () => {
      render(<StatBar label="Health" value={-10} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveTextContent('0/100')

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '0%' })
    })

    it('should handle values greater than max by clamping', () => {
      render(<StatBar label="Health" value={150} max={100} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveTextContent('100/100')

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('should handle max value of 0', () => {
      render(<StatBar label="Health" value={50} max={0} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveTextContent('0/0')

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '0%' })
    })

    it('should handle negative max value', () => {
      render(<StatBar label="Health" value={50} max={-100} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '0%' })
    })

    it('should handle decimal values', () => {
      render(<StatBar label="Health" value={75.5} max={100} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveTextContent('75.5/100')
    })

    it('should handle decimal max values', () => {
      render(<StatBar label="Energy" value={50.5} max={100.5} testId="energy-stat" />)

      const valueText = screen.getByTestId('energy-stat-value')
      expect(valueText).toHaveTextContent('50.5/100.5')
    })

    it('should handle very large numbers', () => {
      render(<StatBar label="Health" value={9999} max={10000} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveTextContent('9999/10000')

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '99.99%' })
    })

    it('should handle both value and max being 0', () => {
      render(<StatBar label="Health" value={0} max={0} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveTextContent('0/0')

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveStyle({ width: '0%' })
    })
  })

  describe('Styling and Classes', () => {
    it('should have transition-all duration-500 class on bar', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveClass('transition-all', 'duration-500')
    })

    it('should have shadow-sm class on bar', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const bar = screen.getByTestId('health-stat-bar')
      expect(bar).toHaveClass('shadow-sm')
    })

    it('should have rounded-full class on bar container', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const container = screen.getByTestId('health-stat-bar').parentElement
      expect(container).toHaveClass('rounded-full')
    })

    it('should have bg-gray-200 class on bar container', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const container = screen.getByTestId('health-stat-bar').parentElement
      expect(container).toHaveClass('bg-gray-200')
    })

    it('should have shadow-inner class on bar container', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const container = screen.getByTestId('health-stat-bar').parentElement
      expect(container).toHaveClass('shadow-inner')
    })

    it('should have font-semibold on label', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const label = screen.getByText('Health')
      expect(label).toHaveClass('font-semibold')
    })

    it('should have font-bold on value', () => {
      render(<StatBar label="Health" value={75} testId="health-stat" />)

      const valueText = screen.getByTestId('health-stat-value')
      expect(valueText).toHaveClass('font-bold')
    })
  })

  describe('Multiple Instances', () => {
    it('should render multiple StatBars with different values', () => {
      const { container } = render(
        <>
          <StatBar label="Health" value={80} testId="health-stat" />
          <StatBar label="Happiness" value={45} testId="happiness-stat" />
          <StatBar label="Energy" value={20} testId="energy-stat" />
        </>
      )

      expect(screen.getByTestId('health-stat-value')).toHaveTextContent('80/100')
      expect(screen.getByTestId('happiness-stat-value')).toHaveTextContent('45/100')
      expect(screen.getByTestId('energy-stat-value')).toHaveTextContent('20/100')

      // Check colors
      expect(screen.getByTestId('health-stat-bar')).toHaveClass('bg-green-500')
      expect(screen.getByTestId('happiness-stat-bar')).toHaveClass('bg-yellow-500')
      expect(screen.getByTestId('energy-stat-bar')).toHaveClass('bg-red-500')
    })

    it('should show critical indicator only for stats < 20', () => {
      render(
        <>
          <StatBar label="Health" value={80} testId="health-stat" />
          <StatBar label="Happiness" value={15} testId="happiness-stat" />
          <StatBar label="Energy" value={25} testId="energy-stat" />
        </>
      )

      expect(screen.queryByTestId('health-stat-critical-indicator')).not.toBeInTheDocument()
      expect(screen.getByTestId('happiness-stat-critical-indicator')).toBeInTheDocument()
      expect(screen.queryByTestId('energy-stat-critical-indicator')).not.toBeInTheDocument()
    })
  })

  describe('Default Props', () => {
    it('should default max to 100', () => {
      render(<StatBar label="Health" value={50} testId="health-stat" />)

      expect(screen.getByTestId('health-stat-value')).toHaveTextContent('50/100')
    })

    it('should default showCritical to true', () => {
      render(<StatBar label="Health" value={10} testId="health-stat" />)

      expect(screen.getByTestId('health-stat-critical-indicator')).toBeInTheDocument()
    })
  })
})
