import { useEffect, useRef } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, onMessage } from 'firebase/messaging'
import { PushConfig, PushMessage } from './types'
import { getPushToken } from './getPushToken'

interface UsePushOptions {
  config: PushConfig
  onMessage?: (message: PushMessage) => void
  onTokenChange?: (token: string) => void
}

export function usePush({ config, onMessage: onMsg, onTokenChange }: UsePushOptions) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    ;(async () => {
      const app = getApps().length ? getApps()[0] : initializeApp(config)
      const messaging = getMessaging(app)

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const token = await getPushToken(config)

      if (token) {
        onTokenChange?.(token)

        // Register token with backend if URL provided
        if (config.registerUrl) {
          await fetch(config.registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          }).catch(() => {})
        }
      }

      onMessage(messaging, (payload) => {
        const message: PushMessage = {
          id: Date.now().toString(),
          title: payload.notification?.title ?? '',
          body: payload.notification?.body ?? '',
          data: payload.data,
          timestamp: Date.now(),
        }
        onMsg?.(message)
      })
    })()
  }, [])
}
