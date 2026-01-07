import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

const AddDateModal = ({ onClose, editItem = null }) => {
  const { addDocument, updateDocument } = useFirestore('dateIdeas');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editItem?.title || '',
    category: editItem?.category || '',
    notes: editItem?.notes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category) return;

    setLoading(true);
    try {
      if (editItem) {
        await updateDocument(editItem.id, formData);
      } else {
        await addDocument({
          ...formData,
          status: 'planned'
        });
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
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
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

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Idea *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input"
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
              className="input"
              disabled={loading}
              required
            >
              <option value="">Choose category...</option>
              <option value="food">🍕 Food</option>
              <option value="outdoors">🌲 Outdoors</option>
              <option value="travel">✈️ Travel</option>
              <option value="random">🎲 Random</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="input"
              rows="3"
              placeholder="Any details or ideas..."
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.category}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : editItem ? 'Update Date Idea' : 'Add Date Idea'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDateModal;
