// api/send-notification.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers - allow requests from your app
  res.setHeader('Access-Control-Allow-Origin', 'https://our-story-app-silk.vercel.app');
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

    console.log('📤 Sending FCM notification:', { title, body, type });

    // YOUR FCM SERVER KEY - Replace this!
    const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || 'PASTE_YOUR_SERVER_KEY_HERE';

    if (FCM_SERVER_KEY === 'PASTE_YOUR_SERVER_KEY_HERE') {
      return res.status(500).json({ 
        error: 'FCM_SERVER_KEY not configured' 
      });
    }

    // Send to FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title,
          body: body,
          icon: '❤️',
          click_action: 'https://our-story-app-silk.vercel.app'
        },
        data: {
          type: type || 'general',
          timestamp: Date.now().toString()
        },
        priority: 'high',
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            badge: '❤️',
            requireInteraction: true,
            vibrate: [200, 100, 200]
          }
        }
      })
    });

    const result = await fcmResponse.json();

    if (result.success === 1) {
      console.log('✅ FCM notification sent successfully');
      return res.status(200).json({ 
        success: true, 
        message: 'Notification sent' 
      });
    } else {
      console.error('❌ FCM error:', result);
      return res.status(500).json({ 
        success: false, 
        error: result 
      });
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
