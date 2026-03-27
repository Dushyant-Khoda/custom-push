import * as path from 'path'
import { CLIContext, ScaffoldedFile } from '../types'
import { logger } from '../utils/logger'
import { readFile, writeFile, ensureDir, fileExists } from '../utils/fileUtils'
import { renderTemplate } from '../core/templateEngine'
import { checkConflicts } from '../core/checkConflicts'
import {
  TEMPLATES_DIR,
  SW_TEMPLATE,
  FILES_MODE_PROVIDER,
  FILES_MODE_HOOK,
  FILES_MODE_CONFIG,
  FILES_MODE_TOKEN,
  FILES_MODE_USAGE,
  SERVICE_WORKER_FILENAME,
  SERVICE_WORKER_FALLBACK_FILENAME,
} from '../constants'

/**
 * Helper to read a template file with a clear error message when missing.
 */
async function readTemplate(name: string, templatePath: string): Promise<string> {
  try {
    return await readFile(templatePath)
  } catch (err: any) {
    throw new Error(
      `Template "${name}" not found at: ${templatePath}\n` +
      '  → Try reinstalling custom-push: npm install -g custom-push@latest'
    )
  }
}

/**
 * Scaffolds standalone push notification files into src/push-notification/.
 * Used when --files flag is provided. These files do NOT depend on the custom-push
 * npm package at runtime — they import directly from firebase.
 */
export async function scaffoldFiles(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project, answers } = context
  const scaffolded: ScaffoldedFile[] = []

  // ── Ensure output directory exists ────────────────────────────────────
  const pushDir = path.join(project.srcDir, 'push-notification')
  try {
    await ensureDir(pushDir)
  } catch (dirErr: any) {
    throw new Error(
      `Failed to create directory ${pushDir}: ${dirErr.message}\n` +
      '  → Check that you have write permissions in the project directory.'
    )
  }

  // ── Determine service worker filename ─────────────────────────────────
  const defaultSwPath = path.join(project.publicDir, SERVICE_WORKER_FILENAME)
  let swFilename = SERVICE_WORKER_FILENAME

  if (await fileExists(defaultSwPath)) {
    swFilename = SERVICE_WORKER_FALLBACK_FILENAME
    logger.warn(`⚠  ${SERVICE_WORKER_FILENAME} already exists in /public`)
    logger.info(`   Creating ${SERVICE_WORKER_FALLBACK_FILENAME} instead.`)
    logger.info(`   Update serviceWorkerPath in pushConfig.ts to '/${SERVICE_WORKER_FALLBACK_FILENAME}'`)
  }

  context.serviceWorkerFilename = swFilename

  // ── Determine env variable prefix ────────────────────────────────────
  const envPrefix = project.isVite ? 'VITE' : 'REACT_APP'

  // ── Template variables ────────────────────────────────────────────────
  const vars: Record<string, string> = {
    API_KEY: answers.firebase.apiKey,
    AUTH_DOMAIN: answers.firebase.authDomain,
    PROJECT_ID: answers.firebase.projectId,
    STORAGE_BUCKET: answers.firebase.storageBucket,
    MESSAGING_SENDER_ID: answers.firebase.messagingSenderId,
    APP_ID: answers.firebase.appId,
    VAPID_KEY: answers.firebase.vapidKey,
    ENV_PREFIX: envPrefix,
    SW_FILENAME: swFilename,
  }

  // ── Read all templates (fail fast with good error messages) ───────────
  const [swTemplate, providerTemplate, hookTemplate, configTemplate, tokenTemplate, usageTemplate] =
    await Promise.all([
      readTemplate('service worker', path.join(TEMPLATES_DIR, SW_TEMPLATE)),
      readTemplate('push provider', path.join(TEMPLATES_DIR, FILES_MODE_PROVIDER)),
      readTemplate('use push message hook', path.join(TEMPLATES_DIR, FILES_MODE_HOOK)),
      readTemplate('push config', path.join(TEMPLATES_DIR, FILES_MODE_CONFIG)),
      readTemplate('get push token', path.join(TEMPLATES_DIR, FILES_MODE_TOKEN)),
      readTemplate('USAGE.md', path.join(TEMPLATES_DIR, FILES_MODE_USAGE)),
    ])

  // ── Build file list ───────────────────────────────────────────────────
  const filesToWrite: Array<{ path: string; content: string; description: string }> = [
    {
      path: path.join(project.publicDir, swFilename),
      content: renderTemplate(swTemplate, vars),
      description: 'Firebase service worker — handles background push',
    },
    {
      path: path.join(pushDir, 'pushProvider.tsx'),
      content: providerTemplate,
      description: 'React context provider with Safari support',
    },
    {
      path: path.join(pushDir, 'usePushMessage.ts'),
      content: hookTemplate,
      description: 'Hook to access push notifications',
    },
    {
      path: path.join(pushDir, 'pushConfig.ts'),
      content: renderTemplate(configTemplate, vars),
      description: 'Firebase configuration — edit values here',
    },
    {
      path: path.join(pushDir, 'getPushToken.ts'),
      content: tokenTemplate,
      description: 'FCM token retrieval with SW registration',
    },
    {
      path: path.join(pushDir, 'USAGE.md'),
      content: renderTemplate(usageTemplate, vars),
      description: 'Integration guide — start here',
    },
  ]

  // ── Conflict resolution ───────────────────────────────────────────────
  const resolved = await checkConflicts(filesToWrite, project)

  // ── Write files ───────────────────────────────────────────────────────
  for (const file of resolved) {
    const relativePath = path.relative(project.rootDir, file.path)

    if (file.action === 'skip') {
      scaffolded.push({
        absolutePath: file.path,
        relativePath,
        status: 'skipped',
        description: file.description,
      })
    } else {
      try {
        await writeFile(file.path, file.content)
        scaffolded.push({
          absolutePath: file.path,
          relativePath,
          status: 'created',
          description: file.description,
        })
      } catch (writeErr: any) {
        logger.error(`✖  Failed to write ${relativePath}: ${writeErr.message}`)
        logger.error('   Check write permissions and available disk space.')
        // Continue writing other files rather than aborting entirely
      }
    }
  }

  // ── Post-scaffold info ────────────────────────────────────────────────
  logger.blank()
  logger.info('ℹ  Push notification files generated in src/push-notification/')
  logger.info('   Open src/push-notification/USAGE.md for integration steps.')
  if (swFilename !== SERVICE_WORKER_FILENAME) {
    logger.warn(`⚠  Service worker created as: public/${swFilename}`)
    logger.info(`   The original ${SERVICE_WORKER_FILENAME} was not modified.`)
  }

  return scaffolded
}
