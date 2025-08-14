# @sila/tests

Vitest-based test suite for Sila core and desktop file persistence.

## Running

From the repo root:

- Install deps: `npm install`
- Run tests: `npm test`
- Watch mode (tests pkg only): `npm -w packages/tests run test:watch`

If your environment blocks postinstall scripts, you can install without them and still run tests:

- `npm install --ignore-scripts`
- `npm -w packages/tests run test`

## What’s covered

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
- If a new asset is very large, prefer a small thumbnail to keep the repo lean