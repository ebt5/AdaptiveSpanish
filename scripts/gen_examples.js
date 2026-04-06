const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const OPENAI_KEY = process.env.OPENAI_API_KEY
const BATCH_SIZE = 25  // words per GPT call

async function generateExamples(entries) {
  const wordList = entries.map(e => `${e.sortOrder}. "${e.spanish}" (${e.englishPrimary || e.spanish})`).join('\n')
  
  const prompt = `For each Spanish word below, provide ONE short example sentence in Spanish using that word, and its English translation. Keep sentences simple (A1-B1 level), 5-10 words each. Return JSON array with objects: {"sortOrder": number, "exampleEs": "...", "exampleEn": "..."}

Words:
${wordList}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })
  
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) { console.error('No content:', data); return [] }
  
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : parsed.examples || parsed.sentences || Object.values(parsed)[0] || []
  } catch (e) {
    console.error('Parse error:', e.message, content.slice(0, 200))
    return []
  }
}

async function main() {
  const entries = await prisma.dictionaryEntry.findMany({
    where: { exampleEs: null, sortOrder: { lte: 500 } },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true, spanish: true, englishPrimary: true },
  })
  
  console.log(`${entries.length} entries need examples (sortOrder 1-500)`)
  
  let updated = 0
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: sortOrder ${batch[0].sortOrder}-${batch[batch.length - 1].sortOrder}`)
    
    const examples = await generateExamples(batch)
    
    for (const ex of examples) {
      const entry = batch.find(e => e.sortOrder === ex.sortOrder)
      if (entry && ex.exampleEs && ex.exampleEn) {
        await prisma.dictionaryEntry.update({
          where: { id: entry.id },
          data: { exampleEs: ex.exampleEs, exampleEn: ex.exampleEn },
        })
        updated++
      }
    }
    
    console.log(`  → ${examples.length} examples, ${updated} total updated`)
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500))
  }
  
  console.log(`Done! ${updated} entries updated with examples.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
