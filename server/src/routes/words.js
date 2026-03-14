const express      = require('express');
const { requireAuth } = require('../middleware/auth');
const pool         = require('../db/pool');

const router = express.Router();

// GET /api/words/buckets  — bucket counts for the logged-in user
router.get('/buckets', requireAuth, async (req, res) => {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query(
      `SELECT bucket, COUNT(*) AS count
       FROM user_words
       WHERE user_id = ?
       GROUP BY bucket`,
      [userId]
    );

    const counts = { learning: 0, learned: 0, mastered: 0 };
    for (const row of rows) counts[row.bucket] = row.count;

    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bucket counts' });
  }
});

// GET /api/words  — all words with user bucket/score info
router.get('/', requireAuth, async (req, res) => {
  const { userId } = req.user;
  try {
    const [rows] = await pool.query(
      `SELECT
         d.word_id, d.spanish_word, d.english_translations,
         d.image_url, d.word_type, d.gender,
         uw.bucket, uw.word_score, uw.mastery_score,
         uw.last_drilled_at
       FROM user_words uw
       JOIN dictionary d ON d.word_id = uw.word_id
       WHERE uw.user_id = ?
       ORDER BY uw.bucket, uw.word_score DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

module.exports = router;
