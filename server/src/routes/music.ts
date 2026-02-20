import { Router, Request, Response } from 'express';
import {
  searchAlbums,
  searchArtists,
  searchTracks,
  getFullAlbum,
} from '../services/musicbrainz';
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
// GET FULL ALBUM BY MBID
// ─────────────────────────────────────────
router.get('/albums/:mbid', async (req: Request, res: Response): Promise<void> => {
  const mbid = req.params.mbid as string;

  try {
    // Check database first
    const existing = await query(
      `SELECT albums.*, artists.name AS artist_name, artists.mbid AS artist_mbid
       FROM albums
       JOIN artists ON artists.id = albums.artist_id
       WHERE albums.mbid = $1`,
      [mbid]
    );

    if (existing.rows.length > 0) {
      // Get tracks from database
      const tracks = await query(
        `SELECT * FROM tracks WHERE album_id = $1 ORDER BY track_number`,
        [existing.rows[0].id]
      );

      res.json({ ...existing.rows[0], tracks: tracks.rows });
      return;
    }

    // Not in database — fetch from MusicBrainz
    const albumData = await getFullAlbum(mbid);
    res.json(albumData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get album' });
  }
});

export default router;