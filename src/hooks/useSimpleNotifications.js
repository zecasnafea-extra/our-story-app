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
    
    const q = query(
      collection(db, 'notifications'),
      where('to', '==', userName),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        notifs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });
        
        if (!data.read) unread++;
      });

      setNotifications(notifs);
      setUnreadCount(unread);

      // Show browser notification for new unread
      if (unread > 0 && Notification.permission === 'granted') {
        const latestUnread = notifs.find(n => !n.read);
        if (latestUnread) {
          new Notification(latestUnread.title, {
            body: latestUnread.body,
            icon: '❤️'
          });
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Request browser notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Send notification to partner
  const sendNotification = async (title, body, type = 'general') => {
    try {
      const partnerName = getPartnerName();
      const userName = getCurrentUserName();

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
      console.error('Error sending notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    requestPermission,
    sendNotification
  };
};

// Quick notification templates
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
