import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import { PushConfig } from './types'

export async function getPushToken(config: PushConfig): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null

  try {
    const app: FirebaseApp = getApps().length
      ? getApps()[0]
      : initializeApp(config)

    const messaging = getMessaging(app)
    const swPath = config.serviceWorkerPath || '/firebase-messaging-sw.js'
    const registration = await navigator.serviceWorker.register(swPath)
    const token = await getToken(messaging, {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: registration,
    })
    return token ?? null
  } catch {
    return null
  }
}
