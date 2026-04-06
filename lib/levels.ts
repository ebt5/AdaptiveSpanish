// Level backgrounds — add new entries as images are provided
// Level 1 is the starting background, higher levels unlock in order

export interface LevelBackground {
  level: number
  image: string | null      // path under /backgrounds/, null = solid black
  name: string
  description: string
}

export const LEVEL_BACKGROUNDS: LevelBackground[] = [
  {
    level: 1,
    image: '/backgrounds/level-1.jpg',
    name: 'Antigua Guatemala',
    description: 'The cobblestone streets and colorful colonial architecture of Antigua, framed by the Volcán de Agua. A UNESCO World Heritage Site and one of Latin America\'s most beautiful cities.',
  },
  {
    level: 2,
    image: '/backgrounds/level-2.jpg',
    name: 'Mexico City',
    description: 'The golden domes and baroque towers of the capital, with the Mexican flag flying over a sea of colorful buildings stretching to the horizon. One of the world\'s largest and most vibrant cities.',
  },
  {
    level: 3,
    image: '/backgrounds/level-3.jpg',
    name: 'La Alhambra, Granada',
    description: 'The red fortress towers and lush gardens of the Alhambra, with the snow-capped Sierra Nevada rising behind. The last great Moorish palace in Spain and one of the most visited monuments in Europe.',
  },
  {
    level: 4,
    image: '/backgrounds/level-4.jpg',
    name: 'Salamanca',
    description: 'The golden sandstone Plaza Mayor and twin cathedrals of Salamanca, home to one of the oldest universities in Europe. Look closely — there\'s an astronaut carved into the cathedral facade.',
  },
  {
    level: 5,
    image: '/backgrounds/level-5.jpg',
    name: 'Buenos Aires',
    description: 'The Torre Monumental rises above the lush trees of Plaza San Martín, with the modern skyline of Retiro behind. The Paris of South America — where tango, steak, and porteño culture come alive.',
  },
  {
    level: 6,
    image: '/backgrounds/level-6.jpg',
    name: 'Valle de Viñales, Cuba',
    description: 'Terraced tobacco fields wind between the mogotes — the dramatic limestone hills of western Cuba. Oxcarts and thatched-roof bohíos dot the valley, where some of the world\'s finest cigars begin their journey.',
  },
  {
    level: 7,
    image: '/backgrounds/level-7.jpg',
    name: 'Cartagena, Colombia',
    description: 'The colorful walled old city of Cartagena, where the iconic Torre del Reloj watches over cobblestone streets lined with bougainvillea-draped balconies. A Caribbean jewel where colonial history meets tropical warmth.',
  },
  {
    level: 8,
    image: '/backgrounds/level-8.jpg',
    name: 'Plaza San Martín, Buenos Aires',
    description: 'The Torre Monumental rises above the lush canopy of Plaza San Martín, viewed from a stone balustrade. A peaceful corner of Buenos Aires where jacarandas bloom and clay dogs roam the green.',
  },
  {
    level: 9,
    image: null,
    name: 'Coming soon…',
    description: 'Keep drilling to discover new scenes.',
  },
  {
    level: 10,
    image: null,
    name: 'Coming soon…',
    description: 'Keep drilling to discover new scenes.',
  },
]

// Level-up triggers:
//  - Vocab:   every 50 words mastered
//  - Verbs:   each tense with all 6 pronouns at score >= 8
//  - Phrases: every 10 phrases mastered

export const VOCAB_WORDS_PER_LEVEL = 50
export const PHRASES_PER_LEVEL = 10
export const VERB_TENSE_THRESHOLD = 8  // score >= this on all 6 pronouns = tense complete

export interface LevelState {
  totalLevel: number
  vocabLevels: number
  verbLevels: number
  phraseLevels: number
  vocabMastered: number
  vocabToNext: number
  phraseMastered: number
  phrasesToNext: number
  verbTensesComplete: string[]
  verbNearestTense: { tense: string; pronounsDone: number; total: number } | null
  currentBg: LevelBackground
}

export function calculateLevel(
  vocabMastered: number,
  phraseMastered: number,
  verbScores: Record<string, Record<string, number>>,  // { pronoun: { tense: score } }
  allTenses: string[],
  allPronouns: string[],
): LevelState {
  const vocabLevels = Math.floor(vocabMastered / VOCAB_WORDS_PER_LEVEL)
  const phraseLevels = Math.floor(phraseMastered / PHRASES_PER_LEVEL)

  // Count complete tenses (all 6 pronouns at threshold)
  const verbTensesComplete: string[] = []
  let nearestTense: { tense: string; pronounsDone: number; total: number } | null = null
  let nearestCount = -1

  for (const tense of allTenses) {
    let done = 0
    for (const pronoun of allPronouns) {
      const score = verbScores[pronoun]?.[tense] ?? 0
      if (score >= VERB_TENSE_THRESHOLD) done++
    }
    if (done === allPronouns.length) {
      verbTensesComplete.push(tense)
    } else if (done > nearestCount) {
      nearestCount = done
      nearestTense = { tense, pronounsDone: done, total: allPronouns.length }
    }
  }

  const verbLevels = verbTensesComplete.length
  const totalLevel = vocabLevels + phraseLevels + verbLevels

  // Current background: use the highest level that has an entry
  const bgIndex = Math.min(totalLevel, LEVEL_BACKGROUNDS.length - 1)
  const currentBg = LEVEL_BACKGROUNDS[bgIndex] ?? LEVEL_BACKGROUNDS[0]

  return {
    totalLevel: totalLevel + 1,  // 1-indexed for display
    vocabLevels,
    verbLevels,
    phraseLevels,
    vocabMastered,
    vocabToNext: VOCAB_WORDS_PER_LEVEL - (vocabMastered % VOCAB_WORDS_PER_LEVEL),
    phraseMastered,
    phrasesToNext: PHRASES_PER_LEVEL - (phraseMastered % PHRASES_PER_LEVEL),
    verbTensesComplete,
    verbNearestTense: nearestTense,
    currentBg,
  }
}
