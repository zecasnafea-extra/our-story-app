import React, { useState, useEffect, useRef } from 'react';
import { Moon, BookOpen, Heart, CheckCircle2, Circle, Info, Calendar, ChevronDown, ChevronUp, Edit3, TrendingDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import { serverTimestamp } from 'firebase/firestore';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAILY_QURAN_GOAL = 40;
const GOAL_PER_PRAYER  = 8;
const PRAYERS          = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS    = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getRamadanDates = (ramadanStart) => {
  const dates = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(ramadanStart); start.setHours(0, 0, 0, 0);
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1))
    dates.push(toDateStr(new Date(d)));
  return dates.slice(0, 30);
};

/**
 * Split a tracker's quran pages into:
 *   normalPages — capped at GOAL_PER_PRAYER per prayer (count toward daily goal)
 *   extraPages  — anything above GOAL_PER_PRAYER per prayer (pay off debt)
 */
const splitQuranPages = (tracker) => {
  let normalPages = 0;
  let extraPages  = 0;
  for (const prayer of PRAYERS) {
    const raw = tracker?.quran?.[prayer] || 0;
    normalPages += Math.min(raw, GOAL_PER_PRAYER);
    extraPages  += Math.max(0, raw - GOAL_PER_PRAYER);
  }
  return { normalPages, extraPages };
};

// ─── Component ────────────────────────────────────────────────────────────────
const RamadanTracker = () => {
  const { currentUser } = useAuth();
  const { documents: trackers, loading: trackersLoading, updateDocument, addDocument } = useFirestore('ramadanTracker');
  const { documents: periodHistory, addDocument: addPeriodHistory, updateDocument: updatePeriodHistory } = useFirestore('ramadanPeriodHistory');

  const [todayDate]     = useState(() => toDateStr(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isZeyad         = currentUser?.email?.toLowerCase().includes('zeyad');
  const currentUserName = isZeyad ? 'zeyad' : 'rania';
  const partnerName     = isZeyad ? 'rania' : 'zeyad';

  const startObj      = new Date(2026, 1, 19); startObj.setHours(0, 0, 0, 0);
  const ramadanDates  = getRamadanDates(startObj);

  const dayNum = (dateStr) => {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const n = Math.floor((d - startObj) / 86400000) + 1;
    return n > 0 && n <= 30 ? n : null;
  };

  const todayRamadanDay    = dayNum(todayDate);
  const selectedRamadanDay = dayNum(selectedDate);
  const isViewingToday     = selectedDate === todayDate;

  // ── Auto-create today's doc ────────────────────────────────────────────────
  const isCreatingDoc = useRef(false);
  useEffect(() => {
    if (trackersLoading || !currentUser) return;
    const todayDoc = trackers.find(t => t.user === currentUserName && t.date === todayDate);
    if (todayDoc || isCreatingDoc.current) return;
    isCreatingDoc.current = true;
    addDocument({
      user: currentUserName,
      date: todayDate,
      prayers:  { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      quran:    { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      fasting: false, nightPrayer: false, morningRemembrance: false, eveningRemembrance: false,
      debtPages: 0, onPeriod: false,
      periodStartDate: null, periodEndDate: null, periodQuranPages: 0,
      createdAt: serverTimestamp()
    }).finally(() => { isCreatingDoc.current = false; });
  }, [trackersLoading, trackers, currentUser, currentUserName, todayDate, addDocument]);

  // ── Auto-calculate debt for today ─────────────────────────────────────────
  // For each previous day:
  //   net = max(0, goal - normalPages) - extraPages
  // Running debt carries forward, clamped to 0 (can't go negative overall).
  const debtCalculated = useRef(false);
  useEffect(() => {
    if (trackersLoading || !currentUser) return;
    const todayDoc = trackers.find(t => t.user === currentUserName && t.date === todayDate);
    if (!todayDoc || debtCalculated.current) return;

    const prevDates = ramadanDates.filter(d => d < todayDate);
    let runningDebt = 0;

    for (const d of prevDates) {
      const doc = trackers.find(t => t.user === currentUserName && t.date === d);
      if (!doc) continue;
      if (doc.onPeriod) {
        const pages = doc.periodQuranPages || 0;
        runningDebt = Math.max(0, runningDebt + Math.max(0, DAILY_QURAN_GOAL - pages));
      } else {
        const { normalPages, extraPages } = splitQuranPages(doc);
        runningDebt = Math.max(0, runningDebt + Math.max(0, DAILY_QURAN_GOAL - normalPages) - extraPages);
      }
    }

    if (todayDoc.debtPages !== runningDebt) {
      debtCalculated.current = true;
      updateDocument(todayDoc.id, { debtPages: runningDebt })
        .finally(() => { debtCalculated.current = false; });
    }
  }, [trackersLoading, trackers, currentUser, currentUserName, todayDate, ramadanDates, updateDocument]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const calculateStats = (tracker) => {
    if (!tracker) return { prayers: 0, normalPages: 0, extraPages: 0, fasting: false };
    const { normalPages, extraPages } = splitQuranPages(tracker);
    return {
      prayers:     Object.values(tracker.prayers || {}).filter(Boolean).length,
      normalPages: tracker.onPeriod ? (tracker.periodQuranPages || 0) : normalPages,
      extraPages:  tracker.onPeriod ? 0 : extraPages,
      fasting:     tracker.fasting || false
    };
  };

  const myTracker      = trackers.find(t => t.user === currentUserName && t.date === selectedDate);
  const partnerTracker = trackers.find(t => t.user === partnerName      && t.date === selectedDate);
  const myStats        = calculateStats(myTracker);
  const partnerStats   = calculateStats(partnerTracker);

  // ── Permissions ────────────────────────────────────────────────────────────
  const canEdit = (trackerUser) => trackerUser === currentUserName;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const togglePrayer = async (prayer, tracker) => {
    if (!tracker || !canEdit(tracker.user)) return;
    if (tracker.user === 'rania' && tracker.onPeriod) return;
    await updateDocument(tracker.id, { prayers: { ...tracker.prayers, [prayer]: !tracker.prayers[prayer] } });
  };

  const updateQuran = async (prayer, raw, tracker) => {
    if (!tracker || !canEdit(tracker.user)) return;
    await updateDocument(tracker.id, { quran: { ...tracker.quran, [prayer]: parseInt(raw) || 0 } });
  };

  const updatePeriodQuran = async (pages, tracker) => {
    if (!tracker || !canEdit(tracker.user)) return;
    await updateDocument(tracker.id, { periodQuranPages: parseInt(pages) || 0 });
  };

  const toggleTask = async (taskName, tracker) => {
    if (!tracker || !canEdit(tracker.user)) return;
    if (tracker.user === 'rania' && tracker.onPeriod && (taskName === 'fasting' || taskName === 'nightPrayer')) return;
    await updateDocument(tracker.id, { [taskName]: !tracker[taskName] });
  };

  const updateDebtPages = async (pages, tracker) => {
    if (!tracker || !canEdit(tracker.user)) return;
    await updateDocument(tracker.id, { debtPages: parseInt(pages) || 0 });
  };

  // ── Period helpers ─────────────────────────────────────────────────────────
  const togglePeriod = async (tracker) => {
    if (!tracker || !canEdit(tracker.user)) return;
    const newState = !tracker.onPeriod;
    if (newState) {
      const open = periodHistory.find(p => p.user === 'rania' && !p.endDate);
      if (!open) await addPeriodHistory({ user: 'rania', startDate: selectedDate, endDate: null, missedDays: 0, createdAt: serverTimestamp() });
    } else {
      const open = periodHistory.filter(p => p.user === 'rania' && !p.endDate).sort((a, b) => b.startDate > a.startDate ? 1 : -1)[0];
      if (open) {
        const missed = Math.floor((new Date(selectedDate) - new Date(open.startDate)) / 86400000) + 1;
        await updatePeriodHistory(open.id, { endDate: selectedDate, missedDays: missed });
      }
    }
    await updateDocument(tracker.id, {
      onPeriod: newState,
      periodStartDate: newState ? selectedDate : tracker.periodStartDate,
      periodEndDate:   newState ? null : selectedDate,
      fasting: false, nightPrayer: false,
      periodQuranPages: newState ? 0 : tracker.periodQuranPages
    });
  };

  const deletePeriod     = async (id)       => updatePeriodHistory(id, { _deleted: true });
  const updatePeriodDays = async (id, days) => updatePeriodHistory(id, { missedDays: parseInt(days) || 0 });

  const activePeriods          = periodHistory.filter(p => p.user === 'rania' && !p._deleted);
  const totalMissedFastingDays = activePeriods.filter(p => p.endDate).reduce((s, p) => s + (p.missedDays || 0), 0);
  const activePeriod           = activePeriods.find(p => !p.endDate);
  const activePeriodDaysSoFar  = activePeriod
    ? Math.floor((new Date(todayDate) - new Date(activePeriod.startDate)) / 86400000) + 1 : 0;
  const grandTotalMissed = totalMissedFastingDays + activePeriodDaysSoFar;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const completedRow   = 'bg-gradient-to-r from-[#5C3A21]/20 to-[#C89B3C]/20 border-[#C89B3C]/40 shadow-lg shadow-[#C89B3C]/20';
  const uncompletedRow = 'bg-[#1A1A1C] border-[#2A2A30]';
  const inputStyle     = 'bg-[#0B0B0C] border-[#2A2A30] text-[#E8E8E8] focus:ring-[#C89B3C] focus:border-[#C89B3C]';

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · Day ${dayNum(dateStr)}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
            <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{
              background: todayRamadanDay ? '#4ADE80' : '#EF4444',
              boxShadow: todayRamadanDay ? '0 0 6px rgba(74,222,128,0.6)' : '0 0 6px rgba(239,68,68,0.6)'
            }} />
            {todayRamadanDay ? `Day ${todayRamadanDay} of 30 · ` : 'Starts Feb 19 · '}
            {myStats.prayers + partnerStats.prayers} prayers completed{!isViewingToday && ' (this day)'}
          </p>
        </div>

        {/* Date picker */}
        {ramadanDates.length > 1 && (
          <div className="rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)', border: '1px solid #2A2A30' }}>
            <button className="w-full flex items-center justify-between p-4 transition-all hover:bg-white/5"
              onClick={() => setShowDatePicker(!showDatePicker)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #5C3A21, #C89B3C)', boxShadow: '0 4px 12px rgba(200,155,60,0.3)' }}>
                  <Edit3 size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold" style={{ color: '#E8E8E8' }}>
                    {isViewingToday ? 'Today' : formatDateLabel(selectedDate)}
                  </div>
                  <div className="text-xs" style={{ color: '#A8A8A8' }}>
                    {isViewingToday ? 'Tap to edit a past day' : 'Viewing past day — tap to change'}
                  </div>
                </div>
              </div>
              {showDatePicker ? <ChevronUp size={18} style={{ color: '#C89B3C' }} /> : <ChevronDown size={18} style={{ color: '#C89B3C' }} />}
            </button>

            {showDatePicker && (
              <div className="border-t px-4 pb-4 pt-3 grid grid-cols-5 sm:grid-cols-7 gap-2" style={{ borderColor: '#2A2A30' }}>
                {ramadanDates.map((d) => {
                  const isSelected = d === selectedDate;
                  const isToday    = d === todayDate;
                  const myDayDoc   = trackers.find(t => t.user === currentUserName && t.date === d);
                  const { normalPages } = myDayDoc ? splitQuranPages(myDayDoc) : { normalPages: 0 };
                  const displayPages   = myDayDoc?.onPeriod ? (myDayDoc.periodQuranPages || 0) : normalPages;
                  const metGoal        = myDayDoc && displayPages >= DAILY_QURAN_GOAL;
                  return (
                    <button key={d}
                      onClick={() => { setSelectedDate(d); setShowDatePicker(false); }}
                      className="rounded-lg p-2 flex flex-col items-center transition-all hover:scale-105"
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #5C3A21, #C89B3C)' : isToday ? 'rgba(200,155,60,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isSelected ? '#C89B3C' : isToday ? 'rgba(200,155,60,0.4)' : '#2A2A30'}`,
                        boxShadow: isSelected ? '0 4px 12px rgba(200,155,60,0.3)' : 'none'
                      }}>
                      <span className="text-xs font-bold" style={{ color: isSelected ? '#fff' : '#C89B3C' }}>{dayNum(d)}</span>
                      <span className="text-xs mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#787878' }}>
                        {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {myDayDoc && <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: metGoal ? '#4ADE80' : '#EF4444' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="rounded-xl p-4" style={{
          background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)',
          border: '1px solid rgba(200,155,60,0.2)', boxShadow: '0 4px 20px rgba(200,155,60,0.08)'
        }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C89B3C, #8F7B5E)', boxShadow: '0 4px 12px rgba(200,155,60,0.3)' }}>
              <Info size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: '#C89B3C' }}>Daily Goal + Debt Repayment</h3>
              <p className="text-sm" style={{ color: '#E8E8E8' }}>
                <strong>8 pages</strong> per prayer = <strong>40 pages/day</strong>
              </p>
              <p className="text-xs mt-1" style={{ color: '#A8A8A8' }}>
                Read <strong style={{ color: '#C89B3C' }}>more than 8 pages</strong> after any prayer to automatically pay off debt 📖 — extra pages are tracked separately and reduce tomorrow's debt balance.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <CheckCircle2 size={18} className="text-white" />, label: 'Prayers',     value: `${myStats.prayers + partnerStats.prayers}/10`,              sub: 'completed',            accent: '#C89B3C' },
            { icon: <BookOpen    size={18} className="text-white" />, label: 'Goal Pages',   value: myStats.normalPages + partnerStats.normalPages,              sub: `of ${DAILY_QURAN_GOAL * 2} target`, accent: '#8F7B5E' },
            { icon: <TrendingDown size={18} className="text-white" />, label: 'Debt Repaid', value: myStats.extraPages + partnerStats.extraPages,                sub: 'extra pages today',    accent: '#4ADE80' },
            { icon: <Calendar    size={18} className="text-white" />, label: 'Day',           value: selectedRamadanDay || '-',                                  sub: 'of Ramadan',           accent: '#C89B3C' },
          ].map(({ icon, label, value, sub, accent }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)', border: '1px solid #2A2A30', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, #5C3A21, ${accent})` }}>
                  {icon}
                </div>
                <span className="text-xs font-semibold" style={{ color: accent }}>{label}</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: '#A8A8A8' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Dual panels */}
        <div className="grid lg:grid-cols-2 gap-6">
          {[
            { title: 'His Tracker', trackerUser: 'zeyad', tracker: trackers.find(t => t.user === 'zeyad' && t.date === selectedDate), headerGrad: 'from-[#5C3A21] to-[#8F7B5E]', showPeriod: false },
            { title: 'Her Tracker', trackerUser: 'rania', tracker: trackers.find(t => t.user === 'rania' && t.date === selectedDate), headerGrad: 'from-[#6B5D3F] to-[#9D7C5A]', showPeriod: true  },
          ].map(({ title, trackerUser, tracker, headerGrad, showPeriod }) => {
            const isEditable     = canEdit(trackerUser);
            const isPeriodActive = showPeriod && tracker?.onPeriod;
            const { normalPages: trackerNormal, extraPages: trackerExtra } = tracker ? splitQuranPages(tracker) : { normalPages: 0, extraPages: 0 };
            const debt = tracker?.debtPages || 0;

            return (
              <div key={title} className="rounded-xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)', border: '1px solid #2A2A30', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>

                <div className={`bg-gradient-to-r ${headerGrad} p-4`} style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                  <h3 className="font-semibold text-xl text-white flex items-center gap-2">
                    <Heart size={20} />
                    {title}
                    {!isViewingToday && isEditable && (
                      <span className="ml-auto text-xs font-normal rounded-full px-2 py-0.5"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}>
                        Editing past day
                      </span>
                    )}
                  </h3>
                </div>

                <div className="p-6 space-y-2">

                  {/* Period section */}
                  {showPeriod && (
                    <div className="mb-4">
                      <div
                        className={`rounded-lg p-4 border-2 transition-all ${tracker?.onPeriod ? 'bg-gradient-to-r from-[#6B2D2D]/20 to-[#8B4545]/20 border-[#A85555]/40' : 'bg-[#1A1A1C] border-[#2A2A30]'} ${isEditable ? 'cursor-pointer hover:border-[#C89B3C]/60' : ''}`}
                        onClick={() => isEditable && togglePeriod(tracker)}>
                        <div className="flex items-center gap-3">
                          {tracker?.onPeriod ? <CheckCircle2 size={22} style={{ color: '#A85555' }} /> : <Circle size={22} style={{ color: '#787878' }} />}
                          <span className="font-semibold text-sm" style={{ color: tracker?.onPeriod ? '#A85555' : '#E8E8E8' }}>
                            Period {tracker?.onPeriod ? '(Active)' : '(Not Active)'}
                          </span>
                        </div>
                      </div>

                      {activePeriods.length > 0 && (
                        <div className="mt-3 rounded-lg p-4 border-2"
                          style={{ background: 'linear-gradient(135deg, rgba(92,58,33,0.15), rgba(143,123,94,0.15))', borderColor: 'rgba(200,155,60,0.4)', boxShadow: '0 4px 15px rgba(200,155,60,0.15)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar size={18} style={{ color: '#C89B3C' }} />
                              <span className="font-semibold text-sm" style={{ color: '#E8E8E8' }}>Period History</span>
                            </div>
                            <div className="rounded-full px-3 py-1" style={{ background: 'rgba(168,85,85,0.2)', border: '1px solid rgba(168,85,85,0.4)' }}>
                              <span className="text-xs font-bold" style={{ color: '#A85555' }}>
                                {grandTotalMissed} day{grandTotalMissed !== 1 ? 's' : ''} missed
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {activePeriods.sort((a, b) => a.startDate > b.startDate ? 1 : -1).map((period, idx) => {
                              const isActive = !period.endDate;
                              const days     = isActive ? activePeriodDaysSoFar : period.missedDays;
                              return (
                                <div key={period.id || idx} className="rounded-lg px-3 py-2"
                                  style={{ background: isActive ? 'rgba(168,85,85,0.12)' : 'rgba(200,155,60,0.08)', border: `1px solid ${isActive ? 'rgba(168,85,85,0.3)' : 'rgba(200,155,60,0.2)'}` }}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-semibold" style={{ color: isActive ? '#A85555' : '#C89B3C' }}>
                                        Period {idx + 1} {isActive && <span className="italic font-normal">(ongoing)</span>}
                                      </div>
                                      <div className="text-xs mt-0.5" style={{ color: '#A8A8A8' }}>
                                        {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {period.endDate ? ` → ${new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ' → ongoing'}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!isActive && isEditable ? (
                                        <div className="flex items-center gap-1">
                                          <input type="number" min="1" max="15" value={period.missedDays || 0}
                                            onChange={(e) => updatePeriodDays(period.id, e.target.value)}
                                            className="w-14 px-2 py-1 text-xs border-2 rounded-lg focus:outline-none text-center font-bold"
                                            style={{ background: '#0B0B0C', borderColor: 'rgba(200,155,60,0.4)', color: '#E8E8E8' }} />
                                          <span className="text-xs" style={{ color: '#A8A8A8' }}>days</span>
                                        </div>
                                      ) : (
                                        <div className="text-sm font-bold" style={{ color: isActive ? '#A85555' : '#E8E8E8' }}>
                                          {days} day{days !== 1 ? 's' : ''}
                                        </div>
                                      )}
                                      {isEditable && !isActive && (
                                        <button onClick={() => deletePeriod(period.id)}
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
                                          style={{ background: 'rgba(168,85,85,0.2)', color: '#A85555', border: '1px solid rgba(168,85,85,0.4)' }}>✕</button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {grandTotalMissed > 0 && (
                            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,155,60,0.2)' }}>
                              <p className="text-xs" style={{ color: '#A8A8A8' }}>
                                📋 <span style={{ color: '#C89B3C' }}>Qadaa:</span> {grandTotalMissed} fasting day{grandTotalMissed !== 1 ? 's' : ''} to make up
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {isPeriodActive && (
                        <div className="mt-2 rounded-lg p-3 border" style={{ background: 'rgba(168,85,85,0.1)', borderColor: 'rgba(168,85,85,0.3)' }}>
                          <p className="text-xs" style={{ color: '#A8A8A8' }}>
                            <span style={{ color: '#A85555' }}>⚠️ Period active:</span> Prayers, fasting, and night prayer are disabled.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Period quran input */}
                  {isPeriodActive && (
                    <div className="rounded-lg p-4 mb-3 border-2"
                      style={{ background: 'linear-gradient(135deg, rgba(92,58,33,0.2), rgba(143,123,94,0.2))', borderColor: 'rgba(200,155,60,0.5)', boxShadow: '0 4px 15px rgba(200,155,60,0.15)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={20} style={{ color: '#C89B3C' }} />
                        <span className="font-semibold" style={{ color: '#E8E8E8' }}>Today's Quran Reading</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold" style={{ color: '#C89B3C' }}>{tracker?.periodQuranPages || 0}</span>
                        <span className="text-sm" style={{ color: '#A8A8A8' }}>pages read</span>
                        {isEditable && (
                          <input type="number" min="0" value={tracker?.periodQuranPages || 0}
                            onChange={(e) => updatePeriodQuran(e.target.value, tracker)}
                            className={`ml-auto w-24 px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 text-center font-semibold shadow-inner ${inputStyle}`} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Debt card */}
                  {!isPeriodActive && (debt > 0 || isEditable) && (
                    <div className="rounded-lg p-4 mb-1 border-2"
                      style={{
                        background: debt === 0 ? 'rgba(74,222,128,0.06)' : 'rgba(92,58,33,0.15)',
                        borderColor: debt === 0 ? 'rgba(74,222,128,0.3)' : 'rgba(200,155,60,0.35)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={18} style={{ color: debt === 0 ? '#4ADE80' : '#C89B3C' }} />
                        <span className="font-semibold text-sm" style={{ color: '#E8E8E8' }}>Pages Debt</span>
                        <span className="text-xs ml-auto" style={{ color: '#787878' }}>auto-calculated</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold" style={{ color: debt === 0 ? '#4ADE80' : '#C89B3C' }}>
                          {debt}
                        </span>
                        <span className="text-xs" style={{ color: '#A8A8A8' }}>
                          {debt === 0 ? 'no debt — on track! 🎉' : 'pages carried over'}
                        </span>
                        {isEditable && (
                          <input type="number" min="0" value={debt}
                            onChange={(e) => updateDebtPages(e.target.value, tracker)}
                            className={`ml-auto w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 shadow-inner ${inputStyle}`} />
                        )}
                      </div>

                      {/* Live repayment progress */}
                      {debt > 0 && trackerExtra > 0 && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,155,60,0.2)' }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs" style={{ color: '#A8A8A8' }}>Repaid today with extra pages</span>
                            <span className="text-xs font-bold" style={{ color: '#4ADE80' }}>
                              {trackerExtra} pg extra
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(200,155,60,0.15)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (trackerExtra / debt) * 100)}%`,
                                background: trackerExtra >= debt ? '#4ADE80' : 'linear-gradient(90deg, #C89B3C, #4ADE80)'
                              }} />
                          </div>
                          <p className="text-xs mt-1.5" style={{ color: trackerExtra >= debt ? '#4ADE80' : '#A8A8A8' }}>
                            {trackerExtra >= debt
                              ? '✅ Debt fully paid! Tomorrow starts fresh.'
                              : `${debt - trackerExtra} pages still remaining — keep reading!`}
                          </p>
                        </div>
                      )}

                      {debt > 0 && trackerExtra === 0 && (
                        <p className="text-xs mt-2 pt-2" style={{ borderTop: '1px solid rgba(200,155,60,0.15)', color: '#787878' }}>
                          💡 Read more than <strong>8 pages</strong> after any prayer to start paying this off
                        </p>
                      )}
                    </div>
                  )}

                  {/* Prayer rows */}
                  {!isPeriodActive && PRAYERS.map((prayer) => {
                    const isCompleted = tracker?.prayers?.[prayer];
                    const rawPages    = tracker?.quran?.[prayer] || 0;
                    const normalP     = Math.min(rawPages, GOAL_PER_PRAYER);
                    const extraP      = Math.max(0, rawPages - GOAL_PER_PRAYER);

                    return (
                      <div key={prayer} className={`rounded-lg border-2 transition-all ${isCompleted ? completedRow : uncompletedRow} ${isEditable ? 'hover:border-[#C89B3C]/60' : ''}`}>
                        {/* Top row: toggle + input */}
                        <div className={`flex items-center gap-3 p-3 ${isEditable ? 'cursor-pointer' : ''}`}
                          onClick={() => togglePrayer(prayer, tracker)}>
                          <div className="flex-shrink-0">
                            {isCompleted ? <CheckCircle2 size={22} style={{ color: '#C89B3C' }} /> : <Circle size={22} style={{ color: '#787878' }} />}
                          </div>
                          <span className={`flex-1 font-medium text-sm ${isCompleted ? 'line-through opacity-75' : ''}`}
                            style={{ color: isCompleted ? '#C89B3C' : '#E8E8E8' }}>
                            {PRAYER_LABELS[prayer]}
                          </span>
                          {isEditable ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number" min="0" max="40"
                                value={rawPages}
                                onChange={(e) => updateQuran(prayer, e.target.value, tracker)}
                                className={`w-20 px-2 py-1.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 text-center font-medium shadow-inner ${inputStyle}`}
                                placeholder="0"
                              />
                              <span className="text-xs" style={{ color: '#787878' }}>pg</span>
                            </div>
                          ) : (
                            <span className="text-sm font-medium px-3" style={{ color: '#A8A8A8' }}>
                              {rawPages} pg
                            </span>
                          )}
                        </div>

                        {/* Extra pages badge */}
                        {extraP > 0 && (
                          <div className="px-3 pb-2.5 flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                              style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}>
                              <TrendingDown size={12} style={{ color: '#4ADE80' }} />
                              <span className="text-xs font-semibold" style={{ color: '#4ADE80' }}>
                                +{extraP} extra → paying off debt
                              </span>
                            </div>
                            <span className="text-xs" style={{ color: '#787878' }}>
                              ({normalP} toward goal)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Other tasks */}
                  {[
                    { key: 'fasting',            label: 'Fasting' },
                    { key: 'nightPrayer',        label: 'Night Prayer' },
                    { key: 'morningRemembrance', label: 'Morning Remembrance' },
                    { key: 'eveningRemembrance', label: 'Evening Remembrance' }
                  ].map((task) => {
                    const isCompleted    = tracker?.[task.key];
                    const isTaskDisabled = isPeriodActive && (task.key === 'fasting' || task.key === 'nightPrayer');
                    return (
                      <div key={task.key}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${isCompleted ? completedRow : uncompletedRow} ${isEditable && !isTaskDisabled ? 'hover:border-[#C89B3C]/60 cursor-pointer' : ''} ${isTaskDisabled ? 'opacity-50' : ''}`}
                        onClick={() => !isTaskDisabled && toggleTask(task.key, tracker)}>
                        <div className="flex-shrink-0">
                          {isCompleted ? <CheckCircle2 size={22} style={{ color: '#C89B3C' }} /> : <Circle size={22} style={{ color: '#787878' }} />}
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
