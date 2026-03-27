export type Language = 'typescript' | 'javascript'
export type BackendFramework = 'express' | 'nestjs' | null
export type Scope = 'frontend' | 'both'
export type ConflictResolution = 'overwrite' | 'skip' | 'view' | 'diff'
export type InitMode = 'library' | 'files'

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

export interface BackendConfig {
  registerUrl: string
  unregisterUrl: string
  credentialsPath: string | null        // relative path from project root
}

export interface NotificationConfig {
  defaultIcon: string
  defaultBadge: string
  defaultTitle: string
  clickAction: string
  payload: Record<string, string>
}

export interface ProjectInfo {
  rootDir: string                       // absolute path to project root
  srcDir: string                        // absolute path to src/ or rootDir if no src/
  publicDir: string                     // absolute path to public/
  language: Language
  reactVersion: string | null
  firebaseVersion: string | null
  hasFirebase: boolean
  backendFramework: BackendFramework    // nestjs takes priority over express if both present
  scope: Scope                          // 'both' if backendFramework !== null
  hasTsConfig: boolean
  isNextJs: boolean
  isVite: boolean
  packageJson: Record<string, any>
}

export interface UserAnswers {
  firebase: FirebaseWebConfig
  backendUrls: BackendConfig
  credentialsPath: string | null
}

export interface ScaffoldedFile {
  absolutePath: string
  relativePath: string                  // relative to project root, shown in summary
  status: 'created' | 'skipped' | 'overwritten'
  description: string
}

export interface VersionWarning {
  package: string
  found: string
  required: string
  fix: string                           // exact npm command to run
}

export interface CLIContext {
  project: ProjectInfo
  answers: UserAnswers
  scaffolded: ScaffoldedFile[]
  warnings: VersionWarning[]
  mode: InitMode
  serviceWorkerFilename: string         // actual filename used (may differ if collision)
}
