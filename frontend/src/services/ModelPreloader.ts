// ──────────────────────────────────────────────────────────
// ModelPreloader — Singleton Sketchfab iframe preloader
// Creates hidden iframes to warm Sketchfab CDN & browser cache
// so 3D models appear instantly when the user navigates to them.
// ──────────────────────────────────────────────────────────

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PreloadEntry {
  modelId: string;
  iframe: HTMLIFrameElement | null;
  status: ModelStatus;
  listeners: Array<() => void>;
}

class ModelPreloaderService {
  private models = new Map<string, PreloadEntry>();
  private container: HTMLDivElement | null = null;

  /** Build the Sketchfab embed URL with all UI chrome stripped */
  private buildSrc(modelId: string): string {
    return `https://sketchfab.com/models/${modelId}/embed?autostart=1&transparent=1&ui_theme=dark&ui_controls=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&ui_title=0&ui_author=0&ui_hint=0&camera=0&preload=1&scrollwheel=0&dnt=1&max_texture_size=1024&graph_optimizer=1`;
  }

  /** Lazily create the off-screen container for hidden iframes */
  private ensureContainer(): HTMLDivElement {
    if (this.container) return this.container;
    const div = document.createElement('div');
    div.id = 'model-preloader-container';
    div.setAttribute('aria-hidden', 'true');
    Object.assign(div.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      opacity: '0',
      pointerEvents: 'none',
      visibility: 'hidden',
    });
    document.body.appendChild(div);
    this.container = div;
    return div;
  }

  /** Start preloading a model — creates a hidden iframe */
  preloadModel(modelId: string): void {
    if (this.models.has(modelId)) return; // Already tracked

    const entry: PreloadEntry = {
      modelId,
      iframe: null,
      status: 'loading',
      listeners: [],
    };
    this.models.set(modelId, entry);

    const container = this.ensureContainer();
    const iframe = document.createElement('iframe');
    iframe.src = this.buildSrc(modelId);
    iframe.title = `preload-${modelId}`;
    iframe.setAttribute('loading', 'eager');
    iframe.setAttribute('tabindex', '-1');
    Object.assign(iframe.style, {
      width: '1px',
      height: '1px',
      border: 'none',
    });

    iframe.onload = () => {
      entry.status = 'ready';
      entry.listeners.forEach((cb) => cb());
      entry.listeners = [];
    };

    iframe.onerror = () => {
      entry.status = 'error';
      entry.listeners.forEach((cb) => cb());
      entry.listeners = [];
    };

    entry.iframe = iframe;
    container.appendChild(iframe);
  }

  /** Check if a model iframe has finished loading */
  isModelReady(modelId: string): boolean {
    return this.models.get(modelId)?.status === 'ready';
  }

  /** Get the current status of a model */
  getStatus(modelId: string): ModelStatus {
    return this.models.get(modelId)?.status ?? 'idle';
  }

  /** Wait until a model is ready (Promise-based) */
  waitForModel(modelId: string): Promise<void> {
    const entry = this.models.get(modelId);
    if (!entry) {
      this.preloadModel(modelId);
      return this.waitForModel(modelId);
    }
    if (entry.status === 'ready' || entry.status === 'error') {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      entry.listeners.push(resolve);
    });
  }

  /** Preload the first N models from a list of IDs (hero gets priority) */
  preloadBatch(modelIds: string[], count = 2): void {
    modelIds.slice(0, count).forEach((id) => this.preloadModel(id));
  }

  /** Clean up all hidden iframes (call on app unmount if needed) */
  dispose(): void {
    this.models.forEach((entry) => {
      if (entry.iframe && entry.iframe.parentElement) {
        entry.iframe.parentElement.removeChild(entry.iframe);
      }
    });
    this.models.clear();
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
  }
}

// Export as a singleton
export const ModelPreloader = new ModelPreloaderService();
