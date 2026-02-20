import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db';
import authRoutes from './routes/auth';
import musicRoutes from './routes/music';

dotenv.config();

const app = express();
const PORT = 4000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);

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