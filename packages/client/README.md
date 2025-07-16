# @supa/client

The client library for Supa - provides UI components and functionality for building Supa-based applications.

## Installation

```bash
npm install @supa/client
```

## Usage

### Basic Setup

```js
import { SupaApp } from '@supa/client';
import '@supa/client/style.css'; // Required: Import the CSS
```

### CSS Import

**Important**: You must import the CSS file for the components to display correctly:

```js
import '@supa/client/style.css';
```

This CSS file includes:
- Tailwind CSS utilities
- Skeleton UI framework styles and themes
- KaTeX for math rendering (fonts and styles)
- All necessary component styles

### Components

```svelte
<script>
  import { SupaApp } from '@supa/client';
  import '@supa/client/style.css';
</script>

<SupaApp />
```

## Development

This package is built using:
- SvelteKit
- Tailwind CSS
- Skeleton UI
- TypeScript

### Building

```bash
npm run build
```

This will:
1. Build the Svelte package to `dist/`
2. Compile and minify CSS to `dist/style.css`

## License

MIT 