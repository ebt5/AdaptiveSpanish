import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '..', 'data', 'doozan_dictionary_preview.csv')
const DEMO_EMAIL = 'eriktaylor@gmail.com'
const LEARNING_TARGET = 20
const BATCH_SIZE = 1000

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines.shift().split(',')
  const rows = []
  for (const line of lines) {
    const vals = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ } else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        vals.push(cur); cur = ''
      } else cur += ch
    }
    vals.push(cur)
    rows.push(Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ''])))
  }
  return rows
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const raw = fs.readFileSync(csvPath, 'utf8')
  const rows = parseCsv(raw)
  const user = await prisma.user.upsert({ where: { email: DEMO_EMAIL }, update: {}, create: { email: DEMO_EMAIL } })

  const entryData = rows.map((row) => ({
    sortOrder: Number(row.sortOrder),
    englishPrimary: row.englishPrimary || row.spanish,
    englishVariantsJson: row.englishVariantsJson ? JSON.parse(row.englishVariantsJson) : [],
    spanish: row.spanish,
    category: 'vocabulary',
  }))

  for (const batch of chunk(entryData, BATCH_SIZE)) {
    await prisma.dictionaryEntry.createMany({ data: batch, skipDuplicates: true })
  }

  const totalEntries = await prisma.dictionaryEntry.count()
  console.log(`dictionary entries present: ${totalEntries}`)

  await prisma.userVocabProgress.deleteMany({ where: { userId: user.id } })
  await prisma.drillAttempt.deleteMany({ where: { userId: user.id } })

  const entries = await prisma.dictionaryEntry.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true } })
  const progressData = entries.map((entry, index) => ({
    userId: user.id,
    entryId: entry.id,
    bucket: index < LEARNING_TARGET ? 'learning' : 'unseen',
    score: 0,
  }))

  for (const batch of chunk(progressData, BATCH_SIZE)) {
    await prisma.userVocabProgress.createMany({ data: batch })
  }

  console.log(`Prepared progress for ${entries.length} dictionary entries for ${DEMO_EMAIL}`)
}

main().finally(() => prisma.$disconnect())
