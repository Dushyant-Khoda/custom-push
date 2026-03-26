---
name: custom-push-cli
description: >
  Scaffold a complete, production-ready CLI tool called custom-push that works like create-react-app
  for Firebase Cloud Messaging push notifications. Use this skill when asked to build a push
  notification CLI, an npx init tool for FCM, a push notification scaffolder, or any interactive
  terminal wizard that sets up Firebase push notifications in an existing React project.
  The output is a fully working, publishable CLI package with auto-detection, interactive prompts,
  conflict detection, version validation, service worker generation, credentials.json handling,
  and optional backend scaffolding for Express or NestJS — all controlled from our_pkg.json.
---

# custom-push CLI

A skill for building a production-grade CLI tool (`npx custom-push init`) that sets up Firebase
push notifications in any existing React project. Detects the stack automatically, asks only what
it cannot detect, validates versions, handles conflicts, and scaffolds everything needed for
push notifications to work — frontend and backend — in one command.

---

## What You Are Building

A CLI tool with these characteristics:

- Runs in any existing React project via `npx custom-push init`
- **Auto-detects** language, framework, backend, versions from `package.json` and `tsconfig.json`
- Asks only **4 questions maximum** — nothing that can be detected is ever asked
- Validates Firebase and React version compatibility — clear warnings, exits cleanly on mismatch
- Reads `credentials.json` (Firebase service account) if user provides path — copies to root if outside project, adds to `.gitignore` automatically
- Detects file conflicts — asks user: overwrite / skip / view content / show diff
- Writes `our_pkg.json` to project root — single source of truth for all config
- Copies and pre-fills `firebase-messaging-sw.js` into `/public`
- Scaffolds typed frontend helper files ready to import
- Scaffolds backend helper files for Express or NestJS (if detected)
- If both NestJS and Express detected — NestJS always takes priority, no question asked
- Prints a clean summary: created / skipped / warnings / next steps

---

## Full Package Structure

Scaffold exactly this structure:

```
custom-push/
│
├── bin/
│   └── cli.js                          ← Shebang entry point, calls src/index
│
├── src/
│   ├── index.ts                        ← Orchestrator, runs all steps in order
│   │
│   ├── steps/
│   │   ├── detectProject.ts            ← Reads package.json + tsconfig → ProjectInfo
│   │   ├── validateVersions.ts         ← Firebase + React version checks
│   │   ├── runPrompts.ts               ← Interactive questions (only undetectable things)
│   │   ├── readCredentials.ts          ← Handles credentials.json path, copy, parse, .gitignore
│   │   ├── checkConflicts.ts           ← Detects existing files, conflict resolution UI
│   │   ├── generateConfig.ts           ← Writes our_pkg.json
│   │   ├── scaffoldFrontend.ts         ← SW file + frontend helper files
│   │   ├── scaffoldBackend.ts          ← Express or NestJS helpers (if detected)
│   │   └── printSummary.ts             ← Final terminal output
│   │
│   ├── templates/
│   │   ├── sw.template.js              ← Service worker template with {{TOKEN}} placeholders
│   │   ├── frontend/
│   │   │   ├── pushHelper.ts.tpl       ← TypeScript frontend helper template
│   │   │   └── pushHelper.js.tpl       ← JavaScript frontend helper template
│   │   └── backend/
│   │       ├── express/
│   │       │   ├── pushHelper.ts.tpl
│   │       │   ├── pushHelper.js.tpl
│   │       │   └── pushRoutes.ts.tpl
│   │       └── nestjs/
│   │           ├── push.module.ts.tpl
│   │           ├── push.service.ts.tpl
│   │           └── push.controller.ts.tpl
│   │
│   ├── utils/
│   │   ├── logger.ts                   ← Colored terminal output helpers
│   │   ├── fileUtils.ts                ← read, write, exists, copy, diff utilities
│   │   └── templateEngine.ts          ← {{VAR}} token replacer for all templates
│   │
│   └── types.ts                        ← All TypeScript interfaces
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Step-by-Step Build Instructions

Complete every step fully before moving to the next.
Every file must be production-ready — no TODOs, no placeholder logic.

---

### STEP 1 — `src/types.ts`

Define every interface used across the CLI. All other files import from here only.

```typescript
export type Language = 'typescript' | 'javascript'
export type BackendFramework = 'express' | 'nestjs' | null
export type Scope = 'frontend' | 'both'
export type ConflictResolution = 'overwrite' | 'skip' | 'view' | 'diff'

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

export interface BackendConfig {
  registerUrl: string
  unregisterUrl: string
  credentialsPath: string | null        // relative path from project root
}

export interface ProjectInfo {
  rootDir: string                       // absolute path to project root
  srcDir: string                        // absolute path to src/ or rootDir if no src/
  publicDir: string                     // absolute path to public/
  language: Language
  reactVersion: string | null
  firebaseVersion: string | null
  hasFirebase: boolean
  backendFramework: BackendFramework    // nestjs takes priority over express if both present
  scope: Scope                          // 'both' if backendFramework !== null
  hasTsConfig: boolean
  packageJson: Record<string, any>
}

export interface UserAnswers {
  firebase: FirebaseWebConfig
  backendUrls: BackendConfig
  credentialsPath: string | null
}

export interface ScaffoldedFile {
  absolutePath: string
  relativePath: string                  // relative to project root, shown in summary
  status: 'created' | 'skipped' | 'overwritten'
  description: string
}

export interface VersionWarning {
  package: string
  found: string
  required: string
  fix: string                           // exact npm command to run
}

export interface CLIContext {
  project: ProjectInfo
  answers: UserAnswers
  scaffolded: ScaffoldedFile[]
  warnings: VersionWarning[]
}
```

Rules:
- Export every interface — other steps import them directly
- Every nullable field is explicitly typed as `T | null` — never `T | undefined`
- `backendFramework` is `null` when no backend detected, never `undefined`

---

### STEP 2 — `src/utils/logger.ts`

Colored, prefixed terminal output. Uses `chalk` (add to dependencies).

Export these functions only:

```typescript
logger.info(message: string)        // blue   ℹ  message
logger.success(message: string)     // green  ✓  message
logger.warn(message: string)        // yellow ⚠  message
logger.error(message: string)       // red    ✖  message
logger.step(n: number, label: string) // white  [n] label
logger.divider()                    // prints ──────────────────────────────
logger.blank()                      // prints empty line
```

Rules:
- Never use `console.log` anywhere else in the codebase — always use logger
- `logger.error` does NOT call `process.exit` — the caller decides
- All prefixes are padded so output aligns cleanly in terminal

---

### STEP 3 — `src/utils/fileUtils.ts`

All filesystem operations. Uses Node `fs/promises` and `path` only — no extra dependencies.

Export:

```typescript
fileExists(filePath: string): Promise<boolean>
readFile(filePath: string): Promise<string>
writeFile(filePath: string, content: string): Promise<void>   // creates dirs recursively
copyFile(src: string, dest: string): Promise<void>
readJson<T>(filePath: string): Promise<T>
writeJson(filePath: string, data: unknown): Promise<void>     // 2-space indent
getDiff(existingPath: string, newContent: string): string     // +/- per line
appendToFile(filePath: string, line: string): Promise<void>   // for .gitignore
ensureDir(dirPath: string): Promise<void>
```

Rules:
- `writeFile` must call `fs.mkdir(dir, { recursive: true })` before writing
- `getDiff` produces human-readable output with `+` / `-` line prefixes
- `readJson` throws with a message that includes the file path if JSON is invalid

---

### STEP 4 — `src/utils/templateEngine.ts`

Simple `{{VAR}}` token replacer. No external dependencies.

```typescript
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string
```

Rules:
- Replace all occurrences of `{{KEY}}` with `vars[KEY]`
- If a key exists in the template but not in `vars`, replace with empty string — never throw
- Works for both code and JSON templates

---

### STEP 5 — `src/steps/detectProject.ts`

Auto-detects everything. Called first — before any prompts.

Export:
```typescript
export async function detectProject(cwd: string): Promise<ProjectInfo>
```

Implement each detection exactly:

**`rootDir`** — the `cwd` passed in

**`package.json`** — read from `rootDir/package.json`. If missing, call `logger.error` then `process.exit(1)`:
```
✖  No package.json found. Run custom-push init from your project root.
```

**`language`** — `tsconfig.json` exists in `rootDir` → `'typescript'`, else `'javascript'`

**`reactVersion`** — from `dependencies['react'] || devDependencies['react']`, strip `^~`, null if missing

**`firebaseVersion`** — from `dependencies['firebase']`, strip `^~`, null if missing

**`hasFirebase`** — `firebaseVersion !== null`

**`backendFramework`** — check in this exact priority order:
1. `@nestjs/core` in dependencies or devDependencies → `'nestjs'`
2. else `express` in dependencies → `'express'`
3. else → `null`
NestJS always wins. No log needed.

**`scope`** — `'both'` if `backendFramework !== null`, else `'frontend'`

**`srcDir`** — `rootDir/src` exists → use it, else use `rootDir`

**`publicDir`** — `rootDir/public` exists → use it, else create it and log:
```
ℹ  No /public directory found. Created it.
```

---

### STEP 6 — `src/steps/validateVersions.ts`

Compatibility matrix (hardcode exactly):
```
firebase: >=10.0.0 and <13.0.0
react:    >=17.0.0
```

Export:
```typescript
export function validateVersions(project: ProjectInfo): VersionWarning[]
```

Rules:
- Use `semver` package for all comparisons
- Returns array of `VersionWarning` — empty means all compatible
- Does NOT exit — caller handles the result
- Firebase not installed at all produces:
```typescript
{ package: 'firebase', found: 'not installed', required: '>=10.0.0 <13.0.0', fix: 'npm install firebase@latest' }
```
- React not found produces:
```typescript
{ package: 'react', found: 'not installed', required: '>=17.0.0', fix: 'npm install react@latest' }
```

In `src/index.ts` after calling `validateVersions`:
- Print each warning:
```
⚠  firebase version mismatch
   Found:    9.23.0
   Required: >=10.0.0 <13.0.0
   Fix:      npm install firebase@latest
```
- Ask: `"Versions above may cause issues. Continue anyway? (y/N)"`
- N → `process.exit(0)` with: `"Fix the above and re-run: npx custom-push init"`
- Y → `logger.warn("Proceeding with incompatible versions. Things may break.")` then continue

---

### STEP 7 — `src/steps/runPrompts.ts`

Uses `@inquirer/prompts`. Asks ONLY what cannot be auto-detected. Maximum 4 questions.

Export:
```typescript
export async function runPrompts(project: ProjectInfo): Promise<UserAnswers>
```

**Question 1 — Firebase web config** (always asked — values cannot be detected)

Ask each field as a separate `input` prompt. Show this header first:
```
  Get your config from:
  Firebase Console → Project Settings → Your apps → SDK setup and configuration
```
Fields (all required, re-prompt if empty):
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

**Question 2 — VAPID key** (always asked)
```
? Enter your VAPID key (Web Push certificate)
  Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
  Link: https://console.firebase.google.com/project/_/settings/cloudmessaging
```
Required — re-prompt if empty.

**Question 3 — Backend register URL** (only if `project.scope === 'both'`)
```
? Token registration URL  (e.g. http://localhost:3000/push/register)
? Token unregister URL    (optional — press Enter to skip)
```
Register URL required. Unregister URL optional.

**Question 4 — credentials.json path** (only if `project.scope === 'both'`)
```
? Path to your Firebase credentials.json (service account file)

  Don't have one? Generate it here:
  1. Go to https://console.firebase.google.com
  2. Project Settings → Service Accounts → Generate new private key
  3. Download the JSON file and paste its path below.

  Press Enter to skip and add it manually to our_pkg.json later.
```
Optional — empty is allowed, sets `credentialsPath: null`.

---

### STEP 8 — `src/steps/readCredentials.ts`

Export:
```typescript
export async function readCredentials(
  inputPath: string,
  project: ProjectInfo
): Promise<string>   // returns absolute path to credentials.json in project root
```

Implement in this exact order:

1. Resolve to absolute path via `path.resolve(inputPath)`
2. File not found → `logger.error` + `process.exit(1)`:
   ```
   ✖  File not found: /path/they/gave
      Check the path and re-run: npx custom-push init
   ```
3. Parse JSON — invalid → exit:
   ```
   ✖  credentials.json is not valid JSON. Check the file and try again.
   ```
4. Validate required fields: `type`, `project_id`, `private_key`, `client_email`
   Missing fields → list them and exit:
   ```
   ✖  credentials.json is missing required fields: private_key, client_email
      Download the correct service account file from Firebase Console.
   ```
5. Already inside `project.rootDir`:
   - YES → `logger.success("credentials.json found in project root")`
   - NO → copy to `project.rootDir/credentials.json` → `logger.success("Copied credentials.json to project root")`
6. Check `.gitignore`:
   - If `credentials.json` not already listed → `appendToFile(rootDir/.gitignore, 'credentials.json')`
   - Always log: `logger.success("credentials.json added to .gitignore — never commit this file")`
7. Return absolute path of credentials.json in project root

---

### STEP 9 — `src/steps/checkConflicts.ts`

Export:
```typescript
export async function checkConflicts(
  filesToWrite: Array<{ path: string; content: string; description: string }>,
  project: ProjectInfo
): Promise<Array<{ path: string; content: string; description: string; action: 'write' | 'skip' }>>
```

For each file that already exists, show this prompt using `@inquirer/prompts` `select`:
```
  conflict  public/firebase-messaging-sw.js

? What do you want to do?
  ❯ Overwrite   — replace existing file
    Skip        — keep existing file
    View        — show current file content
    Diff        — show what would change
```

Rules:
- `View` → print current file content → re-show same prompt for same file
- `Diff` → call `getDiff(existingPath, newContent)` → print it → re-show same prompt
- Only `Overwrite` or `Skip` resolves the conflict and advances to next file
- Files that do not exist → automatically get `action: 'write'`, no prompt
- Never write anything in this step — only resolve actions

---

### STEP 10 — `src/steps/generateConfig.ts`

Export:
```typescript
export async function generateConfig(context: CLIContext): Promise<void>
```

`our_pkg.json` shape to write:

```json
{
  "version": "1.0.0",
  "generatedAt": "<ISO timestamp>",
  "customPushVersion": "<version from CLI package.json>",
  "stack": {
    "language": "<typescript|javascript>",
    "scope": "<frontend|both>",
    "backendFramework": "<express|nestjs|null>"
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
    "credentialsPath": null
  },
  "serviceWorker": {
    "path": "/firebase-messaging-sw.js",
    "generatedAt": "<ISO timestamp>"
  },
  "compatibility": {
    "firebaseRequired": ">=10.0.0 <13.0.0",
    "reactRequired": ">=17.0.0",
    "firebaseInstalled": "<detected version or null>",
    "reactInstalled": "<detected version or null>"
  }
}
```

Rules:
- `credentialsPath` → relative path from project root (e.g. `"./credentials.json"`) or `null`
- Run `checkConflicts` for `our_pkg.json` before writing
- If user skips → log `ℹ  Kept existing our_pkg.json` and return
- If overwriting → replace entire file, never partial merge

---

### STEP 11 — `src/templates/sw.template.js`

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// Firebase Messaging Service Worker
// Generated by custom-push — do not edit manually.
// To regenerate: npx custom-push init
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            '{{API_KEY}}',
  authDomain:        '{{AUTH_DOMAIN}}',
  projectId:         '{{PROJECT_ID}}',
  storageBucket:     '{{STORAGE_BUCKET}}',
  messagingSenderId: '{{MESSAGING_SENDER_ID}}',
  appId:             '{{APP_ID}}'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  const title   = payload.notification?.title || 'New notification'
  const options = {
    body:  payload.notification?.body || '',
    icon:  payload.notification?.icon || '/icon.png',
    badge: '/badge.png',
    data:  payload.data || {}
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const route = event.notification.data?.route || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(route)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(route)
    })
  )
})
```

Tokens: `{{API_KEY}}`, `{{AUTH_DOMAIN}}`, `{{PROJECT_ID}}`, `{{STORAGE_BUCKET}}`, `{{MESSAGING_SENDER_ID}}`, `{{APP_ID}}`

`vapidKey` is NOT in the SW — it belongs in the frontend hook only.

---

### STEP 12 — Frontend Helper Templates

#### `src/templates/frontend/pushHelper.ts.tpl`

```typescript
// Generated by custom-push — edit as needed.
import { usePushNotification } from 'custom-push/runtime'
import ourPkg from '../../our_pkg.json'

export function usePush() {
  return usePushNotification({
    firebase: ourPkg.firebase,
    backend: {
      registerUrl:   ourPkg.backend.registerUrl,
      unregisterUrl: ourPkg.backend.unregisterUrl || undefined,
      getAuthToken:  () => localStorage.getItem('auth_token') ?? '',
    },
    options: {
      onMessage: (payload) => {
        // Foreground push received — plug in your toast library here
        console.log('[push] foreground:', payload.title, payload.body)
      },
      onReady: (token) => {
        console.log('[push] ready. token:', token)
      },
      onPermissionDenied: () => {
        console.warn('[push] permission denied')
      },
      onError: (err) => {
        console.error('[push] error:', err.message)
      },
    },
  })
}
```

#### `src/templates/frontend/pushHelper.js.tpl`

Same logic, no TypeScript annotations, no type imports.

Rules for both:
- Import from `'custom-push/runtime'` — the runtime hook the package exposes
- Read config from `our_pkg.json` — never hardcode values
- Export single named function `usePush`

---

### STEP 13 — Express Backend Templates

#### `src/templates/backend/express/pushHelper.ts.tpl`

```typescript
// Generated by custom-push — edit as needed.
import * as admin from 'firebase-admin'
import * as path from 'path'
import ourPkg from '../our_pkg.json'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(ourPkg.backend.credentialsPath ?? './credentials.json')
    ),
  })
}

export async function sendPushNotification(params: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
  route?: string
}): Promise<string> {
  const message: admin.messaging.Message = {
    token: params.token,
    notification: { title: params.title, body: params.body },
    data: { ...(params.data || {}), route: params.route || '/' },
    webpush: {
      notification: { title: params.title, body: params.body, icon: '/icon.png' },
    },
  }
  return admin.messaging().send(message)
}
```

#### `src/templates/backend/express/pushRoutes.ts.tpl`

```typescript
// Generated by custom-push — edit as needed.
import { Router, Request, Response } from 'express'

const router = Router()

// POST /push/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'token is required' })
    // TODO: get userId from your auth middleware (e.g. req.user.id)
    // await db.pushTokens.upsert({ userId, token })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to register token' })
  }
})

// POST /push/unregister
router.post('/unregister', async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'token is required' })
    // TODO: await db.pushTokens.delete({ token })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to unregister token' })
  }
})

export default router
```

JS variants of both — same logic, no TypeScript annotations.

---

### STEP 14 — NestJS Backend Templates

NestJS templates are always TypeScript — no JS variant.

#### `src/templates/backend/nestjs/push.module.ts.tpl`

```typescript
import { Module } from '@nestjs/common'
import { PushController } from './push.controller'
import { PushService } from './push.service'

@Module({
  controllers: [PushController],
  providers:   [PushService],
  exports:     [PushService],
})
export class PushModule {}
```

#### `src/templates/backend/nestjs/push.service.ts.tpl`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common'
import * as admin from 'firebase-admin'
import * as path from 'path'
import ourPkg from '../our_pkg.json'

@Injectable()
export class PushService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          path.resolve(ourPkg.backend.credentialsPath ?? './credentials.json')
        ),
      })
    }
  }

  async registerToken(userId: string, token: string): Promise<void> {
    // TODO: persist to your database
    // await this.db.pushTokens.upsert({ userId, token })
  }

  async unregisterToken(token: string): Promise<void> {
    // TODO: await this.db.pushTokens.delete({ token })
  }

  async sendNotification(params: {
    token: string
    title: string
    body: string
    data?: Record<string, string>
    route?: string
  }): Promise<string> {
    const message: admin.messaging.Message = {
      token: params.token,
      notification: { title: params.title, body: params.body },
      data: { ...(params.data || {}), route: params.route || '/' },
      webpush: {
        notification: { title: params.title, body: params.body, icon: '/icon.png' },
      },
    }
    return admin.messaging().send(message)
  }
}
```

#### `src/templates/backend/nestjs/push.controller.ts.tpl`

```typescript
import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { PushService } from './push.service'

class RegisterTokenDto   { token: string }
class UnregisterTokenDto { token: string }

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('register')
  @HttpCode(200)
  async register(@Body() body: RegisterTokenDto) {
    // TODO: extract userId from your auth guard
    await this.pushService.registerToken('userId', body.token)
    return { success: true }
  }

  @Post('unregister')
  @HttpCode(200)
  async unregister(@Body() body: UnregisterTokenDto) {
    await this.pushService.unregisterToken(body.token)
    return { success: true }
  }
}
```

---

### STEP 15 — `src/steps/scaffoldFrontend.ts`

Export:
```typescript
export async function scaffoldFrontend(context: CLIContext): Promise<ScaffoldedFile[]>
```

Files to write:

1. `{project.publicDir}/firebase-messaging-sw.js`
   - Read `src/templates/sw.template.js`
   - Replace tokens with firebase config values via `templateEngine`
   - Description: `"Firebase service worker — handles background push"`

2. `{project.srcDir}/push/pushHelper.{ts|js}` (extension from `project.language`)
   - Read matching frontend template
   - No token replacement — template reads `our_pkg.json` directly
   - Description: `"Frontend helper — import usePush() anywhere in your app"`

Rules:
- Run all files through `checkConflicts` before writing
- Record each result in `context.scaffolded` with correct `status`
- Call `ensureDir({project.srcDir}/push)` before writing

---

### STEP 16 — `src/steps/scaffoldBackend.ts`

Only called when `project.scope === 'both'`.

Export:
```typescript
export async function scaffoldBackend(context: CLIContext): Promise<ScaffoldedFile[]>
```

**Express** (`project.backendFramework === 'express'`):
- Write `{srcDir}/push/pushHelper.{ts|js}`
- Write `{srcDir}/push/pushRoutes.{ts|js}`
- After writing, log:
  ```
  ℹ  Mount push routes in your Express app:
     import pushRoutes from './push/pushRoutes'
     app.use('/push', pushRoutes)
  ```

**NestJS** (`project.backendFramework === 'nestjs'`):
- Write `{srcDir}/push/push.module.ts`
- Write `{srcDir}/push/push.service.ts`
- Write `{srcDir}/push/push.controller.ts`
- After writing, log:
  ```
  ℹ  Import PushModule in your AppModule:
     import { PushModule } from './push/push.module'
     @Module({ imports: [PushModule] })
  ```

Rules:
- Always TypeScript for NestJS
- Use `project.language` for Express template selection
- Run all files through `checkConflicts` before writing

---

### STEP 17 — `src/steps/printSummary.ts`

Export:
```typescript
export async function printSummary(context: CLIContext): Promise<void>
```

Print in this exact order, omitting any section that has no content:

```
──────────────────────────────────────────────
  custom-push setup complete
──────────────────────────────────────────────

  Created
  ✓  public/firebase-messaging-sw.js     Firebase service worker
  ✓  src/push/pushHelper.ts              Frontend push helper

  Skipped
  –  our_pkg.json                        Kept existing file

  Warnings
  ⚠  firebase@9.x — run: npm install firebase@latest

  Next steps
  [1] Add usePush() to your app root:
      import { usePush } from './push/pushHelper'
      function App() { usePush(); return <YourApp /> }

  [2] Add /public/icon.png (displayed on push notifications)

  [3] Mount push routes — see instructions above

  All config lives in our_pkg.json — edit anytime.
──────────────────────────────────────────────
```

Rules:
- Omit `Skipped` section entirely if nothing was skipped
- Omit `Warnings` section entirely if no warnings
- Only show step `[3]` if `project.scope === 'both'`
- Show relative paths from project root in all file listings

---

### STEP 18 — `src/index.ts`

The orchestrator. No logic here — only calls steps in order.

```typescript
export async function main(): Promise<void> {
  const cwd = process.cwd()

  logger.blank()
  logger.divider()
  logger.info('custom-push init')
  logger.divider()
  logger.blank()

  logger.step(1, 'Detecting project...')
  const project = await detectProject(cwd)

  logger.step(2, 'Checking version compatibility...')
  const warnings = validateVersions(project)
  // print warnings, ask to continue if any — logic described in STEP 6

  logger.step(3, 'Configuring push notifications...')
  const answers = await runPrompts(project)

  if (answers.credentialsPath) {
    logger.step(4, 'Processing credentials.json...')
    answers.credentialsPath = await readCredentials(answers.credentialsPath, project)
  }

  const context: CLIContext = { project, answers, scaffolded: [], warnings }

  logger.step(5, 'Writing our_pkg.json...')
  await generateConfig(context)

  logger.step(6, 'Scaffolding frontend files...')
  context.scaffolded.push(...await scaffoldFrontend(context))

  if (project.scope === 'both') {
    logger.step(7, 'Scaffolding backend files...')
    context.scaffolded.push(...await scaffoldBackend(context))
  }

  await printSummary(context)
}
```

---

### STEP 19 — `bin/cli.js`

```javascript
#!/usr/bin/env node
'use strict'
require('../dist/index.js').main().catch((err) => {
  console.error('\n✖  Unexpected error:', err.message)
  process.exit(1)
})
```

---

### STEP 20 — `package.json`

```json
{
  "name": "custom-push",
  "version": "1.0.0",
  "description": "One command setup for Firebase push notifications in React",
  "bin": {
    "custom-push": "./bin/cli.js"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "bin",
    "dist",
    "src/templates"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@inquirer/prompts": "^5.0.0",
    "chalk": "^5.0.0",
    "semver": "^7.6.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/semver": "^7.5.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

---

### STEP 21 — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

`"module": "CommonJS"` — this is a Node CLI, not a browser bundle.

---

### STEP 22 — `README.md`

Sections in this order, each short:

1. What it does — two sentences
2. Requirements — Node >=18, Firebase >=10, React >=17
3. Usage — `npx custom-push init`
4. What gets generated — table: file path → what it does
5. `our_pkg.json` — full annotated shape
6. Updating config — edit `our_pkg.json`, re-run init
7. `credentials.json` — what it is, how to generate, why never commit
8. Backend setup — Express mount snippet, NestJS import snippet
9. Compatibility table — custom-push / firebase / react / node versions

---

## Critical Rules — Never Break These

1. **Never ask what can be detected** — language, backend framework, versions always come from `package.json` and `tsconfig.json`
2. **NestJS always wins** — `@nestjs/core` in deps → framework is NestJS, no prompt, no log
3. **Never write files without conflict check** — every file goes through `checkConflicts` first
4. **credentials.json always in .gitignore** — append automatically, never skip
5. **`our_pkg.json` is source of truth** — every generated file reads from it, never from hardcoded values
6. **Templates use `{{TOKEN}}` syntax only** — no logic in templates
7. **`logger` everywhere** — zero raw `console.log` outside `logger.ts`
8. **`bin/cli.js` is CommonJS** — `require`, not `import`
9. **All paths in `our_pkg.json` are relative** — never store absolute paths
10. **`process.exit(1)` only on unrecoverable errors** — version mismatch asks user first

---

## Validation Checklist

Before finishing, verify every item:

- [ ] `detectProject` uses `tsconfig.json` existence for language — never asks
- [ ] `detectProject` checks `@nestjs/core` before `express` — NestJS always wins
- [ ] `runPrompts` does NOT ask about language, framework, or scope — only firebase config, vapid, urls, credentials path
- [ ] `checkConflicts` loops until user picks Overwrite or Skip — View and Diff re-prompt
- [ ] `readCredentials` appends to `.gitignore` every time — never skips
- [ ] `readCredentials` validates all four required fields: `type`, `project_id`, `private_key`, `client_email`
- [ ] `our_pkg.json` stores `credentialsPath` as relative path
- [ ] SW template has NO `vapidKey` token — vapidKey is frontend only
- [ ] `scaffoldBackend` only runs when `project.scope === 'both'`
- [ ] NestJS templates are always `.ts` — no JS variant created
- [ ] `bin/cli.js` has `#!/usr/bin/env node` on line 1
- [ ] `package.json` has `"bin"` field pointing to `./bin/cli.js`
- [ ] `package.json` `"files"` array includes `"src/templates"`
- [ ] `printSummary` omits empty sections entirely
- [ ] Version mismatch asks user to continue — never forces exit
- [ ] All interfaces imported from `types.ts` — no local type definitions in step files