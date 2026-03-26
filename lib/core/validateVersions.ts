import * as semver from 'semver'
import { ProjectInfo, VersionWarning } from '../types'
import { FIREBASE_VERSION_RANGE, REACT_VERSION_RANGE } from '../constants'

export function validateVersions(project: ProjectInfo): VersionWarning[] {
  const warnings: VersionWarning[] = []

  // ── Firebase check ────────────────────────────────────────────────────
  if (!project.firebaseVersion) {
    warnings.push({
      package: 'firebase',
      found: 'not installed',
      required: FIREBASE_VERSION_RANGE,
      fix: 'npm install firebase@latest',
    })
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

  // ── React check ───────────────────────────────────────────────────────
  if (!project.reactVersion) {
    warnings.push({
      package: 'react',
      found: 'not installed',
      required: REACT_VERSION_RANGE,
      fix: 'npm install react@latest',
    })
  } else {
    const coerced = semver.coerce(project.reactVersion)
    if (coerced && !semver.satisfies(coerced, REACT_VERSION_RANGE)) {
      warnings.push({
        package: 'react',
        found: project.reactVersion,
        required: REACT_VERSION_RANGE,
        fix: 'npm install react@latest',
      })
    }
  }

  return warnings
}
