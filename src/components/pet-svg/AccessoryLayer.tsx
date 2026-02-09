import React from 'react';
import type { AccessoryType, BodySize } from '@/lib/traits/types';

interface AccessoryLayerProps {
  type: AccessoryType;
  size: BodySize;
}

const AccessoryLayerComponent: React.FC<AccessoryLayerProps> = ({ type, size }) => {
  // Scale mapping for body size
  const scale = size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1.0;

  // If accessory type is 'none', render nothing
  if (type === 'none') {
    return null;
  }

  return (
    <g transform={`scale(${scale})`} transform-origin="50 50">
      {/* Horns: two small triangles on top of head */}
      {type === 'horns' && (
        <>
          {/* Left horn */}
          <polygon
            points="42,19 38,26 46,26"
            fill="#555"
          />
          {/* Right horn */}
          <polygon
            points="58,19 54,26 62,26"
            fill="#555"
          />
        </>
      )}

      {/* Wings: two elliptical wing shapes on sides of body */}
      {type === 'wings' && (
        <>
          {/* Left wing */}
          <ellipse
            cx="28"
            cy="55"
            rx="8"
            ry="14"
            fill="#ccc"
            opacity="0.6"
            transform="rotate(-20 28 55)"
          />
          {/* Right wing */}
          <ellipse
            cx="72"
            cy="55"
            rx="8"
            ry="14"
            fill="#ccc"
            opacity="0.6"
            transform="rotate(20 72 55)"
          />
        </>
      )}

      {/* Crown: three-pointed crown on top of head */}
      {type === 'crown' && (
        <polygon
          points="43,19 47,15 50,19 53,15 57,19 55,24 45,24"
          fill="#FFD700"
        />
      )}

      {/* Collar: arc around neck area between head and body */}
      {type === 'collar' && (
        <ellipse
          cx="50"
          cy="47"
          rx="16"
          ry="4"
          fill="none"
          stroke="#E74C3C"
          strokeWidth="2"
        />
      )}
    </g>
  );
};

export const AccessoryLayer = React.memo(AccessoryLayerComponent);
