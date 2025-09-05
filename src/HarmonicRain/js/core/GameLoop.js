import { CONFIG } from '../config.js';

export class GameLoop {
  constructor(gameState, physicsEngine, renderer, inputManager) {
    this.gameState = gameState;
    this.physicsEngine = physicsEngine;
    this.renderer = renderer;
    this.inputManager = inputManager;
    
    this.lastTs = performance.now();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTs = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.isRunning = false;
  }

  loop(ts) {
    if (!this.isRunning) return;
    
    const dt = Math.min(0.033, Math.max(0.001, (ts - this.lastTs) / 1000));
    this.lastTs = ts;
    
    // Advance global game time
    this.gameState.gameTimeMs += dt * 1000;
    const nowMs = this.gameState.gameTimeMs;

    // Deterministic spawn timing per spawner based on global time and phase
    const spawners = this.gameState.getSpawners();
    for (let i = 0; i < spawners.length; i++) {
      const sp = spawners[i];
      if (sp.enabled === false) continue;
      const interval = Math.max(1, sp.intervalMs || 1);
      const phase = sp.phaseMs || 0;
      const targetCount = Math.floor((nowMs - phase) / interval);
      if (sp.emittedCount === undefined || sp.emittedCount === null) sp.emittedCount = -1;
      if (targetCount > sp.emittedCount) {
        // Emit all missed balls (usually 1, but robust to hitches)
        for (let c = sp.emittedCount + 1; c <= targetCount; c++) {
          this.physicsEngine.spawnBall({ x: sp.x, y: sp.y });
        }
        sp.emittedCount = targetCount;
      }
    }

    // Update physics
    this.physicsEngine.step(
      dt, 
      this.gameState.strings, 
      this.gameState.isPlacingString, 
      this.gameState.tempStringStart, 
      this.inputManager.getMouse()
    );

    // Update dragging handle position
    this.inputManager.updateDraggingHandle();

    // Sync visual time for oscillations
    this.renderer.simTimeSec = this.physicsEngine.getSimTime();
    this.renderer.gameTimeMs = nowMs;

    // Render
    this.renderer.clear();
    this.renderer.drawSpawners(spawners, this.gameState.hoveredSpawnerIndex);
    this.renderer.drawStrings(
      this.gameState.strings,
      this.gameState.hoveredStringIndex,
      this.gameState.hoveredHandle,
      this.gameState.draggingHandle,
      this.gameState.isPlacingString,
      this.gameState.tempStringStart,
      this.inputManager.getMouse()
    );
    this.renderer.drawBalls(this.physicsEngine.getBalls());

    // Continue loop
    requestAnimationFrame((ts2) => this.loop(ts2));
  }

  getLastTimestamp() {
    return this.lastTs;
  }
}
