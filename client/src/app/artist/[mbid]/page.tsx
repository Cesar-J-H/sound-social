'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Release {
  mbid: string;
  title: string;
  release_date?: string;
  album_type?: string;
}

interface Album {
  id: string;
  mbid: string;
  title: string;
  cover_url?: string;
  release_date?: string;
  avg_rating?: number;
  rating_count?: number;
}

interface Artist {
  id: string;
  mbid: string;
  name: string;
  country?: string;
  formed_year?: string;
  type?: string;
  genres?: string[];
  albums: Album[];
  releases?: Release[];
}

export default function ArtistPage() {
  const { mbid } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const { data } = await api.get(`/music/artists/${mbid}`);
        setArtist(data);
      } catch (err) {
        setError('Failed to load artist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtist();
  }, [mbid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading artist…</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Artist not found</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  // Combine saved albums with MusicBrainz releases
  const savedAlbumMap = new Map(artist.albums.map((a) => [a.mbid, a]));
  const allReleases = artist.releases || [];

  return (
    <div className="min-h-screen bg-cream">

      {/* Artist Header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Avatar placeholder */}
            <div className="w-28 h-28 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <span className="font-display text-5xl font-bold text-orange-400">
                {artist.name[0]}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-zinc-900 mb-3">
                {artist.name}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                {artist.type && <span>{artist.type}</span>}
                {artist.country && (
                  <>
                    <span>·</span>
                    <span>{artist.country}</span>
                  </>
                )}
                {artist.formed_year && (
                  <>
                    <span>·</span>
                    <span>Est. {artist.formed_year}</span>
                  </>
                )}
              </div>

              {/* Genres */}
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {artist.genres.map((genre) => (
                    <span key={genre} className="tag">{genre}</span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-5 text-sm">
                <div>
                  <span className="font-semibold text-zinc-900">
                    {allReleases.length || artist.albums.length}
                  </span>
                  <span className="text-zinc-400 ml-1">albums</span>
                </div>
                {artist.albums.length > 0 && (
                  <div>
                    <span className="font-semibold text-zinc-900">
                      {artist.albums.length}
                    </span>
                    <span className="text-zinc-400 ml-1">rated on Sound Social</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discography */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="section-title mb-6">Discography</h2>

        {allReleases.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {allReleases.map((release) => {
              const saved = savedAlbumMap.get(release.mbid);
              return (
                <Link
                  key={release.mbid}
                  href={`/album/${release.mbid}`}
                  className="group flex flex-col gap-2"
                >
                  {/* Cover */}
                  <div className="aspect-square rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                    {saved?.cover_url ? (
                      <img
                        src={saved.cover_url}
                        alt={release.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl text-zinc-300">♪</span>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="text-sm font-medium text-zinc-900 group-hover:text-orange-500 transition-colors truncate">
                      {release.title}
                    </div>
                    {release.release_date && (
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {release.release_date.slice(0, 4)}
                      </div>
                    )}
                    {saved?.avg_rating && saved.avg_rating > 0 && (
                      <div className="text-xs text-orange-500 font-medium mt-0.5">
                        ★ {Number(saved.avg_rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : artist.albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {artist.albums.map((album) => (
              <Link
                key={album.mbid}
                href={`/album/${album.mbid}`}
                className="group flex flex-col gap-2"
              >
                <div className="aspect-square rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl text-zinc-300">♪</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-900 group-hover:text-orange-500 transition-colors truncate">
                    {album.title}
                  </div>
                  {album.release_date && (
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {new Date(album.release_date).getFullYear()}
                    </div>
                  )}
                  {album.avg_rating && album.avg_rating > 0 && (
                    <div className="text-xs text-orange-500 font-medium mt-0.5">
                      ★ {Number(album.avg_rating).toFixed(1)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-zinc-400">No albums found for this artist</p>
          </div>
        )}
      </div>

    </div>
  );
}