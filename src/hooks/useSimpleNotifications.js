import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db, messaging, VAPID_KEY } from '../firebase/config';
import { getToken, onMessage } from 'firebase/messaging';

export const useSimpleNotifications = (currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fcmToken, setFcmToken] = useState(null);

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

  // Request FCM token and save to Firestore
  const requestFCMToken = async () => {
    if (!messaging) {
      console.log('❌ FCM not supported on this browser');
      return null;
    }

    try {
      console.log('🔑 Requesting FCM token...');
      
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registered');

      // Request permission
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);

      if (permission !== 'granted') {
        console.log('❌ Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      console.log('✅ FCM Token received:', token);

      // Save token to Firestore for this user
      const userName = getCurrentUserName();
      if (userName && currentUser) {
        await setDoc(doc(db, 'fcmTokens', currentUser.uid), {
          token,
          user: userName,
          updatedAt: serverTimestamp()
        });
        console.log('✅ FCM Token saved to Firestore');
      }

      setFcmToken(token);
      return token;

    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload);

      const title = payload.notification?.title || payload.data?.title || 'New Notification';
      const body = payload.notification?.body || payload.data?.body || '';

      // Show notification even when app is in foreground
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '❤️',
          badge: '❤️',
          tag: payload.data?.notificationId || 'foreground-notif'
        });
      }
    });

    return () => unsubscribe();
  }, [messaging]);

  // Listen for notifications from Firestore
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

      // Show browser notification for new notifications (fallback)
      if (!isFirstLoad && newNotifications.length > 0 && Notification.permission === 'granted') {
        console.log('🔔 Showing browser notification for:', newNotifications[0]);
        newNotifications.forEach(notif => {
          new Notification(notif.title, {
            body: notif.body,
            icon: '❤️',
            badge: '❤️',
            tag: notif.id
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

  // Request permission (browser notifications + FCM)
  const requestPermission = async () => {
    if ('Notification' in window) {
      console.log('🔔 Current notification permission:', Notification.permission);
      
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Permission result:', permission);
        
        if (permission === 'granted') {
          // Also request FCM token
          await requestFCMToken();
        }
        
        return permission === 'granted';
      }
      
      // If already granted, ensure we have FCM token
      if (Notification.permission === 'granted' && !fcmToken) {
        await requestFCMToken();
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
    sendNotification,
    fcmToken
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
