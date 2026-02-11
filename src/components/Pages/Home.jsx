import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, Gift, LogOut, Heart, Check, Edit2, Save, Clapperboard } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { useFirestoreUpdate } from '../../hooks/useFirestoreUpdate';
import AddTimelineModal from '../Modals/AddTimelineModal';
import AddWishModal from '../Modals/AddWishModal';
import AddItemModal from '../Modals/AddItemModal';
import { useSimpleNotifications, NotificationTemplates } from '../../hooks/useSimpleNotifications';

const Home = ({ setActiveTab }) => {
  const { logout, currentUser } = useAuth();
  const { documents: timeline } = useFirestore('timeline');
  const { documents: notes } = useFirestore('notes');
  const { updateDocument, addDocument } = useFirestoreUpdate();
  const { sendNotification } = useSimpleNotifications(currentUser);

  const [daysTogether, setDaysTogether] = useState(0);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  const [showWatchPlayModal, setShowWatchPlayModal] = useState(false);

  const isZeyad = currentUser?.email?.toLowerCase().includes('zeyad');
  const currentUserName = isZeyad ? 'zeyad' : 'rania';
  const otherUserName = isZeyad ? 'rania' : 'zeyad';

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
    if (myNoteDoc) setMyNote(myNoteDoc.note || '');
  }, [myNoteDoc]);

  const upcomingEvents = timeline
    .filter(item => new Date(item.date) > new Date() && !item.isCompleted)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const sortedTimeline = [...timeline].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  ).slice(0, 8);

  const handleLogout = async () => {
    try { await logout(); } catch (error) { console.error('Logout error:', error); }
  };

  const handleSaveNote = async () => {
    try {
      if (myNoteDoc) {
        await updateDocument('notes', myNoteDoc.id, { note: myNote, updatedAt: serverTimestamp() });
      } else {
        await addDocument('notes', { user: currentUserName, note: myNote, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      const userName = isZeyad ? 'Zeyad' : 'Rania';
      const template = NotificationTemplates.noteUpdated(userName);
      await sendNotification(template.title, template.body, template.type);
      setIsEditingMyNote(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const getDaysUntil = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

  const getTypeEmoji = (type) => ({ milestone: '🏆', event: '🎉', date: '📅' })[type] || '✨';

  const getTypeConfig = (type) => ({
    milestone: { dotColor: 'bg-yellow-600' },
    event:     { dotColor: 'bg-yellow-700' },
    date:      { dotColor: 'bg-yellow-800' }
  })[type] || { dotColor: 'bg-yellow-700' };

  return (
    <div className="p-4 sm:p-6 pb-24 space-y-4 sm:space-y-6 animate-fade-in" style={{ background: '#0B0B0C', minHeight: '100vh' }}>

      {/* User Info & Logout */}
      <div className="flex justify-between items-center">
        <p className="text-xs sm:text-sm truncate flex-1 mr-2" style={{ color: '#787878' }}>
          Logged in as <span className="font-medium" style={{ color: '#A8A8A8' }}>{currentUser?.email}</span>
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-colors flex-shrink-0"
          style={{ color: '#787878' }}
          onMouseEnter={e => e.currentTarget.style.color = '#C89B3C'}
          onMouseLeave={e => e.currentTarget.style.color = '#787878'}
        >
          <LogOut size={14} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Days Counter */}
      <div className="card text-center animate-scale-in" style={{
        background: 'linear-gradient(135deg, #2A1A08 0%, #3D2810 50%, #1A1208 100%)',
        border: '1px solid rgba(200,155,60,0.35)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(200,155,60,0.1)'
      }}>
        <div className="text-5xl sm:text-7xl font-bold mb-2 sm:mb-3" style={{ color: '#C89B3C' }}>{daysTogether}</div>
        <div className="text-xl sm:text-2xl font-medium mb-1 sm:mb-2" style={{ color: '#E8E8E8', opacity: 0.9 }}>Days Together</div>
        <div className="text-xs sm:text-sm" style={{ color: '#A8A8A8' }}>Since December 9, 2025</div>
      </div>

      {/* Horizontal Timeline */}
      {sortedTimeline.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2" style={{ color: '#E8E8E8' }}>
              <Sparkles style={{ color: '#C89B3C' }} size={20} />
              <span>Our Journey</span>
            </h3>
            <button
              onClick={() => setActiveTab('timeline')}
              className="text-xs sm:text-sm font-medium whitespace-nowrap"
              style={{ color: '#C89B3C' }}
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
                      <div className="text-xs font-medium mb-2 whitespace-nowrap" style={{ color: '#787878' }}>
                        {itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className={`relative ${config.dotColor} rounded-full p-2.5 sm:p-3 border-4 shadow-lg hover:scale-110 transition-transform cursor-pointer group`}
                        style={{ borderColor: '#2A2A30' }}>
                        <span className="text-xl sm:text-2xl">{getTypeEmoji(item.type)}</span>
                        {item.isCompleted && (
                          <div className="absolute -top-1 -right-1 rounded-full p-1" style={{ background: '#C89B3C' }}>
                            <Check size={10} className="text-white sm:w-3 sm:h-3" />
                          </div>
                        )}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl"
                          style={{ background: '#1A1A1C', border: '1px solid #2A2A30', color: '#E8E8E8' }}>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs" style={{ color: '#787878' }}>{item.type}</div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: '#1A1A1C' }}></div>
                        </div>
                      </div>
                      <div className="text-xs font-medium mt-2 max-w-[80px] sm:max-w-[100px] text-center line-clamp-2" style={{ color: '#A8A8A8' }}>
                        {item.title}
                      </div>
                    </div>
                    {index < sortedTimeline.length - 1 && (
                      <div className="h-1 w-12 sm:w-16 flex-shrink-0 mt-10" style={{ background: 'linear-gradient(to right, #5C3A21, #C89B3C)' }} />
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
          <h3 className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4 flex items-center gap-2" style={{ color: '#E8E8E8' }}>
            <Clock style={{ color: '#C89B3C' }} size={20} />
            Coming Up
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:shadow-md transition-shadow"
                style={{ background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.15)' }}
              >
                <div className="text-2xl sm:text-3xl flex-shrink-0">{getTypeEmoji(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base truncate" style={{ color: '#E8E8E8' }}>{event.title}</div>
                  <div className="text-xs sm:text-sm font-medium" style={{ color: '#C89B3C' }}>
                    {getDaysUntil(event.date)} days away
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Notes Section */}
      <div className="space-y-3 sm:space-y-4 overflow-x-hidden">
        {/* My Note */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1A1A1C 0%, #201810 100%)',
          border: '1px solid rgba(200,155,60,0.25)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2" style={{ color: '#E8E8E8' }}>
              <Heart style={{ color: '#C89B3C' }} size={18} />
              {isZeyad ? 'Zeyad' : 'Rania'}'s Note
            </h3>
            {!isEditingMyNote ? (
              <button
                onClick={() => setIsEditingMyNote(true)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#C89B3C' }}
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <button
                onClick={handleSaveNote}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#8F7B5E' }}
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
              className="w-full p-3 rounded-xl text-sm sm:text-base resize-none focus:outline-none"
              style={{
                background: '#0B0B0C',
                border: '2px solid rgba(200,155,60,0.3)',
                color: '#E8E8E8'
              }}
              rows="3"
            />
          ) : (
            <p className="text-sm sm:text-base italic" style={{ color: '#A8A8A8' }}>
              {myNote || 'Click edit to add your note ✨'}
            </p>
          )}
        </div>

        {/* Other Person's Note */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1A1A1C 0%, #181520 100%)',
          border: '1px solid rgba(143,123,94,0.25)'
        }}>
          <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2" style={{ color: '#E8E8E8' }}>
            <Heart style={{ color: '#8F7B5E' }} size={18} />
            {isZeyad ? 'Rania' : 'Zeyad'}'s Note
          </h3>
          <p className="text-sm sm:text-base italic" style={{ color: '#A8A8A8' }}>
            {otherNoteDoc?.note || 'No note yet 💭'}
          </p>
          {otherNoteDoc?.updatedAt && (
            <p className="text-xs mt-2" style={{ color: '#787878' }}>
              Updated {otherNoteDoc.updatedAt instanceof Date
                ? otherNoteDoc.updatedAt.toLocaleDateString()
                : otherNoteDoc.updatedAt?.toDate?.()?.toLocaleDateString() || 'recently'}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button
          onClick={() => setShowTimelineModal(true)}
          className="card text-center cursor-pointer hover:scale-105 transition-transform p-3 sm:p-6"
          style={{
            background: 'linear-gradient(135deg, #2A1A08 0%, #5C3A21 100%)',
            border: '1px solid rgba(200,155,60,0.3)',
            boxShadow: '0 4px 15px rgba(200,155,60,0.15)'
          }}
        >
          <Sparkles className="mx-auto mb-1 sm:mb-3" size={28} style={{ color: '#C89B3C' }} />
          <div className="font-semibold text-xs sm:text-lg" style={{ color: '#E8E8E8' }}>Memory</div>
          <div className="text-[10px] sm:text-sm mt-0.5 sm:mt-1 hidden sm:block" style={{ color: '#A8A8A8' }}>Capture moment</div>
        </button>

        <button
          onClick={() => setShowWishModal(true)}
          className="card text-center cursor-pointer hover:scale-105 transition-transform p-3 sm:p-6"
          style={{
            background: 'linear-gradient(135deg, #1A1208 0%, #3D2810 100%)',
            border: '1px solid rgba(200,155,60,0.3)',
            boxShadow: '0 4px 15px rgba(200,155,60,0.15)'
          }}
        >
          <Gift className="mx-auto mb-1 sm:mb-3" size={28} style={{ color: '#C89B3C' }} />
          <div className="font-semibold text-xs sm:text-lg" style={{ color: '#E8E8E8' }}>Wish</div>
          <div className="text-[10px] sm:text-sm mt-0.5 sm:mt-1 hidden sm:block" style={{ color: '#A8A8A8' }}>Make a wish</div>
        </button>

        <button
          onClick={() => setShowWatchPlayModal(true)}
          className="card text-center cursor-pointer hover:scale-105 transition-transform p-3 sm:p-6"
          style={{
            background: 'linear-gradient(135deg, #0F1A18 0%, #1A3028 100%)',
            border: '1px solid rgba(143,123,94,0.3)',
            boxShadow: '0 4px 15px rgba(143,123,94,0.1)'
          }}
        >
          <Clapperboard className="mx-auto mb-1 sm:mb-3" size={28} style={{ color: '#8F7B5E' }} />
          <div className="font-semibold text-xs sm:text-lg" style={{ color: '#E8E8E8' }}>Watch</div>
          <div className="text-[10px] sm:text-sm mt-0.5 sm:mt-1 hidden sm:block" style={{ color: '#A8A8A8' }}>Add activity</div>
        </button>
      </div>

      {showTimelineModal && <AddTimelineModal onClose={() => setShowTimelineModal(false)} />}
      {showWishModal && <AddWishModal onClose={() => setShowWishModal(false)} />}
      {showWatchPlayModal && <AddItemModal onClose={() => setShowWatchPlayModal(false)} />}
    </div>
  );
};

export default Home;
