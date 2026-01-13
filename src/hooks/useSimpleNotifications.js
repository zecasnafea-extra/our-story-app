import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useSimpleNotifications = (currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get current user name
  const getCurrentUserName = () => {
    if (!currentUser) return null;
    const email = currentUser.email.toLowerCase();
    return email.includes('zeyad') ? 'Zeyad' : 'Rania';
  };

  const getPartnerName = () => {
    if (!currentUser) return null;
    const email = currentUser.email.toLowerCase();
    return email.includes('zeyad') ? 'Rania' : 'Zeyad';
  };

  // Listen for notifications
  useEffect(() => {
    if (!currentUser) return;

    const userName = getCurrentUserName();
    console.log('🔔 Setting up notification listener for:', userName);
    
    const q = query(
      collection(db, 'notifications'),
      where('to', '==', userName),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    let isFirstLoad = true;
    const previousNotificationIds = new Set();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      let unread = 0;
      const newNotifications = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const notification = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
        
        notifs.push(notification);
        
        if (!data.read) {
          unread++;
          // Check if this is a truly new notification (not from initial load)
          if (!isFirstLoad && !previousNotificationIds.has(doc.id)) {
            newNotifications.push(notification);
          }
        }

        previousNotificationIds.add(doc.id);
      });

      setNotifications(notifs);
      setUnreadCount(unread);

      console.log('📬 Notifications updated:', {
        total: notifs.length,
        unread: unread,
        newCount: newNotifications.length,
        isFirstLoad
      });

      // Show browser notification ONLY for truly new notifications
      if (!isFirstLoad && newNotifications.length > 0 && Notification.permission === 'granted') {
        console.log('🔔 Showing browser notification for:', newNotifications[0]);
        newNotifications.forEach(notif => {
          new Notification(notif.title, {
            body: notif.body,
            icon: '❤️',
            badge: '❤️',
            tag: notif.id // Prevent duplicate notifications
          });
        });
      }

      isFirstLoad = false;
    });

    return () => {
      console.log('🔕 Cleaning up notification listener');
      unsubscribe();
    };
  }, [currentUser]);

  // Request browser notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      console.log('🔔 Current notification permission:', Notification.permission);
      
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Permission result:', permission);
        return permission === 'granted';
      }
      
      return Notification.permission === 'granted';
    }
    console.log('❌ Browser notifications not supported');
    return false;
  };

  // Send notification to partner
  const sendNotification = async (title, body, type = 'general') => {
    try {
      const partnerName = getPartnerName();
      const userName = getCurrentUserName();

      console.log('📤 Sending notification:', {
        from: userName,
        to: partnerName,
        title,
        body,
        type
      });

      await addDoc(collection(db, 'notifications'), {
        to: partnerName,
        from: userName,
        title,
        body,
        type,
        read: false,
        createdAt: serverTimestamp()
      });

      console.log(`✅ Notification sent to ${partnerName}`);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    requestPermission,
    sendNotification
  };
};

// Quick notification templates (keep this exactly as you have it)
export const NotificationTemplates = {
  wishAdded: () => ({
    title: '💝 New Wish!',
    body: 'Your partner added a new wish to the jar',
    type: 'wish'
  }),

  timelineAdded: (eventTitle) => ({
    title: '✨ New Memory',
    body: `${eventTitle} was added to the timeline`,
    type: 'timeline'
  }),

  dateAdded: (dateTitle) => ({
    title: '💕 New Date Idea',
    body: dateTitle,
    type: 'date'
  }),

  dateCompleted: (dateTitle) => ({
    title: '🎉 Date Completed',
    body: `${dateTitle} - What a great time!`,
    type: 'date'
  }),

  noteUpdated: (userName) => ({
    title: '💌 Note Updated',
    body: `${userName} wrote something for you`,
    type: 'note'
  }),

  watchPlayAdded: (title, type) => {
    const emoji = type === 'movie' ? '🎬' : type === 'series' ? '📺' : '🎮';
    return {
      title: `${emoji} Added to Watch & Play`,
      body: title,
      type: 'watchplay'
    };
  },

  episodeWatched: (seriesTitle) => ({
    title: '📺 Episode Completed',
    body: `Your partner watched an episode of ${seriesTitle}`,
    type: 'watchplay'
  }),

  wishRevealed: (wishText) => ({
    title: '✨ Wish Revealed',
    body: 'Your partner revealed a wish!',
    type: 'wish'
  })
};
