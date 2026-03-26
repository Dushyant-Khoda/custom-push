import { CLIContext } from '../types'
import { logger } from './logger'

export async function printSummary(context: CLIContext): Promise<void> {
  const { scaffolded, warnings, project } = context

  const created = scaffolded.filter((f) => f.status === 'created' || f.status === 'overwritten')
  const skipped = scaffolded.filter((f) => f.status === 'skipped')

  logger.blank()
  logger.divider()
  logger.info('custom-push setup complete')
  logger.divider()
  logger.blank()

  // ── Created ───────────────────────────────────────────────────────────
  if (created.length > 0) {
    logger.info('Created')
    for (const file of created) {
      const padded = file.relativePath.padEnd(38)
      logger.success(`${padded} ${file.description}`)
    }
    logger.blank()
  }

  // ── Skipped ───────────────────────────────────────────────────────────
  if (skipped.length > 0) {
    logger.info('Skipped')
    for (const file of skipped) {
      const padded = file.relativePath.padEnd(38)
      logger.raw(`  –  ${padded} ${file.description}`)
    }
    logger.blank()
  }

  // ── Warnings ──────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    logger.info('Warnings')
    for (const w of warnings) {
      logger.warn(`${w.package}@${w.found} — run: ${w.fix}`)
    }
    logger.blank()
  }

  // ── Next steps ────────────────────────────────────────────────────────
  logger.info('Next steps')

  logger.raw(`  [1] Add usePush() to your app root:`)
  logger.raw(`      import { usePush } from './push/pushHelper'`)
  logger.raw(`      function App() { usePush(); return <YourApp /> }`)
  logger.blank()

  logger.raw(`  [2] Add /public/icon.png (displayed on push notifications)`)
  logger.blank()

  if (project.scope === 'both') {
    logger.raw(`  [3] Mount push routes — see instructions above`)
    logger.blank()
  }

  logger.raw(`  All config lives in our_pkg.json — edit anytime.`)
  logger.divider()
  logger.blank()
}
