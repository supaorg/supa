export class TargetVisibilityMonitor {
  private intersectionObserver?: IntersectionObserver;
  private mutationObserver?: MutationObserver;
  private element: HTMLElement;
  private onHidden: () => void;
  private isMonitoring = false;

  constructor(element: HTMLElement, onHidden: () => void) {
    this.element = element;
    this.onHidden = onHidden;
  }

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Setup IntersectionObserver for viewport visibility
    this.setupIntersectionObserver();
    
    // Setup MutationObserver for DOM changes
    this.setupMutationObserver();
    
    // Initial visibility check
    this.checkVisibility();
  }

  stop() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    this.intersectionObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  private setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.intersectionRatio === 0) {
          this.onHidden();
        }
      },
      { threshold: 0 }
    );
    this.intersectionObserver.observe(this.element);
  }

  private setupMutationObserver() {
    this.mutationObserver = new MutationObserver(() => {
      // Use requestAnimationFrame to batch checks
      requestAnimationFrame(() => this.checkVisibility());
    });

    // Observe the target element and its ancestors
    let current: Element | null = this.element;
    while (current) {
      this.mutationObserver.observe(current, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        childList: true,
        subtree: false
      });
      current = current.parentElement;
    }
  }

  private checkVisibility() {
    if (!this.isElementVisible()) {
      this.onHidden();
    }
  }

  private isElementVisible(): boolean {
    // Check if element is in DOM
    if (!document.contains(this.element)) {
      return false;
    }

    // Check computed styles
    const styles = window.getComputedStyle(this.element);
    if (styles.display === 'none' || styles.visibility === 'hidden') {
      return false;
    }

    // Check opacity
    if (parseFloat(styles.opacity) === 0) {
      return false;
    }

    // Check element dimensions
    const rect = this.element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    return true;
  }
} 