import React, { useState, useEffect, useRef } from 'react';
import { Moon, BookOpen, Heart, Flame, CheckCircle2, Circle, Info, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';

const RamadanTracker = () => {
  const { currentUser } = useAuth();
  const { documents: trackers, loading: trackersLoading, updateDocument, addDocument } = useFirestore('ramadanTracker');
  const { documents: periodHistory, addDocument: addPeriodHistory, updateDocument: updatePeriodHistory } = useFirestore('ramadanPeriodHistory');

  const [todayDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const isZeyad = currentUser?.email?.toLowerCase().includes('zeyad');
  const currentUserName = isZeyad ? 'zeyad' : 'rania';
  const partnerName = isZeyad ? 'rania' : 'zeyad';

  const myTracker = trackers.find(t => t.user === currentUserName && t.date === todayDate);
  const partnerTracker = trackers.find(t => t.user === partnerName && t.date === todayDate);

  const ramadanStartDate = new Date(2026, 1, 19);
  const today = new Date();
  const diffTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()) - ramadanStartDate;
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const ramadanDay = daysDiff > 0 && daysDiff <= 30 ? daysDiff : null;

  // Prevents React StrictMode (and any other double-fire) from creating two blank docs
  const isCreatingDoc = useRef(false);

  useEffect(() => {
    if (trackersLoading || !currentUser || myTracker || isCreatingDoc.current) return;
    isCreatingDoc.current = true;
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
        onPeriod: false,
        periodStartDate: null,
        periodEndDate: null,
        periodQuranPages: 0,
        createdAt: serverTimestamp()
      }).finally(() => {
        // Reset only if Firestore hasn't returned the doc yet (edge case safety)
        if (!myTracker) isCreatingDoc.current = false;
      });
  }, [trackersLoading, myTracker, currentUser, currentUserName, todayDate, addDocument]);

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
    
    const trackerUser = tracker.user;
    if (trackerUser === 'rania' && tracker.onPeriod) {
      return;
    }
    
    await updateDocument(tracker.id, { prayers: { ...tracker.prayers, [prayer]: !tracker.prayers[prayer] } });
  };

  const updateQuran = async (prayer, pages, tracker) => {
    if (!tracker) return;
    await updateDocument(tracker.id, { quran: { ...tracker.quran, [prayer]: parseInt(pages) || 0 } });
  };

  const updatePeriodQuran = async (pages, tracker) => {
    if (!tracker) return;
    await updateDocument(tracker.id, { periodQuranPages: parseInt(pages) || 0 });
  };

  const toggleTask = async (taskName, tracker, isEditable) => {
    if (!tracker || !isEditable) return;
    
    const trackerUser = tracker.user;
    if (trackerUser === 'rania' && tracker.onPeriod) {
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

    if (newPeriodState) {
      // Only create a new period doc if there's no already-open one
      const alreadyOpen = periodHistory.find(p => p.user === 'rania' && !p.endDate);
      if (!alreadyOpen) {
        await addPeriodHistory({
          user: 'rania',
          startDate: todayDate,
          endDate: null,
          missedDays: 0,
          createdAt: serverTimestamp()
        });
      }
    } else {
      // Close the open period and calculate actual calendar days
      const openPeriod = periodHistory
        .filter(p => p.user === 'rania' && !p.endDate)
        .sort((a, b) => (b.startDate > a.startDate ? 1 : -1))[0];

      if (openPeriod) {
        const start = new Date(openPeriod.startDate);
        const end = new Date(todayDate);
        const missed = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        await updatePeriodHistory(openPeriod.id, {
          endDate: todayDate,
          missedDays: missed
        });
      }
    }

    await updateDocument(tracker.id, {
      onPeriod: newPeriodState,
      periodStartDate: newPeriodState ? todayDate : tracker.periodStartDate,
      periodEndDate: newPeriodState ? null : todayDate,
      fasting: false,
      nightPrayer: false,
      periodQuranPages: newPeriodState ? 0 : tracker.periodQuranPages
    });
  };

  const deletePeriod = async (periodId) => {
    await updatePeriodHistory(periodId, { _deleted: true });
  };

  const updatePeriodDays = async (periodId, days) => {
    await updatePeriodHistory(periodId, { missedDays: parseInt(days) || 0 });
  };

  // Filter out soft-deleted periods
  const activePeriods = periodHistory.filter(p => p.user === 'rania' && !p._deleted);

  // Total missed fasting days across ALL completed periods this Ramadan
  const totalMissedFastingDays = activePeriods
    .filter(p => p.endDate)
    .reduce((sum, p) => sum + (p.missedDays || 0), 0);

  // Active period (if any) — days missed so far even before it ends
  const activePeriod = activePeriods.find(p => !p.endDate);
  const activePeriodDaysSoFar = activePeriod
    ? Math.floor((new Date(todayDate) - new Date(activePeriod.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const grandTotalMissed = totalMissedFastingDays + activePeriodDaysSoFar;

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
            Ramadan Tracker
          </h2>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: '#A8A8A8' }}>
            {/* Green dot if Ramadan started, red if not yet */}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                background: ramadanDay ? '#4ADE80' : '#EF4444',
                boxShadow: ramadanDay ? '0 0 6px rgba(74,222,128,0.6)' : '0 0 6px rgba(239,68,68,0.6)'
              }}
              title={ramadanDay ? 'Ramadan tracking active' : 'Ramadan not started yet'}
            />
            {ramadanDay ? `Day ${ramadanDay} of 30 • ` : 'Starts Feb 19 • '}
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
          {[
            { title: 'His Tracker',  isEditable: isZeyad,  tracker: isZeyad ? myTracker : partnerTracker,  headerGrad: 'from-[#5C3A21] to-[#8F7B5E]', showPeriod: false },
            { title: 'Her Tracker',  isEditable: !isZeyad, tracker: !isZeyad ? myTracker : partnerTracker, headerGrad: 'from-[#6B5D3F] to-[#9D7C5A]', showPeriod: true },
          ].map(({ title, isEditable, tracker, headerGrad, showPeriod }) => {
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
                      </div>
                      
                      {/* Period History — shows ALL periods logged this Ramadan */}
                      {activePeriods.length > 0 && (
                        <div className="mt-3 rounded-lg p-4 border-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(92,58,33,0.15), rgba(143,123,94,0.15))',
                            borderColor: 'rgba(200,155,60,0.4)',
                            boxShadow: '0 4px 15px rgba(200,155,60,0.15)'
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar size={18} style={{ color: '#C89B3C' }} />
                              <span className="font-semibold text-sm" style={{ color: '#E8E8E8' }}>Period History</span>
                            </div>
                            {/* Grand total badge */}
                            <div className="rounded-full px-3 py-1"
                              style={{ background: 'rgba(168,85,85,0.2)', border: '1px solid rgba(168,85,85,0.4)' }}>
                              <span className="text-xs font-bold" style={{ color: '#A85555' }}>
                                {grandTotalMissed} day{grandTotalMissed !== 1 ? 's' : ''} missed total
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {activePeriods
                              .sort((a, b) => (a.startDate > b.startDate ? 1 : -1))
                              .map((period, idx) => {
                                const isActive = !period.endDate;
                                const days = isActive ? activePeriodDaysSoFar : period.missedDays;
                                return (
                                  <div key={period.id || idx}
                                    className="rounded-lg px-3 py-2"
                                    style={{
                                      background: isActive ? 'rgba(168,85,85,0.12)' : 'rgba(200,155,60,0.08)',
                                      border: `1px solid ${isActive ? 'rgba(168,85,85,0.3)' : 'rgba(200,155,60,0.2)'}`
                                    }}>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-xs font-semibold" style={{ color: isActive ? '#A85555' : '#C89B3C' }}>
                                          Period {idx + 1} {isActive && <span className="italic font-normal">(ongoing)</span>}
                                        </div>
                                        <div className="text-xs mt-0.5" style={{ color: '#A8A8A8' }}>
                                          {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          {period.endDate && ` → ${new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                          {isActive && ' → ongoing'}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {/* Editable days — only for completed periods and only if Rania */}
                                        {!isActive && isEditable ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number" min="1" max="15"
                                              value={period.missedDays || 0}
                                              onChange={(e) => updatePeriodDays(period.id, e.target.value)}
                                              className="w-14 px-2 py-1 text-xs border-2 rounded-lg focus:outline-none text-center font-bold"
                                              style={{ background: '#0B0B0C', borderColor: 'rgba(200,155,60,0.4)', color: '#E8E8E8' }}
                                            />
                                            <span className="text-xs" style={{ color: '#A8A8A8' }}>days</span>
                                          </div>
                                        ) : (
                                          <div className="text-sm font-bold" style={{ color: isActive ? '#A85555' : '#E8E8E8' }}>
                                            {days} day{days !== 1 ? 's' : ''}
                                          </div>
                                        )}

                                        {/* Delete button — only Rania can delete */}
                                        {isEditable && !isActive && (
                                          <button
                                            onClick={() => deletePeriod(period.id)}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                                            style={{ background: 'rgba(168,85,85,0.2)', color: '#A85555', border: '1px solid rgba(168,85,85,0.4)' }}
                                            title="Remove this period entry"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {/* To-make-up reminder */}
                          {grandTotalMissed > 0 && (
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,155,60,0.2)' }}>
                              <p className="text-xs" style={{ color: '#A8A8A8' }}>
                                📋 <span style={{ color: '#C89B3C' }}>Qadaa reminder:</span> {grandTotalMissed} fasting day{grandTotalMissed !== 1 ? 's' : ''} to make up after Ramadan
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
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

                  {isPeriodActive && (
                    <div className="rounded-lg p-4 mb-3 border-2"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(92,58,33,0.2), rgba(143,123,94,0.2))',
                        borderColor: 'rgba(200,155,60,0.5)',
                        boxShadow: '0 4px 15px rgba(200,155,60,0.15)'
                      }}>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={20} style={{ color: '#C89B3C' }} />
                        <span className="font-semibold" style={{ color: '#E8E8E8' }}>Today's Quran Reading</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold" style={{ color: '#C89B3C' }}>
                          {tracker?.periodQuranPages || 0}
                        </span>
                        <span className="text-sm" style={{ color: '#A8A8A8' }}>pages read today</span>
                        {isEditable && (
                          <input
                            type="number" min="0"
                            value={tracker?.periodQuranPages || 0}
                            onChange={(e) => updatePeriodQuran(e.target.value, tracker)}
                            className={`ml-auto w-24 px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 text-center font-semibold shadow-inner ${inputStyle}`}
                            placeholder="0"
                          />
                        )}
                      </div>
                    </div>
                  )}

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

                  {!isPeriodActive && prayers.map((prayer) => {
                    const isCompleted = tracker?.prayers?.[prayer];
                    
                    return (
                      <div key={prayer}>
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${
                            isCompleted ? completedRow : uncompletedRow
                          } ${isEditable ? 'hover:border-[#C89B3C]/60 cursor-pointer' : ''}`}
                          onClick={() => togglePrayer(prayer, tracker, isEditable)}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted
                              ? <CheckCircle2 size={22} style={{ color: '#C89B3C' }} />
                              : <Circle size={22} style={{ color: '#787878' }} />}
                          </div>
                          <span className={`flex-1 font-medium text-sm ${isCompleted ? 'line-through opacity-75' : ''}`}
                            style={{ color: isCompleted ? '#C89B3C' : '#E8E8E8' }}>
                            {prayerLabels[prayer]}
                          </span>
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

                  {[
                    { key: 'fasting',           label: 'Fasting' },
                    { key: 'nightPrayer',       label: 'Night Prayer' },
                    { key: 'morningRemembrance', label: 'Morning Remembrance' },
                    { key: 'eveningRemembrance', label: 'Evening Remembrance' }
                  ].map((task) => {
                    const isCompleted = tracker?.[task.key];
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
