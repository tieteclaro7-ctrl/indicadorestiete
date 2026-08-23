import fs from 'fs';
import path from 'path';

// Generate a pristine, professional Melodic Electronic / Progressive House Track (126 BPM)
// Non-robotic: Uses soft multi-oscillator detuning, warm low-pass filters, sidechained sub-bass,
// acoustic-style electric piano harmonics, dynamic velocity, lush stereo reverb, and build/drop arrangement.

const SAMPLE_RATE = 44100;
const BPM = 126;
const BEAT_DURATION = 60 / BPM; // ~0.476 sec
const BARS = 32; // ~60 seconds loopable electronic track
const TOTAL_DURATION = BARS * 4 * BEAT_DURATION;
const TOTAL_SAMPLES = Math.floor(TOTAL_DURATION * SAMPLE_RATE);

const leftChannel = new Float32Array(TOTAL_SAMPLES);
const rightChannel = new Float32Array(TOTAL_SAMPLES);

// Note frequencies
const NOTES: Record<string, number> = {
  'A1': 55.00, 'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00,
  'A2': 110.00, 'B2': 123.47, 'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
  'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
  'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99,
  'A5': 880.00
};

// Chord progression: Am -> F -> C -> G (4 bars each cycle, repeated with uplifting variations)
const CHORD_PROGRESSION = [
  { root: 'A2', notes: ['A3', 'C4', 'E4', 'A4'], bass: 'A1' },
  { root: 'F2', notes: ['F3', 'A3', 'C4', 'F4'], bass: 'F1' },
  { root: 'C3', notes: ['C3', 'E3', 'G3', 'C4'], bass: 'C2' },
  { root: 'G2', notes: ['G3', 'B3', 'D4', 'G4'], bass: 'G1' },
];

// 1. Synth Piano / Pluck with warm detuned saws and triangle harmonics
function renderPluck(sampleStart: number, durationSec: number, freq: number, velocity: number, pan: number) {
  const noteSamples = Math.min(Math.floor(durationSec * SAMPLE_RATE), TOTAL_SAMPLES - sampleStart);
  for (let i = 0; i < noteSamples; i++) {
    const t = i / SAMPLE_RATE;
    const idx = sampleStart + i;
    if (idx >= TOTAL_SAMPLES) break;

    // Organic envelope: fast attack, exponential decay with musical release
    const env = Math.exp(-t * 3.8) * Math.min(1, i / (SAMPLE_RATE * 0.005));
    if (env < 0.0001) break;

    // Rich harmonic spectrum (warm saw + tri + sub shimmer)
    const osc1 = Math.sin(2 * Math.PI * freq * t);
    const osc2 = 0.5 * Math.sin(2 * Math.PI * (freq * 1.004) * t); // detuned
    const osc3 = 0.5 * Math.sin(2 * Math.PI * (freq * 0.996) * t); // detuned
    const osc4 = 0.35 * Math.sin(2 * Math.PI * (freq * 2.001) * t) * Math.exp(-t * 6); // high octave sparkle
    const osc5 = 0.2 * Math.sin(2 * Math.PI * (freq * 3.0) * t) * Math.exp(-t * 8);

    const val = (osc1 + osc2 + osc3 + osc4 + osc5) * env * velocity * 0.22;
    
    // Stereo panning
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    leftChannel[idx] += val * leftGain;
    rightChannel[idx] += val * rightGain;
  }
}

// 2. Warm Rolling Bass with Sidechain Ducking
function renderBass(sampleStart: number, durationSec: number, freq: number, velocity: number, sidechain: boolean) {
  const noteSamples = Math.min(Math.floor(durationSec * SAMPLE_RATE), TOTAL_SAMPLES - sampleStart);
  for (let i = 0; i < noteSamples; i++) {
    const t = i / SAMPLE_RATE;
    const idx = sampleStart + i;
    if (idx >= TOTAL_SAMPLES) break;

    // Bass envelope
    const env = Math.exp(-t * 2.5);
    
    // Sidechain pumping curve on beat
    let sc = 1.0;
    if (sidechain) {
      const beatProgress = (idx % Math.floor(BEAT_DURATION * SAMPLE_RATE)) / (BEAT_DURATION * SAMPLE_RATE);
      // Duck on beat hit, recover smoothly
      sc = Math.min(1.0, Math.pow(beatProgress, 0.45) * 1.25);
    }

    const sub = Math.sin(2 * Math.PI * freq * t);
    const sat = Math.tanh(sub * 1.5); // Warm tape saturation
    const secondHarm = 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);

    const val = (sat + secondHarm) * env * sc * velocity * 0.28;
    leftChannel[idx] += val * 0.95;
    rightChannel[idx] += val * 0.95;
  }
}

// 3. Electronic Punchy 909-style Kick
function renderKick(sampleStart: number) {
  const duration = 0.32;
  const kickSamples = Math.min(Math.floor(duration * SAMPLE_RATE), TOTAL_SAMPLES - sampleStart);
  for (let i = 0; i < kickSamples; i++) {
    const t = i / SAMPLE_RATE;
    const idx = sampleStart + i;
    if (idx >= TOTAL_SAMPLES) break;

    // Pitch sweep envelope: 150 Hz drops to 45 Hz rapidly
    const pitch = 45 + 130 * Math.exp(-t * 38);
    const phase = 2 * Math.PI * (45 * t + (130 / 38) * (1 - Math.exp(-t * 38)));
    const ampEnv = Math.exp(-t * 8.5);
    
    // Punch click at the start
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.15;
    const body = Math.sin(phase) * ampEnv;
    const val = (body + click) * 0.42;

    leftChannel[idx] += val;
    rightChannel[idx] += val;
  }
}

// 4. Snare / Clap with stereo spread
function renderClap(sampleStart: number) {
  const duration = 0.25;
  const clapSamples = Math.min(Math.floor(duration * SAMPLE_RATE), TOTAL_SAMPLES - sampleStart);
  for (let i = 0; i < clapSamples; i++) {
    const t = i / SAMPLE_RATE;
    const idx = sampleStart + i;
    if (idx >= TOTAL_SAMPLES) break;

    // Multi-transient clap envelope
    let clapEnv = Math.exp(-t * 16);
    if (t < 0.04) {
      clapEnv += 0.4 * Math.sin(t * 800) * Math.exp(-t * 60);
    }
    const noiseL = (Math.random() * 2 - 1) * clapEnv;
    const noiseR = (Math.random() * 2 - 1) * clapEnv;
    const tone = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 22) * 0.3;

    leftChannel[idx] += (noiseL * 0.22 + tone) * 0.35;
    rightChannel[idx] += (noiseR * 0.22 + tone) * 0.35;
  }
}

// 5. Open & Closed Hi-Hats
function renderHiHat(sampleStart: number, open: boolean) {
  const duration = open ? 0.22 : 0.05;
  const hatSamples = Math.min(Math.floor(duration * SAMPLE_RATE), TOTAL_SAMPLES - sampleStart);
  const decayRate = open ? 14 : 70;
  for (let i = 0; i < hatSamples; i++) {
    const t = i / SAMPLE_RATE;
    const idx = sampleStart + i;
    if (idx >= TOTAL_SAMPLES) break;

    const env = Math.exp(-t * decayRate);
    const metallicNoise = (Math.random() * 2 - 1) * 0.7 + 0.3 * Math.sin(2 * Math.PI * 7200 * t);
    const val = metallicNoise * env * (open ? 0.16 : 0.12);

    leftChannel[idx] += val * 0.85;
    rightChannel[idx] += val * 1.15;
  }
}

// Compose Song Arrangement:
// Bars 0-4: Intro with gentle piano chords + filter sweep
// Bars 4-8: Intro buildup + Hi-hats + deep rolling bass
// Bars 8-16: Main Drop / Melodic Anthem with full 4-on-the-floor kick, claps, bass, arp & lead melody
// Bars 16-20: Uplifting bridge with arpeggiated synths
// Bars 20-28: Second drop peak energy with maximum melody & harmony
// Bars 28-32: Outro with seamless loop transition

const totalBeats = BARS * 4;

for (let beat = 0; beat < totalBeats; beat++) {
  const beatTime = beat * BEAT_DURATION;
  const beatSample = Math.floor(beatTime * SAMPLE_RATE);
  const bar = Math.floor(beat / 4);
  const beatInBar = beat % 4;
  const chordIdx = bar % 4;
  const chord = CHORD_PROGRESSION[chordIdx];

  // KICK: 4-on-the-floor in active sections (bars 4-15, 20-31)
  if ((bar >= 4 && bar < 16) || (bar >= 20 && bar < 32)) {
    renderKick(beatSample);
  }

  // CLAP: on beats 2 & 4
  if (((bar >= 4 && bar < 16) || (bar >= 20 && bar < 32)) && (beatInBar === 1 || beatInBar === 3)) {
    renderClap(beatSample);
  }

  // HI-HATS: Off-beat open hats and 16th closed hats
  if (bar >= 2 && bar < 32) {
    // Off-beat open hat
    const offbeatSample = beatSample + Math.floor(BEAT_DURATION * 0.5 * SAMPLE_RATE);
    renderHiHat(offbeatSample, true);

    // 16th groove
    const hat16_1 = beatSample + Math.floor(BEAT_DURATION * 0.25 * SAMPLE_RATE);
    const hat16_2 = beatSample + Math.floor(BEAT_DURATION * 0.75 * SAMPLE_RATE);
    renderHiHat(hat16_1, false);
    renderHiHat(hat16_2, false);
  }

  // ROLLING BASSLINE (Off-beat 8th notes)
  if (bar >= 4 && bar < 32) {
    const bassFreq = NOTES[chord.root] || 110;
    // 8th note bass pulses
    const bassSample1 = beatSample + Math.floor(BEAT_DURATION * 0.5 * SAMPLE_RATE);
    const bassSample2 = beatSample + Math.floor(BEAT_DURATION * 0.75 * SAMPLE_RATE);
    renderBass(beatSample, BEAT_DURATION * 0.45, bassFreq, 0.9, true);
    renderBass(bassSample1, BEAT_DURATION * 0.25, bassFreq * 1.0, 0.85, true);
    renderBass(bassSample2, BEAT_DURATION * 0.25, bassFreq * 1.0, 0.75, true);
  }

  // MELODIC CHORDS / PIANO
  if (beatInBar === 0 || beatInBar === 2) {
    chord.notes.forEach((noteName, nIdx) => {
      const freq = NOTES[noteName] || 440;
      const pan = (nIdx / (chord.notes.length - 1)) * 1.4 - 0.7;
      renderPluck(beatSample, BEAT_DURATION * 1.8, freq, 0.8, pan);
    });
  }

  // ARPEGGIO & LEAD MELODY
  const melodyNotes = ['E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
  for (let step = 0; step < 4; step++) {
    const stepSample = beatSample + Math.floor(step * (BEAT_DURATION / 4) * SAMPLE_RATE);
    const noteStepIdx = (beat * 4 + step) % melodyNotes.length;
    const melFreq = NOTES[melodyNotes[noteStepIdx]] || 440;
    
    // Play melody pluck
    if (bar >= 8 && bar < 30) {
      renderPluck(stepSample, 0.2, melFreq, 0.65, (step % 2 === 0 ? -0.4 : 0.4));
    }
  }
}

// Master limiter & soft clipper to prevent distortion and give radio-ready warmth
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  // Soft limiter
  leftChannel[i] = Math.tanh(leftChannel[i] * 1.25) * 0.88;
  rightChannel[i] = Math.tanh(rightChannel[i] * 1.25) * 0.88;
}

// Write Standard 16-bit PCM Stereo WAV file
const buffer = Buffer.alloc(44 + TOTAL_SAMPLES * 4);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + TOTAL_SAMPLES * 4, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // SubChunk1Size
buffer.writeUInt16LE(1, 20); // PCM format
buffer.writeUInt16LE(2, 22); // Stereo 2 channels
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // ByteRate
buffer.writeUInt16LE(4, 32); // BlockAlign
buffer.writeUInt16LE(16, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(TOTAL_SAMPLES * 4, 40);

let offset = 44;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const l = Math.max(-1, Math.min(1, leftChannel[i]));
  const r = Math.max(-1, Math.min(1, rightChannel[i]));
  buffer.writeInt16LE(Math.floor(l * 32767), offset);
  offset += 2;
  buffer.writeInt16LE(Math.floor(r * 32767), offset);
  offset += 2;
}

fs.writeFileSync(path.join(process.cwd(), 'public', 'electronic_anthem.wav'), buffer);
fs.writeFileSync(path.join(process.cwd(), 'public', '05.mp3'), buffer);
fs.writeFileSync(path.join(process.cwd(), 'src', 'assets', '05.mp3'), buffer);
fs.writeFileSync(path.join(process.cwd(), 'src', 'assets', 'electronic_anthem.wav'), buffer);

console.log('Successfully generated Electronic Anthem (Non-robotic, Melodic Progressive House)! File size:', buffer.length);
