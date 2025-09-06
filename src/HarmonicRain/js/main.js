import { AudioManager } from './audio/AudioManager.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { Renderer } from './rendering/Renderer.js';
import { InputManager } from './input/InputManager.js';
import { UIManager } from './ui/UIManager.js';
import { GameState } from './state/GameState.js';
import { GameLoop } from './core/GameLoop.js';

class HarmonicRainApp {
  constructor() {
    this.canvas = document.getElementById('scene');
    if (!this.canvas) {
      console.error('Canvas element not found');
      return;
    }

    this.initializeModules();
    this.setupConnections();
    this.start();
  }

  initializeModules() {
    // Initialize core modules
    this.audioManager = new AudioManager();
    this.gameState = new GameState();
    this.physicsEngine = new PhysicsEngine(this.audioManager);
    this.renderer = new Renderer(this.canvas);
    this.inputManager = new InputManager(this.canvas, this.gameState, this.audioManager);
    this.uiManager = new UIManager(this.gameState, this.audioManager);
    this.gameLoop = new GameLoop(this.gameState, this.physicsEngine, this.renderer, this.inputManager);
    // Restore mute state immediately (may be blocked by browser until user interacts)
    if (typeof window._hr_restoreMuted === 'boolean') {
      this.audioManager.muted = window._hr_restoreMuted;
      // Only initialize audio if not restoring as muted
      if (!window._hr_restoreMuted) {
        this.audioManager.ensureAudio();
        this.audioManager.setMuted(false);
      }
      // Ensure UI reflects the correct mute state after AudioManager is set
      if (this.uiManager) {
        this.uiManager.updateMuteUI();
        this.uiManager.updateHelpText(this.audioManager.muted);
      }
    }
    // Always set up popup close/hide logic if popup exists
    const popup = document.getElementById('unmute-popup');
    const closeBtn = document.getElementById('unmute-popup-close');
    if (popup && closeBtn) {
      // Only show and allow unmute if restoring and unmuted is in save state
      if (window._hr_restoreMuted === false) {
        popup.style.display = 'block';
        const app = this;
        function hidePopupAndListeners(doUnmute) {
          if (doUnmute) {
            app.audioManager.ensureAudio();
            app.audioManager.setMuted(false);
          }
          popup.style.display = 'none';
          window.removeEventListener('pointerdown', pointerHandler, true);
          window.removeEventListener('keydown', pointerHandler, true);
          closeBtn.removeEventListener('click', closeHandler);
        }
        function pointerHandler() { hidePopupAndListeners(true); }
        function closeHandler() { hidePopupAndListeners(false); }
        window.addEventListener('pointerdown', pointerHandler, true);
        window.addEventListener('keydown', pointerHandler, true);
        closeBtn.addEventListener('click', closeHandler);
      } else {
        popup.style.display = 'none';
      }
    }
  }

  setupConnections() {
    // Connect game state to renderer
    this.gameState.setRenderer(this.renderer);
    
    // Reset physics engine when game state resets
    const originalReset = this.gameState.resetAll.bind(this.gameState);
    this.gameState.resetAll = () => {
      originalReset();
      this.physicsEngine.reset();
    };
  }

  start() {
    // Start the game loop
    this.gameLoop.start();
    
    console.log('HarmonicRain started successfully');
  }

  stop() {
    this.gameLoop.stop();
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HarmonicRainApp();
});

// Export for potential external use
export { HarmonicRainApp };
