import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Auth from './components/Auth/Auth';
import Navigation from './components/Navigation/Navigation';
import NotificationBell from './components/NotificationBell/NotificationBell';
import Home from './components/Pages/Home';
import Timeline from './components/Pages/Timeline.jsx';
import WishJar from './components/Pages/WishJar';
import DatePlanner from './components/Pages/DatePlanner';
import WatchPlayList from './components/Pages/WatchPlayList';
import RamadanTracker from './components/Pages/RamadanTracker';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0B0B0C' }}>
      <header
        className="text-white p-5 sticky top-0 z-10"
        style={{
          background: 'linear-gradient(135deg, #1A1A1C 0%, #2A2010 50%, #1A1A1C 100%)',
          borderBottom: '1px solid rgba(200, 155, 60, 0.25)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 1px 0 rgba(200,155,60,0.15)'
        }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: '#C89B3C' }}>
            🌙 Our Story
          </h1>
          <NotificationBell />
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {activeTab === 'home'       && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'timeline'   && <Timeline />}
        {activeTab === 'wishes'     && <WishJar />}
        {activeTab === 'dates'      && <DatePlanner />}
        {activeTab === 'watch-play' && <WatchPlayList />}
        {activeTab === 'ramadan'    && <RamadanTracker />}
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
