import React from 'react';
import type { HSLColor, BodySize } from '@/lib/traits/types';
import { hslToString } from '@/lib/traits/colorHarmony';

interface BodyLayerProps {
  color: HSLColor;
  size: BodySize;
}

const BodyLayerComponent: React.FC<BodyLayerProps> = ({ color, size }) => {
  // Scale mapping for body size
  const scale = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1.0;

  // Convert HSL color to CSS string
  const fillColor = hslToString(color);

  // Create slightly darker stroke color (same hue and saturation, lightness - 15)
  const strokeColor = hslToString({
    h: color.h,
    s: color.s,
    l: Math.max(0, color.l - 15)
  });

  return (
    <g transform={`translate(50, 50) scale(${scale}) translate(-50, -50)`}>
      {/* Body ellipse - centered at (50, 55) */}
      <ellipse
        cx="50"
        cy="55"
        rx="22"
        ry="28"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
      {/* Head circle - centered at (50, 35), sits above body */}
      <circle
        cx="50"
        cy="35"
        r="16"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
    </g>
  );
};

export const BodyLayer = React.memo(BodyLayerComponent);
