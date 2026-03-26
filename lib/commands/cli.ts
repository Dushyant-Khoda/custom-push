import { program } from 'commander'
import { init } from './init'
import { generateServiceWorker } from './generateServiceWorker'
import { logger } from '../utils/logger'

program
  .name('custom-push')
  .description('CLI for Firebase push notifications - Backend scaffolding with optional frontend support')
  .version('1.0.0')

// Main init command - backend focused by default
program
  .command('init')
  .description('Initialize push notifications (backend scaffolding + optional frontend)')
  .option('--generate-frontend', 'Generate frontend boilerplate files')
  .option('--backend-only', 'Skip frontend completely, backend only')
  .action(async (options) => {
    try {
      await init(options)
    } catch (error: any) {
      if (error.name === 'ExitPromptError' || error.message?.includes('User force closed')) {
        logger.blank()
        logger.warn('👋 Setup cancelled by user')
        logger.info('   No worries! You can run the command again anytime.')
        logger.info('   Just type: npx custom-push init')
        logger.blank()
        process.exit(0)
      } else {
        logger.blank()
        logger.error('❌ Something went wrong during setup')
        logger.error(`   ${error.message || error}`)
        logger.info('   💡 Need help? Check the troubleshooting guide:')
        logger.info('   https://github.com/your-username/custom-push/blob/main/docs/TROUBLESHOOTING.md')
        logger.blank()
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
    try {
      await generateServiceWorker()
    } catch (error: any) {
      if (error.name === 'ExitPromptError' || error.message?.includes('User force closed')) {
        logger.blank()
        logger.warn('👋 Service worker generation cancelled')
        logger.info('   No problem! Run it again when you\'re ready:')
        logger.info('   npx custom-push generate-service-worker')
        logger.blank()
        process.exit(0)
      } else {
        logger.blank()
        logger.error('❌ Failed to generate service worker')
        logger.error(`   ${error.message || error}`)
        logger.info('   💡 Make sure you have Firebase configuration ready')
        logger.blank()
        process.exit(1)
      }
    }
  })

// Handle uncaught promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.blank()
  logger.error('❌ Unexpected error occurred')
  logger.error(`   ${reason instanceof Error ? reason.message : String(reason)}`)
  logger.info('   This shouldn\'t happen. Please report this issue:')
  logger.info('   https://github.com/your-username/custom-push/issues')
  logger.blank()
  process.exit(1)
})

// Parse command line arguments
program.parse()
