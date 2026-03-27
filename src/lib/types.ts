export interface PushConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  vapidKey: string
  registerUrl?: string       // POST endpoint to save token to backend
  unregisterUrl?: string     // POST endpoint to remove token from backend
  serviceWorkerPath?: string // Custom path for firebase-messaging-sw.js
}

export interface PushMessage {
  id: string
  title: string
  body: string
  data?: Record<string, string>
  timestamp: number
}

export interface PushContextValue {
  token: string | null
  messages: PushMessage[]
  sendMessage: (title: string, body: string, data?: Record<string, string>) => Promise<void>
  clearMessages: () => void
  isSupported: boolean
  isPermissionGranted: boolean
  requestPermission: () => Promise<boolean>
}
