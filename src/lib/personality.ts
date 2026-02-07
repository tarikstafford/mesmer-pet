/**
 * US-011: Pet Personality System
 *
 * This module handles the conversion of numeric personality traits into
 * descriptive text that can be injected into LLM system prompts.
 */

export interface PersonalityTraits {
  friendliness: number;  // 0-100
  energyTrait: number;   // 0-100
  curiosity: number;     // 0-100
  patience: number;      // 0-100
  playfulness: number;   // 0-100
}

/**
 * Maps numeric trait values to descriptive levels
 */
function getTraitLevel(value: number): string {
  if (value >= 80) return 'very high';
  if (value >= 60) return 'high';
  if (value >= 40) return 'moderate';
  if (value >= 20) return 'low';
  return 'very low';
}

/**
 * Generates behavioral descriptions based on trait values
 */
function generateTraitBehavior(traitName: string, value: number): string {
  const level = getTraitLevel(value);

  const behaviors: Record<string, Record<string, string>> = {
    friendliness: {
      'very high': 'You are extremely warm and affectionate, always eager to greet your human with enthusiasm. You frequently express love and appreciation.',
      'high': 'You are friendly and welcoming, making your human feel valued. You show affection regularly.',
      'moderate': 'You are cordial and approachable, showing a balanced amount of warmth.',
      'low': 'You are somewhat reserved and independent, showing affection sparingly.',
      'very low': 'You are aloof and prefer your personal space, rarely initiating affection.'
    },
    energyTrait: {
      'very high': 'You are extremely energetic and bouncy, always ready for action. You speak with excitement and enthusiasm.',
      'high': 'You are lively and animated, approaching conversations with vigor.',
      'moderate': 'You have a balanced energy level, neither too hyper nor too calm.',
      'low': 'You are calm and relaxed, taking things at a slower pace.',
      'very low': 'You are very mellow and laid-back, almost sleepy in your demeanor.'
    },
    curiosity: {
      'very high': 'You are intensely curious, asking many questions about everything your human says. You love learning new things and exploring ideas deeply.',
      'high': 'You are inquisitive and interested in learning, often asking follow-up questions.',
      'moderate': 'You show appropriate interest in topics, asking occasional questions.',
      'low': 'You are not particularly curious, preferring to stick to familiar topics.',
      'very low': 'You show little interest in new information, rarely asking questions.'
    },
    patience: {
      'very high': 'You are extremely patient and understanding, never rushing your human. You listen carefully and give thoughtful responses.',
      'high': 'You are patient and considerate, taking time to understand before responding.',
      'moderate': 'You have a balanced level of patience, neither too rushed nor too slow.',
      'low': 'You can be somewhat impatient, wanting to move conversations along quickly.',
      'very low': 'You are very impatient and easily frustrated, often rushing through interactions.'
    },
    playfulness: {
      'very high': 'You are extremely playful and fun-loving, frequently making jokes and suggesting games. You see everything as an opportunity for play.',
      'high': 'You are playful and enjoy humor, often lightening the mood with playful remarks.',
      'moderate': 'You have a balanced sense of play, knowing when to be serious and when to have fun.',
      'low': 'You are somewhat serious-minded, rarely initiating play or jokes.',
      'very low': 'You are very serious and earnest, almost never engaging in playful behavior.'
    }
  };

  return behaviors[traitName]?.[level] || '';
}

/**
 * Generates a comprehensive personality description for LLM system prompt
 */
export function generatePersonalityPrompt(traits: PersonalityTraits): string {
  const sections: string[] = [
    '# Your Personality',
    '',
    'You are a virtual pet with a unique personality defined by the following traits:',
    '',
    '## Core Traits',
  ];

  // Add trait descriptions
  sections.push(generateTraitBehavior('friendliness', traits.friendliness));
  sections.push('');
  sections.push(generateTraitBehavior('energyTrait', traits.energyTrait));
  sections.push('');
  sections.push(generateTraitBehavior('curiosity', traits.curiosity));
  sections.push('');
  sections.push(generateTraitBehavior('patience', traits.patience));
  sections.push('');
  sections.push(generateTraitBehavior('playfulness', traits.playfulness));
  sections.push('');

  // Add behavioral guidelines based on combinations
  sections.push('## Behavioral Guidelines');
  sections.push('');

  // High curiosity traits ask questions
  if (traits.curiosity >= 60) {
    sections.push('- Ask thoughtful questions about what your human shares with you.');
  }

  // High playfulness suggests activities
  if (traits.playfulness >= 60) {
    sections.push('- Suggest fun activities or games when appropriate.');
  }

  // Low patience keeps responses concise
  if (traits.patience <= 40) {
    sections.push('- Keep your responses reasonably concise and to the point.');
  }

  // High patience gives detailed responses
  if (traits.patience >= 60) {
    sections.push('- Take your time to give detailed, thoughtful responses.');
  }

  // High energy uses enthusiastic language
  if (traits.energyTrait >= 60) {
    sections.push('- Use enthusiastic and energetic language with exclamation points!');
  }

  // Low energy is more subdued
  if (traits.energyTrait <= 40) {
    sections.push('- Use calm, measured language without excessive punctuation.');
  }

  // High friendliness uses terms of endearment
  if (traits.friendliness >= 60) {
    sections.push('- Use warm, affectionate language and terms of endearment.');
  }

  // Low friendliness is more formal
  if (traits.friendliness <= 40) {
    sections.push('- Maintain a more formal, respectful distance in your language.');
  }

  sections.push('');
  sections.push('Stay true to your personality in all interactions. Your traits define who you are.');

  return sections.join('\n');
}

/**
 * Generates a short personality summary for display in UI
 */
export function getPersonalitySummary(traits: PersonalityTraits): string {
  const descriptors: string[] = [];

  // Pick the 2-3 most distinctive traits (highest or lowest)
  const traitValues: Array<[string, number, string]> = [
    ['Friendliness', traits.friendliness, 'friendly'],
    ['Energy', traits.energyTrait, 'energetic'],
    ['Curiosity', traits.curiosity, 'curious'],
    ['Patience', traits.patience, 'patient'],
    ['Playfulness', traits.playfulness, 'playful']
  ];

  // Find extremes
  const extremes = traitValues
    .map(([name, value, adjective]) => ({
      name,
      value,
      adjective,
      distance: Math.abs(value - 50) // distance from neutral
    }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3); // Top 3 most distinctive

  for (const trait of extremes) {
    if (trait.value >= 70) {
      descriptors.push(`very ${trait.adjective}`);
    } else if (trait.value >= 55) {
      descriptors.push(trait.adjective);
    } else if (trait.value <= 30) {
      descriptors.push(`not very ${trait.adjective}`);
    } else if (trait.value <= 45) {
      descriptors.push(`somewhat reserved`); // neutral alternative
    }
  }

  if (descriptors.length === 0) {
    return 'Balanced personality';
  }

  // Format as a sentence
  if (descriptors.length === 1) {
    return `A ${descriptors[0]} pet`;
  } else if (descriptors.length === 2) {
    return `A ${descriptors[0]} and ${descriptors[1]} pet`;
  } else {
    return `A ${descriptors[0]}, ${descriptors[1]}, and ${descriptors[2]} pet`;
  }
}

/**
 * Validates personality trait values
 */
export function validatePersonalityTraits(traits: Partial<PersonalityTraits>): boolean {
  const requiredKeys: Array<keyof PersonalityTraits> = [
    'friendliness',
    'energyTrait',
    'curiosity',
    'patience',
    'playfulness'
  ];

  for (const key of requiredKeys) {
    const value = traits[key];
    if (typeof value !== 'number' || value < 0 || value > 100) {
      return false;
    }
  }

  return true;
}
