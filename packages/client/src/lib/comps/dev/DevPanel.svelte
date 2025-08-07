<script lang="ts">
  import { isDevMode } from "@sila/client/state/devMode";
  import { spaceInspectorOpen } from "@sila/client/state/devMode";
  import { clientState } from "@sila/client/state/clientState.svelte";

  async function testInfoDialog() {
    await clientState.dialog.showInfo({
      title: "Information",
      message: "This is an information dialog",
      detail: "This demonstrates the info dialog functionality.",
      buttons: ["OK"]
    });
  }

  async function testWarningDialog() {
    await clientState.dialog.showWarning({
      title: "Warning",
      message: "This is a warning dialog",
      detail: "This demonstrates the warning dialog functionality.",
      buttons: ["OK"]
    });
  }

  async function testErrorDialog() {
    await clientState.dialog.showError({
      title: "Error",
      message: "This is an error dialog",
      detail: "This demonstrates the error dialog functionality.",
      buttons: ["OK"]
    });
  }

  async function testQuestionDialog() {
    const result = await clientState.dialog.showQuestion({
      title: "Question",
      message: "Do you want to proceed?",
      detail: "This demonstrates the question dialog functionality.",
      buttons: ["Yes", "No", "Cancel"],
      defaultId: 0,
      cancelId: 2
    });
    
    console.log(`User clicked button ${result.response}: ${["Yes", "No", "Cancel"][result.response]}`);
  }

  function testErrorBox() {
    clientState.dialog.showErrorBox("Simple Error", "This is a simple error box that doesn't block the process.");
  }
</script>

<div class="flex flex-col gap-4 p-2">
  <div class="flex gap-4 items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="text-sm text-surface-600-300-token">🚧 Sila v1.0.0 in Dev Mode</div>
      <button class="btn btn-sm variant-soft" onclick={() => $isDevMode = false}>Exit Dev Mode</button>
    </div>
    <button class="btn btn-sm variant-soft" onclick={() => $spaceInspectorOpen ? ($spaceInspectorOpen = false) : ($spaceInspectorOpen = true)}>
      {$spaceInspectorOpen ? 'Close Space Inspector' : 'Open Space Inspector'}
    </button>
  </div>
  
  <!-- Dialog Testing Section -->
  <div class="flex flex-col gap-2 p-2 border border-surface-300-600-token rounded">
    <h4 class="text-sm font-semibold text-surface-700-200-token">Dialog Testing</h4>
    <div class="flex gap-2 flex-wrap">
      <button class="btn btn-sm variant-soft-primary" onclick={testInfoDialog}>
        Test Info Dialog
      </button>
      <button class="btn btn-sm variant-soft-warning" onclick={testWarningDialog}>
        Test Warning Dialog
      </button>
      <button class="btn btn-sm variant-soft-error" onclick={testErrorDialog}>
        Test Error Dialog
      </button>
      <button class="btn btn-sm variant-soft-secondary" onclick={testQuestionDialog}>
        Test Question Dialog
      </button>
      <button class="btn btn-sm variant-soft-surface" onclick={testErrorBox}>
        Test Error Box
      </button>
    </div>
  </div>
</div>
