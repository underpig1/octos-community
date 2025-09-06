// Configuration constants for HarmonicRain
export const CONFIG = {
  // Ball settings
  BALL_RADIUS: 10,
  MAX_BALLS: 300,
  BALL_DESPAWN_MARGIN: 100,
  
  // Spawner settings
  SPAWNER_RADIUS: 4,
  SPAWNER_STROKE: 2,
  SPAWN_INTERVAL_MS: 1000,
  
  // Physics
  GRAVITY_PX_S2: 980,
  
  // Visual
  VISUAL_INTENSITY: 0.2,
  COLOR_MODE_ENABLED: true,
  // Bright modern 12-step hue palette (C..B)
  COLOR_HUES_12: [
    200, // C  - cyan
    230, // C# - azure
    260, // D  - cobalt
    290, // D# - violet
    320, // E  - magenta
    350, // F  - hot pink
    20,  // F# - orange-red
    40,  // G  - amber
    60,  // G# - yellow
    90,  // A  - lime
    130, // A# - spring green
    160  // B  - teal
  ],
  
  // Audio
  AUDIO_GAIN: 0.8,
  AUDIO_REVERB_MIX: 0.2,
  AUDIO_FEEDBACK_GAIN: 0.25,
  AUDIO_DAMP_FREQ: 2500,
  AUDIO_DELAY_TIME: 0.15,
  
  // UI
  HANDLE_VIS_RADIUS: 6,
  HANDLE_HIT_RADIUS: 10,
  HOVER_THRESHOLD: 16,
  DELETE_THRESHOLD: 16,
  MIN_STRING_LENGTH: 20,
  
  // Scale mapping
  MIN_STRING_LENGTH_PX: 50,
  MAX_STRING_LENGTH_PX: 800,
  MIN_MIDI: 48,
  MAX_MIDI: 84,
  
  // Visual oscillation
  MAX_OSCILLATION_AMPLITUDE: 16,
  MAX_IMPULSES: 64
};

// Major scale degrees (C major)
export const SCALE_DEGREES = new Set([0, 2, 4, 5, 7, 9, 11]);
