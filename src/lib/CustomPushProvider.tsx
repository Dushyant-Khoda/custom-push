import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, onMessage } from 'firebase/messaging'
import { PushConfig, PushMessage, PushContextValue } from './types'
import { getPushToken } from './getPushToken'

export const PushContext = createContext<PushContextValue | null>(null)

interface CustomPushProviderProps {
  config: PushConfig
  children: React.ReactNode
}

export function CustomPushProvider({ config, children }: CustomPushProviderProps) {
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<PushMessage[]>([])
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const initialized = useRef(false)

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false
    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    setIsPermissionGranted(granted)
    return granted
  }, [isSupported])

  const sendMessage = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> => {
    if (!token) throw new Error('No push token available')
    // Calls your backend which then uses Firebase Admin SDK to send
    if (!config.registerUrl) throw new Error('No registerUrl configured')
    await fetch(config.registerUrl.replace('/register', '/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, data }),
    })
  }, [token, config.registerUrl])

  const clearMessages = useCallback(() => setMessages([]), [])

  useEffect(() => {
    if (!isSupported || initialized.current) return
    initialized.current = true

    ;(async () => {
      const granted = await requestPermission()
      if (!granted) return

      const app = getApps().length ? getApps()[0] : initializeApp(config)
      const messaging = getMessaging(app)

      const fcmToken = await getPushToken(config)
      if (fcmToken) {
        setToken(fcmToken)
        if (config.registerUrl) {
          await fetch(config.registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: fcmToken }),
          }).catch(() => {})
        }
      }

      onMessage(messaging, (payload) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          title: payload.notification?.title ?? '',
          body: payload.notification?.body ?? '',
          data: payload.data,
          timestamp: Date.now(),
        }])
      })
    })()
  }, [])

  return (
    <PushContext.Provider value={{ token, messages, sendMessage, clearMessages, isSupported, isPermissionGranted, requestPermission }}>
      {children}
    </PushContext.Provider>
  )
}
