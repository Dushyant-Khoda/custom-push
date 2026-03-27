import { input, confirm } from '@inquirer/prompts'
import * as path from 'path'
import { ProjectInfo, UserAnswers, FirebaseWebConfig, BackendConfig } from '../types'
import { logger } from '../utils/logger'
import { writeFile, readFile, fileExists, appendToFile } from '../utils/fileUtils'
import {
  FIREBASE_CONSOLE_URL,
  FIREBASE_MESSAGING_URL,
  FIREBASE_SERVICE_ACCOUNT_URL,
  VAPID_GENERATOR_URL,
  GITIGNORE_FILENAME,
} from '../constants'

async function requiredInput(message: string): Promise<string> {
  let value = ''
  while (!value.trim()) {
    value = await input({ message })
    if (!value.trim()) {
      logger.warn('  This field is required. Please enter a value.')
    }
  }
  return value.trim()
}

async function optionalInput(message: string): Promise<string> {
  const value = await input({ message })
  return value.trim()
}

export async function runPrompts(project: ProjectInfo, options: { backendOnly?: boolean } = {}): Promise<UserAnswers> {
  const { backendOnly = false } = options

  let apiKey = ''
  let authDomain = ''
  let projectId = ''
  let storageBucket = ''
  let messagingSenderId = ''
  let appId = ''
  let vapidKey = ''
  let registerUrl = ''
  let unregisterUrl = ''
  let credentialsPath: string | null = null

  if (backendOnly) {
    // ── Mode: Backend Only ──────────────────────────────────────────────
    logger.info('ℹ  Backend-only setup detected.')
    logger.blank()

    // 1. Credentials first (Service Account)
    logger.info('Firebase Admin SDK requires a Service Account (credentials.json).')
    logger.info('Generate it here:')
    logger.info(`  1. Go to ${FIREBASE_CONSOLE_URL}`)
    logger.info(`  2. Project Settings → Service Accounts → Generate new private key`)
    logger.info(`  3. Download the JSON file and provide its path below.`)
    logger.info(`  Direct link: ${FIREBASE_SERVICE_ACCOUNT_URL}`)
    logger.blank()

    const credInput = await input({
      message: 'Path to your Firebase credentials.json (service account file):',
      default: './credentials.json',
    })
    credentialsPath = credInput.trim() || null

    // 2. URLs
    logger.blank()
    logger.info('Backend endpoints for token management:')
    registerUrl = await optionalInput('Token registration URL (e.g. http://localhost:3000/push/register):')
    unregisterUrl = await optionalInput('Token unregister URL (optional — press Enter to skip):')

  } else {
    // ── Mode: Standard (Frontend + Optional Backend) ─────────────────────
    logger.blank()
    logger.info('Get your config from:')
    logger.info(`  Firebase Console → Project Settings → Your apps → SDK setup and configuration`)
    logger.info(`  Link: ${FIREBASE_CONSOLE_URL}`)
    logger.blank()

    apiKey = await requiredInput('API Key:')
    authDomain = await requiredInput('Auth Domain:')
    projectId = await requiredInput('Project ID:')
    storageBucket = await requiredInput('Storage Bucket:')
    messagingSenderId = await requiredInput('Messaging Sender ID:')
    appId = await requiredInput('App ID:')

    logger.blank()
    logger.info('VAPID Key (Web Push certificate):')
    logger.info(`  Get it from: Firebase Console → Cloud Messaging → Web Push certificates`)
    logger.info(`  Link: ${FIREBASE_MESSAGING_URL}`)
    logger.info(`  Or generate outside Firebase: ${VAPID_GENERATOR_URL}`)
    logger.blank()
    vapidKey = await requiredInput('Enter your VAPID key:')

    if (project.scope === 'both') {
      logger.blank()
      logger.info('Backend configuration for token management:')
      registerUrl = await requiredInput('Token registration URL (e.g. http://localhost:3000/push/register):')
      unregisterUrl = await optionalInput('Token unregister URL (optional — press Enter to skip):')

      logger.blank()
      logger.info('Service Account (for Firebase Admin SDK):')
      logger.info(`  Don't have one? Generate it here:`)
      logger.info(`  1. Go to ${FIREBASE_CONSOLE_URL}`)
      logger.info(`  2. Project Settings → Service Accounts → Generate new private key`)
      logger.info(`  3. Download the JSON file and paste its path below.`)
      logger.info(`  Direct link: ${FIREBASE_SERVICE_ACCOUNT_URL}`)
      logger.blank()
      logger.info('  Press Enter to skip and add it manually to our_pkg.json later.')
      const credInput = await input({
        message: 'Path to your Firebase credentials.json:',
        default: './credentials.json',
      })
      credentialsPath = credInput.trim() || null
    }
  }

  const firebase: FirebaseWebConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    vapidKey,
  }

  const backendUrls: BackendConfig = {
    registerUrl,
    unregisterUrl,
    credentialsPath: null,
  }

  const envPrefix = project.isVite ? 'VITE' : 'REACT_APP'

  // ── Environment Variables — Only for frontend-enabled setups ────────
  if (apiKey && !backendOnly) {

    logger.blank()
    logger.raw('──────────────────────────────────────────────')
    logger.raw('  Add these to your .env file')
    logger.raw('──────────────────────────────────────────────')
    logger.blank()
    logger.raw(`  ${envPrefix}_FIREBASE_API_KEY=${firebase.apiKey}`)
    logger.raw(`  ${envPrefix}_FIREBASE_AUTH_DOMAIN=${firebase.authDomain}`)
    logger.raw(`  ${envPrefix}_FIREBASE_PROJECT_ID=${firebase.projectId}`)
    logger.raw(`  ${envPrefix}_FIREBASE_STORAGE_BUCKET=${firebase.storageBucket}`)
    logger.raw(`  ${envPrefix}_FIREBASE_MESSAGING_SENDER_ID=${firebase.messagingSenderId}`)
    logger.raw(`  ${envPrefix}_FIREBASE_APP_ID=${firebase.appId}`)
    logger.raw(`  ${envPrefix}_FIREBASE_VAPID_KEY=${firebase.vapidKey}`)
    logger.blank()
    logger.warn('  ⚠  Never commit .env to git. Add it to .gitignore now.')
    logger.raw('──────────────────────────────────────────────')
    
    await input({ message: 'Press Enter once you\'ve added these values...' })
    logger.blank()

    const saveEnv = await confirm({
      message: 'Save environment variables to .env file automatically?',
      default: true,
    })

    if (saveEnv) {
      try {
        const envContent = [
          '# Firebase Configuration - Generated by CustomPush',
          `${envPrefix}_FIREBASE_API_KEY=${firebase.apiKey}`,
          `${envPrefix}_FIREBASE_AUTH_DOMAIN=${firebase.authDomain}`,
          `${envPrefix}_FIREBASE_PROJECT_ID=${firebase.projectId}`,
          `${envPrefix}_FIREBASE_STORAGE_BUCKET=${firebase.storageBucket}`,
          `${envPrefix}_FIREBASE_MESSAGING_SENDER_ID=${firebase.messagingSenderId}`,
          `${envPrefix}_FIREBASE_APP_ID=${firebase.appId}`,
          `${envPrefix}_FIREBASE_VAPID_KEY=${firebase.vapidKey}`,
          '',
        ].join('\n')

        const envPath = path.join(project.rootDir, '.env')
        const envExists = await fileExists(envPath)

        if (envExists) {
          await appendToFile(envPath, envContent)
          logger.success('✓  Environment variables appended to .env')
        } else {
          await writeFile(envPath, envContent)
          logger.success('✓  .env file created with Firebase configuration')
        }

        // Ensure .env is in .gitignore
        const gitignorePath = path.join(project.rootDir, GITIGNORE_FILENAME)
        let gitignoreContent = ''
        try {
          gitignoreContent = await readFile(gitignorePath)
        } catch {
          // .gitignore doesn't exist yet — will be created by appendToFile
        }
        const gitignoreLines = gitignoreContent.split('\n').map(l => l.trim())
        if (!gitignoreLines.includes('.env')) {
          await appendToFile(gitignorePath, '.env')
          logger.success('✓  .env added to .gitignore')
        }
      } catch (envErr: any) {
        logger.warn(`⚠  Could not save .env file: ${envErr.message}`)
        logger.info('   Add the environment variables manually.')
      }
    }
  }

  // ── Usage guide ───────────────────────────────────────────────────────
  if (!backendOnly) {
    logger.blank()
    logger.raw('──────────────────────────────────────────────')
    logger.raw('  How to use custom-push in your app')
    logger.raw('──────────────────────────────────────────────')
    logger.blank()
    logger.raw('  // 1. In src/NotificationHandler/config.ts (already generated):')
    logger.raw('  export const pushConfig = {')
    logger.raw(`    apiKey: process.env.${envPrefix}_FIREBASE_API_KEY!,`)
    logger.raw(`    authDomain: process.env.${envPrefix}_FIREBASE_AUTH_DOMAIN!,`)
    logger.raw(`    projectId: process.env.${envPrefix}_FIREBASE_PROJECT_ID!,`)
    logger.raw(`    storageBucket: process.env.${envPrefix}_FIREBASE_STORAGE_BUCKET!,`)
    logger.raw(`    messagingSenderId: process.env.${envPrefix}_FIREBASE_MESSAGING_SENDER_ID!,`)
    logger.raw(`    appId: process.env.${envPrefix}_FIREBASE_APP_ID!,`)
    logger.raw(`    vapidKey: process.env.${envPrefix}_FIREBASE_VAPID_KEY!,`)
    logger.raw("    registerUrl: '/api/push/register',")
    logger.raw('  }')
    logger.blank()
    logger.raw('  // 2. Wrap your app root (src/App.tsx or src/main.tsx):')
    logger.raw("  import { CustomPushProvider } from 'custom-push'")
    logger.raw("  import { pushConfig } from './NotificationHandler/config'")
    logger.blank()
    logger.raw('  function App() {')
    logger.raw('    return (')
    logger.raw('      <CustomPushProvider config={pushConfig}>')
    logger.raw('        <YourApp />')
    logger.raw('      </CustomPushProvider>')
    logger.raw('    )')
    logger.raw('  }')
    logger.blank()
    logger.raw('  // 3. Use in any component:')
    logger.raw("  import { usePushMessage } from 'custom-push'")
    logger.blank()
    logger.raw('  function NotificationButton() {')
    logger.raw('    const { messages, sendMessage, requestPermission } = usePushMessage()')
    logger.raw('    return (')
    logger.raw('      <div>')
    logger.raw("        <button onClick={requestPermission}>Enable Notifications</button>")
    logger.raw("        <button onClick={() => sendMessage('Hello', 'World')}>Send Test</button>")
    logger.raw('        {messages.map(m => <div key={m.id}>{m.title}: {m.body}</div>)}')
    logger.raw('      </div>')
    logger.raw('    )')
    logger.raw('  }')
    logger.blank()
    logger.raw('  // 4. Get the raw token anywhere:')
    logger.raw("  import { getPushToken } from 'custom-push'")
    logger.raw('  const token = await getPushToken(pushConfig)')
    logger.raw("  console.log('FCM Token:', token)")
    logger.raw('──────────────────────────────────────────────')
    logger.blank()
  }

  return {
    firebase,
    backendUrls,
    credentialsPath,
  }
}
