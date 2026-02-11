import React from 'react';
import { Heart, Sparkles, Gift, Calendar, Tv, Moon } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: Heart, label: 'Home' },
    { id: 'timeline', icon: Sparkles, label: 'Timeline' },
    { id: 'wishes', icon: Gift, label: 'Wishes' },
    { id: 'dates', icon: Calendar, label: 'Dates' },
    { id: 'watch-play', icon: Tv, label: 'Watch' },
    { id: 'ramadan', icon: Moon, label: 'Ramadan' },  // ← ADDED THIS
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex justify-around py-3">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 ${
              activeTab === id ? 'text-pink-600 scale-110' : 'text-gray-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
