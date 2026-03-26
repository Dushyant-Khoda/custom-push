import * as fs from 'fs/promises'
import * as path from 'path'

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, content, 'utf-8')
}

export async function copyFile(src: string, dest: string): Promise<void> {
  const dir = path.dirname(dest)
  await fs.mkdir(dir, { recursive: true })
  await fs.copyFile(src, dest)
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath)
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Invalid JSON in file: ${filePath}`)
  }
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2) + '\n'
  await writeFile(filePath, content)
}

export function getDiff(existingContent: string, newContent: string): string {
  const oldLines = existingContent.split('\n')
  const newLines = newContent.split('\n')
  const lines: string[] = []

  const maxLen = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined
    const newLine = i < newLines.length ? newLines[i] : undefined

    if (oldLine === newLine) {
      lines.push(`  ${oldLine}`)
    } else {
      if (oldLine !== undefined) {
        lines.push(`- ${oldLine}`)
      }
      if (newLine !== undefined) {
        lines.push(`+ ${newLine}`)
      }
    }
  }

  return lines.join('\n')
}

export async function appendToFile(filePath: string, line: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })

  let existing = ''
  try {
    existing = await readFile(filePath)
  } catch {
    // file doesn't exist yet — will be created
  }

  const trimmed = existing.trimEnd()
  const newContent = trimmed.length > 0 ? `${trimmed}\n${line}\n` : `${line}\n`
  await fs.writeFile(filePath, newContent, 'utf-8')
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}
