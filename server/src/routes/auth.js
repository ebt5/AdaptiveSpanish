const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const router = express.Router();
const SALT_ROUNDS = 12;
const LEARNING_BUCKET_SIZE = 20;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    const userId = result.insertId;

    // Assign first 20 words to the user's "learning" bucket
    await assignInitialWords(userId);

    const token = signToken(userId, username);
    res.status(201).json({ token, user: { userId, username, email } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user.user_id, user.username);
    res.json({ token, user: { userId: user.user_id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

function signToken(userId, username) {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

async function assignInitialWords(userId) {
  const [words] = await pool.query(
    'SELECT word_id FROM dictionary ORDER BY word_id ASC LIMIT ?',
    [LEARNING_BUCKET_SIZE]
  );

  if (!words.length) return;

  const values = words.map(w => [userId, w.word_id, 'learning']);
  await pool.query(
    'INSERT IGNORE INTO user_words (user_id, word_id, bucket) VALUES ?',
    [values]
  );
}

module.exports = router;
