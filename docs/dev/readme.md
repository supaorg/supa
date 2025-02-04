# Basics for developers

Facts:
- Supa is a standalone application (MacOS, Windows, Linux; not yet Android or iOS, but will be)
- Written in TypeScript
- Frontend is SvelteKit (Svelte 5)
- Tauri is used to build desktop and mobile apps
- Doesn't have a server (yet), everything is local plus using APIs of services, such as OpenAI
- Skeleton is used as a design system and components
- AIWrapper is used to interact with AI models

Structure:
- packages/client/src is the client code (Svelte + Tauri)
- packages/core/src is the core functionality shared with client; in the future will be used by servers (when we create a server)
- docs is dev and product documentation

@TODO: write about Svelte 5 conventions quickly

@TODO: write about Skeleton conventions quickly

Talk about spaces