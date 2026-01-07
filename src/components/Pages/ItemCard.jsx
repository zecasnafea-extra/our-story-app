import React, { useState } from 'react';
import { Film, Tv, Gamepad2, Star, Trash2, Edit2, Clock, Play, CheckCircle2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddItemModal from '../Modals/AddItemModal';

const ItemCard = ({ item, index }) => {
  const { deleteDocument, updateDocument } = useFirestore('watchlist');
  const [showEditModal, setShowEditModal] = useState(false);

  const getTypeColor = (type) => {
    switch(type) {
      case 'movie': return 'from-red-500 to-pink-500';
      case 'series': return 'from-blue-500 to-cyan-500';
      case 'game': return 'from-purple-500 to-indigo-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'movie': return <Film size={24} className="text-white" />;
      case 'series': return <Tv size={24} className="text-white" />;
      case 'game': return <Gamepad2 size={24} className="text-white" />;
      default: return null;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'not-started': return <Clock size={16} className="text-gray-400" />;
      case 'in-progress': return <Play size={16} className="text-blue-500" />;
      case 'done': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'not-started': return 'Not Started';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
      default: return '';
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await deleteDocument(item.id);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateDocument(item.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getProgress = () => {
    if (item.type === 'series') {
      return Math.round((item.watchedEpisodes / item.totalEpisodes) * 100);
    } else if (item.type === 'game') {
      return Math.round((item.hoursPlayed / item.estimatedHours) * 100);
    }
    return 0;
  };

  const progress = getProgress();

  return (
    <>
      <div
        className="card group hover:shadow-xl transition-all animate-slide-up relative overflow-hidden"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Type Header */}
        <div className={`bg-gradient-to-r ${getTypeColor(item.type)} p-3 -mx-6 -mt-6 mb-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            <span className="text-white font-medium text-sm uppercase">{item.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title="Edit"
            >
              <Edit2 size={16} className="text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title="Delete"
            >
              <Trash2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Rating */}
        {item.rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">({item.rating}/5)</span>
          </div>
        )}

        {/* Categories */}
        {item.categories && item.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium"
              >
                {category}
              </span>
            ))}
            {item.categories.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                +{item.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Type Specific Info */}
        {item.type === 'series' && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Season {item.season}</span>
              <span>{item.watchedEpisodes}/{item.totalEpisodes} episodes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}% watched</p>
          </div>
        )}

        {item.type === 'game' && (
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{item.hoursPlayed}h played</span>
              <span>~{item.estimatedHours}h total</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}% completed</p>
          </div>
        )}

        {item.type === 'movie' && item.notes && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 italic line-clamp-2">"{item.notes}"</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          {getStatusIcon(item.status)}
          <span className="text-sm font-medium text-gray-700">
            {getStatusLabel(item.status)}
          </span>
        </div>

        {/* Status Actions */}
        <div className="flex gap-2 flex-wrap">
          {item.status !== 'not-started' && (
            <button
              onClick={() => handleStatusChange('not-started')}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Reset
            </button>
          )}
          {item.status !== 'in-progress' && (
            <button
              onClick={() => handleStatusChange('in-progress')}
              className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              Start
            </button>
          )}
          {item.status !== 'done' && (
            <button
              onClick={() => handleStatusChange('done')}
              className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
            >
              Complete
            </button>
          )}
        </div>
      </div>

      {showEditModal && (
        <AddItemModal
          editItem={item}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};

export default ItemCard;
