import React, { useState, useEffect } from 'react';
import { Moon, BookOpen, Heart, Flame, CheckCircle2, Circle, Info, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';

const RamadanTracker = () => {
  const { currentUser } = useAuth();
  const { documents: trackers, updateDocument, addDocument } = useFirestore('ramadanTracker');
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('ramadan-theme');
    return saved ? JSON.parse(saved) : true; // Default to Ramadan Mode (dark)
  });

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('ramadan-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

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
        debtPages: 0,
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

  const updateDebtPages = async (pages) => {
    if (!myTracker) return;
    await updateDocument(myTracker.id, {
      debtPages: parseInt(pages) || 0
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
  const totalStreak = 12;

  // Theme classes
  const theme = {
    bg: isDarkMode ? 'bg-[#0B0B0C]' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gradient-to-br from-[#1A1A1C] to-[#222228]' : 'bg-white',
    border: isDarkMode ? 'border-[#2A2A30]' : 'border-gray-200',
    text: {
      primary: isDarkMode ? 'text-[#E8E8E8]' : 'text-gray-800',
      secondary: isDarkMode ? 'text-[#A8A8A8]' : 'text-gray-600',
      tertiary: isDarkMode ? 'text-[#787878]' : 'text-gray-500',
    },
    accent: isDarkMode ? '#C89B3C' : '#10b981',
    accentLight: isDarkMode ? '#8F7B5E' : '#34d399',
    completed: isDarkMode 
      ? 'bg-gradient-to-r from-[#5C3A21]/20 to-[#C89B3C]/20 border-[#C89B3C]/40 shadow-lg shadow-[#C89B3C]/20'
      : 'bg-green-50 border-green-300 shadow-sm',
    uncompleted: isDarkMode 
      ? 'bg-[#1A1A1C] border-[#2A2A30]'
      : 'bg-gray-50 border-gray-200',
    input: isDarkMode
      ? 'bg-[#0B0B0C] border-[#2A2A30] text-[#E8E8E8] focus:ring-[#C89B3C] focus:border-[#C89B3C]'
      : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500 focus:border-blue-500',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      <div className="p-4 sm:p-6 pb-24 space-y-6 animate-fade-in">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-semibold ${theme.text.primary} flex items-center gap-2`}>
              <Moon className={isDarkMode ? 'text-[#C89B3C]' : 'text-purple-500'} size={32} />
              🌙 Ramadan Tracker
            </h2>
            <p className={`text-sm ${theme.text.secondary} mt-1`}>
              {myStats.prayers + partnerStats.prayers} prayers completed today
            </p>
          </div>

          {/* Theme Toggle */}
          <div className={`flex items-center gap-2 ${isDarkMode ? 'bg-[#1A1A1C]' : 'bg-white'} rounded-full p-1 border ${theme.border} shadow-lg`}>
            <button 
              onClick={() => setIsDarkMode(false)}
              className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                !isDarkMode 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                  : `${theme.text.tertiary} hover:${theme.text.secondary}`
              }`}
            >
              <Sun size={16} />
              Love Mode
            </button>
            <button 
              onClick={() => setIsDarkMode(true)}
              className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-[#5C3A21] to-[#C89B3C] text-white shadow-lg shadow-[#C89B3C]/30' 
                  : `${theme.text.tertiary} hover:${theme.text.secondary}`
              }`}
            >
              <Moon size={16} />
              Ramadan Mode
            </button>
          </div>
        </div>

        {/* Quran Goal Info Card */}
        <div className={`${theme.cardBg} border-2 ${isDarkMode ? 'border-[#C89B3C]/20' : 'border-teal-200'} rounded-xl p-4 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/10' : 'shadow'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-[#C89B3C] to-[#8F7B5E]' : 'bg-teal-500'} flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/30' : ''}`}>
              <Info size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${isDarkMode ? 'text-[#C89B3C]' : 'text-teal-800'} mb-1`}>Daily Quran Goal</h3>
              <p className={`text-sm ${theme.text.primary}`}>
                <strong>8 pages</strong> after each prayer = <strong>40 pages per day</strong>
              </p>
              <p className={`text-xs ${theme.text.secondary} mt-1`}>
                Complete one Juz (20 pages) every 12 hours to finish the Quran in Ramadan 🌙
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Prayers Card */}
          <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-4 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/10' : 'shadow'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-[#C89B3C] to-[#8F7B5E]' : 'bg-green-500'} flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/30' : ''}`}>
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#C89B3C]' : 'text-green-700'}`}>Prayers</span>
            </div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-[#C89B3C]' : 'text-green-700'}`}>
              {myStats.prayers + partnerStats.prayers}/10
            </div>
            <div className={`text-xs ${theme.text.secondary} mt-1`}>completed / total</div>
          </div>

          {/* Quran Pages Card */}
          <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-4 ${isDarkMode ? 'shadow-lg shadow-[#8F7B5E]/10' : 'shadow'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-[#8F7B5E] to-[#6B5D3F]' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'shadow-lg shadow-[#8F7B5E]/30' : ''}`}>
                <BookOpen size={18} className="text-white" />
              </div>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#8F7B5E]' : 'text-blue-700'}`}>Pages Read</span>
            </div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-[#8F7B5E]' : 'text-blue-700'}`}>
              {myStats.quranPages + partnerStats.quranPages}
            </div>
            <div className={`text-xs ${theme.text.secondary} mt-1`}>total Quran pages</div>
          </div>

          {/* Fasting Card */}
          <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-4 ${isDarkMode ? 'shadow-lg shadow-[#9D7C5A]/10' : 'shadow'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-[#9D7C5A] to-[#6B5D3F]' : 'bg-purple-500'} flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'shadow-lg shadow-[#9D7C5A]/30' : ''}`}>
                <Heart size={18} className="text-white" />
              </div>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#9D7C5A]' : 'text-purple-700'}`}>Fasting</span>
            </div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-[#9D7C5A]' : 'text-purple-700'}`}>
              {(myStats.fasting ? 1 : 0) + (partnerStats.fasting ? 1 : 0)}/2
            </div>
            <div className={`text-xs ${theme.text.secondary} mt-1`}>status</div>
          </div>

          {/* Streak Card */}
          <div className={`${theme.cardBg} border ${theme.border} rounded-xl p-4 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/10' : 'shadow'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gradient-to-br from-[#C89B3C] to-[#D4A953]' : 'bg-orange-500'} flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/30' : ''}`}>
                <Flame size={18} className="text-white" />
              </div>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#C89B3C]' : 'text-orange-700'}`}>Streak</span>
            </div>
            <div className={`text-3xl font-bold ${isDarkMode ? 'text-[#C89B3C]' : 'text-orange-700'}`}>{totalStreak}</div>
            <div className={`text-xs ${theme.text.secondary} mt-1`}>consecutive days</div>
          </div>
        </div>

        {/* Dual Tracker Panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* His Tracker */}
          <div className={`${theme.cardBg} border-2 ${isDarkMode ? 'border-[#2A2A30]' : 'border-blue-200'} rounded-xl overflow-hidden ${isDarkMode ? 'shadow-xl' : 'shadow'}`}>
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-[#5C3A21] to-[#8F7B5E]' : 'bg-gradient-to-r from-blue-500 to-cyan-500'} p-4 ${isDarkMode ? 'shadow-lg shadow-[#5C3A21]/20' : ''}`}>
              <h3 className="font-semibold text-xl text-white flex items-center gap-2">
                <Heart size={20} />
                His Tracker
              </h3>
            </div>

            <div className="p-6 space-y-2">
              {/* Debt Tracker */}
              {(isZeyad ? myTracker : partnerTracker)?.debtPages > 0 && (
                <div className={`${isDarkMode ? 'bg-gradient-to-br from-[#4A2C1F]/30 to-[#5C3A21]/30 border-[#C89B3C]/30' : 'bg-red-50 border-red-300'} border-2 rounded-lg p-3 mb-3 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/10' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={18} className={isDarkMode ? 'text-[#C89B3C]' : 'text-red-600'} />
                    <span className={`font-semibold text-sm ${theme.text.primary}`}>Pages Debt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-[#C89B3C]' : 'text-red-700'}`}>
                      {(isZeyad ? myTracker : partnerTracker)?.debtPages || 0}
                    </span>
                    <span className={`text-xs ${theme.text.secondary}`}>pages to catch up</span>
                    {isZeyad && (
                      <input
                        type="number"
                        min="0"
                        value={(isZeyad ? myTracker : partnerTracker)?.debtPages || 0}
                        onChange={(e) => updateDebtPages(e.target.value)}
                        className={`ml-auto w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 shadow-inner ${theme.input}`}
                        placeholder="0"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Prayers */}
              {prayers.map((prayer) => {
                const tracker = isZeyad ? myTracker : partnerTracker;
                const isEditable = isZeyad;
                const isCompleted = tracker?.prayers?.[prayer];
                
                return (
                  <div key={prayer}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                        isCompleted ? theme.completed : theme.uncompleted
                      } ${isEditable ? (isDarkMode ? 'hover:border-[#C89B3C]/60' : 'hover:border-blue-400') + ' cursor-pointer' : ''}`}
                      onClick={() => isEditable && togglePrayer(prayer)}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 size={22} className={isDarkMode ? 'text-[#C89B3C]' : 'text-green-600'} />
                        ) : (
                          <Circle size={22} className={theme.text.tertiary} />
                        )}
                      </div>
                      <span
                        className={`flex-1 font-medium text-sm ${
                          isCompleted 
                            ? `line-through ${isDarkMode ? 'text-[#C89B3C] opacity-75' : 'text-green-700'}` 
                            : theme.text.primary
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
                          className={`w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 text-center font-medium shadow-inner ${theme.input}`}
                          placeholder="0"
                        />
                      ) : (
                        <span className={`text-sm ${theme.text.secondary} font-medium px-3`}>
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
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                      isCompleted ? theme.completed : theme.uncompleted
                    } ${isEditable ? (isDarkMode ? 'hover:border-[#C89B3C]/60' : 'hover:border-blue-400') + ' cursor-pointer' : ''}`}
                    onClick={() => isEditable && toggleTask(task.key)}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={22} className={isDarkMode ? 'text-[#C89B3C]' : 'text-green-600'} />
                      ) : (
                        <Circle size={22} className={theme.text.tertiary} />
                      )}
                    </div>
                    <span
                      className={`flex-1 font-medium text-sm ${
                        isCompleted 
                          ? `line-through ${isDarkMode ? 'text-[#C89B3C] opacity-75' : 'text-green-700'}` 
                          : theme.text.primary
                      }`}
                    >
                      {task.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Her Tracker */}
          <div className={`${theme.cardBg} border-2 ${isDarkMode ? 'border-[#2A2A30]' : 'border-pink-200'} rounded-xl overflow-hidden ${isDarkMode ? 'shadow-xl' : 'shadow'}`}>
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-[#6B5D3F] to-[#9D7C5A]' : 'bg-gradient-to-r from-pink-500 to-purple-500'} p-4 ${isDarkMode ? 'shadow-lg shadow-[#6B5D3F]/20' : ''}`}>
              <h3 className="font-semibold text-xl text-white flex items-center gap-2">
                <Heart size={20} />
                Her Tracker
              </h3>
            </div>

            <div className="p-6 space-y-2">
              {/* Debt Tracker */}
              {(!isZeyad ? myTracker : partnerTracker)?.debtPages > 0 && (
                <div className={`${isDarkMode ? 'bg-gradient-to-br from-[#4A2C1F]/30 to-[#5C3A21]/30 border-[#C89B3C]/30' : 'bg-red-50 border-red-300'} border-2 rounded-lg p-3 mb-3 ${isDarkMode ? 'shadow-lg shadow-[#C89B3C]/10' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={18} className={isDarkMode ? 'text-[#C89B3C]' : 'text-red-600'} />
                    <span className={`font-semibold text-sm ${theme.text.primary}`}>Pages Debt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-[#C89B3C]' : 'text-red-700'}`}>
                      {(!isZeyad ? myTracker : partnerTracker)?.debtPages || 0}
                    </span>
                    <span className={`text-xs ${theme.text.secondary}`}>pages to catch up</span>
                    {!isZeyad && (
                      <input
                        type="number"
                        min="0"
                        value={(!isZeyad ? myTracker : partnerTracker)?.debtPages || 0}
                        onChange={(e) => updateDebtPages(e.target.value)}
                        className={`ml-auto w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 shadow-inner ${theme.input}`}
                        placeholder="0"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Prayers */}
              {prayers.map((prayer) => {
                const tracker = !isZeyad ? myTracker : partnerTracker;
                const isEditable = !isZeyad;
                const isCompleted = tracker?.prayers?.[prayer];
                
                return (
                  <div key={prayer}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                        isCompleted ? theme.completed : theme.uncompleted
                      } ${isEditable ? (isDarkMode ? 'hover:border-[#9D7C5A]/60' : 'hover:border-pink-400') + ' cursor-pointer' : ''}`}
                      onClick={() => isEditable && togglePrayer(prayer)}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 size={22} className={isDarkMode ? 'text-[#C89B3C]' : 'text-green-600'} />
                        ) : (
                          <Circle size={22} className={theme.text.tertiary} />
                        )}
                      </div>
                      <span
                        className={`flex-1 font-medium text-sm ${
                          isCompleted 
                            ? `line-through ${isDarkMode ? 'text-[#C89B3C] opacity-75' : 'text-green-700'}` 
                            : theme.text.primary
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
                          className={`w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 text-center font-medium shadow-inner ${theme.input}`}
                          placeholder="0"
                        />
                      ) : (
                        <span className={`text-sm ${theme.text.secondary} font-medium px-3`}>
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
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                      isCompleted ? theme.completed : theme.uncompleted
                    } ${isEditable ? (isDarkMode ? 'hover:border-[#9D7C5A]/60' : 'hover:border-pink-400') + ' cursor-pointer' : ''}`}
                    onClick={() => isEditable && toggleTask(task.key)}
                  >
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={22} className={isDarkMode ? 'text-[#C89B3C]' : 'text-green-600'} />
                      ) : (
                        <Circle size={22} className={theme.text.tertiary} />
                      )}
                    </div>
                    <span
                      className={`flex-1 font-medium text-sm ${
                        isCompleted 
                          ? `line-through ${isDarkMode ? 'text-[#C89B3C] opacity-75' : 'text-green-700'}` 
                          : theme.text.primary
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
    </div>
  );
};

export default RamadanTracker;
