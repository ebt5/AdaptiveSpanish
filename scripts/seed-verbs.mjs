import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VERBS = [
  // Regular verbs
  { infinitive: 'hablar', english: 'to speak', isRegular: true, sortOrder: 1, conjugations: {
    yo: 'hablo', tú: 'hablas', él: 'habla', nosotros: 'hablamos', vosotros: 'habláis', ellos: 'hablan'
  }},
  { infinitive: 'comer', english: 'to eat', isRegular: true, sortOrder: 2, conjugations: {
    yo: 'como', tú: 'comes', él: 'come', nosotros: 'comemos', vosotros: 'coméis', ellos: 'comen'
  }},
  { infinitive: 'vivir', english: 'to live', isRegular: true, sortOrder: 3, conjugations: {
    yo: 'vivo', tú: 'vives', él: 'vive', nosotros: 'vivimos', vosotros: 'vivís', ellos: 'viven'
  }},
  { infinitive: 'trabajar', english: 'to work', isRegular: true, sortOrder: 4, conjugations: {
    yo: 'trabajo', tú: 'trabajas', él: 'trabaja', nosotros: 'trabajamos', vosotros: 'trabajáis', ellos: 'trabajan'
  }},
  { infinitive: 'escribir', english: 'to write', isRegular: true, sortOrder: 5, conjugations: {
    yo: 'escribo', tú: 'escribes', él: 'escribe', nosotros: 'escribimos', vosotros: 'escribís', ellos: 'escriben'
  }},
  { infinitive: 'beber', english: 'to drink', isRegular: true, sortOrder: 6, conjugations: {
    yo: 'bebo', tú: 'bebes', él: 'bebe', nosotros: 'bebemos', vosotros: 'bebéis', ellos: 'beben'
  }},
  { infinitive: 'caminar', english: 'to walk', isRegular: true, sortOrder: 7, conjugations: {
    yo: 'camino', tú: 'caminas', él: 'camina', nosotros: 'caminamos', vosotros: 'camináis', ellos: 'caminan'
  }},
  { infinitive: 'aprender', english: 'to learn', isRegular: true, sortOrder: 8, conjugations: {
    yo: 'aprendo', tú: 'aprendes', él: 'aprende', nosotros: 'aprendemos', vosotros: 'aprendéis', ellos: 'aprenden'
  }},
  { infinitive: 'abrir', english: 'to open', isRegular: true, sortOrder: 9, conjugations: {
    yo: 'abro', tú: 'abres', él: 'abre', nosotros: 'abrimos', vosotros: 'abrís', ellos: 'abren'
  }},
  { infinitive: 'leer', english: 'to read', isRegular: true, sortOrder: 10, conjugations: {
    yo: 'leo', tú: 'lees', él: 'lee', nosotros: 'leemos', vosotros: 'leéis', ellos: 'leen'
  }},
  // Irregular verbs
  { infinitive: 'ser', english: 'to be', isRegular: false, sortOrder: 11, conjugations: {
    yo: 'soy', tú: 'eres', él: 'es', nosotros: 'somos', vosotros: 'sois', ellos: 'son'
  }},
  { infinitive: 'tener', english: 'to have', isRegular: false, sortOrder: 12, conjugations: {
    yo: 'tengo', tú: 'tienes', él: 'tiene', nosotros: 'tenemos', vosotros: 'tenéis', ellos: 'tienen'
  }},
  { infinitive: 'ir', english: 'to go', isRegular: false, sortOrder: 13, conjugations: {
    yo: 'voy', tú: 'vas', él: 'va', nosotros: 'vamos', vosotros: 'vais', ellos: 'van'
  }},
  { infinitive: 'hacer', english: 'to do/make', isRegular: false, sortOrder: 14, conjugations: {
    yo: 'hago', tú: 'haces', él: 'hace', nosotros: 'hacemos', vosotros: 'hacéis', ellos: 'hacen'
  }},
  { infinitive: 'estar', english: 'to be', isRegular: false, sortOrder: 15, conjugations: {
    yo: 'estoy', tú: 'estás', él: 'está', nosotros: 'estamos', vosotros: 'estáis', ellos: 'están'
  }},
]

const PRONOUNS = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']

async function main() {
  console.log('Seeding verbs...')

  for (const verb of VERBS) {
    const created = await prisma.verb.upsert({
      where: { infinitive: verb.infinitive },
      update: { english: verb.english, isRegular: verb.isRegular, sortOrder: verb.sortOrder },
      create: { infinitive: verb.infinitive, english: verb.english, isRegular: verb.isRegular, sortOrder: verb.sortOrder },
    })

    for (const pronoun of PRONOUNS) {
      await prisma.verbConjugation.upsert({
        where: { verbId_tense_pronoun: { verbId: created.id, tense: 'present', pronoun } },
        update: { form: verb.conjugations[pronoun] },
        create: { verbId: created.id, tense: 'present', pronoun, form: verb.conjugations[pronoun] },
      })
    }

    console.log(`  ✓ ${verb.infinitive}`)
  }

  console.log(`Done! Seeded ${VERBS.length} verbs with present tense conjugations.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
