/**
 * Local image generation server — runs on Mac mini
 * Handles image generation requests from the admin panel
 * Start: node scripts/local-image-server.js
 * Port: 3099
 */
require('dotenv').config()
const express = require('express')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()
const PORT = 3099
const GOOGLE_KEY = process.env.GOOGLE_API_KEY
const GEMINI_URL = `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_KEY}`
const VOCAB_DIR = path.join(__dirname, '../public/vocab')

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})

const STYLE = 'Claymation stop-motion illustration style. Single subject centered on clean white background. Charming handcrafted clay aesthetic, visible clay textures, warm soft studio lighting. Square 1:1 composition. IMPORTANT: Do NOT include any text, letters, words, labels, signs, or written characters anywhere in the image.'

function geminiGenerate(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    })
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: GEMINI_URL,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const d = JSON.parse(data)
          for (const cand of d.candidates ?? []) {
            for (const part of cand.content?.parts ?? []) {
              if (part.inlineData) return resolve(Buffer.from(part.inlineData.data, 'base64'))
            }
          }
          reject(new Error('No image in response: ' + JSON.stringify(d).slice(0, 200)))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

app.post('/generate-image', async (req, res) => {
  const { entryId } = req.body
  if (!entryId) return res.status(400).json({ error: 'entryId required' })

  try {
    const entry = await prisma.dictionaryEntry.findUnique({ where: { id: entryId } })
    if (!entry) return res.status(404).json({ error: 'entry not found' })

    const prompt = `Claymation illustration representing the Spanish word "${entry.spanish}" meaning "${entry.englishPrimary ?? entry.spanish}". ${STYLE}`
    console.log(`Generating image for: ${entry.spanish} (${entry.englishPrimary})`)

    const imgBuffer = await geminiGenerate(prompt)

    const safe = entry.spanish.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
    const filename = `vocab_${safe}.jpg`
    const filePath = path.join(VOCAB_DIR, filename)

    fs.writeFileSync(filePath, imgBuffer)
    console.log(`  Saved ${imgBuffer.length} bytes → ${filename}`)

    const imageUrl = `/vocab/${filename}`
    await prisma.dictionaryEntry.update({ where: { id: entryId }, data: { imageUrl } })

    // Auto-commit and deploy
    const { execSync } = require('child_process')
    try {
      execSync(`cd ${path.join(__dirname, '..')} && git add public/vocab/${filename} && git -c user.name=Prickle -c user.email=prickle@local commit -m "feat: vocab image for ${entry.spanish}" && git push origin main && npx vercel --prod --yes`, { stdio: 'pipe' })
      console.log('  Deployed!')
    } catch (e) {
      console.warn('  Deploy failed (image still saved locally):', e.message?.slice(0, 100))
    }

    res.json({ ok: true, imageUrl })
  } catch (e) {
    console.error('Error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Local image server running on http://localhost:${PORT}`)
  console.log('Admin panel will call this for image generation.')
})
