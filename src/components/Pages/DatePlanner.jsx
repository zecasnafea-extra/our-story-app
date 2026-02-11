import React, { useState } from 'react';
import { Plus, Check, Trash2, Edit2, DollarSign } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import AddDateModal from '../Modals/AddDateModal';

const DatePlanner = () => {
  const { documents: dateIdeas, updateDocument, deleteDocument } = useFirestore('dateIdeas');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');

  const updateStatus = async (id, status) => {
    try { await updateDocument(id, { status }); }
    catch (error) { console.error('Error updating status:', error); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this date idea?')) {
      try { await deleteDocument(id); }
      catch (error) { console.error('Error deleting:', error); alert('Failed to delete. Please try again.'); }
    }
  };

  const handleEdit = (item) => { setEditingItem(item); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditingItem(null); };

  const categories = [
    { id: 'all',           label: 'All',                emoji: '✨' },
    { id: 'fun-activities', label: 'Fun Activities',     emoji: '🎉' },
    { id: 'home-date',     label: 'Home Date',           emoji: '🏠' },
    { id: 'outdoor',       label: 'Outdoor',             emoji: '🌲' },
    { id: 'dinner-food',   label: 'Dinner / Food',       emoji: '🍽️' },
    { id: 'travel',        label: 'Travel / Exploration', emoji: '✈️' },
    { id: 'special',       label: 'Special / Surprise',  emoji: '🎁' }
  ];

  const getCategoryEmoji = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.emoji : '✨';
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.label : category;
  };

  const filtered = filter === 'all' ? dateIdeas : dateIdeas.filter(d => d.category === filter);

  const getStatusStyle = (status) => ({
    waiting:   { border: '1px solid rgba(200,155,60,0.3)',  background: 'rgba(200,155,60,0.05)'  },
    planned:   { border: '1px solid rgba(143,123,94,0.35)', background: 'rgba(143,123,94,0.08)'  },
    completed: { border: '1px solid rgba(92,58,33,0.3)',    background: 'rgba(92,58,33,0.08)', opacity: 0.75 }
  })[status] || { border: '1px solid rgba(200,155,60,0.3)', background: 'rgba(200,155,60,0.05)' };

  const getStatusEmoji = (status) => ({ waiting: '⏳', planned: '📝', completed: '✅' })[status] || '⏳';
  const getStatusLabel = (status) => ({ waiting: 'Waiting', planned: 'Planned', completed: 'Completed' })[status] || '';
  const getPriceDisplay = (price) => (!price || price === 0) ? null : `${price.toFixed(2)}`;

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
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem'
  });

  return (
    <div className="p-6 animate-fade-in" style={{ background: '#0B0B0C', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-semibold" style={{ color: '#C89B3C' }}>Date Ideas</h2>
          <p className="text-sm mt-1" style={{ color: '#787878' }}>Plan your perfect moments together</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all"
          style={{ background: 'linear-gradient(135deg, #5C3A21 0%, #C89B3C 100%)', boxShadow: '0 4px 15px rgba(200,155,60,0.25)' }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)} style={filterBtnStyle(filter === cat.id)}>
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
            className="card animate-slide-up group"
            style={{ animationDelay: `${index * 50}ms`, ...getStatusStyle(date.status) }}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">{getCategoryEmoji(date.category)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: '#E8E8E8' }}>{date.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"
                        style={{ background: 'rgba(42,42,48,0.8)', border: '1px solid #2A2A30', color: '#A8A8A8' }}>
                        <span>{getStatusEmoji(date.status)}</span>
                        <span>{getStatusLabel(date.status)}</span>
                      </span>
                      {date.estimatedPrice > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.25)', color: '#C89B3C' }}>
                          {getPriceDisplay(date.estimatedPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(date)}
                    className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-colors"
                    style={{ background: 'rgba(200,155,60,0.15)', color: '#C89B3C' }}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="mb-2">
                  <span className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(42,42,48,0.8)', border: '1px solid #2A2A30', color: '#A8A8A8' }}>
                    {getCategoryLabel(date.category)}
                  </span>
                </div>

                {date.notes && (
                  <p className="text-sm mb-3" style={{ color: '#A8A8A8' }}>{date.notes}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {date.status === 'waiting' && (
                    <>
                      <button onClick={() => updateStatus(date.id, 'planned')}
                        className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ background: 'rgba(143,123,94,0.15)', color: '#8F7B5E', border: '1px solid rgba(143,123,94,0.25)' }}>
                        📝 Plan It
                      </button>
                      <button onClick={() => updateStatus(date.id, 'completed')}
                        className="text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-colors"
                        style={{ background: 'rgba(200,155,60,0.1)', color: '#C89B3C', border: '1px solid rgba(200,155,60,0.25)' }}>
                        <Check size={16} /> Done
                      </button>
                    </>
                  )}
                  {date.status === 'planned' && (
                    <>
                      <button onClick={() => updateStatus(date.id, 'completed')}
                        className="text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1 transition-colors"
                        style={{ background: 'rgba(200,155,60,0.1)', color: '#C89B3C', border: '1px solid rgba(200,155,60,0.25)' }}>
                        <Check size={16} /> Done
                      </button>
                      <button onClick={() => updateStatus(date.id, 'waiting')}
                        className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ background: 'rgba(92,58,33,0.15)', color: '#9D7C5A', border: '1px solid rgba(92,58,33,0.25)' }}>
                        ⏳ Move to Waiting
                      </button>
                    </>
                  )}
                  {date.status === 'completed' && (
                    <button onClick={() => updateStatus(date.id, 'waiting')}
                      className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(92,58,33,0.15)', color: '#9D7C5A', border: '1px solid rgba(92,58,33,0.25)' }}>
                      Restore to Waiting
                    </button>
                  )}
                  <button onClick={() => handleDelete(date.id)}
                    className="text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: 'rgba(180,50,50,0.1)', color: '#E05555', border: '1px solid rgba(180,50,50,0.2)' }}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: '#787878' }}>
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg">No date ideas yet</p>
            <p className="text-sm mt-2">Plan something special together</p>
          </div>
        )}
      </div>

      {showModal && <AddDateModal onClose={handleCloseModal} editItem={editingItem} />}
    </div>
  );
};

export default DatePlanner;
