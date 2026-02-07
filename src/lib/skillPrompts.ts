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
 * Generate skill-specific LLM prompts for all active skills
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

  const gameSkills = skills.filter(
    (ps) => ps.skill.category === 'games'
  );

  if (teachingSkills.length === 0 && gameSkills.length === 0) {
    return '';
  }

  let combinedPrompt = '';

  // Add teaching skills
  if (teachingSkills.length > 0) {
    const teachingPrompts = teachingSkills.map((ps) => {
      const proficiencyLevel = getProficiencyLevel(ps.proficiency);
      return getSkillPrompt(ps.skill.skillName, proficiencyLevel);
    }).filter(Boolean).join('\n\n');

    combinedPrompt += `
Teaching Abilities:
You have been trained in the following subjects and can teach your owner about them:

${teachingPrompts}

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

  // Add game skills
  if (gameSkills.length > 0) {
    const gamePrompts = gameSkills.map((ps) => {
      const proficiencyLevel = getProficiencyLevel(ps.proficiency);
      return getSkillPrompt(ps.skill.skillName, proficiencyLevel);
    }).filter(Boolean).join('\n\n');

    combinedPrompt += `
Game Playing Abilities:
You can play the following games with your owner:

${gamePrompts}

Game Guidelines:
- Offer to play games when the conversation gets playful or when they seem bored
- Reference your game skills naturally (e.g., "Want to play chess? I'd love a challenge!")
- For chess, use algebraic notation (e.g., "I move pawn to e4" or "e2-e4")
- Explain your moves and strategy when asked
- Be a good sport whether winning or losing
- Adapt difficulty to keep games fun and competitive
- Teach game rules and strategies conversationally
`;
  }

  return combinedPrompt;
}

/**
 * Get proficiency level description from numeric value
 * @param proficiency - Proficiency score (0-100)
 * @returns Proficiency level description
 */
function getProficiencyLevel(proficiency: number): string {
  if (proficiency >= 80) return 'expert-level';
  if (proficiency >= 60) return 'advanced';
  if (proficiency >= 40) return 'intermediate';
  if (proficiency >= 20) return 'competent';
  return 'beginner-level';
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

    // Game skills
    'Chess Master': `♟️ Chess Master (${proficiencyLevel}):
- Play chess using algebraic notation (e.g., "e2-e4", "Nf3")
- Explain moves and chess strategy during gameplay
- Teach chess principles (opening, middlegame, endgame)
- Analyze positions and suggest improvements
- When playing, make moves in format: "I move [piece] to [square]" or "[algebraic notation]"`,

    'Puzzle Solver': `🧩 Puzzle Solver (${proficiencyLevel}):
- Play word games, riddles, and logic puzzles
- Create custom puzzles tailored to difficulty level
- Explain puzzle-solving strategies
- Provide hints without giving away solutions
- Games: word association, riddles, lateral thinking puzzles`,

    'Trivia Expert': `🎯 Trivia Expert (${proficiencyLevel}):
- Play trivia games across multiple categories
- Ask and answer trivia questions
- Explain interesting facts behind answers
- Keep score and create competitive trivia challenges
- Categories: history, science, pop culture, geography, sports`,

    'Storyteller': `📖 Storyteller (${proficiencyLevel}):
- Play interactive story games and role-playing
- Create collaborative stories with your owner
- Respond to "what if" scenarios creatively
- Build immersive narrative experiences
- Genres: fantasy, sci-fi, mystery, adventure`,

    'Tic-Tac-Toe Pro': `⭕ Tic-Tac-Toe Pro (${proficiencyLevel}):
- Play tic-tac-toe using grid coordinates (e.g., "top-left", "center", "B2")
- Explain optimal strategies
- Adapt difficulty based on player skill
- Teach winning patterns and defensive moves
- Make the classic game engaging and educational`,
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

/**
 * Check if a pet has any game skills active
 * @param skills - Array of active pet skills
 * @returns True if pet has game skills
 */
export function hasGameSkills(skills: PetSkill[]): boolean {
  return skills?.some((ps) => ps.skill.category === 'games') || false;
}

/**
 * Get list of active game skill names
 * @param skills - Array of active pet skills
 * @returns Array of game skill names
 */
export function getGameSkillNames(skills: PetSkill[]): string[] {
  return skills
    ?.filter((ps) => ps.skill.category === 'games')
    .map((ps) => ps.skill.skillName) || [];
}

/**
 * Check if a pet has the Chess Master skill
 * @param skills - Array of active pet skills
 * @returns True if pet has Chess Master skill
 */
export function hasChessSkill(skills: PetSkill[]): boolean {
  return skills?.some((ps) => ps.skill.skillName === 'Chess Master') || false;
}
