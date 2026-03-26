import chalk from 'chalk'

export function createSpinner(message: string) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  let interval: NodeJS.Timeout | null = null

  return {
    start() {
      process.stdout.write('\x1B[?25l') // hide cursor
      interval = setInterval(() => {
        const frame = chalk.cyan(frames[i])
        process.stdout.write(`\r  ${frame}  ${message}`)
        i = (i + 1) % frames.length
      }, 80)
    },
    stop(success = true) {
      if (interval) {
        clearInterval(interval)
        process.stdout.write('\r')
        process.stdout.write('\x1B[K') // clear line
        if (success) {
          console.log(chalk.green(`  ✓  ${message}`))
        } else {
          console.log(chalk.red(`  ✖  ${message}`))
        }
        process.stdout.write('\x1B[?25h') // show cursor
      }
    },
    update(newMessage: string) {
      message = newMessage
    }
  }
}
