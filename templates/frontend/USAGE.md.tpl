# 🚀 Quick Usage Guide for custom-push

To complete your push notification setup, follow these steps:

### 1. Configure Firebase in your .env
Add the environment variables displayed in the CLI to your `.env` file. Do NOT commit `.env` to version control.

### 2. Wrap your main Layout or App component
In your `src/App.tsx` or `src/main.tsx`:

```tsx
import { CustomPushProvider } from 'custom-push'
import { pushConfig } from './push/NotificationHandler/config'

function App() {
  return (
    <CustomPushProvider config={pushConfig}>
      <YourApp />
    </CustomPushProvider>
  )
}
```

### 3. Use in any component
Use the `usePushMessage` hook to request permission and handle messages:

```tsx
import { usePushMessage } from 'custom-push'

function NotificationButton() {
  const { messages, sendMessage, requestPermission } = usePushMessage()

  return (
    <div>
      <button onClick={requestPermission}>Enable Notifications</button>
      <button onClick={() => sendMessage('Hello', 'World')}>Send Test</button>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.title}</strong>: {m.body}
        </div>
      ))}
    </div>
  )
}
```

### 4. Get the raw token anywhere
If you need the FCM token directly:

```tsx
import { getPushToken } from 'custom-push'
import { pushConfig } from './push/NotificationHandler/config'

const token = await getPushToken(pushConfig)
console.log('FCM Token:', token)
```

### 5. Custom notification handling
Open `src/push/NotificationHandler/PushNotificationManager.tsx` to customize how notifications are displayed when the app is in the foreground.
