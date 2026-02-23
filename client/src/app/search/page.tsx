'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Artist {
  mbid: string;
  name: string;
  country?: string;
  genres?: string[];
}

interface Album {
  mbid: string;
  title: string;
  artist: string;
  artist_mbid: string;
  release_date?: string;
  album_type?: string;
  cover_url?: string;
  avg_rating?: number;
  rating_count?: number;
}

interface Track {
  mbid: string;
  title: string;
  artist: string;
  album?: string;
  duration_ms?: number;
}

interface SearchResults {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
}

type FilterType = 'all' | 'albums' | 'artists' | 'tracks';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') as FilterType || 'all';

  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>(typeParam);

  useEffect(() => {
    if (!q) return;
    setIsLoading(true);

    const fetchResults = async () => {
      try {
        const { data } = await api.get(`/music/search?q=${encodeURIComponent(q)}`);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [q]);

  useEffect(() => {
    setActiveFilter(typeParam);
  }, [typeParam]);

  const totalResults = results
    ? results.artists.length + results.albums.length + results.tracks.length
    : 0;

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Albums', value: 'albums' },
    { label: 'Artists', value: 'artists' },
    { label: 'Tracks', value: 'tracks' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-zinc-900 mb-1">
            {q ? `Results for "${q}"` : 'Search'}
          </h1>
          {results && (
            <p className="text-zinc-400 text-sm">
              {totalResults} results found
            </p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-zinc-200 pb-0">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeFilter === filter.value
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {filter.label}
              {results && filter.value !== 'all' && (
                <span className="ml-1.5 text-xs text-zinc-400">
                  ({filter.value === 'albums'
                    ? results.albums.length
                    : filter.value === 'artists'
                    ? results.artists.length
                    : results.tracks.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No query */}
        {!q && !isLoading && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-zinc-400">Type something in the search bar to get started</p>
          </div>
        )}

        {/* No results */}
        {q && !isLoading && results && totalResults === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">♪</p>
            <p className="text-zinc-400">No results found for "{q}"</p>
          </div>
        )}

        {/* Results */}
        {results && !isLoading && (
          <div className="flex flex-col gap-10">

            {/* Artists */}
            {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
              <section>
                <h2 className="section-title mb-4">Artists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.artists.map((artist) => (
                    <Link
                      key={artist.mbid}
                      href={`/artist/${artist.mbid}`}
                      className="card p-4 flex flex-col items-center text-center gap-3 hover:border-orange-200 transition-colors group"
                    >
                      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-500 text-2xl font-bold font-display">
                          {artist.name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 group-hover:text-orange-500 transition-colors">
                          {artist.name}
                        </div>
                        {artist.country && (
                          <div className="text-xs text-zinc-400 mt-0.5">{artist.country}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Albums */}
            {(activeFilter === 'all' || activeFilter === 'albums') && results.albums.length > 0 && (
              <section>
                <h2 className="section-title mb-4">Albums</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.albums.map((album) => (
                    <Link
                      key={album.mbid}
                      href={`/album/${album.mbid}`}
                      className="group flex flex-col gap-2"
                    >
                      <div className="aspect-square rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
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
                        <div className="text-xs text-zinc-400 truncate">{album.artist}</div>
                        {album.release_date && (
                          <div className="text-xs text-zinc-300 mt-0.5">
                            {album.release_date.slice(0, 4)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Tracks */}
            {(activeFilter === 'all' || activeFilter === 'tracks') && results.tracks.length > 0 && (
              <section>
                <h2 className="section-title mb-4">Tracks</h2>
                <div className="card overflow-hidden">
                  {results.tracks.map((track, index) => (
                    <div
                      key={track.mbid}
                      className={`flex items-center gap-4 px-5 py-3 hover:bg-orange-50 transition-colors ${
                        index !== results.tracks.length - 1 ? 'border-b border-zinc-100' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400 text-xs">
                        ♫
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 truncate">
                          {track.title}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {track.artist} {track.album && `· ${track.album}`}
                        </div>
                      </div>
                      {track.duration_ms && (
                        <span className="text-zinc-400 font-mono text-xs shrink-0">
                          {formatDuration(track.duration_ms)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

      </div>
    </div>
  );
}