import axios from 'axios';

const mbClient = axios.create({
  baseURL: 'https://musicbrainz.org/ws/2',
  headers: {
    'User-Agent': 'SoundSocial/1.0.0 (cesarjoelherrera@icloud.com)',
    'Accept': 'application/json',
  },
});

const coverArtClient = axios.create({
  baseURL: 'https://coverartarchive.org',
});

// ─────────────────────────────────────────
// SEARCH ARTISTS
// ─────────────────────────────────────────
export async function searchArtists(query: string) {
  const response = await mbClient.get('/artist', {
    params: {
      query,
      limit: 10,
      fmt: 'json',
    },
  });

  return response.data.artists.map((artist: any) => ({
    mbid: artist.id,
    name: artist.name,
    country: artist.country,
    genres: artist.tags?.map((t: any) => t.name) || [],
  }));
}

// ─────────────────────────────────────────
// SEARCH ALBUMS
// ─────────────────────────────────────────
export async function searchAlbums(query: string) {
  const response = await mbClient.get('/release-group', {
    params: {
      query,
      type: 'album',
      limit: 10,
      fmt: 'json',
    },
  });

  return response.data['release-groups'].map((album: any) => ({
    mbid: album.id,
    title: album.title,
    artist: album['artist-credit']?.[0]?.artist?.name,
    artist_mbid: album['artist-credit']?.[0]?.artist?.id,
    release_date: album['first-release-date'],
    album_type: album['primary-type'],
  }));
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
  try {
    const response = await coverArtClient.get(`/release-group/${mbid}`);
    return response.data.images?.[0]?.thumbnails?.large || response.data.images?.[0]?.image || null;
  } catch {
    // Not every album has cover art — that's normal
    return null;
  }
}

// ─────────────────────────────────────────
// SEARCH TRACKS
// ─────────────────────────────────────────
export async function searchTracks(query: string) {
  const response = await mbClient.get('/recording', {
    params: {
      query,
      limit: 10,
      fmt: 'json',
    },
  });

  return response.data.recordings.map((track: any) => ({
    mbid: track.id,
    title: track.title,
    artist: track['artist-credit']?.[0]?.artist?.name,
    artist_mbid: track['artist-credit']?.[0]?.artist?.id,
    duration_ms: track.length,
    album: track.releases?.[0]?.title,
    album_mbid: track.releases?.[0]?.id,
  }));
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
      track_number: t.number,
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