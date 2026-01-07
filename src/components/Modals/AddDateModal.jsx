import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

const AddDateModal = ({ onClose, editItem = null }) => {
  const { addDocument, updateDocument } = useFirestore('dateIdeas');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editItem?.title || '',
    category: editItem?.category || '',
    status: editItem?.status || 'waiting',
    estimatedPrice: editItem?.estimatedPrice || 0,
    notes: editItem?.notes || ''
  });

  const categories = [
    { id: 'fun-activities', label: 'Fun Activities', emoji: '🎉' },
    { id: 'home-date', label: 'Home Date', emoji: '🏠' },
    { id: 'outdoor', label: 'Outdoor', emoji: '🌲' },
    { id: 'dinner-food', label: 'Dinner / Food', emoji: '🍽️' },
    { id: 'travel', label: 'Travel / Exploration', emoji: '✈️' },
    { id: 'special', label: 'Special / Surprise', emoji: '🎁' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category) return;

    setLoading(true);
    try {
      if (editItem) {
        await updateDocument(editItem.id, formData);
      } else {
        await addDocument(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving date idea:', error);
      alert('Failed to save date idea. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {editItem ? '✏️ Edit Date Idea' : '📅 Add Date Idea'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Idea *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Try that new restaurant..."
              disabled={loading}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={loading}
              required
            >
              <option value="">Choose category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={loading}
            >
              <option value="waiting">⏳ Waiting</option>
              <option value="planned">📝 Planned</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>

          {/* Estimated Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Price
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => setFormData({...formData, estimatedPrice: price})}
                  disabled={loading}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all font-medium ${
                    formData.estimatedPrice === price
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300 text-gray-600'
                  }`}
                >
                  {price === 0 ? 'Free' : '$'.repeat(price)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.estimatedPrice === 0 && 'Free activity'}
              {formData.estimatedPrice === 1 && 'Budget-friendly (under $20)'}
              {formData.estimatedPrice === 2 && 'Moderate ($20-50)'}
              {formData.estimatedPrice === 3 && 'Nice treat ($50-100)'}
              {formData.estimatedPrice === 4 && 'Special occasion ($100-200)'}
              {formData.estimatedPrice === 5 && 'Luxury experience ($200+)'}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              rows="3"
              placeholder="Any details or ideas..."
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.category}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : editItem ? 'Update Date Idea' : 'Add Date Idea'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDateModal;
