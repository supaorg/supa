<script lang="ts">
  import type { VertexPropertyType } from "reptree/treeTypes";

  let { onCreate, onCancel }: { 
    onCreate: (key: string, value: VertexPropertyType) => void;
    onCancel: () => void;
  } = $props();

  let key = $state("");
  let type = $state<"string" | "number" | "boolean">("string");
  let stringValue = $state("");
  let numberValue = $state<number>(0);
  let booleanValue = $state(false);

  function handleSubmit() {
    if (!key) return;

    let value: VertexPropertyType;
    switch (type) {
      case "string":
        value = stringValue;
        break;
      case "number":
        value = numberValue;
        break;
      case "boolean":
        value = booleanValue;
        break;
    }

    onCreate(key, value);
  }
</script>

<div class="flex flex-col gap-2 p-2 bg-surface-500/5 rounded-container-token">
  <div class="flex gap-2">
    <input
      type="text"
      class="input input-sm flex-[3] text-left text-xs h-6 px-1"
      placeholder="Property key"
      bind:value={key}
    />
    <select
      class="select text-xs h-6 px-1 flex-1 min-w-[80px]"
      bind:value={type}
    >
      <option value="string">String</option>
      <option value="number">Number</option>
      <option value="boolean">Boolean</option>
    </select>
  </div>

  <div class="flex gap-2">
    {#if type === "string"}
      <input
        type="text"
        class="input input-sm flex-1 text-left text-xs h-6 px-1"
        placeholder="Value"
        bind:value={stringValue}
      />
    {:else if type === "number"}
      <input
        type="number"
        class="input input-sm flex-1 text-left text-xs h-6 px-1"
        placeholder="Value"
        bind:value={numberValue}
      />
    {:else if type === "boolean"}
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="h-3 w-3"
          bind:checked={booleanValue}
        />
        <span class="text-xs">Value</span>
      </label>
    {/if}
  </div>

  <div class="flex gap-2 justify-end">
    <button
      class="btn btn-sm variant-soft-error"
      onclick={onCancel}
    >
      Cancel
    </button>
    <button
      class="btn btn-sm variant-soft-primary"
      onclick={handleSubmit}
    >
      Create
    </button>
  </div>
</div> 