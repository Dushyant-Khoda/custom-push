'use client'

import React, { createContext, useState, useCallback, useRef, useEffect } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, onMessage, Unsubscribe } from 'firebase/messaging'
import { PushConfig, PushMessage, PushContextValue, BrowserSupport } from './types'
import { getPushToken } from './getPushToken'

export const PushContext = createContext<PushContextValue | null>(null)

interface CustomPushProviderProps {
  config: PushConfig
  children: React.ReactNode
  /**
   * Called when a foreground message arrives and the tab IS active.
   * Use this to show an in-app toast instead of a native notification.
   * If not provided, foreground messages are silently added to the messages array.
   */
  onToast?: (message: PushMessage) => void
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
  // Safari: has "Safari" in UA but NOT Chrome/Chromium/Edge/Opera/Firefox iOS
  const isSafari = /^((?!chrome|android|crios|fxios|edgios|opr|firefox).)*safari/i.test(ua)

  let safariVersion: number | null = null
  if (isSafari) {
    const match = ua.match(/version\/(\d+)/i)
    safariVersion = match ? parseInt(match[1], 10) : null
  }

  if (!('serviceWorker' in navigator)) {
    return {
      isSupported: false,
      isSafari,
      safariVersion,
      requiresUserGesture: isSafari,
      reason: 'Service Workers are not supported in this browser',
    }
  }

  if (!('Notification' in window)) {
    return {
      isSupported: false,
      isSafari,
      safariVersion,
      requiresUserGesture: isSafari,
      reason: 'Notification API is not supported in this browser',
    }
  }

  if (!('PushManager' in window)) {
    if (isSafari && safariVersion !== null && safariVersion < 16) {
      return {
        isSupported: false,
        isSafari,
        safariVersion,
        requiresUserGesture: true,
        reason: `Safari ${safariVersion} does not support Web Push. Please update to Safari 16 or later.`,
      }
    }
    return {
      isSupported: false,
      isSafari,
      safariVersion,
      requiresUserGesture: isSafari,
      reason: 'Push API is not supported in this browser',
    }
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

// ── Main Provider ──────────────────────────────────────────────────────────
export function CustomPushProvider({ config, children, onToast }: CustomPushProviderProps) {
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<PushMessage[]>([])
  const [isPermissionGranted, setIsPermissionGranted] = useState(
    typeof window !== 'undefined' ? Notification.permission === 'granted' : false
  )
  const [isTabActive, setIsTabActive] = useState(true)

  const initialized = useRef(false)
  const messagingUnsubRef = useRef<Unsubscribe | null>(null)
  const [browserSupport] = useState<BrowserSupport>(() => detectBrowserSupport())
  const isSupported = browserSupport.isSupported

  // ── Tab Visibility ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handler = () => setIsTabActive(document.visibilityState === 'visible')
    setIsTabActive(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // ── Internal: initialize Firebase messaging & foreground listener ──────
  const initMessaging = useCallback(async (): Promise<void> => {
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(config)
      const messaging = getMessaging(app)

      // Get and register FCM token
      const fcmToken = await getPushToken(config)
      if (fcmToken) {
        setToken(fcmToken)

        // Register token with backend
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
              `\n  → URL: ${config.registerUrl}`,
              '\n  → Token will still work for push delivery, but may not be saved server-side.'
            )
          }
        }
      } else {
        console.warn(
          '[custom-push] Could not retrieve FCM token. ' +
          'Push notifications may not work. Check VAPID key and service worker path.'
        )
      }

      // Tear down previous listener before setting a new one (prevents duplicates on re-renders)
      if (messagingUnsubRef.current) {
        messagingUnsubRef.current()
      }

      // Set up foreground message listener
      messagingUnsubRef.current = onMessage(messaging, (payload) => {
        const newMessage = buildMessage(payload)

        // Active tab → show in-app toast; inactive tab → native notification is shown by SW
        if (document.visibilityState === 'visible' && onToast) {
          try {
            onToast(newMessage)
          } catch (toastErr: any) {
            console.error('[custom-push] onToast callback threw an error:', toastErr.message)
          }
        }

        setMessages(prev => [...prev, newMessage])
      })
    } catch (err: any) {
      console.error(
        '[custom-push] Firebase messaging initialization failed:',
        err.message,
        '\n  → Check your Firebase config (apiKey, appId, etc.)',
        '\n  → Check that the service worker file exists in /public/'
      )
    }
  }, [config, onToast]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Permission Request ────────────────────────────────────────────────
  // MUST be called from a user gesture (button click) — required for Safari
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[custom-push] Push notifications not supported:', browserSupport.reason)
      return false
    }

    // Already initialized — don't double-init
    if (token) {
      console.info('[custom-push] Push already initialized. Token:', token.slice(0, 12) + '...')
      return true
    }

    let result: NotificationPermission
    try {
      result = await Notification.requestPermission()
    } catch (permErr: any) {
      // Safari throws if called outside a user gesture
      console.error(
        '[custom-push] Permission request failed:',
        permErr.message,
        '\n  → Ensure requestPermission() is called directly inside a click handler',
        '\n  → Safari does not allow requesting permission programmatically'
      )
      return false
    }

    if (result === 'denied') {
      console.warn(
        '[custom-push] Notification permission denied by user. ' +
        'They must re-enable in browser settings.'
      )
      setIsPermissionGranted(false)
      return false
    }

    if (result === 'default') {
      // User dismissed the prompt without choosing
      console.info('[custom-push] Notification permission dismissed. Ask again when appropriate.')
      return false
    }

    // result === 'granted'
    setIsPermissionGranted(true)
    await initMessaging()
    return true
  }, [isSupported, token, browserSupport.reason, initMessaging])

  // ── Auto-init for already-granted permissions (no user gesture needed) ─
  useEffect(() => {
    if (initialized.current || !isSupported) return
    initialized.current = true

    if (Notification.permission === 'granted') {
      setIsPermissionGranted(true)
      initMessaging()
    }
    // Don't auto-request permission — especially important for Safari
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup foreground listener on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (messagingUnsubRef.current) {
        messagingUnsubRef.current()
        messagingUnsubRef.current = null
      }
    }
  }, [])

  // ── sendMessage (via backend) ─────────────────────────────────────────
  const sendMessage = useCallback(
    async (title: string, body: string, data?: Record<string, string>): Promise<void> => {
      if (!token) {
        throw new Error(
          '[custom-push] No push token available. Call requestPermission() first and wait for it to resolve.'
        )
      }
      if (!config.registerUrl) {
        throw new Error(
          '[custom-push] No registerUrl configured in PushConfig. ' +
          'Set config.registerUrl to your backend endpoint.'
        )
      }

      const sendUrl = config.registerUrl.replace(/\/register\/?$/, '/send')

      try {
        const res = await fetch(sendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, title, body, data }),
        })
        if (!res.ok) {
          throw new Error(`Backend returned HTTP ${res.status}`)
        }
      } catch (sendErr: any) {
        console.error('[custom-push] sendMessage failed:', sendErr.message, `\n  → URL: ${sendUrl}`)
        throw sendErr
      }
    },
    [token, config.registerUrl]
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  return (
    <PushContext.Provider
      value={{
        token,
        messages,
        sendMessage,
        clearMessages,
        isSupported,
        isPermissionGranted,
        isTabActive,
        browserSupport,
        requestPermission,
      }}
    >
      {children}
    </PushContext.Provider>
  )
}
