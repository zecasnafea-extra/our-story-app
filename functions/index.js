// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Trigger when a new notification document is created
exports.sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    console.log('📬 New notification created:', notification);

    try {
      // Get the FCM token for the recipient
      const recipientName = notification.to;
      
      // Query users collection to find the user with this name
      const usersSnapshot = await admin.firestore()
        .collection('fcmTokens')
        .where('user', '==', recipientName)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        console.log(`❌ No FCM token found for ${recipientName}`);
        return null;
      }

      const fcmToken = usersSnapshot.docs[0].data().token;
      
      if (!fcmToken) {
        console.log(`❌ FCM token is empty for ${recipientName}`);
        return null;
      }

      console.log(`✅ Found FCM token for ${recipientName}`);

      // Prepare the message
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          notificationId: context.params.notificationId,
          type: notification.type || 'general',
          from: notification.from || 'Your partner',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'our_story_notifications',
            icon: 'heart_icon',
            color: '#ec4899' // Pink color
          }
        },
        webpush: {
          notification: {
            icon: '❤️',
            badge: '❤️',
            requireInteraction: true,
            vibrate: [200, 100, 200]
          }
        }
      };

      // Send the message
      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent successfully:', response);
      
      return response;

    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return null;
    }
  });
