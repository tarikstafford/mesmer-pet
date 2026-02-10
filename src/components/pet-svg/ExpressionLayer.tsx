import React from 'react';
import type { ExpressionType, BodySize } from '@/lib/traits/types';

interface ExpressionLayerProps {
  type: ExpressionType;
  size: BodySize;
}

const ExpressionLayerComponent: React.FC<ExpressionLayerProps> = ({ type, size }) => {
  // Scale mapping for body size
  const scale = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1.0;

  const eyeColor = '#333';
  const highlightColor = '#fff';

  return (
    <g transform={`translate(50, 50) scale(${scale}) translate(-50, -50)`}>
      {/* Happy expression */}
      {type === 'happy' && (
        <>
          <g className="pet-eyes">
            {/* Left eye */}
            <circle cx="44" cy="33" r="2.5" fill={eyeColor} />
            <circle cx="44.8" cy="32.5" r="0.8" fill={highlightColor} />
            {/* Right eye */}
            <circle cx="56" cy="33" r="2.5" fill={eyeColor} />
            <circle cx="56.8" cy="32.5" r="0.8" fill={highlightColor} />
          </g>
          {/* Curved-up mouth */}
          <path
            d="M 45 40 Q 50 43 55 40"
            stroke={eyeColor}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Neutral expression */}
      {type === 'neutral' && (
        <>
          <g className="pet-eyes">
            {/* Left eye */}
            <circle cx="44" cy="33" r="2.5" fill={eyeColor} />
            <circle cx="44.8" cy="32.5" r="0.8" fill={highlightColor} />
            {/* Right eye */}
            <circle cx="56" cy="33" r="2.5" fill={eyeColor} />
            <circle cx="56.8" cy="32.5" r="0.8" fill={highlightColor} />
          </g>
          {/* Straight line mouth */}
          <line
            x1="45"
            y1="40"
            x2="55"
            y2="40"
            stroke={eyeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Curious expression */}
      {type === 'curious' && (
        <>
          <g className="pet-eyes">
            {/* Left eye - slightly larger */}
            <circle cx="44" cy="33" r="3" fill={eyeColor} />
            <circle cx="44.8" cy="32.2" r="0.8" fill={highlightColor} />
            {/* Right eye - slightly larger */}
            <circle cx="56" cy="33" r="3" fill={eyeColor} />
            <circle cx="56.8" cy="32.2" r="0.8" fill={highlightColor} />
          </g>
          {/* One eyebrow raised (above left eye) */}
          <line
            x1="41"
            y1="28"
            x2="47"
            y2="27"
            stroke={eyeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Small 'o' shaped mouth */}
          <circle cx="50" cy="40" r="1.5" fill="none" stroke={eyeColor} strokeWidth="1.5" />
        </>
      )}

      {/* Mischievous expression */}
      {type === 'mischievous' && (
        <>
          <g className="pet-eyes">
            {/* Left eye - angled ellipse */}
            <ellipse
              cx="44"
              cy="33"
              rx="2.5"
              ry="2"
              fill={eyeColor}
              transform="rotate(-10 44 33)"
            />
            <circle cx="44.8" cy="32.5" r="0.8" fill={highlightColor} />
            {/* Right eye - angled ellipse */}
            <ellipse
              cx="56"
              cy="33"
              rx="2.5"
              ry="2"
              fill={eyeColor}
              transform="rotate(10 56 33)"
            />
            <circle cx="56.8" cy="32.5" r="0.8" fill={highlightColor} />
          </g>
          {/* Asymmetric smirk mouth */}
          <path
            d="M 45 40 Q 48 42 52 41 Q 54 40.5 55 40"
            stroke={eyeColor}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Sleepy expression */}
      {type === 'sleepy' && (
        <>
          <g className="pet-eyes">
            {/* Left eye - closed (horizontal line) */}
            <line
              x1="41"
              y1="33"
              x2="47"
              y2="33"
              stroke={eyeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Right eye - closed (horizontal line) */}
            <line
              x1="53"
              y1="33"
              x2="59"
              y2="33"
              stroke={eyeColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
          {/* Gentle curve mouth */}
          <path
            d="M 47 40 Q 50 41 53 40"
            stroke={eyeColor}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
};

export const ExpressionLayer = React.memo(ExpressionLayerComponent);
