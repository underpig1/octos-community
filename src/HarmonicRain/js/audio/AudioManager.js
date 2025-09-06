import { CONFIG, SCALE_DEGREES } from '../config.js';
import { midiToFreq, lengthToMidi } from '../utils/math.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.limiter = null;
    this.reverb = null;
    this.out = null;
    this.master = null;
    this.started = false;
    this.muted = false;
  }

  ensureAudio() {
    if (this.started) {
      // If context was suspended and is now running, always re-apply mute state
      if (this.ctx && this.ctx.state === 'running') {
        this.setMuted(this.muted);
      }
      return;
    }

    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    // Simple dynamics
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -12;
    this.limiter.knee.value = 30;
    this.limiter.ratio.value = 12;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.25;

    // A very small convolution-like reverb substitute: use delay + feedback lowpass chain
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = CONFIG.AUDIO_DELAY_TIME;
    const feedback = this.ctx.createGain();
    feedback.gain.value = CONFIG.AUDIO_FEEDBACK_GAIN;
    const damp = this.ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = CONFIG.AUDIO_DAMP_FREQ;
    delay.connect(damp).connect(feedback).connect(delay);

    const mix = this.ctx.createGain();
    mix.gain.value = CONFIG.AUDIO_REVERB_MIX;
    delay.connect(mix);

    // Master gain controls both dry and wet
    this.master = this.ctx.createGain();
    this.master.gain.value = CONFIG.AUDIO_GAIN;

    this.out = this.ctx.createGain();
    this.out.gain.value = 1.0;

    // Connect
    this.out.connect(this.master).connect(this.limiter).connect(this.ctx.destination);
    mix.connect(this.master);

    // Keep references
    this.reverb = delay; // entry point for effect send
    this.started = true;

    // Always apply mute state after context creation
    this.setMuted(this.muted);
  }

  triggerPianoLike(frequencyHz, velocity = 0.6, panPosition = 0) {
    this.ensureAudio();
    if (this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lpf = this.ctx.createBiquadFilter();
    const hpf = this.ctx.createBiquadFilter();
    const pan = this.ctx.createStereoPanner();

    // Piano-ish: stacked partials via frequency modulation of triangle+sine
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequencyHz, now);

    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(Math.min(6000, frequencyHz * 6), now);
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(40, now);

    // Envelope (quick attack, medium decay)
    const attack = 0.002;
    const decay = 0.6;
    const sustainLevel = 0.0; // plucked decay
    const release = 0.1;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(velocity, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + attack + decay);

    // Pan by x-position
    pan.pan.value = panPosition;

    // Routing with effect send
    const send = this.ctx.createGain();
    send.gain.value = 0.35;

    osc.connect(hpf).connect(lpf).connect(gain);
    gain.connect(pan).connect(this.out);
    gain.connect(send).connect(this.reverb);

    osc.start(now);
    osc.stop(now + attack + decay + release);
  }

  triggerStringCollision(string, ballVelocity, ballPosition, panPosition) {
    const L = Math.hypot(string.b.x - string.a.x, string.b.y - string.a.y);
    const midi = lengthToMidi(L, SCALE_DEGREES) + (string.tune || 0);
    const freq = midiToFreq(midi);
    const speed = Math.hypot(ballVelocity.x, ballVelocity.y);
    const vel = Math.min(1, 0.2 + speed / 1200);
    
    this.triggerPianoLike(freq, vel, panPosition);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.started && this.master) {
      const target = this.muted ? 0.0 : CONFIG.AUDIO_GAIN;
      this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.01);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }
}
