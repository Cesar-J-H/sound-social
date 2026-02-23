import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { query } from '../db';

const router = Router();

// ─────────────────────────────────────────
// RATE AN ALBUM OR TRACK
// ─────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { entity_type, entity_id, rating } = req.body;

  if (!entity_type || !entity_id || !rating) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (!['album', 'track'].includes(entity_type)) {
    res.status(400).json({ error: 'Invalid entity type' });
    return;
  }

  if (rating < 0.5 || rating > 10 || rating % 0.5 !== 0) {
    res.status(400).json({ error: 'Rating must be between 0.5 and 10 in 0.5 increments' });
    return;
  }

  try {
    // Save or update rating
    const result = await query(
      `INSERT INTO ratings (user_id, entity_type, entity_id, rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, entity_type, entity_id)
       DO UPDATE SET rating = $4, updated_at = NOW()
       RETURNING *`,
      [req.user!.userId, entity_type, entity_id, rating]
    );

    // Update average rating on the album or track
    await query(
      `UPDATE ${entity_type}s
       SET avg_rating = (
         SELECT ROUND(AVG(rating)::numeric, 2)
         FROM ratings
         WHERE entity_type = $1 AND entity_id = $2
       ),
       rating_count = (
         SELECT COUNT(*)
         FROM ratings
         WHERE entity_type = $1 AND entity_id = $2
       )
       WHERE id = $2`,
      [entity_type, entity_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

// ─────────────────────────────────────────
// GET USER'S RATING FOR AN ITEM
// ─────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { entity_type, entity_id } = req.query as Record<string, string>;

  try {
    const result = await query(
      `SELECT * FROM ratings
       WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [req.user!.userId, entity_type, entity_id]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get rating' });
  }
});

// ─────────────────────────────────────────
// DELETE A RATING
// ─────────────────────────────────────────
router.delete('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { entity_type, entity_id } = req.body;

  try {
    await query(
      `DELETE FROM ratings
       WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [req.user!.userId, entity_type, entity_id]
    );

    // Recalculate average
    await query(
      `UPDATE ${entity_type}s
       SET avg_rating = COALESCE((
         SELECT ROUND(AVG(rating)::numeric, 2)
         FROM ratings
         WHERE entity_type = $1 AND entity_id = $2
       ), 0),
       rating_count = (
         SELECT COUNT(*)
         FROM ratings
         WHERE entity_type = $1 AND entity_id = $2
       )
       WHERE id = $2`,
      [entity_type, entity_id]
    );

    res.json({ message: 'Rating removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

export default router;