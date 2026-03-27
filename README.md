# Custom Push CLI

> Professional backend scaffolding for Firebase Cloud Messaging with seamless React integration

[![npm version](https://badge.fury.io/js/custom-push.svg)](https://badge.fury.io/js/custom-push)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

Custom Push is a production-grade CLI tool that scaffolds robust Firebase Cloud Messaging (FCM) infrastructure. It focuses on zero-fluff backend scaffolding (Express/NestJS) while providing an elite React package for frontend integration, including full support for **Next.js App Router**.

## Features

- **Zero-Config Frontend** - Automatically scaffolds a ready-to-use notification handler
- **Backend-focused** - Scaffolds production-grade `FCMHelper` and routes
- **Package-based Frontend** - Core logic handled by the `custom-push` React package
- **App Router Support** - Fully compatible with Next.js 13+ (includes `'use client'` directives)
- **Service Worker Engine** - Integrated on-demand service worker registration
- **Proactive Validation** - Mandatory dependency checks for both `firebase-admin` and `firebase`
- **Minimal Prompts** - Intelligent project detection reduces setup to maximum 4 questions

## Quick Start (3 Minutes)

### 1. Initialize
```bash
npx custom-push init
```

### 2. Wrap your application (Recommended)
The CLI automatically generates a `src/push/notificationHandler/` directory. Use it to wrap your app:

```tsx
import { CustomPushProvider } from 'custom-push';
import { pushConfig } from './push/notificationHandler/pushConfig';
import { PushNotificationManager } from './push/notificationHandler/PushNotificationManager';

function RootLayout({ children }) {
  return (
    <CustomPushProvider config={pushConfig}>
      {/* 💎 This component handles all foreground notifications and toasts */}
      <PushNotificationManager />
      {children}
    </CustomPushProvider>
  );
}
```

### 3. Add an "Enable Notifications" Button
Check the generated `src/push/notificationHandler/USAGE.md` for a professional, copy-pasteable permission toggle button.

## Advanced Frontend Integration

For developers who need full control or prefer not to use the scaffolded handler:

### 1. Install the package
```bash
npm install custom-push
```

### 2. Manual Config
```typescript
import { CustomPushProvider } from 'custom-push';

const pushConfig = {
  apiKey: "your-api-key",
  projectId: "your-project-id",
  vapidKey: "your-vapid-key"
  // ...
};

function Root() {
  return (
    <CustomPushProvider config={pushConfig}>
      <App />
    </CustomPushProvider>
  );
}
```

### 3. Core Frontend API
The `usePushMessage` hook provides a complete interface:

| Property | Type | Description |
|----------|------|-------------|
| `token` | `string \| null` | The unique FCM device token. |
| `messages` | `PushMessage[]` | Array of foreground notifications received. |
| `isSupported` | `boolean` | Whether the browser supports Web Push. |
| `isPermissionGranted` | `boolean` | Current notification permission status. |
| `requestPermission` | `() => Promise<boolean>` | Triggers the browser permission prompt (Required for Safari). |
| `sendMessage` | `(title, body, data?) => Promise<void>` | Sends a push via your configured backend. |
| `clearMessages` | `() => void` | Clears the local `messages` state. |

## Backend Scaffolding

The CLI generates a high-performance `FCMHelper` in your `src/helper/` directory.

```typescript
import { sendPushNotification } from './helper/FCMHelper';

await sendPushNotification({
  token: 'user-device-token',
  title: 'Order Shipped!',
  body: 'Your package is on its way.',
  route: '/orders/123',
  icon: '/icons/shipping-192.png'
});
```

## Configuration

All local configuration is stored in `our_pkg.json`. This acts as the single source of truth.

```json
{
  "stack": { "language": "typescript", "scope": "both", "backendFramework": "express" },
  "firebase": { "apiKey": "...", "vapidKey": "..." },
  "backend": { "registerUrl": "http://localhost:3000/push/register" }
}
```

## Documentation

- **[Installation Guide](./docs/INSTALLATION.md)** - Requirements and Firebase setup
- **[API Reference](./docs/API.md)** - Detailed provider and helper documentation
- **[Examples](./docs/EXAMPLES.md)** - Next.js, Auth, and payload samples
- **[FAQ](./docs/FAQ.md)** - Common questions and troubleshooting

## License

MIT © [Your Name]

---

**Made with ❤️ for the React & Node.js communities**
