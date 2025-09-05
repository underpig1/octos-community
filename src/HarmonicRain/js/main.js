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
