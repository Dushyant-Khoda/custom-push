import * as path from 'path'
import { ProjectInfo } from '../types'
import { logger } from '../utils/logger'
import { fileExists, readFile, readJson, copyFile, appendToFile } from '../utils/fileUtils'
import {
  CREDENTIALS_FILENAME,
  GITIGNORE_FILENAME,
  REQUIRED_CREDENTIAL_FIELDS,
} from '../constants'

export async function readCredentials(
  inputPath: string,
  project: ProjectInfo
): Promise<string> {
  // 1. Resolve to absolute path
  const absolutePath = path.resolve(inputPath)

  // 2. File not found → exit
  if (!(await fileExists(absolutePath))) {
    logger.error(`File not found: ${absolutePath}`)
    logger.error('Check the path and re-run: npx custom-push init')
    process.exit(1)
  }

  // 3. Parse JSON — invalid → exit
  let parsed: Record<string, any>
  try {
    parsed = await readJson<Record<string, any>>(absolutePath)
  } catch {
    logger.error('credentials.json is not valid JSON. Check the file and try again.')
    process.exit(1)
  }

  // 4. Validate required fields
  const missingFields = REQUIRED_CREDENTIAL_FIELDS.filter((f) => !(f in parsed))
  if (missingFields.length > 0) {
    logger.error(`credentials.json is missing required fields: ${missingFields.join(', ')}`)
    logger.error('Download the correct service account file from Firebase Console.')
    process.exit(1)
  }

  // 5. Copy if outside project root
  const destPath = path.join(project.rootDir, CREDENTIALS_FILENAME)
  const isInsideProject = absolutePath.startsWith(project.rootDir + path.sep) ||
    absolutePath === destPath

  if (isInsideProject) {
    logger.success('credentials.json found in project root')
  } else {
    await copyFile(absolutePath, destPath)
    logger.success('Copied credentials.json to project root')
  }

  // 6. Add to .gitignore
  const gitignorePath = path.join(project.rootDir, GITIGNORE_FILENAME)
  let gitignoreContent = ''
  try {
    gitignoreContent = await readFile(gitignorePath)
  } catch {
    // .gitignore doesn't exist yet
  }

  const lines = gitignoreContent.split('\n').map((l) => l.trim())
  if (!lines.includes(CREDENTIALS_FILENAME)) {
    await appendToFile(gitignorePath, CREDENTIALS_FILENAME)
  }
  logger.success('credentials.json added to .gitignore — never commit this file')

  // 7. Return absolute path in project root
  return destPath
}
