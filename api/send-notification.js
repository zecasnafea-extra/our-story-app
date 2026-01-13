// api/send-notification.js - UPDATED FOR FCM V1 API
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin (only once)
let adminApp;
try {
  if (!adminApp) {
    // Service account credentials from environment variables
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });
  }
} catch (error) {
  console.log('Admin already initialized or error:', error.message);
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { token, title, body, type } = req.body;

    // Validate input
    if (!token || !title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: token, title, body' 
      });
    }

    console.log('📤 Sending FCM V1 notification:', { title, body, type });

    // Send using Firebase Admin SDK
    const message = {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: type || 'general',
        timestamp: Date.now().toString()
      },
      webpush: {
        notification: {
          icon: '❤️',
          badge: '❤️',
          requireInteraction: true,
          vibrate: [200, 100, 200]
        },
        fcmOptions: {
          link: 'https://our-story-app-silk.vercel.app'
        }
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'our_story_notifications',
          icon: 'heart_icon',
          color: '#ec4899'
        }
      }
    };

    const messaging = getMessaging(adminApp);
    const response = await messaging.send(message);

    console.log('✅ FCM notification sent successfully:', response);
    return res.status(200).json({ 
      success: true, 
      messageId: response 
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
