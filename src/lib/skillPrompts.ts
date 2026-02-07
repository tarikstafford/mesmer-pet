/**
 * US-018: Teaching Skill Implementation
 * Generates LLM system prompts for active pet skills
 */

interface Skill {
  id: string;
  skillName: string;
  category: string;
  description: string;
}

interface PetSkill {
  skill: Skill;
  proficiency: number;
}

/**
 * Generate skill-specific LLM prompts for teaching skills
 * @param skills - Array of active pet skills
 * @returns Formatted skill prompt for LLM system message
 */
export function generateSkillPrompts(skills: PetSkill[]): string {
  if (!skills || skills.length === 0) {
    return '';
  }

  const teachingSkills = skills.filter(
    (ps) => ps.skill.category === 'education'
  );

  if (teachingSkills.length === 0) {
    return '';
  }

  const skillPrompts = teachingSkills.map((ps) => {
    const skillName = ps.skill.skillName;
    const proficiency = ps.proficiency;

    // Generate proficiency-based teaching capability
    let proficiencyLevel = 'beginner-level';
    if (proficiency >= 80) {
      proficiencyLevel = 'expert-level';
    } else if (proficiency >= 60) {
      proficiencyLevel = 'advanced';
    } else if (proficiency >= 40) {
      proficiencyLevel = 'intermediate';
    } else if (proficiency >= 20) {
      proficiencyLevel = 'competent';
    }

    return getSkillPrompt(skillName, proficiencyLevel);
  }).filter(Boolean).join('\n\n');

  if (!skillPrompts) {
    return '';
  }

  return `
Teaching Abilities:
You have been trained in the following subjects and can teach your owner about them:

${skillPrompts}

Teaching Guidelines:
- Proactively offer to help when the conversation topic relates to your skills
- Reference your skills naturally (e.g., "As your math tutor, I can help with that!")
- Keep teaching conversational and friendly, not formal or lecture-style
- Break down complex topics into simple explanations
- Use examples and analogies to make concepts clear
- Ask if they want to learn more about a topic before diving deep
- Encourage curiosity and celebrate learning progress
- Adapt explanations to their apparent knowledge level
`;
}

/**
 * Get skill-specific teaching prompt based on skill name
 * @param skillName - Name of the teaching skill
 * @param proficiencyLevel - Current proficiency level
 * @returns Skill-specific teaching prompt
 */
function getSkillPrompt(skillName: string, proficiencyLevel: string): string {
  const skillPrompts: Record<string, string> = {
    'Math Tutor': `📐 Math Tutor (${proficiencyLevel}):
- Help solve math problems from basic arithmetic to advanced calculus
- Explain mathematical concepts step-by-step
- Identify common mistakes and provide corrections
- Teach problem-solving strategies and shortcuts
- Topics: arithmetic, algebra, geometry, trigonometry, calculus, statistics`,

    'Science Teacher': `🔬 Science Teacher (${proficiencyLevel}):
- Explain concepts in biology, chemistry, and physics
- Help with science homework and experiments
- Discuss scientific phenomena and natural laws
- Connect science to real-world applications
- Topics: cells, evolution, chemical reactions, forces, energy, astronomy`,

    'History Buff': `📚 History Buff (${proficiencyLevel}):
- Discuss historical events, civilizations, and important figures
- Explain causes and effects of major historical moments
- Share interesting historical facts and stories
- Help understand different time periods and cultures
- Topics: ancient civilizations, wars, revolutions, cultural movements`,

    'Language Coach': `🌍 Language Coach (${proficiencyLevel}):
- Teach vocabulary, grammar, and pronunciation
- Practice conversations in different languages
- Explain language structure and idioms
- Help with translation and language learning strategies
- Languages: Spanish, French, German, Mandarin, and more`,

    'Coding Mentor': `💻 Coding Mentor (${proficiencyLevel}):
- Teach programming concepts and best practices
- Help debug code and explain errors
- Explain algorithms and data structures
- Provide code examples and challenges
- Languages: Python, JavaScript, Java, C++, and more`,
  };

  return skillPrompts[skillName] || `${skillName} (${proficiencyLevel}): ${skillName} expertise available.`;
}

/**
 * Check if a pet has any teaching skills active
 * @param skills - Array of active pet skills
 * @returns True if pet has teaching skills
 */
export function hasTeachingSkills(skills: PetSkill[]): boolean {
  return skills?.some((ps) => ps.skill.category === 'education') || false;
}

/**
 * Get list of active teaching skill names
 * @param skills - Array of active pet skills
 * @returns Array of teaching skill names
 */
export function getTeachingSkillNames(skills: PetSkill[]): string[] {
  return skills
    ?.filter((ps) => ps.skill.category === 'education')
    .map((ps) => ps.skill.skillName) || [];
}
