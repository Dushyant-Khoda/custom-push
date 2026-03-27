/**
 * ──────────────────────────────────────────────────────────────────────────
 * CustomPush — FCM Notification Engine (TypeScript)
 * ──────────────────────────────────────────────────────────────────────────
 * This helper provides a robust interface for sending push notifications 
 * using the Firebase Admin SDK.
 * 
 * 🚀 QUICK START (Test with static data):
 * 
 * import { sendPushNotification } from './FCMHelper'; // or pushHelper
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

import * as admin from 'firebase-admin';
import * as path from 'path';
const ourPkg = require('../our_pkg.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const credentialsPath = path.resolve(ourPkg.backend.credentialsPath ?? './credentials.json');
  try {
    admin.initializeApp({
      credential: admin.credential.cert(credentialsPath),
    });
  } catch (error: any) {
    console.error(' [CustomPush] Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

export interface PushNotificationParams {
  /** The recipient's FCM registration token */
  token: string;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** App route to open on click (e.g., '/settings') */
  route?: string;
  /** Custom icon path (Relative to public/ or absolute URL). Recommended size: 192x192px. */
  icon?: string;
  /** Additional custom key-value pairs */
  data?: Record<string, string>;
}

/**
 * Sends a push notification to a specific device.
 * 
 * 💡 BEST PRACTICES:
 * - Icons: Recommended size is 192x192px (PNG).
 * - Payload: Keep 'data' keys small to avoid truncation (4KB limit).
 * - VAPID: Ensure your VAPID key is correctly configured in Firebase for Safari support.
 */
export async function sendPushNotification(params: PushNotificationParams): Promise<string> {
  const { 
    token, 
    title, 
    body, 
    route = '/', 
    icon = '/icon.png', 
    data = {} 
  } = params;

  if (!token) throw new Error('Recipient token is required');

  const message: admin.messaging.Message = {
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
      },
      fcmOptions: {
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
