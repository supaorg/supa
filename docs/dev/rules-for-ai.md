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

Structure:
- packages/client/src is the client code (Svelte + Tauri)
- packages/core/src is the core functionality shared with client; in the future will be used by servers (when we create a server)
- docs is dev and product documentation

## Icons
Use lucide-svelte icons, like this: 
import { Check } from "lucide-svelte";
and <Check size={14} />

## Tailwind and Skeleton CSS
For styles use Tailwind with Skeleton for components. Here's an example of Skeleton:
```svelte
<script>
	import { Avatar, ProgressRing, Segment, Slider, Switch } from '@skeletonlabs/skeleton-svelte';

	// Common Class Lists
	const headerClasses = 'space-y-2 pb-2 border-b-2 border-surface-800-200';
	const previewCardClasses = 'card bg-noise bg-surface-50-950 border-[1px] border-surface-200-800 flex justify-center items-center p-8';

	let color = $state('#bada55');
</script>

<main class="container mx-auto space-y-20 px-4 py-20">
	<!-- -------------------------------------------------------- -->
	<header class={headerClasses}>
		<h2 class="h2">Tailwind Components</h2>
	</header>
	<!-- -------------------------------------------------------- -->

	<!-- Buttons -->
	<!-- https://skeleton.dev/docs/tailwind/buttons -->
	<section class="space-y-4">
		<h3 class="h3">Buttons</h3>
		<div class={previewCardClasses}>
			<div class="grid grid-cols-3 gap-4">
				<button type="button" class="btn preset-filled-primary-500">Button</button>
				<button type="button" class="btn preset-tonal-primary">Button</button>
				<button type="button" class="btn preset-outlined-primary-500">Button</button>
				<!-- --- -->
				<button type="button" class="btn preset-filled-secondary-500">Button</button>
				<button type="button" class="btn preset-tonal-secondary">Button</button>
				<button type="button" class="btn preset-outlined-secondary-500">Button</button>
				<!-- --- -->
				<button type="button" class="btn preset-filled-tertiary-500">Button</button>
				<button type="button" class="btn preset-tonal-tertiary">Button</button>
				<button type="button" class="btn preset-outlined-tertiary-500">Button</button>
				<!-- --- -->
				<button type="button" class="btn preset-filled-success-500">Button</button>
				<button type="button" class="btn preset-tonal-success">Button</button>
				<button type="button" class="btn preset-outlined-success-500">Button</button>
				<!-- --- -->
				<button type="button" class="btn preset-filled-warning-500">Button</button>
				<button type="button" class="btn preset-tonal-warning">Button</button>
				<button type="button" class="btn preset-outlined-warning-500">Button</button>
				<!-- --- -->
				<button type="button" class="btn preset-filled-error-500">Button</button>
				<button type="button" class="btn preset-tonal-error">Button</button>
				<button type="button" class="btn preset-outlined-error-500">Button</button>
				<!-- --- -->
				<button type="button" class="btn preset-filled-surface-500">Button</button>
				<button type="button" class="btn preset-tonal-surface">Button</button>
				<button type="button" class="btn preset-outlined-surface-500">Button</button>
			</div>
		</div>
	</section>

	<!-- Card -->
	<!-- https://skeleton.dev/docs/tailwind/cards -->
	<section class="space-y-4">
		<h3 class="h3">Card</h3>
		<div class={previewCardClasses}>
			<a
				href="#card"
				class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
			>
				<header>
					<img
						src="https://images.unsplash.com/photo-1463171515643-952cee54d42a?q=80&w=450&h=190&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
						class="aspect-[21/9] w-full grayscale hue-rotate-90"
						alt="banner"
					/>
				</header>
				<article class="space-y-4 p-4">
					<div>
						<h2 class="h6">Announcements</h2>
						<h3 class="h3">Skeleton is Awesome</h3>
					</div>
					<p class="opacity-60">
						Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam aspernatur provident eveniet eligendi cumque consequatur
						tempore sint nisi sapiente. Iste beatae laboriosam iure molestias cum expedita architecto itaque quae rem.
					</p>
				</article>
				<footer class="flex items-center justify-between gap-4 p-4">
					<small class="opacity-60">By Alex</small>
					<small class="opacity-60">On {new Date().toLocaleDateString()}</small>
				</footer>
			</a>
		</div>
	</section>

	<!-- Forms -->
	<!-- https://skeleton.dev/docs/tailwind/forms -->
	<section class="space-y-4">
		<h3 class="h3">Forms</h3>
		<div class={previewCardClasses}>
			<form class="w-full max-w-xl mx-auto space-y-4">
				<fieldset class="space-y-4">
					<!-- Input -->
					<label class="label">
						<span class="label-text">Input</span>
						<input class="input" type="text" placeholder="Input" />
					</label>
					<!-- Select -->
					<label class="label">
						<span class="label-text">Select</span>
						<select class="select">
							<option value="1">Option 1</option>
							<option value="2">Option 2</option>
							<option value="3">Option 3</option>
							<option value="4">Option 4</option>
							<option value="5">Option 5</option>
						</select>
					</label>
					<!-- Textarea -->
					<label class="label">
						<span class="label-text">Textarea</span>
						<textarea class="textarea rounded-container" rows="4" placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit."
						></textarea>
					</label>
					<!-- Search -->
					<label class="label">
						<span class="label-text">Search</span>
						<input class="input" type="search" placeholder="Search..." />
					</label>
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
					<div class="grid grid-cols-[auto_1fr] gap-2">
						<input class="input" type="color" bind:value={color} />
						<input class="input" type="text" bind:value={color} readonly tabindex="-1" />
					</div>
				</fieldset>
			</form>
		</div>
	</section>

	<!-- -------------------------------------------------------- -->
	<header class={headerClasses}>
		<h2 class="h2">Functional Components</h2>
	</header>
	<!-- -------------------------------------------------------- -->

	<!-- ProgressRing -->
	<!-- https://skeleton.dev/docs/components/progress-ring/svelte -->
	<section class="space-y-4">
		<h3 class="h3">Progress Rings</h3>
		<div class={previewCardClasses}>
			<div class="flex items-center md:space-x-16">
				<ProgressRing classes="hidden md:block" value={25} max={100} />
				<ProgressRing value={25} max={100} showLabel meterStroke="stroke-success-500" />
				<ProgressRing classes="hidden md:block" value={null} meterStroke="stroke-error-500" />
			</div>
		</div>
	</section>

	<!-- <Segment -->
	<!-- https://skeleton.dev/docs/components/segment/svelte -->
	<section class="space-y-4">
		<h3 class="h3">Segment Controls</h3>
		<div class={previewCardClasses}>
			<div class="flex items-center md:space-x-16">
				<Segment name="size" value="xs">
					<Segment.Item value="xs">xs</Segment.Item>
					<Segment.Item value="sm">sm</Segment.Item>
					<Segment.Item value="md">md</Segment.Item>
					<Segment.Item value="lg">lg</Segment.Item>
					<Segment.Item value="xl">xl</Segment.Item>
				</Segment>
			</div>
		</div>
	</section>

	<!-- Slider -->
	<!-- https://skeleton.dev/docs/components/slider/svelte -->
	<section class="space-y-4">
		<h3 class="h3">Sliders</h3>
		<div class={previewCardClasses}>
			<div class="space-y-8 w-full max-w-4xl">
				<Slider value={[50]} meterBg="bg-primary-500" thumbRingColor="ring-primary-500" />
				<Slider value={[25, 50]} meterBg="bg-secondary-500" thumbRingColor="ring-secondary-500" />
				<Slider value={[50]} markers={[25, 50, 75]} meterBg="bg-tertiary-500" thumbRingColor="ring-tertiary-500" />
			</div>
		</div>
	</section>

	<!-- Switch -->
	<!-- https://skeleton.dev/docs/components/switch/svelte -->
	<section class="space-y-4">
		<h3 class="h3">Switch</h3>
		<div class={previewCardClasses}>
			<div class="flex space-x-8">
				<Switch name="example" />
			</div>
		</div>
	</section>

	<!-- -------------------------------------------------------- -->
	<header class={headerClasses}>
		<h2 class="h2">Typography</h2>
	</header>
	<!-- -------------------------------------------------------- -->

	<!-- Headings -->
	<!-- https://skeleton.dev/docs/design/typography#headings -->
	<section class="space-y-4">
		<h3 class="h3">Headings</h3>
		<div class={previewCardClasses}>
			<div class="space-y-4">
				<h1 class="h1">Heading 1</h1>
				<h2 class="h2">Heading 2</h2>
				<h3 class="h3">Heading 3</h3>
				<h4 class="h4">Heading 4</h4>
				<h5 class="h5">Heading 5</h5>
				<h6 class="h6">Heading 6</h6>
			</div>
		</div>
	</section>
</main>
```

## New in SvelteKit 5:
### Runes
#### Reactivity
Reactivity with
let x = "hello
at compontnt top-level is replaced with
let x: string = $state("hello")
This makes x reactive in the component, and also in any js functions that operate on it.
Don't use $state<T>() to pass the type. Always use let x: Type =
Variables declared with let x  = "hello" are no longer reactive.

#### Derived values
Old style:
$: b = a + 1
New style:
let b = $derived(a + 1)
Or
let b = $derived.by( ( ) => {
    ....
    return  a + 1;
} )
for more complex use cases.
$derived() takes and expression. $derived.by() takes a function.

#### Effect

let a = $state(1);
let b = $state(2);
let c;

// This will run when the component is mounted, and for every updates to a and b.
$effect(() => { 
    c = a + b;
});

Note: This does not apply to values that are read asynchronously (promises, setTimeout) inside $effect, they are not tracked.
Note: Values inside the objects are not tracked inside $effect:
This will run once, because `state` is never reassigned (only mutated)
$effect(() => {
	state;
});

This will run whenever `state.value` changes...
$effect(() => {
	state.value;
});
An effect only depends on the values that it read the last time it ran.
$effect(() => {
	if (a || b) { ...}
});
If a was true, b was not read, and the effect won't run when b changes.

## Props
Old way to pass props to a component:
export let a = "hello";
export let b;
New way:
let { a = "hello", b, ...everythingElse } = $props()
a and b are reactive.
Types:
let {a = "hello", b}: {a: string, b: number} = $props()
Note: Do NOT use this syntax for types:
let { x = 42 } = $props<{ x?: string }>();

### Slots and snippets
Instead of using <slot /> in a component, you should now do
let { children } = $props()
...
{@render children()} - this replaces <slot />