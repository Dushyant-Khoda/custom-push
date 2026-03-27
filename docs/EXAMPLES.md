# Examples and Use Cases

## Table of Contents

- [x] [Zero-Config Integration (Recommended)](#zero-config-integration-recommended)
- [Basic Setup](#basic-setup)
- [React Integration](#react-integration)
- [Frontend Package Integration](#frontend-package-integration)
- [Backend Integration](#backend-integration)
- [Advanced Patterns](#advanced-patterns)
- [Real-world Scenarios](#real-world-scenarios)

## Zero-Config Integration (Recommended)

The CLI automatically scaffolds a `src/push/notificationHandler/` directory designed for almost zero-effort integration.

### 1. Minimal App Wrap
Simply wrap your application with the pre-configured provider and manager.

```tsx
// layout.tsx or App.tsx
import { CustomPushProvider } from 'custom-push';
import { pushConfig } from './push/notificationHandler/pushConfig';
import { PushNotificationManager } from './push/notificationHandler/PushNotificationManager';

export default function RootLayout({ children }) {
  return (
    <CustomPushProvider config={pushConfig}>
      {/* 💎 Global logic: handles all tokens and foreground notifications */}
      <PushNotificationManager />
      {children}
    </CustomPushProvider>
  );
}
```

### 2. Customizing Notification UX
Open `PushNotificationManager.tsx` to plug in your favorite toast library:

```tsx
// PushNotificationManager.tsx snippet
useEffect(() => {
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    
    // 🚀 REPLACE THIS with Sonner, React Hot Toast, etc.
    toast(lastMessage.title, { description: lastMessage.body });
  }
}, [messages]);
```

### 3. Permission Button
See the `USAGE.md` in your scaffolded folder for a professional toggle button example.

---

## Basic Setup

### Minimal React App
```typescript
// App.tsx
import React from 'react'
import { usePush } from './push/pushHelper'

function App() {
  // Initialize push notifications
  usePush({
    onMessage: (payload) => {
      console.log('New notification:', payload)
    },
    onReady: (token) => {
      console.log('Push ready with token:', token)
    }
  })

  return (
    <div>
      <h1>My App</h1>
      <p>Push notifications are enabled!</p>
    </div>
  )
}

export default App
```

### JavaScript Version
```javascript
// App.js
import React from 'react'
import { usePush } from './push/pushHelper'

function App() {
  usePush({
    onMessage: (payload) => {
      console.log('New notification:', payload)
    },
    onReady: (token) => {
      console.log('Push ready with token:', token)
    }
  })

  return (
    <div>
      <h1>My App</h1>
      <p>Push notifications are enabled!</p>
    </div>
  )
}

export default App
```

## React Integration

### withToast Notifications
```typescript
// hooks/usePushWithToast.ts
import { usePush } from '../push/pushHelper'
import { toast } from 'react-toastify'

export function usePushWithToast() {
  return usePush({
    onMessage: (payload) => {
      toast.success(`${payload.notification?.title}: ${payload.notification?.body}`, {
        position: 'top-right',
        autoClose: 5000,
      })
    },
    onPermissionDenied: () => {
      toast.error('Please enable notifications to receive updates')
    },
    onError: (error) => {
      toast.error(`Push notification error: ${error.message}`)
    }
  })
}

// App.tsx
import { usePushWithToast } from './hooks/usePushWithToast'

function App() {
  usePushWithToast()
  return <YourApp />
}
```

### withPermission UI
```typescript
// components/PermissionRequest.tsx
import React, { useState } from 'react'
import { usePush } from '../push/pushHelper'

export function PermissionRequest() {
  const [requested, setRequested] = useState(false)
  
  usePush({
    onPermissionDenied: () => {
      setRequested(true)
    },
    onReady: (token) => {
      console.log('Permission granted, token:', token)
    }
  })

  const requestPermission = async () => {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setRequested(true)
    }
  }

  if (requested) return null

  return (
    <div className="permission-banner">
      <p>Enable notifications to stay updated!</p>
      <button onClick={requestPermission}>
        Enable Notifications
      </button>
    </div>
  )
}
```

### Context Provider
```typescript
// context/PushContext.tsx
import React, { createContext, useContext, useState } from 'react'
import { usePush } from '../push/pushHelper'

interface PushContextType {
  token: string | null
  isReady: boolean
  lastMessage: any
}

const PushContext = createContext<PushContextType | null>(null)

export function CustomPushProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)

  usePush({
    onReady: (fcmToken) => {
      setToken(fcmToken)
      setIsReady(true)
    },
    onMessage: (payload) => {
      setLastMessage(payload)
    }
  })

  return (
    <PushContext.Provider value={{ token, isReady, lastMessage }}>
      {children}
    </PushContext.Provider>
  )
}

export function usePushContext() {
  const context = useContext(PushContext)
  if (!context) {
    throw new Error('usePushContext must be used within CustomPushProvider')
  }
  return context
}

// App.tsx
import { CustomPushProvider } from './context/PushContext'

function App() {
  return (
    <CustomPushProvider>
      <YourApp />
    </CustomPushProvider>
  )
}
```

##  Frontend Package Integration (Recommended)

### 1. Root Provider Setup
Wrap your entire application with the `<CustomPushProvider>` to enable the push notification engine.

```typescript
// index.tsx / App.tsx
import { CustomPushProvider } from 'custom-push';

const pushConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  vapidKey: "your-vapid-key",
  registerUrl: "https://your-api.com/push/register"
};

function Root() {
  return (
    <CustomPushProvider config={pushConfig}>
      <App />
    </CustomPushProvider>
  );
}
```

### 2. Requesting Permission & Getting Token
Use the `usePushMessage` hook to trigger the permission prompt and access the FCM token.

```typescript
import { usePushMessage } from 'custom-push';

export function SetupPush() {
  const { requestPermission, token, isSupported, isPermissionGranted } = usePushMessage();

  const handleEnable = async () => {
    // IMPORTANT: Must be called from a button click for Safari support
    const granted = await requestPermission();
    if (granted) {
      console.log('Push notifications enabled!');
    }
  };

  if (!isSupported) return <p>Browser not supported</p>;

  return (
    <div>
      {isPermissionGranted ? (
        <p>Token: {token?.slice(0, 10)}...</p>
      ) : (
        <button onClick={handleEnable}>Enable Notifications</button>
      )}
    </div>
  );
}
```

### 3. Handling Foreground Messages
You can access the `messages` array for current-session notifications or use the `onToast` prop in the provider.

```typescript
// Component within the provider
const { messages, clearMessages } = usePushMessage();

return (
  <ul>
    {messages.map(msg => (
      <li key={msg.id}>
        <strong>{msg.title}</strong>: {msg.body}
      </li>
    ))}
  </ul>
);
```

### Next.js App Router Integration
In Next.js App Router, context providers must be Client Components. We recommend creating a separate client wrapper.

#### 1. Create a Client Wrapper
```typescript
// components/PushProviderWrapper.tsx
'use client';

import { CustomPushProvider } from 'custom-push';

export function PushProviderWrapper({ children }: { children: React.ReactNode }) {
  const pushConfig = {
    apiKey: "...",
    // ... rest of your config
  };

  return (
    <CustomPushProvider config={pushConfig}>
      {children}
    </CustomPushProvider>
  );
}
```

#### 2. Wrap your Root Layout
```typescript
// app/layout.tsx
import { PushProviderWrapper } from '../components/PushProviderWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PushProviderWrapper>
          {children}
        </PushProviderWrapper>
      </body>
    </html>
  );
}
```

## Premium Backend FCM Engine

### Standard FCMHelper Usage (Recommended)
The CLI generates a production-grade helper in `src/helper/FCMHelper.ts` (or `.js`).

```typescript
import { sendPushNotification } from './helper/FCMHelper';

// Example 1: Basic alert
async function notifyUser(token: string) {
  await sendPushNotification({
    token,
    title: 'Order Shipped! ',
    body: 'Your package is on its way and will arrive tomorrow.',
    icon: '/icons/shipping-192x192.png'
  });
}

// Example 2: Interactive notification with dynamic route
async function notifyInvite(token: string, inviteId: string) {
  await sendPushNotification({
    token,
    title: 'New Team Invite',
    body: 'Alex invited you to join "Project X"',
    route: `/invites/${inviteId}`, // Service worker will navigate here on click
    data: { inviteId, type: 'TEAM_INVITE' },
    icon: '/icons/invite-192x192.png'
  });
}

// Example 3: Silent data update (No popup, just data)
async function syncData(token: string, syncId: string) {
  await sendPushNotification({
    token,
    title: '', // Empty title/body makes it a data-only message
    body: '',
    data: { syncId, action: 'REFRESH_CACHE' }
  });
}
```

## Backend Integration

### Express with Authentication
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  // Verify JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded as any
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// routes/push.ts (enhanced)
import { Router } from 'express'
import { sendPushNotification } from '../push/pushHelper'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// Register token with user authentication
router.post('/register', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body
    const userId = req.user!.id

    // Save to database
    await db.pushTokens.upsert({
      where: { userId },
      update: { token },
      create: { userId, token }
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to register token' })
  }
})

// Send notification to specific user
router.post('/send/:userId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { title, body, data } = req.body

    // Get user's token from database
    const pushToken = await db.pushTokens.findUnique({
      where: { userId }
    })

    if (!pushToken) {
      return res.status(404).json({ error: 'User not registered for push' })
    }

    await sendPushNotification({
      token: pushToken.token,
      title,
      body,
      data
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' })
  }
})

export default router
```

### NestJS with Database Integration
```typescript
// push/push.service.ts (enhanced)
import { Injectable, OnModuleInit } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class PushService implements OnModuleInit {
  constructor(private db: DatabaseService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(require('../credentials.json'))
      })
    }
  }

  async registerToken(userId: string, token: string): Promise<void> {
    await this.db.pushToken.upsert({
      where: { userId },
      update: { token, updatedAt: new Date() },
      create: { userId, token }
    })
  }

  async unregisterToken(token: string): Promise<void> {
    await this.db.pushToken.delete({
      where: { token }
    })
  }

  async sendToUser(userId: string, params: {
    title: string
    body: string
    data?: Record<string, string>
  }): Promise<void> {
    const pushToken = await this.db.pushToken.findUnique({
      where: { userId }
    })

    if (!pushToken) {
      throw new Error('User not registered for push notifications')
    }

    await this.sendNotification({
      token: pushToken.token,
      ...params
    })
  }

  async sendToMultipleUsers(userIds: string[], params: {
    title: string
    body: string
    data?: Record<string, string>
  }): Promise<void> {
    const tokens = await this.db.pushToken.findMany({
      where: { userId: { in: userIds } }
    })

    const message = {
      notification: { title: params.title, body: params.body },
      data: params.data || {},
      tokens: tokens.map(t => t.token)
    }

    await admin.messaging().sendMulticast(message)
  }

  private async sendNotification(params: {
    token: string
    title: string
    body: string
    data?: Record<string, string>
  }): Promise<string> {
    const message: admin.messaging.Message = {
      token: params.token,
      notification: { title: params.title, body: params.body },
      data: params.data || {},
      webpush: {
        notification: { 
          title: params.title, 
          body: params.body, 
          icon: '/icon.png' 
        }
      }
    }

    return admin.messaging().send(message)
  }
}
```

## Advanced Patterns

### Custom Notification Handler
```typescript
// utils/notificationHandler.ts
export class NotificationHandler {
  private static instance: NotificationHandler
  private handlers: Map<string, (payload: any) => void> = new Map()

  static getInstance(): NotificationHandler {
    if (!NotificationHandler.instance) {
      NotificationHandler.instance = new NotificationHandler()
    }
    return NotificationHandler.instance
  }

  register(type: string, handler: (payload: any) => void) {
    this.handlers.set(type, handler)
  }

  handle(payload: any) {
    const type = payload.data?.type || 'default'
    const handler = this.handlers.get(type)
    
    if (handler) {
      handler(payload)
    } else {
      this.defaultHandler(payload)
    }
  }

  private defaultHandler(payload: any) {
    console.log('Unhandled notification:', payload)
    // Show default toast or notification
  }
}

// hooks/useCustomPush.ts
import { usePush } from '../push/pushHelper'
import { NotificationHandler } from '../utils/notificationHandler'

export function useCustomPush() {
  const handler = NotificationHandler.getInstance()

  return usePush({
    onMessage: (payload) => {
      handler.handle(payload)
    }
  })
}

// Register handlers in your app
import { NotificationHandler } from './utils/notificationHandler'

const handler = NotificationHandler.getInstance()

handler.register('message', (payload) => {
  // Handle new message
  console.log('New message:', payload.data)
})

handler.register('friend_request', (payload) => {
  // Handle friend request
  console.log('Friend request:', payload.data)
})
```

### Background Sync
```typescript
// utils/backgroundSync.ts
export class BackgroundSync {
  private static instance: BackgroundSync
  private syncQueue: any[] = []

  static getInstance(): BackgroundSync {
    if (!BackgroundSync.instance) {
      BackgroundSync.instance = new BackgroundSync()
    }
    return BackgroundSync.instance
  }

  addToQueue(data: any) {
    this.syncQueue.push(data)
    this.processQueue()
  }

  private async processQueue() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('background-sync')
    } else {
      // Fallback: process immediately
      await this.processImmediately()
    }
  }

  private async processImmediately() {
    while (this.syncQueue.length > 0) {
      const data = this.syncQueue.shift()
      await this.sendToServer(data)
    }
  }

  private async sendToServer(data: any) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      // Re-add to queue on failure
      this.syncQueue.unshift(data)
    }
  }
}
```

### Notification Scheduling
```typescript
// utils/notificationScheduler.ts
export class NotificationScheduler {
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map()

  schedule(id: string, delay: number, notification: {
    title: string
    body: string
    data?: Record<string, string>
  }) {
    // Clear existing if any
    this.cancel(id)

    const timeout = setTimeout(async () => {
      await this.sendNotification(notification)
      this.scheduledNotifications.delete(id)
    }, delay)

    this.scheduledNotifications.set(id, timeout)
  }

  cancel(id: string) {
    const timeout = this.scheduledNotifications.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.scheduledNotifications.delete(id)
    }
  }

  private async sendNotification(notification: {
    title: string
    body: string
    data?: Record<string, string>
  }) {
    // Send via your backend API
    await fetch('/api/notifications/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
  }
}
```

## Real-world Scenarios

### Chat Application
```typescript
// hooks/useChatNotifications.ts
import { useEffect } from 'react'
import { usePush } from '../push/pushHelper'
import { useChatStore } from '../stores/chatStore'

export function useChatNotifications(currentUserId: string) {
  const { addMessage, setActiveChat } = useChatStore()

  usePush({
    onMessage: (payload) => {
      const { type, chatId, senderId, message } = payload.data || {}

      if (type === 'new_message' && senderId !== currentUserId) {
        // Add message to store
        addMessage(chatId, {
          id: payload.messageId,
          senderId,
          content: message,
          timestamp: new Date().toISOString()
        })

        // Show notification if not in active chat
        if (setActiveChat !== chatId) {
          new Notification(`${payload.notification?.title}`, {
            body: payload.notification?.body,
            icon: '/avatar.png',
            tag: chatId,
            data: { route: `/chat/${chatId}` }
          })
        }
      }
    }
  })
}
```

### E-commerce Application
```typescript
// hooks/useEcommerceNotifications.ts
import { usePush } from '../push/pushHelper'
import { useCartStore } from '../stores/cartStore'

export function useEcommerceNotifications() {
  const { addItem } = useCartStore()

  usePush({
    onMessage: (payload) => {
      const { type, productId, variant, discount } = payload.data || {}

      switch (type) {
        case 'flash_sale':
          new Notification('Flash Sale!', {
            body: `${payload.notification?.body}`,
            icon: '/sale-icon.png',
            data: { route: `/product/${productId}` }
          })
          break

        case 'price_drop':
          new Notification('Price Drop!', {
            body: `${payload.notification?.body}`,
            icon: '/price-drop.png',
            data: { route: `/product/${productId}` }
          })
          break

        case 'back_in_stock':
          new Notification('Back in Stock!', {
            body: `${payload.notification?.body}`,
            icon: '/stock-icon.png',
            data: { route: `/product/${productId}` }
          })
          break

        case 'cart_abandoned':
          // Show special discount
          if (discount) {
            new Notification('🛒 Complete Your Order', {
              body: `Complete your order and get ${discount}% off!`,
              icon: '/cart-icon.png',
              data: { route: '/cart', discount }
            })
          }
          break
      }
    }
  })
}
```

### Social Media Application
```typescript
// hooks/useSocialNotifications.ts
import { usePush } from '../push/pushHelper'
import { useUserStore } from '../stores/userStore'

export function useSocialNotifications(currentUserId: string) {
  const { updateNotifications } = useUserStore()

  usePush({
    onMessage: (payload) => {
      const { type, actorId, postId, comment } = payload.data || {}

      // Update notification count
      updateNotifications(1)

      switch (type) {
        case 'like':
          new Notification('New Like', {
            body: `${payload.notification?.body}`,
            icon: '/like.png',
            data: { route: `/post/${postId}` }
          })
          break

        case 'comment':
          new Notification('New Comment', {
            body: `${payload.notification?.body}`,
            icon: '/comment.png',
            data: { route: `/post/${postId}` }
          })
          break

        case 'follow':
          new Notification('New Follower', {
            body: `${payload.notification?.body}`,
            icon: '/follow.png',
            data: { route: `/profile/${actorId}` }
          })
          break

        case 'mention':
          new Notification('You were mentioned', {
            body: `${payload.notification?.body}`,
            icon: '/mention.png',
            data: { route: `/post/${postId}` }
          })
          break
      }
    }
  })
}
```

### Task Management Application
```typescript
// hooks/useTaskNotifications.ts
import { usePush } from '../push/pushHelper'
import { useTaskStore } from '../stores/taskStore'

export function useTaskNotifications() {
  const { updateTask, addTask } = useTaskStore()

  usePush({
    onMessage: (payload) => {
      const { type, taskId, assigneeId, dueDate } = payload.data || {}

      switch (type) {
        case 'task_assigned':
          new Notification('New Task Assigned', {
            body: `${payload.notification?.body}`,
            icon: '/task.png',
            data: { route: `/task/${taskId}` }
          })
          // Refresh tasks
          addTask({
            id: taskId,
            title: payload.data?.title,
            status: 'assigned'
          })
          break

        case 'task_completed':
          new Notification('✅ Task Completed', {
            body: `${payload.notification?.body}`,
            icon: '/complete.png',
            data: { route: `/task/${taskId}` }
          })
          // Update task status
          updateTask(taskId, { status: 'completed' })
          break

        case 'deadline_reminder':
          new Notification('Deadline Approaching', {
            body: `${payload.notification?.body}`,
            icon: '/deadline.png',
            data: { route: `/task/${taskId}` }
          })
          break

        case 'task_overdue':
          new Notification('Task Overdue', {
            body: `${payload.notification?.body}`,
            icon: '/overdue.png',
            data: { route: `/task/${taskId}` }
          })
          break
      }
    }
  })
}
```

## Progressive Web App Integration

```typescript
// service-worker-registration.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('SW registered:', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  if (confirm('New version available. Reload?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch(error => {
          console.error('SW registration failed:', error)
        })
    })
  }
}

// App.tsx
import { useEffect } from 'react'
import { registerServiceWorker } from './service-worker-registration'

function App() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return <YourApp />
}
```

## Testing Examples

### Mock Push Notifications for Testing
```typescript
// utils/testPushNotifications.ts
export class MockPushNotifications {
  static simulateMessage(payload: any) {
    // Simulate receiving a push message
    const event = new MessageEvent('message', { data: payload })
    
    // Trigger the message handler
    if (window.onmessage) {
      window.onmessage(event)
    }
  }

  static simulateTokenRefresh(newToken: string) {
    // Simulate token refresh
    localStorage.setItem('fcm_token', newToken)
    
    // Trigger token refresh event
    window.dispatchEvent(new CustomEvent('tokenRefresh', { 
      detail: { token: newToken } 
    }))
  }
}

// Test in development
if (process.env.NODE_ENV === 'development') {
  window.testPush = MockPushNotifications
  
  // Example usage in console:
  // testPush.simulateMessage({
  //   notification: { title: 'Test', body: 'Test message' },
  //   data: { type: 'test' }
  // })
}
```

These examples cover various real-world scenarios and patterns for implementing push notifications with the custom-push CLI. Choose the patterns that best fit your application's needs.
