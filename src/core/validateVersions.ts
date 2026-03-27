import * as semver from 'semver'
import { ProjectInfo, VersionWarning } from '../types'
import { FIREBASE_VERSION_RANGE, REACT_VERSION_RANGE } from '../constants'

export function validateVersions(project: ProjectInfo, options: { backendOnly?: boolean } = {}): VersionWarning[] {
  const { backendOnly = false } = options
  const warnings: VersionWarning[] = []

  // ── Frontend Checks (Skip if backend-only) ────────────────────────────
  if (!backendOnly) {
    // ── Firebase check ─────────────────────────────────────────────────────
    const isFrontendScope = project.scope === 'frontend' || project.scope === 'both'
    if (!project.firebaseVersion) {
      // Prompt for missing firebase if it's a frontend project
      if (isFrontendScope) {
        warnings.push({
          package: 'firebase',
          found: 'not installed',
          required: FIREBASE_VERSION_RANGE,
          fix: 'npm install firebase@latest',
        })
      }
    } else {
      const coerced = semver.coerce(project.firebaseVersion)
      if (coerced && !semver.satisfies(coerced, FIREBASE_VERSION_RANGE)) {
        warnings.push({
          package: 'firebase',
          found: project.firebaseVersion,
          required: FIREBASE_VERSION_RANGE,
          fix: 'npm install firebase@latest',
        })
      }
    }

    // ── React check — only when project actually uses React ────────────────
    const hasFrontend = project.scope === 'frontend' || project.scope === 'both'
    if (hasFrontend) {
      if (!project.reactVersion) {
        warnings.push({
          package: 'react',
          found: 'not installed',
          required: REACT_VERSION_RANGE,
          fix: 'npm install react@latest react-dom@latest',
        })
      } else {
        const coerced = semver.coerce(project.reactVersion)
        if (coerced && !semver.satisfies(coerced, REACT_VERSION_RANGE)) {
          warnings.push({
            package: 'react',
            found: project.reactVersion,
            required: REACT_VERSION_RANGE,
            fix: 'npm install react@latest react-dom@latest',
          })
        }
      }
    }
  }

  // ── Backend Checks (Always run if applicable) ─────────────────────────
  // ── Firebase Admin SDK (Backend) ──────────────────────────────────────
  // Only check if it's a backend project or backend-only
  if ((project.backendFramework || backendOnly) && !project.hasFirebaseAdmin) {
    warnings.push({
      package: 'firebase-admin',
      found: 'not installed',
      required: '^12.0.0',
      fix: 'npm install firebase-admin',
    })
  }

  return warnings
}
