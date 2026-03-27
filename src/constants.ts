import * as path from 'path'

// ── Package paths ───────────────────────────────────────────────────────────
// In production (npm install), __dirname is dist/
// Templates are shipped in src/templates via "files" in package.json
export const PACKAGE_ROOT = path.resolve(__dirname, '..')
export const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'src', 'templates')

// ── Version compatibility ranges ────────────────────────────────────────────
export const FIREBASE_VERSION_RANGE = '>=10.0.0 <13.0.0'
export const REACT_VERSION_RANGE = '>=17.0.0'

// ── Output file names ───────────────────────────────────────────────────────
export const CONFIG_FILENAME = 'our_pkg.json'
export const CREDENTIALS_FILENAME = 'credentials.json'
export const SERVICE_WORKER_FILENAME = 'firebase-messaging-sw.js'
export const SERVICE_WORKER_FALLBACK_FILENAME = 'firebase-messaging-sw-tas.js'
export const GITIGNORE_FILENAME = '.gitignore'

// ── Template file names ─────────────────────────────────────────────────────
export const SW_TEMPLATE = 'sw.template.js'
export const FRONTEND_HELPER_TS = 'frontend/pushHelper.ts.tpl'
export const FRONTEND_HELPER_JS = 'frontend/pushHelper.js.tpl'

export const EXPRESS_HELPER_TS = 'backend/express/pushHelper.ts.tpl'
export const EXPRESS_HELPER_JS = 'backend/express/pushHelper.js.tpl'
export const EXPRESS_ROUTES_TS = 'backend/express/pushRoutes.ts.tpl'
export const EXPRESS_ROUTES_JS = 'backend/express/pushRoutes.js.tpl'

export const NESTJS_MODULE = 'backend/nestjs/push.module.ts.tpl'
export const NESTJS_SERVICE = 'backend/nestjs/push.service.ts.tpl'
export const NESTJS_CONTROLLER = 'backend/nestjs/push.controller.ts.tpl'
export const NOTIFICATION_CONFIG_TPL = 'backend/notification-config.json.tpl'

// ── Files-mode template names ───────────────────────────────────────────────
export const FILES_MODE_DIR = 'files-mode'
export const FILES_MODE_PROVIDER = 'files-mode/pushProvider.tsx.tpl'
export const FILES_MODE_HOOK = 'files-mode/usePushMessage.ts.tpl'
export const FILES_MODE_CONFIG = 'files-mode/pushConfig.ts.tpl'
export const FILES_MODE_TOKEN = 'files-mode/getPushToken.ts.tpl'
export const FILES_MODE_USAGE = 'files-mode/USAGE.md.tpl'

// ── Required credentials fields ─────────────────────────────────────────────
export const REQUIRED_CREDENTIAL_FIELDS = ['type', 'project_id', 'private_key', 'client_email']

// ── Firebase Console URLs ───────────────────────────────────────────────────
export const FIREBASE_CONSOLE_URL = 'https://console.firebase.google.com'
export const FIREBASE_MESSAGING_URL = 'https://console.firebase.google.com/project/_/settings/cloudmessaging'
export const FIREBASE_SERVICE_ACCOUNT_URL = 'https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk'
export const VAPID_GENERATOR_URL = 'https://web-push-codelab.glitch.me/'

// ── Safari Constants ────────────────────────────────────────────────────────
export const SAFARI_MIN_VERSION = 16
export const SAFARI_PUSH_DOCS_URL = 'https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers'
