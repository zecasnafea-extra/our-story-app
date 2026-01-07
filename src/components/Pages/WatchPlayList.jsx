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
  const [filter, setFilter] = useState('all'); // all, movie, series, game
  const [statusFilter, setStatusFilter] = useState('all'); // all, not-started, in-progress, done

  const getIcon = (type) => {
    switch(type) {
      case 'movie': return <Film size={20} />;
      case 'series': return <Tv size={20} />;
      case 'game': return <Gamepad2 size={20} />;
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
      <div className="p-6 animate-fade-in">
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
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">🎬 Watch & Play List</h2>
          <p className="text-gray-600 text-sm mt-1">
            Track movies, series, and games together ({stats.total} items)
          </p>
        </div>
        <div className="flex gap-3">
          {/* Randomizer Button */}
          <button
            onClick={() => setShowRandomizer(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center gap-2"
            title="Pick random item"
          >
            <Shuffle size={20} />
            <span className="font-medium hidden sm:inline">Random</span>
          </button>
          
          {/* Add Button */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
            title="Add new item"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <Film size={20} />
            <span className="text-sm font-medium">Movies</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.movies}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Tv size={20} />
            <span className="text-sm font-medium">Series</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.series}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Gamepad2 size={20} />
            <span className="text-sm font-medium">Games</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.games}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              filter === 'movie'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Film size={16} />
            Movies
          </button>
          <button
            onClick={() => setFilter('series')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              filter === 'series'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Tv size={16} />
            Series
          </button>
          <button
            onClick={() => setFilter('game')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              filter === 'game'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Gamepad2 size={16} />
            Games
          </button>
        </div>

        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('not-started')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'not-started'
                ? 'bg-gray-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock size={16} />
            Not Started
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'in-progress'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Play size={16} />
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('done')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'done'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 size={16} />
            Done
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => (
          <ItemCard key={item.id} item={item} index={index} />
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">
              {filter === 'movie' ? '🎬' : filter === 'series' ? '📺' : filter === 'game' ? '🎮' : '🍿'}
            </div>
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm mt-2">
              {filter === 'all' 
                ? 'Start adding movies, series, or games to track!' 
                : `No ${filter}s added yet`}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
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
