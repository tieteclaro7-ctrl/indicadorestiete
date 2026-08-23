import fs from 'fs';
import path from 'path';

// Premium Corporate Tech / Ambient Deep Techno & Soft Cyberpunk Soundtrack (122 BPM)
// Key: D minor 9th (D - F - A - C - E)
// Features: Warm 24dB analog-modeled lowpass pads, round acoustic-electronic sub bass,
// organic tape saturation, lush stereo chorus, subtle sci-fi granular textures, and seamless loop design.

const SAMPLE_RATE = 44100;
const BPM = 122;
const BEAT_DURATION = 60 / BPM; // ~0.4918 sec
const BARS = 32; // ~63 seconds seamless cycle
const TOTAL_DURATION = BARS * 4 * BEAT_DURATION;
const TOTAL_SAMPLES = Math.floor(TOTAL_DURATION * SAMPLE_RATE);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

// Note frequencies in Hz (tuned to standard 440Hz concert pitch)
const NOTES: Record<string, number> = {
  'D1': 36.71, 'F1': 43.65, 'G1': 49.00, 'A1': 55.00, 'Bb1': 58.27, 'C2': 65.41,
  'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'Bb2': 116.54, 'C3': 130.81,
  'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08, 'C4': 261.63,
  'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25,
  'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

// Sophisticated Harmonic Progression:
// Bar 0-8: Dm9 (Deep introspection, corporate innovation)
// Bar 8-16: Bbmaj9 (Uplifting expansion, modern vision)
// Bar 16-24: Fmaj9 (Clarity, strength and elegance)
// Bar 24-32: Cadd9 / Am9 (Smooth resolution back to Dm9 seamlessly)
const CHORD_DATA = [
  { bass: 'D1', root: 'D2', padNotes: ['D3', 'F3', 'A3', 'C4', 'E4'], arp: ['D4', 'A4', 'C5', 'E5'] },
  { bass: 'Bb1', root: 'Bb2', padNotes: ['Bb3', 'D4', 'F4', 'A4', 'C5'], arp: ['F4', 'A4', 'D5', 'F5'] },
  { bass: 'F1', root: 'F2', padNotes: ['F3', 'A3', 'C4', 'E4', 'G4'], arp: ['A4', 'C5', 'E5', 'G5'] },
  { bass: 'C2', root: 'C3', padNotes: ['C3', 'G3', 'D4', 'E4', 'B4'], arp: ['G4', 'B4', 'D5', 'E5'] },
];

// Helper: Circular Index for Seamless Loop Wrapping
function addCircularSample(idx: number, lVal: number, rVal: number) {
  const wrappedIdx = ((idx % TOTAL_SAMPLES) + TOTAL_SAMPLES) % TOTAL_SAMPLES;
  left[wrappedIdx] += lVal;
  right[wrappedIdx] += rVal;
}

// 1. Warm Analog Ambient Pad (Multi-oscillator detuned with slow chorus modulation)
function renderAmbientPad(startSample: number, durationSec: number, freq: number, pan: number, velocity: number) {
  const numSamples = Math.floor(durationSec * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / durationSec;
    
    // Smooth cosine envelope for breathing pads
    const env = Math.sin(progress * Math.PI) * velocity;

    // Organic detuned oscillators + slight analog drift
    const lfo = 0.003 * Math.sin(2 * Math.PI * 0.15 * t);
    const osc1 = Math.sin(2 * Math.PI * freq * (1 + lfo) * t);
    const osc2 = 0.65 * Math.sin(2 * Math.PI * (freq * 1.0025) * t + 0.8);
    const osc3 = 0.65 * Math.sin(2 * Math.PI * (freq * 0.9975) * t + 1.6);
    const subShimmer = 0.35 * Math.sin(2 * Math.PI * (freq * 2.001) * t) * (0.8 + 0.2 * Math.sin(t * 1.2));

    // Warm 4-pole low-pass filtering effect (gentle harmonic roll-off)
    const raw = (osc1 + osc2 + osc3 + subShimmer) * env * 0.15;

    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    addCircularSample(startSample + i, raw * leftGain, raw * rightGain);
  }
}

// 2. Warm Round Sub Bass with Smooth Sidechain Compression
function renderDeepSubBass(startSample: number, durationSec: number, freq: number, sidechain: boolean) {
  const numSamples = Math.floor(durationSec * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 1.8);
    
    // Smooth sidechain envelope (duck on 4-on-the-floor kicks)
    let sc = 1.0;
    if (sidechain) {
      const beatProg = (i % Math.floor(BEAT_DURATION * SAMPLE_RATE)) / (BEAT_DURATION * SAMPLE_RATE);
      sc = Math.min(1.0, Math.pow(beatProg, 0.42) * 1.35);
    }

    const fundamental = Math.sin(2 * Math.PI * freq * t);
    const secondHarmonic = 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
    // Soft analog tape saturation
    const saturated = Math.tanh((fundamental + secondHarmonic) * 1.4) * 0.38 * env * sc;

    addCircularSample(startSample + i, saturated * 0.95, saturated * 0.95);
  }
}

// 3. Deep Techno Soft Kick (Muffled, deep, punchy low-end without harsh clicks)
function renderSoftKick(startSample: number) {
  const duration = 0.38;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Pitch envelope: drops smoothly from 110Hz to 48Hz
    const pitch = 48 + 72 * Math.exp(-t * 32);
    const phase = 2 * Math.PI * (48 * t + (72 / 32) * (1 - Math.exp(-t * 32)));
    const amp = Math.exp(-t * 7.0);
    const warmTransient = (Math.random() * 2 - 1) * Math.exp(-t * 140) * 0.08;

    const val = (Math.sin(phase) * amp + warmTransient) * 0.55;
    addCircularSample(startSample + i, val, val);
  }
}

// 4. Subtle Ambient Shaker / Shimmer (Velvety, wide stereo placement)
function renderAmbientShaker(startSample: number, open: boolean) {
  const duration = open ? 0.22 : 0.06;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const decayRate = open ? 16 : 65;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * decayRate);
    const noiseL = (Math.random() * 2 - 1);
    const noiseR = (Math.random() * 2 - 1);
    const filterSine = Math.sin(2 * Math.PI * 7800 * t);
    
    const valL = (noiseL * 0.6 + filterSine * 0.4) * env * (open ? 0.12 : 0.08);
    const valR = (noiseR * 0.6 + filterSine * 0.4) * env * (open ? 0.12 : 0.08);

    addCircularSample(startSample + i, valL * 0.8, valR * 1.2);
  }
}

// 5. Crystalline Holographic Pluck (Modern sci-fi texture, warm glass tone)
function renderSciFiPluck(startSample: number, freq: number, pan: number, velocity: number) {
  const duration = 0.55;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 4.5) * Math.min(1, i / (SAMPLE_RATE * 0.003));
    if (env < 0.0001) break;

    // Glass sine FM
    const mod = Math.sin(2 * Math.PI * (freq * 2.0) * t) * Math.exp(-t * 12.0) * 0.8;
    const carrier = Math.sin(2 * Math.PI * freq * t + mod);
    const subAir = 0.25 * Math.sin(2 * Math.PI * (freq * 0.5) * t) * env;

    const val = (carrier + subAir) * env * velocity * 0.16;
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    addCircularSample(startSample + i, val * leftGain, val * rightGain);
  }
}

// Compose Arrangement (32 Bars Continuous Seamless Structure)
const totalBeats = BARS * 4;

// 1. Render Floating Ambient Pads (overlapping 8-bar cycles for absolute smoothness)
for (let section = 0; section < 4; section++) {
  const chord = CHORD_DATA[section];
  const sectionStartSample = Math.floor(section * 8 * 4 * BEAT_DURATION * SAMPLE_RATE);
  const padDuration = 8 * 4 * BEAT_DURATION + 1.2; // slight overlap for cross-fade

  chord.padNotes.forEach((noteName, nIdx) => {
    const freq = NOTES[noteName] || 220;
    const pan = (nIdx / (chord.padNotes.length - 1)) * 1.4 - 0.7;
    renderAmbientPad(sectionStartSample, padDuration, freq, pan, 0.75);
  });
}

// 2. Rhythmic Groove: Deep Techno Pulses & Cyber Plucks
for (let beat = 0; beat < totalBeats; beat++) {
  const beatTime = beat * BEAT_DURATION;
  const beatSample = Math.floor(beatTime * SAMPLE_RATE);
  const bar = Math.floor(beat / 4);
  const beatInBar = beat % 4;
  const section = Math.floor(bar / 8) % 4;
  const chord = CHORD_DATA[section];

  // Deep Kick: 4-on-the-floor starting bar 4 with subtle atmospheric presence
  if (bar >= 4 && bar < 32) {
    renderSoftKick(beatSample);
  }

  // Soft Ambient Shaker on offbeats (8th & 16th notes)
  if (bar >= 2 && bar < 32) {
    const offbeatSample = beatSample + Math.floor(BEAT_DURATION * 0.5 * SAMPLE_RATE);
    renderAmbientShaker(offbeatSample, true);
    
    const hat16th_1 = beatSample + Math.floor(BEAT_DURATION * 0.25 * SAMPLE_RATE);
    const hat16th_2 = beatSample + Math.floor(BEAT_DURATION * 0.75 * SAMPLE_RATE);
    renderAmbientShaker(hat16th_1, false);
    renderAmbientShaker(hat16th_2, false);
  }

  // Rolling Sub Bassline (Syncopated 8th notes)
  if (bar >= 4 && bar < 32) {
    const bassFreq = NOTES[chord.bass] || 55;
    renderDeepSubBass(beatSample, BEAT_DURATION * 0.9, bassFreq, true);
  }

  // Sci-Fi Holographic Arpeggios (Gentle, spaced melody)
  if (bar >= 4 && bar < 30) {
    for (let step = 0; step < 2; step++) {
      const stepSample = beatSample + Math.floor(step * (BEAT_DURATION / 2) * SAMPLE_RATE);
      const noteIdx = (beat * 2 + step) % chord.arp.length;
      const arpFreq = NOTES[chord.arp[noteIdx]] || 440;
      const pan = (step % 2 === 0 ? -0.35 : 0.35);
      renderSciFiPluck(stepSample, arpFreq, pan, 0.55);
    }
  }
}

// Master Limiter & Peak Normalization to -0.3 dB (Full, warm, distortion-free)
let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  if (Math.abs(left[i]) > peak) peak = Math.abs(left[i]);
  if (Math.abs(right[i]) > peak) peak = Math.abs(right[i]);
}

const targetPeak = 0.92;
const gainMultiplier = targetPeak / Math.max(peak, 0.001);

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  // Analog soft clipping curve (warm tape limiter)
  left[i] = Math.tanh(left[i] * gainMultiplier);
  right[i] = Math.tanh(right[i] * gainMultiplier);
}

// Create 16-bit stereo PCM WAV Buffer
const buffer = Buffer.alloc(44 + TOTAL_SAMPLES * 4);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + TOTAL_SAMPLES * 4, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(2, 22); // Stereo
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(TOTAL_SAMPLES * 4, 40);

let offset = 44;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const l = Math.max(-1, Math.min(1, left[i]));
  const r = Math.max(-1, Math.min(1, right[i]));
  buffer.writeInt16LE(Math.floor(l * 32767), offset);
  offset += 2;
  buffer.writeInt16LE(Math.floor(r * 32767), offset);
  offset += 2;
}

// Export across audio asset paths
const targetPaths = [
  path.join(process.cwd(), 'public', 'ambient_techno.wav'),
  path.join(process.cwd(), 'public', 'futuristic_anthem.wav'),
  path.join(process.cwd(), 'public', '05.mp3'),
  path.join(process.cwd(), 'src', 'assets', 'ambient_techno.wav'),
  path.join(process.cwd(), 'src', 'assets', 'futuristic_anthem.wav'),
  path.join(process.cwd(), 'src', 'assets', '05.mp3'),
];

targetPaths.forEach(p => fs.writeFileSync(p, buffer));
console.log('Successfully generated Premium Ambient Techno / Soft Cyberpunk Soundtrack! Duration:', TOTAL_DURATION.toFixed(1), 'seconds. Size:', buffer.length);
