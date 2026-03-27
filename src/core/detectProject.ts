import * as path from 'path'
import { ProjectInfo, Language, BackendFramework, Scope } from '../types'
import { logger } from '../utils/logger'
import { fileExists, readJson, ensureDir } from '../utils/fileUtils'

export async function detectProject(cwd: string, options: { backendOnly?: boolean } = {}): Promise<ProjectInfo> {
  const { backendOnly = false } = options
  const rootDir = cwd

  // ── package.json ──────────────────────────────────────────────────────
  const pkgPath = path.join(rootDir, 'package.json')
  if (!(await fileExists(pkgPath))) {
    logger.error('✖  No package.json found. Run custom-push init from your project root.')
    process.exit(1)
  }
  const packageJson = await readJson<Record<string, any>>(pkgPath)
  const deps = packageJson.dependencies || {}
  const devDeps = packageJson.devDependencies || {}

  // ── language ──────────────────────────────────────────────────────────
  const hasTsConfig = await fileExists(path.join(rootDir, 'tsconfig.json'))
  const language: Language = hasTsConfig ? 'typescript' : 'javascript'

  // ── react version ─────────────────────────────────────────────────────
  const rawReact: string | undefined = deps['react'] || devDeps['react']
  const reactVersion = rawReact ? rawReact.replace(/[\^~]/g, '') : null

  // ── firebase version ──────────────────────────────────────────────────
  const rawFirebase: string | undefined = deps['firebase']
  const firebaseVersion = rawFirebase ? rawFirebase.replace(/[\^~]/g, '') : null
  const hasFirebase = firebaseVersion !== null

  // ── framework detection ───────────────────────────────────────────────
  const isNextJs = !!(deps['next'] || devDeps['next'])
  const isVite = !!(
    devDeps['vite'] ||
    deps['vite'] ||
    await fileExists(path.join(rootDir, 'vite.config.ts')) ||
    await fileExists(path.join(rootDir, 'vite.config.js'))
  )

  // ── backend framework ─────────────────────────────────────────────────
  let backendFramework: BackendFramework = null
  if (deps['@nestjs/core'] || devDeps['@nestjs/core']) {
    backendFramework = 'nestjs'
  } else if (deps['express']) {
    backendFramework = 'express'
  }

  // ── scope ─────────────────────────────────────────────────────────────
  const scope: Scope = backendFramework !== null ? 'both' : 'frontend'

  // ── srcDir ────────────────────────────────────────────────────────────
  const srcCandidate = path.join(rootDir, 'src')
  const srcDir = (await fileExists(srcCandidate)) ? srcCandidate : rootDir

  // ── publicDir ─────────────────────────────────────────────────────────
  const publicDir = path.join(rootDir, 'public')
  
  // Only create public directory and warn if not in backend-only mode
  if (!backendOnly) {
    if (!(await fileExists(publicDir))) {
      await ensureDir(publicDir)
      logger.info('ℹ  No /public directory found. Created it.')
    }
  }

  return {
    rootDir,
    srcDir,
    publicDir,
    language,
    reactVersion,
    firebaseVersion,
    hasFirebase,
    backendFramework,
    scope,
    hasTsConfig,
    isNextJs,
    isVite,
    packageJson,
  }
}
