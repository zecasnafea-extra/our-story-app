import React, { useState } from 'react';
import { Film, Tv, Gamepad2, Star, Trash2, Edit2, Clock, Play, CheckCircle2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddItemModal from '../Modals/AddItemModal';

const ItemCard = ({ item, index }) => {
  const { deleteDocument, updateDocument } = useFirestore('watchlist');
  const [showEditModal, setShowEditModal] = useState(false);

  const getTypeGradient = (type) => ({
    movie:  'linear-gradient(135deg, #3D1A08 0%, #7A3020 100%)',
    series: 'linear-gradient(135deg, #0F1A2A 0%, #1A3050 100%)',
    game:   'linear-gradient(135deg, #1A0D2A 0%, #3A1A50 100%)',
  })[type] || 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)';

  const getTypeBorderColor = (type) => ({
    movie:  'rgba(180,80,60,0.4)',
    series: 'rgba(60,100,180,0.4)',
    game:   'rgba(120,60,180,0.4)',
  })[type] || 'rgba(42,42,48,1)';

  const getTypeAccent = (type) => ({
    movie:  '#C87050',
    series: '#5090C8',
    game:   '#9060C8',
  })[type] || '#C89B3C';

  const getTypeIcon = (type) => ({
    movie:  <Film size={24} className="text-white" />,
    series: <Tv size={24} className="text-white" />,
    game:   <Gamepad2 size={24} className="text-white" />,
  })[type] || null;

  const getStatusIcon = (status) => ({
    'not-started': <Clock size={16} style={{ color: '#787878' }} />,
    'in-progress': <Play size={16} style={{ color: '#5090C8' }} />,
    'done':        <CheckCircle2 size={16} style={{ color: '#C89B3C' }} />,
  })[status] || null;

  const getStatusLabel = (status) => ({
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'done':        'Done',
  })[status] || '';

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try { await deleteDocument(item.id); }
      catch (error) { console.error('Error deleting item:', error); alert('Failed to delete item. Please try again.'); }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try { await updateDocument(item.id, { status: newStatus }); }
    catch (error) { console.error('Error updating status:', error); alert('Failed to update status. Please try again.'); }
  };

  const getProgress = () => {
    if (item.type === 'series') return Math.round((item.watchedEpisodes / item.totalEpisodes) * 100);
    if (item.type === 'game')   return Math.round((item.hoursPlayed / item.estimatedHours) * 100);
    return 0;
  };

  const progress = getProgress();
  const accent = getTypeAccent(item.type);

  return (
    <>
      <div
        className="card group hover:shadow-xl transition-all animate-slide-up relative overflow-hidden"
        style={{ animationDelay: `${index * 50}ms`, padding: 0, border: `1px solid ${getTypeBorderColor(item.type)}` }}
      >
        {/* Type Header */}
        <div className="p-3 flex items-center justify-between" style={{ background: getTypeGradient(item.type) }}>
          <div className="flex items-center gap-2">
            {getTypeIcon(item.type)}
            <span className="text-white font-medium text-sm uppercase">{item.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              title="Edit"
            >
              <Edit2 size={16} className="text-white" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              title="Delete"
            >
              <Trash2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Title */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2" style={{ color: '#E8E8E8' }}>
            {item.title}
          </h3>

          {/* Rating */}
          {item.rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  style={{ color: star <= item.rating ? '#C89B3C' : '#2A2A30', fill: star <= item.rating ? '#C89B3C' : 'transparent' }}
                />
              ))}
              <span className="text-sm ml-1" style={{ color: '#787878' }}>({item.rating}/5)</span>
            </div>
          )}

          {/* Categories */}
          {item.categories && item.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(200,155,60,0.1)', color: '#8F7B5E', border: '1px solid rgba(200,155,60,0.2)' }}
                >
                  {category}
                </span>
              ))}
              {item.categories.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(42,42,48,0.8)', color: '#787878', border: '1px solid #2A2A30' }}>
                  +{item.categories.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Series progress */}
          {item.type === 'series' && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1" style={{ color: '#A8A8A8' }}>
                <span>Season {item.season}</span>
                <span>{item.watchedEpisodes}/{item.totalEpisodes} episodes</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#2A2A30' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(to right, #0F1A2A, ${accent})` }} />
              </div>
              <p className="text-xs mt-1" style={{ color: '#787878' }}>{progress}% watched</p>
            </div>
          )}

          {/* Game progress */}
          {item.type === 'game' && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1" style={{ color: '#A8A8A8' }}>
                <span>{item.hoursPlayed}h played</span>
                <span>~{item.estimatedHours}h total</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#2A2A30' }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(to right, #1A0D2A, ${accent})` }} />
              </div>
              <p className="text-xs mt-1" style={{ color: '#787878' }}>{progress}% completed</p>
            </div>
          )}

          {/* Movie notes */}
          {item.type === 'movie' && item.notes && (
            <div className="mb-3">
              <p className="text-sm italic line-clamp-2" style={{ color: '#A8A8A8' }}>"{item.notes}"</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-3">
            {getStatusIcon(item.status)}
            <span className="text-sm font-medium" style={{ color: '#A8A8A8' }}>{getStatusLabel(item.status)}</span>
          </div>

          {/* Status Actions */}
          <div className="flex gap-2 flex-wrap">
            {item.status !== 'not-started' && (
              <button onClick={() => handleStatusChange('not-started')}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: 'rgba(42,42,48,0.8)', color: '#A8A8A8', border: '1px solid #2A2A30' }}>
                Reset
              </button>
            )}
            {item.status !== 'in-progress' && (
              <button onClick={() => handleStatusChange('in-progress')}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: 'rgba(15,26,42,0.8)', color: '#5090C8', border: '1px solid rgba(60,100,180,0.25)' }}>
                Start
              </button>
            )}
            {item.status !== 'done' && (
              <button onClick={() => handleStatusChange('done')}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: 'rgba(200,155,60,0.1)', color: '#C89B3C', border: '1px solid rgba(200,155,60,0.25)' }}>
                Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <AddItemModal editItem={item} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
};

export default ItemCard;
