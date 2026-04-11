/**
 * Daily vocab image generator
 * Run: node scripts/gen_vocab_images.js [limit]
 * 
 * Generates claymation images for dictionary entries without imageUrl.
 * Starts from lowest sortOrder. Respects Imagen 4 quota (~64/day free tier).
 * Uses creative visual metaphors for abstract/grammatical words.
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const https = require('https')
require('dotenv').config()

const prisma = new PrismaClient()
const OUT_DIR = path.join(__dirname, '../public/vocab')
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'AIzaSyAIJ91EkrHFYw7gZcdYgRkbH4VvonnDD9Y'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`
const STYLE = 'Claymation stop-motion illustration style. Single subject centered on clean white background. Charming handcrafted clay aesthetic, visible clay textures, warm soft studio lighting, slight depth of field. Square 1:1 composition. IMPORTANT: Do NOT include any text, letters, words, labels, signs, or written characters anywhere in the image.'

// Visual prompt strategies for different word types
const PROMPT_OVERRIDES = {
  // Pronouns — clay figures
  'ella': 'A friendly clay woman figurine standing upright, colorful dress, warm smile, arms slightly out.',
  'yo': 'A clay figure pointing to their own chest with both hands, "me!" gesture, cheerful expression.',
  'él': 'A friendly clay man figurine standing upright, casual clothes, slight smile.',
  'tú': 'A clay figure pointing finger directly at viewer, friendly "you!" gesture.',
  'nosotros': 'Three small clay figures standing together in a close group, arm in arm.',
  'usted': 'A clay figure in formal attire with a small bow, respectful formal greeting gesture.',
  'ustedes': 'Several clay figures grouped together, formal setting, diverse sizes.',
  
  // Numbers
  'uno': 'A single large bold clay number 1, chunky and three-dimensional, bright primary color.',
  'dos': 'Two identical clay objects side by side — two bright clay apples.',
  'tres': 'Three clay balls in a triangle arrangement, each a different color.',
  'cuatro': 'Four clay cubes stacked in a 2x2 arrangement.',
  'cinco': 'Five clay stars arranged in a pattern, colorful and cheerful.',
  'seis': 'Six clay dots arranged like a dice face, classic six-spot pattern.',
  
  // Pure function words — creative metaphors
  'de': 'A clay arrow emerging from a clay origin point, tracing a path from source to destination.',
  'el': 'A single clay spotlight shining down on one specific clay object below.',
  'a': 'A clay arrow pointing toward a destination clay building in the distance.',
  'y': 'Two clay chains or links connecting together — two things joined as one.',
  'que': 'A clay speech bubble connecting two clay figures, the link between speaker and content.',
  'por': 'A clay figure walking through a clay tunnel or archway — through/by/via.',
  'para': 'A clay arrow aimed precisely at a clay bullseye target ahead.',
  'pero': 'A clay road splitting in two — one path blocked by a clay wall, the other open.',
  'si': 'A clay figure at a fork in the road looking uncertain, the conditional choice.',
  'o': 'Two clay paths diverging left and right with a clay sign in the middle.',
  'al': 'A clay arrow pointing forward toward a clay destination with motion lines.',
  'del': 'A clay object with a small clay arrow showing it belongs to another object.',
  'como': 'Two identical small clay cats side by side with a clay equals sign between them.',
  'tan': 'A single clay exclamation mark with radiating lines — emphasis and intensity.',
  'así': 'Clay hands demonstrating a gesture — "like this" teaching motion.',
  'sin': 'A clay object with a bold red X and an absence — empty space where something should be.',
  'sobre': 'A clay cube sitting precisely on top of a flat clay surface, on/above.',
  'también': 'Two clay stars side by side with a small clay plus sign — me too/also.',
  
  // Adverbs and abstracts
  'bien': 'A clay figure with both thumbs up and a big satisfied grin.',
  'sí': 'A large bold clay checkmark in bright green, emphatic yes.',
  'ya': 'A clay clipboard with a bold checkmark — already done, task complete.',
  'ahora': 'A clay clock with bold hands pointing to the present, exclamation point above.',
  'aquí': 'A bright clay map pin pointing straight down at a glowing spot on the ground.',
  'cuando': 'A clay clock face with a question mark inside — when? time unknown.',
  'algo': 'A clay gift box with a large question mark on the lid — something unknown inside.',
  'nada': 'A completely empty clay bowl on a clean surface — nothing at all.',
  'todo': 'A clay basket overflowing with many tiny different clay objects — everything.',
  'solo': 'A single small clay figure standing alone in open white space, upright and self-sufficient.',
  'tan': 'An oversized clay exclamation mark, bold and emphatic, suggesting intensity.',
  'mucho': 'A clay heap of many small objects piled high — a lot/much.',
  'otro': 'Two clay objects — one highlighted with a clay arrow pointing to the second one.',
  'así': 'Clay hands in a demonstrative gesture, showing how something is done.',
  'vez': 'A clay calendar page with a clay clock overlaid — one instance of time.',
  'suyo': 'A small clay trophy or object with a clay name tag attached showing ownership.',
  'mío': 'A clay hand firmly gripping a small clay object — mine!',
  'tuyo': 'A clay object with an arrow pointing toward a second clay figure — yours.',
  'nuestro': 'A clay circle of hands joined together around a shared clay object.',
  'éste': 'A clay finger pointing decisively at a specific clay object right in front.',
  'ése': 'A clay finger pointing at a clay object at medium distance — that one.',
  'ese': 'A clay finger pointing at a clay object nearby — that.',
  'este': 'A clay finger pointing at an object very close — this.',
  'mismo': 'Two identical clay mirrors facing each other — the same exact thing.',
  'gracias': 'Two clay hands in a grateful bow/clasp — thank you gesture.',
  'señor': 'A small clay gentleman figurine in a suit and hat, distinguished posture.',
  'cosa': 'A mysterious clay box with a question mark — a thing, an object.',
  'padre': 'A clay father figure with a smaller clay child figure beside him.',
  
  // Verbs without images
  'creer': 'A clay head with a small clay lightbulb glowing brightly inside — to believe/think.',
  'deber': 'A clay IOU note or bill with a clay arrow suggesting obligation — to owe.',
  'dejar': 'Clay hands opening and releasing a clay bird — to leave/let go.',
  'pasar': 'A clay figure walking past a clay doorway, mid-stride — to pass/happen.',
  'sentir': 'A clay hand touching a clay heart with radiating feeling lines — to feel.',
  'pensar': 'A clay head in profile with visible clay thought bubbles rising — to think.',
  'esperar': 'A clay figure sitting on a clay bench with a clock above — to wait/hope.',
  'mirar': 'A large friendly clay eye with a clay magnifying glass — to look/watch.',
  'necesitar': 'A clay hand reaching urgently for a clay object just out of reach — to need.',
  'llevar': 'A clay figure carrying a clay backpack and bag — to carry/wear/take.',
  'volver': 'A clay figure walking back toward a clay house with a curved return arrow — to return.',
  'llamar': 'A clay vintage telephone handset with small sound wave lines — to call.',
  'parecer': 'A clay mirror with a slightly different reflection — to seem/appear.',
  'encontrar': 'A clay magnifying glass over a small clay treasure — to find.',
  'mejor': 'Two clay bars like a chart — shorter one with X, taller one with a star — better.',
  'gustar': 'A clay figure with a huge smile looking at a clay ice cream — to like/please.',
  'alguno': 'A clay hand hovering over several clay objects, about to pick one — some/any.',
  'entonces': 'A clay "therefore" arrow symbol — a big arrow pointing forward in sequence.',
}

function normalizeForFilename(spanish) {
  return 'vocab_' + spanish
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    + '.jpg'
}

function buildPrompt(spanish, englishPrimary) {
  if (PROMPT_OVERRIDES[spanish]) {
    return `${PROMPT_OVERRIDES[spanish]} ${STYLE}`
  }
  // Auto-generate prompt from English definition
  return `Claymation illustration representing the Spanish word "${spanish}" meaning "${englishPrimary}". ${STYLE}`
}

function apiRequest(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1', outputOptions: { mimeType: 'image/jpeg' } }
    })
    const url = new URL(API_URL)
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode === 429) { reject(new Error('RATE_LIMIT')); return }
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
        try {
          const parsed = JSON.parse(data)
          const pred = parsed.predictions?.[0]
          if (!pred) { reject(new Error('No prediction')); return }
          resolve(Buffer.from(pred.bytesBase64Encoded, 'base64'))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const limit = parseInt(process.argv[2] || '60')
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const entries = await prisma.dictionaryEntry.findMany({
    where: { imageUrl: null },
    orderBy: { sortOrder: 'asc' },
    take: limit * 2, // fetch extra in case some fail
    select: { id: true, sortOrder: true, spanish: true, englishPrimary: true }
  })

  console.log(`Found ${entries.length} entries without images. Generating up to ${limit}...`)
  
  let generated = 0
  let rateLimited = false

  for (const entry of entries) {
    if (generated >= limit || rateLimited) break

    const filename = normalizeForFilename(entry.spanish)
    const outPath = path.join(OUT_DIR, filename)

    if (fs.existsSync(outPath)) {
      // File exists but DB not updated — fix it
      const imageUrl = `/vocab/${filename}`
      await prisma.dictionaryEntry.update({ where: { id: entry.id }, data: { imageUrl } })
      console.log(`  [skip+fix] ${entry.spanish} → DB updated`)
      continue
    }

    const prompt = buildPrompt(entry.spanish, entry.englishPrimary ?? entry.spanish)
    process.stdout.write(`  [${generated + 1}/${limit}] ${entry.spanish} (${entry.englishPrimary})... `)

    try {
      const imgBuffer = await apiRequest(prompt)
      fs.writeFileSync(outPath, imgBuffer)
      await prisma.dictionaryEntry.update({
        where: { id: entry.id },
        data: { imageUrl: `/vocab/${filename}` }
      })
      console.log(`✓ ${Math.round(imgBuffer.length / 1024)}KB`)
      generated++
      await sleep(1500) // be gentle with rate limits
    } catch (e) {
      if (e.message === 'RATE_LIMIT') {
        console.log('⚠ Rate limited — stopping for today')
        rateLimited = true
      } else {
        console.log(`✗ ${e.message}`)
        await sleep(3000)
      }
    }
  }

  console.log(`\nDone! Generated ${generated} images.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
