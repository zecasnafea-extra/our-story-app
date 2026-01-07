import React, { useState } from 'react';
import { Plus, Check, X, Trash2, Edit2, DollarSign } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddDateModal from '../Modals/AddDateModal';

const DatePlanner = () => {
  const { documents: dateIdeas, updateDocument, deleteDocument } = useFirestore('dateIdeas');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');

  const updateStatus = async (id, status) => {
    try {
      await updateDocument(id, { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this date idea?')) {
      try {
        await deleteDocument(id);
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const categories = [
    { id: 'all', label: 'All', emoji: '✨' },
    { id: 'fun-activities', label: 'Fun Activities', emoji: '🎉' },
    { id: 'home-date', label: 'Home Date', emoji: '🏠' },
    { id: 'outdoor', label: 'Outdoor', emoji: '🌲' },
    { id: 'dinner-food', label: 'Dinner / Food', emoji: '🍽️' },
    { id: 'travel', label: 'Travel / Exploration', emoji: '✈️' },
    { id: 'special', label: 'Special / Surprise', emoji: '🎁' }
  ];

  const getCategoryEmoji = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.emoji : '✨';
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.label : category;
  };

  const filtered = filter === 'all' 
    ? dateIdeas 
    : dateIdeas.filter(d => d.category === filter);

  const getStatusColor = (status) => {
    const colors = {
      waiting: 'border-yellow-300 bg-yellow-50',
      planned: 'border-blue-300 bg-blue-50',
      completed: 'border-green-300 bg-green-50 opacity-80'
    };
    return colors[status] || colors.waiting;
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      waiting: '⏳',
      planned: '📝',
      completed: '✅'
    };
    return emojis[status] || '⏳';
  };

  const getPriceDisplay = (price) => {
    if (!price) return null;
    const dollars = '$'.repeat(Math.min(price, 5));
    return dollars;
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Date Ideas</h2>
          <p className="text-gray-600 text-sm mt-1">Plan your perfect moments together</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              filter === cat.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300'
            }`}
          >
            <span>{cat.emoji}</span>
            <span className="text-sm">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Date Ideas List */}
      <div className="space-y-3">
        {filtered.map((date, index) => (
          <div
            key={date.id}
            className={`card border-2 ${getStatusColor(date.status)} animate-slide-up group`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Category Icon */}
              <div className="text-3xl flex-shrink-0">
                {getCategoryEmoji(date.category)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{date.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Status Badge */}
                      <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600 font-medium flex items-center gap-1">
                        <span>{getStatusEmoji(date.status)}</span>
                        <span>{date.status === 'waiting' ? 'Waiting' : date.status === 'planned' ? 'Planned' : 'Completed'}</span>
                      </span>
                      {/* Price Badge */}
                      {date.estimatedPrice > 0 && (
                        <span className="text-xs px-2 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium">
                          {getPriceDisplay(date.estimatedPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(date)}
                    className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {/* Category Badge */}
                <div className="mb-2">
                  <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600 font-medium">
                    {getCategoryLabel(date.category)}
                  </span>
                </div>

                {/* Notes */}
                {date.notes && (
                  <p className="text-sm text-gray-600 mb-3">{date.notes}</p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {date.status === 'waiting' && (
                    <>
                      <button
                        onClick={() => updateStatus(date.id, 'planned')}
                        className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        📝 Plan It
                      </button>
                      <button
                        onClick={() => updateStatus(date.id, 'completed')}
                        className="text-sm px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-1"
                      >
                        <Check size={16} />
                        Done
                      </button>
                    </>
                  )}
                  {date.status === 'planned' && (
                    <>
                      <button
                        onClick={() => updateStatus(date.id, 'completed')}
                        className="text-sm px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-1"
                      >
                        <Check size={16} />
                        Done
                      </button>
                      <button
                        onClick={() => updateStatus(date.id, 'waiting')}
                        className="text-sm px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                      >
                        ⏳ Move to Waiting
                      </button>
                    </>
                  )}
                  {date.status === 'completed' && (
                    <button
                      onClick={() => updateStatus(date.id, 'waiting')}
                      className="text-sm px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                    >
                      Restore to Waiting
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(date.id)}
                    className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg">No date ideas yet</p>
            <p className="text-sm mt-2">Plan something special together</p>
          </div>
        )}
      </div>

      {showModal && (
        <AddDateModal 
          onClose={handleCloseModal} 
          editItem={editingItem}
        />
      )}
    </div>
  );
};

export default DatePlanner;
