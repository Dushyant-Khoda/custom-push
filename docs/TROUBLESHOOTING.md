# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### "command not found: custom-push"
**Problem**: CLI not recognized after global install.

**Solutions**:
```bash
# Use npx instead (recommended)
npx custom-push init

# Reinstall globally
npm uninstall -g custom-push
npm install -g custom-push

# Check npm global path
npm config get prefix
# Add to PATH if needed
export PATH=$(npm config get prefix)/bin:$PATH
```

#### "permission denied" errors
**Problem**: npm permissions issue.

**Solutions**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use npx (no permissions needed)
npx custom-push init

# Or use node version manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### "No package.json found"
**Problem**: Not running from React project root.

**Solutions**:
```bash
# Navigate to project root
cd your-react-project
ls package.json  # Should exist

# Or create new React project
npx create-react-app my-app
cd my-app
npx custom-push init
```

### Firebase Configuration Issues

#### "Invalid Firebase config"
**Problem**: Missing or incorrect Firebase configuration.

**Solutions**:
1. **Check Firebase Console**:
   - Go to Firebase Console → Project Settings → Your apps
   - Copy the exact config values
   - Ensure all required fields are present

2. **Verify config format**:
   ```json
   {
     "apiKey": "your-api-key",
     "authDomain": "your-project.firebaseapp.com",
     "projectId": "your-project-id",
     "storageBucket": "your-project.appspot.com",
     "messagingSenderId": "123456789",
     "appId": "1:123456789:web:abcdef"
   }
   ```

3. **Common mistakes**:
   - Missing fields
   - Extra commas in JSON
   - Wrong project ID
   - API key from wrong project

#### "VAPID key invalid"
**Problem**: Incorrect or missing VAPID key.

**Solutions**:
1. **Generate new VAPID key**:
   - Firebase Console → Project Settings → Cloud Messaging
   - Web Push certificates → Generate new key pair
   - Copy the VAPID key (not the private key)

2. **Key format**:
   - Should be a long base64 string
   - No spaces or line breaks
   - Starts with "BM" or similar

### Browser Permission Issues

#### "Notification permission denied"
**Problem**: User blocked notification permissions.

**Solutions**:
1. **User action required**:
   - Instruct user to enable permissions in browser settings
   - Chrome: Settings → Privacy and security → Site Settings → Notifications
   - Firefox: Options → Privacy & Security → Permissions → Notifications

2. **Check permission status**:
   ```javascript
   if (Notification.permission === 'denied') {
     console.log('Permission denied - user must enable in browser settings')
   }
   ```

3. **Handle gracefully**:
   ```typescript
   usePush({
     onPermissionDenied: () => {
       // Show custom UI explaining how to enable
       showPermissionInstructions()
     }
   })
   ```

#### "Service worker failed to register"
**Problem**: Service worker registration fails.

**Solutions**:
1. **Check service worker location**:
   - Must be in `public/` directory
   - Must be named `firebase-messaging-sw.js`
   - Must be accessible at `/firebase-messaging-sw.js`

2. **HTTPS requirement**:
   - Service workers require HTTPS (except localhost)
   - Ensure your dev server uses HTTPS or use localhost

3. **Check browser console**:
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     console.log('Service workers:', registrations)
   })
   ```

### Backend Integration Issues

#### "Token registration failed"
**Problem**: Backend endpoint not working.

**Solutions**:
1. **Check backend is running**:
   ```bash
   # Test endpoint
   curl -X POST http://localhost:3000/push/register \
     -H "Content-Type: application/json" \
     -d '{"token":"test-token"}'
   ```

2. **Verify CORS settings**:
   ```javascript
   // Express CORS setup
   app.use(cors({
     origin: ['http://localhost:3000', 'https://yourdomain.com']
   }))
   ```

3. **Check credentials.json**:
   - Must be valid Firebase service account file
   - Must be accessible to backend
   - Check file permissions

#### "Firebase Admin SDK error"
**Problem**: Backend Firebase initialization fails.

**Solutions**:
1. **Verify credentials.json**:
   ```bash
   # Test JSON validity
   node -e "console.log(JSON.parse(require('fs').readFileSync('credentials.json', 'utf8')))"
   ```

2. **Check required fields**:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"
   }
   ```

3. **Environment variables**:
   ```javascript
   // Alternative to credentials.json
   admin.initializeApp({
     credential: admin.credential.cert({
       projectId: process.env.FIREBASE_PROJECT_ID,
       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
       privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
     })
   })
   ```

### Version Compatibility Issues

#### "Firebase version mismatch"
**Problem**: Firebase version not compatible.

**Solutions**:
1. **Update Firebase**:
   ```bash
   npm install firebase@latest
   # Or specific version
   npm install firebase@10.12.0
   ```

2. **Check compatibility matrix**:
   - Firebase: >=10.0.0 and <13.0.0
   - React: >=17.0.0
   - Node: >=18.0.0

3. **Proceed with warning**:
   - CLI will ask if you want to continue
   - Some features may not work with incompatible versions

#### "React version too old"
**Problem**: React version not supported.

**Solutions**:
```bash
# Update React
npm install react@latest react-dom@latest

# Or upgrade project
npx create-react-app@latest new-app
# Migrate code to new app
```

### Development Environment Issues

#### "TypeScript compilation errors"
**Problem**: Generated TypeScript files have errors.

**Solutions**:
1. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "target": "es2018",
       "module": "esnext",
       "moduleResolution": "node",
       "allowSyntheticDefaultImports": true,
       "esModuleInterop": true
     }
   }
   ```

2. **Install missing types**:
   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

3. **Check generated files**:
   - Files should be in `src/push/` directory
   - Extensions should match project language (.ts or .js)

#### "Hot reload not working"
**Problem**: Changes not reflected in development.

**Solutions**:
1. **Restart development server**:
   ```bash
   npm start
   # Or
   npm run dev
   ```

2. **Clear browser cache**:
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear cache in developer tools

3. **Check service worker**:
   ```javascript
   // Unregister old service worker
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister())
   })
   ```

### Production Issues

#### "Push notifications not working in production"
**Problem**: Works in development but not production.

**Solutions**:
1. **Check Firebase project settings**:
   - Ensure production domain is added to Firebase
   - Check that web app is configured for production

2. **Verify HTTPS**:
   - Push notifications require HTTPS in production
   - Ensure SSL certificate is valid

3. **Check service worker scope**:
   - Service worker must be at root or appropriate scope
   - Verify `firebase-messaging-sw.js` is accessible

4. **Test with Firebase Console**:
   - Send test notification from Firebase Console
   - Check if it appears in production

#### "High error rate in production"
**Problem**: Many failed push notifications.

**Solutions**:
1. **Monitor token lifecycle**:
   ```javascript
   // Handle token refresh
   messaging.onTokenRefresh(async () => {
     const newToken = await messaging.getToken()
     await updateTokenOnServer(newToken)
   })
   ```

2. **Clean up invalid tokens**:
   ```javascript
   // Remove tokens that return errors
   if (error.code === 'messaging/invalid-registration-token') {
     await deleteTokenFromServer(token)
   }
   ```

3. **Check quotas and limits**:
   - Firebase has daily limits on free tier
   - Monitor usage in Firebase Console

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Enable debug mode
DEBUG=custom-push:* npx custom-push init

# Or set environment variable
export DEBUG=custom-push:*
npx custom-push init
```

### Browser Console Debugging

Add these debugging snippets to your browser console:

```javascript
// Check notification permission
console.log('Permission:', Notification.permission)

// Check service worker registration
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service workers:', registrations)
})

// Get FCM token
messaging.getToken().then(token => {
  console.log('FCM token:', token)
}).catch(error => {
  console.error('Token error:', error)
})

// Test foreground message
messaging.onMessage(payload => {
  console.log('Foreground message:', payload)
})
```

### Getting Help

If you're still stuck:

1. **Check the logs**:
   ```bash
   # CLI logs
   npx custom-push init --verbose
   
   # Browser console
   # Open developer tools and check for errors
   ```

2. **Create minimal reproduction**:
   - Create fresh React project
   - Run custom-push init
   - Test basic functionality

3. **File an issue**:
   - Include error messages
   - Share your our_pkg.json (remove sensitive data)
   - Describe your environment (Node version, browser, etc.)

4. **Community resources**:
   - GitHub Issues
   - Stack Overflow with `custom-push` tag
   - Firebase documentation

## Advanced Troubleshooting

### Network Issues

If you're behind a corporate firewall or proxy:

```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use npm registry mirror
npm config set registry https://registry.npmjs.org/
```

### Docker Issues

For Dockerized applications:

```dockerfile
# Ensure Node.js version
FROM node:18-alpine

# Copy service worker to public directory
COPY public/firebase-messaging-sw.js ./public/

# Set environment variables
ENV NODE_ENV=production
```

### CI/CD Issues

For automated deployments:

```yaml
# GitHub Actions example
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    
- name: Install dependencies
  run: npm ci
  
- name: Setup push notifications
  run: npx custom-push init --yes
  env:
    FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
    # ... other env vars
```
