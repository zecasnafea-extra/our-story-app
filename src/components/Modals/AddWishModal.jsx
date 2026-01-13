import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { useSimpleNotifications, NotificationTemplates } from '../../hooks/useSimpleNotifications';  // ← ADD THIS
import { useAuth } from '../../contexts/AuthContext';  // ← ADD THIS

const AddWishModal = ({ onClose }) => {
  const { addDocument } = useFirestore('wishes');
  const { currentUser } = useAuth();  // ← ADD THIS
  const { sendNotification } = useSimpleNotifications(currentUser);  // ← ADD THIS
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    createdBy: '',
    unlockDate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text) return;

    setLoading(true);
    try {
      await addDocument({
        text: formData.text,
        createdBy: formData.createdBy || 'Anonymous',
        unlockDate: formData.unlockDate || null,
        isRevealed: false
      });
      
      // ← ADD THIS: Send notification to partner
      const template = NotificationTemplates.wishAdded();
      await sendNotification(template.title, template.body, template.type);
      
      onClose();
    } catch (error) {
      console.error('Error adding wish:', error);
      alert('Failed to add wish. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">🫙 Add Wish</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Wish Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Wish *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({...formData, text: e.target.value})}
              className="input"
              rows="4"
              placeholder="I wish we could..."
              required
            />
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Created By (Optional)
            </label>
            <input
              type="text"
              value={formData.createdBy}
              onChange={(e) => setFormData({...formData, createdBy: e.target.value})}
              className="input"
              placeholder="Your name or leave anonymous"
            />
          </div>

          {/* Unlock Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unlock Date (Optional)
            </label>
            <input
              type="date"
              value={formData.unlockDate}
              onChange={(e) => setFormData({...formData, unlockDate: e.target.value})}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to reveal anytime, or set a future date
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.text}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Wish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWishModal;
