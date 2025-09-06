import { CONFIG } from '../config.js';

export class UIManager {
  constructor(gameState, audioManager) {
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.optionsOpen = false;

  // Track if we restored in muted state (for first mute button click fix)
  this._hr_restoredMuted = (typeof window._hr_restoreMuted === 'boolean') ? window._hr_restoreMuted : null;

    this.ui = {
      muteBtn: document.getElementById('btn-mute'),
      resetBtn: document.getElementById('btn-reset'),
      helpBtn: document.getElementById('btn-help'),
      addSpawnerBtn: document.getElementById('btn-add-spawner'),
      optionsBtn: document.getElementById('btn-options'),
      optionsPanel: document.getElementById('options-panel'),
      gravityRange: document.getElementById('opt-gravity'),
      gravityVal: document.getElementById('opt-gravity-val'),
      spawnRange: document.getElementById('opt-spawn'),
      spawnVal: document.getElementById('opt-spawn-val'),
      intensityRange: document.getElementById('opt-intensity'),
      intensityVal: document.getElementById('opt-intensity-val'),
      colorModeCheckbox: document.getElementById('opt-color-mode'),
      muteIcon: document.querySelector('#btn-mute .mute-icon'),
      resetIcon: document.querySelector('#btn-reset .reset-icon'),
    };

  this.restoreFullState();
  this.setupEventListeners();
  this.initializeValues();
  // Update help text to reflect mute state on load
  this.updateHelpText(this.audioManager.muted);

  // Always keep the global save function up to date with this instance
  window.harmonicRainSaveState = () => this.saveFullState();
  }

  setupEventListeners() {
    // Prevent options panel from closing when clicking inside it
    if (this.ui.optionsPanel) {
      this.ui.optionsPanel.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
    }
    // Mute button
    if (this.ui.muteBtn) {
      this.ui.muteBtn.addEventListener('click', () => {
        // If restoring and muted, and this is the first click, only initialize audio in muted state
        if (this._hr_restoredMuted === true) {
          this._hr_restoredMuted = null; // Only do this once
          // Initialize audio in muted state
          this.audioManager.ensureAudio();
          this.audioManager.setMuted(true);
          // UI stays muted
          this.updateMuteUI();
          this.updateHelpText(true);
          this.saveFullState();
          return;
        }
        // Normal toggle
        const isMuted = this.audioManager.toggleMute();
        this.updateMuteUI();
        this.updateHelpText(isMuted);
        this.saveFullState();
      });
    }

    // Reset button
    if (this.ui.resetBtn) {
      this.ui.resetBtn.addEventListener('click', () => {
        this.gameState.resetAll();
        this.animateResetIcon();
        this.saveFullState();
      });
    }

    // Help button
    if (this.ui.helpBtn) {
      this.ui.helpBtn.addEventListener('click', () => {
        this.gameState.toggleHelp();
        this.updateHelpButtonHighlight();
        this.saveFullState();
      });
      // Set initial highlight
      this.updateHelpButtonHighlight();
    }
  }

  updateHelpButtonHighlight() {
    if (this.ui.helpBtn) {
      this.ui.helpBtn.classList.toggle('active', this.gameState.helpVisible);
    }

    // Color mode toggle (now a checkbox in options)
    if (this.ui.colorModeCheckbox) {
      this.ui.colorModeCheckbox.checked = !!CONFIG.COLOR_MODE_ENABLED;
      this.ui.colorModeCheckbox.addEventListener('change', () => {
        CONFIG.COLOR_MODE_ENABLED = this.ui.colorModeCheckbox.checked;
      });
    }

    // Add Spawner mode toggle
    if (this.ui.addSpawnerBtn) {
      this.ui.addSpawnerBtn.addEventListener('click', () => {
        const next = !this.gameState.addSpawnerMode;
        this.gameState.addSpawnerMode = next;
        this.ui.addSpawnerBtn.classList.toggle('active', next);
        this.saveFullState();
      });
    }

    // Options button
    if (this.ui.optionsBtn) {
      this.ui.optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click from firing
        this.setOptionsOpen(!this.optionsOpen);
      });
    }

    // Close options if clicking outside the modal (not the button or panel)
    document.addEventListener('mousedown', (e) => {
      if (!this.optionsOpen) return;
      const t = e.target;
      // Only close if not clicking the panel or the button
      if (
        this.ui.optionsPanel && !this.ui.optionsPanel.contains(t) &&
        this.ui.optionsBtn && !this.ui.optionsBtn.contains(t)
      ) {
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
        this.saveFullState();
      });
    }

    // Spawn interval input
    if (this.ui.spawnRange && this.ui.spawnVal) {
      this.ui.spawnRange.value = String(CONFIG.SPAWN_INTERVAL_MS);
      this.ui.spawnVal.textContent = this.ui.spawnRange.value;
      this.ui.spawnRange.addEventListener('input', () => {
        const newInterval = parseInt(this.ui.spawnRange.value, 10);
        CONFIG.SPAWN_INTERVAL_MS = newInterval;
        // Update all spawners' intervalMs and force immediate spawn
        if (Array.isArray(this.gameState.spawners)) {
          for (const sp of this.gameState.spawners) {
            sp.intervalMs = newInterval;
            // Force immediate spawn by resetting emittedCount
            sp.emittedCount = -1;
          }
        }
        this.ui.spawnVal.textContent = this.ui.spawnRange.value;
        this.saveFullState();
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
        this.saveFullState();
      });
    }

    // Color mode checkbox
    if (this.ui.colorModeCheckbox) {
      this.ui.colorModeCheckbox.checked = !!CONFIG.COLOR_MODE_ENABLED;
      this.ui.colorModeCheckbox.addEventListener('change', () => {
        CONFIG.COLOR_MODE_ENABLED = this.ui.colorModeCheckbox.checked;
        this.saveFullState();
      });
    }
  }

  saveFullState() {
    // Save all relevant state to localStorage
    const state = {
      gravity: CONFIG.GRAVITY_PX_S2,
      spawnInterval: CONFIG.SPAWN_INTERVAL_MS,
      intensity: CONFIG.VISUAL_INTENSITY,
      colorMode: CONFIG.COLOR_MODE_ENABLED,
      spawners: this.gameState.spawners,
      strings: this.gameState.strings,
      helpVisible: this.gameState.helpVisible,
      muted: this.audioManager.muted
    };
    try {
      localStorage.setItem('harmonicRainFullState', JSON.stringify(state));
    } catch (e) {}
  }

  restoreFullState() {
    try {
      const raw = localStorage.getItem('harmonicRainFullState');
      if (!raw) return;
      const state = JSON.parse(raw);
      if (typeof state.gravity === 'number') CONFIG.GRAVITY_PX_S2 = state.gravity;
      if (typeof state.spawnInterval === 'number') CONFIG.SPAWN_INTERVAL_MS = state.spawnInterval;
      if (typeof state.intensity === 'number') CONFIG.VISUAL_INTENSITY = state.intensity;
      if (typeof state.colorMode === 'boolean') CONFIG.COLOR_MODE_ENABLED = state.colorMode;
      // Muted state will be handled in main.js after AudioManager is constructed
      if (typeof state.muted === 'boolean') window._hr_restoreMuted = state.muted;
      // Restore help visibility
      if (typeof state.helpVisible === 'boolean') {
        this.gameState.helpVisible = state.helpVisible;
        const helpEl = document.getElementById('help');
        if (helpEl) helpEl.style.display = state.helpVisible ? 'block' : 'none';
      }

      // Fix: On restore, clear colorPulse and impulses for all strings to prevent stuck color/vibration
      if (Array.isArray(this.gameState.strings)) {
        for (const s of this.gameState.strings) {
          delete s.colorPulse;
          if (Array.isArray(s.impulses)) s.impulses.length = 0;
        }
      }
    } catch (e) {}
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
      helpEl.innerHTML = `Click and drag anywhere to create strings<br>Longer string = higher note<br>Double-click on strings to delete<br>Drag spawner/string to move<br>${isMuted ? 'Muted' : ''}`;
    }
  }

  setOptionsOpen(open) {
    this.optionsOpen = !!open;
    if (this.ui.optionsPanel) {
      this.ui.optionsPanel.style.display = this.optionsOpen ? 'block' : 'none';
    }
    if (this.ui.optionsBtn) {
      this.ui.optionsBtn.classList.toggle('active', this.optionsOpen);
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
