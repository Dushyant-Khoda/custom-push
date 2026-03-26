import { confirm } from '@inquirer/prompts'
import { CLIContext } from '../types'
import { createSpinner } from '../utils/spinner'
import { printSummary } from '../utils/printSummary'
import { detectProject } from '../core/detectProject'
import { validateVersions } from '../core/validateVersions'
import { readCredentials } from '../core/readCredentials'
import { runPrompts } from '../modules/runPrompts'
import { generateConfig } from '../modules/generateConfig'
import { scaffoldFrontend } from '../modules/scaffoldFrontend'
import { scaffoldBackend } from '../modules/scaffoldBackend'
import { showStep, messages, successAnimation } from '../utils/branding'

export async function init(options: { generateFrontend?: boolean; backendOnly?: boolean } = {}): Promise<void> {
  const cwd = process.cwd()
  const { generateFrontend = false, backendOnly = false } = options

  // Show welcome message
  console.log(messages.welcome)

  // ── Step 1: Detect project ────────────────────────────────────────────
  showStep(1, 'Analyzing project structure...')
  const detectSpin = createSpinner('Detecting project configuration...', 'dots')
  detectSpin.start()
  const project = await detectProject(cwd)
  detectSpin.succeed('Project detected successfully')
  
  console.log(`   ${messages.success.detected}`)
  console.log(`   Language: ${project.language}`)
  console.log(`   React: ${project.reactVersion ? '✓' : '✗'}`)
  console.log(`   Firebase: ${project.hasFirebase ? '✓' : '✗'}`)
  console.log(`   Scope: ${project.scope}`)

  // ── Step 2: Validate versions ───────────────────────────────────────────
  showStep(2, 'Validating dependencies...')
  const validateSpin = createSpinner('Checking version compatibility...', 'pulse')
  validateSpin.start()
  const warnings = await validateVersions(project)
  validateSpin.succeed('Version validation complete')

  if (warnings.length > 0) {
    console.log()
    console.log(messages.warning.incompatible)
    warnings.forEach(warning => {
      console.log(`   ${warning}`)
    })
    
    const answers = await runPrompts(project, { backendOnly })
    if (!answers) {
      console.log()
      console.log(messages.error.cancelled)
      process.exit(0)
    }
    
    console.log()
    console.log(messages.warning.proceeding)
  }

  // ── Step 3: Run prompts ───────────────────────────────────────────────
  showStep(3, 'Configuring push notifications...')
  const answers = await runPrompts(project, { backendOnly })

  // ── Build context ─────────────────────────────────────────────────────
  const context: CLIContext = { project, answers, scaffolded: [], warnings }

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

  // ── Step 6: Scaffold frontend (optional) ────────────────────────────────
  if (generateFrontend && !backendOnly) {
    showStep(6, 'Building frontend components...')
    const frontSpin = createSpinner('Generating frontend boilerplate...', 'rocket')
    frontSpin.start()
    context.scaffolded.push(...(await scaffoldFrontend(context)))
    frontSpin.succeed('Frontend scaffolding complete')
  } else if (!backendOnly) {
    console.log()
    console.log(messages.next.install)
    console.log(messages.next.import)
    console.log(messages.next.wrap)
    console.log(messages.next.test)
  }

  // ── Step 7: Scaffold backend ──────────────────────────────────────────
  if (project.scope === 'both') {
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
