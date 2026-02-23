'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import RatingModal from '@/app/components/music/RatingModal';

interface Track {
  mbid: string;
  title: string;
  track_number: number;
  duration_ms?: number;
}

interface Album {
  id: string;
  mbid: string;
  title: string;
  artist: string;
  artist_mbid: string;
  release_date?: string;
  album_type?: string;
  cover_url?: string;
  avg_rating?: number;
  rating_count?: number;
  tracks: Track[];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function AlbumPage() {
  const { mbid } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const { data } = await api.get(`/music/albums/${mbid}`);
        setAlbum(data);
      } catch (err) {
        setError('Failed to load album');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [mbid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading album…</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Album not found</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Album Header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* Cover Art */}
            <div className="shrink-0">
              {album.cover_url ? (
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                />
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-zinc-100 flex items-center justify-center shadow-xl">
                  <span className="text-6xl">♪</span>
                </div>
              )}
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0">
              {album.album_type && (
                <span className="tag mb-3 inline-block">
                  {album.album_type}
                </span>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-bold text-zinc-900 mb-2">
                {album.title}
              </h1>

              <Link
                href={`/artist/${album.artist_mbid}`}
                className="text-xl text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                {album.artist}
              </Link>

              {album.release_date && (
                <p className="text-zinc-400 text-sm mt-1">
                  {album.release_date.slice(0, 4)}
                </p>
              )}

              {/* Community Rating */}
              {album.avg_rating && album.avg_rating > 0 ? (
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2">
                    <span className="text-orange-500 text-lg">★</span>
                    <span className="font-display text-2xl font-bold text-zinc-900">
                      {Number(album.avg_rating).toFixed(1)}
                    </span>
                    <span className="text-zinc-400 text-sm">/10</span>
                  </div>
                  <span className="text-zinc-400 text-sm">
                    {album.rating_count} ratings
                  </span>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="text-zinc-400 text-sm">No ratings yet — be the first!</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6">
                <button className="btn-primary" onClick={() => setShowRatingModal(true)}>
                  {userRating ? `★ Your rating: ${userRating}` : '★ Rate this album'}
                </button>
                <button className="btn-outline">
                  ✍ Write a review
                </button>
                <button className="btn-ghost">
                  + Add to list
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Tracks */}
          <div className="lg:col-span-2">
            <h2 className="section-title mb-4">Tracklist</h2>

            {album.tracks.length > 0 ? (
              <div className="card overflow-hidden">
                {album.tracks.map((track, index) => (
                  <div
                    key={track.mbid}
                    className={`flex items-center gap-4 px-5 py-3 hover:bg-orange-50 transition-colors ${
                      index !== album.tracks.length - 1 ? 'border-b border-zinc-100' : ''
                    }`}
                  >
                    <span className="text-zinc-300 font-mono text-sm w-5 text-right shrink-0">
                      {track.track_number}
                    </span>
                    <span className="flex-1 text-sm text-zinc-700 font-medium">
                      {track.title}
                    </span>
                    {track.duration_ms && (
                      <span className="text-zinc-400 font-mono text-xs shrink-0">
                        {formatDuration(track.duration_ms)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-zinc-400 text-sm">No tracklist available</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-display text-lg font-bold text-zinc-900 mb-4">
                Album Info
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Artist</span>
                  <Link
                    href={`/artist/${album.artist_mbid}`}
                    className="text-orange-500 hover:underline font-medium"
                  >
                    {album.artist}
                  </Link>
                </div>
                {album.release_date && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Released</span>
                    <span className="text-zinc-700">
                        {new Date(album.release_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                  </div>
                )}
                {album.album_type && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Type</span>
                    <span className="text-zinc-700">{album.album_type}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tracks</span>
                  <span className="text-zinc-700">{album.tracks.length}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* Rating Modal */}
      {showRatingModal && album.mbid && (
        <RatingModal
          entityType="album"
          entityId={album.id}
          entityName={album.title}
          currentRating={userRating || undefined}
          onRated={(rating) => setUserRating(rating)}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
}