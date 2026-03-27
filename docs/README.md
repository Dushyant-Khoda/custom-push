# Documentation Hub

Welcome to the **Custom Push CLI** documentation. This toolkit provides a production-grade infrastructure for Firebase Cloud Messaging (FCM) push notifications.

## Quick Usage

```typescript
import { usePushMessage } from 'custom-push';

function App() {
  const { requestPermission, token, messages } = usePushMessage();
  
  return (
    <button onClick={() => requestPermission()}>
      {token ? 'Enabled' : 'Enable Notifications'}
    </button>
  );
}
```

## Getting Started

### Complete Integration Guide
If you're starting from scratch, follow our step-by-step instructions:
- **[Installation Guide](./docs/INSTALLATION.md)** - Requirements, configuration, and Firebase project setup.
- **[Quick Start](../README.md#quick-start)** - The primary initialization flow.

### Core Concepts
Understand the philosophy and structure of the **Elite** workflow:
- **[Architecture Overview](./docs/ARCHITECTURE.md)** - Explaining the Backend + Package integration.

## API Reference

Explore the detailed public interface of the library:
- **[Frontend API (React)](./docs/API.md#frontend-api-react-package)** - `CustomPushProvider`, `usePushMessage`, and `PushConfig`.
- **[Backend SDK (FCM Engine)](./docs/API.md#backend-api-fcm-engine)** - `FCMHelper` methods and `PushNotificationParams`.
- **[CLI Reference](./docs/API.md#cli-commands)** - CLI flags and interactive prompt details.

## Real-world Examples

Find production-ready patterns for your specific stack:
- **[Next.js App Router](./docs/EXAMPLES.md#nextjs-app-router-integration)** - Handling `'use client'` and client-side layouts.
- **[Auth Integration](./docs/EXAMPLES.md#express-with-authentication)** - Associating tokens with users.
- **[Payload Samples](./docs/EXAMPLES.md#sending-push-notifications)** - Targeting routes, icons, and rich data.

## Help & Community

Find answers to common questions or contribute to the project:
- **[FAQ](./docs/FAQ.md)** - Frequently asked questions about Next.js, Safari, and more.
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Resolving common issues.
- **[Changelog](./docs/CHANGELOG.md)** - Historical updates and professional refinements.

---

**Made with ❤️ for the React & Node.js communities**
