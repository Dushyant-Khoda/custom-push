import chalk from 'chalk'

export const logger = {
  info(message: string): void {
    console.log(chalk.blue(`  ℹ  ${message}`))
  },

  success(message: string): void {
    console.log(chalk.green(`  ✓  ${message}`))
  },

  warn(message: string): void {
    console.log(chalk.yellow(`  ⚠  ${message}`))
  },

  error(message: string): void {
    console.log(chalk.red(`  ✖  ${message}`))
  },

  step(n: number, label: string): void {
    console.log(chalk.white(`  [${n}] ${label}`))
  },

  divider(): void {
    console.log('  ──────────────────────────────────────────────')
  },

  blank(): void {
    console.log('')
  },

  raw(message: string): void {
    console.log(message)
  },
}
