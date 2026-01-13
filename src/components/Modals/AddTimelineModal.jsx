import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useSimpleNotifications, NotificationTemplates } from '../../hooks/useSimpleNotifications';  // ← ADD THIS
import { useAuth } from '../../contexts/AuthContext';  // ← ADD THIS

const AddTimelineModal = ({ onClose, editItem = null }) => {
  const { addDocument, updateDocument } = useFirestore('timeline');
  const { currentUser } = useAuth();  // ← ADD THIS
  const { sendNotification } = useSimpleNotifications(currentUser);  // ← ADD THIS
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: editItem?.type || '',
    title: editItem?.title || '',
    description: editItem?.description || '',
    date: editItem?.date || new Date().toISOString().split('T')[0],
    tags: editItem?.tags ? editItem.tags.join(', ') : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.title) return;

    setLoading(true);
    try {
      const dataToSave = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (editItem) {
        await updateDocument(editItem.id, dataToSave);
      } else {
        await addDocument({
          ...dataToSave,
          isCompleted: formData.type === 'date' ? false : true
        });
        
        // ← ADD THIS: Send notification (only when adding, not editing)
        const template = NotificationTemplates.timelineAdded(formData.title);
        await sendNotification(template.title, template.body, template.type);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving timeline item:', error);
      alert('Failed to save item. Please try again.');
    }
    setLoading(false);
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {editItem ? '✏️ Edit Memory' : '✨ Add Memory'}
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
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="input"
              disabled={loading}
              required
            >
              <option value="">Choose type...</option>
              <option value="event">🎉 Event (Memory)</option>
              <option value="milestone">🏁 Milestone</option>
              <option value="date">📅 Date</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input"
              placeholder="What happened?"
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input"
              rows="3"
              placeholder="Tell the story..."
              disabled={loading}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="input"
              disabled={loading}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="input"
              placeholder="travel, adventure, special"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.type || !formData.title}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : editItem ? 'Update Memory' : 'Add to Timeline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTimelineModal;
