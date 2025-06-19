This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://github.com/mitkury/airul) out of 3 sources. Feel free to edit .airul.json to change the sources and configure editors. Run `airul gen` to update the context after making changes to .airul.json or the sources. Remember to update TODO-AI.md after major changes in the project, keeping track of completed tasks and new developments.

# From docs/for-ai/rules.md:

# Basics for developers

Facts:
- t69.chat is a web app
- Written in TypeScript
- Frontend is SvelteKit (Svelte 5)
- Tailwind is used for CSS utility classes
- Skeleton is used as a design system and components
- AIWrapper is used to interact with AI models
- RepTree is used for sync
- TTabs is used for tiling tabs (like in VSCode)

Structure:
- packages/client/src is the client code
- packages/core/src is the core functionality shared with client
- packages/server/src is the server for syncing changes and auth

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

# From docs/for-ai/svelte.md:

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

# From README.md:

# t69 (nice) is a new, open source alternative to t3

made during a cloneathon https://x.com/theo/status/1931515264497254402

![t69 screenshot](https://github.com/mitkury/t69/blob/main/docs/assets/screenshot.png)

try it here https://t69.chat/

or run yourself:
```
clone git@github.com:mitkury/t69.git && cd t69
```

```
npm install && npm run dev
```

## features

**workspaces**

organize your conversations and assistants into separate workspaces

**local first**

you can use t69 without relying on t69 servers

**tabs like in vscode**

create and switch between tabs, and split windows

**any ai**

from OpenAI and Anthropic to Ollama and any OpenAI-compatible API; bring your own keys

**many themes**

use different themes for your workspaces; from colorful to boring

**assistants**

create your own assistants with their own prompts, prompts, and models

## related projects
t69 is largely based on [supa](https://github.com/supaorg/supa) (ui) and powered by [aiwrapper](https://github.com/mitkury/aiwrapper) (ai inference), [aimodels](https://github.com/mitkury/aimodels) (info about ai models) [ttabs](https://github.com/mitkury/ttabs), [reptree](https://github.com/mitkury/reptree) (sync), and [airul](https://github.com/mitkury/airul) (ai context) - all projects maintained by t69's author.