import React, { useState, useEffect } from 'react';
import { Moon, BookOpen, Heart, Flame, CheckCircle2, Circle, Info } from 'lucide-react';
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

  useEffect(() => {
    if (!myTracker && currentUser) {
      addDocument({
        user: currentUserName,
        date: todayDate,
        prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        quran: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
        fasting: false,
        taraweeh: false,
        morningRemembrance: false,
        eveningRemembrance: false,
        debtPages: 0,
        createdAt: serverTimestamp()
      });
    }
  }, [myTracker, currentUser, currentUserName, todayDate, addDocument]);

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

  const togglePrayer = async (prayer) => {
    if (!myTracker) return;
    await updateDocument(myTracker.id, { prayers: { ...myTracker.prayers, [prayer]: !myTracker.prayers[prayer] } });
  };

  const updateQuran = async (prayer, pages) => {
    if (!myTracker) return;
    await updateDocument(myTracker.id, { quran: { ...myTracker.quran, [prayer]: parseInt(pages) || 0 } });
  };

  const toggleTask = async (taskName) => {
    if (!myTracker) return;
    await updateDocument(myTracker.id, { [taskName]: !myTracker[taskName] });
  };

  const updateDebtPages = async (pages) => {
    if (!myTracker) return;
    await updateDocument(myTracker.id, { debtPages: parseInt(pages) || 0 });
  };

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerLabels = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  const totalStreak = 12;

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
            { icon: <Flame size={18} className="text-white" />,        label: 'Streak',       value: totalStreak, sub: 'consecutive days',     accent: '#C89B3C', shadow: '#C89B3C' },
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
          {/* His Tracker */}
          {[
            { title: 'His Tracker',  isEditable: isZeyad,  tracker: isZeyad ? myTracker : partnerTracker,  headerGrad: 'from-[#5C3A21] to-[#8F7B5E]' },
            { title: 'Her Tracker',  isEditable: !isZeyad, tracker: !isZeyad ? myTracker : partnerTracker, headerGrad: 'from-[#6B5D3F] to-[#9D7C5A]' },
          ].map(({ title, isEditable, tracker, headerGrad }) => (
            <div key={title} className="rounded-xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)', border: '1px solid #2A2A30', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <div className={`bg-gradient-to-r ${headerGrad} p-4`} style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <h3 className="font-semibold text-xl text-white flex items-center gap-2">
                  <Heart size={20} />
                  {title}
                </h3>
              </div>

              <div className="p-6 space-y-2">
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
                          onChange={(e) => updateDebtPages(e.target.value)}
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
                  return (
                    <div key={prayer}>
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${isCompleted ? completedRow : uncompletedRow} ${isEditable ? 'hover:border-[#C89B3C]/60 cursor-pointer' : ''}`}
                        onClick={() => isEditable && togglePrayer(prayer)}
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
                            onChange={(e) => { e.stopPropagation(); updateQuran(prayer, e.target.value); }}
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
                  { key: 'taraweeh',          label: 'Taraweeh' },
                  { key: 'morningRemembrance', label: 'Morning Remembrance' },
                  { key: 'eveningRemembrance', label: 'Evening Remembrance' }
                ].map((task) => {
                  const isCompleted = tracker?.[task.key];
                  return (
                    <div
                      key={task.key}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all border-2 ${isCompleted ? completedRow : uncompletedRow} ${isEditable ? 'hover:border-[#C89B3C]/60 cursor-pointer' : ''}`}
                      onClick={() => isEditable && toggleTask(task.key)}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted
                          ? <CheckCircle2 size={22} style={{ color: '#C89B3C' }} />
                          : <Circle size={22} style={{ color: '#787878' }} />}
                      </div>
                      <span className={`flex-1 font-medium text-sm ${isCompleted ? 'line-through opacity-75' : ''}`}
                        style={{ color: isCompleted ? '#C89B3C' : '#E8E8E8' }}>
                        {task.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default RamadanTracker;
