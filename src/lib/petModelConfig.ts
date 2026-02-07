// Configuration for mapping genetic traits to 3D model properties

export interface PetModelConfig {
  baseColor: string;
  patternType: 'none' | 'striped' | 'spotted' | 'gradient';
  patternColor?: string;
  hasGlowingEyes: boolean;
  hasCrystalHorns: boolean;
  hasRainbowShimmer: boolean;
  hasGalaxyPattern: boolean;
}

// Map trait names to hex colors
const TRAIT_COLOR_MAP: Record<string, string> = {
  'Sky Blue': '#87CEEB',
  'Leaf Green': '#90EE90',
  'Sunset Orange': '#FF8C42',
  'Bubblegum Pink': '#FF69B4',
  'Lavender Purple': '#E6E6FA',
};

// Extract model configuration from pet traits
export function getPetModelConfig(traitNames: string[]): PetModelConfig {
  const config: PetModelConfig = {
    baseColor: '#CCCCCC', // Default gray
    patternType: 'none',
    hasGlowingEyes: false,
    hasCrystalHorns: false,
    hasRainbowShimmer: false,
    hasGalaxyPattern: false,
  };

  // Find base color
  for (const trait of traitNames) {
    if (TRAIT_COLOR_MAP[trait]) {
      config.baseColor = TRAIT_COLOR_MAP[trait];
      break;
    }
  }

  // Find pattern type
  if (traitNames.includes('Striped Pattern')) {
    config.patternType = 'striped';
    config.patternColor = '#333333';
  } else if (traitNames.includes('Spotted Pattern')) {
    config.patternType = 'spotted';
    config.patternColor = '#444444';
  } else if (traitNames.includes('Gradient Fur')) {
    config.patternType = 'gradient';
  }

  // Special visual traits
  config.hasGlowingEyes = traitNames.includes('Glowing Eyes');
  config.hasCrystalHorns = traitNames.includes('Crystal Horns');
  config.hasRainbowShimmer = traitNames.includes('Rainbow Shimmer');
  config.hasGalaxyPattern = traitNames.includes('Galaxy Pattern');

  return config;
}

// Helper to get contrasting pattern color
export function getContrastingColor(baseColor: string): string {
  // Simple contrast: darker version of base or black
  return '#222222';
}
