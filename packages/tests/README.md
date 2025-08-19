# Sila Tests

Vitest-based test suite for Sila core and desktop file persistence.

## Running

From the repo root:

- Install deps: `npm install`
- Run all tests: `npm test`
- Watch mode (tests pkg only): `npm -w packages/tests run test:watch`

### Running Tests by Category

You can now run tests by category using the following commands:

- **Spaces**: `npm run test:spaces` - Space creation, persistence, and secrets
- **Files**: `npm run test:files` - File storage, CAS, HEIC conversion, and file operations
- **Chat**: `npm run test:chat` - Chat app trees, messaging, and file attachments
- **Previews**: `npm run test:previews` - File preview system and simplified attachments
- **AI**: `npm run test:ai` - AI integration and image processing

### Test Organization

Tests are organized into categories with descriptive prefixes:

- **spaces/** - Space creation, persistence, and secrets management
- **files/** - File storage, CAS, HEIC conversion, and file operations  
- **chat/** - Chat app trees, messaging, and file attachments
- **previews/** - File preview system and simplified attachments
- **ai/** - AI integration and image processing
- **setup/** - Test setup and configuration files

If your environment blocks postinstall scripts, you can install without them and still run tests:

- `npm install --ignore-scripts`
- `npm -w packages/tests run test`

## What's covered

- Space creation and FileSystem persistence (ops written to jsonl, structure files)
- Secrets encryption/decryption roundtrip
- Files CAS: write/read roundtrip and Files AppTree linking
- Chat attachments: saving images to CAS and storing file references in messages

## Local assets for file tests

To keep tests deterministic and offline, file tests read images from:

- `packages/tests/assets/images/`
- Supported formats: `.png`, `.jpg/.jpeg`, `.webp`, and `.b64` (base64 text file)

You can add real images (e.g., downloaded from Wikipedia) to this folder and commit them. Tests will automatically discover any supported files placed here.

Notes:
- `.b64` files should contain base64 of the raw bytes (no data URL prefix). For example, on macOS/Linux: `base64 -w 0 input.png > my-image.b64`
- For `.png/.jpg/.jpeg/.webp`, tests read raw bytes and infer MIME type from the file extension.

## Tips

- Run `npm -w packages/tests run test:watch` during development
- Use category-specific commands to focus on specific areas: `npm run test:spaces`
- If a new asset is very large, prefer a small thumbnail to keep the repo lean