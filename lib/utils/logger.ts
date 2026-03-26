import chalk from 'chalk'
import { brand, colors } from './branding'

// Re-export brand functions for backward compatibility
export const { 
  logo, accent, success, warning, error, info, muted, subtle, highlight, code 
} = brand

export const logger = {
  blank: () => console.log(),
  
  divider: (char: string = '─', width: number = 50) => {
    console.log(chalk.hex(colors.dark)(char.repeat(width)))
  },

  info: (message: string) => {
    console.log(chalk.hex(colors.info)(message))
  },

  success: (message: string) => {
    console.log(chalk.hex(colors.success)(message))
  },

  warn: (message: string) => {
    console.log(chalk.hex(colors.warning)(message))
  },

  error: (message: string) => {
    console.log(chalk.hex(colors.error)(message))
  },

  step: (step: number, title: string) => {
    const progress = chalk.bgHex(colors.primary).hex(colors.light)(`Step ${step}`)
    console.log(`\n${progress} ${chalk.hex(colors.info)(title)}`)
  },

  raw: (message: string) => {
    console.log(message)
  },

  // Brand-specific methods
  logo: (message: string) => {
    console.log(brand.logo(message))
  },

  accent: (message: string) => {
    console.log(brand.accent(message))
  },

  muted: (message: string) => {
    console.log(brand.muted(message))
  },

  highlight: (message: string) => {
    console.log(brand.highlight(message))
  },

  code: (message: string) => {
    console.log(brand.code(message))
  }
}
