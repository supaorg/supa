This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://github.com/mitkury/airul) out of 4 sources. Feel free to edit .airul.json to change the sources and configure editors. Run `airul gen` to update the context after making changes to .airul.json or the sources. Remember to update TODO-AI.md after major changes in the project, keeping track of completed tasks and new developments.

# From docs/dev/for-ai/rules.md:

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
---

# From docs/dev/for-ai/svelte.md:

New in SvelteKit 5:

# Runes

## Reactivity

Reactivity with `let x = "hello"` at component top-level is replaced with:

```js
let x: string = $state("hello")
```

This makes x reactive in the component, and also in any js functions that operate on it.

Don't use `$state<T>()` to pass the type. Always use `let x: Type =`. Variables declared with `let x = "hello"` are no longer reactive.

## Derived values

Old style:
```js
$: b = a + 1
```

New style:
```js
let b = $derived(a + 1)
```

Or for more complex use cases:
```js
let b = $derived.by(() => {
    // ... more complex logic
    return a + 1;
})
```

`$derived()` takes an expression. `$derived.by()` takes a function.

## Effect

```js
let a = $state(1);
let b = $state(2);
let c;

// This will run when the component is mounted, and for every updates to a and b.
$effect(() => {
    c = a + b;
});
```

Note: 
- Values read asynchronously (promises, setTimeout) inside `$effect` are not tracked.
- Values inside objects are not tracked directly inside `$effect`:

```js
// This will run once, because `state` is never reassigned (only mutated)
$effect(() => {
    state;
});

// This will run whenever `state.value` changes
$effect(() => {
    state.value;
});
```

An effect only depends on the values that it read the last time it ran.

```js
$effect(() => {
    if (a || b) {
        // ...
    }
});
```

If `a` was true, `b` was not read, and the effect won't run when `b` changes.

## Props

Old way to pass props to a component:
```js
export let a = "hello";
export let b;
```

New way:
```js
let {a = "hello", b, ...everythingElse} = $props()
```

`a` and `b` are reactive.

Types:
```js
let {a = "hello", b}: {a: string, b: number} = $props()
```

Note: Do NOT use this syntax for types:
```js
let { x = 42 } = $props<{ x?: string }>();  // ❌ Incorrect
```

# Slots and snippets

Instead of using `<slot />` in a component, you should now do:

```js
let { children } = $props()
// ...
{@render children()}  // This replaces <slot />
```

# Event Handling

In Svelte 5 the events do not use `on:event` syntax, they use `onevent` syntax.

In Svelte 5 `on:click` syntax is not allowed. Event handlers have been given a facelift in Svelte 5. Whereas in Svelte 4 we use the `on:` directive to attach an event listener to an element, in Svelte 5 they are properties like any other (in other words - remove the colon):

```svelte
<button onclick={() => count++}>
  clicks: {count}
</button>
```

`preventDefault` and `once` are removed in Svelte 5. Normal HTML event management is advised:

```svelte
<script>
  function once(fn) {
    return function(event) {
      if (fn) fn.call(this, event);
      fn = null;
    };
  }

  function preventDefault(fn) {
    return function(event) {
      event.preventDefault();
      fn.call(this, event);
    };
  }
</script>

<button onclick={once(preventDefault(handler))}>...</button>
```
---

# From docs/dev/for-ai/skeleton.md:

# Skeleton Documentation for LLMs

> Skeleton provides a uniform design language and structured framework for controlling the look and feel of your product and user experience. It serves as an opinionated design system that aims to greatly reduce the amount of time spent managing design elements and patterns, allowing you to more quickly build and manage your frontend interfaces at scale.


## Documentation Sets

- [React package documentation](https://skeleton.dev/llms-react.txt): documentation with React specific examples.
- [Svelte package documentation](https://skeleton.dev/llms-svelte.txt): documentation with Svelte specific examples.

## Notes
- The content is automatically generated from the official documentation
- Skeleton's core features are framework agnostic, only requiring the use of [Tailwind CSS](https://tailwindcss.com/). This provides full access to all design system features, while enabling you to standardize the design process for your framework of choice.
---

# From README.md:

# Open Alternative to ChatGPT

<p align="center">
  <img src="packages/client/src-tauri/icons/Square310x310Logo.png" style="width: 25%; height: auto;">
</p>

Supa is like ChatGPT but open source. It allows to use the best AI models from different providers, keeps data private, and doesn't require a subscription.

![Supa screenshot](docs/assets/screenshot.png)

> 🚧 Work in progress towards v1.

## Features

**Workspaces**

Organize your conversations and assistants into separate workspaces

**Local first**

You can use Supa without relying on Supa servers

**Tabs like in VSCode**

Create and switch between tabs, and split windows

**Any AI**

From OpenAI and Anthropic to Ollama and any OpenAI-compatible API; bring your own keys

**Many themes**

use different themes for your workspaces; from colorful to boring

**Assistants**

Create your own assistants with their own prompts, prompts, and models

**No subscriptions**
Pay as you go, either for API costs from AI providers or the actual compute if you run models yourself.

## Related projects
Supa is built alongside several companion projects that enable its features:

- **AI inference** - [aiwrapper](https://github.com/mitkury/aiwrapper)
- **Info about AI models** - [aimodels](https://github.com/mitkury/aimodels)
- **Tiling tabs** - [ttabs](https://github.com/mitkury/ttabs)
- **Sync** - [reptree](https://github.com/mitkury/reptree)
- **AI context** - [airul](https://github.com/mitkury/airul)

All projects are maintained by Supa's author.