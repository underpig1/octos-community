import { CONFIG } from '../config.js';

export class GameState {
  constructor() {
    // Try to restore state from localStorage
    let restored = false;
    try {
      const raw = localStorage.getItem('harmonicRainFullState');
      if (raw) {
        const state = JSON.parse(raw);
        let nowMs = 0;
        if (typeof state.gameTimeMs === 'number') {
          this.gameTimeMs = state.gameTimeMs;
          nowMs = state.gameTimeMs;
        } else {
          this.gameTimeMs = 0;
        }
        if (Array.isArray(state.spawners)) {
          this.spawners = state.spawners.map(s => {
            const interval = Math.max(1, s.intervalMs || 1);
            const phase = s.phaseMs || 0;
            // Set emittedCount so spawning resumes immediately
            const emittedCount = Math.floor((nowMs - phase) / interval) - 1;
            return {
              ...s,
              emittedCount
            };
          });
          restored = true;
        }
        if (Array.isArray(state.strings)) {
          this.strings = state.strings.map(s => ({...s}));
        } else {
          this.strings = [];
        }
        if (typeof state.helpVisible === 'boolean') this.helpVisible = state.helpVisible;
        else this.helpVisible = true;
      }
    } catch (e) {}
    if (!restored) {
      // Spawners state (multi-spawner)
      this.spawners = [
        { x: window.innerWidth / 2, y: 40, intervalMs: CONFIG.SPAWN_INTERVAL_MS, phaseMs: 0, emittedCount: -1, enabled: true }
      ];
      this.strings = [];
      this.helpVisible = true;
    }
    this.hoveredSpawnerIndex = -1;
    this.draggingSpawnerIndex = -1;
    this.addSpawnerMode = false;
    this.gameTimeMs = 0;
    this.isPlacingString = false;
    this.tempStringStart = null; // {x,y}
    this.hoveredStringIndex = -1;
    this.hoveredHandle = null; // { index:number, endpoint:'a'|'b' }
    this.draggingHandle = null; // { index:number, endpoint:'a'|'b' }
    // Renderer reference (set after construction)
    this.renderer = null;
  }

  spawnerPosition() {
    // Kept for backward compatibility; return first spawner if present
    return this.spawners && this.spawners.length > 0
      ? { x: this.spawners[0].x, y: this.spawners[0].y }
      : { x: window.innerWidth / 2, y: 40 };
  }

  toggleHelp() {
    this.helpVisible = !this.helpVisible;
    const helpEl = document.getElementById('help');
    if (helpEl) {
      helpEl.style.display = this.helpVisible ? 'block' : 'none';
    }
  }

  resetAll() {
    this.strings.length = 0;
    this.isPlacingString = false;
    this.tempStringStart = null;
    this.spawners = [
      { x: window.innerWidth / 2, y: 40, intervalMs: CONFIG.SPAWN_INTERVAL_MS, phaseMs: 0, emittedCount: -1, enabled: true }
    ];
    this.hoveredSpawnerIndex = -1;
    this.draggingSpawnerIndex = -1;
    this.addSpawnerMode = false;
    this.gameTimeMs = 0;
    this.hoveredStringIndex = -1;
    this.hoveredHandle = null;
    this.draggingHandle = null;
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  getStrings() {
    return this.strings;
  }

  getSpawners() {
    return this.spawners;
  }

  isPlacingString() {
    return this.isPlacingString;
  }

  getTempStringStart() {
    return this.tempStringStart;
  }

  getHoveredStringIndex() {
    return this.hoveredStringIndex;
  }

  getHoveredHandle() {
    return this.hoveredHandle;
  }

  getDraggingHandle() {
    return this.draggingHandle;
  }

  isHelpVisible() {
    return this.helpVisible;
  }

  getSpawnAccumulator() {
    return this.spawnAccumulator;
  }

  setSpawnAccumulator(value) {
    this.spawnAccumulator = value;
  }

  // Getters and setters for state properties
  // Spawner interaction flags
  get hoveredSpawnerIndex() { return this._hoveredSpawnerIndex; }
  set hoveredSpawnerIndex(value) { this._hoveredSpawnerIndex = value; }
  
  get draggingSpawnerIndex() { return this._draggingSpawnerIndex; }
  set draggingSpawnerIndex(value) { this._draggingSpawnerIndex = value; }
  
  get addSpawnerMode() { return this._addSpawnerMode; }
  set addSpawnerMode(value) { this._addSpawnerMode = !!value; }

  get isPlacingString() {
    return this._isPlacingString;
  }

  set isPlacingString(value) {
    this._isPlacingString = value;
  }

  get tempStringStart() {
    return this._tempStringStart;
  }

  set tempStringStart(value) {
    this._tempStringStart = value;
  }

  get hoveredStringIndex() {
    return this._hoveredStringIndex;
  }

  set hoveredStringIndex(value) {
    this._hoveredStringIndex = value;
  }

  get hoveredHandle() {
    return this._hoveredHandle;
  }

  set hoveredHandle(value) {
    this._hoveredHandle = value;
  }

  get draggingHandle() {
    return this._draggingHandle;
  }

  set draggingHandle(value) {
    this._draggingHandle = value;
  }

  get helpVisible() {
    return this._helpVisible;
  }

  set helpVisible(value) {
    this._helpVisible = value;
  }

  // Global spawn accumulator removed in favor of per-spawner accumulators
}
