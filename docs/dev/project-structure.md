# Project structure 

We have a package.json in the root of our repository that unites our packages in the npm workspace. We run `npm install`, `npm run dev` and `npm build` from the root.

This should be enough to get started after cloning the repository:
`npm install && npm run dev`

## Packages
- **packages/core** is the core functionality shared with client.
- **packages/client** is the client code with UI components written in Svelte.
- **packages/desktop** is a Svelte /w Vite + Electron wrapper that is using the client package. We use it for desktop builds.
- **packages/mobile** is a SvelteKit + Capacitor wrapper that is using the client package. We use it for mobile builds.
- **packages/demo** is a tool to create demo workspaces out of a JSON
- **packages/tests** is a test suit for the most important systems of Sila

## How it ties together and builds

Neither the core nor client gets their own dist/build. Rather than building - we import them to our dedicated Vite projects in the desktop and mobile packages. Each of those uses <SilaApp> Svelte component from the client with a config that has integrations for Electron and Capacitor to work with their file systems and native dialogs.

## Quick facts about our tech stack

- Standalone application (desktop + mobile)
- Desktop app runs on Electron  
- Mobile app runs on Capacitor
- Built with TypeScript
- Frontend uses Svelte 5 + SvelteKit
- Everything runs locally (no server yet) plus external APIs
- Styling via Tailwind CSS
- Components from Skeleton design system
- Inference with AI is done through AIWrapper
- Sync handled by RepTree
- Tiling tabs like in VSCode are built with TTabs
- Context for AI agent generated with Airul