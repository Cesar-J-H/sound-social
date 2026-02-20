'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';

interface SearchResults {
  artists: { mbid: string; name: string; country?: string }[];
  albums: { mbid: string; title: string; artist: string; release_date?: string }[];
  tracks: { mbid: string; title: string; artist: string; album?: string }[];
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/music/search?q=${encodeURIComponent(searchQuery)}`);
        setResults(data);
        setShowResults(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasResults = results && (
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.tracks.length > 0
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="font-display font-bold text-lg text-zinc-900">
            Sound Social
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search artists, albums, tracks…"
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => hasResults && setShowResults(true)}
          />

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Results dropdown */}
          {showResults && hasResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-y-auto max-h-96 z-50">

              {/* Artists */}
                {results.artists.length > 0 && (
                <div>
                    <div className="px-4 py-2 text-2xs font-semibold text-zinc-400 uppercase tracking-widest bg-zinc-50 border-b border-zinc-100">
                    Artists
                    </div>
                    {results.artists.slice(0, 3).map((artist) => (
                    <Link
                        key={artist.mbid}
                        href={`/artist/${artist.mbid}`}
                        onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-orange-600 text-xs font-bold">
                            {artist.name[0]}
                        </span>
                        </div>
                        <div>
                        <div className="text-sm font-medium text-zinc-900">{artist.name}</div>
                        {artist.country && (
                            <div className="text-xs text-zinc-400">{artist.country}</div>
                        )}
                        </div>
                    </Link>
                    ))}
                    <button
                    onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=artists`);
                        setShowResults(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-orange-500 font-medium hover:bg-orange-50 transition-colors text-left border-t border-zinc-100"
                    >
                    See all artists for "{searchQuery}" →
                    </button>
                </div>
                )}

                {/* Albums */}
                {results.albums.length > 0 && (
                <div className="border-t border-zinc-100">
                    <div className="px-4 py-2 text-2xs font-semibold text-zinc-400 uppercase tracking-widest bg-zinc-50 border-b border-zinc-100">
                    Albums
                    </div>
                    {results.albums.slice(0, 4).map((album) => (
                    <Link
                        key={album.mbid}
                        href={`/album/${album.mbid}`}
                        onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400 text-xs">
                        ♪
                        </div>
                        <div>
                        <div className="text-sm font-medium text-zinc-900">{album.title}</div>
                        <div className="text-xs text-zinc-400">{album.artist}</div>
                        </div>
                        {album.release_date && (
                        <div className="ml-auto text-xs text-zinc-400 shrink-0">
                            {album.release_date.slice(0, 4)}
                        </div>
                        )}
                    </Link>
                    ))}
                    <button
                    onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=albums`);
                        setShowResults(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-orange-500 font-medium hover:bg-orange-50 transition-colors text-left border-t border-zinc-100"
                    >
                    See all albums for "{searchQuery}" →
                    </button>
                </div>
                )}

                {/* Tracks */}
                {results.tracks.length > 0 && (
                <div className="border-t border-zinc-100">
                    <div className="px-4 py-2 text-2xs font-semibold text-zinc-400 uppercase tracking-widest bg-zinc-50 border-b border-zinc-100">
                    Tracks
                    </div>
                    {results.tracks.slice(0, 3).map((track) => (
                    <div
                        key={track.mbid}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-400 text-xs">
                        ♫
                        </div>
                        <div>
                        <div className="text-sm font-medium text-zinc-900">{track.title}</div>
                        <div className="text-xs text-zinc-400">
                            {track.artist} {track.album && `· ${track.album}`}
                        </div>
                        </div>
                    </div>
                    ))}
                    <button
                    onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=tracks`);
                        setShowResults(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-orange-500 font-medium hover:bg-orange-50 transition-colors text-left border-t border-zinc-100"
                    >
                    See all tracks for "{searchQuery}" →
                    </button>
                </div>
                )}

                {/* See all */}
                <div className="border-t border-zinc-200">
                <button
                    onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setShowResults(false);
                    }}
                    className="w-full px-4 py-3 text-sm text-orange-500 font-bold hover:bg-orange-50 transition-colors text-left"
                >
                    See all results for "{searchQuery}" →
                </button>
                </div>

            </div>
          )}

          {/* No results */}
          {showResults && !hasResults && !isSearching && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 text-center z-50">
              <p className="text-zinc-400 text-sm">No results for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && user ? (
            <>
              <Link
                href={`/user/${user.username}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-bold">
                    {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-zinc-700 hidden md:block">
                  {user.display_name || user.username}
                </span>
              </Link>
              <button onClick={logout} className="btn-ghost text-sm">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Sign In</Link>
              <Link href="/register" className="btn-primary">Join Free</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}