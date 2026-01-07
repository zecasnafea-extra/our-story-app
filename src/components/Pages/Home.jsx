import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Gift, LogOut, Heart, Check, Edit2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { useFirestoreUpdate } from '../../hooks/useFirestoreUpdate';
import AddTimelineModal from '../Modals/AddTimelineModal';
import AddWishModal from '../Modals/AddWishModal';

const Home = ({ setActiveTab }) => {
  const { logout, currentUser } = useAuth();
  const { documents: timeline } = useFirestore('timeline');
  const { documents: notes } = useFirestore('notes');
  const { updateDocument, addDocument } = useFirestoreUpdate();
  
  const [daysTogether, setDaysTogether] = useState(0);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  
  // Determine current user (Zeyad or Rania)
  const isZeyad = currentUser?.email?.toLowerCase().includes('zeyad');
  const currentUserName = isZeyad ? 'zeyad' : 'rania';
  const otherUserName = isZeyad ? 'rania' : 'zeyad';
  
  // Notes state
  const [myNote, setMyNote] = useState('');
  const [isEditingMyNote, setIsEditingMyNote] = useState(false);
  const myNoteDoc = notes.find(n => n.user === currentUserName);
  const otherNoteDoc = notes.find(n => n.user === otherUserName);
  
  const startDate = new Date('2025-12-09');

  useEffect(() => {
    const now = new Date();
    const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    setDaysTogether(diff);
  }, []);

  useEffect(() => {
    if (myNoteDoc) {
      setMyNote(myNoteDoc.note || '');
    }
  }, [myNoteDoc]);

  const upcomingEvents = timeline
    .filter(item => new Date(item.date) > new Date() && !item.isCompleted)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  ).slice(0, 8);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveNote = async () => {
    try {
      if (myNoteDoc) {
        await updateDocument('notes', myNoteDoc.id, { 
          note: myNote, 
          updatedAt: new Date() 
        });
      } else {
        await addDocument('notes', { 
          user: currentUserName, 
          note: myNote, 
          updatedAt: new Date() 
        });
      }
      setIsEditingMyNote(false);
    } catch (error) {
      console.error('Error saving note:', error);
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
    <div className="p-4 sm:p-6 pb-24 space-y-4 sm:space-y-6 animate-fade-in">
      {/* User Info & Logout */}
      <div className="flex justify-between items-center">
        <p className="text-xs sm:text-sm text-gray-600 truncate flex-1 mr-2">
          Logged in as <span className="font-medium">{currentUser?.email}</span>
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-red-600 transition-colors flex-shrink-0"
        >
          <LogOut size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Days Counter */}
      <div className="card bg-gradient-to-br from-pink-500 to-purple-600 text-white text-center animate-scale-in">
        <div className="text-5xl sm:text-7xl font-bold mb-2 sm:mb-3">{daysTogether}</div>
        <div className="text-xl sm:text-2xl font-medium opacity-90 mb-1 sm:mb-2">Days Together</div>
        <div className="text-xs sm:text-sm opacity-75">Since December 9, 2025</div>
      </div>

      {/* Horizontal Timeline */}
      {sortedTimeline.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2 text-gray-800">
              <Sparkles className="text-purple-500" size={20} />
              <span>Our Journey</span>
            </h3>
            <button
              onClick={() => setActiveTab('timeline')}
              className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-medium whitespace-nowrap"
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
                    <div className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="text-xs font-medium text-gray-500 mb-2 whitespace-nowrap">
                        {itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      
                      <div className={`relative ${config.dotColor} rounded-full p-2.5 sm:p-3 border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer group`}>
                        <span className="text-xl sm:text-2xl">{getTypeEmoji(item.type)}</span>
                        {item.isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                            <Check size={10} className="text-white sm:w-3 sm:h-3" />
                          </div>
                        )}
                        
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs opacity-75">{item.type}</div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      
                      <div className="text-xs font-medium text-gray-700 mt-2 max-w-[80px] sm:max-w-[100px] text-center line-clamp-2">
                        {item.title}
                      </div>
                    </div>
                    
                    {index < sortedTimeline.length - 1 && (
                      <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-pink-300 to-purple-300 flex-shrink-0 mt-10" />
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
          <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2 text-gray-800">
            <Clock className="text-pink-500" size={20} />
            Coming Up
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {upcomingEvents.map(event => (
              <div 
                key={event.id} 
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="text-2xl sm:text-3xl flex-shrink-0">{getTypeEmoji(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">{event.title}</div>
                  <div className="text-xs sm:text-sm text-pink-600 font-medium">
                    {getDaysUntil(event.date)} days away
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Notes Section */}
      <div className="space-y-3 sm:space-y-4">
        {/* My Note */}
        <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base sm:text-lg text-gray-800 flex items-center gap-2">
              <Heart className="text-pink-500" size={18} />
              {isZeyad ? 'Zeyad' : 'Rania'}'s Note
            </h3>
            {!isEditingMyNote ? (
              <button
                onClick={() => setIsEditingMyNote(true)}
                className="text-pink-600 hover:text-pink-700 p-2 hover:bg-pink-200 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button
                onClick={handleSaveNote}
                className="text-green-600 hover:text-green-700 p-2 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Save size={16} />
              </button>
            )}
          </div>
          
          {isEditingMyNote ? (
            <textarea
              value={myNote}
              onChange={(e) => setMyNote(e.target.value)}
              placeholder="Write a sweet note..."
              className="w-full p-3 rounded-xl border-2 border-pink-300 focus:border-pink-500 focus:outline-none text-sm sm:text-base resize-none"
              rows="3"
            />
          ) : (
            <p className="text-sm sm:text-base text-gray-700 italic">
              {myNote || 'Click edit to add your note ✨'}
            </p>
          )}
        </div>

        {/* Other Person's Note */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-3 flex items-center gap-2">
            <Heart className="text-purple-500" size={18} />
            {isZeyad ? 'Rania' : 'Zeyad'}'s Note
          </h3>
          <p className="text-sm sm:text-base text-gray-700 italic">
            {otherNoteDoc?.note || 'No note yet 💭'}
          </p>
          {otherNoteDoc?.updatedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Updated {new Date(otherNoteDoc.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => setShowTimelineModal(true)}
          className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white text-center cursor-pointer hover:scale-105 transition-transform"
        >
          <Sparkles className="mx-auto mb-2 sm:mb-3" size={32} />
          <div className="font-semibold text-sm sm:text-lg">Add Memory</div>
          <div className="text-xs sm:text-sm opacity-80 mt-1">Capture moment</div>
        </button>
        
        <button
          onClick={() => setShowWishModal(true)}
          className="card bg-gradient-to-br from-pink-500 to-pink-600 text-white text-center cursor-pointer hover:scale-105 transition-transform"
        >
          <Gift className="mx-auto mb-2 sm:mb-3" size={32} />
          <div className="font-semibold text-sm sm:text-lg">Add Wish</div>
          <div className="text-xs sm:text-sm opacity-80 mt-1">Make a wish</div>
        </button>
      </div>

      {/* Modals */}
      {showTimelineModal && <AddTimelineModal onClose={() => setShowTimelineModal(false)} />}
      {showWishModal && <AddWishModal onClose={() => setShowWishModal(false)} />}
    </div>
  );
};

export default Home;
