import axios from 'axios';
import { is } from 'zod/v4/locales';

export const mbClient = axios.create({
  baseURL: 'https://musicbrainz.org/ws/2',
  headers: {
    'User-Agent': 'SoundSocial/1.0.0 (cesarjoelherrera@icloud.com)',
    'Accept': 'application/json',
  },
  timeout: 5000, // 5 seconds timeout for MusicBrainz API
});

const coverArtClient = axios.create({
  baseURL: 'https://coverartarchive.org',
});

mbClient.interceptors.request.use(async config => {
  // Add a small delay to avoid rate limiting
  await delay(100); // 100ms delay before each request
  return config;
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

//simple cache to reduce redundant requests

const cache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TIL = 1000 * 60 * 10; // 10 minutes

function getCached(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TIL) {
    cache.delete(key); // Remove expired cache entry
    return null;
  }
  return cached.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
} 

// ─────────────────────────────────────────
// SEARCH ARTISTS
// ─────────────────────────────────────────
export async function searchArtists(query: string) {
  const cacheKey = `artist:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await mbClient.get('/artist', {
    params: {
      query,
      limit: 10,
      fmt: 'json',
    },
  });

  const artists = response.data.artists.map((artist: any) => ({
    mbid: artist.id,
    name: artist.name,
    country: artist.country,
    genres: artist.tags?.map((t: any) => t.name) || [],
  }));
  setCache(cacheKey, artists);
  return artists;
}

// ─────────────────────────────────────────
// SEARCH ALBUMS
// ─────────────────────────────────────────
export async function searchAlbums(query: string) {
  const cacheKey = `album:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await mbClient.get('/release-group', {
    params: {
      query,
      type: 'album',
      limit: 10,
      fmt: 'json',
    },
  });

  const albums = response.data['release-groups'].map((album: any) => ({
    mbid: album.id,
    title: album.title,
    artist: album['artist-credit']?.[0]?.artist?.name,
    artist_mbid: album['artist-credit']?.[0]?.artist?.id,
    release_date: album['first-release-date'],
    album_type: album['primary-type'],
  }));
  setCache(cacheKey, albums);
  return albums;
}

// ─────────────────────────────────────────
// GET ALBUM DETAILS (with tracks)
// ─────────────────────────────────────────
export async function getAlbumDetails(mbid: string) {
  
  const response = await mbClient.get(`/release-group/${mbid}`, {
    params: {
      inc: 'artists+releases',
      fmt: 'json',
    },
  });

  return response.data;
}

// ─────────────────────────────────────────
// GET COVER ART
// ─────────────────────────────────────────
export async function getCoverArt(mbid: string): Promise<string | null> {
  const cacheKey = `cover:${mbid}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await coverArtClient.get(`/release-group/${mbid}`);
    const coverUrl = response.data.images?.[0]?.thumbnails?.large || response.data.images?.[0]?.image || null;
    setCache(cacheKey, coverUrl);
    return coverUrl;
  } catch {
    setCache(cacheKey, null); // Cache the null result to avoid repeated failed requests
    return null;
  }
}

// ─────────────────────────────────────────
// SEARCH TRACKS
// ─────────────────────────────────────────
export async function searchTracks(query: string) {
  const cacheKey = `track:${query}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const response = await mbClient.get('/recording', {
    params: {
      query,
      limit: 10,
      fmt: 'json',
    },
  });

  const tracks = response.data.recordings.map((track: any) => ({
    mbid: track.id,
    title: track.title,
    artist: track['artist-credit']?.[0]?.artist?.name,
    artist_mbid: track['artist-credit']?.[0]?.artist?.id,
    duration_ms: track.length,
    album: track.releases?.[0]?.title,
    album_mbid: track.releases?.[0]?.id,
  }));
  setCache(cacheKey, tracks);
  return tracks;
}

// ─────────────────────────────────────────
// GET FULL ALBUM WITH TRACKS
// ─────────────────────────────────────────
export async function getFullAlbum(mbid: string) {
  // Get the release group (album)
  const releaseGroup = await mbClient.get(`/release-group/${mbid}`, {
    params: {
      inc: 'artists+releases',
      fmt: 'json',
    },
  });

  const album = releaseGroup.data;

  // Get the first release to fetch tracklist
  const firstRelease = album.releases?.[0];
  let tracks: any[] = [];

  if (firstRelease) {
    const release = await mbClient.get(`/release/${firstRelease.id}`, {
      params: {
        inc: 'recordings',
        fmt: 'json',
      },
    });

    tracks = release.data.media?.[0]?.tracks?.map((t: any) => ({
      mbid: t.recording.id,
      title: t.title,
      track_number: isNaN(parseInt(t.number)) ? null : parseInt(t.number),
      duration_ms: t.length,
    })) || [];
  }

  // Get cover art
  const cover_url = await getCoverArt(mbid);

  return {
    mbid: album.id,
    title: album.title,
    artist: album['artist-credit']?.[0]?.artist?.name,
    artist_mbid: album['artist-credit']?.[0]?.artist?.id,
    release_date: album['first-release-date'],
    album_type: album['primary-type'],
    cover_url,
    tracks,
  };
}