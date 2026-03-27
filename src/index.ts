import { program } from 'commander'
import packageJson from '../package.json'
import { init } from './commands/init'
import { generateServiceWorker } from './commands/generateServiceWorker'
import { header, footer, showError, showWarning } from './utils/branding'

export function runCLI() {
  program
    .name('custom-push')
    .description('CustomPush - Firebase push notifications setup tool')
    .version(packageJson.version)

  // Main init command
  program
    .command('init')
    .description('Initialize push notifications in your project')
    .option('--files', 'Generate standalone files instead of using the npm library')
    .option('--generate-frontend', 'Generate frontend boilerplate files')
    .option('--backend-only', 'Skip frontend completely, backend only')
    .action(async (options) => {
      header('CustomPush', 'Firebase Push Notifications Setup Tool')
      
      try {
        await init(options)
        footer('CustomPush setup completed successfully')
      } catch (error: any) {
        if (error.name === 'ExitPromptError' || error.message?.includes('User force closed')) {
          showWarning('Setup Cancelled', 'Setup was cancelled by user')
          footer('Run again anytime with: npx custom-push init')
          process.exit(0)
        } else {
          showError('Setup Failed', error.message || 'Unknown error occurred', 'Check troubleshooting guide for help')
          footer('Need help? https://github.com/Dushyant-Khoda/custom-push/issues')
          process.exit(1)
        }
      }
    })

  // Service worker generator command
  program
    .command('generate-service-worker')
    .alias('generate-sw')
    .description('Generate only the service worker file')
    .action(async () => {
      header('CustomPush Service Worker Generator')
      
      try {
        await generateServiceWorker()
        footer('Service worker generated successfully')
      } catch (error: any) {
        if (error.name === 'ExitPromptError' || error.message?.includes('User force closed')) {
          showWarning('Generation Cancelled', 'Service worker generation was cancelled')
          footer('Run again anytime with: npx custom-push generate-service-worker')
          process.exit(0)
        } else {
          showError('Generation Failed', error.message || 'Failed to generate service worker', 'Ensure Firebase configuration is ready')
          footer('Check Firebase Console for correct configuration')
          process.exit(1)
        }
      }
    })

  // Handle uncaught promise rejections
  process.on('unhandledRejection', (reason) => {
    showError('Unexpected Error', reason instanceof Error ? reason.message : String(reason), 'Please report this issue to help us improve')
    footer('Report: https://github.com/Dushyant-Khoda/custom-push/issues')
    process.exit(1)
  })

  // Parse command line arguments
  program.parse()
}

// Support programmatic use (init/SW)
export { init } from './commands/init'
export { generateServiceWorker } from './commands/generateServiceWorker'
export type { CLIContext, ProjectInfo, UserAnswers, ScaffoldedFile, InitMode } from './types'
