# Custom Push CLI

> Backend scaffolding for Firebase push notifications with optional frontend support

[![npm version](https://badge.fury.io/js/custom-push.svg)](https://badge.fury.io/js/custom-push)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

A production-grade CLI tool that scaffolds Firebase Cloud Messaging backend infrastructure with flexible frontend integration options. Focus on backend development while the frontend is handled by the `custom-push` package.

## Features

- **Backend-focused** - Scaffolds Express/NestJS helpers and routes
- **Package-based Frontend** - Frontend logic handled by `custom-push` npm package
- **Flexible Options** - Backend-only, package-based, or full boilerplate generation
- **Service Worker Generator** - On-demand service worker generation
- **Minimal Prompts** - Backend-focused configuration by default
- **Version Validation** - Validates Firebase and React compatibility
- **Production Ready** - Generates complete, working backend code

## Quick Start

### Professional Backend-Only Setup
Zero frontend fluff. Just the server-side engine.
```bash
npx custom-push init --backend-only
```

### Full Setup (Backend + Package Instructions)
The standard flow for both frontend and backend integration.
```bash
npx custom-push init
```

### Maximum Control (Backend + Frontend Boilerplate)
Full source-code generation for complete customization.
```bash
npx custom-push init --generate-frontend
```

## Frontend Package Integration

### 1. Install the package
```bash
npm install custom-push
```

### 2. Wrap your App with CustomPushProvider
```typescript
import { CustomPushProvider } from 'custom-push';

const pushConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  vapidKey: "your-vapid-key"
};

function Root() {
  return (
    <CustomPushProvider config={pushConfig}>
      <App />
    </CustomPushProvider>
  );
}
```

### 3. Use the hook in your components
```typescript
import { usePushMessage } from 'custom-push';

function App() {
  const { requestPermission, token, messages } = usePushMessage();

  return (
    <div>
      <button onClick={() => requestPermission()}>
        Enable Notifications
      </button>
      {token && <p>Push Token ready!</p>}
    </div>
  );
}
```

## What It Does

### Backend (Default)
- ✅ Express/NestJS helpers and routes
- ✅ Firebase Admin SDK integration
- ✅ Token management endpoints
- ✅ Configuration file (`our_pkg.json`)
- ✅ Credentials handling with .gitignore

### Frontend (Package-based)
- ✅ Service worker registration and management
- ✅ Token lifecycle handling
- ✅ Foreground message processing
- ✅ Permission management
- ✅ Error handling and edge cases

### Frontend (Optional Boilerplate)
- ✅ Firebase service worker (`public/firebase-messaging-sw.js`)
- ✅ Push notification helper (`src/push/pushHelper.{ts|js}`)
- ✅ TypeScript interfaces

## Project Structure After Setup

### Default (Backend + Package)
```
your-project/
├── our_pkg.json                    # Configuration
├── credentials.json                # Firebase credentials (if backend)
└── src/push/                       # Backend helpers (if detected)
    ├── pushHelper.{ts|js}
    └── routes/ or module/          # Framework-specific
```

### With Frontend Boilerplate
```
your-project/
├── public/
│   └── firebase-messaging-sw.js    # Service worker
├── src/
│   └── push/
│       └── pushHelper.{ts|js}      # Frontend helper
├── our_pkg.json                    # Configuration
└── credentials.json                # Firebase credentials (if backend)
```

## What Gets Detected

- **Backend Framework**: Express vs NestJS (NestJS takes priority)
- **Project Structure**: src/ vs root-level files
- **Firebase Version**: From dependencies for compatibility
- **Node.js Version**: Validates minimum requirements

## Configuration

All configuration is stored in `our_pkg.json`:

```json
{
  "version": "1.0.0",
  "stack": {
    "language": "typescript",
    "scope": "both",
    "backendFramework": "express"
  },
  "firebase": {
    "apiKey": "...",
    "authDomain": "...",
    "projectId": "...",
    "vapidKey": "..."
  },
  "backend": {
    "registerUrl": "http://localhost:3000/push/register",
    "unregisterUrl": "http://localhost:3000/push/unregister"
  }
}
```

## Sending Push Notifications

### From Backend (Generated FCMHelper)
```typescript
import { sendPushNotification } from './helper/FCMHelper';

// Static-data test or dynamic payload
await sendPushNotification({
  token: 'user-device-token',
  title: 'Elite Alert',
  body: 'This is a premium notification from CustomPush!',
  route: '/dashboard',
  icon: '/custom-icon.png' // Recommended 192x192px
});
```

### From Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Create new campaign
3. Target your web app
4. Send notification

## Requirements

- **Node.js**: >= 18.0.0
- **Backend**: Express or NestJS (optional)
- **Firebase**: Free Firebase project

##  Documentation

- 📖 **[Architecture Guide](./docs/ARCHITECTURE.md)** - New architecture overview
- **[Installation Guide](./docs/INSTALLATION.md)** - Detailed setup instructions
- 📡 **[API Reference](./docs/API.md)** - Complete API documentation
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- � **[Examples](./docs/EXAMPLES.md)** - Code examples and patterns
- ❓ **[FAQ](./docs/FAQ.md)** - Frequently asked questions

## Version Compatibility

- **Firebase**: >=10.0.0 and <13.0.0
- **Node**: >=18.0.0

The CLI will warn you about version mismatches and ask for confirmation before proceeding.

##  Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Local Testing
```bash
npm link
custom-push --help
```

## Use Cases

| Scenario | Command | Description |
|----------|---------|-------------|
| **Backend Development** | `npx custom-push init --backend-only` | Focus on backend API only |
| **Full-stack Development** | `npx custom-push init` | Backend + package-based frontend |
| **Maximum Control** | `npx custom-push init --generate-frontend` | Generate all boilerplate |
| **Service Worker Only** | `npx custom-push generate-service-worker` | Just need service worker |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © [Your Name](./LICENSE)

## Links

- [GitHub Repository](https://github.com/your-username/custom-push)
- [NPM Package](https://www.npmjs.com/package/custom-push)
- [Issue Tracker](https://github.com/your-username/custom-push/issues)
- [Documentation](./docs/)

---

**Made with ❤️ for the React community**

## What It Does

The CLI analyzes your project and sets up everything needed for push notifications:

### Frontend
- ✅ Firebase service worker (`public/firebase-messaging-sw.js`)
- ✅ Push notification helper (`src/push/pushHelper.{ts|js}`)
- ✅ Configuration file (`our_pkg.json`)
- ✅ TypeScript interfaces (if using TypeScript)

### Backend (if detected)
- ✅ Express: Push helper and routes
- ✅ NestJS: Push module, service, and controller
- ✅ Firebase Admin SDK integration
- ✅ Token management endpoints

### Configuration
- ✅ Firebase web config integration
- ✅ VAPID key setup
- ✅ Token registration endpoints
- ✅ Credentials handling with .gitignore

## Usage

### 1. Run the CLI
```bash
npx custom-push init
```

### 2. Answer Prompts (max 4 questions)
The CLI will ask for:
- Firebase web config (API key, Auth domain, Project ID, etc.)
- VAPID key
- Backend URLs (if backend detected)
- credentials.json path (optional)

### 3. Integration

#### Frontend
```typescript
import { usePush } from './push/pushHelper'

function App() {
  usePush() // Initialize push notifications
  return <YourApp />
}
```

#### Backend

**Express:**
```typescript
import pushRoutes from './push/pushRoutes'
app.use('/push', pushRoutes)
```

**NestJS:**
```typescript
import { PushModule } from './push/push.module'
@Module({ imports: [PushModule] })
```

## Project Structure After Setup

```
your-project/
├── public/
│   └── firebase-messaging-sw.js    ← Generated service worker
├── src/
│   └── push/
│       └── pushHelper.{ts|js}      ← Frontend helper
├── our_pkg.json                    ← Configuration file
└── credentials.json                ← Firebase credentials (if backend)
```

## What Gets Detected

- **Language**: TypeScript vs JavaScript (from tsconfig.json)
- **Framework**: React presence and version
- **Backend**: Express vs NestJS (NestJS takes priority)
- **Versions**: Firebase and React version compatibility
- **Structure**: src/ vs root-level files
- **Directories**: Creates public/ if missing

## Configuration

All configuration is stored in `our_pkg.json`:
## our_pkg.json`

```json
{
  "version": "1.0.0",
  "generatedAt": "<ISO timestamp>",
  "customPushVersion": "1.0.0",
  "stack": {
    "language": "typescript | javascript",
    "scope": "frontend | both",
    "backendFramework": "express | nestjs | null"
  },
  "firebase": {
    "apiKey": "",
    "authDomain": "",
    "projectId": "",
    "storageBucket": "",
    "messagingSenderId": "",
    "appId": "",
    "vapidKey": ""
  },
  "backend": {
    "registerUrl": "",
    "unregisterUrl": "",
    "credentialsPath": "./credentials.json | null"
  },
  "serviceWorker": {
    "path": "/firebase-messaging-sw.js",
    "generatedAt": "<ISO timestamp>"
  },
  "compatibility": {
    "firebaseRequired": ">=10.0.0 <13.0.0",
    "reactRequired": ">=17.0.0",
    "firebaseInstalled": "<detected version>",
    "reactInstalled": "<detected version>"
  }
}
```

---

## Updating Config

Edit `our_pkg.json` directly — all generated files read from it at runtime. To regenerate scaffolded files, re-run:

```bash
npx custom-push init
```

The CLI will detect existing files and ask whether to overwrite or skip each one.

---

## credentials.json`

This is your **Firebase service account private key**. It is required for sending push notifications from your backend.

### How to generate:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Project Settings → Service Accounts → Generate new private key**
3. Download the JSON file
4. Provide the path when prompted by `custom-push init`

### Security:
- `custom-push` automatically copies it to your project root and adds it to `.gitignore`
- **Never commit this file** — it contains your private key

---

## Backend Setup

### Express

After running `custom-push init`, mount the generated routes in your Express app:

```typescript
import pushRoutes from './push/pushRoutes'
app.use('/push', pushRoutes)
```

### NestJS

Import `PushModule` in your `AppModule`:

```typescript
import { PushModule } from './push/push.module'

@Module({
  imports: [PushModule],
})
export class AppModule {}
```

---

## Compatibility

| custom-push | Firebase     | React   | Node.js  |
|-------------|--------------|---------|----------|
| 1.x         | 10.x – 12.x | ≥ 17.0  | ≥ 18.0   |

---

## License

MIT
