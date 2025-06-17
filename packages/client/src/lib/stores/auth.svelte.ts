import { browser } from "$app/environment";
import { setCookie, getCookie } from "$lib/utils/cookies";
import { apiRequest } from "$lib/utils/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class AuthStore {
  user: User | null = $state(null);
  accessToken: string | null = $state(null);
  refreshToken: string | null = $state(null);
  tokenExpiry: number | null = $state(null);
  isAuthenticated = $derived(!!this.user && !!this.accessToken);

  constructor() {
    // Load auth state from cookies on initialization
    if (browser) {
      this.loadFromStorage();
    }
  }

  async setAuth(tokens: AuthTokens, user: User) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
    this.user = user;
    
    if (browser) {
      // Store tokens in httpOnly-style cookies (secure)
      setCookie(document, "access_token", tokens.access_token, 1); // 1 day
      setCookie(document, "refresh_token", tokens.refresh_token, 30); // 30 days
      
      // Store user info in localStorage for easy access
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.user = null;
    
    if (browser) {
      // Clear cookies
      setCookie(document, "access_token", null, 0);
      setCookie(document, "refresh_token", null, 0);
      
      // Clear localStorage
      localStorage.removeItem("user");
    }
  }

  private loadFromStorage() {
    try {
      // Load tokens from cookies
      const accessToken = getCookie(document, "access_token");
      const refreshToken = getCookie(document, "refresh_token");
      
      // Load user from localStorage
      const userJson = localStorage.getItem("user");
      
      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson);
        
        // Validate access token is not expired
        const payload = this.parseJWT(accessToken);
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          this.tokenExpiry = payload.exp * 1000;
          this.user = user;
        } else {
          // Access token expired, try to refresh
          this.refreshTokens();
        }
      }
    } catch (error) {
      console.error("Error loading auth from storage:", error);
      this.logout();
    }
  }

  private async refreshTokens() {
    if (!this.refreshToken) {
      this.logout();
      return;
    }

    try {
      const response = await apiRequest<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });

      if (response.success && response.data) {
        // Get fresh user info
        const userResponse = await apiRequest<User>('/auth/me', {
          headers: {
            'Authorization': `Bearer ${response.data.access_token}`
          }
        });

        if (userResponse.success && userResponse.data) {
          await this.setAuth(response.data, userResponse.data);
        } else {
          throw new Error('Failed to get user info');
        }
      } else {
        throw new Error(response.error || 'Failed to refresh tokens');
      }
    } catch (error) {
      console.error("Error refreshing tokens:", error);
      this.logout();
    }
  }

  private parseJWT(token: string) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }

  // Get the authorization header for API requests
  getAuthHeader(): string | null {
    if (!this.accessToken) return null;
    
    // Check if token is expired or about to expire (within 5 minutes)
    if (this.tokenExpiry && this.tokenExpiry - Date.now() < 5 * 60 * 1000) {
      // Token is expired or about to expire, refresh it
      this.refreshTokens();
    }
    
    return `Bearer ${this.accessToken}`;
  }
}

// Export singleton instance
export const authStore = new AuthStore(); 