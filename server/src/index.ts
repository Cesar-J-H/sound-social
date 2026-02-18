import express from 'express';
import './db'

const app = express();
const PORT = 4000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AudioSocial API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});