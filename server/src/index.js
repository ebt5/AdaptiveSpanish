require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors    = require('cors');

const authRoutes  = require('./routes/auth');
const wordsRoutes = require('./routes/words');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.VITE_API_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth',  authRoutes);
app.use('/api/words', wordsRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 Adaptive Spanish API running on http://localhost:${PORT}`);
});
