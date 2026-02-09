import React from 'react';
import type { PatternType, HSLColor, BodySize } from '@/lib/traits/types';
import { hslToString } from '@/lib/traits/colorHarmony';

interface PatternLayerProps {
  type: PatternType;
  color: HSLColor;
  size: BodySize;
}

const PatternLayerComponent: React.FC<PatternLayerProps> = ({ type, color, size }) => {
  const uniqueId = React.useId();

  // Scale mapping for body size
  const scale = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1.0;

  // If pattern type is 'none', render nothing
  if (type === 'none') {
    return null;
  }

  const patternColor = hslToString(color);

  // Unique IDs for SVG defs to avoid conflicts with multiple PetSVGs on same page
  const clipPathId = `pattern-clip-${uniqueId}`;
  const gradientId = `pattern-gradient-${uniqueId}`;

  return (
    <g transform={`translate(50, 50) scale(${scale}) translate(-50, -50)`}>
      {/* Define clip path matching body ellipse dimensions */}
      <defs>
        <clipPath id={clipPathId}>
          <ellipse cx="50" cy="55" rx="22" ry="28" />
        </clipPath>
        {type === 'gradient' && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={patternColor} stopOpacity="0" />
            <stop offset="100%" stopColor={patternColor} stopOpacity="1" />
          </linearGradient>
        )}
      </defs>

      <g clipPath={`url(#${clipPathId})`}>
        {/* Striped pattern: horizontal curved lines */}
        {type === 'striped' && (
          <>
            <path
              d="M 32 45 Q 50 43 68 45"
              stroke={patternColor}
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 30 55 Q 50 53 70 55"
              stroke={patternColor}
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 32 65 Q 50 63 68 65"
              stroke={patternColor}
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 34 75 Q 50 73 66 75"
              stroke={patternColor}
              strokeWidth="2"
              fill="none"
              opacity="0.7"
            />
          </>
        )}

        {/* Spotted pattern: scattered circles */}
        {type === 'spotted' && (
          <>
            <circle cx="42" cy="48" r="3" fill={patternColor} opacity="0.6" />
            <circle cx="58" cy="52" r="4" fill={patternColor} opacity="0.6" />
            <circle cx="38" cy="60" r="2.5" fill={patternColor} opacity="0.6" />
            <circle cx="62" cy="58" r="3.5" fill={patternColor} opacity="0.6" />
            <circle cx="50" cy="65" r="3" fill={patternColor} opacity="0.6" />
            <circle cx="45" cy="72" r="2" fill={patternColor} opacity="0.6" />
            <circle cx="55" cy="70" r="2.5" fill={patternColor} opacity="0.6" />
          </>
        )}

        {/* Gradient pattern: overlay ellipse with gradient fill */}
        {type === 'gradient' && (
          <ellipse
            cx="50"
            cy="55"
            rx="22"
            ry="28"
            fill={`url(#${gradientId})`}
            opacity="0.5"
          />
        )}
      </g>
    </g>
  );
};

export const PatternLayer = React.memo(PatternLayerComponent);
