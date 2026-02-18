import { Router, Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ─────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────
const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be under 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z.string().check(z.email('Invalid email address')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().max(80).optional(),
});

const LoginSchema = z.object({
  login: z.string(),
  password: z.string(),
});

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  // Validate incoming data
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten() });
    return;
  }

  const { username, email, password, display_name } = parse.data;

  try {
    // Check if username or email already exists
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username.toLowerCase(), email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username or email already taken' });
      return;
    }

    // Hash the password
    const hashedPassword = await argon2.hash(password);

    // Save user to database
    const result = await query(
      `INSERT INTO users (username, email, password, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, created_at`,
      [username.toLowerCase(), email.toLowerCase(), hashedPassword, display_name || username]
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const { login, password } = parse.data;

  try {
    // Find user by username or email
    const result = await query(
      `SELECT * FROM users WHERE username = $1 OR email = $1`,
      [login.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't send password back
    const { password: _, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const result = await query(
      `SELECT id, username, email, display_name, bio, avatar_url, created_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;