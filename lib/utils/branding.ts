import chalk from 'chalk'
import ora, { Ora } from 'ora'

// CustomPush Brand Colors
export const colors = {
  primary: '#7C3AED',      // Purple
  secondary: '#EC4899',    // Pink  
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue
  dark: '#1F2937',         // Gray
  light: '#F9FAFB'         // Light gray
}

// Brand styling functions
export const brand = {
  logo: (text: string) => chalk.hex(colors.primary).bold(text),
  accent: (text: string) => chalk.hex(colors.secondary)(text),
  success: (text: string) => chalk.hex(colors.success)(text),
  warning: (text: string) => chalk.hex(colors.warning)(text),
  error: (text: string) => chalk.hex(colors.error)(text),
  info: (text: string) => chalk.hex(colors.info)(text),
  muted: (text: string) => chalk.hex(colors.dark)(text),
  subtle: (text: string) => chalk.hex(colors.dark).dim(text),
  highlight: (text: string) => chalk.bgHex(colors.primary).hex(colors.light)(text),
  code: (text: string) => chalk.hex(colors.dark).bgHex(colors.light)(` ${text} `)
}

// Custom spinner configurations
export const spinners = {
  dots: { interval: 80, frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] },
  line: { interval: 130, frames: ['-', '\\', '|', '/'] },
  pipe: { interval: 100, frames: ['┤', '┘', '┴', '└', '├', '┌', '┬', '┐'] },
  star: { interval: 70, frames: ['✶', '✸', '✹', '✺', '✹', '✷'] },
  arrow: { interval: 80, frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'] },
  pulse: { interval: 80, frames: ['◐', '◓', '◑', '◒'] },
  moon: { interval: 80, frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'] },
  rocket: { interval: 120, frames: ['🚀', '💫', '⭐', '✨'] }
}

// Enhanced spinner creation with branding
export function createSpinner(text?: string, type: keyof typeof spinners = 'dots'): Ora {
  const spinnerConfig = spinners[type]
  return ora({
    text: brand.info(text || 'Loading...'),
    spinner: spinnerConfig
  })
}

// Brand messages
export const messages = {
  welcome: `
${brand.logo('CustomPush')}
${brand.subtle('Firebase Push Notifications Setup Tool')}
${brand.muted('─'.repeat(50))}
  `,

  initializing: brand.info('Initializing CustomPush...'),
  detecting: brand.info('Analyzing project structure...'),
  validating: brand.info('Checking dependencies...'),
  configuring: brand.info('Setting up push notifications...'),
  scaffolding: brand.info('Building project files...'),
  finalizing: brand.info('Finalizing configuration...'),

  success: {
    initialized: brand.success('CustomPush initialized successfully'),
    detected: brand.success('Project detected and configured'),
    validated: brand.success('Dependencies validated'),
    configured: brand.success('Push notifications configured'),
    scaffolded: brand.success('Project files created'),
    completed: brand.success('Setup completed successfully')
  },

  warning: {
    incompatible: brand.warning('Version compatibility issues found'),
    proceeding: brand.warning('Continuing with incompatible versions'),
    notFound: brand.warning('Project not found'),
    failed: brand.warning('Setup failed'),
    cancelled: brand.warning('Setup cancelled by user')
  },

  error: {
    notFound: brand.error('Project not found'),
    incompatible: brand.error('Incompatible versions detected'),
    failed: brand.error('Setup failed'),
    cancelled: brand.error('Setup cancelled by user')
  },

  next: {
    install: brand.info(`Install frontend package: ${brand.code('npm install custom-push')}`),
    import: brand.info(`Import in your app: ${brand.code('import { CustomPushProvider } from "custom-push"')}`),
    wrap: brand.info(`Wrap your app: ${brand.code('<CustomPushProvider><YourApp /></CustomPushProvider>')}`),
    test: brand.info(`Test notifications from Firebase Console`)
  }
}

// Progress steps
export function showStep(step: number, title: string): void {
  const progress = brand.highlight(`Step ${step}`)
  console.log(`\n${progress} ${brand.info(title)}`)
}

// Brand divider
export function divider(char: string = '─', width: number = 50): void {
  console.log(brand.muted(char.repeat(width)))
}

// Brand header
export function header(title: string, subtitle?: string): void {
  console.log()
  divider()
  console.log(brand.logo(title))
  if (subtitle) {
    console.log(brand.subtle(subtitle))
  }
  divider()
  console.log()
}

// Brand footer
export function footer(message?: string): void {
  console.log()
  if (message) {
    console.log(brand.info(message))
  }
  divider()
  console.log(brand.muted('Made with care by CustomPush Team'))
  console.log()
}

// Success animation
export function successAnimation(message: string): void {
  console.log()
  console.log(brand.success('✓ ' + message))
  console.log(brand.success('✓ Setup completed successfully'))
  console.log()
}

// Error display
export function showError(title: string, message: string, suggestion?: string): void {
  console.log()
  console.log(brand.error('✗ ' + title))
  console.log(brand.muted('   ' + message))
  if (suggestion) {
    console.log(brand.info('Tip: ' + suggestion))
  }
  console.log()
}

// Warning display
export function showWarning(title: string, message: string): void {
  console.log()
  console.log(brand.warning('⚠ ' + title))
  console.log(brand.muted('   ' + message))
  console.log()
}

// Info display
export function showInfo(title: string, message: string): void {
  console.log()
  console.log(brand.info('ℹ ' + title))
  console.log(brand.muted('   ' + message))
  console.log()
}
