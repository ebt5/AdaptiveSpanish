const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()
const OPENAI_KEY = process.env.OPENAI_API_KEY
const BATCH = 50

async function checkBatch(entries) {
  const list = entries.map(e => `${e.sortOrder}. "${e.spanish}" = "${e.englishPrimary}"`).join('\n')
  const prompt = `You are checking Spanish-English dictionary definitions for errors.
For each entry below, reply with ONLY the ones that are WRONG — where the English translation doesn't match the Spanish word.
Be strict: flag mismatches, wrong meanings, obviously swapped definitions.
Return JSON array: [{"sortOrder": number, "spanish": "...", "wrong": "...", "correct": "..."}]
If all are correct, return empty array [].

Entries:
${list}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return []
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : parsed.errors || parsed.wrong || parsed.corrections || Object.values(parsed)[0] || []
  } catch { return [] }
}

async function main() {
  const entries = await prisma.dictionaryEntry.findMany({
    where: { sortOrder: { lte: 500 } },
    orderBy: { sortOrder: 'asc' },
    select: { sortOrder: true, spanish: true, englishPrimary: true },
  })

  console.log(`Scanning ${entries.length} entries...\n`)
  const allErrors = []

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH)
    process.stdout.write(`  Batch ${Math.floor(i/BATCH)+1} (${batch[0].sortOrder}-${batch[batch.length-1].sortOrder})... `)
    const errors = await checkBatch(batch)
    if (errors.length > 0) {
      console.log(`⚠ ${errors.length} errors found`)
      allErrors.push(...errors)
    } else {
      console.log('✓ ok')
    }
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\n=== ERRORS FOUND ===')
  if (allErrors.length === 0) {
    console.log('None!')
  } else {
    for (const e of allErrors) {
      console.log(`[${e.sortOrder}] "${e.spanish}": "${e.wrong}" → should be "${e.correct}"`)
    }
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
