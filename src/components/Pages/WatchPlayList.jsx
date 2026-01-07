import React, { useState } from 'react';
import { Plus, Film, Tv, Gamepad2, Clock, Play, CheckCircle2, Shuffle } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddItemModal from '../Modals/AddItemModal';
import RandomizerModal from '../Modals/RandomizerModal';
import ItemCard from './ItemCard';

const WatchPlayList = () => {
  const { documents: items, loading } = useFirestore('watchlist');
  const [showModal, setShowModal] = useState(false);
  const [showRandomizer, setShowRandomizer] = useState(false);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter items
  const filteredItems = items.filter(item => {
    const typeMatch = filter === 'all' || item.type === filter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Statistics
  const stats = {
    total: items.length,
    movies: items.filter(i => i.type === 'movie').length,
    series: items.filter(i => i.type === 'series').length,
    games: items.filter(i => i.type === 'game').length,
    completed: items.filter(i => i.status === 'done').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 animate-fade-in">
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading your list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">🎬 Watch & Play</h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1">
            {stats.total} items
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-2">
          <button
            onClick={() => setShowRandomizer(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-2.5 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center gap-2"
            title="Pick random item"
          >
            <Shuffle size={18} />
            <span className="font-medium hidden sm:inline">Random</span>
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-2.5 sm:p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
            title="Add new item"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 text-red-600 mb-1">
            <Film size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Movies</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-700">{stats.movies}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-600 mb-1">
            <Tv size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Series</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">{stats.series}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 text-purple-600 mb-1">
            <Gamepad2 size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Games</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-700">{stats.games}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 mb-1">
            <CheckCircle2 size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium">Done</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
      </div>

      {/* Type Filter - Horizontal scroll on mobile */}
      <div className="mb-3 sm:mb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm min-w-max sm:min-w-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              filter === 'movie'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Film size={14} />
            Movies
          </button>
          <button
            onClick={() => setFilter('series')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              filter === 'series'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Tv size={14} />
            Series
          </button>
          <button
            onClick={() => setFilter('game')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              filter === 'game'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Gamepad2 size={14} />
            Games
          </button>
        </div>
      </div>

      {/* Status Filter - Horizontal scroll on mobile */}
      <div className="mb-4 sm:mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm min-w-max sm:min-w-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('not-started')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'not-started'
                ? 'bg-gray-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock size={14} />
            Not Started
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'in-progress'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Play size={14} />
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('done')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'done'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 size={14} />
            Done
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredItems.map((item, index) => (
          <ItemCard key={item.id} item={item} index={index} />
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 sm:py-16 text-gray-400">
            <div className="text-5xl sm:text-6xl mb-4">
              {filter === 'movie' ? '🎬' : filter === 'series' ? '📺' : filter === 'game' ? '🎮' : '🍿'}
            </div>
            <p className="text-base sm:text-lg font-medium">No items found</p>
            <p className="text-xs sm:text-sm mt-2 px-4">
              {filter === 'all' 
                ? 'Start adding movies, series, or games to track!' 
                : `No ${filter}s added yet`}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm sm:text-base"
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showModal && <AddItemModal onClose={() => setShowModal(false)} />}
      
      {/* Randomizer Modal */}
      {showRandomizer && (
        <RandomizerModal 
          items={items} 
          onClose={() => setShowRandomizer(false)} 
        />
      )}
    </div>
  );
};

export default WatchPlayList;
