import React, { useState, useEffect } from 'react';
import { Moon, BookOpen, Heart, Flame, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';

const RamadanTracker = () => {
  const { currentUser } = useAuth();
  const { documents: trackers, updateDocument, addDocument } = useFirestore('ramadanTracker');
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  // Determine current user
  const isZeyad = currentUser?.email?.toLowerCase().includes('zeyad');
  const currentUserName = isZeyad ? 'zeyad' : 'rania';
  const partnerName = isZeyad ? 'rania' : 'zeyad';

  // Get today's tracker for both users
  const myTracker = trackers.find(t => t.user === currentUserName && t.date === todayDate);
  const partnerTracker = trackers.find(t => t.user === partnerName && t.date === todayDate);

  // Initialize tracker if doesn't exist
  useEffect(() => {
    if (!myTracker && currentUser) {
      const initialData = {
        user: currentUserName,
        date: todayDate,
        prayers: {
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false
        },
        quran: {
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0
        },
        fasting: false,
        taraweeh: false,
        morningRemembrance: false,
        eveningRemembrance: false,
        createdAt: serverTimestamp()
      };
      addDocument(initialData);
    }
  }, [myTracker, currentUser, currentUserName, todayDate, addDocument]);

  // Calculate stats
  const calculateStats = (tracker) => {
    if (!tracker) return { prayers: 0, quranPages: 0, fasting: false };
    
    const prayersCompleted = Object.values(tracker.prayers || {}).filter(Boolean).length;
    const quranPages = Object.values(tracker.quran || {}).reduce((sum, val) => sum + (val || 0), 0);
    const fasting = tracker.fasting || false;
    
    return { prayers: prayersCompleted, quranPages, fasting };
  };

  const myStats = calculateStats(myTracker);
  const partnerStats = calculateStats(partnerTracker);

  // Toggle handlers (ONLY for current user's tracker)
  const togglePrayer = async (prayer) => {
    if (!myTracker) return;
    
    const newPrayers = {
      ...myTracker.prayers,
      [prayer]: !myTracker.prayers[prayer]
    };
    
    await updateDocument(myTracker.id, { prayers: newPrayers });
  };

  const updateQuran = async (prayer, pages) => {
    if (!myTracker) return;
    
    const newQuran = {
      ...myTracker.quran,
      [prayer]: parseInt(pages) || 0
    };
    
    await updateDocument(myTracker.id, { quran: newQuran });
  };

  const toggleTask = async (taskName) => {
    if (!myTracker) return;
    
    await updateDocument(myTracker.id, {
      [taskName]: !myTracker[taskName]
    });
  };

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerLabels = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha'
  };

  // Calculate combined streak (placeholder - implement streak logic later)
  const totalStreak = 0;

  return (
    <div className="p-4 sm:p-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Moon className="text-purple-500" size={32} />
            🌙 Ramadan Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {myStats.prayers + partnerStats.prayers} prayers completed today
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Prayers Card */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-green-700">Prayers</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{myStats.prayers + partnerStats.prayers}/10</div>
          <div className="text-xs text-green-600 mt-1">completed / total</div>
        </div>

        {/* Quran Pages Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-blue-700">Pages Read</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{myStats.quranPages + partnerStats.quranPages}</div>
          <div className="text-xs text-blue-600 mt-1">total Quran pages</div>
        </div>

        {/* Fasting Card */}
        <div className="card bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-purple-700">Fasting</span>
          </div>
          <div className="text-3xl font-bold text-purple-700">
            {(myStats.fasting ? 1 : 0) + (partnerStats.fasting ? 1 : 0)}/2
          </div>
          <div className="text-xs text-purple-600 mt-1">status</div>
        </div>

        {/* Streak Card */}
        <div className="card bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Flame size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-orange-700">Streak</span>
          </div>
          <div className="text-3xl font-bold text-orange-700">{totalStreak}</div>
          <div className="text-xs text-orange-600 mt-1">consecutive days</div>
        </div>
      </div>

      {/* Dual Tracker Panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* His Tracker (Editable if Zeyad, Read-only if Rania) */}
        <div className="card bg-white border-2 border-blue-200">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 -mx-6 -mt-6 mb-4 p-4 rounded-t-xl">
            <h3 className="font-bold text-xl text-white flex items-center gap-2">
              <Heart size={20} />
              His Tracker
            </h3>
          </div>

          <div className="space-y-2">
            {/* Prayers with Quran */}
            {prayers.map((prayer) => {
              const tracker = isZeyad ? myTracker : partnerTracker;
              const isEditable = isZeyad;
              const isCompleted = tracker?.prayers?.[prayer];
              
              return (
                <div key={prayer}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCompleted
                        ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                        : 'bg-gray-50 border-2 border-gray-200'
                    } ${isEditable ? 'hover:border-blue-400 cursor-pointer' : ''}`}
                    onClick={() => isEditable && togglePrayer(prayer)}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={22} className="text-green-600" />
                      ) : (
                        <Circle size={22} className="text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`flex-1 font-semibold text-sm ${
                        isCompleted ? 'line-through text-green-700' : 'text-gray-800'
                      }`}
                    >
                      {prayerLabels[prayer]}
                    </span>
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={tracker?.quran?.[prayer] || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateQuran(prayer, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-sm text-gray-600 font-medium px-3">
                        {tracker?.quran?.[prayer] || 0} pages
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Other Tasks */}
            {[
              { key: 'fasting', label: 'Fasting' },
              { key: 'taraweeh', label: 'Taraweeh' },
              { key: 'morningRemembrance', label: 'Morning Remembrance' },
              { key: 'eveningRemembrance', label: 'Evening Remembrance' }
            ].map((task) => {
              const tracker = isZeyad ? myTracker : partnerTracker;
              const isEditable = isZeyad;
              const isCompleted = tracker?.[task.key];
              
              return (
                <div
                  key={task.key}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                      : 'bg-gray-50 border-2 border-gray-200'
                  } ${isEditable ? 'hover:border-blue-400 cursor-pointer' : ''}`}
                  onClick={() => isEditable && toggleTask(task.key)}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="text-green-600" />
                    ) : (
                      <Circle size={22} className="text-gray-400" />
                    )}
                  </div>
                  <span
                    className={`flex-1 font-semibold text-sm ${
                      isCompleted ? 'line-through text-green-700' : 'text-gray-800'
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Her Tracker (Editable if Rania, Read-only if Zeyad) */}
        <div className="card bg-white border-2 border-pink-200">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 -mx-6 -mt-6 mb-4 p-4 rounded-t-xl">
            <h3 className="font-bold text-xl text-white flex items-center gap-2">
              <Heart size={20} />
              Her Tracker
            </h3>
          </div>

          <div className="space-y-2">
            {/* Prayers with Quran */}
            {prayers.map((prayer) => {
              const tracker = !isZeyad ? myTracker : partnerTracker;
              const isEditable = !isZeyad;
              const isCompleted = tracker?.prayers?.[prayer];
              
              return (
                <div key={prayer}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCompleted
                        ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                        : 'bg-gray-50 border-2 border-gray-200'
                    } ${isEditable ? 'hover:border-pink-400 cursor-pointer' : ''}`}
                    onClick={() => isEditable && togglePrayer(prayer)}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={22} className="text-green-600" />
                      ) : (
                        <Circle size={22} className="text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`flex-1 font-semibold text-sm ${
                        isCompleted ? 'line-through text-green-700' : 'text-gray-800'
                      }`}
                    >
                      {prayerLabels[prayer]}
                    </span>
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={tracker?.quran?.[prayer] || 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateQuran(prayer, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center font-medium"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-sm text-gray-600 font-medium px-3">
                        {tracker?.quran?.[prayer] || 0} pages
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Other Tasks */}
            {[
              { key: 'fasting', label: 'Fasting' },
              { key: 'taraweeh', label: 'Taraweeh' },
              { key: 'morningRemembrance', label: 'Morning Remembrance' },
              { key: 'eveningRemembrance', label: 'Evening Remembrance' }
            ].map((task) => {
              const tracker = !isZeyad ? myTracker : partnerTracker;
              const isEditable = !isZeyad;
              const isCompleted = tracker?.[task.key];
              
              return (
                <div
                  key={task.key}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                      : 'bg-gray-50 border-2 border-gray-200'
                  } ${isEditable ? 'hover:border-pink-400 cursor-pointer' : ''}`}
                  onClick={() => isEditable && toggleTask(task.key)}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={22} className="text-green-600" />
                    ) : (
                      <Circle size={22} className="text-gray-400" />
                    )}
                  </div>
                  <span
                    className={`flex-1 font-semibold text-sm ${
                      isCompleted ? 'line-through text-green-700' : 'text-gray-800'
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RamadanTracker;
