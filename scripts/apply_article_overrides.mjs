import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvPath = path.join(__dirname, '..', 'data', 'article_overrides_top1000.csv')

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines.shift().split(',')
  return lines.map((line) => {
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
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

async function main() {
  await prisma.dictionaryEntry.updateMany({ data: { spanishDisplay: null } })
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  let count = 0
  for (const row of rows) {
    const res = await prisma.dictionaryEntry.updateMany({
      where: { sortOrder: Number(row.sortOrder), spanish: row.spanishLemma },
      data: { spanishDisplay: row.spanishWithArticle },
    })
    count += res.count
  }
  console.log(`Applied ${count} article overrides`) 
}

main().finally(() => prisma.$disconnect())
