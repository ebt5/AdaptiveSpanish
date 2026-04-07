const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const prisma = new PrismaClient()

// Normalize Spanish word to match filename
function toFilename(spanish) {
  return 'vocab_' + spanish
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    + '.jpg'
}

const vocabDir = '/Users/prickle/.openclaw/workspace/AdaptiveSpanish/public/vocab'
const files = new Set(fs.readdirSync(vocabDir))

async function main() {
  const entries = await prisma.dictionaryEntry.findMany({
    select: { id: true, spanish: true, imageUrl: true }
  })

  let updated = 0
  for (const entry of entries) {
    const filename = toFilename(entry.spanish)
    if (files.has(filename)) {
      const imageUrl = `/vocab/${filename}`
      if (entry.imageUrl !== imageUrl) {
        await prisma.dictionaryEntry.update({
          where: { id: entry.id },
          data: { imageUrl }
        })
        updated++
        console.log(`  ${entry.spanish} → ${imageUrl}`)
      }
    }
  }
  
  console.log(`\nUpdated ${updated} entries with imageUrl`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
