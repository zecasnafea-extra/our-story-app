import React, { useState } from 'react';
import { X, Film, Tv, Gamepad2, Star } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

const AddItemModal = ({ onClose, editItem = null }) => {
  const { addDocument, updateDocument } = useFirestore('watchlist');
  const [type, setType] = useState(editItem?.type || 'movie');
  const [formData, setFormData] = useState({
    title: editItem?.title || '',
    status: editItem?.status || 'not-started',
    rating: editItem?.rating || 0,
    categories: editItem?.categories || [],
    // Series specific
    season: editItem?.season || 1,
    watchedEpisodes: editItem?.watchedEpisodes || 0,
    totalEpisodes: editItem?.totalEpisodes || 10,
    // Game specific
    hoursPlayed: editItem?.hoursPlayed || 0,
    estimatedHours: editItem?.estimatedHours || 10,
    // Movie specific
    notes: editItem?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const movieSeriesCategories = [
    'Action', 'Adventure', 'Comedy', 'Romance', 'Drama', 
    'Horror', 'Thriller', 'Sci-Fi', 'Fantasy', 'Animation', 'Documentary'
  ];

  const gameCategories = [
    'Action', 'Adventure', 'Puzzle', 'Simulation', 
    'Sports', 'Casual', 'Horror'
  ];

  const categories = type === 'game' ? gameCategories : movieSeriesCategories;

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const setRating = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

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
        rating: formData.rating,
        categories: formData.categories,
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

      if (editItem) {
        await updateDocument(editItem.id, { ...baseData, ...specificData });
      } else {
        await addDocument({ ...baseData, ...specificData });
      }
      
      console.log('✅ Item saved successfully!');
      onClose();
    } catch (error) {
      console.error('❌ Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {editItem ? '✏️ Edit Item' : '➕ Add New Item'}
          </h3>
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
                disabled={editItem}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'movie'
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-gray-300'
                } ${editItem ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Film size={24} />
                <span className="text-xs font-medium">Movie</span>
              </button>
              <button
                type="button"
                onClick={() => setType('series')}
                disabled={editItem}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'series'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                } ${editItem ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Tv size={24} />
                <span className="text-xs font-medium">Series</span>
              </button>
              <button
                type="button"
                onClick={() => setType('game')}
                disabled={editItem}
                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                  type === 'game'
                    ? 'border-purple-500 bg-purple-50 text-purple-600'
                    : 'border-gray-200 hover:border-gray-300'
                } ${editItem ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (Optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  disabled={submitting}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  disabled={submitting}
                  className="ml-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories (Select multiple)
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  disabled={submitting}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    formData.categories.includes(category)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {formData.categories.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.categories.length} selected
              </p>
            )}
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
            {submitting ? 'Saving...' : editItem ? 'Update Item' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
