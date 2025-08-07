# @sila/client

The client library for Sila - provides UI components and functionality for building Sila-based applications.

## Installation

```bash
npm install @sila/client
```

## Usage

### Basic Setup

```js
import { SilaApp } from '@sila/client';
import '@sila/client/style.css'; // Required: Import the CSS
```

### CSS Import

**Important**: You must import the CSS file for the components to display correctly:

```js
import '@sila/client/style.css';
```

This CSS file includes:
- Tailwind CSS utilities
- Skeleton UI framework styles and themes
- KaTeX for math rendering (fonts and styles)
- All necessary component styles

### Components

```svelte
<script>
  import { SilaApp } from '@sila/client';
  import '@sila/client/style.css';
</script>

<SilaApp />
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