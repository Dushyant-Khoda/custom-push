import * as path from 'path'
import { CLIContext, ScaffoldedFile } from '../types'
import { readFile, writeFile, ensureDir } from '../utils/fileUtils'
import { renderTemplate } from '../core/templateEngine'
import { checkConflicts } from '../core/checkConflicts'
import {
  TEMPLATES_DIR,
  SW_TEMPLATE,
  FRONTEND_HELPER_TS,
  FRONTEND_HELPER_JS,
  SERVICE_WORKER_FILENAME,
} from '../constants'

export async function scaffoldFrontend(context: CLIContext): Promise<ScaffoldedFile[]> {
  const { project, answers } = context
  const scaffolded: ScaffoldedFile[] = []

  // ── 1. Service Worker ─────────────────────────────────────────────────
  const swTemplatePath = path.join(TEMPLATES_DIR, SW_TEMPLATE)
  const swTemplate = await readFile(swTemplatePath)

  const swContent = renderTemplate(swTemplate, {
    API_KEY: answers.firebase.apiKey,
    AUTH_DOMAIN: answers.firebase.authDomain,
    PROJECT_ID: answers.firebase.projectId,
    STORAGE_BUCKET: answers.firebase.storageBucket,
    MESSAGING_SENDER_ID: answers.firebase.messagingSenderId,
    APP_ID: answers.firebase.appId,
  })

  const swPath = path.join(project.publicDir, SERVICE_WORKER_FILENAME)

  // ── 2. Frontend Helper ────────────────────────────────────────────────
  const helperTemplate = project.language === 'typescript' ? FRONTEND_HELPER_TS : FRONTEND_HELPER_JS
  const ext = project.language === 'typescript' ? 'ts' : 'js'
  const helperTemplatePath = path.join(TEMPLATES_DIR, helperTemplate)
  const helperContent = await readFile(helperTemplatePath)
  const helperPath = path.join(project.srcDir, 'push', `pushHelper.${ext}`)

  // ── Ensure push directory exists ──────────────────────────────────────
  await ensureDir(path.join(project.srcDir, 'push'))

  // ── Run conflict checks ───────────────────────────────────────────────
  const filesToWrite = [
    {
      path: swPath,
      content: swContent,
      description: 'Firebase service worker — handles background push',
    },
    {
      path: helperPath,
      content: helperContent,
      description: 'Frontend helper — import usePush() anywhere in your app',
    },
  ]

  const resolved = await checkConflicts(filesToWrite, project)

  // ── Write resolved files ──────────────────────────────────────────────
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

  return scaffolded
}
