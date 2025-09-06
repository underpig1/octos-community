import { CONFIG, SCALE_DEGREES } from '../config.js';
import { pointToSegmentDistance, segmentNormal, projectParam, visualFrequencyFromLength, visualDecayFromLength, lengthToMidi } from '../utils/math.js';

export class PhysicsEngine {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.balls = [];
    this.strings = [];
    this.simTimeSec = 0;
    // Tunable integration safety parameters
    this.maxStepPixels = 6; // target max displacement per substep to avoid tunneling
  }

  spawnBall(spawnerPos) {
    this.balls.push({ 
      x: spawnerPos.x, 
      y: spawnerPos.y, 
      vx: 0, 
      vy: 0 
    });
    
    if (this.balls.length > CONFIG.MAX_BALLS) {
      this.balls.shift();
    }
  }

  step(dt, strings, isPlacingString, tempStringStart, mouse) {
    const g = CONFIG.GRAVITY_PX_S2;
    this.simTimeSec += dt;
    
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      // Adaptive substepping based on expected displacement
      const expectedMove = Math.abs(b.vx) * dt + Math.abs(b.vy) * dt + 0.5 * g * dt * dt;
      const steps = Math.max(1, Math.min(10, Math.ceil(expectedMove / this.maxStepPixels)));
      const h = dt / steps;

      for (let ss = 0; ss < steps; ss++) {
        // Semi-implicit Euler
        b.vy += g * h;
        b.x += b.vx * h;
        b.y += b.vy * h;

        // collisions with strings
        for (let s = 0; s < strings.length; s++) {
          this.reflectIfIntersecting(b, strings[s]);
        }
        
        if (isPlacingString && tempStringStart) {
          this.reflectIfIntersecting(b, { a: tempStringStart, b: mouse });
        }
      }

      // Despawn if off-screen
      if (b.y - CONFIG.BALL_RADIUS > window.innerHeight + CONFIG.BALL_DESPAWN_MARGIN ||
          b.x + CONFIG.BALL_RADIUS < -CONFIG.BALL_DESPAWN_MARGIN ||
          b.x - CONFIG.BALL_RADIUS > window.innerWidth + CONFIG.BALL_DESPAWN_MARGIN) {
        this.balls.splice(i, 1);
      }
    }
  }

  reflectIfIntersecting(ball, segment) {
    // Closest-point test with approach guard and robust normal
    const a = segment.a, b = segment.b;
    const t = projectParam(ball, a, b);
    const qx = a.x + (b.x - a.x) * t;
    const qy = a.y + (b.y - a.y) * t;

    const rx = ball.x - qx;
    const ry = ball.y - qy;
    const dist = Math.hypot(rx, ry);
    if (dist > CONFIG.BALL_RADIUS) return;

    // Normal from segment toward ball center
    let nx = 0, ny = -1;
    if (dist > 1e-6) {
      nx = rx / dist;
      ny = ry / dist;
    } else {
      const n = segmentNormal(a, b);
      nx = n.x; ny = n.y;
    }

    // Only reflect if approaching the surface
    const vx = ball.vx, vy = ball.vy;
    const approach = vx * nx + vy * ny; // < 0 means moving into the surface
    if (approach >= -0.01) {
      // If slightly interpenetrating but not approaching, separate without reflecting
      const penetration = CONFIG.BALL_RADIUS - dist;
      if (penetration > 0) {
        ball.x += nx * (penetration + 0.01);
        ball.y += ny * (penetration + 0.01);
      }
      return;
    }

    // Reflect velocity about contact normal
    const rxv = vx - 2 * approach * nx;
    const ryv = vy - 2 * approach * ny;
    ball.vx = rxv;
    ball.vy = ryv;

    // Positional correction to resolve penetration
    const correction = CONFIG.BALL_RADIUS - dist + 0.01;
    if (correction > 0) {
      ball.x += nx * correction;
      ball.y += ny * correction;
    }

    // Trigger audio with a brief cooldown per ball to prevent chatter
    const panPosition = (ball.x / window.innerWidth) * 2 - 1;
    const now = this.simTimeSec;
    if (!ball._lastAudioAt || now - ball._lastAudioAt > 0.05) {
      this.audioManager.triggerStringCollision(segment, { x: vx, y: vy }, ball, panPosition);
      ball._lastAudioAt = now;
    }

    // Visual impulse for oscillation if the segment supports it
    if (segment && Array.isArray(segment.impulses)) {
      const u0 = t;
      const L = Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y);
      const visFreq = visualFrequencyFromLength(L);
      const decay = visualDecayFromLength(L);
      const basePhase = approach > 0 ? Math.PI : 0;
      const speed = Math.hypot(vx, vy);
      const rawAmp = Math.min(CONFIG.MAX_OSCILLATION_AMPLITUDE, 0.03 * speed + 2);
      const amplitude = rawAmp * CONFIG.VISUAL_INTENSITY;
      
      segment.impulses.push({ 
        amp: amplitude, 
        t0: this.simTimeSec, 
        freq: visFreq, 
        decay: decay, 
        u0: Math.max(0, Math.min(1, u0)), 
        phase: basePhase 
      });
      
      if (segment.impulses.length > CONFIG.MAX_IMPULSES) {
        segment.impulses.shift();
      }
    }

    // Color pulse on collision when enabled
    if (CONFIG.COLOR_MODE_ENABLED) {
      const lengthPx = Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y);
      const midi = lengthToMidi(lengthPx, SCALE_DEGREES) + (segment.tune || 0);
      const semitone = ((Math.round(midi) % 12) + 12) % 12;
      const hue = CONFIG.COLOR_HUES_12[semitone] ?? 200;
      const impactSpeed = Math.hypot(vx, vy);
      segment.colorPulse = {
        hue: hue,
        t0: this.simTimeSec,
        strength: Math.min(1, 0.35 + impactSpeed / 1200),
        decay: visualDecayFromLength(lengthPx) // match visual oscillation behavior
      };
    }
  }

  getBalls() {
    return this.balls;
  }

  getSimTime() {
    return this.simTimeSec;
  }

  reset() {
    this.balls.length = 0;
    this.simTimeSec = 0;
  }
}
