import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Heart, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Phase Data ───────────────────────────────────────────────────────────────
const PHASES = [
  {
    name: 'Menstrual',
    days: [1, 2, 3, 4, 5],
    color: '#A85555',
    glow: 'rgba(168,85,85,0.35)',
    border: 'rgba(168,85,85,0.4)',
    bg: 'rgba(168,85,85,0.10)',
    icon: '🌑',
    energy: 1,
    moods: ['Low energy', 'Emotional', 'Sensitive', 'Irritable', 'Wants rest'],
    moodSummary: 'Low energy & emotional',
    moodDesc:
      "She's feeling drained and emotionally sensitive right now. This isn't the time for big plans or difficult conversations — she needs warmth, rest, and gentle presence. Just being there for her matters more than anything.",
    tips: [
      'Keep it cozy — movies, blankets, tea 🍵',
      "Don't take irritability personally",
      'Gentle check-ins, no pressure',
      'Bring her comfort food or her favorite snack',
    ],
  },
  {
    name: 'Follicular',
    days: [6, 7, 8, 9, 10, 11, 12, 13],
    color: '#7EB8D4',
    glow: 'rgba(126,184,212,0.35)',
    border: 'rgba(126,184,212,0.4)',
    bg: 'rgba(126,184,212,0.10)',
    icon: '🌒',
    energy: 4,
    moods: ['Motivated', 'Optimistic', 'Focused', 'Social', 'Energetic'],
    moodSummary: 'Motivated & energetic',
    moodDesc:
      "She's rising — energized, optimistic, and ready to take on the world. She'll be more talkative, creative, and open to making plans. This is the perfect window for dates, new experiences, and meaningful conversations.",
    tips: [
      'Plan something exciting together 🎯',
      "She's at her most productive — support her goals",
      'Great time for deep, honest conversations',
      'Say yes to spontaneous ideas',
    ],
  },
  {
    name: 'Ovulation',
    days: [14, 15, 16],
    color: '#C89B3C',
    glow: 'rgba(200,155,60,0.45)',
    border: 'rgba(200,155,60,0.5)',
    bg: 'rgba(200,155,60,0.12)',
    icon: '🌕',
    energy: 5,
    moods: ['Confident', 'Flirty', 'Outgoing', 'Energetic', 'Attractive'],
    moodSummary: 'Confident & magnetic',
    moodDesc:
      "Peak phase. She feels her absolute best — confident, glowing, and magnetic. She'll be more flirtatious, outgoing, and expressive. Celebrate her, show up for her, and tell her she looks amazing.",
    tips: [
      "Tell her she's beautiful — she'll feel it ✨",
      'Plan a special date night',
      "She's at her most social & radiant",
      "Match her energy — she's bringing a lot of it",
    ],
  },
  {
    name: 'Luteal',
    days: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    color: '#9D7C5A',
    glow: 'rgba(157,124,90,0.35)',
    border: 'rgba(157,124,90,0.4)',
    bg: 'rgba(157,124,90,0.10)',
    icon: '🌖',
    energy: 2,
    moods: ['Moody', 'Irritable', 'Anxious', 'Overthinking', 'Cravings', 'Sensitive'],
    moodSummary: 'Sensitive & overthinking',
    moodDesc:
      "Energy is winding down and emotions are running high. She may feel moody, anxious, or stuck in her head — that's hormonal, not personal. Patience and quiet presence go a long way. Don't escalate; just hold space.",
    tips: [
      'Be patient — she feels everything more deeply now 💛',
      'Avoid starting difficult conversations',
      'Satisfy her cravings without judgment 🍫',
      'Hold space without trying to fix everything',
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const CYCLE_LENGTH = 28;
// Feb 15 2026 — local time safe (same pattern as RamadanTracker)
const START_DATE = new Date(2026, 1, 15);
START_DATE.setHours(0, 0, 0, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getLocalToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getDayOfCycle = () => {
  const today = getLocalToday();
  const diff  = Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24));
  const raw   = diff % CYCLE_LENGTH;
  return raw < 0 ? raw + CYCLE_LENGTH : raw + 1;
};

const getPhaseForDay = (day) =>
  PHASES.find(p => p.days.includes(day)) || PHASES[3];

// ─── Sub-components ───────────────────────────────────────────────────────────
const EnergyBar = ({ level, color }) => {
  const labels = ['', 'Very low', 'Low', 'Medium', 'High', 'Peak'];
  return (
    <div className="flex items-center gap-2">
      <Zap size={12} style={{ color, flexShrink: 0 }} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-1.5 w-5 rounded-full transition-all duration-300"
            style={{
              background:  i <= level ? color : 'rgba(255,255,255,0.07)',
              boxShadow:   i <= level ? `0 0 6px ${color}70` : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: '#A8A8A8' }}>{labels[level]}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CycleTab = () => {
  const { currentUser } = useAuth();

  const [currentDay]   = useState(getDayOfCycle);
  const [selectedDay, setSelectedDay] = useState(getDayOfCycle);
  const [visible, setVisible]         = useState(false);

  const phase            = getPhaseForDay(selectedDay);
  const currentPhase     = getPhaseForDay(currentDay);
  const daysIntoPhase    = selectedDay - phase.days[0] + 1;
  const daysLeftInPhase  = phase.days[phase.days.length - 1] - selectedDay;
  const nextPhase        = PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length];

  const isZeyad = currentUser?.email?.toLowerCase().includes('zeyad');

  // Fade-in animation whenever selected day changes
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [selectedDay]);

  // ── Wheel geometry ──────────────────────────────────────────────────────────
  const cx = 155, cy = 155, outerR = 128, innerR = 70, dotR = 143;

  const buildArcPath = (startDay, endDay) => {
    const toAngle = d => ((d - 0.5) / CYCLE_LENGTH) * 2 * Math.PI - Math.PI / 2;
    const sa = toAngle(startDay), ea = toAngle(endDay + 1);
    const large = (endDay - startDay) / CYCLE_LENGTH >= 0.5 ? 1 : 0;
    const ox1 = cx + outerR * Math.cos(sa), oy1 = cy + outerR * Math.sin(sa);
    const ox2 = cx + outerR * Math.cos(ea), oy2 = cy + outerR * Math.sin(ea);
    const ix1 = cx + innerR * Math.cos(sa), iy1 = cy + innerR * Math.sin(sa);
    const ix2 = cx + innerR * Math.cos(ea), iy2 = cy + innerR * Math.sin(ea);
    return { sa, ea, large, ox1, oy1, ox2, oy2, ix1, iy1, ix2, iy2 };
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#0B0B0C' }}>
      <div className="p-4 sm:p-6 pb-24 space-y-4 animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2" style={{ color: '#E8E8E8' }}>
            <span style={{ color: '#C89B3C' }}>🌸</span>
            Rania's Cycle
          </h2>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: '#A8A8A8' }}>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: '#4ADE80', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }}
            />
            Day {currentDay} of {CYCLE_LENGTH} &nbsp;·&nbsp; {currentPhase.name} phase
          </p>
        </div>

        {/* ── Wheel Card ── */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)',
            border: '1px solid #2A2A30',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex flex-col items-center p-4 sm:p-6">
            <svg width="310" height="310" viewBox="0 0 310 310" style={{ overflow: 'visible' }}>
              <defs>
                {PHASES.map(p => (
                  <radialGradient key={p.name} id={`cg-${p.name}`} cx="50%" cy="50%" r="50%">
                    <stop offset="20%" stopColor={p.color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={p.color} stopOpacity="0.04" />
                  </radialGradient>
                ))}
              </defs>

              {/* Phase arc fills */}
              {PHASES.map(p => {
                const { sa, ea, large, ox1, oy1, ox2, oy2, ix1, iy1, ix2, iy2 } =
                  buildArcPath(p.days[0], p.days[p.days.length - 1]);
                const isActive = p.days.includes(selectedDay);
                return (
                  <path
                    key={p.name}
                    d={`M${ox1},${oy1} A${outerR},${outerR} 0 ${large},1 ${ox2},${oy2} L${ix2},${iy2} A${innerR},${innerR} 0 ${large},0 ${ix1},${iy1} Z`}
                    fill={isActive ? `url(#cg-${p.name})` : 'rgba(255,255,255,0.015)'}
                    stroke={isActive ? p.color : '#2A2A30'}
                    strokeWidth={isActive ? 1.5 : 0.5}
                    style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={() => setSelectedDay(p.days[Math.floor(p.days.length / 2)])}
                  />
                );
              })}

              {/* Phase name labels */}
              {PHASES.map(p => {
                const mid   = p.days[Math.floor(p.days.length / 2)];
                const angle = ((mid - 0.5) / CYCLE_LENGTH) * 2 * Math.PI - Math.PI / 2;
                const r     = (outerR + innerR) / 2;
                const isActive = p.days.includes(selectedDay);
                return (
                  <text
                    key={p.name}
                    x={cx + r * Math.cos(angle)}
                    y={cy + r * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={7.5}
                    fontWeight="700"
                    fill={isActive ? p.color : '#484850'}
                    style={{ cursor: 'pointer', transition: 'fill 0.3s', letterSpacing: 0.5 }}
                    onClick={() => setSelectedDay(p.days[Math.floor(p.days.length / 2)])}
                  >
                    {p.name.toUpperCase()}
                  </text>
                );
              })}

              {/* Day dots */}
              {Array.from({ length: CYCLE_LENGTH }, (_, i) => {
                const day   = i + 1;
                const angle = ((day - 0.5) / CYCLE_LENGTH) * 2 * Math.PI - Math.PI / 2;
                const x     = cx + dotR * Math.cos(angle);
                const y     = cy + dotR * Math.sin(angle);
                const p     = getPhaseForDay(day);
                const isToday = day === currentDay;
                const isSel   = day === selectedDay;

                return (
                  <g key={day} onClick={() => setSelectedDay(day)} style={{ cursor: 'pointer' }}>
                    {isToday && (
                      <circle cx={x} cy={y} r={6} fill="none" stroke={p.color} strokeWidth={1} opacity={0}>
                        <animate attributeName="r"       from="6"  to="14" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.5" to="0"  dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={x} cy={y}
                      r={isToday ? 8 : isSel ? 6.5 : 4.5}
                      fill={isToday || isSel ? p.color : '#1A1A1C'}
                      stroke={p.color}
                      strokeWidth={isToday ? 2 : 1}
                      opacity={isToday || isSel ? 1 : 0.55}
                    />
                    {(isToday || day % 7 === 1) && (
                      <text
                        x={x} y={y + 0.5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={isToday ? 7 : 6}
                        fill={isToday ? '#0B0B0C' : '#666'}
                        fontWeight={isToday ? 'bold' : 'normal'}
                      >
                        {day}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Center */}
              <circle cx={cx} cy={cy} r={innerR - 2} fill="#0B0B0C" stroke="#2A2A30" strokeWidth={1} />
              <text x={cx} y={cy - 16} textAnchor="middle" dominantBaseline="middle" fontSize={24}>
                {phase.icon}
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
                fontSize={20} fontWeight="700" fill={phase.color}>
                {selectedDay}
              </text>
              <text x={cx} y={cy + 24} textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fill="#A8A8A8">
                {selectedDay === currentDay
                  ? 'today'
                  : selectedDay < currentDay
                    ? `${currentDay - selectedDay}d ago`
                    : `in ${selectedDay - currentDay}d`}
              </text>
            </svg>

            {/* Day navigator */}
            <div className="flex items-center gap-4 mt-1">
              <button
                onClick={() => setSelectedDay(d => d === 1 ? CYCLE_LENGTH : d - 1)}
                className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                style={{ border: '1px solid #2A2A30', padding: '4px 8px', color: '#A8A8A8', background: 'none', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-center" style={{ color: '#A8A8A8', minWidth: 130 }}>
                Day {selectedDay} · {phase.name}
              </span>
              <button
                onClick={() => setSelectedDay(d => d === CYCLE_LENGTH ? 1 : d + 1)}
                className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                style={{ border: '1px solid #2A2A30', padding: '4px 8px', color: '#A8A8A8', background: 'none', cursor: 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {PHASES.map(p => (
                <button
                  key={p.name}
                  onClick={() => setSelectedDay(p.days[Math.floor(p.days.length / 2)])}
                  className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 5px ${p.color}80` }} />
                  <span className="text-xs" style={{ color: '#A8A8A8' }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mood Card ── */}
        <div
          className="rounded-xl p-5"
          style={{
            background:  `linear-gradient(135deg, ${phase.bg}, rgba(34,34,40,0.95))`,
            border:      `1.5px solid ${phase.border}`,
            boxShadow:   `0 6px 28px ${phase.glow}`,
            opacity:     visible ? 1 : 0,
            transform:   visible ? 'translateY(0)' : 'translateY(10px)',
            transition:  'opacity 0.35s ease, transform 0.35s ease',
          }}
        >
          {/* Header row */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background: `radial-gradient(circle, ${phase.color}35, ${phase.color}10)`,
                border:     `1.5px solid ${phase.border}`,
              }}
            >
              {phase.icon}
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#A8A8A8' }}>
                {phase.name} phase · Day {daysIntoPhase} of {phase.days.length}
              </div>
              <div className="text-lg font-bold" style={{ color: phase.color }}>
                {phase.moodSummary}
              </div>
            </div>
          </div>

          {/* Energy bar */}
          <EnergyBar level={phase.energy} color={phase.color} />

          {/* Mood tags */}
          <div className="flex flex-wrap gap-2 my-4">
            {phase.moods.map((m, i) => (
              <span
                key={i}
                className="text-xs font-medium rounded-full px-3 py-1"
                style={{
                  background: `${phase.color}18`,
                  border:     `1px solid ${phase.border}`,
                  color:      phase.color,
                }}
              >
                {m}
              </span>
            ))}
          </div>

          {/* Description */}
          <p
            className="text-sm leading-relaxed mb-4 pt-4"
            style={{
              color:       '#D0D0D0',
              borderTop:   `1px solid ${phase.color}22`,
            }}
          >
            {phase.moodDesc}
          </p>

          {/* Tips */}
          <div className="text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: '#A8A8A8' }}>
            How to support her
          </div>
          <div className="space-y-2">
            {phase.tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(0,0,0,0.25)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: phase.color }} />
                <span className="text-sm leading-snug" style={{ color: '#E0E0E0' }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cycle Progress Bar ── */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)',
            border:     '1px solid #2A2A30',
            opacity:    visible ? 1 : 0,
            transition: 'opacity 0.4s ease 0.1s',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#A8A8A8' }}>
              Cycle Progress
            </span>
            <span className="text-xs" style={{ color: '#A8A8A8' }}>
              Day {currentDay} / {CYCLE_LENGTH}
            </span>
          </div>

          {/* Segmented bar */}
          <div className="flex gap-1 h-2">
            {PHASES.map(p => {
              const isActive = p.days.includes(currentDay);
              return (
                <div
                  key={p.name}
                  className="rounded relative"
                  style={{
                    flex:       p.days.length,
                    background: isActive ? p.color : `${p.color}30`,
                    boxShadow:  isActive ? `0 0 8px ${p.color}80` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute rounded-full border-2"
                      style={{
                        right:     -1,
                        top:       '50%',
                        transform: 'translateY(-50%)',
                        width:     12,
                        height:    12,
                        background: p.color,
                        boxShadow:  `0 0 8px ${p.color}`,
                        borderColor: '#0B0B0C',
                        zIndex: 1,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex mt-1.5">
            {PHASES.map(p => (
              <div key={p.name} className="text-center" style={{ flex: p.days.length }}>
                <span
                  className="text-[9px]"
                  style={{
                    fontWeight: p.days.includes(currentDay) ? 700 : 400,
                    color:      p.days.includes(currentDay) ? p.color : '#484850',
                  }}
                >
                  {p.name.slice(0, 3).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Next Phase Card ── */}
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #1A1A1C 0%, #222228 100%)',
            border:     '1px solid #2A2A30',
            opacity:    visible ? 1 : 0,
            transition: 'opacity 0.4s ease 0.2s',
          }}
        >
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#A8A8A8' }}>
              Coming up next
            </div>
            <div className="text-base font-bold mb-1" style={{ color: nextPhase.color }}>
              {nextPhase.icon} {nextPhase.name} phase
            </div>
            <div className="text-xs" style={{ color: '#A8A8A8' }}>{nextPhase.moodSummary}</div>
          </div>
          <div
            className="text-center rounded-xl px-4 py-2 ml-4"
            style={{
              minWidth:   64,
              background: `${nextPhase.color}15`,
              border:     `1px solid ${nextPhase.border}`,
            }}
          >
            <div className="text-2xl font-bold leading-none" style={{ color: nextPhase.color }}>
              {daysLeftInPhase}
            </div>
            <div className="text-[10px] mt-1" style={{ color: '#A8A8A8' }}>
              {daysLeftInPhase === 1 ? 'day left' : 'days left'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CycleTab;
