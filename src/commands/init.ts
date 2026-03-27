import { confirm } from '@inquirer/prompts'
import { CLIContext, InitMode } from '../types'
import { createSpinner } from '../utils/spinner'
import { printSummary } from '../utils/printSummary'
import { detectProject } from '../core/detectProject'
import { validateVersions } from '../core/validateVersions'
import { readCredentials } from '../core/readCredentials'
import { runPrompts } from '../modules/runPrompts'
import { generateConfig } from '../modules/generateConfig'
import { scaffoldFrontend } from '../modules/scaffoldFrontend'
import { scaffoldBackend } from '../modules/scaffoldBackend'
import { scaffoldFiles } from '../modules/scaffoldFiles'
import { logger } from '../utils/logger'
import { showStep, messages, successAnimation } from '../utils/branding'
import { SERVICE_WORKER_FILENAME } from '../constants'

export async function init(options: {
  files?: boolean
  generateFrontend?: boolean
  backendOnly?: boolean
} = {}): Promise<void> {
  const cwd = process.cwd()
  const { files = false, generateFrontend = false, backendOnly = false } = options
  const mode: InitMode = files ? 'files' : 'library'

  // ── Step 1: Detect project ────────────────────────────────────────────
  showStep(1, 'Analyzing project structure...')
  const detectSpin = createSpinner('Detecting project configuration...', 'dots')
  detectSpin.start()
  const project = await detectProject(cwd, { backendOnly })
  detectSpin.succeed('Project detected successfully')

  logger.info(`   Language: ${project.language}`)
  if (!backendOnly) {
    logger.info(`   React: ${project.reactVersion ? `✓ v${project.reactVersion}` : '✗ not found'}`)
  }
  logger.info(`   Firebase: ${project.hasFirebase ? `✓ v${project.firebaseVersion}` : '✗ not found'}`)
  
  if (!backendOnly) {
    const framework = project.isNextJs ? 'Next.js' : project.isVite ? 'Vite' : (project.reactVersion ? 'React' : 'none')
    logger.info(`   Framework: ${framework}`)
  }

  logger.info(`   Backend: ${project.backendFramework || 'none'}`)
  logger.info(`   Mode: ${backendOnly ? 'backend-only' : mode}`)

  // ── Step 2: Validate versions ───────────────────────────────────────────
  showStep(2, 'Validating dependencies...')
  const validateSpin = createSpinner('Checking version compatibility...', 'pulse')
  validateSpin.start()
  const warnings = validateVersions(project, { backendOnly })
  validateSpin.succeed('Version validation complete')

  if (warnings.length > 0) {
    logger.blank()
    logger.warn('⚠  Version compatibility issues found:')
    for (const w of warnings) {
      logger.warn(`   ${w.package} version mismatch`)
      logger.info(`      Found:    ${w.found}`)
      logger.info(`      Required: ${w.required}`)
      logger.info(`      Fix:      ${w.fix}`)
    }
    logger.blank()

    const shouldContinue = await confirm({
      message: 'Versions above may cause issues. Continue anyway?',
      default: false,
    })

    if (!shouldContinue) {
      logger.info('Fix the above and re-run: npx custom-push init')
      process.exit(0)
    }

    logger.warn('Proceeding with incompatible versions. Things may break.')
  }

  // ── Step 3: Run prompts ───────────────────────────────────────────────
  showStep(3, 'Configuring push notifications...')
  const answers = await runPrompts(project, { backendOnly })

  // ── Build context ─────────────────────────────────────────────────────
  const context: CLIContext = {
    project,
    answers,
    scaffolded: [],
    warnings,
    mode,
    serviceWorkerFilename: SERVICE_WORKER_FILENAME,
    backendOnly,
  }

  // ── Step 4: Process credentials ───────────────────────────────────────
  if (answers.credentialsPath) {
    showStep(4, 'Processing Firebase credentials...')
    const credSpin = createSpinner('Validating credentials.json...', 'arrow')
    credSpin.start()
    const resolvedPath = await readCredentials(answers.credentialsPath, project)
    answers.backendUrls.credentialsPath = resolvedPath
    credSpin.succeed('Firebase credentials processed')
  }

  // ── Step 5: Write our_pkg.json ────────────────────────────────────────
  showStep(5, 'Creating configuration file...')
  const configSpin = createSpinner('Generating our_pkg.json...', 'star')
  configSpin.start()
  await generateConfig(context)
  configSpin.succeed('Configuration file created')

  // ── Step 6: Scaffold based on mode ────────────────────────────────────
  if (mode === 'files' && !backendOnly) {
    // --files mode: generate standalone files into src/push-notification/
    showStep(6, 'Generating standalone push notification files...')
    const filesSpin = createSpinner('Scaffolding push-notification files...', 'rocket')
    filesSpin.start()
    context.scaffolded.push(...(await scaffoldFiles(context)))
    filesSpin.succeed('Standalone files generated')
  } else if (!backendOnly) {
    // Library mode: scaffold frontend boilerplate
    if (generateFrontend) {
      showStep(6, 'Building frontend components...')
      const frontSpin = createSpinner('Generating frontend boilerplate...', 'rocket')
      frontSpin.start()
      context.scaffolded.push(...(await scaffoldFrontend(context)))
      frontSpin.succeed('Frontend scaffolding complete')
    } else {
      // Default library mode — generate service worker + show import instructions
      showStep(6, 'Generating service worker...')
      const swSpin = createSpinner('Creating service worker file...', 'rocket')
      swSpin.start()
      context.scaffolded.push(...(await scaffoldFrontend(context)))
      swSpin.succeed('Service worker generated')
    }
  }

  // ── Step 7: Scaffold backend ──────────────────────────────────────────
  if (project.scope === 'both' || backendOnly) {
    showStep(7, 'Building backend infrastructure...')
    const backSpin = createSpinner('Generating backend helpers...', 'line')
    backSpin.start()
    context.scaffolded.push(...(await scaffoldBackend(context)))
    backSpin.succeed('Backend scaffolding complete')
  }

  // ── Final summary ─────────────────────────────────────────────────────
  successAnimation('CustomPush setup completed successfully!')
  printSummary(context)
}
