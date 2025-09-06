// Math and geometry utility functions

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointToSegmentDistance(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const wx = p.x - a.x, wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
  const t = c1 / c2;
  const projx = a.x + t * vx;
  const projy = a.y + t * vy;
  return Math.hypot(p.x - projx, p.y - projy);
}

export function segmentNormal(a, b) {
  // Perpendicular unit normal pointing to one side
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Normalized perpendicular (dy, -dx)
  return { x: dy / len, y: -dx / len };
}

// Geometry helper: projection parameter of p onto segment ab in [0,1]
export function projectParam(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const wx = p.x - a.x, wy = p.y - a.y;
  const c2 = vx * vx + vy * vy;
  if (c2 <= 1e-6) return 0;
  const t = (vx * wx + vy * wy) / c2;
  return Math.max(0, Math.min(1, t));
}

export function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

// Map string length to a tempered piano-like note
export function lengthToMidi(lengthPx, scaleDegrees) {
  const L = Math.min(800, Math.max(50, lengthPx));
  const t = (L - 50) / (800 - 50);
  let midi = 48 + t * (84 - 48); // C3..C6
  
  // Quantize to nearest major scale degree
  const base = Math.floor(midi);
  const degree = base % 12;
  let nearest = base;
  
  if (!scaleDegrees.has(degree)) {
    // find nearest up or down
    let up = base, down = base;
    while (!scaleDegrees.has(up % 12)) up++;
    while (!scaleDegrees.has((down + 12) % 12)) down--;
    nearest = (Math.abs(up - midi) < Math.abs(midi - down)) ? up : down;
  }
  return nearest;
}

// Visual oscillation parameter helpers
export function visualFrequencyFromLength(L) {
  const Lc = Math.min(800, Math.max(50, L));
  const t = (Lc - 50) / (800 - 50);
  return 6 - 4 * t; // Hz: short->fast, long->slow
}

export function visualDecayFromLength(L) {
  const Lc = Math.min(800, Math.max(50, L));
  const t = (Lc - 50) / (800 - 50);
  return 2.2 - 1.4 * t; // s^-1: short->faster decay, long->slower
}

// Note name helpers
export function midiToNoteName(midi) {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const n = Math.round(midi);
  const name = names[(n % 12 + 12) % 12];
  const octave = Math.floor(n / 12) - 1;
  return name + octave;
}
