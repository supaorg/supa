import { type Component } from 'svelte';

/**
 * Represents a component entry in the registry
 */
export interface ComponentEntry {
  /** The actual Svelte component */
  component: Component;
  /** Default props to pass to the component */
  defaultProps?: Record<string, any>;
}

/**
 * Represents a page entry in the stack
 */
export interface PageEntry {
  /** Unique identifier for this page instance */
  id: string;
  /** ID of the component in the registry */
  componentId: string;
  /** Title to display in the header */
  title?: string;
  /** Props to pass to the component */
  props?: Record<string, any>;
}

/**
 * Spages - Stack-Based Pages Manager
 * 
 * This class handles a stack of pages and component registry.
 * It uses Svelte's $state for reactivity.
 */
export class Spages {
  // Component registry - stores all available components
  componentRegistry: Record<string, ComponentEntry> = $state({});
  
  // Stack of pages
  pages: PageEntry[] = $state([]);
  
  /**
   * Register a component that can be used in pages
   * 
   * @param id Unique ID for the component
   * @param component The Svelte component to register
   * @param defaultProps Default props to pass to the component
   */
  register(id: string, component: Component, defaultProps: Record<string, any> = {}) {
    this.componentRegistry[id] = { component, defaultProps };
    return this; // For chaining
  }
  
  /**
   * Open a new page on top of the stack
   * 
   * @param componentId ID of the registered component
   * @param props Props to pass to the component
   * @param title Optional title for the page
   */
  open(componentId: string, props: Record<string, any> = {}, title?: string) {
    // Check if component exists
    if (!this.componentRegistry[componentId]) {
      console.error(`Component with ID "${componentId}" not found in registry`);
      return this; // For chaining
    }
    
    // Create a unique ID for this page instance
    const id = `${componentId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add to stack
    this.pages = [...this.pages, { id, componentId, props, title }];
    
    return this; // For chaining
  }
  
  /**
   * Remove the top page from the stack
   */
  pop() {
    if (this.pages.length > 0) {
      this.pages = this.pages.slice(0, -1);
    }
    return this; // For chaining
  }
  
  /**
   * Pop until reaching a specific page
   * 
   * @param pageId ID of the page to navigate to
   */
  popTo(pageId: string) {
    const pageIndex = this.pages.findIndex(page => page.id === pageId);
    if (pageIndex !== -1) {
      this.pages = this.pages.slice(0, pageIndex + 1);
    }
    return this; // For chaining
  }
  
  /**
   * Replace the current page with a new one
   * 
   * @param componentId ID of the component to use
   * @param props Props for the component
   * @param title Optional title for the page
   */
  replace(componentId: string, props: Record<string, any> = {}, title?: string) {
    if (this.pages.length === 0) {
      return this.open(componentId, props, title);
    }
    
    // Create a unique ID for this page instance
    const id = `${componentId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Replace the top page
    this.pages = [
      ...this.pages.slice(0, -1),
      { id, componentId, props, title }
    ];
    
    return this;
  }
  
  /**
   * Clear all pages from the stack
   */
  clear() {
    this.pages = [];
    return this; // For chaining
  }
  
  /**
   * Check if a specific component is currently shown
   * 
   * @param componentId ID of the component to check
   */
  isShowing(componentId: string): boolean {
    return this.pages.some(page => page.componentId === componentId);
  }
  
  /**
   * Get the current top page if exists
   */
  get current(): PageEntry | undefined {
    if (this.pages.length === 0) return undefined;
    return this.pages[this.pages.length - 1];
  }
}
