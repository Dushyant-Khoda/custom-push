import * as path from 'path'
import { select } from '@inquirer/prompts'
import { CLIContext, ScaffoldedFile } from '../types'
import { logger } from '../utils/logger'
import { readFile, writeFile, ensureDir, fileExists } from '../utils/fileUtils'
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
  const { project, answers, backendOnly } = context

  // ── Determine directory and file names ────────────────────────────────
  const dirName = backendOnly ? 'helper' : 'push'
  const targetDir = path.join(project.srcDir, dirName)
  await ensureDir(targetDir)

  const scaffolded: ScaffoldedFile[] = []

  // ── Generate notification config JSON — SKIP for backend-only ──────────
  if (!backendOnly) {
    try {
      const configTemplate = await readFile(path.join(TEMPLATES_DIR, NOTIFICATION_CONFIG_TPL))
      const configContent = renderTemplate(configTemplate, {
        PROJECT_ID: answers.firebase.projectId || '',
        CREDENTIALS_PATH: answers.backendUrls.credentialsPath || './credentials.json',
        VAPID_KEY: answers.firebase.vapidKey || '',
        REGISTER_URL: answers.backendUrls.registerUrl || '/push/register',
        UNREGISTER_URL: answers.backendUrls.unregisterUrl || '/push/unregister',
      })

      const configPath = path.join(targetDir, 'notification-config.json')
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
  if (!backendOnly) {
    logger.info('  VAPID Key (Web Push certificates):')
    logger.info(`    ${FIREBASE_MESSAGING_URL}`)
    logger.blank()
  }
  logger.info('  Firebase Console:')
  logger.info(`    ${FIREBASE_CONSOLE_URL}`)
  logger.divider()

  return scaffolded
}

async function scaffoldExpress(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project, backendOnly } = context
  const scaffolded: ScaffoldedFile[] = []
  const ext = project.language === 'typescript' ? 'ts' : 'js'

  // Read templates
  const helperTemplate = ext === 'ts' ? EXPRESS_HELPER_TS : EXPRESS_HELPER_JS
  const routesTemplate = ext === 'ts' ? EXPRESS_ROUTES_TS : EXPRESS_ROUTES_JS

  const helperContent = await readFile(path.join(TEMPLATES_DIR, helperTemplate))
  
  const dirName = backendOnly ? 'helper' : 'push'
  const helperBaseName = backendOnly ? 'FCMHelper' : 'pushHelper'
  
  let helperPath = path.join(project.srcDir, dirName, `${helperBaseName}.${ext}`)

  // ── Custom conflict resolution for FCMHelper (Date-based naming) ──────
  if (backendOnly && (await fileExists(helperPath))) {
    const now = new Date()
    const dateSuffix = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const fallbackPath = path.join(project.srcDir, dirName, `${helperBaseName}-${dateSuffix}.${ext}`)
    
    logger.blank()
    logger.warn(`  Conflict: ${path.relative(project.rootDir, helperPath)} already exists.`)
    const strategy = await select({
      message: 'FCMHelper already exists. What should we do?',
      choices: [
        { name: `Rename new file to ${helperBaseName}-${dateSuffix}.${ext}`, value: 'rename' },
        { name: 'Overwrite the existing file', value: 'overwrite' },
        { name: 'Skip this file', value: 'skip' },
      ],
    })

    if (strategy === 'rename') {
      helperPath = fallbackPath
    } else if (strategy === 'skip') {
      scaffolded.push({
        absolutePath: helperPath,
        relativePath: path.relative(project.rootDir, helperPath),
        status: 'skipped',
        description: 'FCMHelper — firebase-admin push notifications',
      })
      return scaffolded
    }
  }

  const filesToWrite = [
    {
      path: helperPath,
      content: helperContent,
      description: `${helperBaseName} — firebase-admin push notifications`,
    },
  ]

  // Only add routes if NOT backendOnly
  if (!backendOnly) {
    const routesContent = await readFile(path.join(TEMPLATES_DIR, routesTemplate))
    const routesPath = path.join(project.srcDir, dirName, `pushRoutes.${ext}`)
    filesToWrite.push({
      path: routesPath,
      content: routesContent,
      description: 'Express push routes — /push/register and /push/unregister',
    })
  }

  // For backend-only, we might have already handled conflicts via strategy
  // For standard mode, we use checkConflicts
  const resolved = backendOnly 
    ? filesToWrite.map(f => ({ ...f, action: 'write' as const }))
    : await checkConflicts(filesToWrite, project)

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

  // Log mount instructions — SKIP for backendOnly
  if (!backendOnly) {
    logger.blank()
    logger.info('ℹ  Mount push routes in your Express app:')
    logger.raw(`     import pushRoutes from './push/pushRoutes'`)
    logger.raw(`     app.use('/push', pushRoutes)`)
  }

  return scaffolded
}

async function scaffoldNestJS(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project, backendOnly } = context
  const scaffolded: ScaffoldedFile[] = []
  const dirName = backendOnly ? 'helper' : 'push'

  // NestJS is always TypeScript
  const serviceContent = await readFile(path.join(TEMPLATES_DIR, NESTJS_SERVICE))
  const serviceBaseName = backendOnly ? 'FCMHelper' : 'push.service'
  let servicePath = path.join(project.srcDir, dirName, `${serviceBaseName}.ts`)

  // ── Custom conflict resolution for NestJS FCMHelper ——————————————————
  if (backendOnly && (await fileExists(servicePath))) {
    const now = new Date()
    const dateSuffix = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const fallbackPath = path.join(project.srcDir, dirName, `${serviceBaseName}-${dateSuffix}.ts`)
    
    logger.blank()
    logger.warn(`  Conflict: ${path.relative(project.rootDir, servicePath)} already exists.`)
    const strategy = await select({
      message: 'FCMHelper already exists. What should we do?',
      choices: [
        { name: `Rename new file to FCMHelper-${dateSuffix}.ts`, value: 'rename' },
        { name: 'Overwrite existing file', value: 'overwrite' },
        { name: 'Skip this file', value: 'skip' },
      ],
    })

    if (strategy === 'rename') {
      servicePath = fallbackPath
    } else if (strategy === 'skip') {
       scaffolded.push({
        absolutePath: servicePath,
        relativePath: path.relative(project.rootDir, servicePath),
        status: 'skipped',
        description: 'FCMHelper — NestJS firebase-admin pusher',
      })
      return scaffolded
    }
  }

  const filesToWrite = [
    {
      path: servicePath,
      content: serviceContent,
      description: `${backendOnly ? 'FCMHelper' : 'PushService'} — firebase-admin push notifications`,
    },
  ]

  // Only add boilerplate if NOT backend-only
  if (!backendOnly) {
    const moduleContent = await readFile(path.join(TEMPLATES_DIR, NESTJS_MODULE))
    const controllerContent = await readFile(path.join(TEMPLATES_DIR, NESTJS_CONTROLLER))

    filesToWrite.push(
      {
        path: path.join(project.srcDir, dirName, 'push.module.ts'),
        content: moduleContent,
        description: 'NestJS PushModule — import into your AppModule',
      },
      {
        path: path.join(project.srcDir, dirName, 'push.controller.ts'),
        content: controllerContent,
        description: 'NestJS PushController — /push/register and /push/unregister',
      }
    )
  }

  const resolved = backendOnly
    ? filesToWrite.map(f => ({ ...f, action: 'write' as const }))
    : await checkConflicts(filesToWrite, project)

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

  // Log instructions
  if (!backendOnly) {
    logger.blank()
    logger.info('ℹ  Import PushModule in your AppModule:')
    logger.raw(`     import { PushModule } from './push/push.module'`)
    logger.raw(`     @Module({ imports: [PushModule] })`)
    logger.blank()
    logger.info('ℹ  NestJS follows the module/DI pattern:')
    logger.raw('     PushController → PushService → firebase-admin')
    logger.raw('     Inject PushService into any other service to send notifications.')
  }

  return scaffolded
}
