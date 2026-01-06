import React from 'react';
import { Heart, Sparkles, Gift, Calendar, Image } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: Heart, label: 'Home' },
    { id: 'timeline', icon: Sparkles, label: 'Timeline' },
    { id: 'wishes', icon: Gift, label: 'Wishes' },
    { id: 'dates', icon: Calendar, label: 'Dates' },
    { id: 'photos', icon: Image, label: 'Photos' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex justify-around items-center py-3">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
              activeTab === id
                ? 'text-pink-600 scale-110'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;