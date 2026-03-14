/**
 * Seed script — run once after DB is up:
 *   npm run seed
 */
const fs   = require('fs');
const path = require('path');
const pool = require('./pool');

async function seed() {
  const seedFile = path.resolve(__dirname, '../../../db/seeds/dictionary_seed.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');

  // Split on statement boundaries, skip empty lines
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const conn = await pool.getConnection();
  try {
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✅ Dictionary seeded successfully.');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    pool.end();
  }
}

seed();
