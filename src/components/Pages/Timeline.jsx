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
    // Calculate days for each counter
    const now = new Date();
    const updatedCounters = dateCounters.map(counter => {
      const targetDate = new Date(counter.date);
      const diffTime = targetDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...counter,
        daysUntil: diffDays,
        isPast: diffDays < 0,
        isToday: diffDays === 0
      };
    });
    setCounters(updatedCounters);
  }, [dateCounters]);

  const toggleComplete = async (id, currentStatus) => {
    try {
      await updateDocument(id, { isCompleted: !currentStatus });
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (type === 'counter') {
          await deleteCounterDoc(id);
        } else {
          await deleteTimelineDoc(id);
        }
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

  const getTypeConfig = (type) => {
    const configs = {
      milestone: { emoji: '🏆', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dotColor: 'bg-yellow-500' },
      event: { emoji: '🎉', color: 'bg-blue-100 text-blue-700 border-blue-300', dotColor: 'bg-blue-500' },
      date: { emoji: '📅', color: 'bg-purple-100 text-purple-700 border-purple-300', dotColor: 'bg-purple-500' }
    };
    return configs[type] || configs.event;
  };

  const getCounterIcon = (icon) => {
    const icons = {
      heart: <Heart className="text-pink-500" size={32} />,
      cake: <Cake className="text-orange-500" size={32} />,
      gift: <GiftIcon className="text-purple-500" size={32} />,
      sparkles: <Sparkles className="text-yellow-500" size={32} />
    };
    return icons[icon] || icons.heart;
  };

  const filteredTimeline = filter === 'all' 
    ? timeline 
    : timeline.filter(item => item.type === filter);

  // Sort by date (oldest to newest for horizontal timeline)
  const sortedTimeline = [...filteredTimeline].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="p-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Our Journey</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCounterModal(true)}
            className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
          >
            <CalIcon size={20} />
            <span className="text-sm font-medium">Add Counter</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Date Counters Section */}
      {counters.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CalIcon className="text-pink-500" size={24} />
            Special Dates
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {counters.map((counter, index) => (
              <div
                key={counter.id}
                className={`card text-center animate-scale-in relative group ${
                  counter.isToday 
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white border-4 border-pink-300 animate-pulse' 
                    : counter.isPast
                    ? 'bg-gray-50 opacity-60'
                    : 'bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <button
                  onClick={() => handleDelete(counter.id, 'counter')}
                  className={`absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                    counter.isToday ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-100 hover:bg-red-200 text-red-600'
                  }`}
                >
                  <Trash2 size={16} />
                </button>
                <div className="mb-2">
                  {getCounterIcon(counter.icon)}
                </div>
                <div className={`text-3xl font-bold mb-1 ${counter.isToday ? 'text-white' : 'text-pink-600'}`}>
                  {counter.isToday ? '🎉' : counter.isPast ? '✓' : Math.abs(counter.daysUntil)}
                </div>
                <div className={`text-sm font-medium mb-1 ${counter.isToday ? 'text-white' : 'text-gray-700'}`}>
                  {counter.isToday ? 'TODAY!' : counter.isPast ? 'Passed' : 'days until'}
                </div>
                <div className={`font-semibold ${counter.isToday ? 'text-white text-lg' : 'text-gray-800'}`}>
                  {counter.title}
                </div>
                <div className={`text-xs mt-1 ${counter.isToday ? 'text-white opacity-90' : 'text-gray-500'}`}>
                  {new Date(counter.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'milestone', 'event', 'date'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              filter === type
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300'
            }`}
          >
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
                  {/* Timeline Item */}
                  <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Date */}
                    <div className="text-xs font-medium text-gray-500 mb-2 whitespace-nowrap">
                      {itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    
                    {/* Dot with Emoji */}
                    <div className={`relative ${config.dotColor} rounded-full p-3 border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer group`}>
                      <span className="text-2xl">{config.emoji}</span>
                      {item.isCompleted && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-xs opacity-75">{item.type}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    
                    {/* Title below */}
                    <div className="text-xs font-medium text-gray-700 mt-2 max-w-[100px] text-center line-clamp-2">
                      {item.title}
                    </div>
                  </div>
                  
                  {/* Connecting Line */}
                  {index < sortedTimeline.length - 1 && (
                    <div className="h-1 w-16 bg-gradient-to-r from-pink-300 to-purple-300 flex-shrink-0 mt-10" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Vertical Timeline with Details */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Timeline Details</h3>
        
        {[...sortedTimeline].reverse().map((item, index) => {
          const config = getTypeConfig(item.type);
          const itemDate = new Date(item.date);

          return (
            <div
              key={item.id}
              className={`card hover:shadow-xl transition-all animate-slide-up group ${
                !item.isCompleted && item.type === 'date' ? 'border-2 border-pink-300' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div className="text-4xl flex-shrink-0">{config.emoji}</div>
                
                {/* Content */}
                <div className="flex-1">
                  {/* Date Badge */}
                  <div className="text-sm text-gray-500 mb-2 font-medium">
                    {itemDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>

                  {/* Title & Status */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xl text-gray-800">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      {item.isCompleted && item.type === 'date' && (
                        <Check size={24} className="text-green-500 flex-shrink-0" />
                      )}
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border mb-3 ${config.color}`}>
                    {item.type}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-700 leading-relaxed mb-3">{item.description}</p>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="tag bg-gray-100 text-gray-600 border border-gray-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {item.type === 'date' && !item.isCompleted && (
                      <button
                        onClick={() => toggleComplete(item.id, item.isCompleted)}
                        className="text-sm px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center gap-1"
                      >
                        <Check size={16} />
                        Mark as completed
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id, 'timeline')}
                      className="text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100"
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
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-lg">No memories yet</p>
            <p className="text-sm mt-2">Start adding your beautiful moments together</p>
          </div>
        )}
      </div>

      {showModal && (
        <AddTimelineModal 
          onClose={handleCloseModal} 
          editItem={editingItem}
        />
      )}
      {showCounterModal && <AddDateCounterModal onClose={() => setShowCounterModal(false)} />}
    </div>
  );
};

export default Timeline;
