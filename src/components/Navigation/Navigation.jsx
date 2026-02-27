import React from 'react';
import { Heart, Sparkles, Gift, Calendar, Tv, Moon } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home',       icon: Heart,    label: 'Home'    },
    { id: 'timeline',   icon: Sparkles, label: 'Journey' },
    { id: 'wishes',     icon: Gift,     label: 'Wishes'  },
    { id: 'dates',      icon: Calendar, label: 'Dates'   },
    { id: 'watch-play', icon: Tv,       label: 'Watch'   },
    { id: 'ramadan',    icon: Moon,     label: 'Ramadan' },
    { id: 'cycle',      icon: () => <span style={{ fontSize: 20, lineHeight: 1 }}>🌸</span>, label: 'Cycle' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#2A2A30] shadow-2xl z-50"
      style={{ background: 'linear-gradient(to top, #0B0B0C, #15151A, #1A1A20)' }}>
      <div className="max-w-4xl mx-auto flex justify-around py-2.5">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 transition-all duration-300 px-1 ${
              activeTab === id
                ? 'text-[#C89B3C] scale-110'
                : 'text-[#6B6B70] hover:text-[#A67C52]'
            }`}
            style={activeTab === id ? { filter: 'drop-shadow(0 0 8px rgba(200,155,60,0.4))' } : {}}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
            <span className={`text-[10px] ${activeTab === id ? 'font-semibold' : 'font-normal'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
