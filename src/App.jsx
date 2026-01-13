import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Auth from './components/Auth/Auth';
import Navigation from './components/Navigation/Navigation';
import NotificationBell from './components/NotificationBell/NotificationBell';  // ← ADD THIS
import Home from './components/Pages/Home';
import Timeline from './components/Pages/Timeline.jsx';
import WishJar from './components/Pages/WishJar';
import DatePlanner from './components/Pages/DatePlanner';
import WatchPlayList from './components/Pages/WatchPlayList';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  
  if (!currentUser) {
    return <Auth />;
  }
  
  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">  {/* ← CHANGE THIS */}
          <h1 className="text-3xl font-bold flex items-center gap-2">
            ❤️ Our Story
          </h1>
          <NotificationBell />  {/* ← ADD THIS */}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto">
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'wishes' && <WishJar />}
        {activeTab === 'dates' && <DatePlanner />}
        {activeTab === 'watch-play' && <WatchPlayList />}
      </main>
      
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
