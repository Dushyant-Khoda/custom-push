# Architecture Overview

## 🎯 New Architecture: Backend-Focused with Package-based Frontend

The custom-push CLI has evolved to focus on backend scaffolding while the frontend is handled by the `custom-push` npm package.

## 📦 Components

### 1. CLI Tool (`custom-push`)
**Purpose**: Backend scaffolding and configuration generation

**Default Behavior**:
- Detects backend framework (Express/NestJS)
- Generates backend helpers and routes
- Creates `our_pkg.json` configuration
- Shows instructions for frontend package integration

**Commands**:
```bash
# Default: Backend scaffolding + package instructions
npx custom-push init

# Backend only (no frontend mentions)
npx custom-push init --backend-only

# Full setup (backend + frontend boilerplate)
npx custom-push init --generate-frontend

# Generate only service worker
npx custom-push generate-service-worker
```

### 2. Frontend Package (`custom-push`)
**Purpose**: Provides all frontend functionality as an npm package

**Installation**:
```bash
npm install custom-push
```

**Usage**:
```typescript
import { usePush } from 'custom-push'

function App() {
  usePush({
    firebase: {
      apiKey: "...",
      authDomain: "...",
      projectId: "...",
      // ... other config
    },
    vapidKey: "..."
  })
  return <YourApp />
}
```

**Features**:
- ✅ Service worker registration
- ✅ Token management
- ✅ Foreground message handling
- ✅ Permission handling
- ✅ Error handling
- ✅ TypeScript support

## 🔄 Workflow Comparison

### Old Workflow (CLI generates everything)
```bash
npx custom-push init
# → Generates backend + frontend files
# → User integrates generated frontend code
```

### New Workflow (Backend-focused)
```bash
# Step 1: Backend setup
npx custom-push init
# → Generates backend scaffolding only
# → Shows package installation instructions

# Step 2: Frontend integration
npm install custom-push
# → Import and configure in app
```

### Optional Frontend Generation
```bash
npx custom-push init --generate-frontend
# → Generates backend + frontend boilerplate
# → For users who prefer generated files
```

## 🏗️ Architecture Benefits

### 1. **Simplified Maintenance**
- Frontend logic centralized in one package
- Easier to update and fix bugs
- Consistent behavior across projects

### 2. **Better User Experience**
- Less boilerplate code in user projects
- Package handles all edge cases
- Automatic updates via npm

### 3. **Backend Focus**
- CLI focuses on what it does best: backend scaffolding
- Cleaner separation of concerns
- More flexible for different backend setups

### 4. **Progressive Enhancement**
- Start with package-based approach
- Generate boilerplate only when needed
- Supports both workflows

## 📁 File Structure

### CLI Generated Files
```
your-project/
├── our_pkg.json                    # Configuration
├── credentials.json                # Firebase credentials (if backend)
└── src/push/                       # Backend helpers (if backend detected)
    ├── pushHelper.{ts|js}
    └── routes/ or module/          # Framework-specific
```

### Package-based Frontend
```
your-project/
├── node_modules/custom-push/       # Package files
├── public/firebase-messaging-sw.js # Generated on-demand
└── src/
    └── App.tsx                     # User imports from package
```

### Generated Frontend (Optional)
```
your-project/
├── public/
│   └── firebase-messaging-sw.js   # Service worker
└── src/
    └── push/
        └── pushHelper.{ts|js}      # Generated helper
```

## 🔧 Technical Implementation

### CLI Changes
1. **Command Structure**: Added commander.js for CLI parsing
2. **Conditional Scaffolding**: Frontend generation based on flags
3. **Backend-focused Prompts**: Simplified questions for backend setup
4. **Service Worker Generator**: Separate command for on-demand generation

### Package Features
1. **Service Worker Management**: Automatic registration and updates
2. **Token Lifecycle**: Registration, refresh, and cleanup
3. **Message Handling**: Foreground and background messages
4. **Error Handling**: Comprehensive error management
5. **TypeScript Support**: Full type definitions

### Configuration Flow
1. **CLI generates** `our_pkg.json` with Firebase config
2. **Package reads** configuration from user input
3. **Service worker** generated on-demand with user's config
4. **Backend integration** via generated endpoints

## 🎯 Use Cases

### 1. **Backend Developers**
```bash
npx custom-push init --backend-only
# Focus on backend API development
# Frontend team handles package integration
```

### 2. **Full-stack Developers**
```bash
npx custom-push init
# Get backend scaffolding + package instructions
# Clean, minimal frontend integration
```

### 3. **Teams Wanting Full Control**
```bash
npx custom-push init --generate-frontend
# Get complete boilerplate for customization
# Maximum control over implementation
```

### 4. **Service Worker Only**
```bash
npx custom-push generate-service-worker
# Just need the service worker file
# Already have custom frontend implementation
```

## 🔄 Migration Path

### From Old to New Architecture
1. **Existing projects**: Continue working with generated files
2. **New projects**: Use package-based approach by default
3. **Hybrid approach**: Mix both methods as needed

### Backward Compatibility
- Old CLI commands still work
- Generated files remain functional
- Gradual migration possible

## 🚀 Future Enhancements

### Package Features
- 🎨 Custom notification UI components
- 📊 Analytics and tracking
- 🔄 Advanced scheduling
- 🌐 Multi-language support

### CLI Features
- 🔍 Enhanced project detection
- 📦 Package management integration
- 🎯 Template customization
- 🔌 Plugin system

## 📊 Decision Matrix

| Scenario | Recommended Approach |
|----------|---------------------|
| New project | `npx custom-push init` + package |
| Backend-only focus | `npx custom-push init --backend-only` |
| Need full control | `npx custom-push init --generate-frontend` |
| Service worker only | `npx custom-push generate-service-worker` |
| Large team collaboration | Package-based approach |
| Rapid prototyping | Generated frontend approach |

This architecture provides flexibility while maintaining simplicity for the most common use cases.
