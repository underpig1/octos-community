import { CONFIG, SCALE_DEGREES } from '../config.js';
import { distance, lengthToMidi, midiToFreq, midiToNoteName } from '../utils/math.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.currentLabelRect = null;
    this.simTimeSec = 0;
    this.gameTimeMs = 0;
    
    // Resize to device pixels for crispness
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const { innerWidth: w, innerHeight: h } = window;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  drawSpawner(spawnerPos) {
    this.ctx.save();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = CONFIG.SPAWNER_STROKE;
    this.ctx.beginPath();
    this.ctx.arc(spawnerPos.x, spawnerPos.y, CONFIG.SPAWNER_RADIUS, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSpawners(spawners, hoveredIndex) {
    if (!Array.isArray(spawners)) return;
    this.ctx.save();
    for (let i = 0; i < spawners.length; i++) {
      const sp = spawners[i];
      const cx = sp.x, cy = sp.y;
      const r = CONFIG.SPAWNER_RADIUS;
      const lw = Math.max(2, CONFIG.SPAWNER_STROKE);

      // Base circle
      this.ctx.strokeStyle = sp.enabled === false ? 'rgba(255,255,255,0.35)' : '#fff';
      this.ctx.lineWidth = lw;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();

      // Radial countdown (time to next spawn)
      const interval = Math.max(1, sp.intervalMs || CONFIG.SPAWN_INTERVAL_MS);
      const phase = sp.phaseMs || 0;
      const now = this.gameTimeMs || 0;
      const t = now - phase;
      const rem = interval - ((t % interval) + interval) % interval; // remaining in [0, interval)
      const fraction = 1 - rem / interval; // 0..1 elapsed
      if (fraction > 0 && sp.enabled !== false) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        this.ctx.lineWidth = lw + 1;
        const start = -Math.PI / 2;
        const end = start + Math.PI * 2 * fraction;
        this.ctx.arc(cx, cy, r + lw * 0.6, start, end);
        this.ctx.stroke();
      }

      // Hover label: show interval
      if (hoveredIndex === i) {
        const ms = Math.round(interval);
        const remMs = Math.round(rem);
        const phaseMs = Math.round(phase);
        const text = (sp.enabled === false ? '[off] · ' : '') + ms + ' ms · rem ' + remMs + ' · phase ' + phaseMs;
        this.drawSpawnerLabel(cx, cy - 20, text);
      }
    }
    this.ctx.restore();
  }

  drawSpawnerLabel(x, y, text) {
    this.ctx.save();
    const fontStack = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const fontSize = 11;
    const padX = 6, padY = 4;
    this.ctx.font = fontSize + 'px ' + fontStack;
    const w = Math.ceil(this.ctx.measureText(text).width);
    const boxW = w + padX * 2;
    const boxH = fontSize + padY * 2;
    const bx = Math.round(x - boxW / 2);
    const by = Math.round(y - boxH);
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    this.ctx.lineWidth = 1;
    this.drawRoundedRect(bx, by, boxW, boxH, 6);
    const prev = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.fill();
    this.ctx.globalCompositeOperation = prev;
    this.ctx.stroke();
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, bx + boxW / 2, by + boxH / 2);
    this.ctx.restore();
  }

  drawBalls(balls) {
    this.ctx.save();
    this.ctx.fillStyle = '#fff';
    for (const b of balls) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawStrings(strings, hoveredStringIndex, hoveredHandle, draggingHandle, isPlacingString, tempStringStart, mouse) {
    this.ctx.save();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.currentLabelRect = null;
    
    for (let i = 0; i < strings.length; i++) {
      const s = strings[i];
      const isActiveDrag = draggingHandle && draggingHandle.index === i;
      
      // Oscillating renderer (falls back gracefully if no impulses)
      this.drawOscillatingString(s, !!isActiveDrag);
      
      // If hovered or dragging, draw endpoints
      const isHovered = hoveredStringIndex === i || (hoveredHandle && hoveredHandle.index === i) || isActiveDrag;
      if (isHovered) {
        this.drawStringHandles(s);
      }

      // Show label only when hovering near the string midpoint
      const midX = (s.a.x + s.b.x) / 2;
      const midY = (s.a.y + s.b.y) / 2;
      const dxm = mouse ? (mouse.x - midX) : 0;
      const dym = mouse ? (mouse.y - midY) : 0;
      const nearCenter = mouse ? Math.hypot(dxm, dym) <= CONFIG.HOVER_THRESHOLD : false;
      if (hoveredStringIndex === i && nearCenter) {
        this.drawStringLabel(s, i, !!isActiveDrag);
      }
    }
    
    // Live string preview
    if (isPlacingString && tempStringStart) {
      this.drawStringPreview(tempStringStart, mouse);
    }
    
    this.ctx.restore();
  }

  drawOscillatingString(s, isActiveDrag) {
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
    const L = Math.hypot(dx, dy) || 1;
    const tx = dx / L, ty = dy / L;
    const nx = ty, ny = -tx; // unit normal
    const samples = Math.max(8, Math.min(64, Math.floor(L / 30)));

    const layers = [
      { alpha: 0.6, phase: 0.0 },
      { alpha: 0.3, phase: 0.7 },
      { alpha: 0.1, phase: 1.4 },
    ];

    // Determine color pulse alpha: 1 frame full color, then linear fade to 0 in 150 ms
    let pulseAlpha = 0;
    let pulseHue = 0;
    if (CONFIG.COLOR_MODE_ENABLED && s.colorPulse && typeof s.colorPulse.t0 === 'number') {
      const timeSec = this.simTimeSec || 0;
      const dt = Math.max(0, timeSec - s.colorPulse.t0);
      const oneFrame = 1 / 60;
      const fadeDur = 0.150; // 150 ms
      if (dt <= oneFrame) {
        pulseAlpha = 1;
      } else {
        const t = Math.max(0, dt - oneFrame);
        pulseAlpha = Math.max(0, 1 - t / fadeDur);
      }
      // Scale by collision strength
      pulseAlpha *= Math.max(0, Math.min(1, s.colorPulse.strength || 1));
      pulseHue = s.colorPulse.hue || 0;
    } else {
      // No color pulse: always white
      pulseAlpha = 0;
      pulseHue = 0;
    }

    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      if (isActiveDrag) this.ctx.setLineDash([6, 6]); 
      else this.ctx.setLineDash([]);
      
      // Stroke style: blend color pulse with white
      if (pulseAlpha > 0) {
        // Bright, modern strokes: vivid stroke whose opacity follows fast pulse
        this.ctx.strokeStyle = `hsla(${pulseHue}, 95%, 70%, 1)`;
        this.ctx.globalAlpha = pulseAlpha;
      } else {
        this.ctx.strokeStyle = '#fff';
        this.ctx.globalAlpha = layer.alpha;
      }
      this.ctx.beginPath();
      
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const baseX = s.a.x + tx * u * L;
        const baseY = s.a.y + ty * u * L;
        const disp = this.computeDisplacementAt(s, u, layer.phase);
        const px = baseX + nx * disp;
        const py = baseY + ny * disp;
        
        if (i === 0) this.ctx.moveTo(px, py); 
        else this.ctx.lineTo(px, py);
      }
      
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
  }

  computeDisplacementAt(s, u, phaseOffset = 0) {
    if (!s.impulses || s.impulses.length === 0) return 0;
    const timeSec = this.simTimeSec || 0;
    
    let d = 0;
    for (let i = 0; i < s.impulses.length; i++) {
      const imp = s.impulses[i];
      const dt = timeSec - imp.t0;
      if (dt < 0) continue;
      
      const env = Math.exp(-imp.decay * dt);
      if (env < 0.01) continue;
      
      const shape = Math.sin(Math.PI * u);
      const osc = Math.sin(2 * Math.PI * imp.freq * dt + (imp.phase || 0) + phaseOffset);
      d += imp.amp * env * shape * osc;
    }
    return d;
  }

  drawStringHandles(s) {
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    this.ctx.lineWidth = 2;
    
    // endpoints
    this.ctx.beginPath();
    this.ctx.arc(s.a.x, s.a.y, CONFIG.HANDLE_VIS_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(s.b.x, s.b.y, CONFIG.HANDLE_VIS_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawStringLabel(s, index, isActive) {
    const midX = (s.a.x + s.b.x) / 2;
    const midY = (s.a.y + s.b.y) / 2;
    const L = distance(s.a, s.b);
    const midi = lengthToMidi(L, SCALE_DEGREES) + (s.tune || 0);
    const freq = midiToFreq(midi);
    
    this.currentLabelRect = this.drawNoteLabel(midX, midY, midi, freq, isActive);
    if (this.currentLabelRect) this.currentLabelRect.index = index;
  }

  drawStringPreview(start, end) {
    this.ctx.setLineDash([6, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // also show live label for the preview (length-based mapping)
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const L = distance(start, end);
    const midi = lengthToMidi(L, SCALE_DEGREES);
    const freq = midiToFreq(midi);
    this.drawNoteLabel(midX, midY, midi, freq, true);
  }

  drawNoteLabel(midX, midY, midi, freq, active) {
    const title = midiToNoteName(midi);
    const freqText = Math.round(freq) + 'Hz';

    this.ctx.save();

    const fontStack = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const titleSize = 14; // px
    const freqSize = 11;  // px
    const titleFont = 'bold ' + titleSize + 'px ' + fontStack;
    const freqFont = freqSize + 'px ' + fontStack;

    // Measure with respective fonts
    this.ctx.font = titleFont;
    const titleW = this.ctx.measureText(title).width;
    this.ctx.font = freqFont;
    const freqW = this.ctx.measureText(freqText).width;

    const padX = 8, padY = 6, gap = 2;
    const textW = Math.max(titleW, freqW);
    const textH = titleSize + gap + freqSize;
    const boxW = textW + padX * 2;
    const boxH = textH + padY * 2;
    const x = Math.round(midX - boxW / 2);
    const y = Math.round(midY - boxH / 2);

    this.ctx.globalAlpha = active ? 0.95 : 0.8;
    this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    this.ctx.lineWidth = 1;
    
    // Draw background behind existing content so it doesn't hide lines
    this.drawRoundedRect(x, y, boxW, boxH, 8);
    const prevOp = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.fill();
    this.ctx.globalCompositeOperation = prevOp;
    this.ctx.stroke();

    // Centered text
    const centerX = x + boxW / 2;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // Title (bold, larger)
    this.ctx.fillStyle = '#fff';
    this.ctx.font = titleFont;
    this.ctx.fillText(title, centerX, y + padY);

    // Frequency (smaller)
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.font = freqFont;
    this.ctx.fillText(freqText, centerX, y + padY + titleSize + gap);

    this.ctx.restore();
    return { x, y, w: boxW, h: boxH };
  }

  drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, Math.min(w, h) * 0.5);
    this.ctx.beginPath();
    this.ctx.moveTo(x + rr, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, rr);
    this.ctx.arcTo(x + w, y + h, x, y + h, rr);
    this.ctx.arcTo(x, y + h, x, y, rr);
    this.ctx.arcTo(x, y, x + w, y, rr);
    this.ctx.closePath();
  }

  getCurrentLabelRect() {
    return this.currentLabelRect;
  }
}
