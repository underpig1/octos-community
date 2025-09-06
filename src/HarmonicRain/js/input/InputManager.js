import { CONFIG } from '../config.js';
import { pointToSegmentDistance } from '../utils/math.js';

export class InputManager {
  constructor(canvas, gameState, audioManager) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.mouse = { x: 0, y: 0 };
    this.draggingStringIndex = -1;
    this.dragStart = null; // { mouse:{x,y}, a:{x,y}, b:{x,y} }
    this.spawnerDragOffset = { x: 0, y: 0 };
    this.mouseDownAt = null; // {t, x, y}
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Keyboard events
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    if (this.gameState.draggingSpawnerIndex >= 0) {
      const i = this.gameState.draggingSpawnerIndex;
      const sp = this.gameState.spawners[i];
      if (sp) {
        sp.x = this.mouse.x - this.spawnerDragOffset.x;
        sp.y = this.mouse.y - this.spawnerDragOffset.y;
        if (window.harmonicRainSaveState) window.harmonicRainSaveState();
      }
    }
    
    // Drag whole string by center
    if (this.draggingStringIndex >= 0 && this.dragStart) {
      const s = this.gameState.strings[this.draggingStringIndex];
      if (s) {
        const dx = this.mouse.x - this.dragStart.mouse.x;
        const dy = this.mouse.y - this.dragStart.mouse.y;
        s.a = { x: this.dragStart.a.x + dx, y: this.dragStart.a.y + dy };
        s.b = { x: this.dragStart.b.x + dx, y: this.dragStart.b.y + dy };
        if (window.harmonicRainSaveState) window.harmonicRainSaveState();
      }
    }
    
    this.updateHoverStates(e.clientX, e.clientY);
  }

  handleMouseDown(e) {
    if (e.button !== 0) return; // left only
    
    this.audioManager.ensureAudio(); // unlock on first interaction
    const p = { x: e.clientX, y: e.clientY };
    this.mouseDownAt = { t: performance.now(), x: p.x, y: p.y };
    
    // Add spawner mode: clicking anywhere places a new spawner
    if (this.gameState.addSpawnerMode) {
      this.addSpawnerAt(p.x, p.y);
      return;
    }

    // Check if clicking on any spawner
    const sps = this.gameState.spawners;
    for (let i = 0; i < sps.length; i++) {
      const sp = sps[i];
      const dist = Math.hypot(p.x - sp.x, p.y - sp.y);
      if (dist <= CONFIG.SPAWNER_RADIUS + 5) {
        // Defer deciding between click vs drag until mousemove/up
        this.gameState.draggingSpawnerIndex = i;
        this.spawnerDragOffset = { x: p.x - sp.x, y: p.y - sp.y };
        this.canvas.style.cursor = 'grabbing';
        return;
      }
    }
    
    // Check if clicking a handle to drag endpoint
    if (this.gameState.hoveredHandle) {
      this.gameState.draggingHandle = { ...this.gameState.hoveredHandle };
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    
    // Drag whole string if clicking near its center while hovered
    if (this.gameState.hoveredStringIndex >= 0) {
      const idx = this.gameState.hoveredStringIndex;
      const s = this.gameState.strings[idx];
      if (s) {
        const midX = (s.a.x + s.b.x) / 2;
        const midY = (s.a.y + s.b.y) / 2;
        const distMid = Math.hypot(p.x - midX, p.y - midY);
        if (distMid <= CONFIG.HOVER_THRESHOLD) {
          this.draggingStringIndex = idx;
          this.dragStart = {
            mouse: { x: p.x, y: p.y },
            a: { x: s.a.x, y: s.a.y },
            b: { x: s.b.x, y: s.b.y }
          };
          this.canvas.style.cursor = 'grabbing';
          return;
        }
      }
    }
    
    // Start creating a new string
    this.gameState.isPlacingString = true;
    this.gameState.tempStringStart = p;
    this.canvas.style.cursor = 'crosshair';
  }

  handleMouseUp(e) {
    if (e.button !== 0) return; // left only
    
    if (this.gameState.draggingSpawnerIndex >= 0) {
      const i = this.gameState.draggingSpawnerIndex;
      const sp = this.gameState.spawners[i];
      const wasDrag = this.mouseDownAt && (Math.hypot(e.clientX - this.mouseDownAt.x, e.clientY - this.mouseDownAt.y) > 4);
      const shortClick = this.mouseDownAt && (performance.now() - this.mouseDownAt.t < 250);
      this.gameState.draggingSpawnerIndex = -1;
      this.canvas.style.cursor = 'default';
      if (!wasDrag && shortClick && sp) {
        // Toggle enabled on short click
        sp.enabled = !sp.enabled;
      }
      if (window.harmonicRainSaveState) window.harmonicRainSaveState();
      return;
    }
    
    if (this.gameState.draggingHandle) {
      this.gameState.draggingHandle = null;
      this.canvas.style.cursor = 'default';
      if (window.harmonicRainSaveState) window.harmonicRainSaveState();
      return;
    }
    
    if (this.draggingStringIndex >= 0) {
      this.draggingStringIndex = -1;
      this.dragStart = null;
      this.canvas.style.cursor = 'default';
      if (window.harmonicRainSaveState) window.harmonicRainSaveState();
      return;
    }
    
    if (this.gameState.isPlacingString && this.gameState.tempStringStart) {
      // Finalize the string
      const p = { x: e.clientX, y: e.clientY };
      if (this.getDistance(this.gameState.tempStringStart, p) >= CONFIG.MIN_STRING_LENGTH) {
        this.gameState.strings.push({ 
          a: this.gameState.tempStringStart, 
          b: p, 
          tune: 0, 
          impulses: [] 
        });
        if (window.harmonicRainSaveState) window.harmonicRainSaveState();
      }
      this.gameState.isPlacingString = false;
      this.gameState.tempStringStart = null;
    }
  }

  handleWheel(e) {
    const mx = e.clientX, my = e.clientY;

    // First: if hovering a spawner, scroll adjusts interval; Ctrl+scroll adjusts phase
    let handled = false;
    if (Array.isArray(this.gameState.spawners)) {
      for (let i = 0; i < this.gameState.spawners.length; i++) {
        const sp = this.gameState.spawners[i];
        const d = Math.hypot(mx - sp.x, my - sp.y);
        if (d <= CONFIG.SPAWNER_RADIUS + 10) {
          e.preventDefault();
          const dir = e.deltaY > 0 ? -1 : 1; // natural: up = increase, down = decrease
          const coarse = 50, fine = 10;
          if (e.ctrlKey || e.metaKey) {
            // Adjust phase (offset) modulo interval
            const interval = Math.max(1, sp.intervalMs || 1);
            const step = (e.shiftKey ? fine : coarse) * dir;
            const nextPhase = ((sp.phaseMs || 0) + step) % interval;
            sp.phaseMs = (nextPhase + interval) % interval;
            // Recompute emittedCount relative to now so next spawn timing is stable
            const now = this.gameState.gameTimeMs || 0;
            sp.emittedCount = Math.floor(((now - sp.phaseMs) / interval)) - 1;
          } else {
            // Adjust interval within bounds
            const minMs = 50, maxMs = 5000;
            const step = (e.shiftKey ? fine : coarse) * dir;
            sp.intervalMs = Math.max(minMs, Math.min(maxMs, (sp.intervalMs || 0) + step));
            // Keep phase within new interval
            const interval = Math.max(1, sp.intervalMs);
            const phase = sp.phaseMs || 0;
            sp.phaseMs = ((phase % interval) + interval) % interval;
            // Reset emittedCount so the schedule updates cleanly
            const now = this.gameState.gameTimeMs || 0;
            sp.emittedCount = Math.floor(((now - sp.phaseMs) / interval)) - 1;
          }
          handled = true;
          break;
        }
      }
    }

    if (handled) return;

    // Otherwise: string label tuning via scroll over label rect
    const currentLabelRect = this.gameState.renderer.getCurrentLabelRect();
    if (!currentLabelRect) return;
    const r = currentLabelRect;
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
      e.preventDefault();
      const idx = r.index;
      if (!this.gameState.strings[idx]) return;
      const step = (e.deltaY > 0 ? -1 : 1) * (e.shiftKey ? 0.1 : 1);
      this.gameState.strings[idx].tune = (this.gameState.strings[idx].tune || 0) + step;
    }
  }

  handleDoubleClick(e) {
    const p = { x: e.clientX, y: e.clientY };
    if (this.gameState.strings.length === 0) return;
    let bestIdx = -1, bestDist = Infinity;
    for (let i = 0; i < this.gameState.strings.length; i++) {
      const s = this.gameState.strings[i];
      const d = pointToSegmentDistance(p, s.a, s.b);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx >= 0 && bestDist <= CONFIG.DELETE_THRESHOLD) {
      this.gameState.strings.splice(bestIdx, 1);
      if (window.harmonicRainSaveState) window.harmonicRainSaveState();
    }
  }

  handleKeyDown(e) {
    const k = e.key;
    if (k === 'Escape') {
      if (this.gameState.isPlacingString) {
        this.gameState.isPlacingString = false;
        this.gameState.tempStringStart = null;
      }
    } else if (k === 'c' || k === 'C') {
      this.gameState.strings.length = 0;
    } else if (k === 'm' || k === 'M') {
      const isMuted = this.audioManager.toggleMute();
      this.updateHelpText(isMuted);
    } else if (k === 'h' || k === 'H') {
      this.gameState.toggleHelp();
    } else if (k === 'r' || k === 'R') {
      this.gameState.resetAll();
    }
  }

  updateHoverStates(x, y) {
    const p = { x, y };
    
    // Check if hovering over any spawner
    this.gameState.hoveredSpawnerIndex = -1;
    const sps = this.gameState.spawners;
    for (let i = 0; i < sps.length; i++) {
      const sp = sps[i];
      const d = Math.hypot(p.x - sp.x, p.y - sp.y);
      if (d <= CONFIG.SPAWNER_RADIUS + 5) {
        this.gameState.hoveredSpawnerIndex = i;
        this.canvas.style.cursor = this.gameState.draggingSpawnerIndex >= 0 ? 'grabbing' : 'grab';
        return;
      }
    }
    
    this.gameState.hoveredStringIndex = -1;
    this.gameState.hoveredHandle = null;
    
    // Handle detection first so it wins over deletion/hover-on-line
    for (let i = 0; i < this.gameState.strings.length; i++) {
      const s = this.gameState.strings[i];
      const distA = Math.hypot(p.x - s.a.x, p.y - s.a.y);
      const distB = Math.hypot(p.x - s.b.x, p.y - s.b.y);
      
      if (distA <= CONFIG.HANDLE_HIT_RADIUS) {
        this.gameState.hoveredHandle = { index: i, endpoint: 'a' };
        break;
      }
      if (distB <= CONFIG.HANDLE_HIT_RADIUS) {
        this.gameState.hoveredHandle = { index: i, endpoint: 'b' };
        break;
      }
    }
    
    if (this.gameState.hoveredHandle) {
      this.canvas.style.cursor = this.gameState.draggingHandle ? 'grabbing' : 'grab';
      return;
    }
    
    // Otherwise, check proximity to a string; label/cursor only at midpoint
    if (this.gameState.strings.length > 0) {
      let bestIdx = -1, bestDist = Infinity;
      for (let i = 0; i < this.gameState.strings.length; i++) {
        const s = this.gameState.strings[i];
        const d = pointToSegmentDistance(p, s.a, s.b);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      
      if (bestIdx >= 0 && bestDist <= CONFIG.HOVER_THRESHOLD) {
        this.gameState.hoveredStringIndex = bestIdx;
        const s = this.gameState.strings[bestIdx];
        const midX = (s.a.x + s.b.x) / 2;
        const midY = (s.a.y + s.b.y) / 2;
        const distMid = Math.hypot(p.x - midX, p.y - midY);
        // Hand cursor when at center (label visible), else pointer near string
        this.canvas.style.cursor = (distMid <= CONFIG.HOVER_THRESHOLD) ? 'grab' : 'pointer';
        return;
      }
    }
    
    // Default cursor
    if (this.gameState.addSpawnerMode) {
      this.canvas.style.cursor = 'copy';
    } else {
      this.canvas.style.cursor = this.gameState.isPlacingString ? 'crosshair' : 'default';
    }
  }

  updateHelpText(isMuted) {
    const helpEl = document.getElementById('help');
    if (helpEl) {
      helpEl.textContent = `Left click: delete string · Drag: create string · Drag spawner to move · ${isMuted ? 'Muted (M to unmute)' : 'M to mute'}`;
    }
  }

  getDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  getMouse() {
    return this.mouse;
  }

  updateDraggingHandle() {
    if (this.gameState.draggingHandle) {
      const s = this.gameState.strings[this.gameState.draggingHandle.index];
      if (s) {
        const endpoint = this.gameState.draggingHandle.endpoint;
        s[endpoint] = { x: this.mouse.x, y: this.mouse.y };
      }
    }
  }

  addSpawnerAt(x, y) {
  const defaultInterval = CONFIG.SPAWN_INTERVAL_MS;
  this.gameState.spawners.push({ x, y, intervalMs: defaultInterval, phaseMs: 0, emittedCount: -1 });
  // Remain in add mode until user toggles it off
  this.canvas.style.cursor = 'copy';
  if (window.harmonicRainSaveState) window.harmonicRainSaveState();
  }
}
