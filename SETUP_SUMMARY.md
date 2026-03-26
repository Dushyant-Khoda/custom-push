# Custom-Push Setup Summary

This document summarizes the state of the `custom-push` CLI tool and its generated assets.

## Core Package

- **Version**: 1.0.0
- **Engine**: Node.js >= 18.0.0
- **Primary Command**: `npx custom-push init`

## Generated Stack Architecture

When you run the init command, the following architecture is established:

1.  **Config Layer**: `our_pkg.json` (The source of truth for all runtime files).
2.  **Runtime Layer**: Uses `custom-push/runtime` for hook abstractions.
3.  **Security Layer**: `credentials.json` is auto-ignored by Git.
4.  **Backend Layer**: Modular scaffolding for Express or NestJS depending on project detection.

## Validation Matrix

Our tool enforces strict compatibility to prevent "push failure" edge cases:
- **Firebase JS SDK**: 10.x - 12.x
- **React**: >= 17.0.0
- **Environment**: HTTPS or localhost (required by browsers for Service Workers)
