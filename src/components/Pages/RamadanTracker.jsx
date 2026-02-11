import React, { useState, useEffect } from 'react';
import { Moon, BookOpen, Heart, Flame, CheckCircle2, Circle, Info, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';

const RamadanTracker = () => {
  const { currentUser } = useAuth();
  const { documents: trackers, updateDocument, addDocument } = useFirestore('ramadanTracker');
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  const isZeyad = currentUser?.email?.toLowerCase().includes('zeyad');
  const currentUserName = isZeyad ? 'zeyad' : 'rania';
  const partnerName = isZeyad ? 'rania' : 'zeyad';

  const myTracker = trackers.find(t => t.user === currentUserName && t.date === todayDate);
  const partnerTracker = trackers.find(t => t.user === partnerName && t.date === todayDate);

  // Calculate Ramadan day number (starting from 19/2/2026)
  const ramadanStartDate = new Date('2026-02-19');
  const today = new Date(todayDate);
  const daysDiff = Math.floor((today - ramadanStartDate) / (1000 * 60 * 60 * 24)) + 1;
  const ramadanDay = daysDiff > 0 && daysDiff <= 30 ? daysDiff : null;

  useEffect(() => {
    if (!myTracker && currentUser) {
      addDocument({
        user: currentUserName,
        date: todayDate,
        prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        quran: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
        fasting: false,
        nightPrayer: false,
        morningRemembrance: false,
        eveningRemembrance: false,
        debtPages: 0,
        // Period tracking (for Rania only)
        onPeriod: false,
        periodStartDate: null,
        periodEndDate: null,
        createdAt: serverTimestamp()
      });
    }
  }, [myTracker, currentUser, currentUserName, todayDate, addDocument]);

  // Calculate missed fasting days during period
  const calculateMissedFasting = (tracker) => {
    if (!tracker?.onPeriod || !tracker?.periodStartDate || !tracker?.periodEndDate) return 0;
    
    const start = new Date(tracker.periodStartDate);
    const end = new Date(tracker.periodEndDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const calculateStats = (tracker) => {
    if (!tracker) return { prayers: 0, quranPages: 0, fasting: false };
    return {
      prayers:    Object.values(tracker.prayers || {}).filter(Boolean).length,
      quranPages: Object.values(tracker.quran || {}).reduce((sum, val) => sum + (val || 0), 0),
      fasting:    tracker.fasting || false
    };
  };

  const myStats = calculateStats(myTracker);
  const partnerStats = calculateStats(partnerTracker);

  const togglePrayer = async (prayer, tracker, isEditable) => {
    if (!tracker || !isEditable) return;
    
    // Check if this is Rania's tracker and she's on period
    const trackerUser = tracker.user;
    if (trackerUser === 'rania' && tracker.onPeriod) {
      // Don't allow prayer toggle during period
      return;
    }
    
    await updateDocument(tracker.id, { prayers: { ...tracker.prayers, [prayer]: !tracker.prayers[prayer] } });
  };

  const updateQuran = async (prayer, pages, tracker) => {
    if (!tracker) return;
    await updateDocument(tracker.id, { quran: { ...tracker.quran, [prayer]: parseInt(pages) || 0 } });
  };

  const toggleTask = async (taskName, tracker, isEditable) => {
    if (!tracker || !isEditable) return;
    
    // Check if this is Rania's tracker and she's on period
    const trackerUser = tracker.user;
    if (trackerUser === 'rania' && tracker.onPeriod) {
      // Only block fasting and night prayer during period
      if (taskName === 'fasting' || taskName === 'nightPrayer') {
        return;
      }
    }
    
    await updateDocument(tracker.id, { [taskName]: !tracker[taskName] });
  };

  const updateDebtPages = async (pages, tracker) => {
    if (!tracker) return;
    await updateDocument(tracker.id, { debtPages: parseInt(pages) || 0 });
  };

  const togglePeriod = async (tracker) => {
    if (!tracker) return;
    const newPeriodState = !tracker.onPeriod;
    
    await updateDocument(tracker.id, { 
      onPeriod: newPeriodState,
      periodStartDate: newPeriodState ? todayDate : tracker.periodStartDate,
      periodEndDate: newPeriodState ? null : todayDate,
      fasting: false, // Disable fasting when toggling period
      nightPrayer: false // Disable night prayer when toggling period
    });
  };

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerLabels = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

  const completedRow = 'bg-gradient-to-r from-[#5C3A21]/20 to-[#C89B3C]/20 border-[#C89B3C]/40 shadow-lg shadow-[#C89B3C]/20';
  const uncompletedRow = 'bg-[#1A1A1C] border-[#2A2A30]';
  const inputStyle = 'bg-[#0B0B0C] border-[#2A2A30] text-[#E8E8E8] focus:ring-[#C89B3C] focus:border-[#C89B3C]';

  return (
    <div className="min-h-screen" style={{ background: '#0B0B0C' }}>
      <div className="p-4 sm:p-6 pb-24 space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2" style={{ color: '#E8E8E8' }}>
            <Moon style={{ color: '#C89B3C' }} size={32} />
            🌙 Ramadan Tracker
          </h2>
          <p className="text-sm mt-1" style={{ color: '#A8A8A8' }}>
            {ramadanDay ? `Day ${ramadanDay} of 30 • ` : ''}
            {myStats.prayers + partnerStats.prayers} prayers completed today
          </p>
        </div>

        {/* Quran Goal Info Card */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)',
          border: '1px solid rgba(200,155,60,0.2)',
          boxShadow: '0 4px 20px rgba(200,155,60,0.08)'
        }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C89B3C, #8F7B5E)', boxShadow: '0 4px 12px rgba(200,155,60,0.3)' }}>
              <Info size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: '#C89B3C' }}>Daily Quran Goal</h3>
              <p className="text-sm" style={{ color: '#E8E8E8' }}>
                <strong>8 pages</strong> after each prayer = <strong>40 pages per day</strong>
              </p>
              <p className="text-xs mt-1" style={{ color: '#A8A8A8' }}>
                Complete one Juz (20 pages) every 12 hours to finish the Quran in Ramadan 🌙
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <CheckCircle2 size={18} className="text-white" />, label: 'Prayers',      value: `${myStats.prayers + partnerStats.prayers}/10`, sub: 'completed / total',   accent: '#C89B3C', shadow: '#C89B3C' },
            { icon: <BookOpen size={18} className="text-white" />,     label: 'Pages Read',   value: myStats.quranPages + partnerStats.quranPages, sub: 'total Quran pages',  accent: '#8F7B5E', shadow: '#8F7B5E' },
            { icon: <Heart size={18} className="text-white" />,        label: 'Fasting',      value: `${(myStats.fasting ? 1 : 0) + (partnerStats.fasting ? 1 : 0)}/2`, sub: 'status', accent: '#9D7C5A', shadow: '#9D7C5A' },
            { icon: <Calendar size={18} className="text-white" />,     label: 'Day',          value: ramadanDay || '-', sub: 'of Ramadan',     accent: '#C89B3C', shadow: '#C89B3C' },
          ].map(({ icon, label, value, sub, accent, shadow }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)', border: '1px solid #2A2A30', boxShadow: `0 4px 15px rgba(0,0,0,0.3)` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, #5C3A21, ${accent})`, boxShadow: `0 4px 10px rgba(${accent === '#C89B3C' ? '200,155,60' : '143,123,94'},0.25)` }}>
                  {icon}
                </div>
                <span className="text-xs font-semibold" style={{ color: accent }}>{label}</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: '#A8A8A8' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Dual Tracker Panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* His Tracker & Her Tracker */}
          {[
            { title: 'His Tracker',  isEditable: isZeyad,  tracker: isZeyad ? myTracker : partnerTracker,  headerGrad: 'from-[#5C3A21] to-[#8F7B5E]', showPeriod: false },
            { title: 'Her Tracker',  isEditable: !isZeyad, tracker: !isZeyad ? myTracker : partnerTracker, headerGrad: 'from-[#6B5D3F] to-[#9D7C5A]', showPeriod: true },
          ].map(({ title, isEditable, tracker, headerGrad, showPeriod }) => {
            // Check if tracker belongs to Rania and she's on period
            const isPeriodActive = showPeriod && tracker?.onPeriod;
            
            return (
              <div key={title} className="rounded-xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)', border: '1px solid #2A2A30', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                <div className={`bg-gradient-to-r ${headerGrad} p-4`} style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                  <h3 className="font-semibold text-xl text-white flex items-center gap-2">
                    <Heart size={20} />
                    {title}
                  </h3>
                </div>

                <div className="p-6 space-y-2">
                  {/* Period Tracker (Her only - visible to both) */}
                  {showPeriod && (
                    <div className="mb-4">
                      <div 
                        className={`rounded-lg p-4 border-2 transition-all ${
                          tracker?.onPeriod 
                            ? 'bg-gradient-to-r from-[#6B2D2D]/20 to-[#8B4545]/20 border-[#A85555]/40' 
                            : 'bg-[#1A1A1C] border-[#2A2A30]'
                        } ${isEditable ? 'cursor-pointer hover:border-[#C89B3C]/60' : ''}`}
                        onClick={() => isEditable && togglePeriod(tracker)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-shrink-0">
                            {tracker?.onPeriod
                              ? <CheckCircle2 size={22} style={{ color: '#A85555' }} />
                              : <Circle size={22} style={{ color: '#787878' }} />}
                          </div>
                          <span className="font-semibold text-sm" style={{ color: tracker?.onPeriod ? '#A85555' : '#E8E8E8' }}>
                            Period {tracker?.onPeriod ? '(Active)' : '(Not Active)'}
                          </span>
                        </div>
                        
                        {tracker?.onPeriod && tracker?.periodStartDate && (
                          <div className="ml-9 mt-3 space-y-2">
                            <div className="text-xs" style={{ color: '#A8A8A8' }}>
                              <span style={{ color: '#E8E8E8' }}>Started:</span> {new Date(tracker.periodStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            {tracker.periodEndDate && (
                              <>
                                <div className="text-xs" style={{ color: '#A8A8A8' }}>
                                  <span style={{ color: '#E8E8E8' }}>Ended:</span> {new Date(tracker.periodEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="text-xs font-semibold" style={{ color: '#C89B3C' }}>
                                  Missed {calculateMissedFasting(tracker)} fasting day{calculateMissedFasting(tracker) !== 1 ? 's' : ''}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Period Notice */}
                      {isPeriodActive && (
                        <div className="mt-2 rounded-lg p-3 border" 
                          style={{ background: 'rgba(168,85,85,0.1)', borderColor: 'rgba(168,85,85,0.3)' }}>
                          <p className="text-xs" style={{ color: '#A8A8A8' }}>
                            <span style={{ color: '#A85555' }}>⚠️ Period active:</span> Prayers, fasting, and night prayer are disabled. Quran reading is still enabled!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Debt Tracker */}
                  {tracker?.debtPages > 0 && (
                    <div className="rounded-lg p-3 mb-3 border-2"
                      style={{ background: 'rgba(92,58,33,0.15)', borderColor: 'rgba(200,155,60,0.3)', boxShadow: '0 4px 10px rgba(200,155,60,0.08)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={18} style={{ color: '#C89B3C' }} />
                        <span className="font-semibold text-sm" style={{ color: '#E8E8E8' }}>Pages Debt</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold" style={{ color: '#C89B3C' }}>{tracker?.debtPages || 0}</span>
                        <span className="text-xs" style={{ color: '#A8A8A8' }}>pages to catch up</span>
                        {isEditable && (
                          <input
                            type="number" min="0"
                            value={tracker?.debtPages || 0}
                            onChange={(e) => updateDebtPages(e.target.value, tracker)}
                            className={`ml-auto w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 shadow-inner ${inputStyle}`}
                            placeholder="0"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prayers */}
                  {prayers.map((prayer) => {
                    const isCompleted = tracker?.prayers?.[prayer];
                    const isPrayerDisabled = isPeriodActive; // Disable if period is active
                    
                    return (
                      <div key={prayer}>
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                            isCompleted ? completedRow : uncompletedRow
                          } ${isEditable && !isPrayerDisabled ? 'hover:border-[#C89B3C]/60 cursor-pointer' : ''} ${
                            isPrayerDisabled ? 'opacity-50' : ''
                          }`}
                          onClick={() => !isPrayerDisabled && togglePrayer(prayer, tracker, isEditable)}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted
                              ? <CheckCircle2 size={22} style={{ color: '#C89B3C' }} />
                              : <Circle size={22} style={{ color: '#787878' }} />}
                          </div>
                          <span className={`flex-1 font-medium text-sm ${isCompleted ? 'line-through opacity-75' : ''}`}
                            style={{ color: isCompleted ? '#C89B3C' : '#E8E8E8' }}>
                            {prayerLabels[prayer]}
                            {isPrayerDisabled && <span className="text-xs ml-2" style={{ color: '#A85555' }}>(Period)</span>}
                          </span>
                          {/* Quran input always enabled */}
                          {isEditable ? (
                            <input
                              type="number" min="0" max="10"
                              value={tracker?.quran?.[prayer] || 0}
                              onChange={(e) => { e.stopPropagation(); updateQuran(prayer, e.target.value, tracker); }}
                              onClick={(e) => e.stopPropagation()}
                              className={`w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 text-center font-medium shadow-inner ${inputStyle}`}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm font-medium px-3" style={{ color: '#A8A8A8' }}>
                              {tracker?.quran?.[prayer] || 0} pages
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Other Tasks */}
                  {[
                    { key: 'fasting',           label: 'Fasting' },
                    { key: 'nightPrayer',       label: 'Night Prayer' },
                    { key: 'morningRemembrance', label: 'Morning Remembrance' },
                    { key: 'eveningRemembrance', label: 'Evening Remembrance' }
                  ].map((task) => {
                    const isCompleted = tracker?.[task.key];
                    // Only disable fasting and night prayer during period
                    const isTaskDisabled = isPeriodActive && (task.key === 'fasting' || task.key === 'nightPrayer');
                    
                    return (
                      <div
                        key={task.key}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                          isCompleted ? completedRow : uncompletedRow
                        } ${isEditable && !isTaskDisabled ? 'hover:border-[#C89B3C]/60 cursor-pointer' : ''} ${
                          isTaskDisabled ? 'opacity-50' : ''
                        }`}
                        onClick={() => !isTaskDisabled && toggleTask(task.key, tracker, isEditable)}
                      >
                        <div className="flex-shrink-0">
                          {isCompleted
                            ? <CheckCircle2 size={22} style={{ color: '#C89B3C' }} />
                            : <Circle size={22} style={{ color: '#787878' }} />}
                        </div>
                        <span className={`flex-1 font-medium text-sm ${isCompleted ? 'line-through opacity-75' : ''}`}
                          style={{ color: isCompleted ? '#C89B3C' : '#E8E8E8' }}>
                          {task.label}
                          {isTaskDisabled && <span className="text-xs ml-2" style={{ color: '#A85555' }}>(Period)</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default RamadanTracker;
