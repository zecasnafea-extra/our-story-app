import React, { useState } from 'react';
import { X, Film, Tv, Gamepad2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

const AddItemModal = ({ onClose }) => {
  const { addDocument } = useFirestore('watchlist');
  const [type, setType] = useState('movie'); // movie, series, game
  const [formData, setFormData] = useState({
    title: '',
    status: 'not-started',
    // Series specific
    season: 1,
    watchedEpisodes: 0,
    totalEpisodes: 10,
    // Game specific
    hoursPlayed: 0,
    estimatedHours: 10,
    // Movie specific
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSubmitting(true);
    try {
      const baseData = {
        title: formData.title.trim(),
        type,
        status: formData.status,
      };

      let specificData = {};

      if (type === 'series') {
        specificData = {
          season: parseInt(formData.season) || 1,
          watchedEpisodes: parseInt(formData.watchedEpisodes) || 0,
          totalEpisodes: parseInt(formData.totalEpisodes) || 10,
        };
      } else if (type === 'game') {
        specificData = {
          hoursPlayed: parseFloat(formData.hoursPlayed) || 0,
          estimatedHours: parseFloat(formData.estimatedHours) || 10,
        };
      } else if (type === 'movie') {
        specificData = {
          notes: formData.notes.trim(),
        };
      }

      await addDocument({ ...baseData, ...specificData });
      console.log('✅ Item added successfully!');
      onClose();
    } catch (error) {
      console.error('❌ Error adding item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">➕ Add New Item</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('movie')}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'movie'
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Film size={24} />
                <span className="text-xs font-medium">Movie</span>
              </button>
              <button
                type="button"
                onClick={() => setType('series')}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'series'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Tv size={24} />
                <span className="text-xs font-medium">Series</span>
              </button>
              <button
                type="button"
                onClick={() => setType('game')}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'game'
                    ? 'border-purple-500 bg-purple-50 text-purple-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Gamepad2 size={24} />
                <span className="text-xs font-medium">Game</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={`Enter ${type} title...`}
              disabled={submitting}
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={submitting}
            >
              <option value="not-started">⏳ Not Started</option>
              <option value="in-progress">▶️ In Progress</option>
              <option value="done">✅ Done</option>
            </select>
          </div>

          {/* Series Specific Fields */}
          {type === 'series' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Season
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Episodes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalEpisodes}
                    onChange={(e) => setFormData({ ...formData, totalEpisodes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Watched Episodes
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.totalEpisodes}
                  value={formData.watchedEpisodes}
                  onChange={(e) => setFormData({ ...formData, watchedEpisodes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>
            </>
          )}

          {/* Game Specific Fields */}
          {type === 'game' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours Played
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.hoursPlayed}
                  onChange={(e) => setFormData({ ...formData, hoursPlayed: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={submitting}
                  required
                />
              </div>
            </div>
          )}

          {/* Movie Specific Fields */}
          {type === 'movie' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Your thoughts about this movie..."
                rows="3"
                disabled={submitting}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !formData.title.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding...' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
