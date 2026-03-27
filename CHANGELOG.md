# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0] — 2026-03-26

### Added
- Initial release of `custom-push` CLI
- Auto-detection of language, React version, Firebase version, and backend framework
- Interactive prompts for Firebase web config, VAPID key, backend URLs, and credentials path
- Semver-based version compatibility validation (Firebase ≥10 <13, React ≥17)
- Conflict detection with overwrite / skip / view / diff options
- `our_pkg.json` config generation — single source of truth
- Service worker scaffolding (`firebase-messaging-sw.js`)
- Frontend helper scaffolding (`usePush()` hook)
- Express backend scaffolding (push helper + routes)
- NestJS backend scaffolding (module + service + controller)
- Credentials.json validation, copy, and `.gitignore` management
- Clean terminal summary with next steps
