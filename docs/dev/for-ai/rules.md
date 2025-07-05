# Basics for developers

Facts:
- Supa is a standalone application (MacOS, Windows, Linux; not yet Android or iOS, but will be)
- Written in TypeScript
- Frontend is SvelteKit (Svelte 5)
- Tauri is used to build desktop and mobile apps
- Doesn't have a server (yet), everything is local plus using APIs of services, such as OpenAI
- Tailwind is used for CSS utility classes
- Skeleton is used as a design system and components
- AIWrapper is used to interact with AI models
- RepTree is used for sync
- TTabs is used for tiling tabs (like in VSCode)

Structure:
- packages/client/src is the client code
- packages/core/src is the core functionality shared with client

## Updating deps in npm
Sometimes packages get cached with old versions. In that case remove the cache and `npm run dev` again.
`rm -rf packages/client/.svelte-kit packages/client/build packages/client/node_modules packages/core/node_modules packages/client/.vite packages/client/dist`

If you clear cache like that, then `npm install` from the root dor.

## Icons
Use lucide-svelte icons, like this: 
import { Check } from "lucide-svelte";
and <Check size={14} />

# Git commits
Use imperative mood and use a prefix for the type of change.
Examples:
feat(auth): add user login
fix(payment): resolve gateway timeout
ci: update release workflow
docs: update README

## Commit types
Any product-related feature - "feature(name): description"
Any product-related fix - "fix(name): description"
Anything related to building and releasing (including fixes of CI) - "ci: description"
Anything related to testing - "tests: description"
Anything related to documentation - "docs: description"