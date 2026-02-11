import React, { useState, useEffect } from 'react';
import { Plus, Check, Calendar as CalIcon, Heart, Cake, Gift as GiftIcon, Sparkles, Trash2, Edit2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddTimelineModal from '../Modals/AddTimelineModal';
import AddDateCounterModal from '../Modals/AddDateCounterModal';

const Timeline = () => {
  const { documents: timeline, updateDocument, deleteDocument: deleteTimelineDoc } = useFirestore('timeline');
  const { documents: dateCounters, deleteDocument: deleteCounterDoc } = useFirestore('dateCounters');
  const [showModal, setShowModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [counters, setCounters] = useState([]);

  useEffect(() => {
    const now = new Date();
    const updatedCounters = dateCounters.map(counter => {
      const targetDate = new Date(counter.date);
      const diffTime = targetDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...counter, daysUntil: diffDays, isPast: diffDays < 0, isToday: diffDays === 0 };
    });
    setCounters(updatedCounters);
  }, [dateCounters]);

  const toggleComplete = async (id, currentStatus) => {
    try { await updateDocument(id, { isCompleted: !currentStatus }); }
    catch (error) { console.error('Error updating:', error); }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (type === 'counter') await deleteCounterDoc(id);
        else await deleteTimelineDoc(id);
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  const handleEdit = (item) => { setEditingItem(item); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditingItem(null); };

  const getTypeConfig = (type) => ({
    milestone: { emoji: '🏆', color: 'rgba(200,155,60,0.15)', textColor: '#C89B3C', borderColor: 'rgba(200,155,60,0.3)', dotColor: 'bg-yellow-700' },
    event:     { emoji: '🎉', color: 'rgba(143,123,94,0.15)', textColor: '#8F7B5E', borderColor: 'rgba(143,123,94,0.3)', dotColor: 'bg-yellow-800' },
    date:      { emoji: '📅', color: 'rgba(92,58,33,0.2)',   textColor: '#9D7C5A', borderColor: 'rgba(92,58,33,0.35)',  dotColor: 'bg-yellow-900' }
  })[type] || { emoji: '🎉', color: 'rgba(143,123,94,0.15)', textColor: '#8F7B5E', borderColor: 'rgba(143,123,94,0.3)', dotColor: 'bg-yellow-800' };

  const getCounterIcon = (icon) => ({
    heart:    <Heart style={{ color: '#C89B3C' }} size={32} />,
    cake:     <Cake  style={{ color: '#9D7C5A' }} size={32} />,
    gift:     <GiftIcon style={{ color: '#8F7B5E' }} size={32} />,
    sparkles: <Sparkles style={{ color: '#C89B3C' }} size={32} />
  })[icon] || <Heart style={{ color: '#C89B3C' }} size={32} />;

  const filteredTimeline = filter === 'all' ? timeline : timeline.filter(item => item.type === filter);
  const sortedTimeline = [...filteredTimeline].sort((a, b) => new Date(a.date) - new Date(b.date));

  const filterBtnStyle = (active) => ({
    background: active ? 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)' : 'transparent',
    color: active ? '#fff' : '#A8A8A8',
    border: active ? 'none' : '1px solid #2A2A30',
    boxShadow: active ? '0 2px 10px rgba(200,155,60,0.3)' : 'none',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  });

  return (
    <div className="p-6 animate-fade-in pb-24" style={{ background: '#0B0B0C', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold" style={{ color: '#C89B3C' }}>Our Journey</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCounterModal(true)}
            className="text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #9D7C5A 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.2)' }}
          >
            <CalIcon size={20} />
            <span className="text-sm font-medium">Add Counter</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all"
            style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.25)' }}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Date Counters */}
      {counters.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: '#E8E8E8' }}>
            <CalIcon style={{ color: '#C89B3C' }} size={24} />
            Special Dates
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {counters.map((counter, index) => (
              <div
                key={counter.id}
                className="card text-center animate-scale-in relative group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  background: counter.isToday
                    ? 'linear-gradient(135deg, #2A1A08 0%, #5C3A21 100%)'
                    : counter.isPast
                    ? 'rgba(42,42,48,0.5)'
                    : 'linear-gradient(135deg, #1A1A1C 0%, #201808 100%)',
                  border: counter.isToday
                    ? '2px solid rgba(200,155,60,0.6)'
                    : '1px solid rgba(200,155,60,0.2)',
                  opacity: counter.isPast ? 0.6 : 1,
                  boxShadow: counter.isToday ? '0 0 20px rgba(200,155,60,0.2)' : undefined
                }}
              >
                <button
                  onClick={() => handleDelete(counter.id, 'counter')}
                  className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: 'rgba(200,155,60,0.15)', color: '#C89B3C' }}
                >
                  <Trash2 size={16} />
                </button>
                <div className="mb-2">{getCounterIcon(counter.icon)}</div>
                <div className="text-3xl font-bold mb-1" style={{ color: '#C89B3C' }}>
                  {counter.isToday ? '🎉' : counter.isPast ? '✓' : Math.abs(counter.daysUntil)}
                </div>
                <div className="text-sm font-medium mb-1" style={{ color: '#A8A8A8' }}>
                  {counter.isToday ? 'TODAY!' : counter.isPast ? 'Passed' : 'days until'}
                </div>
                <div className="font-semibold" style={{ color: '#E8E8E8' }}>{counter.title}</div>
                <div className="text-xs mt-1" style={{ color: '#787878' }}>
                  {new Date(counter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'milestone', 'event', 'date'].map(type => (
          <button key={type} onClick={() => setFilter(type)} style={filterBtnStyle(filter === type)}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Horizontal Timeline */}
      {sortedTimeline.length > 0 && (
        <div className="mb-8 overflow-x-auto pb-4">
          <div className="inline-flex items-center min-w-full">
            {sortedTimeline.map((item, index) => {
              const config = getTypeConfig(item.type);
              const itemDate = new Date(item.date);
              return (
                <React.Fragment key={item.id}>
                  <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="text-xs font-medium mb-2 whitespace-nowrap" style={{ color: '#787878' }}>
                      {itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className={`relative ${config.dotColor} rounded-full p-3 border-4 shadow-lg hover:scale-110 transition-transform cursor-pointer group`}
                      style={{ borderColor: '#2A2A30' }}>
                      <span className="text-2xl">{config.emoji}</span>
                      {item.isCompleted && (
                        <div className="absolute -top-1 -right-1 rounded-full p-1" style={{ background: '#C89B3C' }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl"
                        style={{ background: '#1A1A1C', border: '1px solid #2A2A30', color: '#E8E8E8' }}>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-xs" style={{ color: '#787878' }}>{item.type}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#1A1A1C' }}></div>
                      </div>
                    </div>
                    <div className="text-xs font-medium mt-2 max-w-[100px] text-center line-clamp-2" style={{ color: '#A8A8A8' }}>
                      {item.title}
                    </div>
                  </div>
                  {index < sortedTimeline.length - 1 && (
                    <div className="h-1 w-16 flex-shrink-0 mt-10" style={{ background: 'linear-gradient(to right, #5C3A21, #C89B3C)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Vertical Timeline Details */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4" style={{ color: '#E8E8E8' }}>Timeline Details</h3>
        {[...sortedTimeline].reverse().map((item, index) => {
          const config = getTypeConfig(item.type);
          const itemDate = new Date(item.date);
          return (
            <div
              key={item.id}
              className="card hover:shadow-xl transition-all animate-slide-up group"
              style={{
                animationDelay: `${index * 50}ms`,
                border: !item.isCompleted && item.type === 'date' ? '1px solid rgba(200,155,60,0.4)' : '1px solid #2A2A30'
              }}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0">{config.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm mb-2 font-medium" style={{ color: '#787878' }}>
                    {itemDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xl" style={{ color: '#E8E8E8' }}>{item.title}</h3>
                    <div className="flex items-center gap-2">
                      {item.isCompleted && item.type === 'date' && (
                        <Check size={24} style={{ color: '#C89B3C' }} className="flex-shrink-0" />
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-colors"
                        style={{ background: 'rgba(200,155,60,0.15)', color: '#C89B3C' }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border mb-3"
                    style={{ background: config.color, color: config.textColor, borderColor: config.borderColor }}>
                    {item.type}
                  </div>
                  {item.description && (
                    <p className="leading-relaxed mb-3" style={{ color: '#A8A8A8' }}>{item.description}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {item.type === 'date' && !item.isCompleted && (
                      <button
                        onClick={() => toggleComplete(item.id, item.isCompleted)}
                        className="text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-colors"
                        style={{ background: 'rgba(200,155,60,0.1)', color: '#C89B3C', border: '1px solid rgba(200,155,60,0.25)' }}
                      >
                        <Check size={16} />
                        Mark as completed
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id, 'timeline')}
                      className="text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'rgba(180,50,50,0.1)', color: '#E05555', border: '1px solid rgba(180,50,50,0.2)' }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sortedTimeline.length === 0 && (
          <div className="text-center py-16" style={{ color: '#787878' }}>
            <div className="text-6xl mb-4">✨</div>
            <p className="text-lg">No memories yet</p>
            <p className="text-sm mt-2">Start adding your beautiful moments together</p>
          </div>
        )}
      </div>

      {showModal && <AddTimelineModal onClose={handleCloseModal} editItem={editingItem} />}
      {showCounterModal && <AddDateCounterModal onClose={() => setShowCounterModal(false)} />}
    </div>
  );
};

export default Timeline;
