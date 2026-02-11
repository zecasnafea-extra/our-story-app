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

  const filteredItems = items.filter(item => {
    const typeMatch = filter === 'all' || item.type === filter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const stats = {
    total:      items.length,
    movies:     items.filter(i => i.type === 'movie').length,
    series:     items.filter(i => i.type === 'series').length,
    games:      items.filter(i => i.type === 'game').length,
    completed:  items.filter(i => i.status === 'done').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
  };

  const filterBtnStyle = (active, activeColor = '#C89B3C', activeBg = 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)') => ({
    background: active ? activeBg : 'transparent',
    color: active ? '#fff' : '#A8A8A8',
    border: active ? 'none' : '1px solid #2A2A30',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem'
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 animate-fade-in" style={{ background: '#0B0B0C', minHeight: '100vh' }}>
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#C89B3C' }}></div>
            <p className="mt-4" style={{ color: '#A8A8A8' }}>Loading your list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24 animate-fade-in" style={{ background: '#0B0B0C', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-semibold truncate" style={{ color: '#C89B3C' }}>🎬 Watch & Play</h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: '#787878' }}>{stats.total} items</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-2">
          <button
            onClick={() => setShowRandomizer(true)}
            className="text-white p-2.5 sm:px-4 sm:py-3 rounded-full shadow-lg hover:scale-110 transition-all flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #8F7B5E 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.2)' }}
          >
            <Shuffle size={18} />
            <span className="font-medium hidden sm:inline">Random</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="text-white p-2.5 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.25)' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {[
          { icon: <Film size={16} className="sm:w-5 sm:h-5" />, label: 'Movies',  count: stats.movies,    accent: '#C87050', bg: 'rgba(180,80,60,0.08)',  border: 'rgba(180,80,60,0.2)' },
          { icon: <Tv size={16} className="sm:w-5 sm:h-5" />,   label: 'Series',  count: stats.series,    accent: '#5090C8', bg: 'rgba(60,100,180,0.08)', border: 'rgba(60,100,180,0.2)' },
          { icon: <Gamepad2 size={16} className="sm:w-5 sm:h-5" />, label: 'Games', count: stats.games,  accent: '#9060C8', bg: 'rgba(120,60,180,0.08)', border: 'rgba(120,60,180,0.2)' },
          { icon: <CheckCircle2 size={16} className="sm:w-5 sm:h-5" />, label: 'Done', count: stats.completed, accent: '#C89B3C', bg: 'rgba(200,155,60,0.08)', border: 'rgba(200,155,60,0.2)' },
        ].map(({ icon, label, count, accent, bg, border }) => (
          <div key={label} className="p-3 sm:p-4 rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1" style={{ color: accent }}>
              {icon}
              <span className="text-xs sm:text-sm font-medium">{label}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: accent }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Type Filter */}
      <div className="mb-3 sm:mb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 rounded-lg p-1 min-w-max sm:min-w-0" style={{ background: '#1A1A1C', border: '1px solid #2A2A30' }}>
          <button onClick={() => setFilter('all')}    style={filterBtnStyle(filter === 'all')}>All</button>
          <button onClick={() => setFilter('movie')}  style={filterBtnStyle(filter === 'movie',  '#C87050', 'linear-gradient(135deg, #3D1A08 0%, #7A3020 100%)')}><Film size={14} />Movies</button>
          <button onClick={() => setFilter('series')} style={filterBtnStyle(filter === 'series', '#5090C8', 'linear-gradient(135deg, #0F1A2A 0%, #1A3050 100%)')}><Tv size={14} />Series</button>
          <button onClick={() => setFilter('game')}   style={filterBtnStyle(filter === 'game',   '#9060C8', 'linear-gradient(135deg, #1A0D2A 0%, #3A1A50 100%)')}><Gamepad2 size={14} />Games</button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-4 sm:mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 rounded-lg p-1 min-w-max sm:min-w-0" style={{ background: '#1A1A1C', border: '1px solid #2A2A30' }}>
          <button onClick={() => setStatusFilter('all')}          style={filterBtnStyle(statusFilter === 'all')}>All Status</button>
          <button onClick={() => setStatusFilter('not-started')}  style={filterBtnStyle(statusFilter === 'not-started', '#787878', '#222228')}><Clock size={14} />Not Started</button>
          <button onClick={() => setStatusFilter('in-progress')}  style={filterBtnStyle(statusFilter === 'in-progress', '#5090C8', 'linear-gradient(135deg, #0F1A2A 0%, #1A3050 100%)')}><Play size={14} />In Progress</button>
          <button onClick={() => setStatusFilter('done')}         style={filterBtnStyle(statusFilter === 'done', '#C89B3C', 'linear-gradient(135deg, #2A1A08 0%, #5C3A21 100%)')}><CheckCircle2 size={14} />Done</button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredItems.map((item, index) => (
          <ItemCard key={item.id} item={item} index={index} />
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 sm:py-16" style={{ color: '#787878' }}>
            <div className="text-5xl sm:text-6xl mb-4">
              {filter === 'movie' ? '🎬' : filter === 'series' ? '📺' : filter === 'game' ? '🎮' : '🍿'}
            </div>
            <p className="text-base sm:text-lg font-medium">No items found</p>
            <p className="text-xs sm:text-sm mt-2 px-4">
              {filter === 'all' ? 'Start adding movies, series, or games to track!' : `No ${filter}s added yet`}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 sm:px-6 py-2 text-white rounded-lg transition-all text-sm sm:text-base"
              style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.2)' }}
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>

      {showModal && <AddItemModal onClose={() => setShowModal(false)} />}
      {showRandomizer && <RandomizerModal items={items} onClose={() => setShowRandomizer(false)} />}
    </div>
  );
};

export default WatchPlayList;
