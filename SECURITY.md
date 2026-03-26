# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅         |

## Reporting a Vulnerability

If you discover a security vulnerability in `custom-push`, please report it responsibly:

1. **Do not open a public issue**
2. Email: security@your-org.com
3. Include steps to reproduce and potential impact
4. We will respond within 48 hours

## Security Considerations

### credentials.json

`custom-push` handles Firebase service account credentials (`credentials.json`).
This file contains a private key and must **never be committed to version control**.

The CLI automatically:
- Validates the credentials file structure
- Copies it to the project root if provided from an external path
- Adds `credentials.json` to `.gitignore`

### No Network Requests

The CLI itself makes **zero network requests**. It only reads local files,
writes scaffolded files, and interacts with the terminal. All Firebase
communication happens in the generated code at runtime, not during setup.
