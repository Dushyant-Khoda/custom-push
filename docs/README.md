# Custom Push CLI

A production-grade CLI tool that sets up Firebase Cloud Messaging push notifications in any React project with a single command.

## Quick Start

```bash
# Initialize push notifications in your React project
npx custom-push init

# Or install globally
npm install -g custom-push
custom-push init
```

## Features

- **Auto-detection** - Automatically detects your project stack, framework, and backend
- **Minimal prompts** - Asks only 4 questions maximum, everything else is detected
- **Version validation** - Validates Firebase and React compatibility
-  **Conflict resolution** - Interactive UI to handle existing files
-  **Backend support** - Scaffolds for both Express and NestJS
-  **Production ready** - Generates complete, working code with no TODOs

## Requirements

- Node.js >= 18.0.0
- React project (Create React App, Next.js, Vite, etc.)
- Firebase project (for configuration)

## What It Does

The CLI analyzes your project and sets up:

### Frontend
- Firebase service worker (`public/firebase-messaging-sw.js`)
- Push notification helper (`src/push/pushHelper.{ts|js}`)
- Configuration file (`our_pkg.json`)

### Backend (if detected)
- Express: Push helper and routes
- NestJS: Push module, service, and controller

### Configuration
- Firebase web config integration
- VAPID key setup
- Token registration endpoints
- Credentials handling

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

## Usage

### 1. Run the CLI
```bash
npx custom-push init
```

### 2. Answer Prompts
The CLI will ask for:
- Firebase web config (API key, Auth domain, Project ID, etc.)
- VAPID key
- Backend URLs (if backend detected)
- Credentials.json path (optional)

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

## What Gets Detected

- **Language**: TypeScript vs JavaScript (from tsconfig.json)
- **Framework**: React presence and version
- **Backend**: Express vs NestJS (NestJS takes priority)
- **Versions**: Firebase and React version compatibility
- **Structure**: src/ vs root-level files
- **Directories**: Creates public/ if missing

## Version Compatibility

- **Firebase**: >=10.0.0 and <13.0.0
- **React**: >=17.0.0
- **Node**: >=18.0.0

The CLI will warn you about version mismatches and ask for confirmation before proceeding.

##  Conflict Resolution

If files already exist, the CLI provides options:
- **Overwrite** - Replace existing file
- **Skip** - Keep existing file  
- **View** - Show current file content
- **Diff** - Show what would change

## Sending Push Notifications

### From Backend

**Express/NestJS:**
```typescript
// Import the generated helper
import { sendPushNotification } from './push/pushHelper'

// Send notification
await sendPushNotification({
  token: 'user-device-token',
  title: 'Hello World',
  body: 'This is a push notification!',
  data: { customKey: 'customValue' },
  route: '/notifications'
})
```

### From Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Create new campaign
3. Target your web app
4. Send notification

## Development

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
custom-push init
```

## Advanced Usage

### Custom Firebase Config
You can update Firebase config anytime by editing `our_pkg.json`:

```json
{
  "firebase": {
    "apiKey": "your-api-key",
    "authDomain": "your-project.firebaseapp.com",
    "projectId": "your-project-id",
    "storageBucket": "your-project.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "1:123456789:web:abcdef",
    "vapidKey": "your-vapid-key"
  }
}
```

### Multiple Environments
Create different `our_pkg.json` files for different environments:
- `our_pkg.json` - Development
- `our_pkg.prod.json` - Production
- `our_pkg.staging.json` - Staging

### Custom Backend Endpoints
Update backend URLs in `our_pkg.json`:

```json
{
  "backend": {
    "registerUrl": "https://api.yourapp.com/push/register",
    "unregisterUrl": "https://api.yourapp.com/push/unregister"
  }
}
```

## Troubleshooting

### Common Issues

**"No package.json found"**
- Run from your project root directory

**"Firebase version mismatch"**
- Update Firebase: `npm install firebase@latest`
- Or proceed with warning (may cause issues)

**"Permission denied"**
- Check Firebase project settings
- Ensure web app is configured in Firebase Console

**Service worker not working**
- Ensure service worker is in `public/` directory
- Check Firebase config values
- Verify VAPID key is correct

### Debug Mode
Set environment variable for debug output:
```bash
DEBUG=custom-push:* npx custom-push init
```

## License

MIT License - see LICENSE file for details.

## Contributing

See CONTRIBUTING.md for guidelines.

## Support

- Create an issue on GitHub
- Check the troubleshooting section
- Review the FAQ in docs/FAQ.md
