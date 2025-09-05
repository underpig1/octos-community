import { CONFIG } from '../config.js';

export class UIManager {
  constructor(gameState, audioManager) {
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.optionsOpen = false;
    
    this.ui = {
      muteBtn: document.getElementById('btn-mute'),
      resetBtn: document.getElementById('btn-reset'),
      helpBtn: document.getElementById('btn-help'),
      colorBtn: document.getElementById('btn-color'),
      addSpawnerBtn: document.getElementById('btn-add-spawner'),
      optionsBtn: document.getElementById('btn-options'),
      optionsPanel: document.getElementById('options-panel'),
      gravityRange: document.getElementById('opt-gravity'),
      gravityVal: document.getElementById('opt-gravity-val'),
      spawnRange: document.getElementById('opt-spawn'),
      spawnVal: document.getElementById('opt-spawn-val'),
      intensityRange: document.getElementById('opt-intensity'),
      intensityVal: document.getElementById('opt-intensity-val'),
      muteIcon: document.querySelector('#btn-mute .mute-icon'),
      resetIcon: document.querySelector('#btn-reset .reset-icon'),
    };
    
    this.setupEventListeners();
    this.initializeValues();
  }

  setupEventListeners() {
    // Mute button
    if (this.ui.muteBtn) {
      this.ui.muteBtn.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        this.updateMuteUI();
        this.updateHelpText(isMuted);
      });
    }

    // Reset button
    if (this.ui.resetBtn) {
      this.ui.resetBtn.addEventListener('click', () => {
        this.gameState.resetAll();
        this.animateResetIcon();
      });
    }

    // Help button
    if (this.ui.helpBtn) {
      this.ui.helpBtn.addEventListener('click', () => {
        this.gameState.toggleHelp();
      });
    }

    // Color mode toggle
    if (this.ui.colorBtn) {
      this.ui.colorBtn.addEventListener('click', () => {
        CONFIG.COLOR_MODE_ENABLED = !CONFIG.COLOR_MODE_ENABLED;
        this.ui.colorBtn.classList.toggle('active', CONFIG.COLOR_MODE_ENABLED);
      });
      // Initialize visual state
      this.ui.colorBtn.classList.toggle('active', !!CONFIG.COLOR_MODE_ENABLED);
    }

    // Add Spawner mode toggle
    if (this.ui.addSpawnerBtn) {
      this.ui.addSpawnerBtn.addEventListener('click', () => {
        const next = !this.gameState.addSpawnerMode;
        this.gameState.addSpawnerMode = next;
        this.ui.addSpawnerBtn.classList.toggle('active', next);
      });
    }

    // Options button
    if (this.ui.optionsBtn) {
      this.ui.optionsBtn.addEventListener('click', () => {
        this.setOptionsOpen(!this.optionsOpen);
      });
    }

    // Close options if clicking outside
    document.addEventListener('click', (e) => {
      if (!this.optionsOpen) return;
      const t = e.target;
      const controls = document.getElementById('controls');
      if (controls && !controls.contains(t)) {
        this.setOptionsOpen(false);
      }
    });

    // Options inputs
    this.setupOptionsInputs();
  }

  setupOptionsInputs() {
    // Gravity input
    if (this.ui.gravityRange && this.ui.gravityVal) {
      this.ui.gravityRange.value = String(CONFIG.GRAVITY_PX_S2);
      this.ui.gravityVal.textContent = String(CONFIG.GRAVITY_PX_S2);
      this.ui.gravityRange.addEventListener('input', () => {
        CONFIG.GRAVITY_PX_S2 = parseFloat(this.ui.gravityRange.value);
        this.ui.gravityVal.textContent = this.ui.gravityRange.value;
      });
    }

    // Spawn interval input
    if (this.ui.spawnRange && this.ui.spawnVal) {
      this.ui.spawnRange.value = String(CONFIG.SPAWN_INTERVAL_MS);
      this.ui.spawnVal.textContent = this.ui.spawnRange.value;
      this.ui.spawnRange.addEventListener('input', () => {
        CONFIG.SPAWN_INTERVAL_MS = parseInt(this.ui.spawnRange.value, 10);
        this.ui.spawnVal.textContent = this.ui.spawnRange.value;
      });
    }

    // Intensity input
    if (this.ui.intensityRange && this.ui.intensityVal) {
      this.ui.intensityRange.value = String(Math.round(CONFIG.VISUAL_INTENSITY * 100));
      this.ui.intensityVal.textContent = Math.round(CONFIG.VISUAL_INTENSITY * 100) + '%';
      this.ui.intensityRange.addEventListener('input', () => {
        const pct = parseInt(this.ui.intensityRange.value, 10);
        CONFIG.VISUAL_INTENSITY = Math.max(0, Math.min(2, pct / 100));
        this.ui.intensityVal.textContent = pct + '%';
      });
    }
  }

  initializeValues() {
    // Set initial values for UI elements
    if (this.ui.gravityRange && this.ui.gravityVal) {
      this.ui.gravityRange.value = String(CONFIG.GRAVITY_PX_S2);
      this.ui.gravityVal.textContent = String(CONFIG.GRAVITY_PX_S2);
    }
    
    if (this.ui.spawnRange && this.ui.spawnVal) {
      this.ui.spawnRange.value = String(CONFIG.SPAWN_INTERVAL_MS);
      this.ui.spawnVal.textContent = String(CONFIG.SPAWN_INTERVAL_MS);
    }
    
    if (this.ui.intensityRange && this.ui.intensityVal) {
      this.ui.intensityRange.value = String(Math.round(CONFIG.VISUAL_INTENSITY * 100));
      this.ui.intensityVal.textContent = Math.round(CONFIG.VISUAL_INTENSITY * 100) + '%';
    }
  }

  updateMuteUI() {
    if (this.ui.muteIcon) {
      if (this.audioManager.muted) {
        this.ui.muteIcon.classList.add('muted');
      } else {
        this.ui.muteIcon.classList.remove('muted');
      }
    }
  }

  updateHelpText(isMuted) {
    const helpEl = document.getElementById('help');
    if (helpEl) {
      helpEl.textContent = `Double-click: delete string · Drag: create string · Grab center to move string · Drag spawner to move · ${isMuted ? 'Muted (M to unmute)' : 'M to mute'}`;
    }
  }

  setOptionsOpen(open) {
    this.optionsOpen = !!open;
    if (this.ui.optionsPanel) {
      this.ui.optionsPanel.style.display = this.optionsOpen ? 'block' : 'none';
    }
  }

  animateResetIcon() {
    if (this.ui.resetIcon) {
      this.ui.resetIcon.classList.remove('spin');
      // force reflow to restart animation
      void this.ui.resetIcon.offsetWidth;
      this.ui.resetIcon.classList.add('spin');
    }
  }

  getOptionsOpen() {
    return this.optionsOpen;
  }
}
