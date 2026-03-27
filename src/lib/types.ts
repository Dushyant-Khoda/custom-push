export interface PushConfig {
  apiKey?: string
  authDomain?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  vapidKey?: string
  registerUrl?: string         // POST endpoint to save token to backend
  unregisterUrl?: string       // POST endpoint to remove token from backend
  serviceWorkerPath?: string   // path to SW file (default: /firebase-messaging-sw.js)
}

export interface PushMessage {
  id: string
  title: string
  body: string
  icon?: string
  url?: string
  data?: Record<string, string>
  payload: any
  timestamp: number
}

export interface BrowserSupport {
  isSupported: boolean         // can the browser do Web Push at all?
  isSafari: boolean            // is this Safari?
  safariVersion: number | null // Safari major version (null if not Safari)
  requiresUserGesture: boolean // Safari requires user gesture for permission
  reason?: string              // human-readable reason if not supported
}

export interface PushContextValue {
  token: string | null
  messages: PushMessage[]
  sendMessage: (title: string, body: string, data?: Record<string, string>) => Promise<void>
  clearMessages: () => void
  isSupported: boolean
  isPermissionGranted: boolean
  isTabActive: boolean
  browserSupport: BrowserSupport
  requestPermission: () => Promise<boolean>
}
