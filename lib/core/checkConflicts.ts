import * as path from 'path'
import { select } from '@inquirer/prompts'
import { ProjectInfo, ConflictResolution } from '../types'
import { logger } from '../utils/logger'
import { fileExists, readFile, getDiff } from '../utils/fileUtils'

export async function checkConflicts(
  filesToWrite: Array<{ path: string; content: string; description: string }>,
  project: ProjectInfo
): Promise<Array<{ path: string; content: string; description: string; action: 'write' | 'skip' }>> {
  const results: Array<{ path: string; content: string; description: string; action: 'write' | 'skip' }> = []

  for (const file of filesToWrite) {
    const exists = await fileExists(file.path)

    if (!exists) {
      results.push({ ...file, action: 'write' })
      continue
    }

    const relativePath = path.relative(project.rootDir, file.path)

    // File exists — enter conflict resolution loop
    let resolved = false
    while (!resolved) {
      logger.blank()
      logger.warn(`conflict  ${relativePath}`)

      const choice = await select<ConflictResolution>({
        message: 'What do you want to do?',
        choices: [
          { name: 'Overwrite   — replace existing file', value: 'overwrite' as ConflictResolution },
          { name: 'Skip        — keep existing file', value: 'skip' as ConflictResolution },
          { name: 'View        — show current file content', value: 'view' as ConflictResolution },
          { name: 'Diff        — show what would change', value: 'diff' as ConflictResolution },
        ],
      })

      if (choice === 'overwrite') {
        results.push({ ...file, action: 'write' })
        resolved = true
      } else if (choice === 'skip') {
        results.push({ ...file, action: 'skip' })
        resolved = true
      } else if (choice === 'view') {
        const currentContent = await readFile(file.path)
        logger.blank()
        logger.info(`── Current content of ${relativePath} ──`)
        logger.raw(currentContent)
        logger.divider()
      } else if (choice === 'diff') {
        const currentContent = await readFile(file.path)
        const diffOutput = getDiff(currentContent, file.content)
        logger.blank()
        logger.info(`── Diff for ${relativePath} ──`)
        logger.raw(diffOutput)
        logger.divider()
      }
    }
  }

  return results
}
