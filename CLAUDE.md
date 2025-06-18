This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://github.com/mitkury/airul) out of 4 sources. Feel free to edit .airul.json to change the sources and configure editors. Run `airul gen` to update the context after making changes to .airul.json or the sources. Remember to update TODO-AI.md after major changes in the project, keeping track of completed tasks and new developments.

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

# From docs/for-ai/skeleton.md:

<system>
This documentation provides a comprehensive reference for the Skeleton v3 UI framework, featuring Svelte examples.
If you are using a different JavaScript framework, please refer to the respective framework-specific documentation for examples.
Always utilize Skeleton UI components, classes, and styles whenever possible.
</system>
# Get Started

# Core API
Learn about the specific features Skeleton introduces to Tailwind.

{

<p class="text-xl">
	The heart of Skeleton is our framework agnostic core package. This adapts and extends Tailwind to introduce our global styles, color
	system, typography, and more. This section details all available Skeleton-provided utility classes and theme properties.
</p>

}

---

## @base

Extends Tailwind's base layer with a set of opinionated global styles.

<figure class="linker bg-noise">
	<a
		class="btn preset-filled"
		href="https://github.com/skeletonlabs/skeleton/blob/main/packages/skeleton/src/base/globals.css"
		target="_blank"
	>
		View Global Styles
	</a>
</figure>

- Sets the root color scheme to match Dark Mode settings.
- Updates scrollbars to utilize theme colors.
- Updates global text selection to utilize theme colors.
- Defines the `<body>` background colors and base font styles.
- Implements global default styles for disabled states, such as buttons.

## @theme

Uses Tailwind's `@theme` to implement a variety of new properties and utility classes.

<figure class="linker bg-noise">
	<a
		class="btn preset-filled"
		href="https://github.com/skeletonlabs/skeleton/blob/main/packages/skeleton/src/base/theme.scss"
		target="_blank"
	>
		View Theme Properties
	</a>
</figure>

### Colors

Extends colors to include the [Skeleton color palette](/docs/design/colors).

| Class                                 | Theme Property                       |
| ------------------------------------- | ------------------------------------ |
| `[property]-[color]-[shade]`          | {`--`}color-[color]-[shade]          |
| `[property]-[color]-contrast-[shade]` | {`--`}color-[color]-contrast-[shade] |
| `body-background-color`               | {`--`}body-background-color          |
| `body-background-color-dark`          | {`--`}body-background-color-dark     |

### Color Pairings

Extends colors to implement [Color Pairing](/docs/design/colors#color-pairings), which balance colors between light and dark mode.

| Class                                | Theme Property                      |
| ------------------------------------ | ----------------------------------- |
| `[property]-[color]-[shade]-[shade]` | {`--`}color-[color]-[shade]-[shade] |

### Spacing

Integrates Tailwind's [spacing property](https://tailwindcss.com/docs/functions-and-directives#spacing-function) to modify [dynamic scaling](/docs/design/spacing) for various utility classes.

| Class     | Theme Property |
| --------- | -------------- |
| (various) | {`--`}spacing  |

### Typography

Introduces a [typographic scale](https://designcode.io/typographic-scales) to all Tailwind [font sizes](https://tailwindcss.com/docs/font-size) using the following formula.

```plaintext
--text-{size}: calc({remSize} * var(--text-scaling));
--text-{size}--line-height: calc(calc(1 / {remSize}) * var(--text-scaling));
```

#### Base

Controls the style of the global page text.

| Class                  | Theme Property             |
| ---------------------- | -------------------------- |
| `base-font-color`      | {`--`}base-font-color      |
| `base-font-color-dark` | {`--`}base-font-color-dark |
| `base-font-family`     | {`--`}base-font-family     |
| `base-font-size`       | {`--`}base-font-size       |
| `base-line-height`     | {`--`}base-line-height     |
| `base-font-weight`     | {`--`}base-font-weight     |
| `base-font-style`      | {`--`}base-font-style      |
| `base-letter-spacing`  | {`--`}base-letter-spacing  |

#### Heading

Controls the style of the heading text.

| Class                     | Theme Property                |
| ------------------------- | ----------------------------- |
| `heading-font-color`      | {`--`}heading-font-color      |
| `heading-font-color-dark` | {`--`}heading-font-color-dark |
| `heading-font-family`     | {`--`}heading-font-family     |
| `heading-font-size`       | {`--`}heading-font-size       |
| `heading-line-height`     | {`--`}heading-line-height     |
| `heading-font-weight`     | {`--`}heading-font-weight     |
| `heading-font-style`      | {`--`}heading-font-style      |
| `heading-letter-spacing`  | {`--`}heading-letter-spacing  |

#### Anchor

Controls the style of anchor links.

| Class                           | Theme Property                      |
| ------------------------------- | ----------------------------------- |
| `anchor-font-color`             | {`--`}anchor-font-color             |
| `anchor-font-color-dark`        | {`--`}anchor-font-color-dark        |
| `anchor-font-family`            | {`--`}anchor-font-family            |
| `anchor-font-size`              | {`--`}anchor-font-size              |
| `anchor-line-height`            | {`--`}anchor-line-height            |
| `anchor-font-weight`            | {`--`}anchor-font-weight            |
| `anchor-font-style`             | {`--`}anchor-font-style             |
| `anchor-letter-spacing`         | {`--`}anchor-letter-spacing         |
| `anchor-text-decoration`        | {`--`}anchor-text-decoration        |
| `anchor-text-decoration-active` | {`--`}anchor-text-decoration-active |
| `anchor-text-decoration-focus`  | {`--`}anchor-text-decoration-focus  |
| `anchor-text-decoration-hover`  | {`--`}anchor-text-decoration-hover  |

### Radius

Extends Tailwind's radius properties with theme-specific sizes.

| Class               | Theme Property         |
| ------------------- | ---------------------- |
| `rounded-base`      | {`--`}radius-base      |
| `rounded-container` | {`--`}radius-container |

### Edges

Sets the default width for border, divide, and ring width to match the active theme properties.

| Class    | Theme Property             |
| -------- | -------------------------- |
| `border` | {`--`}default-border-width |
| `ring`   | {`--`}default-ring-width   |
| `divide` | {`--`}default-divide-width |

## @utility

<figure class="linker bg-noise">
	<a href="https://github.com/skeletonlabs/skeleton/blob/main/packages/skeleton/src/utilities" target="_blank" class="btn preset-filled">
		View Utilites
	</a>
</figure>

### Tailwind Components

Allow you to style semantic HTML elements with utility classes.

<NavGrid collection="docs" path="tailwind/" classes="md:grid-cols-2" />

## @variant

<figure class="linker bg-noise">
	<a href="https://github.com/skeletonlabs/skeleton/blob/main/packages/skeleton/src/variants" target="_blank" class="btn preset-filled">
		View Variants
	</a>
</figure>

### Themes

Enables you to target and style elements for a particular theme.

```html
<div class="bg-green-500 theme-cerberus:bg-red-500">...</div>
<div class="bg-green-500 theme-mona:bg-red-500">...</div>
<div class="bg-green-500 theme-vox:bg-red-500">...</div>
```

## Optional

### Presets

Provides a canned set of styles for use with buttons, badges, cards, and more.

<figure class="linker bg-noise">
	<a href="/docs/design/presets" class="btn preset-filled">
		Browse Presets
	</a>
</figure>

### Preset Themes

Provides a hand curated set of themes for Skeleton.

<figure class="linker bg-noise">
	<a href="/docs/design/themes" class="btn preset-filled">
		Browse Themes
	</a>
</figure>

---

# Fundamentals
An introduction to the core concepts of Skeleton.

{

<p className="text-xl">
	Skeleton is comprised of three pillars - the design system, our extensions to Tailwind, and an optional suite of framework-specific
	components. Together these form a comprehensive solution for designing and implementing complex web interfaces at scale.
</p>

}

---

## Design System

### Figma UI Kit

A fully featured [Figma UI Kit](/figma) is available to designers, allowing them to quickly draft visual concept of your project.

### Iconography

Skeleton is icon agnostic, meaning you may bring your own iconography solution. However, we highly recommend [Lucide](https://lucide.dev/) and utilize it for all examples in our documentation. Refer to our integration guides for [React](/docs/integrations/iconography/react) and [Svelte](/docs/integrations/iconography/svelte).

### Core Features

The following features fall under the umbrella of our design system. Provided via the Skeleton core.

<NavGrid collection="docs" path="design/" classes="md:grid-cols-2" />

---

## Tailwind

Tailwind components that act as primitives for creating complex interfaces. Provided via the Skeleton core.

<NavGrid collection="docs" path="tailwind/" classes="md:grid-cols-2" />

---

## Components

Skeleton also offers optional component packages for select frameworks, each component automatically adapt to Skeleton's design system.

| Framework | NPM Package                     | Description                                      |
| --------- | ------------------------------- | ------------------------------------------------ |
| React     | `@skeletonlabs/skeleton-react`  | Contains all components and features for React.  |
| Svelte    | `@skeletonlabs/skeleton-svelte` | Contains all components and features for Svelte. |

### Powered by Zag.js

Skeleton's components are built on **Zag.js**, which provides a collection of framework-agnostic UI component patterns to manage logic and state. Zag was founded and maintained by industry veterans, such Segun Adebayo - the creator and core maintainer for [Chakra UI](https://www.chakra-ui.com/).

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://zagjs.com/" target="_blank">
		View Zag.js
	</a>
</figure>

### Importing Component

Import the component you wish to use from your framework package of choice, then insert it into your page template.

```ts
```

```ts
<Avatar />
```

### Component Props

Skeleton components properties (aka "props") are loosely defined into the following categories:

- **Functional Props** - directly affect the functionality of the component, such as an `open` or `src`.
- **Style Props** - accept Tailwind utility classes to affect styling, such as `background` for background color.
- **Event Props** - callback functions that trigger upon interaction, such as `onclick`, `onkeypress`, and more.

In the example below, we set functional props for `src` and `alt`, while also including a style prop for `background`.

```ts
<Avatar src={someUrl} alt="Jane" background="bg-red-500" />
```

### Style Props

Skeleton components are styled by default out of the box. However, if you wish to customize the look and feel, then you may do so utilizing Style Props. These fall into a few sub-categories.

- `base` - the default styles for each component template element, implemented by default.
- `{property}` - take individual utility classes to customize styling, such as `background`, `padding`, or `margin`.
- `classes` - allows you to pass any arbitrary utility classes and extend the class list. Note this is plural.

Imagine the Avatar component was created like so:

```ts title="Example Props"
{
	src = './some-placeholder.jpg',
	alt = '',
	// ...
	base = 'flex justify-center items-center overflow-hidden',
	background = 'bg-slate-500',
	rounded = 'rounded-full',
	// ...
	classes = '',
}
```

```svelte title="Example Template"
<figure class="{base} {background} {size} {font} {border} {rounded} {shadow} {classes}">
	<img {src} alt={name} class="{imageBase} {imageClasses}" />
</figure>
```

We can use the `background` style prop to replace the default background color.

```svelte
<Avatar background="bg-blue-500">Sk</Avatar>
```

Since the component doesn't have a dedicated `border` prop, we can extend our class list using `classes`.

```svelte
<Avatar classes="border-4 border-green-500">Sk</Avatar>
```

And we can optionally replace the default `base` styles like so. Just remember our other `{property}` styles will remain.

```svelte
<Avatar base="flex justify-center items-center overflow-visible">Sk</Avatar>
```

Additionally, child elements within the template use these same conventions, but prefixed like `imageBase` and `imageClasses`.

```svelte
<Avatar ... imageClasses="grayscale" />
```

Consult each component's [API reference](/docs/components/accordion/react#api-reference) for a complete list of available properties.

### Learn More

For a comprehensive understanding of how Skeleton implements our components, please refer to our [contribution guidelines](/docs/resources/contribute/components).

---

# Installation
Learn how to install and setup Skeleton for your project.



<NavGrid collection="docs" path="installation/" classes="md:grid-cols-2" />

## Mixing UI Libraries

Skeleton's design system is perfect for complementing headless component libraries, such as [Melt UI](https://www.melt-ui.com/), [Radix](https://www.radix-ui.com/), and [Zag.js](https://zagjs.com/). As well as "Tailwind component" libraries such as the [Tailwind UI](https://tailwindui.com/). Supporting any component system that supports Tailwind, but very specifically allows you to insert or substitute Skeleton-provided utility classes.

### Unsupported Libraries

Unfortunately, Skeleton cannot integrate with [Flowbite React](https://flowbite-react.com/), [Flowbite Svelte](https://flowbite-svelte.com/), or [Daisy UI](https://daisyui.com/) at this time. Similar to Skeleton, these libraries depend on their own dedicated Tailwind plugin that directly overlaps with many of our core features, including class names and color values.

---

# Introduction
Skeleton integrates with Tailwind to provide an opinionated solution for generating adaptive design systems. Including easy to use components for your favorite web frameworks.

<iframe
	class="rounded-container aspect-video w-full overflow-hidden"
	src="https://www.youtube.com/embed/tHzVyChDuyo"
	title="YouTube video player"
	frameborder="0"
	allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
	allowfullscreen
/>

## Our Philosophy

Skeleton provides a uniform design language and structured framework for controlling the look and feel of your product and user experience. It serves as an opinionated design system that aims to greatly reduce the amount of time spent managing design elements and patterns, allowing you to more quickly build and manage your frontend interfaces at scale.

{

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
	<div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
		<h3 className="h3">Framework Agnostic</h3>
		<p className="text-surface-700-300">
			Skeleton's core features are framework agnostic, only requiring the use of{' '}
			<a className="anchor" href="https://tailwindcss.com/" target="_blank" rel="external">
				Tailwind CSS
			</a>
			. This provides full access to all design system features, while enabling you to standardize the design process for your framework of
			choice.
		</p>
	</div>
	<div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
		<h3 className="h3">Native-First</h3>
		<p className="text-surface-700-300">
			We aim to embrace the interface of the web, not replace it. This is why Skeleton defaults to semantic HTML elements and native browser
			APIs. Beyond ease of use, we feel this offers a huge advantages to accessibility.
		</p>
	</div>
	<div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
		<h3 className="h3">Simple Standards</h3>
		<p className="text-surface-700-300">
			We aim to standardize the design process, providing common conventions that are easy to learn and retain, whether you work alone or in
			a team environment. Covering common fixtures such as themes, colors, typography, spacing, and more.
		</p>
	</div>
	<div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
		<h3 className="h3">Utility-First</h3>
		<p className="text-surface-700-300">
			Skeleton embraces the{' '}
			<a className="anchor" href="https://tailwindcss.com/docs/utility-first" target="_blank" rel="external">
				utility-first
			</a>{' '}
			methodology for styling, supporting all features provided by{' '}
			<a className="anchor" href="https://tailwindcss.com/" target="_blank" rel="external">
				Tailwind
			</a>
			, while extending it's capabilities in meaningful ways. Providing full support for the encapsulated components of the modern web.
		</p>
	</div>
	<div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
		<h3 className="h3">Opt-In by Default</h3>
		<p className="text-surface-700-300">
			Most features in Skeleton are modular and opt-in by default. Enabling interface features like buttons and typography via dedicated
			utility classes. This allows for a simple escape hatch when you need to draw outside the lines and generate custom interfaces.
		</p>
	</div>
	<div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
		<h3 className="h3">Adaptive</h3>
		<p className="text-surface-700-300">
			Skeleton is intended to adapt to the design and aesthetic of your project, while still providing reasonable defaults. Providing a
			powerful{' '}
			<a className="anchor" href="https://themes.skeleton.dev/" target="_blank" rel="external">
				theme generator
			</a>{' '}
			for custom themes, while also supplying a curated set of themes for those less design savvy.
		</p>
	</div>
</div>
}

## Additional Benefits

{

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <div className="col-span-2 card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
    	<h3 className="h3">Functional Components</h3>
    	
    	<p className="text-surface-700-300">
    		Skeleton provides an optional suite of functional components built atop the foundation of <a href="https://zagjs.com/" target="_blank" class="anchor">Zag.js</a>. These components automatically adapt to the Skeleton design system out of the box. We currently support React and Svelte, with plans for other frameworks in the future.
    	</p>
    </div>
    <div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
    	<h3 className="h3">Open Source</h3>
    	
    	<p className="text-surface-700-300">
    		Skeleton is provided as <a href="https://github.com/skeletonlabs/skeleton" target="_blank" class="anchor">free and open-source software (FOSS)</a> under the <a href="https://github.com/skeletonlabs/skeleton?tab=MIT-1-ov-file#readme" target="_blank" class="anchor">MIT License</a>.
    	</p>
    </div>
    <div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
    	<h3 className="h3">The Community</h3>
    	
    	<p className="text-surface-700-300">
    		A huge community of users and contributors across <a href="https://github.com/skeletonlabs/skeleton" target="_blank" class="anchor">GitHub</a>, <a href="https://discord.gg/EXqV7W8MtY" target="_blank" class="anchor">Discord</a>, and <a href="https://bsky.app/profile/skeletonlabs.bsky.social" target="_blank" class="anchor">Bluesky</a>.
    	</p>
    </div>
    <div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
    	<h3 className="h3">Frequent Updates</h3>
    	
    	<p className="text-surface-700-300">
    		Skeleton has maintained a frequent release cadence over for years. Just take a look at our <a href="https://github.com/skeletonlabs/skeleton/blob/dev/packages/skeleton/CHANGELOG.md" target="_blank" class="anchor">changelog</a>.
    	</p>
    </div>
    <div className="card preset-outlined-surface-200-800 bg-surface-50-950 p-10 space-y-4">
    	<h3 className="h3">Figma UI Kit</h3>
    	
    	<p className="text-surface-700-300">
    		Skeleton provides access to a fully featured <a href="/figma" class="anchor">Figma UI Kit</a> to assist designers in drafting a visual concept of upcoming projects.
    	</p>
    </div>

</div>
}

---

## Get Started

### Using Skeleton

Ready to get started? Check out our comprehensive [installation guides](/docs/get-started/installation) and begin [learning the fundamentals](/docs/get-started/fundamentals).

### Contributing

Please refer to our dedicated [Contribution Guidelines](/docs/resources/contribute) if you wish to contribute directly.

---

# Migrate from v2
Learn how to migrate from Skeleton v2 to the latest version.

## Introduction

Version 3 represents a major overhaul to Skeleton. This includes a ground up rewrite of quite literally every feature in the library. We have provided a migration CLI to help automate this process. However, some portions of this migration will still required manual intervention. This is not a trivial migration from prior versions, so please use caution when updating and ensure you follow this guide very carefully.

## Prerequisites

While Skeleton v3 introduces support for multiple frameworks, we’ve historically only supported SvelteKit. As such, this guide is only intended for users migrating from Skeleton v2 and SvelteKit. If you you are coming from another meta-framework, this will be outside the scope of this guide. However, this may still provide a valuable insight to the primary objectives for migration.

### Create a Migration Branch

We recommend you handle all migration changes on a dedicated feature branch. This ensures you can easily drop or revert changes if something goes wrong.

```shell
git checkout -b migration
```

### Prepare Your Skeleton App

Please make sure you have accounted for the following:

- Your app is running the latest release of Skeleton v2.x
- All critical dependencies have been updated (optional but recommended)
- Your app is in a functional state before you proceed

---

## Migrate Core Technologies

Skeleton is built on top of the following technologies. These must be migrated individually before proceeding with the Skeleton-specific migration. Note that Svelte and Tailwind provide dedicated CLIs to automate this process.

### Svelte v5

Migrate to the latest release of Svelte v5.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://svelte.dev/docs/svelte/v5-migration-guide" target="_blank">
		Svelte v5 Migration &rarr;
	</a>
</figure>

### SvelteKit v2

Migrate to the latest release of SvelteKit v2.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://svelte.dev/docs/kit/migrating-to-sveltekit-2" target="_blank">
		SvelteKit v2 Migration &rarr;
	</a>
</figure>

### Tailwind v4

Before migration to tailwind V4 using their upgrade guide some manual steps are required:

1. Remove the `skeleton` plugin from your `tailwind.config` file.
2. Rename your `app.postcss` or `app.pcss` to `app.css`.
3. Remove the `purgecss` (`vite-plugin-tailwind-purgecss`) vite plugin from your `vite.config` (if installed).

Migrate to the latest release of Tailwind v4.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://tailwindcss.com/docs/upgrade-guide" target="_blank">
		Tailwind v4 Migration &rarr;
	</a>
</figure>

---

## Migrate to the Tailwind Vite Plugin

Use the following steps to migrate to from PostCSS to the Vite plugin:

1. Delete `postcss.config.mjs`
2. Run `npm uninstall postcss @tailwindcss/postcss`
3. Run `npm install @tailwindcss/vite`
4. Open your `vite.config` in the root of your project
5. Import the following at the top of the file: `import tailwindcss from '@tailwindcss/vite'`
6. Finally, add the Vite plugin ABOVE your specific framework plugin:

```ts
plugins: [
	tailwindcss(),
	sveltekit() // or svelte()
];
```

---

## Automated Migration

We’ve provided a dedicated migration script as part of the Skeleton CLI to help automate much of this process.

> TIP: Please ensure you've committed all pending changes before proceeding.

```console
npx @skeletonlabs/skeleton-cli migrate skeleton-3
```

What WILL be migrated...

- Update all required `package.json` dependencies
- Implement all required Skeleton imports in your global stylesheet `app.css`
- Modify `data-theme` in `app.html` if you’re using a Skeleton preset theme.
- Temporarily disable custom theme imports to allow for theme migration.
- Migrate all modified Skeleton utility classes (ex: `variant-*` to `preset-*`)
- Update all Skeleton imports throughout your entire project
- Renames all relevant Skeleton components
- Some Component imports will also be pruned as they are no longer supported. We’ll cover these features in detail below.

What will NOT be migrated...

- Component props will not be updated. Unfortunately there’s too many permutations.
- Most v2 Utility features will not be migrated (ex: popovers, code blocks, etc)

Make sure to consult your local Git Diff to compare what has been modified before progressing forward or committing these automated changes.

---

## Additional Migration

With automated migration complete, please follow the remaining manual migration steps.

### Migrate Themes

#### For Preset Themes

Your preset theme should be automatically migrated by the CLI, you're all set!

#### For Custom Themes

1. Use the [Import feature](https://themes.skeleton.dev/themes/import) provided by the new Theme Generator.
2. Drag and Drop your v2 theme into the file upload field.
3. Your theme will be automatically converted to the newest format.
4. Update and modify any theme settings in the live preview.
5. Make sure to set a valid theme name in the right-hand panel.
6. Tap the “Code” tab to preview your generated theme code.
7. Copy the theme code, then following our [custom theme instructions](/docs/design/themes#custom-themes).
8. Similar to preset themes, you will need to both register and set an active theme.

### Replace AppShell with Custom Layouts

Skeleton has sunset the ([troublesome](https://github.com/skeletonlabs/skeleton/issues/2383)) `<AppShell>` component in favor of user-defined custom layouts. We've provided a [Layouts](/docs/guides/layouts) guide for replicating common page structures using only semantic HTML and Tailwind - no Skeleton specific features needed!

### Migrating Components

Components have undergone the biggest update in Skeleton v3. Given the sheer number of changes, we recommend you compare each component to it's equivalent v3 documentation. We’ve highlighted a few of the key changes below:

- Changes to adopt the new [Svelte 5 APIs](https://svelte.dev/docs/svelte/v5-migration-guide) like runes, snippets, event handlers, etc.
- Changes to support [Zag.js](https://zagjs.com/), which serves as a foundation of our cross-framework components.
- Changes to the import path: `@skeletonlabs/skeleton-svelte`.
- Changes to the component name and/or structure (including sub-components)
- Changes based on newly introduces features and properties.
- Changes to adopt the new [style prop conventions](/docs/get-started/fundamentals#style-props) and cross-framework standardization.

Here's an example of changes for a single component from v2 to the new equivalent:

```svelte
<!-- Skeleton v2 -->

<script lang="ts">
	import { RangeSlider } from '@skeletonlabs/skeleton';
	let value = 15;
</script>

<RangeSlider name="amount" bind:value ticked />
```

```svelte
<!-- Skeleton v3 -->

<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';
	let value = $state([15]);
</script>

<Slider name="amount" {value} onValueChange={(e) => (value = e.value)} markers={[25, 50, 75]} />
```

We’ve denoted the most notable changes to each component in the table below:

| Name               | v2                                                          | v3                                            | Notes                                                                                                        |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `<AppRail>`        | [Link](https://v2.skeleton.dev/components/app-rail)         | [Link](/docs/components/navigation/svelte)    | Renamed `<Navigation>` - greatly expanded features                                                           |
| `<FileButton>`     | [Link](https://v2.skeleton.dev/components/file-buttons)     | [Link](/docs/components/file-upload/svelte)   | Renamed `<FileUpload>` - merges `<FileDropzone>` features                                                    |
| `<FileDropzone>`   | [Link](https://v2.skeleton.dev/components/file-buttons)     | [Link](/docs/components/file-upload/svelte)   | Renamed `<FileUpload>` - merges `<FileButton>` features                                                      |
| `<InputChip>`      | [Link](https://v2.skeleton.dev/components/input-chips)      | [Link](/docs/components/tags-input/svelte)    | Renamed `<TagsInput>`                                                                                        |
| `<Paginator>`      | [Link](https://v2.skeleton.dev/components/paginators)       | [Link](/docs/components/pagination/svelte)    | Renamed `<Pagination>`                                                                                       |
| `<ProgressBar>`    | [Link](https://v2.skeleton.dev/components/progress-bars)    | [Link](/docs/components/progress/svelte)      | Renamed `<Progress>`                                                                                         |
| `<ProgressRadial>` | [Link](https://v2.skeleton.dev/components/progress-radials) | [Link](/docs/components/progress-ring/svelte) | Renamed `<ProgressRing>`                                                                                     |
| `<RadioGroup>`     | [Link](https://v2.skeleton.dev/components/radio-groups)     | [Link](/docs/components/segment/svelte)       | Renamed `<Segment>` (aka Segmented Control)                                                                  |
| `<RangeSlider>`    | [Link](https://v2.skeleton.dev/components/range-sliders)    | [Link](/docs/components/slider/svelte)        | Renamed `<Slider>`                                                                                           |
| `<SlideToggle>`    | [Link](https://v2.skeleton.dev/components/slide-toggles)    | [Link](/docs/components/switch/svelte)        | Renamed `<Switch>`                                                                                           |
| `<TabGroup>`       | [Link](https://v2.skeleton.dev/components/tabs)             | [Link](/docs/components/tabs/svelte)          | Renamed `<Tabs>`                                                                                             |
| `<TreeView>`       | [Link](https://v2.skeleton.dev/components/tree-views)       | --                                            | Coming soon - [Track progress](https://github.com/skeletonlabs/skeleton/issues/2358#issuecomment-2313215789) |

### Tailwind v4 Changes

Taliwind v4 represents a major update for Tailwind. We've detailed the most notable features as they may relate to your Skeleton project. Please consult the [Tailwind v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4) post for the full roster of changes.

- The `tailwing.config` has been removed in favor of [CSS-base configuration](https://tailwindcss.com/blog/tailwindcss-v4#css-first-configuration) in your global stylesheet.
- Make sure you’re using the newest strategies for supporting [Dark Mode](/docs/guides/mode).
- You are still required to implement the [Tailwind Forms Plugin](/docs/tailwind/forms#prerequisites) to use Skeleton form elements.
- The Skeleton `data-theme` attribute has moved from `<body>` to `<html>`
- Themes colors are now stored in the [oklch format](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), but optionally support any format.

### Replace Unsupported Features

Skeleton v3 represents a point of reflection on what features should remain as part of the core experience. As such, we've identified a number of features that fall outside of this scope. Don't fret though, we've gone out of our way to detail each feature and provide the best alternative available.

#### Svelte Actions

| Name       | v2                                                 | Alternative                               | Notes                          |
| ---------- | -------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| Clipboard  | [Link](https://v2.skeleton.dev/actions/clipboard)  | [Link](/docs/guides/cookbook/clipboard)   | Provided via Cookbook guide    |
| SVG Filter | [Link](https://v2.skeleton.dev/actions/filters)    | [Link](/docs/guides/cookbook/svg-filters) | Provided via Cookbook guide    |
| Focus Trap | [Link](https://v2.skeleton.dev/actions/focus-trap) | [Link](/docs/integrations/popover/svelte) | Provided via Integration guide |

> TIP: We also recommend [Runed](https://runed.dev/docs) for a similar approach to small composable features for Svelte 5.

#### Components

| Name              | v2                                                              | Alternative                                                                    | Notes                                    |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| `<AppShell>`      | [Link](https://v2.skeleton.dev/components/app-shell)            | [Link](/docs/guides/layouts)                                                   | Replaced with custom layouts             |
| `<Autocomplete>`  | [Link](https://v2.skeleton.dev/components/autocomplete)         | [Link](/docs/integrations/popover/svelte#combobox)                             | Provided via Integration guide           |
| `<ConicGradient>` | [Link](https://v2.skeleton.dev/components/conic-gradients)      | [Link](https://tailwindcss.com/docs/background-image#adding-a-radial-gradient) | Now built into Tailwind                  |
| `<Lightswitch>`   | [Link](https://v2.skeleton.dev/docs/dark-mode#custom-component) | [Link](/docs/guides/mode#lightswitch)                                          | Removed in favor of custom components    |
| `<ListBox>`       | [Link](https://v2.skeleton.dev/components/listboxes)            | --                                                                             | Removed                                  |
| `<Stepper>`       | [Link](https://v2.skeleton.dev/components/steppers)             | [Link](/docs/guides/cookbook/stepper)                                          | Provided via Cookbook guide              |
| `<Table>`         | [Link](https://v2.skeleton.dev/components/tables)               | [Link](/docs/tailwind/tables)                                                  | Removed in favor of a Tailwind component |

#### Utilities

| Name              | v2                                                             | Alternative                                       | Notes                          |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| Code Blocks       | [Link](https://v2.skeleton.dev/utilities/codeblocks)           | [Link](/docs/integrations/code-block/svelte)      | Provided via Integration guide |
| Drawers           | [Link](https://v2.skeleton.dev/utilities/drawers)              | [Link](/docs/integrations/popover/svelte#modal)   | Provided via Integration guide |
| Modals            | [Link](https://v2.skeleton.dev/utilities/modals)               | [Link](/docs/integrations/popover/svelte#modal)   | Provided via Integration guide |
| Popovers          | [Link](https://v2.skeleton.dev/utilities/popovers)             | [Link](/docs/integrations/popover/svelte#popover) | Provided via Integration guide |
| Toasts            | [Link](https://v2.skeleton.dev/utilities/toasts)               | [Link](/docs/integrations/toasts/svelte)          | Provided via Integration guide |
| Table of Contents | [Link](https://v2.skeleton.dev/utilities/table-of-contents)    | [Link](/docs/guides/cookbook/table-of-contents)   | Provided via Cookbook guide    |
| Persisted Store   | [Link](https://v2.skeleton.dev/utilities/local-storage-stores) | --                                                | Incompatable with Svelte 5     |

#### Popovers and Modals

Members of the both the Skeleton team and the Svelte community are actively building [Floating UI Svelte](https://floating-ui-svelte.vercel.app/). The long term goal is to use this as a best-in-class solution for: popovers, tooltips, modals, drawers, and more. Until then, we are providing a [select set of components](/docs/integrations/popover/svelte), powered by Zag.js, to help bridge the gap. These components will be supported for the full duration of Skeleton v3.x. However, they will be replaced with a dedicated guide ([similar to React](/docs/integrations/popover/react)) in the future. We ask that you please be patient during this transitory phase.

### Migration Complete

If you’ve completed all steps above in full, your application should once again be in a function state. Run your application's local dev server to confirm, and remember to merge all changes into your primary branch.

```shell
npm run dev
```

---


---

## Installation

# Astro
Install and configure Skeleton for Astro.



## Requirements

| Tooling                              | Supported Versions |
| ------------------------------------ | ------------------ |
| [Astro](https://vite.dev/)           | 5                  |
| [React](https://react.dev/)          | 18                 |
| [Svelte](https://svelte.dev/)        | 5                  |
| [Tailwind](https://tailwindcss.com/) | 4                  |

## Installation

Learn how to install the Skeleton core into your Astro project. We'll cover using components in the section below.

<Process>
    <ProcessStep step="1">
        ### Create a Project
        Start by creating a new Astro project. We recommend selecting all default options.
        ```console
        npm create astro@latest my-skeleton-app
		cd my-skeleton-app
        ```
    </ProcessStep>
    <ProcessStep step="2">
        ### Install Tailwind
        Install Tailwind and and the Tailwind Vite plugin.
        ```console
        npm install tailwindcss @tailwindcss/vite
        ```
		Implement the plugin in `astro.config` in the root of your project.
		```ts title="astro.config" {3} "tailwindcss()"
		// @ts-check
		import { defineConfig } from "astro/config";
		import tailwindcss from "@tailwindcss/vite";

    	export default defineConfig({
    		vite: {
    			plugins: [
    				tailwindcss()
    			],
    		},
    	});
    	```
    </ProcessStep>
    <ProcessStep step="3">
        ### Install Skeleton
        Install the Skeleton core package for the Tailwind plugin.
        ```console
        npm i -D @skeletonlabs/skeleton
        ```
    </ProcessStep>
    <ProcessStep step="4">
        ### Configure Tailwind
      	Create a global styleshseet in `/src/styles/global.css` and add import the following.
         ```css title="global.css"
        @import 'tailwindcss';

        @import '@skeletonlabs/skeleton';
        @import '@skeletonlabs/skeleton/optional/presets';
        @import '@skeletonlabs/skeleton/themes/cerberus';
        ```
    </ProcessStep>
    <ProcessStep step="5">
        ### Remove Default Content and Styles
        We recommend you open `/src/components/welcome.astro` and remove all default HTML and CSS. Here's a simple starter layout.
        ```astro
       ---
    	const framework = 'Astro';
    	import '../styles/global.css'
    	---
    	<main class="p-10 space-y-4">
    		<h1 class="h1">Hello {framework}</h1>
    		<p>This page is working.</p>
    		<button type="button" class="btn preset-filled-primary-500">Example Button</button>
    	</main>
    	```
    </ProcessStep>
    <ProcessStep step="6">
        ### Set Active Theme
        Open `/src/layouts/Layout.astro`, then set the `data-theme` attribute on the HTML tag to define the active theme.
        ```html title="layouts/Layout.astro" "data-theme="cerberus""
        <html data-theme="cerberus">...</html>
        ```
    </ProcessStep>
    <ProcessStep step="check">
        ### Run the Project
        Start the dev server using the following command.
    	```console
    	npm run dev
        ```
    </ProcessStep>

</Process>

## Using Components in Astro

While Astro can support [multiple Frontend frameworks](https://docs.astro.build/en/guides/integrations-guide/), please be aware this comes with some notable restrictions:

- With the exception of this [experimental React flag](https://docs.astro.build/en/guides/integrations-guide/react/#children-parsing), components cannot utilize slotted content in `.astro` files.
- You will need to install additional packages for both Astro and Skeleton per your framework of choice.
- You may need a _wrapper_ component to use to utilize all component feature. We'll demo this below.

<Process>
	<ProcessStep step="1">
        ### Astro Framework Packages
        Install only the Astro framework(s) packages you intend to use.
        ```console
        npx astro add react
        ```
		https://docs.astro.build/en/guides/integrations-guide/react/
        ```console
		npx astro add svelte
        ```
		https://docs.astro.build/en/guides/integrations-guide/svelte/
    </ProcessStep>
	<ProcessStep step="2">
        ### Skeleton Framework Packages
        Install only the Skeleton framework(s) packages you intend to use.
        ```console
       	@skeletonlabs/skeleton-react
        ```
        ```console
		@skeletonlabs/skeleton-svelte
        ```
    </ProcessStep>
	<ProcessStep step="3">
        ### Add Source Path to CSS Config
        Open your global stylesheet in `/src/styles/global.css` and insert each required `@source`. These should come immediately before Skeleton imports.
        ```css
		@source '../../node_modules/@skeletonlabs/skeleton-react/dist';
        ```
        ```css
		@source '../../node_modules/@skeletonlabs/skeleton-svelte/dist';
        ```
		> NOTE: please verify the `@source` path resolves to your `node_modules` directory.
    </ProcessStep>
	<ProcessStep step="4">
        ### Using Wrapper Components
        In most cases, frontend framework components may not be fully functional if used directly within `.astro` files. To overcome this, you may utilize a wrapper component of that framework. Here's a demo using the Skeleton Avatar component as an example.
		#### React
		```tsx title="ReactAvatarWrapper.tsx"
		import React from 'react';
		import { Avatar } from '@skeletonlabs/skeleton-react';

    	export const ReactAvatarWrapper: React.FC = () => {
    		const imgSrc = '...';
    		return <Avatar src={imgSrc} name="skeleton" />;
    	};
    	```
    	```astro title="page.astro"
    	---
    	import { ReactAvatarWrapper } from '@components/ReactAvatarWrapper';
    	---

    	<ReactAvatarWrapper />
    	```
    	#### Svelte
    	```svelte title="SvelteAvatarWrapper.svelte"
    	<script lang="ts">
    	import { Avatar } from '@skeletonlabs/skeleton-svelte';
    	const imgSrc = '...';
    	</script>

    	<Avatar src={imgSrc} name="skeleton" />
    	```
    	```astro title="page.astro"
    	---
    	import { SvelteAvatarWrapper } from '@components/SvelteAvatarWrapper';
    	---

    	<SvelteAvatarWrapper />
    	```
    </ProcessStep>
    <ProcessStep step="check">
        ### Run the Project
        Start the dev server using the following command.
    	```console
    	npm run dev
        ```
    </ProcessStep>

</Process>

---

# Next.js
Install and configure Skeleton for Next.js.



## Requirements

| Tooling                              | Supported Versions |
| ------------------------------------ | ------------------ |
| [Next.js](https://nextjs.org/)       | 15                 |
| [React](https://react.dev/)          | 18                 |
| [Tailwind](https://tailwindcss.com/) | 4                  |

## Installation

<Process>
    <ProcessStep step="1">
        ### Create a Project
        Use the [Next.js CLI](https://nextjs.org/docs/app/getting-started/installation) to scaffold a new project.
		

        {

        <div className="card preset-outlined-warning-500 p-8 space-y-8">
            <p>
                NOTE: The Next.js CLI does not yet install <u>Tailwind v4</u>. Please follow the{' '}
                <a className="anchor" href="https://tailwindcss.com/docs/installation/framework-guides/nextjs" target="_blank" rel="external">
                    official Tailwind guide
                </a> and choose NO when prompted to installed Tailwind by the Next.js CLI.
            </p>
        </div>

        }

    </ProcessStep>
    <ProcessStep step="2">
        ### Install Skeleton
        Install the Skeleton core and Svelte component packages.
        ```console
        npm i -D @skeletonlabs/skeleton @skeletonlabs/skeleton-react
        ```
    </ProcessStep>
    <ProcessStep step="4">
        ### Configure Tailwind
        Open your global stylesheet in `/src/app/globals.css` and add the following imports:
        ```css title="globals.css" {3-7}
        @import 'tailwindcss';

        @import '@skeletonlabs/skeleton';
        @import '@skeletonlabs/skeleton/optional/presets';
        @import '@skeletonlabs/skeleton/themes/cerberus';

        @source '../../node_modules/@skeletonlabs/skeleton-react/dist';
        ```
    	> NOTE: make sure the `@source` path resolves correctly for your application structure.
    </ProcessStep>
    <ProcessStep step="5">
        ### Set Active Theme
        Open `/src/app/layout.tsx`, then set the `data-theme` attribute on the HTML tag to define the active theme.
        ```html title="layout.tsx" "data-theme="cerberus""
        <html data-theme="cerberus">...</html>
        ```
    </ProcessStep>
    <ProcessStep step="check">
        ### Done
        Start the dev server using the following command.
    	```console
        npm run dev
        ```
    </ProcessStep>

</Process>

---

# Other Frameworks
Install Skeleton for other frameworks.



## Requirements

Skeleton's [Core Package](/docs/get-started/core-api) is framework agnostic, meaning many of the Design System and Tailwind-centric features can used on any number of frameworks. This includes everything _except_ components. In order to install Skeleton for additional framework, your app must be able to support the following:

| Tooling                              | Supported Versions    |
| ------------------------------------ | --------------------- |
| Package Management                   | NPM, PNPM, Yarn, etc. |
| [Tailwind](https://tailwindcss.com/) | 4                     |

The exact instructions for installing Skeleton will differ per framework, however we've provided a general guidance below. Use this as a foundation for getting started in any number of unofficially supported frameworks.

## Installation

<Process>
    <ProcessStep step="1">
        ### Create a Project
        Scaffold your web-based application using any framework (such as [Nuxt](https://nuxt.com/), [SolidStart](https://start.solidjs.com/), [Laravel](https://laravel.com/), etc.)
    </ProcessStep>
    <ProcessStep step="2">
        ### Install Tailwind
		Refer to the [official instructions](https://tailwindcss.com/docs/installation/framework-guides) for installing Tailwind on your framework of choice.
    </ProcessStep>
    <ProcessStep step="3">
        ### Install Skeleton
        Install the Skeleton core package to gain access to most features - excluding Components.
        ```console
        npm i -D @skeletonlabs/skeleton
        ```
    </ProcessStep>
    <ProcessStep step="4">
        ### Configure Tailwind
        Locate your global stylesheet and append the following at the top of the file.
        ```css {3-5}
        @import 'tailwindcss';

        @import '@skeletonlabs/skeleton';
        @import '@skeletonlabs/skeleton/optional/presets';
        @import '@skeletonlabs/skeleton/themes/cerberus';
        ```
    </ProcessStep>
    <ProcessStep step="6">
        ### Set Active Theme
        Open the file containing the `<html>` tag for your project and set the `data-theme` attribute as follows.
        ```html "data-theme="cerberus""
        <html data-theme="cerberus">
            ...
        </html>
        ```
    </ProcessStep>
    <ProcessStep step="check">
        ### Run the Project
        Start the dev server for your framework of choice.
    </ProcessStep>

</Process>

## Support

While we officially limit support for Skeleton to React, Svelte, and Astro for now, Skeleton has an active community of users on [GitHub](https://github.com/skeletonlabs/skeleton/discussions) and [Discord](https://discord.gg/EXqV7W8MtY). If you need support (directly related to Skeleton) considering reaching out in these spaces. Other members of the community may be able to assist you.

# Guides

# Cookbook
A collection of recipes for crafting interface features that utilize Skeleton primitives.



## What's This?

Learn how [recipes](https://bigmedium.com/ideas/the-art-of-design-system-recipes.html) can help you augment and expand the Skeleton design system.

## Browse

<TableCookbook />

---

# Layouts
Learn best practices for creating responsive layouts using semantic HTML and Tailwind.

<p class="text-xl">
	Skeleton supports a variety of web-based frameworks and meta-frameworks, and this guide serves as a universal reference when implementing
	page layouts. These techniques utilize native HTML and Tailwind, meaning Skeleton is supported but not required. The only prerequisite is
	Tailwind itself.
</p>

## Real World Example

See our real world three column example, which implements many of the concepts introduced below.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://play.tailwindcss.com/zP9RcoacIS" target="_blank">
		View Real World Example
	</a>
</figure>

## Semantic Markup

When creating custom layouts, it's recommended to use semantic HTML to denote each region of the page.

| Element     | Description                                                                                                                                                                                                                                                                                                                                                                       | Source                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `<header>`  | Represents introductory content, typically a group of introductory or navigational aids. It may contain some heading elements but also a logo, a search form, an author name, and other elements.                                                                                                                                                                                 | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header)  |
| `<main>`    | Represents the dominant content within the document `<body>`. The main content area consists of content that is directly related to or expands upon the central topic of a document, or the central functionality of an application.                                                                                                                                              | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main)    |
| `<footer>`  | Represents a footer for its nearest ancestor sectioning content or sectioning root element. Typically contains information about the author of the section, copyright data or links to related documents.                                                                                                                                                                         | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer)  |
| `<aside>`   | Represents a portion of a document whose content is only indirectly related to the document's main content. Asides are frequently presented as sidebars or call-out boxes.                                                                                                                                                                                                        | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside)   |
| `<article>` | Represents a self-contained composition in a document, page, application, or site, which is intended to be independently distributable or reusable (e.g., in syndication). Examples include: a forum post, a magazine or newspaper article, or a blog entry, a product card, a user-submitted comment, an interactive widget or gadget, or any other independent item of content. | [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article) |

## Using Body Scroll

Prioritize the `<body>` element as the scrollable page element over child elements. Otherwise you risk the following pitfalls:

1. Mobile browser's "pull to refresh" feature will not work as expected.
2. The Mobile Safari's browser interface will not auto-hide when scrolling vertically.
3. CSS print styles may not work as expected.
4. Accessibility may be adversely affected, especially on touch screen devices.
5. May introduce inconsistent behavior between your app framework's layout solution.

## Tailwind Utilities

Tailwind provides several utility classes that may be helpful when generating custom layouts.

### Grid

Learn more about [CSS grid](https://css-tricks.com/snippets/css/complete-guide-grid/).

| Utility                                                        | Description                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Columns](https://tailwindcss.com/docs/grid-template-columns)  | Utilities for specifying the columns in a grid layout.                           |
| [Column Start/End](https://tailwindcss.com/docs/grid-column)   | Utilities for controlling how elements are sized and placed across grid columns. |
| [Rows](https://tailwindcss.com/docs/grid-template-rows)        | Utilities for specifying the rows in a grid layout.                              |
| [Row Start/End](https://tailwindcss.com/docs/grid-row)         | Utilities for controlling how elements are sized and placed across grid rows.    |
| [Auto Flow](https://tailwindcss.com/docs/grid-auto-flow)       | Utilities for controlling how elements in a grid are auto-placed.                |
| [Auto Columns](https://tailwindcss.com/docs/grid-auto-columns) | Utilities for controlling the size of implicitly-created grid columns.           |
| [Auto Rows](https://tailwindcss.com/docs/grid-auto-rows)       | Utilities for controlling the size of implicitly-created grid rows.              |
| [Gap](https://tailwindcss.com/docs/gap)                        | Utilities for controlling gutters between grid and flexbox items.                |

### Alignment

The following options are available for both [Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) and [Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) styles.

| Utility                                                         | Description                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Justify Content](https://tailwindcss.com/docs/justify-content) | Utilities for controlling how flex and grid items are positioned along a container's main axis.               |
| [Justify Items](https://tailwindcss.com/docs/justify-items)     | Utilities for controlling how grid items are aligned along their inline axis.                                 |
| [Justify Self](https://tailwindcss.com/docs/justify-self)       | Utilities for controlling how an individual grid item is aligned along its inline axis.                       |
| [Align Content](https://tailwindcss.com/docs/align-content)     | Utilities for controlling how rows are positioned in multi-row flex and grid containers.                      |
| [Align Items](https://tailwindcss.com/docs/align-items)         | Utilities for controlling how flex and grid items are positioned along a container's cross axis.              |
| [Align Self](https://tailwindcss.com/docs/align-self)           | Utilities for controlling how an individual flex or grid item is positioned along its container's cross axis. |
| [Place Content](https://tailwindcss.com/docs/place-content)     | Utilities for controlling how content is justified and aligned at the same time.                              |
| [Place Items](https://tailwindcss.com/docs/place-items)         | Utilities for controlling how items are justified and aligned at the same time.                               |
| [Place Self](https://tailwindcss.com/docs/place-self)           | Utilities for controlling how an individual item is justified and aligned at the same time.                   |

### Responsive Design

We recommend you utilize Tailwind's built-in [responsive breakpoints](https://tailwindcss.com/docs/responsive-design) for handling responsive design.

```html
<!-- Use a single column on small screens; show multiple columns at the medium breakpoint or wider -->
<div class="grid grid-cols-1 md:grid-cols-[auto_1fr]">
	<!-- Hide the sidebar on small screens; show at the medium breakpoint or wider -->
	<aside class="hidden md:block">(sidebar)</aside>
	<!-- Remains visible at all breakpoints -->
	<main>(main)</main>
</div>
```

By default, your `<html>` and `<body>` may collapse vertically and not extend to full height of the viewport. Consider a reset:

```css
html,
body {
	@apply h-full;
}
```

## The Basics

Let's start by creating traditional layouts using a combination of semantic HTML and Tailwind utility classes.

### One Column

<ExampleColOne />

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://play.tailwindcss.com/3ayrvPnIC4" target="_blank">
		Preview and Source
	</a>
</figure>

### Two Column

<ExampleColTwo />

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://play.tailwindcss.com/yCv0ZOICSx" target="_blank">
		Preview and Source
	</a>
</figure>

### Three Column

<ExampleColThree />

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://play.tailwindcss.com/BH0iosKxix" target="_blank">
		Preview and Source
	</a>
</figure>

## Sticky Positioning

If you wish for your header or sidebar to remain fixed while scrolling, try the following techniques.

### Sticky Header

For `<header>`, we'll implement a few specific utility classes:

- [sticky](https://tailwindcss.com/docs/position#sticky-positioning-elements) - Sets the CSS display to a value of sticky.
- [top-0](https://tailwindcss.com/docs/top-right-bottom-left) - Sets the top offset to a value of 0px.
- [z-10](https://tailwindcss.com/docs/z-index) - Sets the z-index stacking to a value of 10.

> TIP: Use [backdrop-blur](https://tailwindcss.com/docs/backdrop-blur) to produce the hazy glass-like effect for overlapped semi-transparent elements.

<ExampleStickyHeader />

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://play.tailwindcss.com/g7ory5pA4K" target="_blank">
		Preview and Source
	</a>
</figure>

### Sticky Sidebar

For `<aside>`, we introduce two addition utility classes:

- [col-span-1](https://tailwindcss.com/docs/grid-column) - we must define our columns explicitly to ensure all styles are display as expected.
- [h-screen](https://tailwindcss.com/docs/height#viewport-height) - ensures our sidebar matches the viewport height. See Calculate Offsets below for more complex layouts.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://play.tailwindcss.com/aSzgim96nc" target="_blank">
		Preview and Source
	</a>
</figure>

## Advanced Techniques

### Calculate Offsets

You may use the [calc](https://developer.mozilla.org/en-US/docs/Web/CSS/calc) property to calculate numeric amounts, which can be handy when you have multiple sticky elements.

```html
<aside class="... sticky top-0 h-[calc(100vh-100px)]">(sidebar)</aside>
```

1. Sets the `height` value using an arbitrary syntax
2. The initial value is set to 100vh (100% of the viewport height)
3. Finally we subtract the offset for our header (ex: 100px)

### Smart Grid Rows

Combine the grid arbitrary syntax with [minmax](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax) to dynamically set a min and max range for your columns or rows. This is useful when creating a three column layout that need to adhere to a max container width.

```html
<div class="container mx-auto grid grid-cols-[200px_minmax(0px,_1fr)_300px]">
	<aside>(sidebar)</aside>
	<main>(main)</main>
	<aside>(sidebar)</aside>
</div>
```

### Grid Template

If you wish to go beyond Tailwind, native CSS also offers [grid-template](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template). This provides a declarative shorthand for defining grid columns, rows, and areas. Take care to match your [media query breakpoints](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries) configured by Tailwind by default, or extended within your application's [Tailwind configuration](https://tailwindcss.com/docs/responsive-design).

---

# Figma UI kit
Welcome to the Skeleton Figma Design System Tutorials!

{

<p class="text-2xl">
	Explore step-by-step guides to unlock the full potential of Skeleton in your design workflow. Whether you're setting up for the first time
	or mastering advanced features, these tutorials will guide you every step of the way.
</p>
}

## Get Access

Review the benefits of the Figma UI Kit for Skeleton.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="/figma#get-access" target="_blank">
		Get the Figma UI Kit &rarr;
	</a>
</figure>

## Guides

Follow along with our step-by-step guides.

<NavGrid collection="docs" path="figma/" classes="md:grid-cols-1" />

---

# Dark Mode
Learn how to use Tailwind's dark mode feature for your Skeleton project.

{

<p class="text-xl">
	Skeleton makes use of{' '}
	<a className="anchor" href="https://tailwindcss.com/docs/dark-mode" target="_blank" rel="external">
		Tailwind's Dark Mode
	</a>{' '}
	to enable multiple strategies to control the overall app or page mode, as well as{' '}
	<a className="anchor" href="https://tailwindcss.com/docs/color-scheme" target="_blank" rel="external">
		Color Scheme
	</a>{' '}
	to selectively toggle light or dark interfaces at any scope.
</p>

}

## Dark Mode

Tailwind [multiple strategies](https://tailwindcss.com/docs/dark-mode) for configuring Dark Mode.

### Media Strategy

Enable by default. Uses CSS's [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) and sets the active mode based on operating system settings.

### Selector Strategy

Activates dark mode by adding or removing the `.dark` class to your application's `<html>` element.

```css title="app.css"
@custom-variant dark (&:where(.dark, .dark *));
```

```html title="app.html"
<html class="dark">
	...
</html>
```

### Data Attribute Strategy

Uses a data attribute instead of a class to activate dark mode.

```css title="app.css"
@custom-variant dark (&:where([data-mode=dark], [data-mode=dark] *));
```

```html title="app.html"
<html data-mode="dark">
	...
</html>
```

### Using the Dark Variant

Apply a base style, then with Tailwind's `dark:` variant.

```html title="app.html"
<!-- Light Mode: White | Dark Mode: Black -->
<div class="bg-white dark:bg-black">...</div>
```

---

## Color Scheme

Skeleton now supports Tailwind's [Color Scheme](https://tailwindcss.com/docs/color-scheme) feature, which enables toggling light or dark interfaces at any scope. By default, the scheme matches the current Dark Mode setting. This feature is enabled by [Color Pairings](/docs/design/colors#color-pairings), which implement the native CSS property [light-dark](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark).

```html
<div class="bg-primary-50-950">Light or Dark</div>

<div class="scheme-light">
	<div class="bg-primary-50-950">Always Light Scheme</div>
</div>

<div class="scheme-dark">
	<div class="bg-primary-50-950">Always Dark Scheme</div>
</div>
```

---

## Light Switch

Legacy versions of Skeleton offer a unique Light Switch component for controlling the Dark Mode `selector` strategy. Unfortunately this is no longer available due to the number of permutations required per framework and required feature capabilities, including:

- Supporting one or more combinations of Dark Mode strategies.
- Supporting the unique APIs of each meta-framework.
- Handling state and persistence; ex: local vs remote vs account-based storage

We now recommend you generate your own component following [Tailwind's best practices](https://tailwindcss.com/docs/dark-mode). To help you get started, we've provided a Cookbook recipe covering the basics.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="/docs/guides/cookbook/light-switch">
		Light Switch Recipe &rarr;
	</a>
</figure>

---

## Cookbook

# Alerts
General purpose notifications to attract attention and provide critical actions.

```html
<div class="w-full card preset-outlined-surface-950-50 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[1fr_auto]">
	<div>
		<p class="font-bold">Hey, heads up!</p>
		<p class="text-xs opacity-60">Something of moderate importance has occurred.</p>
	</div>
	<div class="flex gap-1">
		<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
	</div>
</div>

```

## Styling

For even more customization, try mixing and matching various [Presets](/docs/design/presets) classes.

```html
---
---

<div class="w-full space-y-8">
	
	<div class="card preset-outlined-success-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[1fr_auto]">
		<div>
			<p class="font-bold">Success</p>
			<p class="text-xs opacity-60">The task has been completed successfully.</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
		</div>
	</div>
	
	<div class="card preset-outlined-warning-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[auto_1fr_auto]">
		<TriangleAlert />
		<div>
			<p class="font-bold">Warning</p>
			<p class="text-xs opacity-60">Beware of this important notice.</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
		</div>
	</div>
	
	<div class="card preset-outlined-error-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[auto_1fr_auto]">
		<TriangleAlert />
		<div>
			<p class="font-bold">Error</p>
			<p class="text-xs opacity-60">Something has gone wrong.</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled">Dismiss</button>
		</div>
	</div>
</div>

```

---

# Breadcrumbs
Displays the current navigation hierarchy.

```html
<ol class="flex items-center gap-4">
	<li><a class="opacity-60 hover:underline" href="#">Blog</a></li>
	<li class="opacity-50" aria-hidden>&rsaquo;</li>
	<li><a class="opacity-60 hover:underline" href="#">Category</a></li>
	<li class="opacity-50" aria-hidden>&rsaquo;</li>
	<li>Article</li>
</ol>

```

## Icons

Feel free to mix in icons for the anchor labels or separators.

```html
---
---

<ol class="flex items-center gap-4">
	<li>
		<a class="opacity-60 hover:opacity-100" href="#">
			<House size={24} />
		</a>
	</li>
	<li class="opacity-50" aria-hidden>
		<ChevronRight size={14} />
	</li>
	<li>
		<a class="opacity-60 hover:opacity-100" href="#">
			<Cog size={24} />
		</a>
	</li>
	<li class="opacity-50" aria-hidden>
		<ChevronRight size={14} />
	</li>
	<li>Current</li>
</ol>

```

---

# Chat
Create a custom chat feed or AI prompt interface.

<Preview client:visible>
	<Fragment slot="preview">
		<Example client:visible />
	</Fragment>
	<Fragment slot="codeReact">
		<Code code={`Coming soon...`} lang="tsx" />
	</Fragment>
	<Fragment slot="codeSvelte">
		<Code code={ExampleRaw} lang="svelte" />
	</Fragment>
</Preview>

## Layout Columns

Use Tailwind's [grid column](https://tailwindcss.com/docs/grid-template-columns) utility classes to define horizontal columns for your layout.

```html
<!--
https://tailwindcss.com/docs/grid-template-columns#arbitrary-values
- auto: size to content widths
- 1fr: fill available space evenly
- {amount}: set fixed size (ex: 320px)
-->
<div class="w-full grid grid-cols-[auto_1fr_auto] gap-1">
	<div class="bg-surface-100-900 p-4">(nav)</div>
	<div class="bg-surface-100-900 p-4">(feed)</div>
	<div class="bg-surface-100-900 p-4">(online)</div>
</div>

```

## Layout Rows

Use Tailwind's [grid row](https://tailwindcss.com/docs/grid-template-rows) utility classes to define vertical layout rows for your layout.

```html
<!--
https://tailwindcss.com/docs/grid-template-rows#arbitrary-values
- auto: size to content widths
- 1fr: fill available space evenly
- {amount}: set fixed size (ex: 320px)
-->
<div class="w-full grid grid-cols-2 gap-10">
	<!-- Three Row Layout -->
	<div class="h-full grid grid-rows-[auto_1fr_auto] gap-1">
		<div class="bg-surface-100-900 p-4">(search)</div>
		<div class="bg-surface-100-900 p-4">(list)</div>
		<div class="bg-surface-100-900 p-4">(footer)</div>
	</div>
	<!-- Two Row Layout -->
	<div class="h-full grid grid-rows-[1fr_auto] gap-1">
		<!-- We've set a max height here to trigger the vertical overflow. -->
		<!-- Removed max-h and space-y in your project. -->
		<div class="bg-surface-100-900 p-4 overflow-y-auto max-h-[128px] space-y-4">
			<p>(feed)</p>
			<p>
				Lorem, ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit dolor ullam, qui et itaque quam distinctio dicta nostrum
				veritatis harum iure hic sequi aperiam, explicabo earum totam deserunt. Fugiat, temporibus.
			</p>
		</div>
		<div class="bg-surface-100-900 p-4">(prompt)</div>
	</div>
</div>

```

## Message Feed

The feed simply loops through the available feed data. Each `<pre>` tag represents a single _bubble_ element.

```html
---
let messageFeed = [
	{
		id: 0,
		host: true,
		avatar: 48,
		name: 'Jane',
		timestamp: 'Yesterday @ 2:30pm',
		message: 'Some message text.',
		color: 'variant-soft-primary'
	},
	{
		id: 1,
		host: false,
		avatar: 14,
		name: 'Michael',
		timestamp: 'Yesterday @ 2:45pm',
		message: 'Some message text.',
		color: 'variant-soft-primary'
	}
];
---

<section class="w-full max-h-[400px] overflow-y-auto space-y-4">
	<!-- Loop through the messageFeed array -->
	{
		messageFeed.map((bubble) => {
			// Determine if host/guest role
			const role = bubble.host === true ? 'host' : 'guest';
			// Render the bubble template
			return <pre class="pre">{JSON.stringify({ role, ...bubble }, null, 2)}</pre>;
		})
	}
</section>

```

## Message Bubbles

Provide styling to each bubble element.

```html
---

let messageFeed = [
	{
		id: 0,
		host: true,
		avatar: 48,
		name: 'Jane',
		timestamp: 'Yesterday @ 2:30pm',
		message: 'Some message text.',
		color: 'preset-tonal-primary'
	},
	{
		id: 1,
		host: false,
		avatar: 14,
		name: 'Michael',
		timestamp: 'Yesterday @ 2:45pm',
		message: 'Some message text.',
		color: 'preset-tonal-primary'
	}
];
---

<section class="w-full max-h-[400px] overflow-y-auto space-y-4">
	<!-- Loop through the messageFeed array -->
	{
		messageFeed.map((bubble) => {
			return (
				<>
					
					{bubble.host ? (
						// Host Bubble
						<div class="grid grid-cols-[auto_1fr] gap-2">
							<Avatar src={`https://i.pravatar.cc/?img=${bubble.avatar}`} name={bubble.name} size="size-12" />
							<div class="card p-4 preset-tonal rounded-tl-none space-y-2">
								<header class="flex justify-between items-center">
									<p class="font-bold">{bubble.name}</p>
									<small class="opacity-50">{bubble.timestamp}</small>
								</header>
								<p>{bubble.message}</p>
							</div>
						</div>
					) : (
						// Guest Bubble
						<div class="grid grid-cols-[1fr_auto] gap-2">
							<div class={`card p-4 rounded-tr-none space-y-2 ${bubble.color}`}>
								<header class="flex justify-between items-center">
									<p class="font-bold">{bubble.name}</p>
									<small class="opacity-50">{bubble.timestamp}</small>
								</header>
								<p>{bubble.message}</p>
							</div>
							<Avatar src={`https://i.pravatar.cc/?img=${bubble.avatar}`} name={bubble.name} size="size-12" />
						</div>
					)}
				</>
			);
		})
	}
</section>

```

## Prompt

Use Skeleton's [input group](/docs/tailwind/forms#groups) styles to create a custom text prompt.

---

## Scroll to Bottom

Bind your scrollable feed panel element reference ([Svelte](https://svelte.dev/docs/svelte/bind) | [React](https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom)), then use [scrollTo](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo) to scroll the panel to the bottom on demand. Scroll behavior can be set via `behavior: 'smooth'`.

```ts
function scrollChatBottom(behavior?: 'auto' | 'instant' | 'smooth' = 'smooth') {
	// `elemChat` represents our scrollable panel element
	elemChat.scrollTo({ top: elemChat.scrollHeight, behavior });
}
```

## Add a Message

Below we'll cover how to append the message feed with a new message from the host user. Per our above examples, we'll use the same `messageFeed` data structure.

```ts
let messageFeed = [
	/* ...*/
];
```

Then bind to the textarea for your prompt in order to capture any message typed by the user.

<Preview selected="codeReact" client:visible>
	<Fragment slot="codeReact">```tsx let elemPrompt: HTMLElement = useRef(); ```</Fragment>
	<Fragment slot="codeSvelte">```ts let elemPrompt: HTMLElement; ```</Fragment>
</Preview>

<Preview selected="codeReact" client:visible>
	<Fragment slot="codeReact">
		```tsx
		<textarea ref={elemPrompt} ... />
		```
	</Fragment>
	<Fragment slot="codeSvelte">
		```svelte
		<textarea bind:value={elemPrompt} ... />
		```
	</Fragment>
</Preview>

Here's an example of how we might append a new message to the `messageFeed` array.

```ts
function addMessage(): void {
	const newMessage = {
		id: messageFeed.length,
		host: true,
		avatar: 48,
		name: 'Jane',
		timestamp: new date(),
		message: elemPrompt.value,
		color: 'preset-tonal-primary'
	};
	// Append the new message to the message feed
	messageFeed = [...messageFeed, newMessage];
	// Clear the textarea message
	elemPrompt.value = '';
	// Smoothly scroll to the bottom of the feed
	setTimeout(() => {
		scrollChatBottom('smooth');
	}, 0);
}
```

This can be triggered when the prompt's SEND button is clicked.

```svelte
<button ... onclick={addMessage}>Send</button>
```

---

# Clipboard API
Learn how to integrate the native browser clipboard API.

## How It Works

Refer to the [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) documentation for details.

## Programmatic

```html
<button class="btn preset-filled" data-button>Copy to Clipboard</button>

<script>
	// Define your source data
	const sourceData = 'Hello world';

	// Select your trigger element
	const elemButton: HTMLButtonElement | null = document.querySelector('[data-button]');

	// Add a click event handler to the trigger
	elemButton?.addEventListener('click', () => {
		// Call the Clipboard API
		navigator.clipboard
			// Use the `writeText` method write content to the clipboard
			.writeText(sourceData)
			// Handle confirmation
			.then(() => console.log('Source data copied to clipboard!'));
	});
</script>

```

## Using Inputs

```html
<div class="flex items-center gap-4">
	<input type="text" class="input" value="Hello Skeleton" data-source />
	<button class="btn preset-filled" data-trigger>Copy</button>
</div>

<script>
	// Create element references
	const elemButton: HTMLButtonElement | null = document.querySelector('[data-trigger]');
	const elemInput: HTMLInputElement | null = document.querySelector('[data-source]');

	// Add a click event handler to the trigger
	elemButton?.addEventListener('click', () => {
		// Call the Clipboard API
		navigator.clipboard
			// Use the `writeText` method write content to the clipboard
			.writeText(elemInput?.value || '')
			// Handle confirmation
			.then(() => console.log('Input value copied to clipboard!'));
	});
</script>

```

---

# Dialog Element
Implement a simple popup dialog using the native HTML element.

```html
<!-- Dialog -->
<dialog
	data-dialog
	class="rounded-container bg-surface-100-900 text-inherit max-w-[640px] top-1/2 left-1/2 -translate-1/2 p-4 space-y-4 z-10 backdrop:bg-surface-50/75 dark:backdrop:bg-surface-950/75"
>
	<h2 class="h3">Hello world!</h2>
	<p>This is an example popover created using the native Dialog element.</p>
	<form method="dialog" class="flex justify-end">
		<button type="button" class="btn preset-tonal" data-dialog-close>Close</button>
	</form>
</dialog>
<!-- Interface -->
<div class="flex justify-center items-center">
	<!-- Trigger -->
	<button class="btn preset-filled" data-dialog-show>Open Modal</button>
</div>

<script>
	// DOM Element References
	const elemModal: HTMLDialogElement | null = document.querySelector('[data-dialog]');
	const elemTrigger: HTMLButtonElement | null = document.querySelector('[data-dialog-show]');
	const elemClose: HTMLButtonElement | null = document.querySelector('[data-dialog-close]');

	// Button Click Handlers
	elemTrigger?.addEventListener('click', () => elemModal?.showModal());
	elemClose?.addEventListener('click', () => elemModal?.close());
</script>

<style>
	/* NOTE: add the following styles to your global stylesheet. */
	dialog,
	dialog::backdrop {
		--anim-duration: 250ms;
		transition:
			display var(--anim-duration) allow-discrete,
			overlay var(--anim-duration) allow-discrete,
			opacity var(--anim-duration);
		opacity: 0;
	}
	/* Animate In */
	dialog[open],
	dialog[open]::backdrop {
		opacity: 1;
	}
	/* Animate Out */
	@starting-style {
		dialog[open],
		dialog[open]::backdrop {
			opacity: 0;
		}
	}
</style>

```

## How It Works

This is enabled by the native [Dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) element, which includes a dedicated Javascript API for toggling the display.

## Animations

Animating `display: none` with CSS alone has limited browser support. However, per the video below, we can use progressive enchancement our dialog to ensure animations degrade gracefully for unsupported browsers.

<iframe
	class="w-full aspect-video"
	src="https://www.youtube.com/embed/vmDEHAzj2XE?si=GTYFY9dk013lL0Y3"
	title="YouTube video player"
	frameborder="0"
	allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
	referrerpolicy="strict-origin-when-cross-origin"
	allowfullscreen
></iframe>

## Alternatives

If you need finer grain control, consider Skeleton's integration guides for [Floating UI](https://floating-ui.com/).

- [React Popovers](/docs/integrations/popover/react) - powered by Floating UI React.
- [Svelte Popovers](/docs/integrations/popover/svelte) - powered by Floating UI Svelte.

---

# Dynamic Theme Loading
Load skeleton themes on demand.

## About Themes

The most common way to load skeleton themes is by importing them in your root stylesheet.

<Preview selected="codeReact" client:visible>
	<Fragment slot="codeReact">
		```css title="app/globals.css"
		@import 'tailwindcss';

    	@import '@skeletonlabs/skeleton';
    	@import '@skeletonlabs/skeleton/themes/cerberus';
    	@import '@skeletonlabs/skeleton/themes/catppuccin';
    	```
    </Fragment>
    <Fragment slot="codeSvelte">
    	```css title="src/app.css"
    	@import 'tailwindcss';

    	@import '@skeletonlabs/skeleton';
    	@import '@skeletonlabs/skeleton/themes/cerberus';
    	@import '@skeletonlabs/skeleton/themes/catppuccin';
    	```
    </Fragment>

</Preview>

This will bundle your themes when you build your application, for that reason you should only import the themes you need because they will increase your CSS bundle size.

While this is sufficient for most applications this might not be flexible enough for your needs, you may want themes to be
user specific, editable, organization specific and so on, since skeleton themes are just CSS variables there are many ways
you can load themes on demand, read further to see how.

## Creating Stylesheets on layout load

This approach assumes the CSS variables of the skeleton theme you want is available during the load function (eg: on your database or in memory).

In this example we will add a default theme that that can be used as a fallback.

<Preview selected="codeReact" client:visible>
	<Fragment slot="codeReact">
		```css title="app/globals.css"
		@import 'tailwindcss';

    	@import '@skeletonlabs/skeleton';
    	@import './default.css';
    	```
    </Fragment>
    <Fragment slot="codeSvelte">
    	```css title="src/app.css"
    	@import 'tailwindcss';

    	@import '@skeletonlabs/skeleton';
    	@import './default.css';
    	```
    </Fragment>

</Preview>

<Preview selected="codeReact" client:visible>
    <Fragment slot="codeReact">
    	```css title="app/default.css"
    	[data-theme='default'] {
    		/* ... */
    	}
    	```
    </Fragment>
    <Fragment slot="codeSvelte">
    	```css title="src/default.css"
    	[data-theme='default'] {
    		/* ... */
    	}
    	```
 </Fragment>

</Preview>

<Preview selected="codeReact" client:visible>
    <Fragment slot="codeReact">
		To load your themes we will utilize the [NextJS `getServerSideProps` function](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props) function in combination with [Head component](https://nextjs.org/docs/pages/api-reference/components/head):

    	```tsx title="app/layout.tsx"
    	import Head from 'next/head';
    	import type { InferGetServerSidePropsType, GetServerSideProps } from 'next';

    	const getThemes = async () => {
    		return [
    			{
    				name: 'theme-1',
    				css: `[data-theme='theme-1'] { /* ... */ }`
    			},
    			{
    				name: 'theme-2',
    				css: `[data-theme='theme-2'] { /* ... */ }`
    			}
    		];
    	};

    	export const getServerSideProps = (async () => {
    		const themes = getThemes();
    		return {
    			props: {
    				themes: ['default', ...themes.map((t) => t.name)],
    				css: themes.map((theme) => theme.css).join('\n\n')
    			}
    		};
    	}) satisfies GetServerSideProps<{ repo: Repo }>;

    	export default function Page({ repo }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    		return (
    			<>
    				<Head>
    					<style dangerouslySetInnerHTML={{ __html: css }} />
    				</Head>
    				<main>
    					<p>{repo.stargazers_count}</p>
    				</main>
    			</>
    		);
    	}
    	```
    </Fragment>
    <Fragment slot="codeSvelte">
    	To load your themes we will utilize the [SvelteKit `load` function](https://svelte.dev/docs/kit/load) function in combination with [`<svelte:head>`](https://svelte.dev/docs/svelte/svelte-head):

    	```ts title="src/route/+layout.server.ts"
    	import type { PageLoad } from './$types';

    	const getThemes = async () => {
    		return [
    			{
    				name: 'theme-1',
    				css: `[data-theme='theme-1'] { /* ... */ }`
    			},
    			{
    				name: 'theme-2',
    				css: `[data-theme='theme-2'] { /* ... */ }`
    			}
    		];
    	};

    	export const load: PageLoad = async (event) => {
    		const themes = getThemes();
    		return {
    			themes: ['default', ...themes.map((t) => t.name)],
    			css: themes.map((theme) => theme.css).join('\n\n')
    		};
    	};
    	```

    	<br />

    	```svelte title="src/routes/+layout.svelte"
    	<script>
    		const { data } = $props();
    	</script>

    	<svelte:head>
    		{@html `<style>${data.css}</style>`}
    	</svelte:head>
    	```

     </Fragment>

</Preview>

> ⚠️ _Important_ make sure you sanitize the CSS before inserting it or you'll be vulernable to CSS injection.

After doing so you should be able to toggle themes on demand by changing the `data-theme` attribute on the `html` tag.

Note that there are multiple ways to go about this problem, another way could be to generate CSS files with
the same content as the one in this example and then load only the css files you want, while this
is more complex than storing and retrieving themes as JSON on a database this approach could benefit
from the browser caching mechanism.

---

# Image Layouts
Layouts for displaying sets of images.

## Grid

```html
<section class="grid grid-cols-2 gap-6 md:grid-cols-3">
	<!-- Row -->
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=1" />
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=2" />
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=3" />
	<!-- Row -->
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=4" />
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=5" />
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=6" />
	<!-- Row -->
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=7" />
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=8" />
	<img class="w-48 h-48 bg-surface-500 rounded-container" src="https://picsum.photos/192/192?random=9" />
</section>

```

## Quad

```html
<section class="grid grid-cols-2 gap-4">
	<!-- Row -->
	<img class="h-64 w-64 bg-surface-500 rounded-container" src="https://picsum.photos/256/256?random=1" />
	<img class="h-64 w-64 bg-surface-500 rounded-container" src="https://picsum.photos/256/256?random=2" />
	<!-- Row -->
	<img class="h-64 w-64 bg-surface-500 rounded-container" src="https://picsum.photos/256/256?random=3" />
	<img class="h-64 w-64 bg-surface-500 rounded-container" src="https://picsum.photos/256/256?random=4" />
</section>

```

## Masonry

```html
<section class="grid grid-cols-2 gap-4 md:grid-cols-4">
	<!-- Column -->
	<div class="grid gap-4">
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/320?random=1" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/120?random=2" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/280?random=3" />
	</div>
	<!-- Column -->
	<div class="grid gap-4">
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/300?random=4" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/280?random=5" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/140?random=6" />
	</div>
	<!-- Column -->
	<div class="grid gap-4">
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/280?random=7" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/320?random=8" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/140?random=9" />
	</div>
	<!-- Column -->
	<div class="grid gap-4">
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/320?random=10" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/140?random=11" />
		<img class="bg-surface-500 rounded-container" src="https://picsum.photos/220/280?random=12" />
	</div>
</section>

```

## Featured

```html
<section class="grid gap-4">
	<!-- Featured -->
	<header>
		<img class="h-auto max-w-full bg-surface-500 rounded-container" src="https://picsum.photos/960/512?random=1" />
	</header>
	<!-- Row -->
	<div class="grid grid-cols-5 gap-4">
		<img class="h-full w-full bg-surface-500 rounded-container" src="https://picsum.photos/200/200?random=2" />
		<img class="h-full w-full bg-surface-500 rounded-container" src="https://picsum.photos/200/200?random=3" />
		<img class="h-full w-full bg-surface-500 rounded-container" src="https://picsum.photos/200/200?random=4" />
		<img class="h-full w-full bg-surface-500 rounded-container" src="https://picsum.photos/200/200?random=5" />
		<img class="h-full w-full bg-surface-500 rounded-container" src="https://picsum.photos/200/200?random=6" />
	</div>
</section>

```

## Attribution

Images courtesy of [Lorem Picsum](https://picsum.photos/). Markup and styles inspired by [Flowbite](https://flowbite.com/docs/components/gallery/#masonry-grid).

---

# Light Switch
Learn how to create a Light Switch toggle.

Use [Dark Mode](/docs/guides/mode) to make use of either a base or `dark:` variant for your utility class styles. By default, Tailwind uses the `prefers-color-scheme` media query to determine and match the user's operating system settings. However, if you wish to provide your users manual control, you'll need to adjust the Dark Mode strategy for Tailwind, as well as provide the toggle interface (aka a light switch). This guide will show you how to fulfill both requirements.


<Process>
	<ProcessStep step="1">
        ## Adjust the Dark Mode Strategy
        Open your global stylesheet and set the following variant:
        ```css
       	@custom-variant dark (&:where([data-mode="dark"], [data-mode="dark"] *));
        ```
		Then set the following data attribute on your application's `<html>` element for light mode:
		```html
		<html data-mode="light"></html>
		```
		Or for dark mode:
		```html
		<html data-mode="dark"></html>
		```
    </ProcessStep>
	<ProcessStep step="2">
        ## Create the Component
        We'll create a implement a version of the Switch component that can toggle the mode on demand.
	   ```html
'use client';

	const [checked, setChecked] = useState(false);

	useEffect(() => {
		const mode = localStorage.getItem('mode') || 'light';
		setChecked(mode === 'dark');
	}, []);

	const onCheckedChange = (event: { checked: boolean }) => {
		const mode = event.checked ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem('mode', mode);
		setChecked(event.checked);
	};

	return (
		<>
			<script
				dangerouslySetInnerHTML={{
					__html: `
		const mode = localStorage.getItem('mode') || 'light';
		document.documentElement.setAttribute('data-mode', mode);
          `
				}}
			/>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</>
	);
}

```
    </ProcessStep>
    <ProcessStep step="3">
    	## Import the Component
    	We'll then add the component to our app. Make sure to set the correct path and file extension.
    	```ts
    	import Lightswitch from './path/to/Lightswitch.{tsx|svelte}';
    	```
    	```svelte
    	<Lightswitch />
    	```
    </ProcessStep>
</Process>

## User Interface

While we utilize a primitive Switch for the minimal example above, feel free to adjust the logic and interface to your preference. We provide a more detailed Switch example for [React](/docs/components/switch/react#light-switch) and [Svelte](/docs/components/switch/svelte#light-switch) respectively.

## Next.js Users

For Next.js users, you will need to [suppressHydrationWarning](https://nextjs.org/docs/messages/react-hydration-error#solution-3-using-suppresshydrationwarning) to `true` on the root `<html>` element. This will suppress hydration warnings.

---

# Logo Clouds
Provides a grid for presenting a set of logos, brands, or sponsors.

```html
<nav class="rounded-container grid w-full grid-cols-1 gap-1 overflow-hidden md:grid-cols-3">
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Twitch</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">YouTube</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">TicTok</a>
</nav>

```

## Rows

```html
<nav class="rounded-container grid w-full grid-cols-2 gap-1 overflow-hidden md:grid-cols-4">
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Optimize</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Brand</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Mesh</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Matrix</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Utilize</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Syndicate</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Incubate</a>
	<a class="card preset-filled-surface-100-900 rounded-none p-4 py-8 text-center" href="#">Orchestrate</a>
</nav>

```

---

# Scroll Containers
Create scrolling containers using the scroll snap features from Tailwind.

## Scroll Snap

Implements Tailwind's [Scroll Snap Alignment](https://tailwindcss.com/docs/scroll-snap-align) utility classes.

```html
<div class="w-full">
	<!-- Scroll Container -->
	<div class="snap-x scroll-px-4 snap-mandatory scroll-smooth flex gap-4 overflow-x-auto px-4 py-10">
		<!-- Generate a array of 8 items; loop through each item -->
		{
			Array.from({ length: 8 }).map((_, i) => (
				// Each scrollable card element
				<div class="snap-start shrink-0 card preset-filled py-20 w-40 md:w-80 text-center">
					<span>{i + 1}</span>
				</div>
			))
		}
	</div>
</div>

```

## Carousels

Using Scroll Containers, we can create a fully functional carousel, complete with thumbnail selection.

```html
---

const generatedArray = Array.from({ length: 6 });
---

<div class="w-full">
	<!-- Carousel -->
	<div class="card p-4 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
		<!-- Button: Left -->
		<button type="button" class="btn-icon preset-filled" data-carousel-left>
			<ArrowLeft size={16} />
		</button>
		<!-- Full Images -->
		<div data-carousel class="snap-x snap-mandatory scroll-smooth flex overflow-x-auto">
			<!-- Loop X many times. -->
			{
				generatedArray.map((_, i: number) => (
					<img
						class="snap-center w-[1024px] rounded-container"
						src={`https://picsum.photos/seed/${i + 1}/1024/768`}
						alt={`full-${i}`}
						loading="lazy"
					/>
				))
			}
		</div>
		<!-- Button: Right -->
		<button type="button" class="btn-icon preset-filled" data-carousel-right>
			<ArrowRight size={16} />
		</button>
	</div>
	<!-- Thumbnails -->
	<div class="card p-4 grid grid-cols-6 gap-4">
		<!-- Loop X many times. -->
		{
			generatedArray.map((_, i: number) => (
				<button type="button" data-thumbnail>
					<img
						class="rounded-container hover:brightness-125"
						src={`https://picsum.photos/seed/${i + 1}/256`}
						alt={`thumb-${i}`}
						loading="lazy"
					/>
				</button>
			))
		}
	</div>
</div>

<script>
	// Query Element References
	const elemCarousel: HTMLDivElement | null = document.querySelector('[data-carousel]');
	const elemCarouselLeft: HTMLButtonElement | null = document.querySelector('[data-carousel-left]');
	const elemCarouselRight: HTMLButtonElement | null = document.querySelector('[data-carousel-right]');
	const elemThumbnails: NodeListOf<HTMLElement> = document.querySelectorAll('[data-thumbnail]');

	// Set Left/Right arrow click handlers
	elemCarouselLeft?.addEventListener('click', () => carouselLeft());
	elemCarouselRight?.addEventListener('click', () => carouselRight());

	// Set thumbnail click handler
	if (elemThumbnails.length > 0) {
		elemThumbnails.forEach((elemButton: HTMLElement, index: number) => {
			elemButton?.addEventListener('click', () => carouselThumbnail(index));
		});
	}

	/** On navigation left, scroll the container */
	function carouselLeft() {
		if (!elemCarousel) return;
		const x =
			elemCarousel.scrollLeft === 0
				? elemCarousel.clientWidth * elemCarousel.childElementCount // loop
				: elemCarousel.scrollLeft - elemCarousel.clientWidth; // step left
		elemCarousel.scroll(x, 0);
	}

	/** On navigation right, scroll the container */
	function carouselRight() {
		if (!elemCarousel) return;
		const x =
			elemCarousel.scrollLeft === elemCarousel.scrollWidth - elemCarousel.clientWidth
				? 0 // loop
				: elemCarousel.scrollLeft + elemCarousel.clientWidth; // step right
		elemCarousel.scroll(x, 0);
	}

	/** On thumbnail click, scroll large image into view */
	function carouselThumbnail(index: number) {
		if (elemCarousel) elemCarousel.scroll(elemCarousel.clientWidth * index, 0);
	}
</script>

```

## Multi-Column

Using Scroll Containers, we can scroll sets of items.

```html
---

interface Movie {
	name: string;
	imageUrl: string;
	url: string;
}

// Data and images via: https://www.themoviedb.org/
	{
		name: 'The Flash',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
		url: 'https://www.themoviedb.org/movie/298618-the-flash'
	},
	{
		name: 'Guardians of the Galaxy Vol. 3',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
		url: 'https://www.themoviedb.org/movie/447365-guardians-of-the-galaxy-vol-3'
	},
	{
		name: 'Black Panther: Wakanda Forever',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/sv1xJUazXeYqALzczSZ3O6nkH75.jpg',
		url: 'https://www.themoviedb.org/movie/505642-black-panther-wakanda-forever'
	},
	{
		name: 'Avengers: Infinity War',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
		url: 'https://www.themoviedb.org/movie/299536-avengers-infinity-war'
	},
	{
		name: 'Spider-Man: No Way Home',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
		url: 'https://www.themoviedb.org/movie/634649-spider-man-no-way-home'
	},
	{
		name: 'The Batman',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/74xTEgt7R36Fpooo50r9T25onhq.jpg',
		url: 'https://www.themoviedb.org/movie/414906-the-batman'
	},
	{
		name: 'Iron Man',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/78lPtwv72eTNqFW9COBYI0dWDJa.jpg',
		url: 'https://www.themoviedb.org/movie/1726-iron-man'
	},
	{
		name: 'Venom: Let There Be Carnage',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/rjkmN1dniUHVYAtwuV3Tji7FsDO.jpg',
		url: 'https://www.themoviedb.org/movie/580489-venom-let-there-be-carnage'
	},
	{
		name: 'Deadpool',
		imageUrl: 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/3E53WEZJqP6aM84D8CckXx4pIHw.jpg',
		url: 'https://www.themoviedb.org/movie/293660-deadpool'
	}
];
---

<div class="w-ful">
	<div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
		<!-- Button: Left -->
		<button type="button" class="btn-icon preset-filled" data-multi-column-left>
			<ArrowLeft size={16} />
		</button>
		<!-- Carousel -->
		<div data-multi-column class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto">
			<!-- Loop through our array of movies. -->
			{
				movies.map((movie) => (
					<a href={movie.url} target="_blank" class="shrink-0 w-[28%] snap-start">
						<img
							class="rounded-container-token hover:brightness-125"
							src={movie.imageUrl}
							alt={movie.name}
							title={movie.name}
							loading="lazy"
						/>
					</a>
				))
			}
		</div>
		<!-- Button-Right -->
		<button type="button" class="btn-icon preset-filled" data-multi-column-right>
			<ArrowRight size={16} />
		</button>
	</div>
</div>

<script>
	// Query Element References
	const elemMovies: HTMLDivElement | null = document.querySelector('[data-multi-column]')!;
	const elemBtnLeft: HTMLButtonElement | null = document.querySelector('[data-multi-column-left]');
	const elemBtnRight: HTMLButtonElement | null = document.querySelector('[data-multi-column-right]');

	// Add Button click handlers
	elemBtnLeft?.addEventListener('click', () => multiColumnLeft());
	elemBtnRight?.addEventListener('click', () => multiColumnRight());

	/** Handles the left scroll event. */
	function multiColumnLeft() {
		if (!elemMovies) return;
		let x = elemMovies.scrollWidth;
		if (elemMovies.scrollLeft !== 0) x = elemMovies.scrollLeft - elemMovies.clientWidth;
		elemMovies.scroll(x, 0);
	}

	/** Handles the right scroll event. */
	function multiColumnRight() {
		if (!elemMovies) return;
		let x = 0;
		// -1 is used because different browsers use different methods to round scrollWidth pixels.
		if (elemMovies.scrollLeft < elemMovies.scrollWidth - elemMovies.clientWidth - 1) x = elemMovies.scrollLeft + elemMovies.clientWidth;
		elemMovies.scroll(x, 0);
	}
</script>

```

> Images courtesy of [The Movie Database](https://www.themoviedb.org/)

## API Reference

Learn more about Tailwind's utility classes for scroll behavior and scroll snap.

| Feature                                                             | Description                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [scroll-behavior](https://tailwindcss.com/docs/scroll-behavior)     | Controls the scroll behavior of an element.                         |
| [scroll-margin](https://tailwindcss.com/docs/scroll-margin)         | Controls the scroll offset around items in a snap container.        |
| [scroll-padding](https://tailwindcss.com/docs/scroll-padding)       | Controls an element's scroll offset within a snap container.        |
| [scroll-snap-align](https://tailwindcss.com/docs/scroll-snap-align) | Controls the scroll snap alignment of an element.                   |
| [scroll-snap-stop](https://tailwindcss.com/docs/scroll-snap-stop)   | Controls whether you can skip past possible snap positions.         |
| [scroll-snap-type](https://tailwindcss.com/docs/scroll-snap-type)   | Controls how strictly snap points are enforced in a snap container. |

---

# Stepper
Divide and present content in sequenced steps.

<Preview client:visible>
	<Fragment slot="preview">
		<Example client:visible />
	</Fragment>
	<Fragment slot="codeReact">
		<Code code={`Coming soon...`} lang="tsx" />
	</Fragment>
	<Fragment slot="codeSvelte">
		<Code code={ExampleRaw} lang="svelte" />
	</Fragment>
</Preview>

## Using Components

Optionally, you can substitute primitive data for components and props.

<Preview client:visible>
	<Fragment slot="preview">
		<ExampleComponent client:visible />
	</Fragment>
	<Fragment slot="codeReact">
		<Code code={`Coming soon...`} lang="tsx" />
	</Fragment>
	<Fragment slot="codeSvelte">
		<div class="space-y-4">
			<Code code={ExampleComponentRaw} lang="svelte" />
			<Code code={ExampleStepOne} lang="svelte" title="ExampleStepOne.svelte" />
		</div>
	</Fragment>
</Preview>

---

# SVG Filters
Apply filter effects to elements and images.

## How It Works

This feature is enabled by [SVG filters](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter) paired with [feColorMatrix](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix) transformations.

## Usage

Apply a filter to any element using the Filter style property and passing the unique SVG Filter ID.

```astro
<!-- The Target Element -->
<img ... style="filter: url(#Apollo)" />

<!-- Via aribtrary Tailwind syntax -->
<Avatar classes="[filter:url(#Apollo)]" />

<!-- The SVG Filter with a matching unique ID -->
<svg><filter id="Apollo">...</filter></svg>
```

We've provided a curated collection of SVG Filters to choose from below.

```html
<!-- Apollo: `filter: url(#Apollo)` -->
<svg id="svg-filter-apollo" class="absolute -left-full w-0 h-0">
	<filter id="Apollo" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
		<feColorMatrix values="0.8 0.6 -0.4 0.1 0,
			0 1.2 0.05 0 0,
			0 -1 3 0.02 0,
			0 0 0 50 0" result="final" in="SourceGraphic"></feColorMatrix>
	</filter>
</svg>

```

## Create a Filter

We recommend [SVG Color Matrix Mixer](https://fecolormatrix.com/) by [Rik Schennink](https://x.com/rikschennink/) to create your own filters.

## Tips

- The SVG must be in the same scope as the elements you wish to filter. Global scope is acceptable.
- Consder storing your SVGs within your local project for quick and reusable imports.
- All Vite-based frameworks support [SVG imports](https://vite.dev/guide/assets.html#importing-asset-as-url).
- Optionally you can embed the SVG within a imported component (ex: `Apollo.svelte`, `Apollo.tsx`).
- Filter SVGs are affected by the flow DOM, including class styles such as `space-{x|y}`.

---

# Table of Contents
Navigate the hierarchy of headings for the current page.

```html
---
interface PageHeadings {
	/** The text value within the heading tag; stripped of HTML. */
	text: string;
	/** A generated slug value based on the text. */
	slug: string;
	/** Depth indicates headings H1-H6. */
	depth: number;
}

/** The generated list of page headings, slugs, and depth. */
const headings: PageHeadings[] = [
	{ text: 'Real World Example', slug: 'real-world-example', depth: 1 },
	{ text: 'Semantic Markup', slug: 'semantic-markup', depth: 1 },
	{ text: 'Utilities', slug: 'utilities', depth: 1 },
	{ text: 'Grid', slug: 'grid', depth: 2 },
	{ text: 'Alignment', slug: 'alignment', depth: 2 },
	{ text: 'Responsive Design', slug: 'responsive-design', depth: 2 },
	{ text: 'In Conclusion', slug: 'in-conclusion', depth: 1 }
];

/** Provide a padding-left class based on the depth. */
function setIndentationClass(depth: number) {
	// prettier-ignore
	switch(depth) {
		case(6): return 'pl-12';
		case(5): return 'pl-10';
		case(4): return 'pl-8';
		case(3): return 'pl-6';
		case(2): return 'pl-4';
		case(1): return 'pl-2';
		default: return 'pl-0';
	}
}
---

<nav class="card bg-surface-100-900 p-4">
	<!-- Table of Contents -->
	<div class="text-sm space-y-2">
		<!-- Label -->
		<div class="font-bold">On This Page</div>
		<!-- Links -->
		<ul class="space-y-2">
			<!-- Consider a fixed scroll position at the top of your page layouts. -->
			<li><a href={`#_top`} class="anchor block">Overview</a></li>
			<!-- Loop through the available headings. -->
			{
				headings.map((heading: PageHeadings) => (
					<li>
						
						<a href={`#${heading.slug}`} class="anchor block" class:list={setIndentationClass(heading.depth)}>
							{heading.text}
						</a>
					</li>
				))
			}
		</ul>
	</div>
</nav>

```

## Deep Linking

Browsers allow you to deep link to any element via the ID. This is accomplished with an anchor tag and hashed (`#`) href value. When interacting with these anchors, the viewport will automatically attempt to scroll the `<body>` element and bring the element into view.

```html
<h2 class="#some-example-slug">
	Some Example Heading
	<h2></h2>
</h2>
```

```html
<a href="#real-world-example" class="anchor">Some Example Heading</a>
```

> TIP: If you abstract scrolling away from the `<body>` element, this will not work.

## Scroll Behavior

You may optionally choose to implement a smooth [scroll behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior) using CSS.

```html
<body class="smooth-scroll"></body>
```

```css
body {
	scroll-behavior: smooth;
}
```

## Generate a Slug

The following provides a barebones implementation for generating a slug based on a heading text value.

```ts
function generateSlug(text: string, prefix?: string = '', suffix?: string = '') {
	// Format the slug from the text value.
	const slug = text
		.toLowerCase()
		.replaceAll(/[^a-zA-Z0-9 ]/g, '')
		.replaceAll(' ', '-')
		.toLowerCase();
	// Note that you can optionally apply a prefix/suffix.
	return `${prefix}${slug}${suffix}`;
}

// Usage
generateSlug('An Example Header'); // result: an-example-header
generateSlug('An Example Header', 'skeleton-'); // result: skeleton-an-example-header
generateSlug('An Example Header', '', '-skeleton'); // result: an-example-header-skeleton
```

## Guides

Specific instructions for generating headings will differ based on your meta-framework and your application architecture. Below are a few suggestions, but this is neither a definitive or exhaustive list of all available options.

- [Astro](https://kld.dev/building-table-of-contents/) - enables you to automatically generate headings using built-in MDX features.
- [Svelte](https://www.melt-ui.com/docs/builders/table-of-contents) - Melt UI provides a headless component solution for Svelte.
- [Next.js](https://nextra.site/docs/docs-theme/theme-configuration#toc-sidebar) - Nextra provides a headless component solution for Next.js + MDX.
- [Rehype Plugin](https://github.com/stefanprobst/rehype-extract-toc) - a general purpose Rehype plugin for generating a table of contents.

---

# Design

# Colors
The Skeleton color system.

## Color Palette

<ExampleColors />

Supports <u>all</u> standard Tailwind color utility classes using the following pattern.

```
{property}-{color}-{shade}
```

| Key      | Accepted Values                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| Property | `accent`, `bg`, `border`, `caret`, `decoration`, `divide`, `fill`, `outline`, `ring`, `shadow`, `stroke`, `text` |
| Color    | `primary`, `secondary`, `tertiary`, `success`, `warning`, `error`, `surface`                                     |
| Shade    | `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950`                                       |

```html
<div class="bg-primary-500">...</div>
<div class="border border-secondary-600">...</div>
<svg class="fill-surface-950">...</svg>
```

---

## Contrast Colors

Contrast color values are available for every shade. Use these to set accessible text color and icon fill values.

```
{property}-{color}-contrast-{shade}
```

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	<!-- Standard Colors -->
	<div class="bg-primary-500 text-primary-contrast-500">
		<p class="text-center p-4">Standard Colors</p>
	</div>
	<!-- Color Pairings -->
	<div class="bg-secondary-200-800 text-secondary-contrast-200-800">
		<p class="text-center p-4">Color Pairings</p>
	</div>
</div>

```

See the [Preset system](/docs/design/presets) for additional utility classes that automatically mix each color and contrast tone.

---

## Color Pairings

Provides a condensed syntax of dual-tone color values balanced to swap between light and dark mode. These are supported for all the same properties standard colors support (`bg`, `border`, `fill`, etc).

```
{property}-{color}-{lightModeShade}-{darkModeShade}
```

For example:

- `bg-surface-200-800`
- `text-primary-400-600`
- `border-secondary-50-950`

### How Pairings Work

Color Pairing are enabled through the use of the CSS [light-dark](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) function. For example, the `text-primary-300-700` pairing will be implemnted in your CSS bundle as follows:

```css
.text-primary-300-700 {
	color: light-dark(var(--color-primary-300), var(--color-primary-700));
}
```

This roughly equivalent to the following, just more compact, and enabling support for Tailwind's [Color Scheme](https://tailwindcss.com/docs/color-scheme) utilities.

```html
<div class="text-primary-300 dark:text-primary-700">...</div>
```

By default, Skeleton sets the overall app's color scheme to match light or dark mode.

### Pairing Previews

The following is a static representation of each pairing. Only `primary` is shown, but all Skeleton colors are supported.

<ExamplePairings />

The following shows actual Color Pairings. Toggle this website between light and dark mode to see how these react.

<ExamplePairingsDynamic />

### When to use Pairings

Color Parings are useful for generating a hierarchy of visual layers, ranging from foreground to background elements. Each reuse the same color ramp but, but inverts the order when toggling from light to dark mode.

<Preview client:visible>
	<Fragment slot="preview">
		<ExamplePairingsStack />
	</Fragment>
	<Fragment slot="code">
		```html
		<div class="bg-primary-950-50">Foreground</div>
		<div class="bg-primary-900-100">...</div>
		<div class="bg-primary-800-200">...</div>
		<div class="bg-primary-700-300">...</div>
		<div class="bg-primary-600-400">...</div>
		<div class="bg-primary-500">Branding</div>
		<div class="bg-primary-400-600">...</div>
		<div class="bg-primary-300-700">...</div>
		<div class="bg-primary-200-800">...</div>
		<div class="bg-primary-100-900">...</div>
		<div class="bg-primary-50-950">Background</div>
		```
	</Fragment>
</Preview>

- We can use shade `950` for light mode and `50` from dark mode to represent our body text color.
- Then use shade `50` from light mode and `950` from dark mode to represent our app background.
- Use the static `500` shade for key branding elements, such as buttons or banners.
- Then reserve multiple layers between for elements such as cards, inputs, and more.

---

## Transparency

Both Skeleton Colors and Color Pairings support Tailwind's color transparency syntax.

```html
<div class="bg-primary-500/25">Primary Color @ 25% transparency</div>
<div class="bg-surface-50-950/60">Surface Pairing 50/950 @ 60% transparency</div>
```

---

# Presets
Canned styles for your interface elements.

{

<p className="text-xl">
	Presets are pre-defined styles that allow you to quickly and easily style buttons, badges, cards, and more. Create by mixing Skeleton and
	Tailwind primitives.
</p>

}

```html
<script lang="ts">
	import IconBookmark from '@lucide/svelte/icons/bookmark';
	const diagramCircle = 'preset-tonal w-8 aspect-square flex justify-center items-center rounded-full';
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-10">
	<!-- 1. Filled -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-filled-primary-500">Filled</button>
		<div class={diagramCircle}>1</div>
	</div>
	<!-- 2. Tonal -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-tonal-primary">Tonal</button>
		<div class={diagramCircle}>2</div>
	</div>
	<!-- 3. Outlined -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-outlined-primary-500">Outlined</button>
		<div class={diagramCircle}>3</div>
	</div>
	<!-- 4. Glass -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-glass-primary">Glass</button>
		<div class={diagramCircle}>4</div>
	</div>
	<!-- 5. Elevated -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-filled-surface-100-900 shadow-xl">Elevated</button>
		<div class={diagramCircle}>5</div>
	</div>
	<!-- 6. Ghost -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn hover:preset-tonal">Ghost</button>
		<div class={diagramCircle}>6</div>
	</div>
	<!-- 7. Ghost (Icon) -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn hover:preset-tonal-primary">
			<IconBookmark className="size-6" />
		</button>
		<div class={diagramCircle}>7</div>
	</div>
	<!-- 8. Gradient -->
	<div class="flex flex-col items-center gap-4">
		<button type="button" class="btn preset-gradient">Gradient</button>
		<div class={diagramCircle}>8</div>
	</div>
</div>

<style>
	/* Create a custom preset in your global stylesheet */
	.preset-gradient {
		background-image: linear-gradient(-45deg, var(--color-primary-300), var(--color-primary-700));
		color: var(--color-primary-contrast-500);
	}
	.preset-glass-primary {
		background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-primary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
</style>

```

1. **Filled** - a filled preset of the primary brand color.
2. **Tonal** - a tonal preset of the primary brand color.
3. **Outlined** - an outlined preset of the primary brand color.
4. **Glass** - a custom preset using background transparency and backdrop blur.
5. **Elevated** - mixes a filled preset with a shadow.
6. **Ghost** - has no style by default, but shows a tonal preset on hover.
7. **Ghost Icon** - has no style by default, but shows a branded tonal preset on hover.
8. **Gradient** - a custom preset generated using Tailwind gradient primitives.

## Enabling Presets

Skeleton provides an optional set of presets for `filled`, `tonal`, and `outlined` styles. To enable these, simply add the following import to your global stylesheet. This is recommended for new users to Skeleton.

```css
@import '@skeletonlabs/skeleton/optional/presets';
```

## Skeleton Presets

Skeleton's provides the following opinionated set of styles, including accessible backgrounds and text colors.

### Filled

```
preset-filled-{color}-{lightModeShade}-{darkModeShade}
```

```html
<div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
	
	<div class="preset-filled flex items-center justify-center p-4">(neutral)</div>
	
	<div class="preset-filled-primary-950-50 flex items-center justify-center p-4">950-50</div>
	<div class="preset-filled-primary-900-100 flex items-center justify-center p-4">900-100</div>
	<div class="preset-filled-primary-800-200 flex items-center justify-center p-4">800-200</div>
	<div class="preset-filled-primary-700-300 flex items-center justify-center p-4">700-300</div>
	<div class="preset-filled-primary-600-400 flex items-center justify-center p-4">600-400</div>
	<div class="preset-filled-primary-500 flex items-center justify-center p-4">500</div>
	<div class="preset-filled-primary-400-600 flex items-center justify-center p-4">400-600</div>
	<div class="preset-filled-primary-300-700 flex items-center justify-center p-4">300-700</div>
	<div class="preset-filled-primary-200-800 flex items-center justify-center p-4">200-800</div>
	<div class="preset-filled-primary-100-900 flex items-center justify-center p-4">100-900</div>
	<div class="preset-filled-primary-50-950 flex items-center justify-center p-4">50-950</div>
</div>

```

### Tonal

```
preset-tonal-{color}
```

```html
<div class="w-full grid grid-cols-2 lg:grid-cols-4 gap-2">
	
	<div class="preset-tonal flex items-center justify-center p-4">(neutral)</div>
	
	<div class="preset-tonal-primary flex items-center justify-center p-4">primary</div>
	<div class="preset-tonal-secondary flex items-center justify-center p-4">secondary</div>
	<div class="preset-tonal-tertiary flex items-center justify-center p-4">tertiary</div>
	<div class="preset-tonal-success flex items-center justify-center p-4">success</div>
	<div class="preset-tonal-warning flex items-center justify-center p-4">warning</div>
	<div class="preset-tonal-error flex items-center justify-center p-4">error</div>
	<div class="preset-tonal-surface flex items-center justify-center p-4">surface</div>
</div>

```

### Outlined

```
preset-outlined-{color}-{shade}-{shade}
```

```html
<div class="grid w-full grid-cols-2 gap-2 lg:grid-cols-4">
	
	<div class="preset-outlined flex items-center justify-center p-4">(neutral)</div>
	
	<div class="preset-outlined-primary-950-50 flex items-center justify-center p-4">950-50</div>
	<div class="preset-outlined-primary-900-100 flex items-center justify-center p-4">900-100</div>
	<div class="preset-outlined-primary-800-200 flex items-center justify-center p-4">800-200</div>
	<div class="preset-outlined-primary-700-300 flex items-center justify-center p-4">700-300</div>
	<div class="preset-outlined-primary-600-400 flex items-center justify-center p-4">600-400</div>
	<div class="preset-outlined-primary-500 flex items-center justify-center p-4">500</div>
	<div class="preset-outlined-primary-400-600 flex items-center justify-center p-4">400-600</div>
	<div class="preset-outlined-primary-300-700 flex items-center justify-center p-4">300-700</div>
	<div class="preset-outlined-primary-200-800 flex items-center justify-center p-4">200-800</div>
	<div class="preset-outlined-primary-100-900 flex items-center justify-center p-4">100-900</div>
	<div class="preset-outlined-primary-50-950 flex items-center justify-center p-4">50-950</div>
</div>

```

## Custom Presets

For advanced users, we recommend disabing the Skeleton presets in favor of custom-generated presets. This ensures you retain full control over the look and feel of each element. Consider these best practices when creating presets.

- Custom presets are only limited by your imagination.
- Use any combination of Skeleton or Tailwind-provided primitive to generate a preset.
- Apply presets to any relevant element, including: buttons, cards, inputs, and more.
- Use a set naming convention, such as `preset-{foo}` to keep things standardized.
- Implement all presets in using Tailwind's [@utility directive](https://tailwindcss.com/docs/functions-and-directives#utility-directive) in your global stylesheet.
- Abstrast presets to a stylesheet or NPM package for shared used between projects.

```html
<div class="w-full max-w-[320px] grid grid-rows-3 gap-4">
	<input type="text" class="input" value="Default Input State!" />
	<input type="text" class="input preset-input-success" value="Valid Input State!" />
	<input type="text" class="input preset-input-error" value="Invalid Input State!" />
</div>

<style>
	/* Add each custom preset to your global stylesheet. */
	.preset-input-success {
		background-color: var(--color-success-100);
		color: var(--color-success-900);
	}
	.preset-input-error {
		background-color: var(--color-error-100);
		color: var(--color-error-900);
	}
</style>

```

### Gradient Presets

Tailwind provides a number of powerful [Gradient](https://tailwindcss.com/docs/gradient-color-stops) utility classes that can be used to generate presets.

```html
<div class="w-full space-y-4">
	<div class="grid grid-cols-3 gap-4">
		<button class="btn preset-gradient-one">Button</button>
		<button class="btn preset-gradient-two">Button</button>
		<button class="btn preset-gradient-three">Button</button>
	</div>
	<div class="grid grid-cols-3 gap-4 text-center">
		<div class="card p-4 preset-gradient-one">Card</div>
		<div class="card p-4 preset-gradient-two">Card</div>
		<div class="card p-4 preset-gradient-three">Card</div>
	</div>
</div>

<style>
	/* Create a custom preset in your global stylesheet */
	.preset-gradient-one {
		background-image: linear-gradient(45deg, var(--color-primary-500), var(--color-tertiary-500));
		color: var(--color-primary-contrast-500);
	}
	.preset-gradient-two {
		background-image: linear-gradient(45deg, var(--color-error-500), var(--color-warning-500));
		color: var(--color-error-contrast-500);
	}
	.preset-gradient-three {
		background-image: linear-gradient(45deg, var(--color-success-500), var(--color-warning-500));
		color: var(--color-success-contrast-500);
	}
</style>

```

### Glass Presets

```html
---
const baseClasses = 'card p-4 text-white text-center flex justify-start items-center';
---

<div
	class="w-full space-y-4 bg-[url(https://picsum.photos/id/249/1024/1024)] bg-center bg-no-repeat bg-cover rounded-container flex justify-center items-center p-4"
>
	<div class="w-full grid grid-cols-1 gap-2">
		<div class:list={`${baseClasses} preset-glass-neutral`}>Neutral</div>
		<div class:list={`${baseClasses} preset-glass-primary`}>Primary</div>
		<div class:list={`${baseClasses} preset-glass-secondary`}>Secondary</div>
		<div class:list={`${baseClasses} preset-glass-tertiary`}>Tertiary</div>
		<div class:list={`${baseClasses} preset-glass-success`}>Success</div>
		<div class:list={`${baseClasses} preset-glass-warning`}>Warning</div>
		<div class:list={`${baseClasses} preset-glass-error`}>Error</div>
		<div class:list={`${baseClasses} preset-glass-surface`}>Surface</div>
	</div>
</div>

<style>
	/* Create a custom preset in your global stylesheet */
	.preset-glass-neutral {
		background: color-mix(in oklab, var(--color-surface-50-950) 30%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-50-950) 30%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	/* --- */
	.preset-glass-primary {
		background: color-mix(in oklab, var(--color-primary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-primary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-secondary {
		background: color-mix(in oklab, var(--color-secondary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-secondary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-tertiary {
		background: color-mix(in oklab, var(--color-tertiary-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-tertiary-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-success {
		background: color-mix(in oklab, var(--color-success-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-success-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-warning {
		background: color-mix(in oklab, var(--color-warning-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-warning-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-error {
		background: color-mix(in oklab, var(--color-error-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-error-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
	.preset-glass-surface {
		background: color-mix(in oklab, var(--color-surface-500) 40%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-500) 50%, transparent) inset;
		backdrop-filter: blur(16px);
	}
</style>

```

---

# Spacing
Set a dynamic scale for application whitespace.

This is enabled by the [Tailwind spacing system](https://tailwindcss.com/blog/tailwindcss-v4#dynamic-utility-values-and-variants).

<Preview client:load>
	<Fragment slot="preview">
		<Example client:visible />
	</Fragment>
	<Fragment slot="code">
		<div class="space-y-4">
			Scaling can be adjusted by modifying the [type scale](/docs/get-started/core-api#typography) theme property.
			```css
			[data-theme='cerberus'] {
				--spacing: 0.25rem;
			}
			```
		</div>
	</Fragment>
</Preview>

This affects the following utilities.

- `padding`
- `margin`
- `width`
- `minWidth`
- `maxWidth`
- `height`
- `minHeight`
- `maxHeight`
- `gap`
- `inset`
- `space`
- `translate`

---

# Themes
The Skeleton theme system.

{

<p class="text-xl">
	Skeleton themes utilize{' '}
	<a className="anchor" href="https://developer.mozilla.org/en-US/docs/Web/CSS/--*" target="_blank" rel="external">
		CSS custom properties
	</a>{' '}
	to define core settings for your design system. Provided with a number of presets theme out of the box, as well as a powerful theme
	generator to create your own. Enable one or more and quickly switch on-demand.
</p>
}

---

## Preset Themes

Skeleton is provided with high quality set of hand curated themes, as shown below.

<ThemesList />

Tap the theme preview above to copy the theme name to your clipboard. Then implement any desired theme in your app's global stylesheet.

```css title="app.css" {3}
/* @import '@skeletonlabs/skeleton'; */
/* @import '@skeletonlabs/skeleton/optional/presets'; */
@import '@skeletonlabs/skeleton/themes/{theme-name}';
```

> Make sure to replace `{theme-name}` with your desired theme names.

## Custom Themes

Use our powerful Theme Generator app to create your own themes.

<figure class="linker bg-noise">
	<a href="https://themes.skeleton.dev/" target="_blank" class="btn preset-filled">
		Theme Generator
	</a>
</figure>

1. Open the Theme Generator and customize to your preference.
2. Make sure to set a unique name for your theme.
3. Tap the "code" view from the menu at top-right corner.
4. Tap the "copy" button at the top of copy the theme contents.
5. Paste the contents into a new file at your project root, such as `my-theme-name.css` (any name is fine).

Follow the step below to register any number of custom themes. Take care to match each theme's file name.

## Register Themes

You may register any number of themes by adding addition theme imports to your global stylesheet. Please note that each theme will slightly increase the final CSS bundle size.

```css
/* @import '@skeletonlabs/skeleton'; */
/* @import '@skeletonlabs/skeleton/optional/presets'; */

/* Register Preset Themes */
@import '@skeletonlabs/skeleton/themes/cerberus';
@import '@skeletonlabs/skeleton/themes/mona';
@import '@skeletonlabs/skeleton/themes/vox';

/* Register a Custom Themes */
/* Make sure to resolve the relative path. */
/* Note the .css extension is optional. */
@import '../{my-theme-name}';
```

## Activate a Theme

You may define the active theme using the `data-theme` attribute on your `<html>` element.

```html
<html data-theme="cerberus">
	...
</html>
```

> TIP: If you wish to create a theme switcher, this is the value you should aim to modify.

---

## Customize and Extend

### Modify Properties

You can modify any [theme property](/docs/get-started/core-api) on demand using the following technique. Simply add this to your global stylesheet, following all Tailwind and Skeleton configuration. Use this to override preset theme properties.

```css title="app.css"
[data-theme='cerberus'] {
	--spacing: 0.22rem;
	--radius-container: 0.375rem;
	--heading-font-weight: bolder;
}
```

### Target Themes

If your application supports multiple themes, you may isolate selection using the `data-theme` attribute. Just make sure to account for light and dark mode color values.

```css title="app.css"
/** Target only Cerberus .h1 elements. */
[data-theme='cerberus'] .h1 {
	color: red;
	@variant dark {
		color: green;
	}
}
/** Target only Mona .h1 elements. */
[data-theme='mona'] .h1 {
	color: blue;
	@variant dark {
		color: yellow;
	}
}
```

### Backgrounds

Your app's light and dark mode background color values can be adjusted using the following [theme properties](/docs/get-started/core-api#colors).

```css title="app.css"
[data-theme='cerberus'] body {
	--body-background-color: pink;
	--body-background-color-dark: green;
}
```

Background images are supported, including CSS mesh gradients. The following example adheres to theme colors.

```css title="app.css"
[data-theme='cerberus'] body {
	background-image:
		radial-gradient(at 24% 25%, color-mix(in oklab, var(--color-primary-500) 30%, transparent) 0px, transparent 30%),
		radial-gradient(at 35% 13%, color-mix(in oklab, var(--color-success-500) 18%, transparent) 0px, transparent 30%),
		radial-gradient(at 100% 64%, color-mix(in oklab, var(--color-error-500) 3%, transparent) 0px, transparent 40%);
	background-attachment: fixed;
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
}
```

We recommend Mesher for generating custom mesh gradients. This will generate colors using RGB, but can be migrated to utilize `var()` for colors and `color-mix()` for transparency, per the example above.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://csshero.org/mesher/" target="_blank">
		Mesher by CSS Hero
	</a>
</figure>

### Custom Fonts

Skeleton recommends the use of [Fontsource](https://fontsource.org/) for installing and managing custom fonts.

<figure class="linker bg-noise">
	<a class="btn preset-filled" href="https://fontsource.org/" target="_blank">
		Browse Fontsource
	</a>
</figure>

Install your font of choice.

```console
npm install @fontsource/open-sans
```

Then import each font at the top of your global stylesheet, but below your Tailwind configuration.

```css title="app.css"
@import '@fontsource/open-sans';
```

Finally, use the following [theme properties](/docs/get-started/core-api#base-1) to set each respective font-family property. Note that for custom themes, these settings are can be defined directly within each respective theme file.

```css title="app.css"
[data-theme='cerberus'] {
	--heading-font-family: 'Open Sans', sans-serif;
	--base-font-family: 'Open Sans', sans-serif;
	--anchor-font-family: 'inherit';
}
```

## Core API

For more information, please refer to the full [Core API](/docs/get-started/core-api) documentation.

---

# Typography
The Skeleton typography system.

{

<p class="text-xl">
	Skeleton provides an array of opt-in utility classes for common typographic elements, with a fully functional typography scale based on
	your theme settings. As well as a number of primitives for generating a semantic typography set for your project's individual needs.
</p>

}

## Typographic Scale

Skeleton introduces customizable [Typographic Scale](https://designcode.io/typographic-scales) to Tailwind's [font-size](https://tailwindcss.com/docs/font-size) properties.

<Preview client:load>
	<Fragment slot="preview">
		<ExampleTypescale client:visible />
	</Fragment>
	<Fragment slot="code">
		<div class="space-y-4">
			Scaling can be adjusted by modifying the [type scale](/docs/get-started/core-api#typography) theme property.
			```css
			[data-theme='cerberus'] {
				--text-scaling: 1.067;
			}
			```
			This affects the following text sizes.
			```html
			<h1 class="text-xs">text-xs</h1>
			<h2 class="text-sm">text-sm</h2>
			<h3 class="textba-base">text-base</h3>
			<h4 class="text-lg">text-lg</h4>
			<h5 class="text-xl">text-xl</h5>
			<h6 class="text2-2xl">text-2xl</h6>
			<h6 class="text3-3xl">text-3xl</h6>
			<h6 class="text4-4xl">text-4xl</h6>
			<h6 class="text5-5xl">text-5xl</h6>
			<h6 class="text6-6xl">text-6xl</h6>
			<h6 class="text7-7xl">text-7xl</h6>
			<h6 class="text8-8xl">text-8xl</h6>
			<h6 class="text9-9xl">text-9xl</h6>
			```
		</div>
	</Fragment>
</Preview>

## Utility Classes

Use the following utility classes to quickly style semantic HTML elements. These classes are opt-in by default, providing a simple escape hatch when you need to break from convention.

### Headings

```html
<div class="space-y-4">
	<h1 class="h1">Heading 1</h1>
	<h2 class="h2">Heading 2</h2>
	<h3 class="h3">Heading 3</h3>
	<h4 class="h4">Heading 4</h4>
	<h5 class="h5">Heading 5</h5>
	<h6 class="h6">Heading 6</h6>
</div>

```

### Paragraphs

```html
<p>The quick brown fox jumps over the lazy dog</p>

```

### Blockquotes

```html
<blockquote class="blockquote">
	"Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nesciunt, aliquid. Molestias, odio illum voluptatibus natus dignissimos, quidem
	est unde aspernatur veniam pariatur fuga distinctio esse in quas, repellendus neque reiciendis!"
</blockquote>

```

### Anchor

```html
<a href="/" class="anchor">Anchor</a>

```

### Pre-Formatted

```html
<pre class="pre">The quick brown fox jumps over the lazy dog.</pre>

```

### Code

```html
<div>Insert the <code class="code">.example</code> class here.</div>

```

### Keyboard

```html
<div>Press <kbd class="kbd">⌘</kbd> + <kbd class="kbd">C</kbd> to copy.</div>

```

### Insert & Delete

```html
<div class="w-full">
	<del class="del"><s>Always</s> Gonna Give You Up</del>
	<ins class="ins" cite="https://youtu.be/dQw4w9WgXcQ" datetime="10-31-2022"> Never Gonna Give You Up </ins>
</div>

```

### Mark

```html
<!-- prettier-ignore -->
<p>
	Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nesciunt, <mark class="mark">aliquid</mark>. Molestias, odio illum voluptatibus <mark class="mark">natus dignissimos</mark>, quidem est unde aspernatur veniam pariatur fuga.
</p>

```
## Lists

Skeleton defers to Tailwind's built-in utility classes for common list styles.

### Unordered

```html
<ul class="list-inside list-disc space-y-2">
	<li>Id maxime optio soluta placeat ea eaque similique consectetur dicta tempore.</li>
	<li>Repellat veritatis et harum ad sint reprehenderit tenetur, possimus tempora.</li>
	<li>Lorem ipsum dolor sit amet consectetur adipisicing elit harum ad sint.</li>
</ul>

```

### Ordered

```html
<ul class="list-inside list-decimal space-y-2">
	<li>Id maxime optio soluta placeat ea eaque similique consectetur dicta tempore.</li>
	<li>Repellat veritatis et harum ad sint reprehenderit tenetur, possimus tempora.</li>
	<li>Lorem ipsum dolor sit amet consectetur adipisicing elit harum ad sint.</li>
</ul>

```

### Basic

```html
<ul class="list-inside list-none space-y-2">
	<li>Id maxime optio soluta placeat ea eaque similique consectetur dicta tempore.</li>
	<li>Repellat veritatis et harum ad sint reprehenderit tenetur, possimus tempora.</li>
	<li>Lorem ipsum dolor sit amet consectetur adipisicing elit harum ad sint.</li>
</ul>

```

### Description

```html
<dl class="space-y-2">
	<div>
		<dt class="font-bold">Item A</dt>
		<dd class="opacity-60">Id maxime optio soluta placeat ea eaque similique consectetur dicta tempore.</dd>
	</div>
	<div>
		<dt class="font-bold">Item B</dt>
		<dd class="opacity-60">Repellat veritatis et harum ad sint reprehenderit tenetur, possimus tempora.</dd>
	</div>
	<div>
		<dt class="font-bold">Item C</dt>
		<dd class="opacity-60">Lorem ipsum dolor sit amet consectetur adipisicing elit harum ad sint.</dd>
	</div>
</dl>

```

### Navigation

```html
<nav class="space-y-2">
	<!-- Optional Heading -->
	<p class="text-lg font-bold">Explore</p>
	<!-- / -->
	<ul class="space-y-2">
		<li>
			<a class="anchor" href="#">Home</a>
		</li>
		<li>
			<a class="anchor" href="#">About</a>
		</li>
		<li>
			<a class="anchor" href="#">Blog</a>
		</li>
	</ul>
</nav>

```

## Semantic Typography

When working with your designers, they may craft a semantic typography set for your project. To handle this, we recommend implementing [custom presets](/docs/design/presets#custom-presets) that mix CSS primitives with semantic HTML elements to replicate all desired styles. Feel free to use the boilerplate below, adding each style to your global stylesheet.

```html
<div class="table-wrap">
	<table class="table">
		<thead>
			<tr>
				<th>Class</th>
				<th>Preview</th>
			</tr>
		</thead>
		<tbody>
			<!-- preset-typo-display-4 -->
			<tr>
				<td><code class="code">preset-typo-display-4</code></td>
				<td><h1 class="preset-typo-display-4">Aa</h1></td>
			</tr>
			<!-- preset-typo-display-3 -->
			<tr>
				<td><code class="code">preset-typo-display-3</code></td>
				<td><h2 class="preset-typo-display-3">Aa</h2></td>
			</tr>
			<!-- preset-typo-display-2 -->
			<tr>
				<td><code class="code">preset-typo-display-2</code></td>
				<td><h3 class="preset-typo-display-2">Aa</h3></td>
			</tr>
			<!-- preset-typo-display-1 -->
			<tr>
				<td><code class="code">preset-typo-display-1</code></td>
				<td><h4 class="preset-typo-display-1">Aa</h4></td>
			</tr>
			<!-- preset-typo-headline -->
			<tr>
				<td><code class="code">preset-typo-headline</code></td>
				<td><p class="preset-typo-headline">Headline</p></td>
			</tr>
			<!-- preset-typo-title -->
			<tr>
				<td><code class="code">preset-typo-title</code></td>
				<td><p class="preset-typo-title">Title</p></td>
			</tr>
			<!-- preset-typo-subtitle -->
			<tr>
				<td><code class="code">preset-typo-subtitle</code></td>
				<td><p class="preset-typo-subtitle">Subtitle</p></td>
			</tr>
			<!-- preset-typo-body-1 -->
			<tr>
				<td><code class="code">preset-typo-body-1</code></td>
				<td>
					<p class="preset-typo-body-1">Body 1</p>
				</td>
			</tr>
			<!-- preset-typo-body-2 -->
			<tr>
				<td><code class="code">preset-typo-body-2</code></td>
				<td>
					<p class="preset-typo-body-2">Body 2</p>
				</td>
			</tr>
			<!-- preset-typo-caption -->
			<tr>
				<td><code class="code">preset-typo-caption</code></td>
				<td><span class="preset-typo-caption">Caption</span></td>
			</tr>
			<!-- preset-typo-menu -->
			<tr>
				<td><code class="code">preset-typo-menu</code></td>
				<td><span class="preset-typo-menu">Menu</span></td>
			</tr>
			<!-- preset-typo-button -->
			<tr>
				<td><code class="code">preset-typo-button</code></td>
				<td><span class="preset-typo-button">Button</span></td>
			</tr>
		</tbody>
	</table>
</div>

<style lang="postcss">
	/* IGNORE THIS: this is only required for our example <style> block. */
	/* https://tailwindcss.com/docs/functions-and-directives#reference-directive */
	@reference "src/styles/app.css";

	/*
		Copy the following classes to your global stylesheet. Rename and modify as desired.
		Reference: http://skeleton.dev/docs/get-started/core-api#typography
	*/

	/* Headings */
	.preset-typo-display-4,
	.preset-typo-display-3,
	.preset-typo-display-2,
	.preset-typo-display-1,
	.preset-typo-headline,
	.preset-typo-title,
	.preset-typo-subtitle,
	.preset-typo-caption,
	.preset-typo-menu,
	.preset-typo-button {
		color: var(--heading-font-color);
		font-family: var(--heading-font-family);
		font-weight: var(--heading-font-weight);
		@variant dark {
			color: var(--heading-font-color-dark);
		}
	}

	/* Body */
	.preset-typo-body-1,
	.preset-typo-body-2,
	.preset-typo-caption,
	.preset-typo-menu,
	.preset-typo-button {
		color: var(--heading-font-color);
		@variant dark {
			color: var(--heading-font-color-dark);
		}
	}

	/* Unique Properties */
	.preset-typo-display-4 {
		font-size: var(--text-7xl);
		@variant lg {
			font-size: var(--text-9xl);
		}
	}
	.preset-typo-display-3 {
		font-size: var(--text-6xl);
		@variant lg {
			font-size: var(--text-8xl);
		}
	}
	.preset-typo-display-2 {
		font-size: var(--text-5xl);
		@variant lg {
			font-size: var(--text-7xl);
		}
	}
	.preset-typo-display-1 {
		font-size: var(--text-4xl);
		@variant lg {
			font-size: var(--text-6xl);
		}
	}
	.preset-typo-headline {
		font-size: var(--text-2xl);
		@variant lg {
			font-size: var(--text-4xl);
		}
	}
	.preset-typo-title {
		font-size: var(--text-xl);
		@variant lg {
			font-size: var(--text-3xl);
		}
	}
	.preset-typo-subtitle {
		font-size: var(--text-base);
		font-family: var(--heading-font-family);
		color: var(--color-surface-700-300);
		@variant lg {
			font-size: var(--text-xl);
		}
	}
	.preset-typo-body-1 {
		font-size: var(--text-xl);
		@variant lg {
			font-size: var(--text-3xl);
		}
	}
	.preset-typo-body-2 {
		font-size: var(--text-lg);
		@variant lg {
			font-size: var(--text-xl);
		}
	}
	.preset-typo-caption {
		font-size: var(--text-sm);
		color: var(--color-surface-700-300);
	}
	.preset-typo-menu {
		font-weight: bold;
	}
	.preset-typo-button {
		font-weight: bold;
	}
</style>

```

---

# Tailwind

# Badges
Provides a robust set of non-interactive badge styles.

```html
---
---

<div class="flex items-center gap-4">
	<!-- A simple icon badge -->
	<span class="badge-icon preset-filled">
		<IconHeart size={16} />
	</span>
	<!-- A standard badge -->
	<span class="badge preset-filled">Badge</span>
	<!-- A badge + icon -->
	<span class="badge preset-filled">
		<IconHeart size={16} />
		<span>Badge</span>
	</span>
</div>

```

## Presets

Provides full support of [Presets](/docs/design/presets).

```html
<div class="space-y-4">
	<div class="flex gap-4">
		<span class="badge preset-filled-primary-500">Badge</span>
		<span class="badge preset-tonal-primary">Badge</span>
		<span class="badge preset-outlined-primary-500">Badge</span>
	</div>
	<div class="flex gap-4">
		<span class="badge preset-filled-secondary-500">Badge</span>
		<span class="badge preset-tonal-secondary">Badge</span>
		<span class="badge preset-outlined-secondary-500">Badge</span>
	</div>
	<div class="flex gap-4">
		<span class="badge preset-filled-tertiary-500">Badge</span>
		<span class="badge preset-tonal-tertiary">Badge</span>
		<span class="badge preset-outlined-tertiary-500">Badge</span>
	</div>
	<div class="flex gap-4">
		<span class="badge preset-filled-success-500">Badge</span>
		<span class="badge preset-tonal-success">Badge</span>
		<span class="badge preset-outlined-success-500">Badge</span>
	</div>
	<div class="flex gap-4">
		<span class="badge preset-filled-warning-500">Badge</span>
		<span class="badge preset-tonal-warning">Badge</span>
		<span class="badge preset-outlined-warning-500">Badge</span>
	</div>
	<div class="flex gap-4">
		<span class="badge preset-filled-error-500">Badge</span>
		<span class="badge preset-tonal-error">Badge</span>
		<span class="badge preset-outlined-error-500">Badge</span>
	</div>
	<div class="flex gap-4">
		<span class="badge preset-filled-surface-500">Badge</span>
		<span class="badge preset-tonal-surface">Badge</span>
		<span class="badge preset-outlined-surface-500">Badge</span>
	</div>
</div>

```

## Overlap

Use `badge-icon` to create overlapping numeric or icon badges.

```html
---
const imgSrc =
	'https://images.unsplash.com/photo-1620122303020-87ec826cf70d?q=80&w=256&h=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
---

<div class="relative inline-block">
	<span class="badge-icon preset-filled-primary-500 absolute -right-0 -top-0 z-10">2</span>
	<img class="size-20 overflow-hidden rounded-full grayscale" src={imgSrc} alt="Avatar" />
</div>

```

---

# Buttons
Provide a variety of button, including customizable sizes and types.

```html
---
---

<div class="flex items-center gap-4">
	<!-- A simple icon button -->
	<button type="button" class="btn-icon preset-filled"><IconArrowRight size={18} /></button>
	<!-- A standard button -->
	<button type="button" class="btn preset-filled">Button</button>
	<!-- A button + icon -->
	<button type="button" class="btn preset-filled">
		<span>Button</span>
		<IconArrowRight size={18} />
	</button>
</div>

```

## Presets

Provides full support of [Presets](/docs/design/presets).

```html
<div class="space-y-4">
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-primary-500">Button</button>
		<button type="button" class="btn preset-tonal-primary">Button</button>
		<button type="button" class="btn preset-outlined-primary-500">Button</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-secondary-500">Button</button>
		<button type="button" class="btn preset-tonal-secondary">Button</button>
		<button type="button" class="btn preset-outlined-secondary-500">Button</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-tertiary-500">Button</button>
		<button type="button" class="btn preset-tonal-tertiary">Button</button>
		<button type="button" class="btn preset-outlined-tertiary-500">Button</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-success-500">Button</button>
		<button type="button" class="btn preset-tonal-success">Button</button>
		<button type="button" class="btn preset-outlined-success-500">Button</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-warning-500">Button</button>
		<button type="button" class="btn preset-tonal-warning">Button</button>
		<button type="button" class="btn preset-outlined-warning-500">Button</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-error-500">Button</button>
		<button type="button" class="btn preset-tonal-error">Button</button>
		<button type="button" class="btn preset-outlined-error-500">Button</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="btn preset-filled-surface-500">Button</button>
		<button type="button" class="btn preset-tonal-surface">Button</button>
		<button type="button" class="btn preset-outlined-surface-500">Button</button>
	</div>
</div>

```

## Sizes

```html
<div class="flex items-center gap-4">
	<button type="button" class="btn btn-sm preset-filled">Small</button>
	<button type="button" class="btn btn-base preset-filled">Base</button>
	<button type="button" class="btn btn-lg preset-filled">Large</button>
</div>

```

## Disabled

When applied to a `<button>` element, you can use the `disabled` attribute.

```html
<button type="button" class="btn preset-filled-primary-500" disabled>Button</button>

```

## Group

```html
<nav class="btn-group preset-outlined-surface-200-800 flex-col p-2 md:flex-row">
	<button type="button" class="btn preset-filled">January</button>
	<button type="button" class="btn hover:preset-tonal">February</button>
	<button type="button" class="btn hover:preset-tonal">March</button>
</nav>

```

---

# Cards
Provides container elements that wrap and separate content.

```html
<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center">
	<p>Card</p>
</div>

```

```html
---
const imgSrc =
	'https://images.unsplash.com/photo-1463171515643-952cee54d42a?q=80&w=450&h=190&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
---

<a
	href="#"
	class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
>
	
	<header>
		<img src={imgSrc} class="aspect-[21/9] w-full grayscale hue-rotate-90" alt="banner" />
	</header>
	
	<article class="space-y-4 p-4">
		<div>
			<h2 class="h6">Announcements</h2>
			<h3 class="h3">Skeleton is Awesome</h3>
		</div>
		<p class="opacity-60">
			Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam aspernatur provident eveniet eligendi cumque consequatur tempore sint
			nisi sapiente. Iste beatae laboriosam iure molestias cum expedita architecto itaque quae rem.
		</p>
	</article>
	
	<footer class="flex items-center justify-between gap-4 p-4">
		<small class="opacity-60">By Alex</small>
		<small class="opacity-60">On {new Date().toLocaleDateString()}</small>
	</footer>
</a>

```

## Presets

Provides full support of [Presets](/docs/design/presets).

```html
<div class="w-full grid grid-cols-3 gap-4">
	<div class="card p-4 preset-filled-primary-500">Card</div>
	<div class="card p-4 preset-tonal-primary">Card</div>
	<div class="card p-4 preset-outlined-primary-500">Card</div>
	
	<div class="card p-4 preset-filled-secondary-500">Card</div>
	<div class="card p-4 preset-tonal-secondary">Card</div>
	<div class="card p-4 preset-outlined-secondary-500">Card</div>
	
	<div class="card p-4 preset-filled-tertiary-500">Card</div>
	<div class="card p-4 preset-tonal-tertiary">Card</div>
	<div class="card p-4 preset-outlined-tertiary-500">Card</div>
	
	<div class="card p-4 preset-filled-success-500">Card</div>
	<div class="card p-4 preset-tonal-success">Card</div>
	<div class="card p-4 preset-outlined-success-500">Card</div>
	
	<div class="card p-4 preset-filled-warning-500">Card</div>
	<div class="card p-4 preset-tonal-warning">Card</div>
	<div class="card p-4 preset-outlined-warning-500">Card</div>
	
	<div class="card p-4 preset-filled-error-500">Card</div>
	<div class="card p-4 preset-tonal-error">Card</div>
	<div class="card p-4 preset-outlined-error-500">Card</div>
	
	<div class="card p-4 preset-filled-surface-500">Card</div>
	<div class="card p-4 preset-tonal-surface">Card</div>
	<div class="card p-4 preset-outlined-surface-500">Card</div>
</div>

```

---

# Chips
Provides a robust set of interactive chip styles.

```html
---
---

<div class="flex items-center gap-4">
	<!-- A simple icon chip -->
	<button type="button" class="chip-icon preset-filled">
		<Check size={16} />
	</button>
	<!-- A standard chip -->
	<button type="button" class="chip preset-filled">Chip</button>
	<!-- A chip + icon -->
	<button type="button" class="chip preset-filled">
		<span>Chip</span>
		<Check size={16} />
	</button>
</div>

```

## Presets

Provides full support of [Presets](/docs/design/presets).

```html
<div class="space-y-4">
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-primary-500">Chip</button>
		<button type="button" class="chip preset-tonal-primary">Chip</button>
		<button type="button" class="chip preset-outlined-primary-500">Chip</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-secondary-500">Chip</button>
		<button type="button" class="chip preset-tonal-secondary">Chip</button>
		<button type="button" class="chip preset-outlined-secondary-500">Chip</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-tertiary-500">Chip</button>
		<button type="button" class="chip preset-tonal-tertiary">Chip</button>
		<button type="button" class="chip preset-outlined-tertiary-500">Chip</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-success-500">Chip</button>
		<button type="button" class="chip preset-tonal-success">Chip</button>
		<button type="button" class="chip preset-outlined-success-500">Chip</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-warning-500">Chip</button>
		<button type="button" class="chip preset-tonal-warning">Chip</button>
		<button type="button" class="chip preset-outlined-warning-500">Chip</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-error-500">Chip</button>
		<button type="button" class="chip preset-tonal-error">Chip</button>
		<button type="button" class="chip preset-outlined-error-500">Chip</button>
	</div>
	<div class="flex gap-4">
		<button type="button" class="chip preset-filled-surface-500">Chip</button>
		<button type="button" class="chip preset-tonal-surface">Chip</button>
		<button type="button" class="chip preset-outlined-surface-500">Chip</button>
	</div>
</div>

```

## Disabled

When applied to a `<button>` element, you can use the `disabled` attribute.

```html
<button type="button" class="chip preset-filled" disabled>Chip</button>

```

## Selection

```html

	const colors = ['red', 'blue', 'green'];
	const [color, setColor] = useState(colors[0]);

	return (
		<div className="flex gap-2">
			
			{color &&
				colors.map((c) => (
					// On selection, set the color state, dynamically update classes
					<button className={`chip capitalize ${color === c ? 'preset-filled' : 'preset-tonal'}`} onClick={() => setColor(c)} key={c}>
						<span>{c}</span>
					</button>
				))}
		</div>
	);
};

```

---

# Dividers
Horizontal and vertical rule styling.

```html
<div class="w-full space-y-4 text-center">
	<p>Above the divider.</p>
	<!-- --- -->
	<hr class="hr" />
	<!-- --- -->
	<p>Below the divider.</p>
</div>

```

## Size

Use Tailwind's [border width](https://tailwindcss.com/docs/border-width) utilities to adjust thickness.

```html
<div class="w-full space-y-4">
	<code class="inline-block code">Default</code>
	<hr class="hr" />
	<!-- --- -->
	<code class="inline-block code">border-t-2</code>
	<hr class="hr border-t-2" />
	<!-- --- -->
	<code class="inline-block code">border-t-4</code>
	<hr class="hr border-t-4" />
	<!-- --- -->
	<code class="inline-block code">border-t-8</code>
	<hr class="hr border-t-8" />
</div>

```

## Style

Use Tailwind's [border style](https://tailwindcss.com/docs/border-style) utilities to adjust visual style.

```html
<div class="w-full space-y-4">
	<code class="inline-block code">border-solid</code>
	<hr class="hr border-solid" />
	<!-- --- -->
	<code class="inline-block code">border-dashed</code>
	<hr class="hr border-dashed" />
	<!-- --- -->
	<code class="inline-block code">border-dotted</code>
	<hr class="hr border-dotted" />
	<!-- --- -->
	<code class="inline-block code">border-double</code>
	<hr class="hr border-4 border-double" />
</div>

```

## Colors

Use any Tailwind or Skeleton [colors or pairing](/docs/design/colors).

```html
<div class="w-full space-y-4">
	<code class="inline-block code">border-primary-500</code>
	<hr class="hr border-primary-500" />
	<!-- --- -->
	<code class="inline-block code">border-secondary-500</code>
	<hr class="hr border-secondary-500" />
	<!-- --- -->
	<code class="inline-block code">border-tertiary-500</code>
	<hr class="hr border-tertiary-500" />
	<!-- --- -->
	<code class="inline-block code">border-success-500</code>
	<hr class="hr border-success-500" />
	<!-- --- -->
	<code class="inline-block code">border-warning-500</code>
	<hr class="hr border-warning-500" />
	<!-- --- -->
	<code class="inline-block code">border-error-500</code>
	<hr class="hr border-error-500" />
	<!-- --- -->
	<code class="inline-block code">border-surface-950-50</code>
	<hr class="hr border-surface-950-50" />
	<!-- --- -->
</div>

```

## Vertical

Use `vh` for a vertical rulue, which supports all above styles. Make sure to set the height.

```html
<div class="grid h-20 grid-cols-[1fr_auto_auto_auto_auto_1fr] items-center gap-4">
	<span><code class="code">Default</code> &rarr;</span>
	<!-- --- -->
	<span class="vr"></span>
	<span class="vr border-l-2"></span>
	<span class="vr border-l-4"></span>
	<span class="vr border-l-8"></span>
	<!-- --- -->
	<span>&larr; <code class="code">border-l-8</code></span>
</div>

```

---

# Forms and Inputs
Various form and input styles.

```html
<label class="label">
	<span class="label-text">Input</span>
	<input class="input" type="text" placeholder="Input" />
</label>

```

## Prerequisites

### Tailwind Forms

Skeleton relies on the official [Tailwind Forms](https://github.com/tailwindlabs/tailwindcss-forms) plugin to normalize form styling. Ths plugin is required if you wish to make use of any utility classes provided on this page.

<figure class="card-filled-enhanced flex justify-center gap-4 p-8">
	<a class="btn preset-filled" href="https://github.com/tailwindlabs/tailwindcss-forms" target="_blank">
		Plugin Doc
	</a>
</figure>

Install the `@tailwindcss/forms` package.

```sh
npm install -D @tailwindcss/forms
```

Implement the plugin using the `@plugin` directive immediately following the `tailwindcss` import.

```css {2}
@import 'tailwindcss';
@plugin '@tailwindcss/forms';

/* ...Skeleton config here... */
```

### Browser Support

The display of native and semantic HTML form elements can vary between both operating systems and browsers. Skeleton does it's best to adhere to progressive enhancement best practices. However, we advise you validate support for each element per your target audience.

## Inputs

```html
<form class="mx-auto w-full max-w-md space-y-4">
	<input type="text" class="input" placeholder="Enter name" />
	<!-- --- -->
	<label class="label">
		<span class="label-text">Number</span>
		<input type="number" class="input" placeholder="Enter Age" />
	</label>
	<!-- --- -->
	<label class="label">
		<span class="label-text">Password</span>
		<input type="password" class="input" placeholder="Enter Password" />
	</label>
	<!-- --- -->
	<label class="label">
		<span class="label-text">Phone Number</span>
		<input type="tel" class="input" placeholder="ex: 214-555-1234" />
	</label>
	<!-- --- -->
	<label class="label">
		<span class="label-text">Search</span>
		<input type="search" class="input" placeholder="Search..." />
	</label>
</form>

```

## Select

```html
<form class="mx-auto w-full max-w-md space-y-4">
	<!-- Default -->
	<select class="select">
		<option value="1">Option 1</option>
		<option value="2">Option 2</option>
		<option value="3">Option 3</option>
		<option value="4">Option 4</option>
		<option value="5">Option 5</option>
	</select>
	<!-- Size -->
	<select class="select rounded-container" size="4" value="1">
		<option value="1">Option 1</option>
		<option value="2">Option 2</option>
		<option value="3">Option 3</option>
		<option value="4">Option 4</option>
		<option value="5">Option 5</option>
	</select>
	<!-- Multiple -->
	<select class="select rounded-container" multiple value="['1', '2']">
		<option value="1">Option 1</option>
		<option value="2">Option 2</option>
		<option value="3">Option 3</option>
		<option value="4">Option 4</option>
		<option value="5">Option 5</option>
	</select>
</form>

```

## Checkboxes

```html
<form class="space-y-2">
	<label class="flex items-center space-x-2">
		<input class="checkbox" type="checkbox" checked />
		<p>Option 1</p>
	</label>
	<label class="flex items-center space-x-2">
		<input class="checkbox" type="checkbox" />
		<p>Option 2</p>
	</label>
	<label class="flex items-center space-x-2">
		<input class="checkbox" type="checkbox" />
		<p>Option 3</p>
	</label>
</form>

```

## Radio Groups

```html
<form class="space-y-2">
	<label class="flex items-center space-x-2">
		<input class="radio" type="radio" checked name="radio-direct" value="1" />
		<p>Option 1</p>
	</label>
	<label class="flex items-center space-x-2">
		<input class="radio" type="radio" name="radio-direct" value="2" />
		<p>Option 2</p>
	</label>
	<label class="flex items-center space-x-2">
		<input class="radio" type="radio" name="radio-direct" value="3" />
		<p>Option 3</p>
	</label>
</form>

```

## Kitchen Sink

Display and functionality of these elements may vary greatly between devices and browsers.

```html
<form class="mx-auto w-full max-w-md space-y-4">
	<!-- Date Picker -->
	<label class="label">
		<span class="label-text">Date</span>
		<input class="input" type="date" />
	</label>
	<!-- File Input -->
	<label class="label">
		<span class="label-text">File Input</span>
		<input class="input" type="file" />
	</label>
	<!-- Range -->
	<label class="label">
		<span class="label-text">Range</span>
		<input class="input" type="range" value="75" max="100" />
	</label>
	<!-- Progress -->
	<label class="label">
		<span class="label-text">Progress</span>
		<progress class="progress" value="50" max="100"></progress>
	</label>
	<!-- Color -->
	<!-- TODO: convert to mini-component for reactive value -->
	<div class="grid grid-cols-[auto_1fr] gap-2">
		<input class="input" type="color" value="#bada55" />
		<input class="input" type="text" value="#bada55" readonly tabindex="-1" />
	</div>
</form>

```

## Groups

Input groups support a subset of form elements and button styles. These pair well with [Presets](/docs/design/presets).

```html
---
---

<form class="w-full space-y-8">
	<!-- Website -->
	<div class="input-group grid-cols-[auto_1fr_auto]">
		<div class="ig-cell preset-tonal">https://</div>
		<input class="ig-input" type="text" placeholder="www.example.com" />
	</div>
	<!-- Amount -->
	<div class="input-group grid-cols-[auto_1fr_auto]">
		<div class="ig-cell preset-tonal">
			<CircleDollarSign size={16} />
		</div>
		<input class="ig-input" type="text" placeholder="Amount" />
		<select class="ig-select">
			<option>USD</option>
			<option>CAD</option>
			<option>EUR</option>
		</select>
	</div>
	<!-- Username -->
	<div class="input-group grid-cols-[1fr_auto]">
		<input class="ig-input" type="text" placeholder="Enter Username..." />
		<button class="ig-btn preset-filled" title="Username already in use.">
			<Check size={16} />
		</button>
	</div>
	<!-- Search -->
	<div class="input-group grid-cols-[auto_1fr_auto]">
		<div class="ig-cell preset-tonal">
			<Search size={16} />
		</div>
		<input class="ig-input" type="search" placeholder="Search..." />
		<button class="ig-btn preset-filled">Submit</button>
	</div>
</form>

```

| Class         | Usage                                   |
| ------------- | --------------------------------------- |
| `input-group` | Defines the parent input group set.     |
| `ig-cell`     | Defines a child cell for text or icons. |
| `ig-input`    | Defines a child input of `type="text"`. |
| `ig-select`   | Defines a child select element.         |
| `ig-btn`      | Defines a child button.                 |

---

# Placeholders
Provides "skeleton" placeholders that can display while content loads.

```html
<div class="w-full space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center justify-center space-x-4">
			<div class="placeholder-circle size-16 animate-pulse"></div>
			<div class="placeholder-circle size-14 animate-pulse"></div>
			<div class="placeholder-circle size-10 animate-pulse"></div>
		</div>
	</div>
	<div class="space-y-4">
		<div class="placeholder animate-pulse"></div>
		<div class="grid grid-cols-4 gap-4">
			<div class="placeholder animate-pulse"></div>
			<div class="placeholder animate-pulse"></div>
			<div class="placeholder animate-pulse"></div>
			<div class="placeholder animate-pulse"></div>
		</div>
		<div class="placeholder animate-pulse"></div>
		<div class="placeholder animate-pulse"></div>
	</div>
</div>

```

## Animated

```html
<div class="placeholder animate-pulse">...</div>
```

---

# Tables
Provides a set of styles for native HTML table elements.

```html
---
const tableData = [
	{ position: '0', name: 'Iron', symbol: 'Fe', atomic_no: '26' },
	{ position: '1', name: 'Rhodium', symbol: 'Rh', atomic_no: '45' },
	{ position: '2', name: 'Iodine', symbol: 'I', atomic_no: '53' },
	{ position: '3', name: 'Radon', symbol: 'Rn', atomic_no: '86' },
	{ position: '4', name: 'Technetium', symbol: 'Tc', atomic_no: '43' }
];
---

<div class="table-wrap">
	<table class="table caption-bottom">
		<tbody class="[&>tr]:hover:preset-tonal-primary">
			{
				tableData.map((row) => (
					<tr>
						<td>{row.position}</td>
						<td>{row.symbol}</td>
						<td>{row.name}</td>
						<td class="text-right">{row.atomic_no}</td>
					</tr>
				))
			}
		</tbody>
	</table>
</div>

```

## Extras

Optionally add a header, footer, and caption.

```html
---
const tableData = [
	{ position: '0', name: 'Iron', symbol: 'Fe', atomic_no: '26' },
	{ position: '1', name: 'Rhodium', symbol: 'Rh', atomic_no: '45' },
	{ position: '2', name: 'Iodine', symbol: 'I', atomic_no: '53' },
	{ position: '3', name: 'Radon', symbol: 'Rn', atomic_no: '86' },
	{ position: '4', name: 'Technetium', symbol: 'Tc', atomic_no: '43' }
];
---

<div class="table-wrap">
	<table class="table caption-bottom">
		<caption class="pt-4">A list of elements from the periodic table.</caption>
		<thead>
			<tr>
				<th>Position</th>
				<th>Symbol</th>
				<th>Name</th>
				<th class="!text-right">Weight</th>
			</tr>
		</thead>
		<tbody class="[&>tr]:hover:preset-tonal-primary">
			{
				tableData.map((row) => (
					<tr>
						<td>{row.position}</td>
						<td>{row.symbol}</td>
						<td>{row.name}</td>
						<td class="text-right">{row.atomic_no}</td>
					</tr>
				))
			}
		</tbody>
		<tfoot>
			<tr>
				<td colspan="3">Total</td>
				<td class="text-right">{tableData.length} Elements</td>
			</tr>
		</tfoot>
	</table>
</div>

```

## Navigation

Native HTML tables do not support interaction. For accessibility, use anchors or buttons within the last cell.

```html
---
const tableData = [
	{ first: 'Liam', last: 'Steele', email: 'liam@email.com' },
	{ first: 'Athena', last: 'Marks', email: 'athena@email.com' },
	{ first: 'Angela', last: 'Rivers', email: 'angela@email.com' }
];
---

<div class="table-wrap">
	<table class="table caption-bottom">
		<tbody>
			<thead>
				<tr>
					<th>First Name</th>
					<th>Last Name</th>
					<th>Email</th>
					<th>&nbsp;</th>
				</tr>
			</thead>
			{
				tableData.map((row) => (
					<tr>
						<td>{row.first}</td>
						<td>{row.last}</td>
						<td>{row.email}</td>
						<td class="text-right">
							<a class="btn btn-sm preset-filled" href="#">
								View &rarr;
							</a>
						</td>
					</tr>
				))
			}
		</tbody>
	</table>
</div>

```

## Layout

See [Tailwind's utility classes](https://tailwindcss.com/docs/table-layout) for adjusting the table layout algorithm. Apply this to the Table element.

## Hover Rows

Add a visual hover effect using the following Tailwind syntax.

```html
<tbody class="[&>tr]:hover:preset-tonal-primary">
	...
</tbody>
```

## Pagination

Pair with the Skeleton [Pagination](/docs/components/pagination/react) component for large data sets.

---

# Components

# Accordion
Divide content into collapsible sections.



## Default

```svelte
<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import Club from '@lucide/svelte/icons/club';
	import Diamond from '@lucide/svelte/icons/diamond';
	import Heart from '@lucide/svelte/icons/heart';
	import Spade from '@lucide/svelte/icons/spade';

	const lorem =
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit esse nisi eligendi fuga! Quas nisi repellat adipisci animi repellendus incidunt laborum sunt qui nesciunt, ducimus saepe sapiente sed ut labore. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit esse nisi eligendi fuga! Quas nisi repellat adipisci animi repellendus incidunt laborum sunt qui nesciunt, ducimus saepe sapiente sed ut labore.';

	let value = $state(['club']);
</script>

<Accordion {value} onValueChange={(e) => (value = e.value)}>
	<Accordion.Item value="club">
		<!-- Control -->
		{#snippet lead()}<Club size={24} />{/snippet}
		{#snippet control()}Club{/snippet}
		<!-- Panel -->
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="diamond">
		{#snippet lead()}<Diamond size={24} />{/snippet}
		{#snippet control()}Diamond{/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="heart" disabled>
		{#snippet lead()}<Heart size={24} />{/snippet}
		{#snippet control()}Heart (disabled){/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="spade">
		{#snippet lead()}<Spade size={24} />{/snippet}
		{#snippet control()}Spade{/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
</Accordion>

```

## Collapsible

```svelte
<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import Club from '@lucide/svelte/icons/club';
	import Diamond from '@lucide/svelte/icons/diamond';
	import Heart from '@lucide/svelte/icons/heart';
	import Spade from '@lucide/svelte/icons/spade';

	const lorem =
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit esse nisi eligendi fuga! Quas nisi repellat adipisci animi repellendus incidunt laborum sunt qui nesciunt, ducimus saepe sapiente sed ut labore. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit esse nisi eligendi fuga! Quas nisi repellat adipisci animi repellendus incidunt laborum sunt qui nesciunt, ducimus saepe sapiente sed ut labore.';

	let value = $state(['club']);
</script>

<Accordion {value} onValueChange={(e) => (value = e.value)} collapsible>
	<Accordion.Item value="club">
		<!-- Control -->
		{#snippet lead()}<Club size={24} />{/snippet}
		{#snippet control()}Club{/snippet}
		<!-- Panel -->
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="diamond">
		{#snippet lead()}<Diamond size={24} />{/snippet}
		{#snippet control()}Diamond{/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="heart" disabled>
		{#snippet lead()}<Heart size={24} />{/snippet}
		{#snippet control()}Heart (disabled){/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="spade">
		{#snippet lead()}<Spade size={24} />{/snippet}
		{#snippet control()}Spade{/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
</Accordion>

```

## Multiple

```svelte
<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import Club from '@lucide/svelte/icons/club';
	import Diamond from '@lucide/svelte/icons/diamond';
	import Heart from '@lucide/svelte/icons/heart';
	import Spade from '@lucide/svelte/icons/spade';

	const lorem =
		'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit esse nisi eligendi fuga! Quas nisi repellat adipisci animi repellendus incidunt laborum sunt qui nesciunt, ducimus saepe sapiente sed ut labore. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit esse nisi eligendi fuga! Quas nisi repellat adipisci animi repellendus incidunt laborum sunt qui nesciunt, ducimus saepe sapiente sed ut labore.';

	let value = $state(['club']);
</script>

<Accordion {value} onValueChange={(e) => (value = e.value)} multiple>
	<Accordion.Item value="club">
		<!-- Control -->
		{#snippet lead()}<Club size={24} />{/snippet}
		{#snippet control()}Club{/snippet}
		<!-- Panel -->
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="diamond">
		{#snippet lead()}<Diamond size={24} />{/snippet}
		{#snippet control()}Diamond{/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="heart" disabled>
		{#snippet lead()}<Heart size={24} />{/snippet}
		{#snippet control()}Heart (disabled){/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
	<hr class="hr" />
	<Accordion.Item value="spade">
		{#snippet lead()}<Spade size={24} />{/snippet}
		{#snippet control()}Spade{/snippet}
		{#snippet panel()}{lorem}{/snippet}
	</Accordion.Item>
</Accordion>

```

## Open State

Each Item `id` added to the Accordion `value` array will be open by default.

### State Rune

```ts
const value = $state(['club']);
```

```tsx
<Accordion value={value}>...</Accordion>
```

### Hardcoded

```tsx
<Accordion value={['club']}>...</Accordion>
```

## Multiple Items

Use `multiple` to enable multiple items to be opened at once.

```html
<Accordion multiple>...</Accordion>
```

## Custom Icons

```svelte
<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import Club from '@lucide/svelte/icons/club';
</script>

<Accordion>
    {#snippet iconOpen()}<Plus size={16} />{/snippet}
    {#snippet iconClosed()}<Minus size={16} />{/snippet}
    <!-- ... -->
	<AccordionItem id="club">
    	{#snippet controlLead()}<Club size={24} />{/snippet}
    	<!-- ... -->
	<AccordionItem>
</Accordion>
```

## Anatomy

<Anatomy label="Accordion" isComponent>
	<Anatomy label="Accordion.Item" isComponent>
		<Anatomy label="control" tag="button">
			<Anatomy label="lead" />
			<Anatomy label="content" />
			<Anatomy label="indicator" />
		</Anatomy>
		<Anatomy label="panel" />
	</Anatomy>
</Anatomy>

## API Reference

### Accordion

| Property | Type | Description |
| --- | --- | --- |
| `animationConfig` | SlideParams | The animation configuration |
| `base` | string | Sets base styles. |
| `padding` | string | Set padding styles. |
| `spaceY` | string | Set vertical spacing styles. |
| `rounded` | string | Set border radius styles. |
| `width` | string | Set the width styles. |
| `classes` | string | Provide arbitrary CSS classes. |
| `children`* | Snippet<[]> | The default child slot. |
| `iconOpen` | Snippet<[]> | Set the open state icon. |
| `iconClosed` | Snippet<[]> | Set the closed state icon. |
| `ids` | Partial<{ root: string; item(value: string): string; itemContent(value: string): string; itemTrigger(value: string): string; }> | The ids of the elements in the accordion. Useful for composition. |
| `multiple` | boolean | Whether multiple accordion items can be expanded at the same time. Default: false |
| `collapsible` | boolean | Whether an accordion item can be closed after it has been expanded. Default: false |
| `value` | string[] | The controlled value of the expanded accordion items. |
| `defaultValue` | string[] | The initial value of the expanded accordion items. Use when you don't need to control the value of the accordion. |
| `disabled` | boolean | Whether the accordion items are disabled |
| `onValueChange` | (details: ValueChangeDetails) => void | The callback fired when the state of expanded/collapsed accordion items changes. |
| `onFocusChange` | (details: FocusChangeDetails) => void | The callback fired when the focused accordion item changes. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |

### AccordionItem

| Property | Type | Description |
| --- | --- | --- |
| `headingLevel` | number | The heading level. |
| `base` | string | Sets base styles. |
| `spaceY` | string | Set vertical spacing styles. |
| `classes` | string | Provide arbitrary CSS classes. |
| `controlBase` | string | Sets control's base styles. |
| `controlHover` | string | Sets control's the hover styles. |
| `controlPadding` | string | Sets control's the padding styles. |
| `controlRounded` | string | Sets control's the border radius styles. |
| `controlClasses` | string | Provide arbitrary CSS classes to the control. |
| `leadBase` | string | Sets the lead's base styles |
| `leadClasses` | string | Provide arbitrary CSS classes to the lead. |
| `contentBase` | string | Sets the lead's base styles |
| `contentClasses` | string | Provide arbitrary CSS classes to the content. |
| `indicatorBase` | string | Sets the lead's base styles |
| `indicatorClasses` | string | Provide arbitrary CSS classes to the indicator. |
| `panelBase` | string | Set the panel's base styles. |
| `panelPadding` | string | Set the panel's padding styles. |
| `panelRounded` | string | Set the panel's border-radius styles. |
| `panelClasses` | string | Provide arbitrary CSS classes to the panel. |
| `control`* | Snippet<[]> | The control's default slot. |
| `lead` | Snippet<[]> | The control's lead icon slot. |
| `panel` | Snippet<[]> | The panels's default slot. |
| `value`* | string | The value of the accordion item. |
| `disabled` | boolean | Whether the accordion item is disabled. |

---

# App Bar
A header element for the top of your page layout.

```svelte
<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CircleUser from '@lucide/svelte/icons/circle-user';
</script>

<AppBar>
	{#snippet lead()}
		<ArrowLeft size={24} />
	{/snippet}
	{#snippet trail()}
		<Paperclip size={20} />
		<Calendar size={20} />
		<CircleUser size={20} />
	{/snippet}
	{#snippet headline()}
		<h2 class="h2">Headline</h2>
	{/snippet}
</AppBar>

```

## Toolbar

```svelte
<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CircleUser from '@lucide/svelte/icons/circle-user';
</script>

<AppBar>
	{#snippet lead()}
		<ArrowLeft size={24} />
	{/snippet}
	{#snippet trail()}
		<Paperclip size={20} />
		<Calendar size={20} />
		<CircleUser size={20} />
	{/snippet}
	<span>Title</span>
</AppBar>

```

## Responsive

Use Tailwind's [responsive design](https://tailwindcss.com/docs/responsive-design) breakpoints to adjust for various screen sizes.

```svelte
<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Paperclip from '@lucide/svelte/icons/paperclip';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import Menu from '@lucide/svelte/icons/menu';
</script>

<AppBar headlineClasses="sm:hidden" centerClasses="hidden sm:block">
	{#snippet lead()}
		<ArrowLeft size={24} />
	{/snippet}
	{#snippet trail()}
		<div class="hidden space-x-4 sm:flex">
			<Paperclip size={20} />
			<Calendar size={20} />
			<CircleUser size={20} />
		</div>
		<div class="block sm:hidden">
			<Menu size={20} />
		</div>
	{/snippet}
	{#snippet headline()}
		<h2 class="h2">Title</h2>
	{/snippet}
	<span>Title</span>
</AppBar>

```

## Anatomy

<Anatomy label="AppBar" isComponent>
	<Anatomy label="toolbar">
		<Anatomy label="lead" />
		<Anatomy label="center" />
		<Anatomy label="trail" />
	</Anatomy>
	<Anatomy label="headline" />
</Anatomy>

## API Reference

### AppBar

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Set base styles. |
| `background` | string | Set background styles. |
| `spaceY` | string | Set vertical spacing styles. |
| `border` | string | Set border styles. |
| `padding` | string | Set padding styles. |
| `shadow` | string | Set shadow styles. |
| `classes` | string | Provide arbitrary CSS classes. |
| `toolbarBase` | string | Sets toolbar's base styles. |
| `toolbarGridCols` | string | Sets toolbar's grid columns styles. |
| `toolbarGap` | string | Sets toolbar's gap styles. |
| `toolbarClasses` | string | Provide arbitrary CSS classes to the toolbar. |
| `leadBase` | string | Sets the lead snippet element's base styles. |
| `leadSpaceX` | string | Sets the lead snippet element's horizontal spacing styles. |
| `leadPadding` | string | Sets the lead snippet element's padding styles. |
| `leadClasses` | string | Provide arbitrary CSS classes to the lead snippet. |
| `centerBase` | string | Sets the center snippet element's base styles. |
| `centerAlign` | string | Sets the center snippet element's alignment styles. |
| `centerPadding` | string | Sets the center snippet element's padding styles. |
| `centerClasses` | string | Provide arbitrary CSS classes to the center snippet. |
| `trailBase` | string | Sets the trail snippet element's base styles. |
| `trailSpaceX` | string | Sets the trail snippet element's horizontal spacing styles. |
| `trailPadding` | string | Sets the trail snippet element's padding styles. |
| `trailClasses` | string | Provide arbitrary CSS classes to the trail snippet. |
| `headlineBase` | string | Sets the headline snippet element's base styles. |
| `headlineClasses` | string | Provide arbitrary CSS classes to the headline snippet. |
| `children` | Snippet<[]> | The center slot. |
| `lead` | Snippet<[]> | The lead slot. |
| `trail` | Snippet<[]> | The trail slot. |
| `headline` | Snippet<[]> | The headline slot. |

---

# Avatar
An image with a fallback for representing the user.

```svelte
<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

<Avatar src="https://i.pravatar.cc/150?img=48" name="skeleton" />

```

## Fallback

When `src` or `srcSet` are missing or fail to load, a fallback will be displayed. By default this will show the user initials, based on the `name`. Optionally you can supply your own content using the default `children`. This can be used to display icons or implement a custom image using [@sveltejs/enhanced-img](https://kit.svelte.dev/docs/images#sveltejs-enhanced-img).

```svelte
<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import Skull from '@lucide/svelte/icons/skull';
</script>

<div class="flex gap-4">
	<Avatar name="John Doe"></Avatar>
	<Avatar name="icon" background="preset-filled-primary-500">
		<Skull size={24} />
	</Avatar>
</div>

```

## Filters

Avatars can implement [SVG Filters](/docs/guides/cookbook/svg-filters) using arbitrary Tailwind syntax.

```svelte
<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

<Avatar src="https://i.pravatar.cc/150?img=48" name="filtered" imageClasses="[filter:url(#Apollo)]" />

<!-- Filter -->
<!-- Ideally you have as single instance of this in your application. -->
<svg id="svg-filter-apollo" class="absolute -left-full w-0 h-0">
	<filter id="Apollo" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
		<feColorMatrix
			values="0.8 0.6 -0.4 0.1 0,
		0 1.2 0.05 0 0,
		0 -1 3 0.02 0,
		0 0 0 50 0"
			result="final"
			in="SourceGraphic"
		></feColorMatrix>
	</filter>
</svg>

```

## Style Attribute

Use the `style` prop to implement custom styles on the parent `<figure>` element.

```svelte
<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

<Avatar name="Jane Doe" style="background-color: #bada55; color: black;" />

```

## Anatomy

<Anatomy label="Avatar" tag="figure" isComponent>
	<Anatomy label="image" tag="img" />
	<Anatomy label="fallback" tag="span" />
</Anatomy>

## API Reference

### Avatar

| Property | Type | Description |
| --- | --- | --- |
| `src` | string | Set avatar image source URL. |
| `srcset` | string | The source set of the avatar image. |
| `name`* | string | Provide a name or username for the avatar. |
| `base` | string | Set base styles. |
| `background` | string | Set background styles. |
| `size` | string | Set size styles. |
| `font` | string | Set font styles. |
| `border` | string | Set border styles. |
| `rounded` | string | Set border radius styles. |
| `shadow` | string | Set shadow styles. |
| `classes` | string | Provide arbitrary CSS classes. |
| `imageBase` | string | Set avatar image base styles. |
| `imageClasses` | string | Provide avatar image arbitrary CSS classes. |
| `fallbackBase` | string | Set base classes for the fallback element. |
| `fallbackClasses` | string | Provide arbitrary CSS classes to fallback element. |
| `children` | Snippet<[]> | The default child slot. |
| `ids` | Partial<{ root: string; image: string; fallback: string; }> | The ids of the elements in the avatar. Useful for composition. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `onStatusChange` | (details: StatusChangeDetails) => void | Functional called when the image loading status changes. |
| `style` | string |  |

---

# File Upload
Allow upload of files with buttons or drag and drop.

```svelte
<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
</script>

<FileUpload name="example" accept="image/*" maxFiles={2} onFileChange={console.log} onFileReject={console.error} classes="w-full" />

```

```svelte
<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconDropzone from '@lucide/svelte/icons/image-plus';
	import IconFile from '@lucide/svelte/icons/paperclip';
	import IconRemove from '@lucide/svelte/icons/circle-x';
</script>

<FileUpload
	name="example"
	accept="image/*"
	maxFiles={2}
	subtext="Attach up to 2 files."
	onFileChange={console.log}
	onFileReject={console.error}
	classes="w-full"
>
	{#snippet iconInterface()}<IconDropzone class="size-8" />{/snippet}
	{#snippet iconFile()}<IconFile class="size-4" />{/snippet}
	{#snippet iconFileRemove()}<IconRemove class="size-4" />{/snippet}
</FileUpload>

```

## Button

Use the default `children` slot to overwrite the default dropzone interface. Allow for a custom interface.

```svelte
<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconUpload from '@lucide/svelte/icons/upload';
</script>

<FileUpload name="example-button" accept="image/*" onFileChange={console.log} maxFiles={2}>
	<button class="btn preset-filled">
		<IconUpload class="size-4" />
		<span>Select File</span>
	</button>
</FileUpload>

```

## Disabled

```svelte
<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
</script>

<FileUpload classes="w-full" disabled />

```

## Bind to API

You can optionally bind to the internal [Zag component API](https://zagjs.com/components/react/file-upload#machine-api) to access additional methods such as `clearFiles()`.

```svelte
<script lang="ts">
	import { FileUpload, type FileUploadApi } from '@skeletonlabs/skeleton-svelte';

	let api: FileUploadApi;
</script>

<section class="w-full space-y-4">
	<FileUpload name="example" accept="image/*" maxFiles={2} onApiReady={(_api) => (api = _api)} />
	<button type="button" class="btn preset-filled" onclick={() => api?.clearFiles()}>Clear Files</button>
</section>

```

## RTL

```svelte
<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
</script>

<FileUpload
	name="example"
	accept="image/*"
	maxFiles={2}
	onFileChange={console.log}
	onFileReject={console.error}
	classes="w-full"
	dir="rtl"
/>

```

## Additional Features

### Accepted File Formats

```svelte
<FileUpload accept="image/*">
<FileUpload accept={"text/html": [".html", ".htm"]}>
```

### File Validation

```svelte
<FileUpload maxFiles={5}>
<FileUpload minFileSize={1024 * 1024 * 5}> <!-- 5 mb -->
<FileUpload maxFileSize={1024 * 1024 * 10}> <!-- 10 mb -->
```

### Custom Validation

```ts
function validateFileSize(file) {
	if (file.size > 1024 * 1024 * 10) return ['FILE_TOO_LARGE'];
	return null;
}
```

```svelte
<FileUpload validate={validateFileSize} onFileReject={console.error}>
```

### Events

```svelte
<FileUpload onFileChange={console.log}> <!-- Triggers when files changed. -->
<FileUpload onFileAccept={console.log}> <!-- Triggers when files are accepted. -->
<FileUpload onFileReject={console.error}> <!-- Triggers when files are rejected. -->
```

### Image Previews

```ts
function generatePreview(event) {
	const reader = new FileReader();
	reader.onload = (event) => {
		const image = event.target.result;
		// set the image as the src of an image element
	};
	reader.readAsDataURL(event.details.acceptedFiles[0]);
}
```

```svelte
<FileUpload onFileChange={generatePreview}>
```

### Miscellaneous

```svelte
<FileUpload allowDrop> <!-- Enable drag-and-drop -->
<FileUpload directory> <!-- Enable directories -->
<FileUpload capture> <!-- Enable media capture on mobile devices -->
```

## Anatomy

<Anatomy label="FileUpload" isComponent>
	<Anatomy tag="div">
		<Anatomy tag="input" />
		<Anatomy label="interface" />
	</Anatomy>
	<Anatomy label="fileList" tag="ul">
		<Anatomy label="file" tag="li">
			<Anatomy label="fileName" tag="p" />
			<Anatomy label="fileSize" tag="p" />
			<Anatomy label="fileButton" tag="button" />
		</Anatomy>
	</Anatomy>
</Anatomy>

## API Reference

### FileUpload

| Property | Type | Description |
| --- | --- | --- |
| `label` | string | Set the interface text value. |
| `subtext` | string | Set the interface subtext value. |
| `base` | string | Set root base classes |
| `classes` | string | Set root arbitrary classes |
| `interfaceBase` | string | Set interface base classes |
| `interfaceBg` | string | Set interface background classes |
| `interfaceBorder` | string | Set interface border classes |
| `interfaceBorderColor` | string | Set interface border color classes |
| `interfacePadding` | string | Set interface border classes |
| `interfaceRounded` | string | Set interface border radius classes |
| `interfaceClasses` | string | Set interface arbitrary classes |
| `interfaceIcon` | string | Set interface icon classes |
| `interfaceText` | string | Set interface text classes |
| `interfaceSubtext` | string | Set interface subtext classes |
| `filesListBase` | string | Set file list base classes |
| `filesListClasses` | string | Set file list arbitrary classes |
| `fileBase` | string | Set file base classes |
| `fileBg` | string | Set file background classes |
| `fileGap` | string | Set file gap classes |
| `filePadding` | string | Set file padding classes |
| `fileRounded` | string | Set file border-radius classes |
| `fileClasses` | string | Set file arbitrary classes |
| `fileIcon` | string | Set file icon classes |
| `fileName` | string | Set file name classes |
| `fileSize` | string | Set file size classes |
| `fileButton` | string | Set file button classes |
| `stateDisabled` | string | Set disabled state classes for the root. |
| `stateInvalid` | string | Set invalid state classes for the interface. |
| `stateDragging` | string | Set dragging state classes for the interface. |
| `children` | Snippet<[]> | The default children content. |
| `iconInterface` | Snippet<[]> | Provide an icon for the interface. |
| `iconFile` | Snippet<[]> | Provide an icon proceeding each file. |
| `iconFileRemove` | Snippet<[]> | Provide an icon for the remove file action. |
| `onApiReady` | (api: FileUploadApi) => void | Binds the Zag API for external use. |
| `ids` | Partial<{ root: string; dropzone: string; hiddenInput: string; trigger: string; label: string; item(id: string): string; itemName(id: string): string; itemSizeText(id: string): string; itemPreview(id: string): string; }> | The ids of the elements. Useful for composition. |
| `disabled` | boolean | Whether the file input is disabled |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `name` | string | The name of the underlying file input |
| `translations` | IntlTranslations | The localized messages to use. |
| `accept` | Record<string, string[]> | FileMimeType | FileMimeType[] | The accept file types |
| `required` | boolean | Whether the file input is required |
| `allowDrop` | boolean | Whether to allow drag and drop in the dropzone element Default: true |
| `maxFileSize` | number | The maximum file size in bytes Default: Infinity |
| `minFileSize` | number | The minimum file size in bytes Default: 0 |
| `maxFiles` | number | The maximum number of files Default: 1 |
| `preventDocumentDrop` | boolean | Whether to prevent the drop event on the document Default: true |
| `validate` | (file: File, details: FileValidateDetails) => FileError[] | Function to validate a file |
| `onFileChange` | (details: FileChangeDetails) => void | Function called when the value changes, whether accepted or rejected |
| `onFileAccept` | (details: FileAcceptDetails) => void | Function called when the file is accepted |
| `onFileReject` | (details: FileRejectDetails) => void | Function called when the file is rejected |
| `capture` | "user" | "environment" | The default camera to use when capturing media |
| `directory` | boolean | Whether to accept directories, only works in webkit browsers |
| `invalid` | boolean | Whether the file input is invalid |
| `locale` | string | The current locale. Based on the BCP 47 definition. Default: "en-US" |

---

# Navigation
Provides navigation interfaces for large, medium, and small screens.

## Rail

- Recommended for medium to large screens.
- Ideal for horizontal screen layouts.
- Should be fixed to the left or right of the viewport.
- Supports 3-7 tiles based on viewport height.

### Selection

Define a `value` state on the Rail. This is updated to match each Tile `id` when presssed.

```svelte
<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconFolder from '@lucide/svelte/icons/folder';
	import IconImage from '@lucide/svelte/icons/image';
	import IconMusic from '@lucide/svelte/icons/music';
	import IconVideo from '@lucide/svelte/icons/video';

	// State
	let value = $state('files');
</script>

<div class="card border-surface-100-900 grid h-[640px] w-full grid-cols-[auto_1fr] border-[1px]">
	<!-- Component -->
	<Navigation.Rail {value} onValueChange={(newValue) => (value = newValue)}>
		{#snippet tiles()}
			<Navigation.Tile id="files" label="Files"><IconFolder /></Navigation.Tile>
			<Navigation.Tile id="images" label="Images"><IconImage /></Navigation.Tile>
			<Navigation.Tile id="music" label="Music"><IconMusic /></Navigation.Tile>
			<Navigation.Tile id="videos" label="Videos"><IconVideo /></Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
	<!-- Content -->
	<div class="flex items-center justify-center">
		<pre class="pre">value: {value}</pre>
	</div>
</div>

```

### Routing

Replace Tile `id` with `href` to convert each to a anchor link.

```svelte
<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconMenu from '@lucide/svelte/icons/menu';
	import IconFolder from '@lucide/svelte/icons/folder';
	import IconImage from '@lucide/svelte/icons/image';
	import IconMusic from '@lucide/svelte/icons/music';
	import IconVideo from '@lucide/svelte/icons/video';
	import IconSettings from '@lucide/svelte/icons/settings';
</script>

<div class="card border-surface-100-900 grid h-[640px] w-full grid-cols-[auto_1fr] border-[1px]">
	<!-- Component -->
	<Navigation.Rail>
		{#snippet header()}
			<Navigation.Tile href="#" title="Menu"><IconMenu /></Navigation.Tile>
		{/snippet}
		{#snippet tiles()}
			<Navigation.Tile label="Files" href="#/files"><IconFolder /></Navigation.Tile>
			<Navigation.Tile label="Images" href="#/images"><IconImage /></Navigation.Tile>
			<Navigation.Tile label="Music" href="#/music"><IconMusic /></Navigation.Tile>
			<Navigation.Tile label="Videos" href="#/videos"><IconVideo /></Navigation.Tile>
		{/snippet}
		{#snippet footer()}
			<Navigation.Tile labelExpanded="Settings" href="#settings" title="settings"><IconSettings /></Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
	<!-- Content -->
	<div class="flex items-center justify-center">
		<p class="opacity-20">(Content)</p>
	</div>
</div>

```

### Expanded

Apply the `expanded` property to enable an expanded mode. Each tile will resize and used the expanded label.

```svelte
<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconMenu from '@lucide/svelte/icons/menu';
	import IconFolder from '@lucide/svelte/icons/folder';
	import IconImage from '@lucide/svelte/icons/image';
	import IconMusic from '@lucide/svelte/icons/music';
	import IconVideo from '@lucide/svelte/icons/video';
	import IconGames from '@lucide/svelte/icons/gamepad';
	import IconSettings from '@lucide/svelte/icons/settings';

	let isExpansed = $state(true);

	function toggleExpanded() {
		isExpansed = !isExpansed;
	}
</script>

<div class="card border-surface-100-900 grid h-[760px] w-full grid-cols-[auto_1fr] border-[1px]">
	<!-- Component -->
	<Navigation.Rail expanded={isExpansed}>
		{#snippet header()}
			<Navigation.Tile labelExpanded="Menu" onclick={toggleExpanded} title="Toggle Menu Width"><IconMenu /></Navigation.Tile>
		{/snippet}
		{#snippet tiles()}
			<Navigation.Tile labelExpanded="Browse Files" href="#/files">
				<IconFolder />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Browse Images" href="#/images">
				<IconImage />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Browse Music" href="#/music">
				<IconMusic />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Browse Videos" href="#/videos">
				<IconVideo />
			</Navigation.Tile>
			<Navigation.Tile labelExpanded="Browse Games" href="/games">
				<IconGames />
			</Navigation.Tile>
		{/snippet}
		{#snippet footer()}
			<Navigation.Tile labelExpanded="Settings" href="/settings" title="Settings"><IconSettings /></Navigation.Tile>
		{/snippet}
	</Navigation.Rail>
	<!-- Content -->
	<div class="flex items-center justify-center">
		<p class="opacity-20">(Content)</p>
	</div>
</div>

```

## Bar

- Recommended for small screens.
- Ideal for vertical screen layouts.
- Should be fixed to the bottom of the viewport.
- Supports 3-5 tiles based on viewport width.
- Consider progressive enhancement with the [Virtual Keyboard API](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API).

### Selection

Define a `value` state on the Bar. This is updated to match each Tile `id` when presssed.

```svelte
<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconFolder from '@lucide/svelte/icons/folder';
	import IconImage from '@lucide/svelte/icons/image';
	import IconMusic from '@lucide/svelte/icons/music';
	import IconVideo from '@lucide/svelte/icons/video';

	// State
	let value = $state('files');
</script>

<div class="card border-surface-100-900 grid h-[512px] w-[320px] grid-rows-[1fr_auto] border-[1px]">
	<!-- Content -->
	<div class="flex items-center justify-center">
		<pre class="pre">value: {value}</pre>
	</div>
	<!-- Component -->
	<Navigation.Bar {value} onValueChange={(newValue) => (value = newValue)}>
		<Navigation.Tile id="files" label="Files"><IconFolder /></Navigation.Tile>
		<Navigation.Tile id="images" label="Images"><IconImage /></Navigation.Tile>
		<Navigation.Tile id="music" label="Music"><IconMusic /></Navigation.Tile>
		<Navigation.Tile id="videos" label="Videos"><IconVideo /></Navigation.Tile>
	</Navigation.Bar>
</div>

```

### Routing

Replace Tile `id` with `href` to convert each to a anchor link.

```svelte
<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconFolder from '@lucide/svelte/icons/folder';
	import IconImage from '@lucide/svelte/icons/image';
	import IconMusic from '@lucide/svelte/icons/music';
	import IconVideo from '@lucide/svelte/icons/video';
</script>

<div class="card border-surface-100-900 grid h-[512px] w-[320px] grid-rows-[1fr_auto] border-[1px]">
	<!-- Content -->
	<div class="flex items-center justify-center">
		<p class="opacity-20">(Content)</p>
	</div>
	<!-- Component -->
	<Navigation.Bar>
		<Navigation.Tile label="Files" href="#/files"><IconFolder /></Navigation.Tile>
		<Navigation.Tile label="Images" href="#/images"><IconImage /></Navigation.Tile>
		<Navigation.Tile label="Music" href="#/music"><IconMusic /></Navigation.Tile>
		<Navigation.Tile label="Videos" href="#/videos"><IconVideo /></Navigation.Tile>
	</Navigation.Bar>
</div>

```

## Tiles

Tiles are universal between Rails and Bars. They default to buttons, but will convert to anchors when an `href` is provided. When implementing `value` for selection, each item will update the value when clicked.

```svelte
<script lang="ts">
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import IconBox from '@lucide/svelte/icons/box';
</script>

<div class="card preset-filled-surface-100-900 grid grid-cols-3 gap-5 p-5">
	<!-- By default tiles are <button> elements -->
	<Navigation.Tile id="0" label="Button">
		<IconBox />
	</Navigation.Tile>
	<!-- Add selected to button tiles to enable the active state -->
	<Navigation.Tile id="0" label="Button" selected>
		<IconBox />
	</Navigation.Tile>
	<!-- When adding an href, they are converted to anchors -->
	<Navigation.Tile label="Anchor" href="#">
		<IconBox />
	</Navigation.Tile>
</div>

```

### Anchor Tile Selection

When using anchor Tiles, use the `selected` prop to highlight the active tile. For SvelteKit, this can be achieved using the `page` state and comparing the page pathname and tile URLs.

<Code code={ExampleTilesSelectionRaw} lang="svelte" />

## Anatomy

### Rail

<Anatomy label="Navigation.Rail" tag="aside" isComponent>
	<Anatomy label="header" />
	<Anatomy label="tiles">
		<Anatomy label="Navigation.Tile" tag="a|button" isComponent>
			<Anatomy label="expanded">
				<Anatomy label="label|labelExpanded" />
			</Anatomy>
		</Anatomy>
	</Anatomy>
	<Anatomy label="footer" />
</Anatomy>

### Bar

<Anatomy label="Navigation.Bar" tag="aside" isComponent>
	<Anatomy label="tiles">
		<Anatomy label="Navigation.Tile" tag="a|button" isComponent>
			<Anatomy label="expanded">
				<Anatomy label="label|labelExpanded" />
			</Anatomy>
		</Anatomy>
	</Anatomy>
</Anatomy>

## API Reference

### NavCommon

| Property | Type | Description |
| --- | --- | --- |
| `value` | string |  |
| `base` | string | Set base styles. |
| `background` | string | Set background classes. |
| `padding` | string | Set padding classes. |
| `width` | string | Set width classes. |
| `widthExpanded` | string | Set width classes for expanded mode. |
| `height` | string | Set width classes. |
| `classes` | string | Provide arbitrary CSS classes. |
| `tilesBase` | string | Set base classes. |
| `tilesFlexDirection` | string | Set flex direction classes. |
| `tilesJustify` | string | Set flex justify classes. |
| `tilesItems` | string | Set flex align classes. |
| `tilesGap` | string | Set gap classes. |
| `tilesClasses` | string | Provide arbitrary CSS classes. |
| `onValueChange` | (id: string) => void | Triggers when selection occurs. |

### NavBar

| Property | Type | Description |
| --- | --- | --- |
| `children` | Snippet<[]> | The default children snippet. |
| `value` | string |  |
| `base` | string | Set base styles. |
| `background` | string | Set background classes. |
| `padding` | string | Set padding classes. |
| `width` | string | Set width classes. |
| `widthExpanded` | string | Set width classes for expanded mode. |
| `height` | string | Set width classes. |
| `classes` | string | Provide arbitrary CSS classes. |
| `tilesBase` | string | Set base classes. |
| `tilesFlexDirection` | string | Set flex direction classes. |
| `tilesJustify` | string | Set flex justify classes. |
| `tilesItems` | string | Set flex align classes. |
| `tilesGap` | string | Set gap classes. |
| `tilesClasses` | string | Provide arbitrary CSS classes. |
| `onValueChange` | (id: string) => void | Triggers when selection occurs. |

### NavRail

| Property | Type | Description |
| --- | --- | --- |
| `expanded` | boolean | Enabled expanded mode. |
| `headerBase` | string | Set base classes. |
| `headerFlexDirection` | string | Set flex direction classes. |
| `headerJustify` | string | Set flex justify classes. |
| `headerItems` | string | Set flex align classes. |
| `headerGap` | string | Set gap classes. |
| `headerClasses` | string | Provide arbitrary CSS classes. |
| `footerBase` | string | Set base classes. |
| `footerFlexDirection` | string | Set flex direction classes. |
| `footerJustify` | string | Set flex justify classes. |
| `footerItems` | string | Set flex align classes. |
| `footerGap` | string | Set gap classes. |
| `footerClasses` | string | Provide arbitrary CSS classes. |
| `header` | Snippet<[]> | The header snippet. |
| `tiles` | Snippet<[]> | The tiles snippet. |
| `footer` | Snippet<[]> | The footer snippet. |
| `value` | string |  |
| `base` | string | Set base styles. |
| `background` | string | Set background classes. |
| `padding` | string | Set padding classes. |
| `width` | string | Set width classes. |
| `widthExpanded` | string | Set width classes for expanded mode. |
| `height` | string | Set width classes. |
| `classes` | string | Provide arbitrary CSS classes. |
| `tilesBase` | string | Set base classes. |
| `tilesFlexDirection` | string | Set flex direction classes. |
| `tilesJustify` | string | Set flex justify classes. |
| `tilesItems` | string | Set flex align classes. |
| `tilesGap` | string | Set gap classes. |
| `tilesClasses` | string | Provide arbitrary CSS classes. |
| `onValueChange` | (id: string) => void | Triggers when selection occurs. |

### NavTile

| Property | Type | Description |
| --- | --- | --- |
| `id` | string | Provide a unique ID. |
| `href` | string | Provide an href link; turns Tiles into an anchor |
| `target` | string | Set the href target attribute. |
| `label` | string | Provide the label text. |
| `labelExpanded` | string | Provide a longer label in expanded mode. |
| `title` | string | Provile a title attribute. |
| `selected` | boolean | Enable the active selected state. |
| `type` | "button" | "submit" | "reset" | Set button type. |
| `base` | string | Set base styles. |
| `width` | string | Set width classes. |
| `aspect` | string | Set aspect ratio classes. |
| `background` | string | Set background classes. |
| `hover` | string | Set hover classes. |
| `active` | string | Set active classes. |
| `padding` | string | Set padding classes. |
| `gap` | string | Set gap classes. |
| `rounded` | string | Set rounded classes. |
| `classes` | string | Provide arbitrary CSS classes. |
| `expandedPadding` | string | Set padding classes for expanded mode. |
| `expandedGap` | string | Set gap classes for expanded mode. |
| `expandedClasses` | string | Provide arbitrary CSS classes for expanded mode. |
| `labelBase` | string | Set base classes. |
| `labelClasses` | string | Provide arbitrary CSS classes. |
| `labelExpandedBase` | string | Set base classes. |
| `labelExpandedClasses` | string | Provide arbitrary CSS classes. |
| `onclick` | (id: string) => void | Triggers when the tile is clicked. |
| `children` | Snippet<[]> | The default slot, used for icons. |

---

# Pagination
Navigate between multiple pages of content.

```svelte
<script lang="ts">
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconArrowLeft from '@lucide/svelte/icons/arrow-left';
	import IconArrowRight from '@lucide/svelte/icons/arrow-right';
	import IconEllipsis from '@lucide/svelte/icons/ellipsis';
	import IconFirst from '@lucide/svelte/icons/chevrons-left';
	import IconLast from '@lucide/svelte/icons/chevron-right';

	interface SourceData {
		position: number;
		name: string;
		weight: number;
		symbol: string;
	}

	let sourceData: SourceData[] = $state([
		{ position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
		{ position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
		{ position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
		{ position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
		{ position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
		{ position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
		{ position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
		{ position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
		{ position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
		{ position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' }
	]);

	// State
	let page = $state(1);
	let size = $state(5);
	const slicedSource = $derived((s: SourceData[]) => s.slice((page - 1) * size, page * size));
</script>

<section class="space-y-4">
	<!-- Table -->
	<div class="table-wrap">
		<table class="table table-fixed caption-bottom">
			<thead>
				<tr>
					<th>Position</th>
					<th>Name</th>
					<th>Weight</th>
					<th class="!text-right">Symbol</th>
				</tr>
			</thead>
			<tbody class="[&>tr]:hover:preset-tonal-primary">
				{#each slicedSource(sourceData) as row}
					<tr>
						<td>{row.position}</td>
						<td>{row.name}</td>
						<td>{row.weight}</td>
						<td class="text-right">{row.symbol}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<!-- Footer -->
	<footer class="flex justify-between">
		<select name="size" id="size" class="select max-w-[150px]" value={size} onchange={(e) => (size = Number(e.currentTarget.value))}>
			{#each [1, 2, 5] as v}
				<option value={v}>Items {v}</option>
			{/each}
			<option value={sourceData.length}>Show All</option>
		</select>
		<!-- Pagination -->
		<Pagination
			data={sourceData}
			{page}
			onPageChange={(e) => (page = e.page)}
			pageSize={size}
			onPageSizeChange={(e) => (size = e.pageSize)}
			siblingCount={4}
		>
			{#snippet labelEllipsis()}<IconEllipsis class="size-4" />{/snippet}
			{#snippet labelNext()}<IconArrowRight class="size-4" />{/snippet}
			{#snippet labelPrevious()}<IconArrowLeft class="size-4" />{/snippet}
			{#snippet labelFirst()}<IconFirst class="size-4" />{/snippet}
			{#snippet labelLast()}<IconLast class="size-4" />{/snippet}
		</Pagination>
	</footer>
</section>

```

## Alternative UI

Display an alternative interface using the `alternative` property.

```svelte
<script lang="ts">
	import { Pagination } from '@skeletonlabs/skeleton-svelte';

	const sourceData = [{ id: 0 }, { id: 1 }, { id: 3 }, { id: 4 }];
</script>

<Pagination data={sourceData} count={sourceData.length} page={1} pageSize={3} alternative />

```

## Handling Total Count

If your source data is pre-truncated (ex: server-side pagination). Make sure to specify the total item `count`.

```json
// Mock Server Response
pagination: {
	"page": 1,
	"limit": 2,
	"pages": 1,
	"total": 1, // <----
	"next": null,
	"prev": null
}
```

```svelte
<Pagination count={pagination.total} ... />
```

## Anatomy

<Anatomy label="Pagination" isComponent>
	<Anatomy label="button" descriptor="(first)" tag="button" />
	<Anatomy label="button" descriptor="(numerals)" tag="button" />
	<Anatomy label="button" descriptor="(ellipsis)" tag="span" />
	<Anatomy label="button" descriptor="(last)" tag="button" />
</Anatomy>

## API Reference

### Pagination

| Property | Type | Description |
| --- | --- | --- |
| `data`* | unknown[] | Provide source data as an array. |
| `alternative` | boolean | Enables alternative display with stats and first/last buttons. |
| `textSeparator` | string | Set the separator text or character, such as "of" in "X of Y". |
| `showFirstLastButtons` | boolean | Show first and last page button. |
| `base` | string | Sets base classes for the list. |
| `background` | string | Sets background classes for the list. |
| `border` | string | Sets border classes for the list. |
| `gap` | string | Sets gap classes for the list. |
| `padding` | string | Sets padding classes for the list. |
| `rounded` | string | Sets border radius classes for the list. |
| `classes` | string | Provide arbitrary CSS classes for the root. |
| `titleFirst` | string | Set an optional title for the first button. |
| `titlePrevious` | string | Set an optional title for the previous button. |
| `titleNumeral` | string | Set an optional title for the numeral buttons (ex: Page 1). |
| `titleNext` | string | Set an optional title for the next button. |
| `titleLast` | string | Set an optional title for the last button. |
| `buttonBase` | string | Sets base classes for buttons. |
| `buttonActive` | string | Sets active state classes for buttons. |
| `buttonInactive` | string | Sets inactive state classes for buttons. |
| `buttonHover` | string | Sets hover state classes for buttons. |
| `buttonClasses` | string | Provide arbitrary CSS classes for buttons. |
| `labelFirst` | Snippet<[]> | Set button icon or label for first button. |
| `labelPrevious` | Snippet<[]> | Set button icon or label for previous button. |
| `labelEllipsis` | Snippet<[]> | Set button icon or label for ellipsis. |
| `labelNext` | Snippet<[]> | Set button icon or label for next button. |
| `labelLast` | Snippet<[]> | Set button icon or label for last button. |
| `ids` | Partial<{ root: string; ellipsis(index: number): string; prevTrigger: string; nextTrigger: string; item(page: number): string; }> | The ids of the elements in the accordion. Useful for composition. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `translations` | IntlTranslations | Specifies the localized strings that identifies the accessibility elements and their states |
| `count` | number | Total number of data items |
| `pageSize` | number | The controlled number of data items per page |
| `defaultPageSize` | number | The initial number of data items per page when rendered. Use when you don't need to control the page size of the pagination. Default: 10 |
| `siblingCount` | number | Number of pages to show beside active page Default: 1 |
| `page` | number | The controlled active page |
| `defaultPage` | number | The initial active page when rendered. Use when you don't need to control the active page of the pagination. Default: 1 |
| `onPageChange` | (details: PageChangeDetails) => void | Called when the page number is changed |
| `onPageSizeChange` | (details: PageSizeChangeDetails) => void | Called when the page size is changed |
| `type` | "button" | "link" | The type of the trigger element Default: "button" |

---

# Progress
An indicator showing the progress or completion of a task.

```svelte
<script>
	import { Progress } from '@skeletonlabs/skeleton-svelte';
</script>

<Progress value={50} max={100}>50%</Progress>

```

## Colors

Set the color using the `meterBg` prop.

```svelte
<script>
	import { Progress } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="flex w-full flex-col gap-8">
	<Progress value={50} max={100} meterBg="bg-primary-500" />
	<Progress value={50} max={100} meterBg="bg-secondary-500" />
	<Progress value={50} max={100} meterBg="bg-tertiary-500" />
</div>

```

## Height

Set the height using the `height` prop.

```svelte
<script>
	import { Progress } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="flex w-full flex-col gap-8">
	<Progress value={50} max={100} height="h-1" />
	<Progress value={50} max={100} />
	<Progress value={50} max={100} height="h-4" />
</div>

```

## Indeterminate

An indeterminate animation will be shown when the value is set to `null`.

```svelte
<script>
	import { Progress } from '@skeletonlabs/skeleton-svelte';
</script>

<Progress value={null} />

```

### Custom Animations

A custom indeterminate animation can be set by providing an animation class to the `meterAnimate` prop.

```svelte
<script>
	import { Progress } from '@skeletonlabs/skeleton-svelte';
</script>

<Progress value={null} meterAnimate="my-custom-animation" />

<style>
	/*
		Note: The `:global` modifier is used to apply the
		animation to the progress bar because Svelte styles
		are scoped by default.
	*/
	:global(.my-custom-animation) {
		animation: my-custom-animation 2s ease-in-out infinite;
	}
	@keyframes my-custom-animation {
		0% {
			translate: -100%;
		}
		25% {
			scale: 1;
		}
		50% {
			scale: 0.5 1;
			translate: 0%;
		}
		75% {
			scale: 1;
		}
		100% {
			translate: 100%;
		}
	}
</style>

```

---

## Native Alternative

A native [progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) element is available cross browser, but does not support indeterminate animations.

```svelte
<progress class="progress" value="50" max="100"></progress>

```

## Anatomy

<Anatomy label="Progress" tag="figure" isComponent>
	<Anatomy label="label" />
	<Anatomy label="track">
		<Anatomy label="meter" />
	</Anatomy>
</Anatomy>

## API Reference

### Progress

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Set root base classes |
| `bg` | string | Set root background classes |
| `width` | string | Set root width classes |
| `height` | string | Set root height classes |
| `rounded` | string | Set root rounded classes |
| `classes` | string | Set root arbitrary classes |
| `labelBase` | string | Set label base classes. |
| `labelText` | string | Set label text classes. |
| `labelClasses` | string | Set label classes. |
| `trackBase` | string | Set the track base classes. |
| `trackBg` | string | Set the track background classes. |
| `trackRounded` | string | Set the track border radius classes. |
| `trackClasses` | string | Set arbitrary track classes. |
| `meterBase` | string | Set meter base classes. |
| `meterBg` | string | Set meter bg classes |
| `meterRounded` | string | Set meter rounded classes. |
| `meterTransition` | string | Set meter transition classes. |
| `meterAnimate` | string | Set meter animation classes for indeterminate mode. (value === undefined) |
| `meterClasses` | string | Set meter arbitrary classes. |
| `children` | Snippet<[]> | Set the label |
| `orientation` | "horizontal" | "vertical" | The orientation of the element. Default: "horizontal" |
| `ids` | Partial<{ root: string; track: string; label: string; circle: string; }> | The ids of the elements in the progress bar. Useful for composition. |
| `value` | number | The controlled value of the progress bar. |
| `defaultValue` | number | The initial value of the progress bar when rendered. Use when you don't need to control the value of the progress bar. Default: 50 |
| `onValueChange` | (details: ValueChangeDetails) => void | Callback fired when the value changes. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `translations` | IntlTranslations | The localized messages to use. |
| `locale` | string | The locale to use for formatting the value. Default: "en-US" |
| `min` | number | The minimum allowed value of the progress bar. Default: 0 |
| `max` | number | The maximum allowed value of the progress bar. Default: 100 |
| `formatOptions` | NumberFormatOptions | The options to use for formatting the value. Default: { style: "percent" } |

---

# Progress Ring
A radial indicator showing progress or completion of a task.

```svelte
<script lang="ts">
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';

	let value = $state(25);
	let max = 100;
</script>

<div class="grid grid-cols-1 gap-4 justify-center">
	<ProgressRing {value} onValueChange={(e) => (value = e.value)} {max} />
	<input type="range" class="input max-w-32" bind:value {max} />
</div>

```

## Label

Display an auto-scaled percentage label using the `showLabel` prop.

```svelte
<script lang="ts">
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="grid grid-cols-1 gap-4 justify-center">
	<ProgressRing value={25} max={100} showLabel />
</div>

```

## Icons

Provide icons or other content using the `children` snippet.

```svelte
<script lang="ts">
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import IconThermometer from '@lucide/svelte/icons/thermometer-sun';
</script>

<ProgressRing value={60} max={100} meterStroke="stroke-error-500" strokeLinecap="butt">
	<IconThermometer size={48} />
</ProgressRing>

```

## Indeterminate

Uses indeterminate mode when `value` is explicitly set to `null`.

```svelte
<script lang="ts">
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
</script>

<ProgressRing value={null} size="size-14" meterStroke="stroke-tertiary-600-400" trackStroke="stroke-tertiary-50-950" />

```

## Anatomy

<Anatomy label="ProgressRing" tag="figure" isComponent>
	<Anatomy label="children" />
	<Anatomy label="svg" tag="svg">
		<Anatomy label="track" tag="circle" />
		<Anatomy label="meter" tag="circle" />
		<Anatomy label="label" tag="text" />
	</Anatomy>
</Anatomy>

## API Reference

The Progress Ring component is an SVG-based element where all internal elements are drawn **relative** to the SVG's size.

For example, the `strokeWidth` property can accept a pixel (px) value, but this value is scaled proportionally to the size of the SVG rather than being an absolute pixel measurement.

### ProgressRing

| Property | Type | Description |
| --- | --- | --- |
| `label` | string | Set the text for the scalable label |
| `showLabel` | boolean | When enabled, show a text label with the percentage amount |
| `strokeWidth` | string | Set the stroke size (ex: 15px) |
| `strokeLinecap` | "inherit" | "butt" | "round" | "square" | Defines the shape of the meter |
| `base` | string | Set the root base classes |
| `size` | string | Set the root size classes |
| `classes` | string | Provide arbitrary classes to the root element |
| `childrenBase` | string | Set the nested children base classes |
| `childrenClasses` | string | Provide arbitrary classes to the nested children. |
| `svgBase` | string | Set the SVG element base classes |
| `svgClasses` | string | Provide arbitrary classes to the SVG element |
| `trackBase` | string | Set the track base classes |
| `trackStroke` | string | Set the track stroke color classes |
| `trackClasses` | string | Provide arbitrary classes to the track element |
| `meterBase` | string | Set the meter base classes |
| `meterStroke` | string | Set the meter stroke color classes |
| `meterTransition` | string | Set the meter transition classes |
| `meterAnimate` | string | Set the meter animation classes |
| `meterDuration` | string | Set the meter transition duration classes |
| `meterClasses` | string | Provide arbitrary classes to the meter element |
| `labelBase` | string | Set the label classes |
| `labelFill` | string | Set the label fill color classes |
| `labelFontSize` | number | Set the label font size |
| `labelFontWeight` | string | Set the label font weight |
| `labelClasses` | string | Provide arbitrary classes to the label element |
| `children` | Snippet<[]> | The default child slot. |
| `orientation` | "horizontal" | "vertical" | The orientation of the element. Default: "horizontal" |
| `ids` | Partial<{ root: string; track: string; label: string; circle: string; }> | The ids of the elements in the progress bar. Useful for composition. |
| `value` | number | The controlled value of the progress bar. |
| `defaultValue` | number | The initial value of the progress bar when rendered. Use when you don't need to control the value of the progress bar. Default: 50 |
| `onValueChange` | (details: ValueChangeDetails) => void | Callback fired when the value changes. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `translations` | IntlTranslations | The localized messages to use. |
| `locale` | string | The locale to use for formatting the value. Default: "en-US" |
| `min` | number | The minimum allowed value of the progress bar. Default: 0 |
| `max` | number | The maximum allowed value of the progress bar. Default: 100 |
| `formatOptions` | NumberFormatOptions | The options to use for formatting the value. Default: { style: "percent" } |

---

# Rating
Create an visual representation of a numeric range.

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';

	// You may optionally bind to a state rune
	let starValue = $state(2);
</script>

<Rating value={starValue} onValueChange={(e) => (starValue = e.value)} />

```

## Count

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';
</script>

<Rating count={3} value={2}></Rating>

```

## Custom Icons

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';
	import { Bone, Skull } from '@lucide/svelte';
</script>

<Rating value={2}>
	{#snippet iconEmpty()}
		<Bone size={24} />
	{/snippet}
	{#snippet iconFull()}
		<Skull size={24} />
	{/snippet}
</Rating>

```

## Allow Half

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';
</script>

<Rating value={2} allowHalf></Rating>

```

## Disabled

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';
</script>

<Rating value={2} disabled></Rating>

```

## Read-Only

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';
</script>

<Rating value={2} readOnly></Rating>

```

## RTL

```svelte
<script lang="ts">
	import { Rating } from '@skeletonlabs/skeleton-svelte';
</script>

<Rating value={2} dir="rtl"></Rating>

```

## Anatomy

<Anatomy label="Ratings" isComponent>
	<Anatomy label="label" />
	<Anatomy label="control">
		<Anatomy label="item" tag="span">
			<Anatomy tag="svg" />
		</Anatomy>
	</Anatomy>
</Anatomy>

## API Reference

### Rating

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Set root base classes |
| `gap` | string | Set root gap classes |
| `classes` | string | Set root arbitrary classes |
| `controlBase` | string | Set control base classes |
| `controlGap` | string | Set control gap classes |
| `controlClasses` | string | Set control arbitrary classes |
| `labelBase` | string | Set label base classes |
| `labelClasses` | string | Set label arbitrary classes |
| `itemBase` | string | Set item base classes |
| `itemClasses` | string | Set item arbitrary classes |
| `stateReadOnly` | string | Set item read-only state classes |
| `stateDisabled` | string | Set item disabled state classes |
| `iconEmpty` | Snippet<[]> | Set the empty icon snippet |
| `iconHalf` | Snippet<[]> | Set the half icon snippet |
| `iconFull` | Snippet<[]> | Set the full icon snippet |
| `label` | Snippet<[]> | Set the label snippet |
| `ids` | Partial<{ root: string; label: string; hiddenInput: string; control: string; item(id: string): string; }> | The ids of the elements in the rating. Useful for composition. |
| `value` | number | The controlled value of the rating |
| `defaultValue` | number | The initial value of the rating when rendered. Use when you don't need to control the value of the rating. |
| `disabled` | boolean | Whether the rating is disabled. |
| `onValueChange` | (details: ValueChangeDetails) => void | Function to be called when the rating value changes. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `name` | string | The name attribute of the rating element (used in forms). |
| `translations` | IntlTranslations | Specifies the localized strings that identifies the accessibility elements and their states |
| `required` | boolean | Whether the rating is required. |
| `count` | number | The total number of ratings. Default: 5 |
| `form` | string | The associate form of the underlying input element. |
| `readOnly` | boolean | Whether the rating is readonly. |
| `allowHalf` | boolean | Whether to allow half stars. |
| `autoFocus` | boolean | Whether to autofocus the rating. |
| `onHoverChange` | (details: HoverChangeDetails) => void | Function to be called when the rating value is hovered. |

---

# Segment Control
Capture input for a limited set of options.

```svelte
<script lang="ts">
	import { Segment } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconLeft from '@lucide/svelte/icons/align-left';
	import IconCenter from '@lucide/svelte/icons/align-center';
	import IconRight from '@lucide/svelte/icons/align-right';
	import IconJustify from '@lucide/svelte/icons/align-justify';

	let align = $state('left');
</script>

<Segment name="align" value={align} onValueChange={(e) => (align = e.value)}>
	<Segment.Item value="left">
		<IconLeft />
	</Segment.Item>
	<Segment.Item value="center">
		<IconCenter />
	</Segment.Item>
	<Segment.Item value="right">
		<IconRight />
	</Segment.Item>
	<Segment.Item value="justify">
		<IconJustify />
	</Segment.Item>
</Segment>

```

## States

### Disable Group

```svelte
<script lang="ts">
	import { Segment } from '@skeletonlabs/skeleton-svelte';

	let size = $state('sm');
</script>

<Segment name="size" value={size} onValueChange={(e) => (size = e.value)} disabled>
	<Segment.Item value="sm">sm</Segment.Item>
	<Segment.Item value="md">md</Segment.Item>
	<Segment.Item value="lg">lg</Segment.Item>
</Segment>

```

### Disable Item

```svelte
<script lang="ts">
	import { Segment } from '@skeletonlabs/skeleton-svelte';

	let size = $state('sm');
</script>

<Segment name="size" value={size} onValueChange={(e) => (size = e.value)}>
	<Segment.Item value="sm">sm</Segment.Item>
	<Segment.Item value="md" disabled>md</Segment.Item>
	<Segment.Item value="lg">lg</Segment.Item>
</Segment>

```

### Read-Only Group

```svelte
<script lang="ts">
	import { Segment } from '@skeletonlabs/skeleton-svelte';

	let size = $state('sm');
</script>

<Segment name="size" value={size} onValueChange={(e) => (size = e.value)} readOnly>
	<Segment.Item value="sm">sm</Segment.Item>
	<Segment.Item value="md">md</Segment.Item>
	<Segment.Item value="lg">lg</Segment.Item>
</Segment>

```

## Orientation

Set `orientation="vertical"` to enable a vertical layout.

```svelte
<script lang="ts">
	import { Segment } from '@skeletonlabs/skeleton-svelte';

	let size = $state('sm');
</script>

<Segment name="size" value={size} onValueChange={(e) => (size = e.value!)} orientation="vertical">
	<Segment.Item value="sm">Small</Segment.Item>
	<Segment.Item value="md">Medium</Segment.Item>
	<Segment.Item value="lg">Large</Segment.Item>
</Segment>

```

## Alternative

Consider using a Skeleton [Button Group](/docs/tailwind/buttons#group) if you need finer grain control over the markup and styling.

```svelte
<nav class="btn-group preset-outlined-surface-200-800 flex-col p-2 md:flex-row">
	<button type="button" class="btn preset-filled">January</button>
	<button type="button" class="btn hover:preset-tonal">February</button>
	<button type="button" class="btn hover:preset-tonal">March</button>
</nav>

```

## Anatomy

<Anatomy label="Segment" isComponent>
	<Anatomy label="indicator" />
	<Anatomy label="Segment.item" tag="label" isComponent>
		<Anatomy label="label" tag="span" />
		<Anatomy tag="input" />
	</Anatomy>
</Anatomy>

## API Reference

### Segment

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Sets base classes. |
| `background` | string | Set background classes. |
| `border` | string | Set border classes. |
| `flexDirection` | string | Set flex direction classes. |
| `gap` | string | Set gap classes. |
| `padding` | string | Set padding classes. |
| `rounded` | string | Set rounded classes. |
| `width` | string | Set width classes. |
| `classes` | string | Provide arbitrary CSS classes. |
| `orientVertical` | string | Set classes to provide a vertical layout. |
| `orientHorizontal` | string | Set classes to provide a horizontal layout. |
| `stateDisabled` | string | Set classes for the disabled state. |
| `stateReadOnly` | string | Set classes for the read-only state. |
| `indicatorBase` | string | Sets base classes to the indicator. |
| `indicatorBg` | string | Sets background classes to the indicator. |
| `indicatorText` | string | Sets text classes to the indicator. |
| `indicatorRounded` | string | Sets border radius classes to the indicator. |
| `indicatorClasses` | string | Provide arbitrary CSS classes to the indicator. |
| `labelledby` | string | Set aria-labelledby for element |
| `children` | Snippet<[]> | The default child slot. |
| `orientation` | "horizontal" | "vertical" | Orientation of the radio group |
| `ids` | Partial<{ root: string; label: string; indicator: string; item(value: string): string; itemLabel(value: string): string; itemControl(value: string): string; itemHiddenInput(value: string): string; }> | The ids of the elements in the radio. Useful for composition. |
| `value` | string | The controlled value of the radio group |
| `defaultValue` | string | The initial value of the checked radio when rendered. Use when you don't need to control the value of the radio group. |
| `disabled` | boolean | If `true`, the radio group will be disabled |
| `onValueChange` | (details: ValueChangeDetails) => void | Function called once a radio is checked |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `name` | string | The name of the input fields in the radio (Useful for form submission). |
| `form` | string | The associate form of the underlying input. |
| `readOnly` | boolean | Whether the checkbox is read-only |

### SegmentItem

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Sets base classes. |
| `classes` | string | Provide arbitrary CSS classes. |
| `stateDisabled` | string | Set classes for the disabled state. |
| `stateFocused` | string | Set classes for the focus state. |
| `labelBase` | string | Sets base classes for the label element. |
| `labelClasses` | string | Provide arbitrary CSS classes for the label element. |
| `children` | Snippet<[]> | The default child slot. |
| `value`* | string |  |
| `disabled` | boolean |  |

---

# Slider
Capture input from a range of values.

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state([40]);
</script>

<Slider name="example" {value} onValueChange={(e) => (value = e.value)} />

```

## Multiple Handles

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let valueMulti = $state([40, 60]);
</script>

<Slider value={valueMulti} onValueChange={(e) => (valueMulti = e.value)} />

```

## Markers

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state([40]);
</script>

<Slider {value} onValueChange={(e) => (value = e.value)} markers={[25, 50, 75]} />

```

## Height & Size

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state([40]);
</script>

<section class="w-full space-y-8">
	<Slider name="value" {value} onValueChange={(e) => (value = e.value)} height="h-1" />
	<Slider name="value" {value} onValueChange={(e) => (value = e.value)} height="h-6" thumbSize="size-8" />
</section>

```

## Colors

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state([40]);
</script>

<section class="w-full space-y-8">
	<Slider {value} onValueChange={(e) => (value = e.value)} meterBg="bg-primary-500" thumbRingColor="ring-primary-500" />
	<Slider {value} onValueChange={(e) => (value = e.value)} meterBg="bg-secondary-500" thumbRingColor="ring-secondary-500" />
	<Slider {value} onValueChange={(e) => (value = e.value)} meterBg="bg-tertiary-500" thumbRingColor="ring-tertiary-500" />
</section>

```

## State

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state([40]);
</script>

<section class="w-full space-y-4">
	<p>Disabled</p>
	<Slider name="value" {value} onValueChange={(e) => (value = e.value)} disabled />
	<p>Read-Only</p>
	<Slider name="value" {value} onValueChange={(e) => (value = e.value)} readOnly />
</section>

```

## RTL

```svelte
<script lang="ts">
	import { Slider } from '@skeletonlabs/skeleton-svelte';

	let value = $state([40]);
	let valueMulti = $state([40, 60]);
</script>

<section class="w-full space-y-8">
	<Slider {value} onValueChange={(e) => (value = e.value)} dir="rtl" />
	<Slider value={valueMulti} onValueChange={(e) => (valueMulti = e.value)} dir="rtl" />
</section>

```

## Usage Within Forms

Make sure to add a unique `name` property.

## Anatomy

<Anatomy label="Slider" isComponent>
	<Anatomy label="control">
		<Anatomy label="track">
			<Anatomy label="meter" />
		</Anatomy>
		<Anatomy tag="div">
			<Anatomy tag="div">
				<Anatomy label="thumb" />
				<Anatomy tag="input" />
			</Anatomy>
		</Anatomy>
	</Anatomy>
	<Anatomy label="markers">
		<Anatomy label="mark" tag="span" />
	</Anatomy>
</Anatomy>

## API Reference

### Slider

| Property | Type | Description |
| --- | --- | --- |
| `markers` | number[] | Provide an array of value markers |
| `height` | string | Set height classes for the overall slider. |
| `base` | string | Set base classes. |
| `spaceY` | string | Set vertical spacing between the control and markers. |
| `classes` | string | Provide arbitrary classes for the root. |
| `controlBase` | string | Set base classes for the control. |
| `controlClasses` | string | Provide arbitrary classes for the control. |
| `trackBase` | string | Set base classes for the track. |
| `trackBg` | string | Set background classes for the track. |
| `trackRounded` | string | Set border radius classes for the track. |
| `trackClasses` | string | Provide arbitrary classes for the track. |
| `meterBase` | string | Set base classes for the meter. |
| `meterBg` | string | Set background classes for the meter. |
| `meterRounded` | string | Set border radius classes for the meter. |
| `meterClasses` | string | Provide arbitrary classes for the meter. |
| `thumbBase` | string | Set base classes for the thumb. |
| `thumbSize` | string | Set size classes for the thumb. |
| `thumbBg` | string | Set background classes for the thumb. |
| `thumbRingSize` | string | Set ring size classes for the thumb. |
| `thumbRingColor` | string | Set ring color classes for the thumb. |
| `thumbRounded` | string | Set border-radius classes for the thumb. |
| `thumbCursor` | string | Set cursor classes for the thumb. |
| `thumbClasses` | string | Provide arbitrary classes for the thumb. |
| `markersBase` | string | Set base classes for the markers. |
| `markersClasses` | string | Provide arbitrary classes for the markers. |
| `markBase` | string | Set base classes for each mark. |
| `markText` | string | Set text size classes for each mark. |
| `markOpacity` | string | Set opacity classes for each mark. |
| `markClasses` | string | Provide arbitrary classes for each mark. |
| `stateDisabled` | string | Set disabled state classes for the root element. |
| `stateReadOnly` | string | Set read-only state classes for the root element. |
| `mark` | Snippet<[number]> | Replace numeric markers with symbol, such as a icon. Takes marker value as argument. |
| `orientation` | "horizontal" | "vertical" | The orientation of the slider Default: "horizontal" |
| `ids` | Partial<{ root: string; thumb(index: number): string; hiddenInput(index: number): string; control: string; track: string; range: string; label: string; valueText: string; marker(index: number): string; }> | The ids of the elements in the slider. Useful for composition. |
| `value` | number[] | The controlled value of the slider |
| `defaultValue` | number[] | The initial value of the slider when rendered. Use when you don't need to control the value of the slider. |
| `disabled` | boolean | Whether the slider is disabled |
| `onValueChange` | (details: ValueChangeDetails) => void | Function invoked when the value of the slider changes |
| `onFocusChange` | (details: FocusChangeDetails) => void | Function invoked when the slider's focused index changes |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `name` | string | The name associated with each slider thumb (when used in a form) |
| `invalid` | boolean | Whether the slider is invalid |
| `min` | number | The minimum value of the slider Default: 0 |
| `max` | number | The maximum value of the slider Default: 100 |
| `form` | string | The associate form of the underlying input element. |
| `readOnly` | boolean | Whether the slider is read-only |
| `aria-label` | string[] | The aria-label of each slider thumb. Useful for providing an accessible name to the slider |
| `aria-labelledby` | string[] | The `id` of the elements that labels each slider thumb. Useful for providing an accessible name to the slider |
| `onValueChangeEnd` | (details: ValueChangeDetails) => void | Function invoked when the slider value change is done |
| `getAriaValueText` | (details: ValueTextDetails) => string | Function that returns a human readable value for the slider thumb |
| `step` | number | The step value of the slider Default: 1 |
| `minStepsBetweenThumbs` | number | The minimum permitted steps between multiple thumbs. Default: 0 |
| `origin` | "start" | "center" | "end" | The origin of the slider range. The track is filled from the origin to the thumb for single values. - "start": Useful when the value represents an absolute value - "center": Useful when the value represents an offset (relative) - "end": Useful when the value represents an offset from the end Default: "start" |
| `thumbAlignment` | "center" | "contain" | The alignment of the slider thumb relative to the track - `center`: the thumb will extend beyond the bounds of the slider track. - `contain`: the thumb will be contained within the bounds of the track. Default: "contain" |

---

# Switch
A control for toggling between checked states.

```svelte
<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let state = $state(false);
</script>

<Switch name="example" checked={state} onCheckedChange={(e) => (state = e.checked)} />

```

## List

```svelte
<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let disturb = $state(false);
	let notifications = $state(true);
	let disabled = $state(false);
</script>

<section class="w-full space-y-4">
	<div class="flex justify-between items-center gap-4">
		<p>Default to the inactive state.</p>
		<Switch name="disturb" checked={disturb} onCheckedChange={(e) => (disturb = e.checked)}></Switch>
	</div>
	<hr class="hr" />
	<div class="flex justify-between items-center gap-4">
		<p>Default to the active state.</p>
		<Switch name="notifications" checked={notifications} onCheckedChange={(e) => (notifications = e.checked)}></Switch>
	</div>
	<hr class="hr" />
	<div class="flex justify-between items-center gap-4">
		<p>Shown in disabled mode.</p>
		<Switch name="disabled" checked={disabled} onCheckedChange={(e) => (disabled = e.checked)} disabled></Switch>
	</div>
</section>

```

## Icons

Pass icons through the `inactiveChild` and `activeChild` snippets respectively.

```svelte
<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconX from '@lucide/svelte/icons/x';
	import IconCheck from '@lucide/svelte/icons/check';
</script>

<Switch name="icons" controlActive="bg-secondary-500">
	{#snippet inactiveChild()}<IconX size="14" />{/snippet}
	{#snippet activeChild()}<IconCheck size="14" />{/snippet}
</Switch>

```

## Compact

Apply the `compact` prop to switch a minimal display.

```svelte
<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconFrown from '@lucide/svelte/icons/frown';
	import IconSmile from '@lucide/svelte/icons/smile';
</script>

<Switch name="compact" controlWidth="w-9" controlActive="preset-filled-tertiary-500" compact>
	{#snippet inactiveChild()}<IconFrown size="20" />{/snippet}
	{#snippet activeChild()}<IconSmile size="20" />{/snippet}
</Switch>

```

## Light Switch

This is a full fledge example using multiple features.

```svelte
<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconMoon from '@lucide/svelte/icons/moon';
	import IconSun from '@lucide/svelte/icons/sun';

	// Bind to the checked state
	let mode = $state(false);

	// Handle the change in state when toggled.
	function handleModeChange(checked: boolean) {
		// NOTE: implementation may differ per Tailwind config and framework:
		// https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
		console.log({ mode });
		mode = checked;
	}
</script>

<Switch name="mode" controlActive="bg-surface-200" checked={mode} onCheckedChange={(e) => handleModeChange(e.checked)}>
	{#snippet inactiveChild()}<IconMoon size="14" />{/snippet}
	{#snippet activeChild()}<IconSun size="14" />{/snippet}
</Switch>

```

## Anatomy

<Anatomy label="Switch" tag="label" isComponent>
	<Anatomy tag="input" />
	<Anatomy label="control" tag="span">
		<Anatomy label="thumb" tag="span">
			<Anatomy label="iconActiveBase|iconInactiveBase" tag="span" />
		</Anatomy>
	</Anatomy>
	<Anatomy label="label" tag="span" />
</Anatomy>

## API Reference

### Switch

| Property | Type | Description |
| --- | --- | --- |
| `compact` | boolean | Set the compact display mode. |
| `base` | string | Set base classes for the root element. |
| `classes` | string | Provide arbitrary classes to the root element. |
| `stateFocused` | string | Set classes for the focus state. |
| `controlBase` | string | Set base classes for the control element. |
| `controlInactive` | string | Set inactive state classes for the control element. |
| `controlActive` | string | Set active state classes for the control element. |
| `controlDisabled` | string | Set disabled state classes for the control element. |
| `controlWidth` | string | Set width classes for the control element. |
| `controlHeight` | string | Set height classes for the control element. |
| `controlPadding` | string | Set padding classes for the control element. |
| `controlRounded` | string | Set rounded classes for the control element. |
| `controlHover` | string | Set hover classes for the control element. |
| `controlClasses` | string | Provide arbitrary classes to the control element. |
| `thumbBase` | string | Set base classes for the thumb element. |
| `thumbInactive` | string | Set inactive classes for the thumb element. |
| `thumbActive` | string | Set active classes for the thumb element. |
| `thumbRounded` | string | Set rounded classes for the thumb element. |
| `thumbTranslateX` | string | Set animation X-axis translate classes for the thumb element. |
| `thumbTransition` | string | Set animation transition classes for the thumb element. |
| `thumbEase` | string | Set animation easing classes for the thumb element. |
| `thumbDuration` | string | Set animation duration classes for the thumb element. |
| `thumbClasses` | string | Provide arbitrary classes to the thumb element. |
| `labelBase` | string | Set base classes for the label element. |
| `labelClasses` | string | Provide arbitrary classes to the label element. |
| `iconInactiveBase` | string | Set base classes for the inactive icon child. |
| `iconActiveBase` | string | Set base classes for the active icon child. |
| `children` | Snippet<[]> | The default children snippet. |
| `inactiveChild` | Snippet<[]> | The inactive state snippet. |
| `activeChild` | Snippet<[]> | The active state snippet. |
| `ids` | Partial<{ root: string; hiddenInput: string; control: string; label: string; thumb: string; }> | The ids of the elements in the switch. Useful for composition. |
| `value` | string | number | The value of switch input. Useful for form submission. Default: "on" |
| `disabled` | boolean | Whether the switch is disabled. |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `name` | string | The name of the input field in a switch (Useful for form submission). |
| `required` | boolean | If `true`, the switch input is marked as required, |
| `invalid` | boolean | If `true`, the switch is marked as invalid. |
| `label` | string | Specifies the localized strings that identifies the accessibility elements and their states |
| `form` | string | The id of the form that the switch belongs to |
| `readOnly` | boolean | Whether the switch is read-only |
| `onCheckedChange` | (details: CheckedChangeDetails) => void | Function to call when the switch is clicked. |
| `checked` | boolean | The controlled checked state of the switch |
| `defaultChecked` | boolean | The initial checked state of the switch when rendered. Use when you don't need to control the checked state of the switch. |

---

# Tabs
Use tabs to quickly switch between different views and pages.

```svelte
<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	let group = $state('plane');
	const lorem =
		'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo ipsa fugit suscipit autem vitae numquam et cumque praesentium vero eos minus itaque. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo.';
</script>

<Tabs value={group} onValueChange={(e) => (group = e.value)}>
	{#snippet list()}
		<Tabs.Control value="plane">Plane</Tabs.Control>
		<Tabs.Control value="boat">Boat</Tabs.Control>
		<Tabs.Control value="car">Car</Tabs.Control>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="plane">Plane Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="boat">Boat Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="car">Car Panel - {lorem}</Tabs.Panel>
	{/snippet}
</Tabs>

```

## Icons

Easily customize tabs content with icons and arrange them in any combination you prefer.

```svelte
<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconPlane from '@lucide/svelte/icons/plane';
	import IconBoat from '@lucide/svelte/icons/sailboat';
	import IconCar from '@lucide/svelte/icons/car';

	let group = $state('plane');
	const lorem =
		'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo ipsa fugit suscipit autem vitae numquam et cumque praesentium vero eos minus itaque. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo.';
</script>

<Tabs value={group} onValueChange={(e) => (group = e.value)}>
	{#snippet list()}
		<Tabs.Control value="plane">
			<IconPlane size={20} />
		</Tabs.Control>
		<Tabs.Control value="boat">
			<IconBoat size={20} />
		</Tabs.Control>
		<Tabs.Control value="car">
			<IconCar size={20} />
		</Tabs.Control>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="plane">Plane Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="boat">Boat Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="car">Car Panel - {lorem}</Tabs.Panel>
	{/snippet}
</Tabs>

```

```svelte
<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconPlane from '@lucide/svelte/icons/plane';
	import IconBoat from '@lucide/svelte/icons/sailboat';
	import IconCar from '@lucide/svelte/icons/car';

	let group = $state('plane');
	const lorem =
		'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo ipsa fugit suscipit autem vitae numquam et cumque praesentium vero eos minus itaque. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo.';
</script>

<Tabs value={group} onValueChange={(e) => (group = e.value)}>
	{#snippet list()}
		<Tabs.Control value="plane">
			{#snippet lead()}<IconPlane size={20} />{/snippet}
			Plane
		</Tabs.Control>
		<Tabs.Control value="boat">
			{#snippet lead()}<IconBoat size={20} />{/snippet}
			Boat
		</Tabs.Control>
		<Tabs.Control value="car">
			{#snippet lead()}<IconCar size={20} />{/snippet}
			Car
		</Tabs.Control>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="plane">Plane Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="boat">Boat Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="car">Car Panel - {lorem}</Tabs.Panel>
	{/snippet}
</Tabs>

```

## Fluid

Set `fluid` to enable tabs to stretch to fill the available width.

```svelte
<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	let group = $state('plane');
	const lorem =
		'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo ipsa fugit suscipit autem vitae numquam et cumque praesentium vero eos minus itaque. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo.';
</script>

<Tabs value={group} onValueChange={(e) => (group = e.value)} fluid>
	{#snippet list()}
		<Tabs.Control value="plane">Plane</Tabs.Control>
		<Tabs.Control value="boat">Boat</Tabs.Control>
		<Tabs.Control value="car">Car</Tabs.Control>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="plane">Plane Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="boat">Boat Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="car">Car Panel - {lorem}</Tabs.Panel>
	{/snippet}
</Tabs>

```

## Justify

```svelte
<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	let group = $state('plane');
	const lorem =
		'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo ipsa fugit suscipit autem vitae numquam et cumque praesentium vero eos minus itaque. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo.';
</script>

<Tabs value={group} onValueChange={(e) => (group = e.value)} listJustify="justify-center">
	{#snippet list()}
		<Tabs.Control value="plane">Plane</Tabs.Control>
		<Tabs.Control value="boat">Boat</Tabs.Control>
		<Tabs.Control value="car">Car</Tabs.Control>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="plane">Plane Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="boat">Boat Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="car">Car Panel - {lorem}</Tabs.Panel>
	{/snippet}
</Tabs>

```

## RTL

```svelte
<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	let group = $state('plane');
	const lorem =
		'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo ipsa fugit suscipit autem vitae numquam et cumque praesentium vero eos minus itaque. Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum veniam reprehenderit eum, reiciendis obcaecati, excepturi nemo.';
</script>

<Tabs value={group} onValueChange={(e) => (group = e.value)} dir="rtl">
	{#snippet list()}
		<Tabs.Control value="plane">Plane</Tabs.Control>
		<Tabs.Control value="boat">Boat</Tabs.Control>
		<Tabs.Control value="car">Car</Tabs.Control>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="plane">Plane Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="boat">Boat Panel - {lorem}</Tabs.Panel>
		<Tabs.Panel value="car">Car Panel - {lorem}</Tabs.Panel>
	{/snippet}
</Tabs>

```

## Anatomy

<Anatomy label="Tabs" isComponent>
	<Anatomy label="list">
		<Anatomy label="Tabs.Control" tag="button" isComponent>
			<Anatomy label="label">
				<Anatomy descriptor="lead" tag="span" />
				<Anatomy descriptor="children" tag="span" />
			</Anatomy>
		</Anatomy>
	</Anatomy>
	<Anatomy label="content">
		<Anatomy label="Tabs.Panel" isComponent />
	</Anatomy>
</Anatomy>

## API Reference

### Tabs

| Property | Type | Description |
| --- | --- | --- |
| `fluid` | boolean | Set tabs to stretch to fill the available width. |
| `base` | string | Set base classes for the root element. |
| `classes` | string | Provide arbitrary classes for the root element. |
| `listBase` | string | Set base classes for the list element. |
| `listJustify` | string | Set justify classes for the list element. |
| `listBorder` | string | Set border classes for the list element. |
| `listMargin` | string | Set margin classes for the list element. |
| `listGap` | string | Set gap classes for the list element. |
| `listClasses` | string | Provide arbitrary classes for the list element. |
| `contentBase` | string | Set base classes for the panel group element. |
| `contentClasses` | string | Provide arbitrary classes for the panel group element. |
| `list` | Snippet<[]> | Slot containing the list of tab controls. |
| `content` | Snippet<[]> | Slot containing the list of panels. |
| `ids` | Partial<{ root: string; trigger: string; list: string; content: string; indicator: string; }> | The ids of the elements in the tabs. Useful for composition. |
| `value` | string | The controlled selected tab value |
| `defaultValue` | string | The initial selected tab value when rendered. Use when you don't need to control the selected tab value. |
| `onValueChange` | (details: ValueChangeDetails) => void | Callback to be called when the selected/active tab changes |
| `onFocusChange` | (details: FocusChangeDetails) => void | Callback to be called when the focused tab changes |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `translations` | IntlTranslations | Specifies the localized strings that identifies the accessibility elements and their states |
| `loopFocus` | boolean | Whether the keyboard navigation will loop from last tab to first, and vice versa. Default: true |
| `activationMode` | "manual" | "automatic" | The activation mode of the tabs. Can be `manual` or `automatic` - `manual`: Tabs are activated when clicked or press `enter` key. - `automatic`: Tabs are activated when receiving focus Default: "automatic" |
| `composite` | boolean | Whether the tab is composite |
| `deselectable` | boolean | Whether the active tab can be deselected when clicking on it. |
| `navigate` | (details: NavigateDetails) => void | Function to navigate to the selected tab when clicking on it. Useful if tab triggers are anchor elements. |

### TabsControl

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Set base classes for the control element. |
| `padding` | string | Set padding classes for the control element. |
| `translateX` | string | Set x-axis translate classes for the control element. |
| `classes` | string | Provide arbitrary classes for the control element. |
| `labelBase` | string | Set base classes for the label element. |
| `labelClasses` | string | Provide arbitrary classes for the label element. |
| `stateInactive` | string | Set inactive classes for the control element. |
| `stateActive` | string | Set active classes for the control element. |
| `stateLabelInactive` | string | Set inactive classes for the label element. |
| `stateLabelActive` | string | Set active classes for the label element. |
| `lead` | Snippet<[]> | The lead slot. |
| `children` | Snippet<[]> | The default child slot. |
| `value`* | string | The value of the tab |
| `disabled` | boolean | Whether the tab is disabled |

### TabsPanel

| Property | Type | Description |
| --- | --- | --- |
| `base` | string | Set base classes for the panel element. |
| `classes` | string | Provide arbitrary classes for the panel element. |
| `children` | Snippet<[]> | The default child slot. |
| `value`* | string | The value of the tab |

---

# Tags Input
Allows input of multiple values.

```svelte
<script lang="ts">
	import { TagsInput } from '@skeletonlabs/skeleton-svelte';

	// State
	let flavors = $state(['Vanilla', 'Chocolate', 'Strawberry']);
</script>

<TagsInput name="example" value={flavors} onValueChange={(e) => (flavors = e.value)} placeholder="Add Tag..." />

```

## Icons

```svelte
<script lang="ts">
	import { TagsInput } from '@skeletonlabs/skeleton-svelte';
	// Icons
	import IconDelete from '@lucide/svelte/icons/circle-x';

	// State
	let flavors = $state(['Vanilla', 'Chocolate', 'Strawberry']);
</script>

<TagsInput value={flavors} onValueChange={(e) => (flavors = e.value)} placeholder="Add Tag...">
	{#snippet buttonDelete()}<IconDelete class="size-4" />{/snippet}
</TagsInput>

```

## Colors

```svelte
<script lang="ts">
	import { TagsInput } from '@skeletonlabs/skeleton-svelte';

	// State
	let flavors = $state(['Vanilla', 'Chocolate', 'Strawberry']);
</script>

<section class="w-full space-y-4">
	<TagsInput
		value={flavors}
		onValueChange={(e) => (flavors = e.value)}
		placeholder="Add Tag..."
		tagBackground="preset-filled-primary-500"
	/>
	<TagsInput
		value={flavors}
		onValueChange={(e) => (flavors = e.value)}
		placeholder="Add Tag..."
		tagBackground="preset-filled-secondary-500"
	/>
	<TagsInput
		value={flavors}
		onValueChange={(e) => (flavors = e.value)}
		placeholder="Add Tag..."
		tagBackground="preset-filled-tertiary-500"
	/>
</section>

```

## Disabled

```svelte
<script lang="ts">
	import { TagsInput } from '@skeletonlabs/skeleton-svelte';

	// State
	let flavors = $state(['Vanilla', 'Chocolate', 'Strawberry']);
</script>

<TagsInput name="example" value={flavors} onValueChange={(e) => (flavors = e.value)} placeholder="Add Tag..." disabled />

```

## Additional Features

```svelte
<script lang="ts">
	import { TagsInput } from '@skeletonlabs/skeleton-svelte';

	// State
	let flavors = $state(['Vanilla', 'Chocolate', 'Strawberry']);
</script>

<section class="w-full space-y-4">
	<p>Not Editable Tags</p>
	<TagsInput value={flavors} onValueChange={(e) => (flavors = e.value)} placeholder="Add Tag..." editable={false} />
	<p>Add Tag on Paste</p>
	<TagsInput value={flavors} onValueChange={(e) => (flavors = e.value)} placeholder="Add Tag..." addOnPaste />
</section>

```

## Anatomy

<Anatomy label="TagsInput" isComponent>
	<Anatomy tag="input" />
	<Anatomy label="tagList">
		<Anatomy tag="div">
			<Anatomy label="tag">
				<Anatomy tag="span" />
				<Anatomy label="buttonDelete" tag="button" />
			</Anatomy>
		</Anatomy>
		<Anatomy tag="input" />
	</Anatomy>
</Anatomy>

## API Reference

### TagsInput

| Property | Type | Description |
| --- | --- | --- |
| `placeholder` | string | Set the add tag input placeholder. |
| `base` | string | Set base classes for the root. |
| `gap` | string | Set gap classes for the root. |
| `padding` | string | Set padding classes for the root. |
| `classes` | string | Provide arbitrary classes to the root. |
| `inputBase` | string | Set base classes for the add tag input. |
| `inputClasses` | string | Provide arbitrary classes to the add tag input. |
| `tagListBase` | string | Set base classes for the tag list. |
| `tagListClasses` | string | Provide arbitrary classes to the tag list. |
| `tagBase` | string | Set base classes for each tag. |
| `tagBackground` | string | Set background classes for each tag. |
| `tagClasses` | string | Provide arbitrary classes to each tag. |
| `tagEditInputBase` | string | Set base classes for the edit tag input. |
| `tagEditInputClasses` | string | Provide arbitrary classes to the edit tag input. |
| `buttonDeleteBase` | string | Set base classes for the delete button. |
| `buttonDeleteClasses` | string | Provide arbitrary classes to the delete button. |
| `stateDisabled` | string | Set the component disabled state. |
| `buttonDelete` | Snippet<[]> | The delete button label snippet. |
| `ids` | Partial<{ root: string; input: string; hiddenInput: string; clearBtn: string; label: string; control: string; item(opts: ItemProps): string; itemDeleteTrigger(opts: ItemProps): string; itemInput(opts: ItemProps): string; }> | The ids of the elements in the tags input. Useful for composition. |
| `value` | string[] | The controlled tag value |
| `defaultValue` | string[] | The initial tag value when rendered. Use when you don't need to control the tag value. |
| `disabled` | boolean | Whether the tags input should be disabled |
| `onValueChange` | (details: ValueChangeDetails) => void | Callback fired when the tag values is updated |
| `dir` | "ltr" | "rtl" | The document's text/writing direction. Default: "ltr" |
| `getRootNode` | () => ShadowRoot | Node | Document | A root node to correctly resolve document in custom environments. E.x.: Iframes, Electron. |
| `name` | string | The name attribute for the input. Useful for form submissions |
| `translations` | IntlTranslations | Specifies the localized strings that identifies the accessibility elements and their states |
| `required` | boolean | Whether the tags input is required |
| `validate` | (details: ValidateArgs) => boolean | Returns a boolean that determines whether a tag can be added. Useful for preventing duplicates or invalid tag values. |
| `invalid` | boolean | Whether the tags input is invalid |
| `max` | number | The max number of tags Default: Infinity |
| `form` | string | The associate form of the underlying input element. |
| `readOnly` | boolean | Whether the tags input should be read-only |
| `autoFocus` | boolean | Whether the input should be auto-focused |
| `maxLength` | number | The max length of the input. |
| `delimiter` | string | RegExp | The character that serves has: - event key to trigger the addition of a new tag - character used to split tags when pasting into the input Default: "," |
| `editable` | boolean | Whether a tag can be edited after creation, by pressing `Enter` or double clicking. Default: true |
| `inputValue` | string | The controlled tag input's value |
| `defaultInputValue` | string | The initial tag input value when rendered. Use when you don't need to control the tag input value. |
| `onInputValueChange` | (details: InputValueChangeDetails) => void | Callback fired when the input value is updated |
| `onHighlightChange` | (details: HighlightChangeDetails) => void | Callback fired when a tag is highlighted by pointer or keyboard navigation |
| `onValueInvalid` | (details: ValidityChangeDetails) => void | Callback fired when the max tag count is reached or the `validateTag` function returns `false` |
| `blurBehavior` | "clear" | "add" | The behavior of the tags input when the input is blurred - `"add"`: add the input value as a new tag - `"clear"`: clear the input value |
| `addOnPaste` | boolean | Whether to add a tag when you paste values into the tag input Default: false |
| `allowOverflow` | boolean | Whether to allow tags to exceed max. In this case, we'll attach `data-invalid` to the root |
| `onPointerDownOutside` | (event: PointerDownOutsideEvent) => void | Function called when the pointer is pressed down outside the component |
| `onFocusOutside` | (event: FocusOutsideEvent) => void | Function called when the focus is moved outside the component |
| `onInteractOutside` | (event: InteractOutsideEvent) => void | Function called when an interaction happens outside the component |

---

# Toast (beta)
Build a toast notification system.

We recommend implementing a single instance of `<Toaster>` in global scope of your app, typically within a root layout. This single instance will manage a toast group with a `toaster` instance (via `createToaster`). Style props applied to the `<Toaster>` component are applied all child toasts created within that instance.

```svelte
<script lang="ts">
	import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';

	const toaster = createToaster();
</script>

<Toaster {toaster}></Toaster>

<button
	class="btn preset-filled"
	onclick={() => {
		toaster.info({
			title: 'This is a toast!'
		});
	}}>Toast</button
>

```

## Type

You can use the generic `create()` method in combination with a specific type, or opt for the shorthand methods if preferred: `info()`, `success()`, `warning()`, or `error()`.

```svelte
<script lang="ts">
	import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';

	const toaster = createToaster();
</script>

<Toaster {toaster}></Toaster>

<div class="w-full max-w-72 grid grid-cols-2 gap-2">
	<button
		class="btn preset-filled"
		onclick={() => {
			toaster.info({
				title: 'This is a toast!'
			});
		}}>Info</button
	>
	<button
		class="btn preset-filled-success-500"
		onclick={() => {
			toaster.success({
				title: 'This is a toast!'
			});
		}}>Success</button
	>
	<button
		class="btn preset-filled-warning-500"
		onclick={() => {
			toaster.warning({
				title: 'This is a toast!'
			});
		}}>Warning</button
	>
	<button
		class="btn preset-filled-error-500"
		onclick={() => {
			toaster.error({
				title: 'This is a toast!'
			});
		}}>Error</button
	>
</div>

```

## Placement

Use the `placement` prop on `<Toaster>` to set the position of the toast group.

```svelte
<script lang="ts">
	import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';

	const toaster = createToaster({
		placement: 'bottom-end'
	});
</script>

<Toaster {toaster}></Toaster>

<button
	class="btn preset-filled"
	onclick={() => {
		toaster.info({
			title: 'This is a toast!'
		});
	}}>Toast</button
>

```

## Promise

Use `promise()` to create a toast that is able to be configured based on the state of a promise. The toast will automatically update based on the state of the promise.

```svelte
<script lang="ts">
	import { Toaster, createToaster } from '@skeletonlabs/skeleton-svelte';

	const toaster = createToaster();

	function getTask() {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.random() > 0.5) {
					resolve(undefined);
				} else {
					reject();
				}
			}, 2000);
		});
	}
</script>

<Toaster {toaster}></Toaster>

<button
	class="btn preset-filled"
	onclick={() => {
		toaster.promise(getTask(), {
			loading: {
				title: 'Loading...',
				description: 'Please wait while the task is being processed.'
			},
			success: () => ({
				title: 'Success',
				description: 'Your request has been completed'
			}),
			error: () => ({
				title: 'Error',
				description: 'An error has occurred'
			})
		});
	}}>Execute Task</button
>

```

## API Reference

### Toaster

| Property | Type | Description |
| --- | --- | --- |
| `toaster`* | ToastStore<any> |  |
| `base` | string | Provide base classes for the root element. |
| `width` | string | Provide width classes for the root element. |
| `padding` | string | Provide padding classes for the root element. |
| `rounded` | string | Provide border radius classes for the root element. |
| `classes` | string | Provide arbitrary classes for the toast cards. |
| `messageBase` | string | Provide base classes for the message. |
| `messageClasses` | string | Provide classes for the message. |
| `titleBase` | string | Provide base classes for the title. |
| `titleClasses` | string | Provide classes for the title. |
| `descriptionBase` | string | Provide base classes for the description. |
| `descriptionClasses` | string | Provide classes for the description. |
| `btnDismissBase` | string | Provide base classes for the dismiss button. |
| `btnDismissClasses` | string | Provide arbitrary classes for the dismiss button. |
| `stateInfo` | string | Provide base classes for info toasts. |
| `stateSuccess` | string | Provide base classes for success toasts. |
| `stateWarning` | string | Provide base classes for warning toasts. |
| `stateError` | string | Provide base classes for error toasts. |
| `placement` | Placement | The placement of the toast Default: "bottom" |
| `max` | number | The maximum number of toasts Default: 24 |
| `overlap` | boolean | Whether to overlap the toasts |
| `duration` | number | The duration of the toast. By default, it is determined by the type of the toast. |
| `gap` | number | The gap between the toasts Default: 16 |
| `offsets` | string | Record<"top" | "bottom" | "left" | "right", string> | The offset from the safe environment edge of the viewport Default: "1rem" |
| `hotkey` | string[] | The hotkey that will move focus to the toast group Default: '["altKey", "KeyT"]' |
| `removeDelay` | number | The duration for the toast to kept alive before it is removed. Useful for exit transitions. Default: 200 |
| `pauseOnPageIdle` | boolean | Whether to pause toast when the user leaves the browser tab Default: false |

### Toast

| Property | Type | Description |
| --- | --- | --- |
| `toast`* | Options<any> |  |
| `index`* | number |  |
| `parent`* | ToastGroupService |  |
| `max` | number | The maximum number of toasts Default: 24 |
| `base` | string | Provide base classes for the root element. |
| `width` | string | Provide width classes for the root element. |
| `padding` | string | Provide padding classes for the root element. |
| `rounded` | string | Provide border radius classes for the root element. |
| `classes` | string | Provide arbitrary classes for the toast cards. |
| `messageBase` | string | Provide base classes for the message. |
| `messageClasses` | string | Provide classes for the message. |
| `titleBase` | string | Provide base classes for the title. |
| `titleClasses` | string | Provide classes for the title. |
| `descriptionBase` | string | Provide base classes for the description. |
| `descriptionClasses` | string | Provide classes for the description. |
| `btnDismissBase` | string | Provide base classes for the dismiss button. |
| `btnDismissClasses` | string | Provide arbitrary classes for the dismiss button. |
| `stateInfo` | string | Provide base classes for info toasts. |
| `stateSuccess` | string | Provide base classes for success toasts. |
| `stateWarning` | string | Provide base classes for warning toasts. |
| `stateError` | string | Provide base classes for error toasts. |
| `placement` | Placement | The placement of the toast Default: "bottom" |
| `overlap` | boolean | Whether to overlap the toasts |
| `duration` | number | The duration of the toast. By default, it is determined by the type of the toast. |
| `gap` | number | The gap between the toasts Default: 16 |
| `offsets` | string | Record<"top" | "bottom" | "left" | "right", string> | The offset from the safe environment edge of the viewport Default: "1rem" |
| `hotkey` | string[] | The hotkey that will move focus to the toast group Default: '["altKey", "KeyT"]' |
| `removeDelay` | number | The duration for the toast to kept alive before it is removed. Useful for exit transitions. Default: 200 |
| `pauseOnPageIdle` | boolean | Whether to pause toast when the user leaves the browser tab Default: false |

## Alternatives

If you're looking for power user features or more control over templates, consider using [Svelte-French-Toast](https://svelte-french-toast.com/).

---

# Integrations

# Code Block
Learn how to integrate Shiki, a beautiful yet powerful syntax highlighter.



<p class="text-xl">
	Shiki (式, a Japanese word for "Style") is a beautiful and powerful syntax highlighter based on TextMate grammar and themes, the same
	engine as VS Code's syntax highlighting. It provides accurate and fast syntax highlighting for almost any mainstream programming language.
</p>

<figure class="card-filled-enhanced flex justify-center gap-4 p-8">
	<a href="https://shiki.style/" target="_blank" class="btn preset-filled">
		Shiki Documentation &rarr;
	</a>
</figure>

## Installation

[Install Shiki](https://shiki.style/guide/install) with your preferred package manager.

```console
npm install -D shiki
```

## Create a Component

A reusable component should suffice in most projects. Tap the `code` tab below to access the source, then follow the steps below.

1. Implement a new `<CodeBlock>` component in `/src/lib/components/CodeBlock/CodeBlock.svelte`.
2. Implement the required component prop types in `/src/lib/components/CodeBlock/types.ts`.
3. Implement several variations of our `<CodeBlock>` component in any SvelteKit route `+page.svelte`.

```svelte
<!-- @component Code Block based on: https://shiki.style/ -->

<script module>
	import { createHighlighterCoreSync } from 'shiki/core';
	import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
	// Themes
	// https://shiki.style/themes
	import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
	// Languages
	// https://shiki.style/languages
	import console from 'shiki/langs/console.mjs';
	import html from 'shiki/langs/html.mjs';
	import css from 'shiki/langs/css.mjs';
	import js from 'shiki/langs/javascript.mjs';

	// https://shiki.style/guide/sync-usage
	const shiki = createHighlighterCoreSync({
		engine: createJavaScriptRegexEngine(),
		// Implement your import theme.
		themes: [themeDarkPlus],
		// Implement your imported and supported languages.
		langs: [console, html, css, js]
	});
</script>

<script lang="ts">
	import type { CodeBlockProps } from './types';

	let {
		code = '',
		lang = 'console',
		theme = 'dark-plus',
		// Base Style Props
		base = ' overflow-hidden',
		rounded = 'rounded-container',
		shadow = '',
		classes = '',
		// Pre Style Props
		preBase = '',
		prePadding = '[&>pre]:p-4',
		preClasses = ''
	}: CodeBlockProps = $props();

	// Shiki convert to HTML
	const generatedHtml = shiki.codeToHtml(code, { lang, theme });
</script>

<div class="{base} {rounded} {shadow} {classes} {preBase} {prePadding} {preClasses}">
	<!-- Output Shiki's Generated HTML -->
	{@html generatedHtml}
</div>

```

A few things of note about this component:

- You will need to import and configure any number of [Shiki themes](https://shiki.style/themes).
- You will need to import and configure any number of [supported languages](https://shiki.style/languages).
- The component has been implemented using Skeleton's [component style guidelines](http://localhost:4321/docs/resources/contribute/components).
- This provides a number of style props for easy customization via Skeleton's standard conventions.
- The component exposes `code`, `lang`, and `theme` properties to configure on-the-fly.
- The Code Block `<pre>` tag is auto-generated by Shiki; target utility classes with: `[&>pre]:myClassHere`.

## Programmatic Usage

<div class="card preset-outlined-warning-500 p-8 space-y-8">
	<p>This use case falls outside the scope of Skeleton. The following is provided merely as guidance.</p>
</div>

In some cases you may not have direct access to the source code, such as content from a blog posts or CMS pages. In fact the code may even come pre-baked with surrounding `<pre>` or `<code>` elements. For this, you'll need to follow the general steps below. Specific implementation may differ based on your app and meta-framework.

1. Query all `<pre>` or `<code>` blocks using Javascript tools like `document.querySelectorAll()`. Be as specific as possible.
2. Ensure you have a clean instance of the source code itself, with no extra markup injected within.
3. Use Shiki's [codeToHtml](https://shiki.style/guide/install#shorthands) feature to parse the code as styled HTML markup.
4. Then append each instance of the code blocks in your DOM.

For more instructions, please refer to this guide by [Joy of Code](https://joyofcode.xyz/) explaining how to [implement Shiki via MDX](https://joyofcode.xyz/sveltekit-markdown-blog#using-components-inside-markdown).

## Custom Themes

Shiki provides support for generating a custom highlighter theme:

- [Loading Custom Themes](https://shiki.style/guide/load-theme)
- [List of Bundled Themes](https://shiki.style/themes)

Shiki theme values can be defined using Skeleton custom theme properties, such as `rgba(--color-primary-500)`.

## Accessibility

See [Salma Alam-Naylor's](https://whitep4nth3r.com/about/) guidelines for [creating accessible code blocks](https://whitep4nth3r.com/blog/how-to-make-your-code-blocks-accessible-on-your-website/) that meet WGAC standards.

---

# Iconography
Learn how to integrate Lucide for iconography in Skeleton.

<p class="text-xl">
	Skeleton takes an agnostic approach to icons, meaning you can use any combination of SVGs, emoji, unicode, or dedicated icon libraries.
	Mix and match to fulfill your project's unique requirements.
</p>

## Lucide

<figure class="linker bg-noise">
	<div class="flex gap-4">
		<Heart size={48} />
		<UserRound size={48} />
		<Triangle size={48} />
	</div>
</figure>

If you're looking for an opinionated solution, Skeleton recommends [Lucide](https://lucide.dev/). This provides a huge selection of icons that are available to all popular frameworks and feature a clean and modern style. All code examples in this documentation site implement Lucide, but feel free to replace with any alternative.

### Installation

Follow the official instructions to install [Lucide for Svelte](https://lucide.dev/guide/packages/lucide-svelte).

## Usage

For optimal performance we recommend importing each icon using the full path.

```svelte
<script>
	import IconSkull from '@lucide/svelte/icons/skull';
</script>

<IconSkull color="#ff3e98" />
```

## Alternatives

- [Iconify](https://iconify.design/) - provides a vast array of icon sets supported by popular icon libraries.
- [Font Awesome](https://fontawesome.com/) - provides a huge variety of icons in their free tier.
- [SimpleIcons](https://simpleicons.org/) - provides an excellent selection of brand icons.

---

# Popover
Learn how to integrate dynamic and interactive popover interfaces.

## Floating UI Svelte

<div class="card preset-outlined-warning-500 p-8 space-y-8">
	<p>
		Please note this section will be the future home of the [Floating UI Svelte](https://floating-ui-svelte.vercel.app/) integrateion guide,
		an upcoming open-source library from [Skeleton Labs](https://github.com/skeletonlabs/floating-ui-svelte/discussions/50). While this
		project is in development, we have provided several Svelte-specific components to act as temporary substitutions. Note that these
		components will remain available until our next major release (Skeleton v4.x). However, the goal will be to replace these with Floating
		UI Svelte as soon as possible.
	</p>
</div>

## Z-Index

Skeleton does not take an opinionated stance regarding z-index stacking. This means elements may be occluded beneath other elements with a higher index. Adjust this using the `zIndex` component property.

```svelte
<Popover ... zIndex={10}>
	<!-- ... -->
</Popover>
```

## Popover

Triggers an anchored popover when you <u>click</u> the trigger element. [View API Reference](https://zagjs.com/components/react/popover#methods-and-properties).

```svelte
<script lang="ts">
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import IconX from '@lucide/svelte/icons/x';

	let openState = $state(false);

	function popoverClose() {
		openState = false;
	}
</script>

<Popover
	open={openState}
	onOpenChange={(e) => (openState = e.open)}
	positioning={{ placement: 'top' }}
	triggerBase="btn preset-tonal"
	contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px]"
	arrow
	arrowBackground="!bg-surface-200 dark:!bg-surface-800"
>
	{#snippet trigger()}Click Me{/snippet}
	{#snippet content()}
		<header class="flex justify-between">
			<p class="font-bold text-xl">Popover Example</p>
			<button class="btn-icon hover:preset-tonal" onclick={popoverClose}><IconX /></button>
		</header>
		<article>
			<p class="opacity-60">
				This will display a basic popover with a header and body. This also includes a title, description, and close button.
			</p>
		</article>
	{/snippet}
</Popover>

```

### Anatomy

<Anatomy label="Popover" element="span" isComponent>
	<Anatomy label="trigger" element="button" />
	<Anatomy label="positioner">
		<Anatomy label="arrow" />
		<Anatomy label="content" />
	</Anatomy>
</Anatomy>

### API Reference

## Tooltip

Triggers an anchored popover when you <u>hover</u> the trigger element. [View API Reference](https://zagjs.com/components/react/tooltip#methods-and-properties).

```svelte
<script lang="ts">
	import { Tooltip } from '@skeletonlabs/skeleton-svelte';
	let openState = $state(false);
</script>

<Tooltip
	open={openState}
	onOpenChange={(e) => (openState = e.open)}
	positioning={{ placement: 'top' }}
	triggerBase="underline"
	contentBase="card preset-filled p-4"
	openDelay={200}
	arrow
>
	{#snippet trigger()}Hover Me{/snippet}
	{#snippet content()}This is a tooltip.{/snippet}
</Tooltip>

```

### Anatomy

<Anatomy label="Tooltip" element="span" isComponent>
	<Anatomy label="trigger" element="button" />
	<Anatomy label="positioner">
		<Anatomy label="arrow" />
		<Anatomy label="content" />
	</Anatomy>
</Anatomy>

### API Reference

## Combobox

Triggers an anchored popover list when you tap the arrow. Includes auto-suggestion via typeahead. [View API Reference](https://zagjs.com/components/react/combobox#methods-and-properties).

```svelte
<script lang="ts">
	import { Combobox } from '@skeletonlabs/skeleton-svelte';

	interface ComboboxData {
		label: string;
		value: string;
		emoji: string;
	}

	const comboboxData: ComboboxData[] = [
		{ label: 'United States', value: 'US', emoji: '🇺🇸' },
		{ label: 'Germany', value: 'DE', emoji: '🇩🇪' },
		{ label: 'Japan', value: 'JP', emoji: '🇯🇵' }
	];

	let selectedCountry = $state(['US']);
</script>

<Combobox
	data={comboboxData}
	value={selectedCountry}
	onValueChange={(e) => (selectedCountry = e.value)}
	label="Select Country"
	placeholder="Select..."
>
	<!-- This is optional. Combobox will render label by default -->
	{#snippet item(item)}
		<div class="flex w-full justify-between space-x-2">
			<span>{item.label}</span>
			<span>{item.emoji}</span>
		</div>
	{/snippet}
</Combobox>

```

### Anatomy

<Anatomy label="Combobox" element="span" isComponent>
	<Anatomy label="label">
		<Anatomy label="labelText" element="span" />
		<Anatomy label="inputGroup">
			<Anatomy label="inputGroupInput" element="input" />
			<Anatomy label="inputGroupButton" element="button">
				<Anatomy label="inputGroupArrow" element="svg" />
			</Anatomy>
		</Anatomy>
	</Anatomy>
	<Anatomy label="positioner">
		<Anatomy label="content" element="nav">
			<Anatomy label="option" element="button" />
		</Anatomy>
	</Anatomy>
</Anatomy>

### API Reference

## Modal

Generate modals or dialogs that require a user's immediate attention. [View API Reference](https://zagjs.com/components/react/dialog#methods-and-properties).

```svelte
<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';

	let openState = $state(false);

	function modalClose() {
		openState = false;
	}
</script>

<Modal
	open={openState}
	onOpenChange={(e) => (openState = e.open)}
	triggerBase="btn preset-tonal"
	contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm"
	backdropClasses="backdrop-blur-sm"
>
	{#snippet trigger()}Open Modal{/snippet}
	{#snippet content()}
		<header class="flex justify-between">
			<h2 class="h2">Modal Example</h2>
		</header>
		<article>
			<p class="opacity-60">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam, ab adipisci. Libero cumque sunt quis error veritatis amet, expedita
				voluptatem. Quos repudiandae consequuntur voluptatem et dicta quas, reprehenderit velit excepturi?
			</p>
		</article>
		<footer class="flex justify-end gap-4">
			<button type="button" class="btn preset-tonal" onclick={modalClose}>Cancel</button>
			<button type="button" class="btn preset-filled" onclick={modalClose}>Confirm</button>
		</footer>
	{/snippet}
</Modal>

```

```svelte
<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';

	let drawerState = $state(false);

	function drawerClose() {
		drawerState = false;
	}
</script>

<!--
Tips for Drawer modals:
- Use `contentBase` to set styles, including height/width
- Set justify-start to align to the left
- Clear the align and padding styles
- Use `positionerClasses` to set the
- Set transition.x values that matches content width in pixels
-->

<Modal
	open={drawerState}
	onOpenChange={(e) => (drawerState = e.open)}
	triggerBase="btn preset-tonal"
	contentBase="bg-surface-100-900 p-4 space-y-4 shadow-xl w-[480px] h-screen"
	positionerJustify="justify-start"
	positionerAlign=""
	positionerPadding=""
	transitionsPositionerIn={{ x: -480, duration: 200 }}
	transitionsPositionerOut={{ x: -480, duration: 200 }}
>
	{#snippet trigger()}Open Drawer{/snippet}
	{#snippet content()}
		<header class="flex justify-between">
			<h2 class="h2">Drawer Example</h2>
		</header>
		<article>
			<p class="opacity-60">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam, ab adipisci. Libero cumque sunt quis error veritatis amet, expedita
				voluptatem. Quos repudiandae consequuntur voluptatem et dicta quas, reprehenderit velit excepturi?
			</p>
		</article>
		<footer>
			<button type="button" class="btn preset-filled" onclick={drawerClose}>Close Drawer</button>
		</footer>
	{/snippet}
</Modal>

```

### Anatomy

<Anatomy label="Modal" element="span" isComponent>
	<Anatomy label="trigger" element="button" />
	<Anatomy label="backdrop" />
	<Anatomy label="positioner">
		<Anatomy label="content" />
	</Anatomy>
</Anatomy>

### API Reference

## Native Browser APIs

Skeleton will always favor native browser APIs over third-party libraries such as Floating UI Svelte. The following is a list of current and upcoming incoming APIs we will aim to support in the future, but are not quite standardized cross-browser yet.

- [Dialog Cookbook](/docs/guides/cookbook/dialog)
- [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [CSS Anchoring Position](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)

---
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

# t69 (nice) is a new, open source version of t3

theo asked for it, theo got it https://x.com/theo/status/1931515264497254402

try it here [@TODO add url here]

t69 is largely based on [supa](https://github.com/supaorg/supa) (ui) and powered by [aiwrapper](https://github.com/mitkury/aiwrapper) (ai inference), [aimodels](https://github.com/mitkury/aimodels) (info about ai models) [ttabs](https://github.com/mitkury/ttabs), [reptree](https://github.com/mitkury/reptree) (sync), and [airul](https://github.com/mitkury/airul) (ai context) - all projects maintained by t69's author.