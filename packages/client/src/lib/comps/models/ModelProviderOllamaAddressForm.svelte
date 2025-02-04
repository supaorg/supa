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

  const defaultAddress = "http://localhost:11434";
  let address = $state(defaultAddress);
  let inputElement = $state<HTMLInputElement | null>(null);
  let checkingAddress = $state(false);

  let timeout: number;

  async function checkAndSaveAddress() {
    checkingAddress = true;
    try {
      // If address is empty, use default
      const addressToCheck = address || defaultAddress;
      const res = await fetch(`${addressToCheck}/api/tags`);
      if (res.status === 200) {
        const config: ModelProviderLocalConfig = {
          id,
          type: "local",
          apiUrl: addressToCheck,
        };
        $currentSpaceStore?.saveModelProviderConfig(config);
        onValidAddress(addressToCheck);
        onClose();
        return true;
      }
    } catch (e) {
      // Address is not valid
    } finally {
      checkingAddress = false;
    }
    return false;
  }

  function handleAddressChange() {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      await checkAndSaveAddress();
    }, 500); // Debounce for 500ms
  }

  async function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      await checkAndSaveAddress();
    }
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
    onkeydown={handleKeyDown}
    placeholder={address ? "" : defaultAddress}
  />
  <button
    class="absolute right-2 top-1/2 -translate-y-1/2"
    onclick={async () => {
      // Try to save if address is valid before closing
      if (!await checkAndSaveAddress()) {
        onClose();
      }
    }}
  >
    <XCircle size={18} />
  </button>
</div>
