import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

async function main() {
  const data = JSON.parse(readFileSync(join(__dirname, '../data/phrases.json'), 'utf8'))

  let created = 0
  let updated = 0

  for (const phrase of data) {
    const result = await prisma.phrase.upsert({
      where: { sortOrder: phrase.sortOrder },
      update: {
        spanish: phrase.spanish,
        english: phrase.english,
        englishVariantsJson: phrase.englishVariants ?? [],
        grammarTag: phrase.grammarTag ?? 'general',
        difficultyLevel: phrase.difficultyLevel ?? 1,
        grammarNote: phrase.grammarNote || null,
      },
      create: {
        sortOrder: phrase.sortOrder,
        spanish: phrase.spanish,
        english: phrase.english,
        englishVariantsJson: phrase.englishVariants ?? [],
        grammarTag: phrase.grammarTag ?? 'general',
        difficultyLevel: phrase.difficultyLevel ?? 1,
        grammarNote: phrase.grammarNote || null,
      },
    })
    if (result) created++
  }

  console.log(`Seeded ${data.length} phrases (upserted).`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
