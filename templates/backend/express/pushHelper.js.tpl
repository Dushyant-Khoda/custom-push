/**
 * ──────────────────────────────────────────────────────────────────────────
 * CustomPush — FCM Notification Engine (Node.js)
 * ──────────────────────────────────────────────────────────────────────────
 * This helper provides a robust interface for sending push notifications 
 * using the Firebase Admin SDK.
 * 
 * 🚀 QUICK START (Test with static data):
 * 
 * const { sendPushNotification } = require('./FCMHelper'); // or pushHelper
 * 
 * sendPushNotification({
 *   token: 'YOUR_DEVICE_REGISTRATION_TOKEN',
 *   title: 'Hello from CustomPush!',
 *   body: 'This is a test notification with static data.',
 *   route: '/dashboard'
 * }).then(response => console.log('Successfully sent:', response))
 *   .catch(error => console.error('Error sending:', error));
 * 
 * ──────────────────────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const path = require('path');
const ourPkg = require('../our_pkg.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const credentialsPath = path.resolve(ourPkg.backend.credentialsPath ?? './credentials.json');
  try {
    admin.initializeApp({
      credential: admin.credential.cert(credentialsPath),
    });
  } catch (error) {
    console.error(' [CustomPush] Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

/**
 * Sends a push notification to a specific device.
 * 
 * @param {Object} params - Notification parameters
 * @param {string} params.token - The recipient's FCM registration token
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body text
 * @param {string} [params.route='/'] - App route to open on click (e.g., '/settings')
 * @param {string} [params.icon='/icon.png'] - Custom icon path (Relative to public/ or absolute URL)
 * @param {Object} [params.data={}] - Additional custom key-value pairs
 * 
 * 💡 BEST PRACTICES:
 * - Icons: Recommended size is 192x192px (PNG).
 * - Payload: Keep 'data' keys small to avoid truncation (4KB limit).
 * - VAPID: Ensure your VAPID key is correctly configured in Firebase for Safari support.
 */
async function sendPushNotification(params) {
  const { 
    token, 
    title, 
    body, 
    route = '/', 
    icon = '/icon.png', 
    data = {} 
  } = params;

  if (!token) throw new Error('Recipient token is required');

  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
    // Data payload for background handling
    data: {
      ...data,
      route: route,
    },
    // Web-specific configuration
    webpush: {
      notification: {
        title: title,
        body: body,
        icon: icon,
        // Click action URL — CustomPush SW handles routing based on 'route'
        click_action: undefined, 
      },
      fcm_options: {
        // Link to open when notification is clicked
        link: route 
      }
    },
    // Android specific (optional but recommended for visibility)
    android: {
      notification: {
        icon: 'stock_ticker_update',
        color: '#7e57c2'
      }
    },
    // iOS specific (optional)
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default'
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error(' [CustomPush] FCM Send Error:', error);
    throw error;
  }
}

module.exports = { sendPushNotification };
