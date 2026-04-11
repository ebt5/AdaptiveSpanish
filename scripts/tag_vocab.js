/**
 * Tag vocabulary words with categories using GPT-4o mini
 * Run: node scripts/tag_vocab.js
 */
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()
const OPENAI_KEY = process.env.OPENAI_API_KEY
const BATCH = 40

const CATEGORIES = [
  'essentials',      // yes, no, please, thanks, greetings
  'pronouns',        // I, you, he, she, we, they, it
  'connectors',      // and, but, because, if, or, that, which
  'numbers',         // one, two, three, much, more, all, nothing
  'time',            // day, year, now, when, before, after, always
  'place',           // here, there, far, near, city, street, house
  'people',          // man, woman, child, friend, family, father
  'body',            // hand, eye, head, heart, face, foot
  'food',            // eat, drink, water, bread, coffee, food
  'home',            // house, door, bed, kitchen, room, furniture
  'work',            // work, job, office, write, read, study
  'travel',          // car, road, hotel, airport, map, arrive
  'nature',          // sun, sky, rain, mountain, water, earth
  'health',          // doctor, sick, pain, hospital, medicine
  'emotions',        // happy, sad, love, fear, want, feel
  'communication',   // say, ask, call, speak, tell, hear
  'actions',         // go, come, do, give, take, find, leave, put
  'descriptions',    // big, good, new, fast, easy, same, bad
  'money',           // buy, price, money, pay, store
  'social',          // please, thank, sorry, help, together
]

async function tagBatch(entries) {
  const list = entries.map(e => `${e.sortOrder}. "${e.spanish}" (${e.englishPrimary ?? e.spanish})`).join('\n')
  const prompt = `Tag each Spanish word with 1-3 categories from this list: ${CATEGORIES.join(', ')}.
Return JSON array: [{"sortOrder": number, "tags": ["cat1", "cat2"]}]
Only use categories from the list above.

Words:
${list}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  })
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return []
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : parsed.words || parsed.tags || Object.values(parsed)[0] || []
  } catch { return [] }
}

async function main() {
  const entries = await prisma.dictionaryEntry.findMany({
    where: { sortOrder: { lte: 500 } },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true, spanish: true, englishPrimary: true, tags: true },
  })

  console.log(`Tagging ${entries.length} entries...`)
  let updated = 0

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH)
    process.stdout.write(`  Batch ${Math.floor(i/BATCH)+1}: ${batch[0].sortOrder}-${batch[batch.length-1].sortOrder}... `)
    const tags = await tagBatch(batch)
    for (const t of tags) {
      const entry = batch.find(e => e.sortOrder === t.sortOrder)
      if (entry && Array.isArray(t.tags) && t.tags.length > 0) {
        await prisma.dictionaryEntry.update({ where: { id: entry.id }, data: { tags: t.tags } })
        updated++
      }
    }
    console.log(`✓ ${tags.length} tagged`)
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`\nDone! ${updated} entries tagged.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
