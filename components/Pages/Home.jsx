import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Gift, LogOut, Calendar, Heart, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import AddTimelineModal from '../Modals/AddTimelineModal';
import AddWishModal from '../Modals/AddWishModal';

const Home = ({ setActiveTab }) => {
  const { logout, currentUser } = useAuth();
  const { documents: timeline } = useFirestore('timeline');
  const [daysTogether, setDaysTogether] = useState(0);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  
  const startDate = new Date('2025-12-09');

  useEffect(() => {
    const now = new Date();
    const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    setDaysTogether(diff);
  }, []);

  const upcomingEvents = timeline
    .filter(item => new Date(item.date) > new Date() && !item.isCompleted)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // Sort timeline for horizontal view (oldest to newest)
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  ).slice(0, 8); // Show only first 8 items on home

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getDaysUntil = (date) => {
    return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getTypeEmoji = (type) => {
    const emojis = {
      milestone: '🏆',
      event: '🎉',
      date: '📅'
    };
    return emojis[type] || '✨';
  };

  const getTypeConfig = (type) => {
    const configs = {
      milestone: { dotColor: 'bg-yellow-500' },
      event: { dotColor: 'bg-blue-500' },
      date: { dotColor: 'bg-purple-500' }
    };
    return configs[type] || configs.event;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* User Info & Logout */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Logged in as <span className="font-medium">{currentUser?.email}</span>
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Days Counter */}
      <div className="card bg-gradient-to-br from-pink-500 to-purple-600 text-white text-center animate-scale-in">
        <div className="text-7xl font-bold mb-3">{daysTogether}</div>
        <div className="text-2xl font-medium opacity-90 mb-2">Days Together</div>
        <div className="text-sm opacity-75">Since December 9, 2025</div>
      </div>

      {/* Horizontal Timeline */}
      {sortedTimeline.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
              <Sparkles className="text-purple-500" size={24} />
              Our Journey
            </h3>
            <button
              onClick={() => setActiveTab('timeline')}
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              View All →
            </button>
          </div>
          
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
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
                        {itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      
                      {/* Dot with Emoji */}
                      <div className={`relative ${config.dotColor} rounded-full p-3 border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer group`}>
                        <span className="text-2xl">{getTypeEmoji(item.type)}</span>
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
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="card animate-slide-up">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800">
            <Clock className="text-pink-500" size={24} />
            Coming Up
          </h3>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div 
                key={event.id} 
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="text-3xl">{getTypeEmoji(event.type)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{event.title}</div>
                  <div className="text-sm text-pink-600 font-medium">
                    {getDaysUntil(event.date)} days away
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowTimelineModal(true)}
          className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white text-center cursor-pointer hover:scale-105 transition-transform"
        >
          <Sparkles className="mx-auto mb-3" size={40} />
          <div className="font-semibold text-lg">Add Memory</div>
          <div className="text-sm opacity-80 mt-1">Capture this moment</div>
        </button>
        
        <button
          onClick={() => setShowWishModal(true)}
          className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white text-center cursor-pointer hover:scale-105 transition-transform"
        >
          <Gift className="mx-auto mb-3" size={40} />
          <div className="font-semibold text-lg">Add Wish</div>
          <div className="text-sm opacity-80 mt-1">Make a wish together</div>
        </button>
      </div>

      {/* Love Quote */}
      <div className="card bg-gradient-to-r from-pink-50 to-purple-50 text-center border-2 border-pink-200">
        <p className="text-lg italic text-gray-700">
          "Every moment with you is a memory worth keeping"
        </p>
        <p className="text-sm text-pink-600 mt-2">❤️</p>
      </div>

      {/* Modals */}
      {showTimelineModal && <AddTimelineModal onClose={() => setShowTimelineModal(false)} />}
      {showWishModal && <AddWishModal onClose={() => setShowWishModal(false)} />}
    </div>
  );
};

export default Home;