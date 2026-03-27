# Installation Guide

##  Installation Options

### Option 1: npx (Recommended)
No installation required - runs directly from npm:

```bash
npx custom-push init
```

### Option 2: Global Install
Install globally for use in any project:

```bash
npm install -g custom-push
custom-push init
```

### Option 3: Local Dev Install
Install as dev dependency in your project:

```bash
npm install --save-dev custom-push
npx custom-push init
```

## System Requirements

### Required
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **React Project**: Any React-based application

### Optional (for backend features)
- **Express**: >= 4.0.0
- **NestJS**: >= 9.0.0
- **Firebase Admin SDK**: >= 12.0.0 (Mandatory for backend)

## Quick Setup

### 1. Professional Backend-Only Setup (Zero Fluff)
If you only need a notification engine for your server:

```bash
npx custom-push init --backend-only
```
- **Detection**: Checks for `firebase-admin` in your `package.json`.
- **Naming**: Generates `FCMHelper.js/ts` in `src/helper/`.
- **Conflicts**: Smart date-based suffixes (e.g., `FCMHelper-27-03.js`) if already exists.

### 2. Standard Full Setup
For projects requiring both frontend and backend integration:

```bash
npx custom-push init
```

## Firebase Setup Instructions

### Step 1: Create Firebase Project
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Web App
1. In your project dashboard, click "Add app"
2. Choose Web icon (</>)
3. Enter app nickname
4. Click "Register app"
5. Copy the Firebase config object - you'll need this for the CLI

### Step 3: Enable Cloud Messaging
1. Go to Project Settings → Cloud Messaging
2. Ensure Cloud Messaging API is enabled
3. Generate VAPID key pair
4. Copy the VAPID key for the CLI

### Step 4: (Optional) Service Account
For backend features, you'll need a service account:

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Keep it secure - never commit to git

## Project Detection

The CLI automatically detects:

### Frontend Stack
- **TypeScript**: Checks for `tsconfig.json`.
- **React**: Reads version from `package.json`.
- **Firebase**: Validates client SDK version.

### Backend Stack
- **Firebase Admin**: Checks for `firebase-admin` dependency.
- **Frameworks**: Detects NestJS (`@nestjs/core`) or Express.

### Project Structure
- **src/ directory**: Targets `src/helper/` for backend-only.
- **public/ directory**: Skipped in backend-only; created for frontend SW.

## Environment Setup

### Development Environment
```bash
# Ensure Node.js version
node --version  # Should be >= 18.0.0

# Ensure npm version  
npm --version   # Should be >= 8.0.0

# Verify React project
ls package.json # Should exist
```

### Production Environment
```bash
# Install dependencies
npm install

# Build project
npm run build

# Run CLI
npx custom-push init
```

## Troubleshooting Installation

### Common Issues

**"command not found: custom-push"**
```bash
# Use npx instead
npx custom-push init

# Or reinstall globally
npm uninstall -g custom-push
npm install -g custom-push
```

**"Permission denied"**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use npx (no permissions needed)
npx custom-push init
```

**"Node.js version too old"**
```bash
# Update Node.js using nvm
nvm install 18
nvm use 18

# Or download from nodejs.org
```

**"package.json not found"**
```bash
# Ensure you're in project root
cd your-react-project
ls package.json  # Should exist

# Or create new React project
npx create-react-app new-project
cd new-project
```

### Network Issues

**Slow download / timeout**
```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm config set registry https://registry.npmjs.org/

# Try again
npx custom-push init
```

**Corporate proxy**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use npx with proxy
https_proxy=http://proxy.company.com:8080 npx custom-push init
```

## IDE Integration

### VS Code
Add to `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.associations": {
    "*.tpl": "javascript"
  }
}
```

### WebStorm
1. File → Settings → Languages & Frameworks → TypeScript
2. Enable TypeScript Compiler
3. Add `node_modules` to excluded directories

## Verify Installation

### Test CLI Works
```bash
npx custom-push --help
# Should show CLI help

npx custom-push init
# Should start the interactive setup
```

### Check Generated Files
After running the CLI, verify these files exist:
```bash
ls public/firebase-messaging-sw.js  # Service worker
ls src/push/pushHelper.ts           # Frontend helper (or .js)
ls our_pkg.json                     # Configuration
```

### Test Integration
Add to your React app:
```typescript
import { usePush } from './push/pushHelper'

function App() {
  usePush()
  return <div>App with push notifications!</div>
}
```

## Next Steps

After successful installation:

1. **Read the main README** for usage instructions
2. **Check the API documentation** for advanced features
3. **Review the troubleshooting guide** for common issues
4. **Explore examples** for different use cases

## Related Documentation

- [Main README](./README.md) - Full usage guide
- [API Reference](./API.md) - Detailed API documentation  
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Examples](./EXAMPLES.md) - Code examples and patterns
