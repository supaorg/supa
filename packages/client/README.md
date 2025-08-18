# Sila Client - Svelte

The client library for Sila - provides UI components and functionality for building Sila-based applications.

No separate TypeScript build is required — the TS source is consumed by the app packages (e.g., `@sila/desktop`, `@sila/mobile`) and bundled as part of their builds.

However, the CSS must be built with Tailwind:
- Dev (watch): `npm -w packages/client run dev`
- One‑off build: `npm -w packages/client run build`
Output: `src/lib/compiled-style.css`.

## Usage

Just import `SilaApp` and use at the root component of the final front-end package.

```svelte
<script>
  import { SilaApp } from '@sila/client';
</script>

<SilaApp />
```