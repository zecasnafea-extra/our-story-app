import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useSimpleNotifications } from '../../hooks/useSimpleNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount, requestPermission } = useSimpleNotifications(currentUser);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Request permission on first load
  useEffect(() => {
    if (!hasRequestedPermission && currentUser) {
      requestPermission();
      setHasRequestedPermission(true);
    }
  }, [currentUser, hasRequestedPermission, requestPermission]);

  // Debug: Log when notifications change
  useEffect(() => {
    console.log('🔔 NotificationBell - notifications updated:', {
      count: notifications.length,
      unread: unreadCount,
      notifications: notifications.map(n => ({ id: n.id, title: n.title, read: n.read }))
    });
  }, [notifications, unreadCount]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell size={24} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-white text-xs underline hover:opacity-80"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-pink-50' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notif.id);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-gray-600 text-xs mb-2">
                            {notif.body}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {getTimeAgo(notif.createdAt)}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
