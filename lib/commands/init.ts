import { confirm } from '@inquirer/prompts'
import { CLIContext } from '../types'
import { logger } from '../utils/logger'
import { createSpinner } from '../utils/spinner'
import { printSummary } from '../utils/printSummary'
import { detectProject } from '../core/detectProject'
import { validateVersions } from '../core/validateVersions'
import { readCredentials } from '../core/readCredentials'
import { runPrompts } from '../modules/runPrompts'
import { generateConfig } from '../modules/generateConfig'
import { scaffoldFrontend } from '../modules/scaffoldFrontend'
import { scaffoldBackend } from '../modules/scaffoldBackend'

export async function init(options: { generateFrontend?: boolean; backendOnly?: boolean } = {}): Promise<void> {
  const cwd = process.cwd()
  const { generateFrontend = false, backendOnly = false } = options

  logger.blank()
  logger.divider()
  logger.info('custom-push init')
  if (backendOnly) logger.info('(backend-only mode)')
  if (generateFrontend) logger.info('(with frontend generation)')
  logger.divider()
  logger.blank()

  // ── Step 1: Detect project ────────────────────────────────────────────
  const detectSpin = createSpinner('Detecting project...')
  detectSpin.start()
  const project = await detectProject(cwd)
  detectSpin.stop()
  
  logger.success(`Language: ${project.language}`)
  logger.success(`React: ${project.reactVersion || 'not found'}`)
  logger.success(`Firebase: ${project.firebaseVersion || 'not installed'}`)
  if (project.backendFramework) {
    logger.success(`Backend: ${project.backendFramework}`)
  }
  logger.success(`Scope: ${project.scope}`)

  // ── Step 2: Validate versions ─────────────────────────────────────────
  logger.blank()
  const valSpin = createSpinner('Checking version compatibility...')
  valSpin.start()
  const warnings = validateVersions(project)
  valSpin.stop(warnings.length === 0)

  if (warnings.length > 0) {
    for (const w of warnings) {
      logger.warn(`${w.package} version mismatch`)
      logger.info(`   Found:    ${w.found}`)
      logger.info(`   Required: ${w.required}`)
      logger.info(`   Fix:      ${w.fix}`)
    }
    logger.blank()

    const shouldContinue = await confirm({
      message: 'Versions above may cause issues. Continue anyway?',
      default: false,
    })

    if (!shouldContinue) {
      logger.blank()
      logger.info('Fix the above and re-run: npx custom-push init')
      process.exit(0)
    }

    logger.warn('Proceeding with incompatible versions. Things may break.')
  }

  // ── Step 3: Run prompts ───────────────────────────────────────────────
  logger.blank()
  logger.step(3, 'Configuring push notifications...')
  const answers = await runPrompts(project, { backendOnly })

  // ── Build context ─────────────────────────────────────────────────────
  const context: CLIContext = { project, answers, scaffolded: [], warnings }

  // ── Step 4: Process credentials ───────────────────────────────────────
  if (answers.credentialsPath) {
    logger.blank()
    const credSpin = createSpinner('Processing credentials.json...')
    credSpin.start()
    const resolvedPath = await readCredentials(answers.credentialsPath, project)
    answers.backendUrls.credentialsPath = resolvedPath
    credSpin.stop()
  }

  // ── Step 5: Write our_pkg.json ────────────────────────────────────────
  logger.blank()
  const configSpin = createSpinner('Writing our_pkg.json...')
  configSpin.start()
  await generateConfig(context)
  configSpin.stop()

  // ── Step 6: Scaffold frontend (optional) ────────────────────────────────
  if (generateFrontend && !backendOnly) {
    logger.blank()
    const frontSpin = createSpinner('Scaffolding frontend files...')
    frontSpin.start()
    context.scaffolded.push(...(await scaffoldFrontend(context)))
    frontSpin.stop()
  } else if (!backendOnly) {
    logger.blank()
    logger.info('📦 Frontend will be handled by custom-push package')
    logger.info('   Install with: npm install custom-push')
    logger.info('   Usage: import { usePush } from "custom-push"')
  }

  // ── Step 7: Scaffold backend ──────────────────────────────────────────
  if (project.scope === 'both') {
    logger.blank()
    const backSpin = createSpinner('Scaffolding backend files...')
    backSpin.start()
    context.scaffolded.push(...(await scaffoldBackend(context)))
    backSpin.stop()
  }

  // ── Print summary ─────────────────────────────────────────────────────
  await printSummary(context)
}
