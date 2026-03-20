import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DEMO_EMAIL = 'demo@adaptive-spanish.local'
const LEARNING_TARGET = 20
const VOCAB = [
  { sortOrder: 1, english: 'apple', spanish: 'manzana', emoji: '🍎' },
  { sortOrder: 2, english: 'water', spanish: 'agua', emoji: '💧' },
  { sortOrder: 3, english: 'house', spanish: 'casa', emoji: '🏠' },
  { sortOrder: 4, english: 'dog', spanish: 'perro', emoji: '🐕' },
  { sortOrder: 5, english: 'cat', spanish: 'gato', emoji: '🐈' },
  { sortOrder: 6, english: 'book', spanish: 'libro', emoji: '📚' },
  { sortOrder: 7, english: 'car', spanish: 'coche', emoji: '🚗' },
  { sortOrder: 8, english: 'sun', spanish: 'sol', emoji: '☀️' },
  { sortOrder: 9, english: 'moon', spanish: 'luna', emoji: '🌙' },
  { sortOrder: 10, english: 'friend', spanish: 'amigo', emoji: '🤝' },
  { sortOrder: 11, english: 'food', spanish: 'comida', emoji: '🍽️' },
  { sortOrder: 12, english: 'school', spanish: 'escuela', emoji: '🏫' },
  { sortOrder: 13, english: 'love', spanish: 'amor', emoji: '❤️' },
  { sortOrder: 14, english: 'time', spanish: 'tiempo', emoji: '⏰' },
  { sortOrder: 15, english: 'music', spanish: 'música', emoji: '🎵' },
  { sortOrder: 16, english: 'city', spanish: 'ciudad', emoji: '🏙️' },
  { sortOrder: 17, english: 'night', spanish: 'noche', emoji: '🌃' },
  { sortOrder: 18, english: 'fire', spanish: 'fuego', emoji: '🔥' },
  { sortOrder: 19, english: 'tree', spanish: 'árbol', emoji: '🌳' },
  { sortOrder: 20, english: 'hand', spanish: 'mano', emoji: '✋' },
  { sortOrder: 21, english: 'eye', spanish: 'ojo', emoji: '👁️' },
  { sortOrder: 22, english: 'bread', spanish: 'pan', emoji: '🍞' },
  { sortOrder: 23, english: 'fish', spanish: 'pez', emoji: '🐟' },
  { sortOrder: 24, english: 'bird', spanish: 'pájaro', emoji: '🐦' },
  { sortOrder: 25, english: 'door', spanish: 'puerta', emoji: '🚪' },
  { sortOrder: 26, english: 'table', spanish: 'mesa', emoji: '🪑' },
  { sortOrder: 27, english: 'flower', spanish: 'flor', emoji: '🌸' },
  { sortOrder: 28, english: 'star', spanish: 'estrella', emoji: '⭐' },
  { sortOrder: 29, english: 'milk', spanish: 'leche', emoji: '🥛' },
  { sortOrder: 30, english: 'key', spanish: 'llave', emoji: '🔑' },
]

async function main() {
  const user = await prisma.user.upsert({ where: { email: DEMO_EMAIL }, update: {}, create: { email: DEMO_EMAIL } })
  for (const item of VOCAB) {
    await prisma.dictionaryEntry.upsert({
      where: { sortOrder: item.sortOrder },
      update: { english: item.english, spanish: item.spanish, emoji: item.emoji, category: 'vocabulary' },
      create: { sortOrder: item.sortOrder, english: item.english, spanish: item.spanish, emoji: item.emoji, category: 'vocabulary' },
    })
  }
  const entries = await prisma.dictionaryEntry.findMany({ where: { category: 'vocabulary' }, orderBy: { sortOrder: 'asc' } })
  for (const [index, entry] of entries.entries()) {
    await prisma.userVocabProgress.upsert({
      where: { userId_entryId: { userId: user.id, entryId: entry.id } },
      update: {},
      create: { userId: user.id, entryId: entry.id, bucket: index < LEARNING_TARGET ? 'learning' : 'unseen', score: 0 },
    })
  }
  console.log(`Seeded ${entries.length} vocab entries for ${DEMO_EMAIL}`)
}

main().finally(() => prisma.$disconnect())
