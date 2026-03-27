import * as path from 'path'
import { CLIContext, ScaffoldedFile } from '../types'
import { logger } from '../utils/logger'
import { readFile, writeFile, ensureDir } from '../utils/fileUtils'
import { renderTemplate } from '../core/templateEngine'
import { checkConflicts } from '../core/checkConflicts'
import {
  TEMPLATES_DIR,
  EXPRESS_HELPER_TS,
  EXPRESS_HELPER_JS,
  EXPRESS_ROUTES_TS,
  EXPRESS_ROUTES_JS,
  NESTJS_MODULE,
  NESTJS_SERVICE,
  NESTJS_CONTROLLER,
  NOTIFICATION_CONFIG_TPL,
  FIREBASE_CONSOLE_URL,
  FIREBASE_SERVICE_ACCOUNT_URL,
  FIREBASE_MESSAGING_URL,
} from '../constants'

export async function scaffoldBackend(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project, answers } = context

  await ensureDir(path.join(project.srcDir, 'push'))

  const scaffolded: ScaffoldedFile[] = []

  // ── Generate notification config JSON ─────────────────────────────────
  try {
    const configTemplate = await readFile(path.join(TEMPLATES_DIR, NOTIFICATION_CONFIG_TPL))
    const configContent = renderTemplate(configTemplate, {
      PROJECT_ID: answers.firebase.projectId || '',
      CREDENTIALS_PATH: answers.backendUrls.credentialsPath || './credentials.json',
      VAPID_KEY: answers.firebase.vapidKey || '',
      REGISTER_URL: answers.backendUrls.registerUrl || '/push/register',
      UNREGISTER_URL: answers.backendUrls.unregisterUrl || '/push/unregister',
    })

    const configPath = path.join(project.srcDir, 'push', 'notification-config.json')
    const configResolved = await checkConflicts(
      [{ path: configPath, content: configContent, description: 'Notification settings — icons, payload, credentials' }],
      project
    )

    for (const file of configResolved) {
      const relativePath = path.relative(project.rootDir, file.path)
      if (file.action === 'skip') {
        scaffolded.push({ absolutePath: file.path, relativePath, status: 'skipped', description: file.description })
      } else {
        await writeFile(file.path, file.content)
        scaffolded.push({ absolutePath: file.path, relativePath, status: 'created', description: file.description })
      }
    }
  } catch (configErr: any) {
    logger.warn(`⚠  Could not generate notification-config.json: ${configErr.message}`)
    logger.info('   You can create it manually later. See our_pkg.json for reference values.')
  }

  // ── Scaffold framework-specific files ─────────────────────────────────
  if (project.backendFramework === 'express') {
    scaffolded.push(...(await scaffoldExpress(context)))
  } else if (project.backendFramework === 'nestjs') {
    scaffolded.push(...(await scaffoldNestJS(context)))
  }

  // ── Post-scaffold guidance ────────────────────────────────────────────
  logger.blank()
  logger.divider()
  logger.info('  Backend Setup Reference')
  logger.divider()
  logger.blank()
  logger.info('  Firebase Service Account:')
  logger.info(`    ${FIREBASE_SERVICE_ACCOUNT_URL}`)
  logger.blank()
  logger.info('  VAPID Key (Web Push certificates):')
  logger.info(`    ${FIREBASE_MESSAGING_URL}`)
  logger.blank()
  logger.info('  Firebase Console:')
  logger.info(`    ${FIREBASE_CONSOLE_URL}`)
  logger.divider()

  return scaffolded
}

async function scaffoldExpress(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project } = context
  const scaffolded: ScaffoldedFile[] = []
  const ext = project.language === 'typescript' ? 'ts' : 'js'

  // Read templates
  const helperTemplate = ext === 'ts' ? EXPRESS_HELPER_TS : EXPRESS_HELPER_JS
  const routesTemplate = ext === 'ts' ? EXPRESS_ROUTES_TS : EXPRESS_ROUTES_JS

  const helperContent = await readFile(path.join(TEMPLATES_DIR, helperTemplate))
  const routesContent = await readFile(path.join(TEMPLATES_DIR, routesTemplate))

  const helperPath = path.join(project.srcDir, 'push', `pushHelper.${ext}`)
  const routesPath = path.join(project.srcDir, 'push', `pushRoutes.${ext}`)

  // Run conflict checks
  const filesToWrite = [
    {
      path: helperPath,
      content: helperContent,
      description: 'Express push helper — send notifications via firebase-admin',
    },
    {
      path: routesPath,
      content: routesContent,
      description: 'Express push routes — /push/register and /push/unregister',
    },
  ]

  const resolved = await checkConflicts(filesToWrite, project)

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
      await writeFile(file.path, file.content)
      scaffolded.push({
        absolutePath: file.path,
        relativePath,
        status: 'created',
        description: file.description,
      })
    }
  }

  // Log mount instructions
  logger.blank()
  logger.info('ℹ  Mount push routes in your Express app:')
  logger.raw(`     import pushRoutes from './push/pushRoutes'`)
  logger.raw(`     app.use('/push', pushRoutes)`)

  return scaffolded
}

async function scaffoldNestJS(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project } = context
  const scaffolded: ScaffoldedFile[] = []

  // NestJS is always TypeScript
  const moduleContent = await readFile(path.join(TEMPLATES_DIR, NESTJS_MODULE))
  const serviceContent = await readFile(path.join(TEMPLATES_DIR, NESTJS_SERVICE))
  const controllerContent = await readFile(path.join(TEMPLATES_DIR, NESTJS_CONTROLLER))

  const modulePath = path.join(project.srcDir, 'push', 'push.module.ts')
  const servicePath = path.join(project.srcDir, 'push', 'push.service.ts')
  const controllerPath = path.join(project.srcDir, 'push', 'push.controller.ts')

  // Run conflict checks
  const filesToWrite = [
    {
      path: modulePath,
      content: moduleContent,
      description: 'NestJS PushModule — import into your AppModule',
    },
    {
      path: servicePath,
      content: serviceContent,
      description: 'NestJS PushService — firebase-admin push notifications',
    },
    {
      path: controllerPath,
      content: controllerContent,
      description: 'NestJS PushController — /push/register and /push/unregister',
    },
  ]

  const resolved = await checkConflicts(filesToWrite, project)

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
      await writeFile(file.path, file.content)
      scaffolded.push({
        absolutePath: file.path,
        relativePath,
        status: 'created',
        description: file.description,
      })
    }
  }

  // Log import instructions
  logger.blank()
  logger.info('ℹ  Import PushModule in your AppModule:')
  logger.raw(`     import { PushModule } from './push/push.module'`)
  logger.raw(`     @Module({ imports: [PushModule] })`)
  logger.blank()
  logger.info('ℹ  NestJS follows the module/DI pattern:')
  logger.raw('     PushController → PushService → firebase-admin')
  logger.raw('     Inject PushService into any other service to send notifications.')

  return scaffolded
}
