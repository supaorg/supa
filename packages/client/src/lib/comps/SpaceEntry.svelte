<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Loading from "$lib/comps/basic/Loading.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { authStore } from "$lib/stores/auth.svelte";
  import FreshStartWizard from "$lib/comps/wizards/FreshStartWizard.svelte";
  import {
    initializeDatabase,
    savePointers,
    saveCurrentSpaceId,
    saveConfig,
  } from "$lib/localDb";
  import Space from "./apps/Space.svelte";
  import { io, type Socket } from 'socket.io-client';
    import { API_BASE_URL } from "$lib/utils/api";

  type Status = "initializing" | "needsSpace" | "ready";

  let status: Status = $state("initializing");
  let socket: Socket | null = $state(null);
  let socketConnected: boolean = $state(false);
  let pingInterval: NodeJS.Timeout | null = null;

  onMount(async () => {
    // Check auth first
    await authStore.checkAuth();

    // Setup WebSocket connection after auth is complete
    if (authStore.isAuthenticated) {
      await setupSocketConnection();
    }

    // Initialize space data regardless of auth status
    initializeSpaceData();
  });

  onDestroy(() => {
    spaceStore.disconnectAllSpaces();
    cleanupSocketConnection();
  });

  $effect(() => {
    if (status === "initializing") return;

    status = spaceStore.currentSpaceId ? "ready" : "needsSpace";
  });

  async function initializeSpaceData() {
    try {
      // Explicitly set status to initializing (already the default, but making it explicit)
      status = "initializing";

      // Initialize data from database
      const { pointers, currentSpaceId, config } = await initializeDatabase();

      // Set initial state to the spaceStore
      spaceStore.setInitialState({
        pointers,
        currentSpaceId,
        config,
      });

      const connection = await spaceStore.loadSpacesAndConnectToCurrent();

      // Only change status after loading is complete
      status = connection ? "ready" : "needsSpace";
    } catch (error) {
      console.error("Failed to initialize space state from database:", error);
      // Keep initializing state on error? Or maybe add an error state?
    }
  }

  // Effects for persisting state changes
  $effect(() => {
    if (status === "ready") {
      savePointers(spaceStore.pointers);
    }
  });

  $effect(() => {
    if (status === "ready" && spaceStore.currentSpaceId !== null) {
      saveCurrentSpaceId(spaceStore.currentSpaceId);
    }
  });

  $effect(() => {
    if (status === "ready") {
      saveConfig(spaceStore.config);
    }
  });

  $effect(() => {
    // Only check when we're in ready state and have access to the pointers
    if (status === "ready" && spaceStore.pointers.length === 0) {
      console.log("No spaces left, switching to setup state");
      status = "needsSpace";
    }
  });

  async function onSpaceSetup(spaceId: string) {
    status = "ready";
  }

  async function setupSocketConnection() {
    if (!authStore.isAuthenticated || socket) return;

    console.log('Setting up WebSocket connection...');
    
    // Get auth header (async)
    const authHeader = await authStore.getAuthHeader();
    
    // Connect to server WebSocket
    socket = io(API_BASE_URL, {
      auth: {
        token: authHeader ? authHeader.replace('Bearer ', '') : undefined
      }
    });

    // Connection successful
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket?.id);
      socketConnected = true;
    });

    // Connection failed/lost
    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      socketConnected = false;
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
      socketConnected = false;
    });

    // Simple ping/pong for connectivity testing
    socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Send a test ping every 30 seconds
    pingInterval = setInterval(() => {
      if (socket?.connected) {
        socket.emit('ping', { timestamp: Date.now() });
        console.log('🏓 Ping sent');
      }
    }, 30000);
  }

  function cleanupSocketConnection() {
    if (socket) {
      console.log('🧹 Cleaning up WebSocket connection');
      socket.disconnect();
      socket = null;
      socketConnected = false;
    }
    
    // Clear ping interval
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }
</script>

{#if status === "initializing"}
  <Loading />
{:else if status === "needsSpace"}
  <FreshStartWizard />
{:else if status === "ready"}
  <Space />
{/if}
