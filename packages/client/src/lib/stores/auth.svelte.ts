import { browser } from "$app/environment";
import { setCookie, getCookie } from "$lib/utils/cookies";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

class AuthStore {
  user: User | null = $state(null);
  token: string | null = $state(null);
  isAuthenticated = $derived(!!this.user && !!this.token);

  constructor() {
    // Load auth state from cookies on initialization
    if (browser) {
      this.loadFromStorage();
    }
  }

  async setAuth(token: string, user: User) {
    this.token = token;
    this.user = user;
    
    if (browser) {
      // Store token in httpOnly-style cookie (secure)
      setCookie(document, "auth_token", token, 30); // 30 days
      
      // Store user info in localStorage for easy access
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    
    if (browser) {
      // Clear cookie
      setCookie(document, "auth_token", null, 0);
      
      // Clear localStorage
      localStorage.removeItem("user");
    }
  }

  private loadFromStorage() {
    try {
      // Load token from cookie
      const token = getCookie(document, "auth_token");
      
      // Load user from localStorage
      const userJson = localStorage.getItem("user");
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        
        // Validate token is not expired
        const payload = this.parseJWT(token);
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          this.token = token;
          this.user = user;
        } else {
          // Token expired, clear storage
          this.logout();
        }
      }
    } catch (error) {
      console.error("Error loading auth from storage:", error);
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
    return this.token ? `Bearer ${this.token}` : null;
  }
}

// Export singleton instance
export const authStore = new AuthStore(); 