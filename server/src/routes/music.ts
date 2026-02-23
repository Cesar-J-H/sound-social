import { Router, Request, Response } from 'express';
import {
  searchAlbums,
  searchArtists,
  searchTracks,
  getFullAlbum,
  getCoverArt,
  mbClient,
} from '../services/musicbrainz';
import { query } from '../db';

export

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const artists = await searchArtists(q);
    await delay(200); // Add delay between requests to avoid rate limiting
    const albums = await searchAlbums(q);
    await delay(200); // Add delay between requests to avoid rate limiting
    const tracks = await searchTracks(q);

    // Check database for any albums we already have saved
    const mbids = albums.map((a: any) => a.mbid);
    const saved = mbids.length > 0 ? await query(
      `SELECT mbid, cover_url, avg_rating, rating_count 
       FROM albums WHERE mbid = ANY($1)`,
      [mbids]
    ) : { rows: [] };

    // Merge database data into search results
    const savedMap = new Map(saved.rows.map((r: any) => [r.mbid, r]));

    // Fetch cover art for unsaved albums
    const enrichedAlbums = await Promise.all(albums.map(async (album: any) => {
      const savedAlbum = savedMap.get(album.mbid);
      if (savedAlbum) {
        return { 
          ...album, 
          cover_url: savedAlbum.cover_url,
          avg_rating: savedAlbum.avg_rating,
          rating_count: savedAlbum.rating_count,
        };
      }
      let cover_url = null;
      // Fetch cover art from MusicBrainz if not in database
      try {
        const cover_url = await getCoverArt(album.mbid);
      } catch {
        cover_url = null;
      }
      return { ...album, cover_url };
    }));

    res.json({ artists, albums: enrichedAlbums, tracks });
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

router.get('/artists/:mbid', async (req: Request, res: Response): Promise<void> => {
  const mbid = req.params.mbid as string;

  try {
    // Check database first
    const existing = await query(
      `SELECT * FROM artists WHERE mbid = $1`,
      [mbid]
    );

    let artist;

    if (existing.rows.length > 0) {
      artist = existing.rows[0];
    } else {
      // Fetch from MusicBrainz
      const { data } = await mbClient.get(`/artist/${mbid}`, {
        params: {
          inc: 'release-groups+tags+url-rels',
          fmt: 'json',
        },
      });

      // Save to database
      const result = await query(
        `INSERT INTO artists (mbid, name, genres)
         VALUES ($1, $2, $3)
         ON CONFLICT (mbid) DO UPDATE SET name = $2
         RETURNING *`,
        [
          data.id,
          data.name,
          data.tags?.slice(0, 5).map((t: any) => t.name) || [],
        ]
      );

      artist = {
        ...result.rows[0],
        formed_year: data['life-span']?.begin?.slice(0, 4) || null,
        country: data.country || null,
        type: data.type || null,
        releases: data['release-groups']
          ?.filter((r: any) => r['primary-type'] === 'Album')
          .map((r: any) => ({
            mbid: r.id,
            title: r.title,
            release_date: r['first-release-date'],
            album_type: r['primary-type'],
          })) || [],
      };
    }

    // Get albums from database for this artist
    const albums = await query(
      `SELECT * FROM albums WHERE artist_id = $1 ORDER BY release_date DESC`,
      [artist.id]
    );

    res.json({ ...artist, albums: albums.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get artist' });
  }
});

export default router;
