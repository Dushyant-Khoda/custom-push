# Contributing to custom-push

Thank you for considering contributing to `custom-push`! Here's how you can help.

## Development Setup

```bash
git clone https://github.com/your-org/custom-push.git
cd custom-push
npm install
npm run dev    # watches and recompiles on change
```

## Project Structure

```
custom-push/
├── bin/cli.js              ← Shebang entry point (CommonJS)
├── lib/
│   ├── commands/           ← CLI command handlers (init)
│   ├── constants.ts        ← Centralized config values
│   ├── core/               ← Detection, validation, conflict resolution, template engine
│   ├── modules/            ← Feature modules (prompts, config, scaffolding)
│   ├── templates/          ← File templates with {{TOKEN}} placeholders
│   ├── types.ts            ← All TypeScript interfaces
│   ├── utils/              ← Logger, file utilities, output helpers
│   └── index.ts            ← Re-exports main entry
├── docs/                   ← Documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Guidelines

1. **Never use raw `console.log`** — always use `logger` from `lib/utils/logger.ts`
2. **All types in `lib/types.ts`** — no local type definitions in feature files
3. **All constants in `lib/constants.ts`** — no hardcoded values scattered around
4. **Templates use `{{TOKEN}}` syntax** — no code logic inside templates
5. **Every file write goes through `checkConflicts`** — never write directly

## Testing

Run the CLI locally against a test project:

```bash
npm run build
cd /path/to/test-react-project
node /path/to/custom-push/bin/cli.js init
```

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Make your changes following the guidelines above
3. Ensure `npm run build` passes with zero errors
4. Submit a pull request with a clear description
