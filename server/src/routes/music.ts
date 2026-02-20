import { Router, Request, Response } from 'express';
import { searchAlbums, searchArtists, searchTracks, getCoverArt } from '../services/musicbrainz';
import { query } from '../db';

const router = Router();

// ─────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const q = req.query.q as string;

  if (!q || q.trim().length < 2) {
    res.json({ artists: [], albums: [], tracks: [] });
    return;
  }

  try {
    const [artists, albums, tracks] = await Promise.all([
      searchArtists(q),
      searchAlbums(q),
      searchTracks(q),
    ]);

    res.json({ artists, albums, tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─────────────────────────────────────────
// GET ALBUM BY MBID
// ─────────────────────────────────────────
router.get('/albums/:mbid', async (req: Request, res: Response): Promise<void> => {
  const mbid = req.params.mbid as string;

  try {
    // Check if album already exists in our database
    const existing = await query(
      `SELECT albums.*, artists.name AS artist_name
       FROM albums 
       JOIN artists ON artists.id = albums.artist_id
       WHERE albums.mbid = $1`,
      [mbid]
    );

    if (existing.rows.length > 0) {
      res.json(existing.rows[0]);
      return;
    }

    // Not in database yet — fetch from MusicBrainz
    const [albumData, coverUrl] = await Promise.all([
      searchAlbums(mbid),
      getCoverArt(mbid),
    ]);

    res.json({ ...albumData, cover_url: coverUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get album' });
  }
});

export default router;