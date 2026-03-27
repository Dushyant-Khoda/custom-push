import { CLIContext } from '../types'
import { logger } from './logger'
import { SERVICE_WORKER_FILENAME } from '../constants'

export async function printSummary(context: CLIContext): Promise<void> {
  const { scaffolded, warnings, project, mode, serviceWorkerFilename } = context

  const created = scaffolded.filter((f) => f.status === 'created' || f.status === 'overwritten')
  const skipped = scaffolded.filter((f) => f.status === 'skipped')

  logger.blank()
  logger.divider()
  logger.info('  custom-push setup complete')
  logger.divider()
  logger.blank()

  // ── Mode ──────────────────────────────────────────────────────────────
  if (mode === 'files') {
    logger.info(`  Mode: Standalone files (--files)`)
  } else {
    logger.info(`  Mode: Library (import from 'custom-push')`)
  }
  logger.blank()

  // ── Created ───────────────────────────────────────────────────────────
  if (created.length > 0) {
    logger.info('  Created')
    for (const file of created) {
      const padded = file.relativePath.padEnd(42)
      logger.success(`  ✓  ${padded} ${file.description}`)
    }
    logger.blank()
  }

  // ── Skipped ───────────────────────────────────────────────────────────
  if (skipped.length > 0) {
    logger.info('  Skipped')
    for (const file of skipped) {
      const padded = file.relativePath.padEnd(42)
      logger.raw(`  –  ${padded} ${file.description}`)
    }
    logger.blank()
  }

  // ── Warnings ──────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    logger.info('  Warnings')
    for (const w of warnings) {
      logger.warn(`  ⚠  ${w.package}@${w.found} — run: ${w.fix}`)
    }
    logger.blank()
  }

  // ── Service Worker Info ───────────────────────────────────────────────
  if (serviceWorkerFilename !== SERVICE_WORKER_FILENAME) {
    logger.warn(`  ⚠  Service worker created as: ${serviceWorkerFilename}`)
    logger.info(`     The original ${SERVICE_WORKER_FILENAME} was not modified.`)
    logger.info(`     Make sure your config uses serviceWorkerPath: '/${serviceWorkerFilename}'`)
    logger.blank()
  }

  // ── Next steps ────────────────────────────────────────────────────────
  logger.info('  Next steps')
  logger.blank()

  if (context.backendOnly) {
    logger.raw(`  [1] Install the package (if not already):`)
    logger.raw(`      npm install custom-push`)
    logger.blank()

    logger.raw(`  [2] Configure your notification settings in:`)
    logger.raw(`      push/notification-config.json`)
    logger.blank()

    logger.raw(`  [3] Mount push routes in your server:`)
    logger.raw(`      // Express: app.use('/push', pushRoutes)`)
    logger.raw(`      // NestJS: Import PushModule into AppModule`)
    logger.blank()
    
    logger.raw(`  [4] Send your first notification:`)
    logger.raw(`      import { sendPushNotification } from './push/pushHelper'`)
    logger.raw(`      await sendPushNotification(token, { title: 'Hello', body: 'World' })`)
    logger.blank()

  } else if (mode === 'files') {
    logger.raw(`  [1] Read the USAGE.md in src/push-notification/`)
    logger.raw(`      It has complete integration instructions.`)
    logger.blank()

    logger.raw(`  [2] Wrap your app with <CustomPushProvider>:`)
    logger.raw(`      import { CustomPushProvider } from './push-notification/pushProvider'`)
    logger.blank()

    logger.raw(`  [3] Request permission from a button click (required for Safari):`)
    logger.raw(`      const { requestPermission } = usePushMessage()`)
    logger.raw(`      <button onClick={() => requestPermission()}>Enable</button>`)
    logger.blank()
  } else {
    logger.raw(`  [1] Install the package (if not already):`)
    logger.raw(`      npm install custom-push`)
    logger.blank()

    logger.raw(`  [2] Wrap your app root:`)
    logger.raw(`      import { CustomPushProvider } from 'custom-push'`)
    logger.raw(`      import { pushConfig } from './push/notificationHandler/pushConfig'`)
    logger.raw(`      import { PushNotificationManager } from './push/notificationHandler/PushNotificationManager'`)
    logger.blank()
    logger.raw(`      <CustomPushProvider config={pushConfig}>`)
    logger.raw(`        <PushNotificationManager />`)
    logger.raw(`        <App />`)
    logger.raw(`      </CustomPushProvider>`)
    logger.blank()

    logger.raw(`  [3] Add a permission toggle button:`)
    logger.raw(`      Check the USAGE.md in src/push/notificationHandler/`)
    logger.blank()
  }

  logger.raw(`  [${context.backendOnly ? 5 : 4}] Add /public/icon.png (displayed on push notifications)`)
  logger.blank()

  if (project.scope === 'both' && !context.backendOnly) {
    logger.raw(`  [5] Mount push routes — see instructions above`)
    logger.blank()
  }

  // ── Safari — Only for frontend-related setups ────────────────────────
  if (!context.backendOnly) {
    logger.info('  Safari Push Notes')
    logger.raw(`     • Safari 16+ supports Web Push via VAPID (not FCM directly)`)
    logger.raw(`     • Permission MUST be requested from a user gesture (button click)`)
    logger.raw(`     • Notification click uses clients.openWindow() as navigate() fallback`)
    logger.blank()
  }

  logger.raw(`  All config lives in our_pkg.json — edit anytime.`)
  logger.divider()
  logger.blank()
}
