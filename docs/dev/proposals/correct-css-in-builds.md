# Fixing Missing Tailwind Spacing Utilities in Production Builds

## Context
When running Supa in development (`npm run dev`) all Tailwind utilities work as expected.  
After producing a production build via `npm run build` (desktop package) some utilities – most notably the **spacing helpers** such as `space-y-1`, `space-y-2`, etc. – stop applying any margin.

The compiled CSS *is* present, yet the actual margin declarations disappear somewhere in the production pipeline.

---
## What really happens
1. **Tailwind compilation (client package)**
   * `tailwindcss -i src/app.css -o src/lib/compiled-style.css` correctly generates rules:
     ```css
     .space-y-1 {
       :where(& > :not(:last-child)) {
         --tw-space-y-reverse: 0;
         margin-block-start: calc(0.25rem * var(--tw-space-y-reverse));
         margin-block-end:   calc(0.25rem * (1 - var(--tw-space-y-reverse)));
       }
     }
     ```

2. **Desktop build (SvelteKit + Vite 5)**
   * The CSS above is included in `_app/immutable/assets/2.*.css`.
   * **Lightning CSS** – Vite’s default CSS minifier – re-parses and minifies that file.
   * A bug (present in Lightning CSS ≤ 1.28, fixed later) **drops nested declarations** that sit behind a complex selector like `:where(& > …)` when the input file is large.
   * After minification we’re left with a selector but _no_ `margin-block-*` rules → zero spacing.

3. Dev mode shows no bug because Vite skips minification while the dev server is running.

---
## Solutions / Work-arounds
| # | Approach | Pros | Cons |
|---|----------|------|------|
| 1 | **Disable Lightning CSS minification**<br>`vite.config.js`:<br>`build: { cssMinify: false }` | One-liner, bullet-proof | Slightly larger bundle (≈ +15 kB gz) |
| 2 | **Upgrade tool-chain**<br>Update to Vite ≥ 5.5 **and** Lightning CSS ≥ 1.30 where the bug is fixed. | Keeps minification & smallest bundles | Requires coordinated dependency upgrades |
| 3 | **Switch to esbuild for CSS**<br>`build: { minify: 'esbuild' }` | Simple, keeps minification | esbuild’s CSS optimiser is slower & less aggressive |
| 4 | **Patch Lightning CSS config manually**<br>Provide a custom `minify()` call with `nesting: true`. | Works on current versions | More code, still depends on Lightning CSS internals |

### Recommended short-term fix
Disable CSS minification in the desktop build until we upgrade Vite – it removes the bug with minimal impact.

### Long-term plan
1. Track upstream: once Vite pulls Lightning CSS ≥ 1.30, revert the temporary flag.  
2. Remove `cssMinify: false`, re-enable default minification, and validate that spacing utilities render correctly.

---
## Quick validation checklist
1. `npm run dev` → verify `.space-y-*` adds margin.
2. `npm run build && npm run preview -w packages/desktop` → verify the same element.  
3. If margins are missing → check computed styles in DevTools – selector exists but `margin-block-*` is gone.
4. Apply one of the fixes above, rebuild, confirm the margins are back.

---
_Last updated_: {{DATE}} 