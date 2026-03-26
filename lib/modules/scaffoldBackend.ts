import * as path from 'path'
import { CLIContext, ScaffoldedFile } from '../types'
import { logger } from '../utils/logger'
import { readFile, writeFile, ensureDir } from '../utils/fileUtils'
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
} from '../constants'

export async function scaffoldBackend(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project } = context

  await ensureDir(path.join(project.srcDir, 'push'))

  if (project.backendFramework === 'express') {
    return scaffoldExpress(context)
  } else if (project.backendFramework === 'nestjs') {
    return scaffoldNestJS(context)
  }

  return []
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
  logger.info('Mount push routes in your Express app:')
  logger.info("   import pushRoutes from './push/pushRoutes'")
  logger.info("   app.use('/push', pushRoutes)")

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
  logger.info('Import PushModule in your AppModule:')
  logger.info("   import { PushModule } from './push/push.module'")
  logger.info('   @Module({ imports: [PushModule] })')

  return scaffolded
}
