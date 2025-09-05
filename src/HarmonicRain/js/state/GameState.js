import { CONFIG } from '../config.js';

export class GameState {
  constructor() {
    // Spawners state (multi-spawner)
    this.spawners = [
      { x: window.innerWidth / 2, y: 40, intervalMs: CONFIG.SPAWN_INTERVAL_MS, phaseMs: 0, emittedCount: -1, enabled: true }
    ];
    this.hoveredSpawnerIndex = -1;
    this.draggingSpawnerIndex = -1;
    this.addSpawnerMode = false;
    this.gameTimeMs = 0;
    
    // String state
    this.strings = []; // {a:{x,y}, b:{x,y}, tune?:number, impulses?:[]}
    this.isPlacingString = false;
    this.tempStringStart = null; // {x,y}
    
    // Interaction state for strings
    this.hoveredStringIndex = -1;
    this.hoveredHandle = null; // { index:number, endpoint:'a'|'b' }
    this.draggingHandle = null; // { index:number, endpoint:'a'|'b' }
    
    // Help state
    this.helpVisible = true;
    
    // Legacy global spawn timing removed; each spawner owns its own time
    
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
