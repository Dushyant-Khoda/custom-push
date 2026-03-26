import { input, confirm } from '@inquirer/prompts'
import { logger } from '../utils/logger'
import { fileExists, writeFile, readJson } from '../utils/fileUtils'
import { renderTemplate } from '../core/templateEngine'
import { readFileSync } from 'fs'
import * as path from 'path'

interface ServiceWorkerConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

interface OurPackageJson {
  firebase: ServiceWorkerConfig & { vapidKey: string }
}

export async function generateServiceWorker(): Promise<void> {
  logger.blank()
  logger.divider()
  logger.info('Service Worker Generator')
  logger.divider()
  logger.blank()

  let config: ServiceWorkerConfig

  // Check if our_pkg.json exists and has Firebase config
  if (await fileExists('our_pkg.json')) {
    try {
      const packageConfig: OurPackageJson = await readJson('our_pkg.json')
      if (packageConfig.firebase) {
        logger.success('Found Firebase configuration in our_pkg.json')
        logger.info('Using existing configuration:')
        logger.info(`  Project ID: ${packageConfig.firebase.projectId}`)
        logger.info(`  Auth Domain: ${packageConfig.firebase.authDomain}`)
        logger.blank()
        
        config = {
          apiKey: packageConfig.firebase.apiKey,
          authDomain: packageConfig.firebase.authDomain,
          projectId: packageConfig.firebase.projectId,
          storageBucket: packageConfig.firebase.storageBucket,
          messagingSenderId: packageConfig.firebase.messagingSenderId,
          appId: packageConfig.firebase.appId
        }
      } else {
        throw new Error('No Firebase configuration found in our_pkg.json')
      }
    } catch (error) {
      logger.warn('Could not read Firebase config from our_pkg.json')
      logger.info('Falling back to manual input...')
      config = await getFirebaseConfigManually()
    }
  } else {
    logger.info('No our_pkg.json found. Please enter Firebase configuration:')
    config = await getFirebaseConfigManually()
  }

  // Ask for output location
  logger.blank()
  const defaultPath = 'public/firebase-messaging-sw.js'
  const outputPath = await input({
    message: `Output path (default: ${defaultPath}):`,
    default: defaultPath
  })

  // Check if file exists
  if (await fileExists(outputPath)) {
    logger.warn(`File already exists: ${outputPath}`)
    const overwrite = await confirm({
      message: 'Overwrite existing file?',
      default: false
    })
    
    if (!overwrite) {
      logger.info('Cancelled.')
      return
    }
  }

  // Generate service worker
  logger.blank()
  logger.info('Generating service worker...')

  try {
    const template = readFileSync(path.join(__dirname, '../templates/sw.template.js'), 'utf-8')
    const content = renderTemplate(template, {
      API_KEY: config.apiKey,
      AUTH_DOMAIN: config.authDomain,
      PROJECT_ID: config.projectId,
      STORAGE_BUCKET: config.storageBucket,
      MESSAGING_SENDER_ID: config.messagingSenderId,
      APP_ID: config.appId
    })

    await writeFile(outputPath, content)
    
    logger.success(`Service worker generated: ${outputPath}`)
    
    logger.blank()
    logger.info('Next steps:')
    logger.info('1. Install custom-push package: npm install custom-push')
    logger.info('2. Import in your app: import { usePush } from "custom-push"')
    logger.info('3. Initialize: usePush({ firebase: YOUR_CONFIG })')
    
  } catch (error) {
    logger.error(`Failed to generate service worker: ${(error as Error).message}`)
  }
}

async function getFirebaseConfigManually(): Promise<ServiceWorkerConfig> {
  logger.info('Enter your Firebase web config:')
  logger.info('Get this from: Firebase Console → Project Settings → Your apps → SDK setup and configuration')
  logger.blank()

  return {
    apiKey: await requiredInput('API Key:'),
    authDomain: await requiredInput('Auth Domain:'),
    projectId: await requiredInput('Project ID:'),
    storageBucket: await requiredInput('Storage Bucket:'),
    messagingSenderId: await requiredInput('Messaging Sender ID:'),
    appId: await requiredInput('App ID:')
  }
}

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
