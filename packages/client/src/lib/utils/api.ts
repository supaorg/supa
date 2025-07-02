import { authStore } from "$lib/state/auth.svelte";
import { savePointers, appendTreeOps, saveAllSecrets } from "$lib/localDb";
import type { SpaceCreationResponse } from "@core/apiTypes";
import type { SpacePointer } from "$lib/spaces/SpacePointer";
import { spaceStore } from "$lib/state/spaceStore.svelte";

// API Base URL - should match the server
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3131';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status?: number;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set up headers
    const headers: Record<string, string> = {};

    // Only set Content-Type if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Merge in any existing headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Add authorization header if user is authenticated
    const authHeader = await authStore.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      // Token might be expired, logout user
      authStore.logout();
      return {
        success: false,
        error: 'Authentication required',
        status: 401
      };
    }

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || data || `HTTP ${response.status}`,
        status: response.status
      };
    }

    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0 // Network errors don't have a status code
    };
  }
}

// Convenience methods for common HTTP verbs
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export async function fetchSpaces() {
  try {
    const response = await api.get("/spaces");
    if (response.success && response.data) {
      // Transform spaces to SpacePointer format
      const spaces: SpacePointer[] = response.data.map((space: any) => ({
        id: space.id,
        uri: `${API_BASE_URL}/spaces/${space.id}`,
        name: space.name,
        createdAt: new Date(space.created_at || space.createdAt),
        userId: space.owner_id, // Map server's owner_id to client's userId
      }));

      // Fetch details for each space
      for (const space of spaces) {
        console.log(`Fetching details for space ${space.id}`);
        try {
          const spaceResponse = await api.get<SpaceCreationResponse>(
            `/spaces/${space.id}`,
          );
          if (spaceResponse.success && spaceResponse.data) {
            // Save operations for each tree in the space
            const operations = spaceResponse.data.operations;
            if (operations && operations.length > 0) {
              await appendTreeOps(space.id, space.id, operations);
            }
            
            // Save secrets for the space
            const secrets = spaceResponse.data.secrets;
            if (secrets && Object.keys(secrets).length > 0) {
              await saveAllSecrets(space.id, secrets);
            }
            
            console.log(
              `Successfully fetched details for space ${space.id}, ops: ${spaceResponse.data.operations.length}, secrets: ${Object.keys(spaceResponse.data.secrets).length}`,
            );
          }
        } catch (spaceError) {
          console.error(
            `Failed to fetch details for space ${space.id}:`,
            spaceError,
          );
        }
      }

      // Save to local database
      await savePointers(spaces);

      // Filter out duplicates by space.id before adding to store
      const existingIds = new Set(spaceStore.pointers.map(p => p.id));
      const newSpaces = spaces.filter(space => !existingIds.has(space.id));
      spaceStore.pointers = [...spaceStore.pointers, ...newSpaces];
    }
  } catch (error) {
    console.error("Failed to fetch spaces:", error);
  }
}

export async function getSpaceTreeOps(spaceId: string, treeId: string) {
  try {
    const response = await api.get(`/spaces/${spaceId}/${treeId}`);
    if (response.success && response.data) {
      // Save the operations to local database
      await appendTreeOps(spaceId, treeId, response.data);
      return response.data;
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch tree operations for space ${spaceId}, tree ${treeId}:`, error);
    return [];
  }
} 