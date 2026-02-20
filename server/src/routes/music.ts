import { Router, Request, Response } from 'express';
import {
  searchAlbums,
  searchArtists,
  searchTracks,
  getFullAlbum,
} from '../services/musicbrainz';
import { query } from '../db';

function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  // Handle year-only dates like "1990"
  if (dateStr.length === 4) return `${dateStr}-01-01`;
  // Handle year-month dates like "1990-11"
  if (dateStr.length === 7) return `${dateStr}-01`;
  // Full date "1990-11-04"
  return dateStr;
}

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
      const tracks = await query(
        `SELECT * FROM tracks WHERE album_id = $1 ORDER BY track_number`,
        [existing.rows[0].id]
      );
      res.json({ ...existing.rows[0], tracks: tracks.rows });
      return;
    }

    // Not in database — fetch from MusicBrainz
    const albumData = await getFullAlbum(mbid);

    // Save artist if they don't exist yet
    let artistId: string;
    const existingArtist = await query(
      `SELECT id FROM artists WHERE mbid = $1`,
      [albumData.artist_mbid]
    );

    if (existingArtist.rows.length > 0) {
      artistId = existingArtist.rows[0].id;
    } else {
      const newArtist = await query(
        `INSERT INTO artists (mbid, name)
         VALUES ($1, $2)
         RETURNING id`,
        [albumData.artist_mbid, albumData.artist]
      );
      artistId = newArtist.rows[0].id;
    }

    // Save album
    const newAlbum = await query(
      `INSERT INTO albums (mbid, artist_id, title, cover_url, release_date, album_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        albumData.mbid,
        artistId,
        albumData.title,
        albumData.cover_url,
        parseDate(albumData.release_date),
        albumData.album_type || null,
      ]
    );

    const albumId = newAlbum.rows[0].id;

    // Save tracks
    if (albumData.tracks.length > 0) {
      for (const track of albumData.tracks) {
        await query(
          `INSERT INTO tracks (mbid, album_id, artist_id, title, duration_ms, track_number)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mbid) DO NOTHING`,
          [
            track.mbid,
            albumId,
            artistId,
            track.title,
            track.duration_ms || null,
            track.track_number || null,
          ]
        );
      }
    }

    res.json({ ...albumData, id: albumId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get album' });
  }
});

export default router;