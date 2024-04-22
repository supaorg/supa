<script lang="ts">
  import { isTauri } from "$lib/tauri/serverInTauri";
  import { invoke } from "@tauri-apps/api";
  import {
    appWindow,
    currentMonitor,
    availableMonitors,
  } from "@tauri-apps/api/window";
  import { onMount } from "svelte";
  import {
    tauriWindowStore,
    type TauriWindow,
  } from "$lib/stores/tauriWindowStore";

  // With this function, we make sure that we don't save the window setup too often when multiple events are fired in a short time
  let timeoutId: any;
  function saveWindowSetupAfterTinyDelay() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      saveWindowSetup();
    }, 50);
  }

  async function saveWindowSetup() {
    const currentMonitorInfo = await currentMonitor();

    if (currentMonitorInfo === null) {
      return;
    }

    const windowSize = await appWindow.innerSize();
    const windowPosition = await appWindow.innerPosition();

    const window = {
      monitorName: currentMonitorInfo.name,
      monitorScaleFactor: currentMonitorInfo.scaleFactor,
      monitorWidth: currentMonitorInfo.size.width,
      monitorHeight: currentMonitorInfo.size.height,
      monitorPositionX: currentMonitorInfo.position.x,
      monitorPositionY: currentMonitorInfo.position.y,
      windowIsFullScreen: await appWindow.isFullscreen(),
      windowWidth: windowSize.width,
      windowHeight: windowSize.height,
      windowPositionX: windowPosition.x,
      windowPositionY: windowPosition.y,
    } as TauriWindow;

    tauriWindowStore.set(window);
  }

  async function setupWindow() {
    if ($tauriWindowStore === null) {
      return;
    }

    appWindow.setFullscreen($tauriWindowStore.windowIsFullScreen);

    // If the window is in fullscreen mode, we don't need to apply size and position
    if ($tauriWindowStore.windowIsFullScreen) {
      return;
    }

    const currentMonitorInfo = await currentMonitor();
    if (currentMonitorInfo === null) {
      return;
    }

    // Don't apply if the monitor has different resolution and scale factor as the saved one
    if (
      $tauriWindowStore.monitorWidth !== currentMonitorInfo.size.width ||
      $tauriWindowStore.monitorHeight !== currentMonitorInfo.size.height
    ) {
      return;
    }

    appWindow.setSize({
      type: "Physical",
      width: $tauriWindowStore.windowWidth,
      height: $tauriWindowStore.windowHeight,
    });

    appWindow.setPosition({
      type: "Physical",
      x: $tauriWindowStore.windowPositionX,
      y: $tauriWindowStore.windowPositionY,
    });
  }

  onMount(async () => {
    if (!isTauri()) {
      console.error("This component is only available in Tauri");
      return;
    }

    await invoke("show_main_window");
    // @TODO: why doesn't this work?
    //appWindow.show();

    appWindow.onResized(() => {
      saveWindowSetupAfterTinyDelay();
    });

    appWindow.onMoved(() => {
      saveWindowSetupAfterTinyDelay();
    });

    setupWindow();
  });
</script>
