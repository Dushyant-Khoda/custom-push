import * as path from 'path'
import { CLIContext } from '../types'
import { logger } from '../utils/logger'
import { readJson, writeJson } from '../utils/fileUtils'
import { checkConflicts } from '../core/checkConflicts'
import { CONFIG_FILENAME, FIREBASE_VERSION_RANGE, REACT_VERSION_RANGE, PACKAGE_ROOT } from '../constants'

export async function generateConfig(context: CLIContext): Promise<void> {
  const { project, answers } = context

  // Read CLI package.json for customPushVersion
  let customPushVersion = '1.0.0'
  try {
    const cliPkg = await readJson<Record<string, any>>(path.join(PACKAGE_ROOT, 'package.json'))
    customPushVersion = cliPkg.version || '1.0.0'
  } catch {
    // fallback to 1.0.0
  }

  const now = new Date().toISOString()

  // Build relative credentials path
  let relativeCredentialsPath: string | null = null
  if (answers.credentialsPath) {
    relativeCredentialsPath = './' + path.relative(project.rootDir, answers.credentialsPath)
  }

  const config = {
    version: '1.0.0',
    generatedAt: now,
    customPushVersion,
    stack: {
      language: project.language,
      scope: project.scope,
      backendFramework: project.backendFramework,
    },
    firebase: {
      apiKey: answers.firebase.apiKey,
      authDomain: answers.firebase.authDomain,
      projectId: answers.firebase.projectId,
      storageBucket: answers.firebase.storageBucket,
      messagingSenderId: answers.firebase.messagingSenderId,
      appId: answers.firebase.appId,
      vapidKey: answers.firebase.vapidKey,
    },
    backend: {
      registerUrl: answers.backendUrls.registerUrl,
      unregisterUrl: answers.backendUrls.unregisterUrl,
      credentialsPath: relativeCredentialsPath,
    },
    serviceWorker: {
      path: '/firebase-messaging-sw.js',
      generatedAt: now,
    },
    compatibility: {
      firebaseRequired: FIREBASE_VERSION_RANGE,
      reactRequired: REACT_VERSION_RANGE,
      firebaseInstalled: project.firebaseVersion,
      reactInstalled: project.reactVersion,
    },
  }

  const filePath = path.join(project.rootDir, CONFIG_FILENAME)
  const content = JSON.stringify(config, null, 2) + '\n'

  // Run conflict check
  const resolved = await checkConflicts(
    [{ path: filePath, content, description: 'custom-push configuration' }],
    project
  )

  for (const file of resolved) {
    if (file.action === 'skip') {
      logger.info(`Kept existing ${CONFIG_FILENAME}`)
      context.scaffolded.push({
        absolutePath: filePath,
        relativePath: CONFIG_FILENAME,
        status: 'skipped',
        description: 'Kept existing file',
      })
    } else {
      await writeJson(filePath, config)
      context.scaffolded.push({
        absolutePath: filePath,
        relativePath: CONFIG_FILENAME,
        status: 'created',
        description: 'custom-push configuration',
      })
    }
  }
}
