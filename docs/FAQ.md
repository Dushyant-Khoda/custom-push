# Frequently Asked Questions

## General Questions

### What is custom-push?
**custom-push** is a CLI tool that sets up Firebase Cloud Messaging push notifications in React projects with a single command. It handles all the complex setup including service workers, token management, and backend integration.

### How is this different from Firebase's official setup?
- **Simplicity**: One command vs manual setup
- **Auto-detection**: Automatically detects your project structure
- **Backend support**: Includes Express/NestJS scaffolding
- **Conflict resolution**: Handles existing files gracefully
- **Production ready**: Generates complete, working code

### Do I need to know Firebase to use this?
No! The CLI guides you through getting your Firebase configuration and handles all the technical implementation. You just need to:
1. Create a Firebase project
2. Copy the configuration values
3. Run the CLI

## Installation & Setup

### Do I need to install anything?
No installation required! Use it directly with:
```bash
npx custom-push init
```

### Can I install it globally?
Yes:
```bash
npm install -g custom-push
custom-push init
```

### What are the system requirements?
- Node.js >= 18.0.0
- React project (any framework)
- Firebase project (free tier works)

### Will this work with my existing React project?
Yes! The CLI is designed to work with any React project:
- Create React App
- Next.js (Pages and App Router)
- Vite
- Custom webpack setups
- TypeScript or JavaScript

### Does it work with Next.js App Router?
Yes. The `CustomPushProvider` and `usePushMessage` hook are marked with `'use client'`, making them fully compatible with the Next.js App Router. You should wrap your app (or specific layouts) in a Client Component that includes the provider. See [Next.js Example](./EXAMPLES.md#nextjs-app-router-integration).

## Configuration

### Where is the configuration stored?
All configuration is stored in `our_pkg.json` in your project root. This file contains:
- Firebase configuration
- Backend endpoints
- Project metadata
- Version compatibility info

### Can I change the configuration after setup?
Yes! Simply edit `our_pkg.json`. The changes will be picked up immediately.

### What if I lose my Firebase credentials?
You can regenerate them:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Update the `credentials.json` file path in `our_pkg.json`

### How do I update Firebase configuration?
Edit `our_pkg.json`:
```json
{
  "firebase": {
    "apiKey": "your-new-api-key",
    "authDomain": "your-new-auth-domain",
    // ... other fields
  }
}
```

## Browser & Permissions

### Do users need to grant permission?
Yes, users must grant notification permission. The CLI handles this with a graceful fallback:
- Shows permission request
- Handles denial gracefully
- Provides guidance for enabling in browser settings

### Will this work on all browsers?
Modern browsers that support:
- Service Workers
- Push API
- Notifications API
- Firebase SDK requirements

Supported browsers:
- Chrome (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (limited support)
- Edge (Chromium-based)

### Does this require HTTPS?
Yes, for production:
- **Development**: Works on `localhost`
- **Production**: Requires HTTPS (required by browsers for push notifications)

### What about mobile browsers?
Yes! Progressive Web Apps (PWAs) on mobile devices support push notifications through the same implementation.

## Backend Integration

### Do I need a backend?
Not necessarily! You can:
- **Frontend only**: Use Firebase Console to send notifications
- **With backend**: Enable token management and targeted notifications

### Which backend frameworks are supported?
- **Express**: Automatic detection and scaffolding
- **NestJS**: Automatic detection and scaffolding
- **Custom**: Use the generated helpers as reference

### What if I don't use Express or NestJS?
The generated helper files are framework-agnostic. You can adapt them to:
- Fastify
- Koa
- Hapi
- Custom Node.js servers
- Other languages (Python, Ruby, etc.)

### Do I need Firebase Admin SDK?
Yes, for backend features like:
- Sending targeted notifications
- Token management
- Custom notification logic

The CLI scaffolds this for you automatically.

## Notification Features

### Can I send notifications with images?
Yes! Include an `icon` or `image` field:
```javascript
{
  notification: {
    title: "New Message",
    body: "You have a new message",
    icon: "/message-icon.png",
    image: "/preview-image.jpg"
  }
}
```

### Can I send custom data?
Yes! Use the `data` field:
```javascript
{
  notification: { title: "New Order", body: "Order #123" },
  data: {
    orderId: "123",
    customerId: "456",
    route: "/orders/123"
  }
}
```

### How do I handle notification clicks?
The service worker automatically handles clicks and can navigate to routes. You can customize this behavior in the generated service worker.

### Can I schedule notifications?
Not directly through the CLI, but you can:
- Use Firebase Cloud Functions
- Implement scheduling in your backend
- Use cron jobs with your backend

## Security & Privacy

### Is my Firebase config secure?
The web config (API keys, etc.) is public by design and safe to expose. The sensitive credentials (service account) should never be exposed to the frontend.

### Should I commit credentials.json?
No! The CLI automatically adds `credentials.json` to `.gitignore`.

### How do I handle authentication?
The CLI scaffolds token registration endpoints. You should:
- Add authentication middleware
- Associate tokens with user accounts
- Validate requests

### What about GDPR/compliance?
You're responsible for:
- Getting user consent
- Providing opt-out options
- Handling data requests
- Complying with relevant regulations

## Troubleshooting

### No package.json found"
Make sure you're running the command from your React project root directory where `package.json` is located.

### Permission denied"
Users must enable notifications in their browser settings. Provide clear instructions in your UI.

### Service worker failed to register"
Check that:
- Service worker is in `public/` directory
- You're using HTTPS (or localhost)
- No JavaScript errors in console

### Notifications not working in production"
Verify:
- HTTPS is properly configured
- Firebase project settings include your production domain
- Service worker is accessible at the correct path

### Backend token registration fails"
Check:
- Backend is running and accessible
- CORS is configured correctly
- Firebase Admin SDK is properly initialized

## Scaling & Performance

### Can this handle many users?
Yes! The implementation uses:
- Firebase's scalable infrastructure
- Efficient token management
- Minimal client-side overhead

### What are the limits?
Firebase free tier includes:
- 10,000 messages per day
- Unlimited devices (with some limitations)
- Check Firebase pricing for higher tiers

### How do I monitor performance?
Use:
- Firebase Console analytics
- Your backend monitoring
- Browser developer tools
- Custom logging in the generated helpers

##  Updates & Maintenance

### How do I update the setup?
Run the CLI again:
```bash
npx custom-push init
```
It will detect existing files and offer to update them.

### Will updates break my code?
No! The CLI:
- Preserves your custom changes
- Only updates generated files
- Shows diffs before applying changes

### How do I update Firebase SDK?
```bash
npm install firebase@latest
```

### What about React updates?
The generated code is framework-agnostic and should work with React updates. Test thoroughly after major React version changes.

## Contributing & Support

### How can I contribute?
- Report bugs on GitHub
- Suggest features
- Submit pull requests
- Improve documentation

### Where do I get help?
- Check this FAQ
- Read the troubleshooting guide
- Search GitHub issues
- Create a new issue with details

### Is this officially supported by Firebase?
No, this is a community tool. Firebase support is handled through official Firebase channels.

## Licensing

### Can I use this in commercial projects?
Yes! This is MIT licensed. You can use it in personal and commercial projects.

### Do I need to credit the CLI?
No attribution required, but appreciated!

### Can I modify the generated code?
Yes! The generated code is yours to modify as needed.

## Future Features

### What's planned for future versions?
- More backend framework support
- Advanced notification patterns
- Better testing tools
- Enhanced debugging features

### How can I request features?
Create an issue on GitHub with:
- Feature description
- Use case
- Implementation ideas (optional)

### When will the next version be released?
Check the GitHub repository for release schedules and roadmaps.

---

## Still Need Help?

If you couldn't find your answer here:

1. **Check the documentation**: [README](./README.md), [API Reference](./API.md), [Examples](./EXAMPLES.md)
2. **Search existing issues**: [GitHub Issues](https://github.com/your-repo/custom-push/issues)
3. **Create a new issue**: Include details about your setup and the problem
4. **Community forums**: Stack Overflow, Discord, Reddit

Remember to include:
- Your environment (Node version, browser, OS)
- Error messages
- Steps to reproduce
- Your `our_pkg.json` (remove sensitive data)
