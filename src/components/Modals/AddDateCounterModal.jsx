import React, { useState } from 'react';
import { X, Heart, Cake, Gift, Sparkles } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

const AddDateCounterModal = ({ onClose }) => {
  const { addDocument } = useFirestore('dateCounters');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    icon: 'heart'
  });

  const icons = [
    { id: 'heart', label: 'Heart', icon: Heart, color: 'text-pink-500' },
    { id: 'cake', label: 'Birthday', icon: Cake, color: 'text-orange-500' },
    { id: 'gift', label: 'Gift', icon: Gift, color: 'text-purple-500' },
    { id: 'sparkles', label: 'Special', icon: Sparkles, color: 'text-yellow-500' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    setLoading(true);
    try {
      await addDocument(formData);
      onClose();
    } catch (error) {
      console.error('Error adding date counter:', error);
      alert('Failed to add date counter. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">📅 Add Date Counter</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input"
              placeholder="Valentine's Day, My Birthday, Anniversary..."
              required
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
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Icon *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {icons.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({...formData, icon: id})}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.icon === id
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-gray-200 hover:border-pink-300 bg-white'
                  }`}
                >
                  <Icon className={color} size={28} />
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.date}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Date Counter'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Countdown to your special dates! 💕
        </p>
      </div>
    </div>
  );
};

export default AddDateCounterModal;