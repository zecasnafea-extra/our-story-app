import React, { useState } from 'react';
import { Film, Tv, Gamepad2, Clock, Play, CheckCircle2, Trash2, Edit, Plus, Minus } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

const ItemCard = ({ item, index }) => {
  const { updateDocument, deleteDocument } = useFirestore('watchlist');
  const [updating, setUpdating] = useState(false);

  // Calculate progress
  const getProgress = () => {
    if (item.type === 'game' && item.hoursPlayed !== undefined && item.estimatedHours) {
      return Math.min(Math.round((item.hoursPlayed / item.estimatedHours) * 100), 100);
    }
    if (item.type === 'series' && item.watchedEpisodes !== undefined && item.totalEpisodes) {
      return Math.min(Math.round((item.watchedEpisodes / item.totalEpisodes) * 100), 100);
    }
    return null;
  };

  const progress = getProgress();

  // Auto-complete if progress reaches 100%
  const checkAutoComplete = async (newProgress) => {
    if (newProgress >= 100 && item.status !== 'done') {
      await updateDocument(item.id, { status: 'done' });
    }
  };

  // Update status
  const handleStatusChange = async () => {
    const statusFlow = { 'not-started': 'in-progress', 'in-progress': 'done', 'done': 'not-started' };
    setUpdating(true);
    try {
      await updateDocument(item.id, { status: statusFlow[item.status] });
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update series episode
  const handleEpisodeChange = async (increment) => {
    const newEpisodes = Math.max(0, Math.min(item.totalEpisodes, item.watchedEpisodes + increment));
    setUpdating(true);
    try {
      await updateDocument(item.id, { 
        watchedEpisodes: newEpisodes,
        status: newEpisodes === 0 ? 'not-started' : newEpisodes < item.totalEpisodes ? 'in-progress' : 'done'
      });
    } catch (error) {
      console.error('Error updating episodes:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Update game hours
  const handleHoursChange = async (increment) => {
    const newHours = Math.max(0, item.hoursPlayed + increment);
    const newProgress = Math.min(Math.round((newHours / item.estimatedHours) * 100), 100);
    setUpdating(true);
    try {
      await updateDocument(item.id, { 
        hoursPlayed: newHours,
        status: newHours === 0 ? 'not-started' : newProgress >= 100 ? 'done' : 'in-progress'
      });
    } catch (error) {
      console.error('Error updating hours:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Delete item
  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.title}"?`)) {
      try {
        await deleteDocument(item.id);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const getTypeColor = () => {
    switch(item.type) {
      case 'movie': return 'from-red-500 to-orange-500';
      case 'series': return 'from-blue-500 to-cyan-500';
      case 'game': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = () => {
    switch(item.status) {
      case 'not-started': return 'bg-gray-100 text-gray-600';
      case 'in-progress': return 'bg-blue-100 text-blue-600';
      case 'done': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getIcon = () => {
    switch(item.type) {
      case 'movie': return <Film size={20} />;
      case 'series': return <Tv size={20} />;
      case 'game': return <Gamepad2 size={20} />;
      default: return null;
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group animate-scale-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${getTypeColor()} p-4 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            {getIcon()}
            <span className="text-xs font-medium uppercase opacity-90">
              {item.type}
            </span>
          </div>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <h3 className="text-lg font-bold line-clamp-2">{item.title}</h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleStatusChange}
            disabled={updating}
            className={`${getStatusColor()} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50`}
          >
            {item.status === 'not-started' && <Clock size={14} />}
            {item.status === 'in-progress' && <Play size={14} />}
            {item.status === 'done' && <CheckCircle2 size={14} />}
            {item.status === 'not-started' ? 'Not Started' : item.status === 'in-progress' ? 'In Progress' : 'Done'}
          </button>
          {item.completedDate && (
            <span className="text-xs text-gray-500">
              {new Date(item.completedDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Series Progress */}
        {item.type === 'series' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Season {item.season || 1}</span>
              <span className="font-medium">{item.watchedEpisodes} / {item.totalEpisodes} episodes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEpisodeChange(-1)}
                disabled={updating || item.watchedEpisodes === 0}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Minus size={14} />
                Episode
              </button>
              <button
                onClick={() => handleEpisodeChange(1)}
                disabled={updating || item.watchedEpisodes >= item.totalEpisodes}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                Episode
              </button>
            </div>
          </div>
        )}

        {/* Game Progress */}
        {item.type === 'game' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Playtime</span>
              <span className="font-medium">{item.hoursPlayed} / {item.estimatedHours} hours</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleHoursChange(-1)}
                disabled={updating || item.hoursPlayed === 0}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Minus size={14} />
                1h
              </button>
              <button
                onClick={() => handleHoursChange(1)}
                disabled={updating}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                1h
              </button>
            </div>
          </div>
        )}

        {/* Movie - Just status, no progress */}
        {item.type === 'movie' && item.notes && (
          <p className="text-sm text-gray-600 italic">"{item.notes}"</p>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
