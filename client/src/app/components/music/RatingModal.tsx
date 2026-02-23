'use client';

import { useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface RatingModalProps {
  entityType: 'album' | 'track';
  entityId: string;
  entityName: string;
  currentRating?: number;
  onRated: (rating: number) => void;
  onClose: () => void;
}

export default function RatingModal({
  entityType,
  entityId,
  entityName,
  currentRating,
  onRated,
  onClose,
}: RatingModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [selected, setSelected] = useState<number>(currentRating || 0);
  const [hovered, setHovered] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const ratings = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

  const getRatingLabel = (r: number) => {
    if (r >= 9.5) return 'Transcendent';
    if (r >= 9) return 'Masterpiece';
    if (r >= 8.5) return 'Exceptional';
    if (r >= 8) return 'Excellent';
    if (r >= 7) return 'Great';
    if (r >= 6) return 'Good';
    if (r >= 5) return 'Average';
    if (r >= 4) return 'Below Average';
    if (r >= 3) return 'Poor';
    return 'Terrible';
  };

  const handleRate = async () => {
    if (!selected) return;
    setIsLoading(true);
    try {
      await api.post('/ratings', {
        entity_type: entityType,
        entity_id: entityId,
        rating: selected,
      });
      onRated(selected);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hovered || selected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 text-xl"
        >
          ✕
        </button>

        <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">
          Rate this {entityType}
        </h2>
        <p className="text-zinc-400 text-sm mb-6 truncate">{entityName}</p>

        {/* Rating display */}
        <div className="text-center mb-6">
          <div className="font-display text-7xl font-bold text-orange-500 leading-none">
            {displayRating || '—'}
          </div>
          <div className="text-zinc-400 text-sm mt-2 h-5">
            {displayRating ? getRatingLabel(displayRating) : 'Select a rating'}
          </div>
        </div>

        {/* Rating buttons */}
        <div className="grid grid-cols-10 gap-1 mb-6">
          {ratings.map((r) => (
            <button
              key={r}
              onMouseEnter={() => setHovered(r)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(r)}
              className={`
                h-8 rounded text-xs font-medium transition-all duration-75
                ${r <= (hovered || selected)
                  ? 'bg-orange-500 text-white scale-105'
                  : 'bg-zinc-100 text-zinc-400 hover:bg-orange-100'
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleRate}
            disabled={!selected || isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? 'Saving…' : 'Save Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}