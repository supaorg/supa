<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { ModelProviderLocalConfig } from "@core/models";
  import { XCircle } from "lucide-svelte/icons";

  let {
    id,
    onValidAddress,
    onBlur = () => {},
    onClose = () => {},
    autofocus = true,
  } = $props<{
    id: string;
    onValidAddress: (address: string) => void;
    onBlur?: (address: string) => void;
    onClose?: () => void;
    autofocus?: boolean;
  }>();

  let address = $state("http://localhost:11434");
  let inputElement = $state<HTMLInputElement | null>(null);
  let checkingAddress = $state(false);

  let timeout: number;

  async function handleAddressChange() {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      checkingAddress = true;
      try {
        const res = await fetch(`${address}/api/tags`);
        if (res.status === 200) {
          const config: ModelProviderLocalConfig = {
            id,
            type: "local",
            apiUrl: address,
          };
          $currentSpaceStore?.saveModelProviderConfig(config);
          onValidAddress(address);
          onClose();
        }
      } catch (e) {
        // Address is not valid
      } finally {
        checkingAddress = false;
      }
    }, 500); // Debounce for 500ms
  }

  function handleBlur() {
    onBlur(address);
  }

  $effect(() => {
    if (autofocus && inputElement) {
      inputElement.focus();
    }
  });
</script>

<div class="relative">
  <input
    class="input w-full"
    type="text"
    bind:value={address}
    bind:this={inputElement}
    oninput={handleAddressChange}
    onblur={handleBlur}
    placeholder="http://localhost:11434"
  />
  <button
    class="absolute right-2 top-1/2 -translate-y-1/2"
    onclick={onClose}
  >
    <XCircle size={18} />
  </button>
</div>
