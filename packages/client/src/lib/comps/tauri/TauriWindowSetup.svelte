<script lang="ts">
  import {
    getCurrentWindow,
    currentMonitor,
    PhysicalSize,
    PhysicalPosition,
  } from "@tauri-apps/api/window";
  import { onMount } from "svelte";
  import {
    tauriWindowStore,
    type TauriWindow,
  } from "$lib/tauri/tauriWindowStore";

  const appWindow = getCurrentWindow();

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

    appWindow.setSize(
      new PhysicalSize(
        $tauriWindowStore.windowWidth,
        $tauriWindowStore.windowHeight,
      ),
    );

    appWindow.setPosition(
      new PhysicalPosition(
        $tauriWindowStore.windowPositionX,
        $tauriWindowStore.windowPositionY,
      ),
    );
  }

  onMount(async () => {
    // @TODO: make it work again
    // We show the window after Svelte is fully loaded to prevent flickering
    //console.log("is visible", await appWindow.isVisible());
    //await invoke("show_main_window");
    //await appWindow.setVisibleOnAllWorkspaces(true);
    //await appWindow.show();

    setupWindow();

    appWindow.onResized(() => {
      saveWindowSetupAfterTinyDelay();
    });

    appWindow.onMoved(() => {
      saveWindowSetupAfterTinyDelay();
    });
  });
</script>
