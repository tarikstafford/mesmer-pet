import React from 'react';

interface VitalityOrbProps {
  stat: 'health' | 'happiness' | 'energy' | 'hunger';
  value: number;
  label: string;
  icon?: string;
  maxValue?: number;
  invert?: boolean; // For hunger - lower is better
}

export default function VitalityOrb({
  stat,
  value,
  label,
  icon,
  maxValue = 100,
  invert = false
}: VitalityOrbProps) {
  const percentage = Math.min(Math.max(value, 0), maxValue);
  const displayValue = invert ? maxValue - value : value;

  // Determine health state for animations
  let stateClass = '';
  if (stat === 'health') {
    if (displayValue > 70) stateClass = 'high';
    else if (displayValue >= 40) stateClass = 'medium';
    else stateClass = 'low';
  }

  return (
    <div className="vitality-orb">
      <div className="orb-label">
        {icon && <span className="text-base">{icon}</span>}
        <span className="stat-name">{label}</span>
      </div>
      <div className="orb-container">
        <div
          className={`orb-fill ${stat} ${stateClass}`}
          style={{ width: `${(displayValue / maxValue) * 100}%` }}
        />
      </div>
      <span className="stat-value">{Math.round(displayValue)}</span>
    </div>
  );
}
