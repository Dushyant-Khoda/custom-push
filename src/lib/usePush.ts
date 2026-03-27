import { useEffect, useRef, useState, useCallback } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, onMessage, Unsubscribe } from 'firebase/messaging'
import { PushConfig, PushMessage, BrowserSupport } from './types'
import { getPushToken } from './getPushToken'

interface UsePushOptions {
  config: PushConfig
  onMessage?: (message: PushMessage) => void
  onTokenChange?: (token: string) => void
  /**
   * Called when a foreground message arrives and the tab IS active.
   * Use this to show an in-app toast instead of a native notification.
   */
  onToast?: (message: PushMessage) => void
}

interface UsePushReturn {
  token: string | null
  isPermissionGranted: boolean
  isTabActive: boolean
  browserSupport: BrowserSupport
  requestPermission: () => Promise<boolean>
}

// ── Safari / Browser Detection ─────────────────────────────────────────────
function detectBrowserSupport(): BrowserSupport {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      isSafari: false,
      safariVersion: null,
      requiresUserGesture: false,
      reason: 'Server-side rendering (SSR) — push notifications require a browser',
    }
  }

  const ua = navigator.userAgent
  const isSafari = /^((?!chrome|android|crios|fxios|edgios|opr|firefox).)*safari/i.test(ua)

  let safariVersion: number | null = null
  if (isSafari) {
    const match = ua.match(/version\/(\d+)/i)
    safariVersion = match ? parseInt(match[1], 10) : null
  }

  if (!('serviceWorker' in navigator)) {
    return { isSupported: false, isSafari, safariVersion, requiresUserGesture: isSafari, reason: 'Service Workers are not supported in this browser' }
  }
  if (!('Notification' in window)) {
    return { isSupported: false, isSafari, safariVersion, requiresUserGesture: isSafari, reason: 'Notification API is not supported in this browser' }
  }
  if (!('PushManager' in window)) {
    if (isSafari && safariVersion !== null && safariVersion < 16) {
      return { isSupported: false, isSafari, safariVersion, requiresUserGesture: true, reason: `Safari ${safariVersion} does not support Web Push. Update to Safari 16+.` }
    }
    return { isSupported: false, isSafari, safariVersion, requiresUserGesture: isSafari, reason: 'Push API is not supported in this browser' }
  }

  return { isSupported: true, isSafari, safariVersion, requiresUserGesture: isSafari }
}

// ── Shared message builder ─────────────────────────────────────────────────
function buildMessage(payload: any): PushMessage {
  const messageUrl =
    payload.data?.action_url ||
    payload.data?.url ||
    payload.data?.route ||
    payload.data?.click_action ||
    payload.fcmOptions?.link ||
    undefined

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.notification?.title || payload.data?.title || 'New notification',
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || payload.data?.icon,
    url: messageUrl,
    data: payload.data as Record<string, string> | undefined,
    payload,
    timestamp: Date.now(),
  }
}

export function usePush({ config, onMessage: onMsg, onTokenChange, onToast }: UsePushOptions): UsePushReturn {
  const initialized = useRef(false)
  const messagingUnsubRef = useRef<Unsubscribe | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isPermissionGranted, setIsPermissionGranted] = useState(
    typeof window !== 'undefined' ? Notification.permission === 'granted' : false
  )
  const [isTabActive, setIsTabActive] = useState(true)
  const [browserSupport] = useState<BrowserSupport>(() => detectBrowserSupport())

  // ── Tab Visibility ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handler = () => setIsTabActive(document.visibilityState === 'visible')
    setIsTabActive(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // ── Internal: initialize Firebase messaging & foreground listener ──────
  const initializeMessaging = useCallback(async (): Promise<void> => {
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(config)
      const messaging = getMessaging(app)

      const fcmToken = await getPushToken(config)
      if (fcmToken) {
        setToken(fcmToken)
        onTokenChange?.(fcmToken)

        if (config.registerUrl) {
          try {
            const res = await fetch(config.registerUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: fcmToken }),
            })
            if (!res.ok) {
              console.warn(
                `[custom-push] Backend token registration returned ${res.status}. ` +
                `Check your registerUrl: ${config.registerUrl}`
              )
            }
          } catch (backendErr: any) {
            console.error(
              '[custom-push] Failed to register token with backend:',
              backendErr.message,
              `\n  → URL: ${config.registerUrl}`
            )
          }
        }
      } else {
        console.warn(
          '[custom-push] Could not retrieve FCM token. ' +
          'Check VAPID key and service worker path.'
        )
      }

      // Tear down previous listener before adding new one (prevents duplicates)
      if (messagingUnsubRef.current) {
        messagingUnsubRef.current()
      }

      messagingUnsubRef.current = onMessage(messaging, (payload) => {
        const message = buildMessage(payload)

        if (document.visibilityState === 'visible' && onToast) {
          try {
            onToast(message)
          } catch (toastErr: any) {
            console.error('[custom-push] onToast callback threw:', toastErr.message)
          }
        }

        onMsg?.(message)
      })
    } catch (err: any) {
      console.error(
        '[custom-push] Messaging initialization failed:',
        err.message,
        '\n  → Check Firebase config and service worker path'
      )
    }
  }, [config, onMsg, onTokenChange, onToast]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Permission Request (must be from user gesture for Safari) ─────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!browserSupport.isSupported) {
      console.warn('[custom-push] Push not supported:', browserSupport.reason)
      return false
    }

    if (token) {
      console.info('[custom-push] Already initialized. Token:', token.slice(0, 12) + '...')
      return true
    }

    let result: NotificationPermission
    try {
      result = await Notification.requestPermission()
    } catch (permErr: any) {
      console.error(
        '[custom-push] Permission request failed:',
        permErr.message,
        '\n  → Call requestPermission() directly inside a click handler',
        '\n  → Safari requires a user gesture to request notification permission'
      )
      return false
    }

    if (result === 'denied') {
      console.warn('[custom-push] Permission denied. User must re-enable in browser settings.')
      setIsPermissionGranted(false)
      return false
    }

    if (result === 'default') {
      console.info('[custom-push] Permission dismissed by user.')
      return false
    }

    // granted
    setIsPermissionGranted(true)
    await initializeMessaging()
    return true
  }, [browserSupport, token, initializeMessaging])

  // ── Auto-init for already-granted permissions ─────────────────────────
  useEffect(() => {
    if (initialized.current || !browserSupport.isSupported) return
    initialized.current = true

    if (Notification.permission === 'granted') {
      setIsPermissionGranted(true)
      initializeMessaging()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (messagingUnsubRef.current) {
        messagingUnsubRef.current()
        messagingUnsubRef.current = null
      }
    }
  }, [])

  return { token, isPermissionGranted, isTabActive, browserSupport, requestPermission }
}
