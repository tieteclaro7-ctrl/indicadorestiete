import fs from 'fs';
import path from 'path';

// High-Energy, Epic Futuristic Cyber Ambient EDM (128 BPM)
// Normalized to 0 dB for loud, crisp, immersive sound across phone & desktop speakers.

const SAMPLE_RATE = 44100;
const BPM = 128;
const BEAT_DURATION = 60 / BPM; // ~0.46875 sec
const BARS = 32; // ~60 seconds loop
const TOTAL_DURATION = BARS * 4 * BEAT_DURATION;
const TOTAL_SAMPLES = Math.floor(TOTAL_DURATION * SAMPLE_RATE);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

const FREQS: Record<string, number> = {
  'D1': 36.71, 'F1': 43.65, 'G1': 49.00, 'A1': 55.00, 'C2': 65.41,
  'D2': 73.42, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'C3': 130.81,
  'D3': 146.83, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'C4': 261.63,
  'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'D6': 1174.66
};

// Chords: Dm -> Bb -> F -> C
const CHORDS = [
  { root: 'D2', bass: 'D1', notes: ['D3', 'F3', 'A3', 'C4', 'E4'] },
  { root: 'F2', bass: 'F1', notes: ['F3', 'A3', 'C4', 'D4', 'F4'] },
  { root: 'G2', bass: 'G1', notes: ['G3', 'A3', 'C4', 'D4', 'G4'] },
  { root: 'A2', bass: 'A1', notes: ['A3', 'C4', 'E4', 'G4', 'C5'] },
];

function addPad(start: number, dur: number, freq: number, pan: number) {
  const len = Math.min(Math.floor(dur * SAMPLE_RATE), TOTAL_SAMPLES - start);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const idx = start + i;
    if (idx >= TOTAL_SAMPLES) break;

    // smooth attack & release
    const attack = 0.5;
    const rel = 0.8;
    let env = 1.0;
    if (t < attack) env = t / attack;
    else if (t > dur - rel) env = Math.max(0, (dur - t) / rel);

    const o1 = Math.sin(2 * Math.PI * freq * t);
    const o2 = 0.8 * Math.sin(2 * Math.PI * (freq * 1.005) * t);
    const o3 = 0.8 * Math.sin(2 * Math.PI * (freq * 0.995) * t);
    const o4 = 0.5 * Math.sin(2 * Math.PI * (freq * 2.002) * t);

    const val = (o1 + o2 + o3 + o4) * env * 0.22;
    const lg = Math.cos((pan + 1) * Math.PI / 4);
    const rg = Math.sin((pan + 1) * Math.PI / 4);

    left[idx] += val * lg;
    right[idx] += val * rg;
  }
}

function addKick(start: number) {
  const dur = 0.35;
  const len = Math.min(Math.floor(dur * SAMPLE_RATE), TOTAL_SAMPLES - start);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const idx = start + i;
    if (idx >= TOTAL_SAMPLES) break;

    const f = 45 + 160 * Math.exp(-t * 40);
    const phase = 2 * Math.PI * (45 * t + (160 / 40) * (1 - Math.exp(-t * 40)));
    const amp = Math.exp(-t * 7.5);
    const punch = (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.25;
    const v = (Math.sin(phase) * amp + punch) * 0.85;

    left[idx] += v;
    right[idx] += v;
  }
}

function addSnare(start: number) {
  const dur = 0.28;
  const len = Math.min(Math.floor(dur * SAMPLE_RATE), TOTAL_SAMPLES - start);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const idx = start + i;
    if (idx >= TOTAL_SAMPLES) break;

    const env = Math.exp(-t * 18);
    const noiseL = (Math.random() * 2 - 1) * env;
    const noiseR = (Math.random() * 2 - 1) * env;
    const tone = Math.sin(2 * Math.PI * 260 * t) * Math.exp(-t * 25) * 0.6;
    const v = (noiseL * 0.45 + tone) * 0.7;

    left[idx] += v;
    right[idx] += (noiseR * 0.45 + tone) * 0.7;
  }
}

function addHat(start: number, open: boolean) {
  const dur = open ? 0.25 : 0.05;
  const len = Math.min(Math.floor(dur * SAMPLE_RATE), TOTAL_SAMPLES - start);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const idx = start + i;
    if (idx >= TOTAL_SAMPLES) break;

    const env = Math.exp(-t * (open ? 14 : 75));
    const noise = (Math.random() * 2 - 1) * 0.7 + 0.3 * Math.sin(2 * Math.PI * 8800 * t);
    const v = noise * env * (open ? 0.35 : 0.2);

    left[idx] += v * 0.9;
    right[idx] += v * 1.1;
  }
}

function addBass(start: number, dur: number, freq: number) {
  const len = Math.min(Math.floor(dur * SAMPLE_RATE), TOTAL_SAMPLES - start);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const idx = start + i;
    if (idx >= TOTAL_SAMPLES) break;

    const env = Math.exp(-t * 2.2);
    // sidechain duck on beat
    const beatProg = (idx % Math.floor(BEAT_DURATION * SAMPLE_RATE)) / (BEAT_DURATION * SAMPLE_RATE);
    const sc = Math.min(1.0, Math.pow(beatProg, 0.4) * 1.3);

    const osc = Math.sin(2 * Math.PI * freq * t);
    const sub = 0.5 * Math.sin(2 * Math.PI * freq * 0.5 * t);
    const grit = 0.4 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 3);
    const v = Math.tanh((osc + sub + grit) * 1.8) * env * sc * 0.65;

    left[idx] += v;
    right[idx] += v;
  }
}

function addLead(start: number, freq: number, pan: number) {
  const dur = 0.35;
  const len = Math.min(Math.floor(dur * SAMPLE_RATE), TOTAL_SAMPLES - start);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const idx = start + i;
    if (idx >= TOTAL_SAMPLES) break;

    const env = Math.exp(-t * 5.0) * Math.min(1, i / (SAMPLE_RATE * 0.003));
    const o1 = Math.sin(2 * Math.PI * freq * t);
    const o2 = 0.6 * Math.sin(2 * Math.PI * (freq * 1.004) * t);
    const o3 = 0.6 * Math.sin(2 * Math.PI * (freq * 0.996) * t);
    const o4 = 0.3 * Math.sin(2 * Math.PI * (freq * 2.0) * t) * Math.exp(-t * 8);

    const v = (o1 + o2 + o3 + o4) * env * 0.45;
    const lg = Math.cos((pan + 1) * Math.PI / 4);
    const rg = Math.sin((pan + 1) * Math.PI / 4);

    left[idx] += v * lg;
    right[idx] += v * rg;
  }
}

// Composition loop
const totalBeats = BARS * 4;

// Pads
for (let bar = 0; bar < BARS; bar++) {
  const barSample = Math.floor(bar * 4 * BEAT_DURATION * SAMPLE_RATE);
  const ch = CHORDS[bar % 4];
  const barDur = 4 * BEAT_DURATION;
  ch.notes.forEach((n, idx) => {
    const f = FREQS[n] || 220;
    const pan = (idx / (ch.notes.length - 1)) * 1.6 - 0.8;
    addPad(barSample, barDur + 0.4, f, pan);
  });
}

// Rhythms
for (let beat = 0; beat < totalBeats; beat++) {
  const beatTime = beat * BEAT_DURATION;
  const beatSample = Math.floor(beatTime * SAMPLE_RATE);
  const bar = Math.floor(beat / 4);
  const beatInBar = beat % 4;
  const ch = CHORDS[bar % 4];

  // Kick on every beat
  addKick(beatSample);

  // Snare on 2 and 4
  if (beatInBar === 1 || beatInBar === 3) {
    addSnare(beatSample);
  }

  // Offbeat Hat + 16th hats
  const offbeat = beatSample + Math.floor(BEAT_DURATION * 0.5 * SAMPLE_RATE);
  addHat(offbeat, true);
  addHat(beatSample + Math.floor(BEAT_DURATION * 0.25 * SAMPLE_RATE), false);
  addHat(beatSample + Math.floor(BEAT_DURATION * 0.75 * SAMPLE_RATE), false);

  // Bass
  const bassF = FREQS[ch.bass] || 55;
  addBass(beatSample, BEAT_DURATION * 0.9, bassF);

  // Melodic Lead
  const melody = ['D4', 'F4', 'A4', 'C5', 'D5', 'F5', 'E5', 'A4', 'C5', 'D5', 'G5', 'F5', 'E5', 'D5', 'C5', 'A4'];
  for (let s = 0; s < 4; s++) {
    const sSample = beatSample + Math.floor(s * (BEAT_DURATION / 4) * SAMPLE_RATE);
    const mIdx = (beat * 4 + s) % melody.length;
    const mFreq = FREQS[melody[mIdx]] || 440;
    addLead(sSample, mFreq, s % 2 === 0 ? -0.4 : 0.4);
  }
}

// Normalize to peak 0.95 (LOUD & CRISP)
let maxVal = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  if (Math.abs(left[i]) > maxVal) maxVal = Math.abs(left[i]);
  if (Math.abs(right[i]) > maxVal) maxVal = Math.abs(right[i]);
}

const norm = 0.95 / Math.max(maxVal, 0.0001);
console.log('Peak before normalization:', maxVal, 'Multiplier:', norm);

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  left[i] = Math.tanh(left[i] * norm);
  right[i] = Math.tanh(right[i] * norm);
}

// Build 16-bit PCM WAV
const buffer = Buffer.alloc(44 + TOTAL_SAMPLES * 4);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + TOTAL_SAMPLES * 4, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(2, 22);
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

const paths = [
  path.join(process.cwd(), 'public', 'futuristic_anthem.wav'),
  path.join(process.cwd(), 'public', '05.mp3'),
  path.join(process.cwd(), 'public', 'soundtrack.mp3'),
  path.join(process.cwd(), 'src', 'assets', 'futuristic_anthem.wav'),
  path.join(process.cwd(), 'src', 'assets', '05.mp3'),
  path.join(process.cwd(), 'src', 'assets', 'soundtrack.mp3'),
];

paths.forEach(p => fs.writeFileSync(p, buffer));
console.log('Saved 0dB Loud Futuristic Soundtrack across all assets paths!');
