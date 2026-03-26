/**
 * Simple {{VAR}} token replacer for all templates.
 * If a key exists in the template but not in vars, it is replaced with an empty string.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return vars[key] !== undefined ? vars[key] : ''
  })
}
