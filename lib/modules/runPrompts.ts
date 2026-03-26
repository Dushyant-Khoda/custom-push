import { input } from '@inquirer/prompts'
import { ProjectInfo, UserAnswers, FirebaseWebConfig, BackendConfig } from '../types'
import { logger } from '../utils/logger'
import { FIREBASE_CONSOLE_URL, FIREBASE_MESSAGING_URL } from '../constants'

async function requiredInput(message: string): Promise<string> {
  let value = ''
  while (!value.trim()) {
    value = await input({ message })
    if (!value.trim()) {
      logger.warn('This field is required. Please enter a value.')
    }
  }
  return value.trim()
}

export async function runPrompts(project: ProjectInfo, options: { backendOnly?: boolean } = {}): Promise<UserAnswers> {
  const { backendOnly = false } = options
  // ── Question 1 — Firebase web config ──────────────────────────────────
  logger.blank()
  if (!backendOnly) {
    logger.info('Get your config from:')
    logger.info('Firebase Console → Project Settings → Your apps → SDK setup and configuration')
  } else {
    logger.info('Backend setup - Firebase config for service configuration')
  }
  logger.blank()

  const apiKey = await requiredInput('API Key:')
  const authDomain = await requiredInput('Auth Domain:')
  const projectId = await requiredInput('Project ID:')
  const storageBucket = await requiredInput('Storage Bucket:')
  const messagingSenderId = await requiredInput('Messaging Sender ID:')
  const appId = await requiredInput('App ID:')

  // ── Question 2 — VAPID key ───────────────────────────────────────────
  logger.blank()
  logger.info('Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates')
  logger.info(`Link: ${FIREBASE_MESSAGING_URL}`)
  logger.blank()

  const vapidKey = await requiredInput('Enter your VAPID key (Web Push certificate):')

  const firebase: FirebaseWebConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    vapidKey,
  }

  // ── Question 3 — Backend URLs ─────────────────────────────────────────
  let registerUrl = ''
  let unregisterUrl = ''
  let credentialsPath: string | null = null

  if (project.scope === 'both') {
    logger.blank()
    logger.info('Backend configuration for token management:')
    registerUrl = await requiredInput('Token registration URL (e.g. http://localhost:3000/push/register):')

    unregisterUrl = await input({
      message: 'Token unregister URL (optional — press Enter to skip):',
    })
    unregisterUrl = unregisterUrl.trim()

    // ── Question 4 — credentials.json path ──────────────────────────────
    logger.blank()
    logger.info("Don't have one? Generate it here:")
    logger.info(`1. Go to ${FIREBASE_CONSOLE_URL}`)
    logger.info('2. Project Settings → Service Accounts → Generate new private key')
    logger.info('3. Download the JSON file and paste its path below.')
    logger.blank()

    const credInput = await input({
      message: 'Path to your Firebase credentials.json (service account file):',
    })
    credentialsPath = credInput.trim() || null
  }

  const backendUrls: BackendConfig = {
    registerUrl,
    unregisterUrl,
    credentialsPath: null,  // will be set by readCredentials step
  }

  return {
    firebase,
    backendUrls,
    credentialsPath,
  }
}
