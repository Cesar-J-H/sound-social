import express from 'express';
import './db'
import { query } from './db';

const app = express();
const PORT = 4000;

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

import { searchAlbums } from './services/musicbrainz';

app.get('/test-search', async (req, res) => {
  try {
    const results = await searchAlbums('dark side of the moon');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});