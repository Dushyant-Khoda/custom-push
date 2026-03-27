import { createSpinner as createBrandSpinner } from './branding'

export function createSpinner(text?: string, type: 'dots' | 'line' | 'pipe' | 'star' | 'arrow' | 'pulse' | 'moon' = 'dots') {
  return createBrandSpinner(text, type as any)
}
