# Project structure 

We have a package.json in the root of our repository that unites our packages in the npm workspace. We run `npm install`, `npm run dev` and `npm build` from the root.

This should be enough to start with the project from scratch:
`npm install && npm run dev`

## Packages
- **packages/core** is the core functionality shared with client.
- **packages/client** is the client code with UI components written in Svelte.
- **packages/desktop** is a SvelteKit + Electron wrapper that is using the client package. We use it for desktop builds.
- **packages/mobile** is a SvelteKit + Capacitor wrapper that is using the client package. We use it for mobile builds.

## How it ties together and builds

Neither the core nor client gets their own dist/build. Rather than building - we import them to our dedicated SvelteKit projects in the desktop and mobile packages. Each of those uses <SupaApp> component from the client with a config that has integrations for Electron and Capacitor to work with their file systems and native dialogs.

## Quick facts about our tech stack

- Supa is a standalone application (MacOS, Windows, Linux; and Android and iOS at some point)
- Written in TypeScript
- Frontend is Svelte 5
- Electron is used for the desktop app
- Doesn't have a server (yet), everything is local plus using APIs of services, such as OpenAI
- Tailwind is used for CSS utility classes
- Skeleton is used as a design system and components
- AIWrapper is used to interact with AI models
- RepTree is used for sync
- TTabs is used for tiling tabs (like in VSCode)