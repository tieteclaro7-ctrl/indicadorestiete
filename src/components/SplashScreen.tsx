import React, { useEffect, useState, useRef } from 'react';
import { LogIn, Volume2, VolumeX, ShieldCheck, Activity, Cpu, Sparkles } from 'lucide-react';
import claroLogoImg from '../assets/images/claro_splash_logo_1787398577283.jpg';
import { FuturisticVideoBackground } from './FuturisticVideoBackground';

interface SplashScreenProps {
  onEnter: () => void;
}

// Heavy Rave & Hard Electronic Music Synthesizer (138 BPM, Acid 303 Rolling Bass, Distorted Kick, Searing Hi-Hats & Rave Stabs)
class RaveMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  public isPlaying = false;
  private isLoopRunning = false;
  private timerId: number | null = null;
  private step = 0;
  private bpm = 138;

  // Custom soft-clipping curve for aggressive rave sound
  private makeDistortionCurve(amount = 25): Float32Array {
    const k = typeof amount === 'number' ? amount : 25;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.55, this.ctx.currentTime);

      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(18);
      this.distortionNode.oversample = '2x';

      this.distortionNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.ctx.onstatechange = () => {
        if (this.ctx?.state === 'running' && !this.isLoopRunning && this.isPlaying) {
          this.isLoopRunning = true;
          this.scheduleBeatLoop();
        }
      };
    } catch {
      // Ignored if audio not supported
    }
  }

  public async start(): Promise<boolean> {
    this.init();
    if (!this.ctx || !this.masterGain) return false;

    this.isPlaying = true;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Will resume on first user interaction
      }
    }

    if (this.ctx.state === 'running' && !this.isLoopRunning) {
      this.isLoopRunning = true;
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.linearRampToValueAtTime(0.55, now + 0.25);
      this.step = 0;
      this.scheduleBeatLoop();
      return true;
    }

    return this.ctx.state === 'running';
  }

  // 1. Heavy Punchy Rave Kick with Hard Transient & Low Sub Rumble
  private playHeavyKick(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Body Oscillator (Hard pitch sweep 280Hz -> 40Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.25);

    // Click transient (top punch)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(900, time);
    clickOsc.frequency.exponentialRampToValueAtTime(100, time + 0.02);

    clickGain.gain.setValueAtTime(0.4, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);

    clickOsc.start(time);
    clickOsc.stop(time + 0.03);
  }

  // 2. Hard Industrial Snare / Clap
  private playRaveClap(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.14;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1300, time);
    filter.Q.setValueAtTime(2.2, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);

    // Hard punch tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.06);

    oscGain.gain.setValueAtTime(0.28, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  // 3. Searing Open / Closed Hi-Hats
  private playRaveHat(time: number, isOpen = false) {
    if (!this.ctx || !this.masterGain) return;

    const dur = isOpen ? 0.11 : 0.035;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isOpen ? 6500 : 8500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.22 : 0.11, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  // 4. Acid 303 Rolling Bass with Resonant Filter Modulation
  private playAcidBass(freq: number, time: number, dur: number, cutoff: number, resonance = 8) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    sub.type = 'square';
    sub.frequency.setValueAtTime(freq / 2, time);

    // Resonant Acid Lowpass Filter Sweep
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(resonance, time);
    filter.frequency.setValueAtTime(cutoff * 3.5, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.7), time + dur);

    gain.gain.setValueAtTime(0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);

    if (this.distortionNode) {
      gain.connect(this.distortionNode);
    } else {
      gain.connect(this.masterGain);
    }

    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.05);
    sub.stop(time + dur + 0.05);
  }

  // 5. Heavy Rave Synth Stab / Lead (Detuned Sawtooth Stabs)
  private playRaveStab(freq: number, time: number, dur: number, gainVal = 0.16) {
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    // Detuned voices for massive rave sound
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.012, time);

    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(freq * 0.988, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, time);
    filter.frequency.exponentialRampToValueAtTime(900, time + dur);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    osc1.stop(time + dur + 0.05);
    osc2.stop(time + dur + 0.05);
    osc3.stop(time + dur + 0.05);
  }

  // 6. Laser Zaps & Rave Noise Sweeps
  private playRaveLaser(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.15);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.18);
  }

  private scheduleBeatLoop() {
    if (!this.isPlaying || !this.isLoopRunning || !this.ctx || this.ctx.state !== 'running') {
      this.isLoopRunning = false;
      return;
    }

    const secondsPer16th = 60 / this.bpm / 4;
    const startTime = this.ctx.currentTime + 0.04;

    // Dark & Driving Rave Progression in F Minor: Fm -> Db -> Eb -> C7 (Intense peak-time energy)
    const raveChords = [
      {
        bassFreq: 87.31, // F2
        cutoff: 750,
        stabs: [349.23, 415.3, 523.25, 698.46], // F4, Ab4, C5, F5
      },
      {
        bassFreq: 69.3, // Db2
        cutoff: 920,
        stabs: [277.18, 349.23, 415.3, 554.37], // Db4, F4, Ab4, Db5
      },
      {
        bassFreq: 77.78, // Eb2
        cutoff: 1100,
        stabs: [311.13, 392.0, 466.16, 622.25], // Eb4, G4, Bb4, Eb5
      },
      {
        bassFreq: 65.41, // C2
        cutoff: 1400,
        stabs: [261.63, 329.63, 392.0, 523.25], // C4, E4, G4, C5
      },
    ];

    const currentBarIdx = Math.floor((this.step % 64) / 16);
    const barData = raveChords[currentBarIdx];

    // Acid 303 Rolling 16th Pattern (0, 2, 3, 5, 6, 8, 10, 11, 13, 14, 15)
    for (let s = 0; s < 16; s++) {
      const t = startTime + s * secondsPer16th;

      // 1. Four-on-the-floor Heavy Distorted Rave Kick (0, 4, 8, 12)
      if (s % 4 === 0) {
        this.playHeavyKick(t);
      }

      // 2. Heavy Industrial Clap on beats 4 & 12
      if (s === 4 || s === 12) {
        this.playRaveClap(t);
      }

      // 3. Open Hi-Hat on offbeats (2, 6, 10, 14) + Closed hats driving 16th rhythm
      if (s % 4 === 2) {
        this.playRaveHat(t, true);
      } else {
        this.playRaveHat(t, false);
      }

      // 4. Rolling Acid 303 Bassline (Driving Psy/Techno 16ths)
      if (s !== 0 && s !== 4 && s !== 8 && s !== 12) {
        // Offbeat / rolling acid bass
        const isAccent = s === 3 || s === 7 || s === 11 || s === 15;
        const notePitch = isAccent ? barData.bassFreq * 1.5 : barData.bassFreq;
        this.playAcidBass(
          notePitch,
          t,
          secondsPer16th * (isAccent ? 1.4 : 0.85),
          barData.cutoff * (isAccent ? 1.8 : 1.0),
          isAccent ? 12 : 7
        );
      }

      // 5. Heavy Rave Stabs on Syncopated Beats (0, 3, 6, 10, 14)
      if ([0, 3, 6, 10, 14].includes(s)) {
        const stabNote = barData.stabs[(s + currentBarIdx) % barData.stabs.length];
        this.playRaveStab(stabNote, t, secondsPer16th * 1.6, 0.14);
      }

      // 6. Laser Zap FX on transition of bar
      if (s === 15 && currentBarIdx % 2 === 1) {
        this.playRaveLaser(t);
      }
    }

    this.step += 16;
    const barDurationMs = 16 * secondsPer16th * 1000;
    this.timerId = window.setTimeout(() => {
      this.scheduleBeatLoop();
    }, barDurationMs - 35);
  }

  public stop(fadeOutSeconds = 0.5) {
    this.isPlaying = false;
    this.isLoopRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + fadeOutSeconds);
      setTimeout(() => {
        if (this.ctx && !this.isPlaying && this.ctx.state !== 'closed') {
          this.ctx.suspend().catch(() => {});
        }
      }, fadeOutSeconds * 1000 + 50);
    } catch {}
  }
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const musicEngineRef = useRef<RaveMusicEngine | null>(null);

  useEffect(() => {
    // Instantiate heavy electronic rave music synthesizer
    const engine = new RaveMusicEngine();
    musicEngineRef.current = engine;

    // Start UI entrance animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 60);

    // Attempt immediate automatic playback upon opening page
    const tryAutoplay = () => {
      if (musicEngineRef.current) {
        musicEngineRef.current.start().catch(() => {});
      }
    };

    tryAutoplay();

    // Unlock listeners: browsers may require an initial user signal (pointer, tap, key, scroll)
    const unlockAudioEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click', 'wheel', 'mousemove'];
    const handleInitialUserSignal = () => {
      tryAutoplay();
      // Remove listeners once audio is initialized
      unlockAudioEvents.forEach((ev) => {
        window.removeEventListener(ev, handleInitialUserSignal);
      });
    };

    unlockAudioEvents.forEach((ev) => {
      window.addEventListener(ev, handleInitialUserSignal, { passive: true, once: false });
    });

    // Also trigger on document visibility change / window focus
    window.addEventListener('focus', tryAutoplay);
    document.addEventListener('visibilitychange', tryAutoplay);

    return () => {
      clearTimeout(timer);
      unlockAudioEvents.forEach((ev) => {
        window.removeEventListener(ev, handleInitialUserSignal);
      });
      window.removeEventListener('focus', tryAutoplay);
      document.removeEventListener('visibilitychange', tryAutoplay);
      if (musicEngineRef.current) {
        musicEngineRef.current.stop(0.1);
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!musicEngineRef.current) return;
    if (isPlayingMusic) {
      musicEngineRef.current.stop(0.3);
      setIsPlayingMusic(false);
    } else {
      musicEngineRef.current.start();
      setIsPlayingMusic(true);
    }
  };

  const handleEnter = () => {
    if (musicEngineRef.current) {
      musicEngineRef.current.stop(0.5);
    }
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 400);
  };

  return (
    <div
      id="splash-screen-container"
      onPointerMove={() => {
        if (musicEngineRef.current && isPlayingMusic && !musicEngineRef.current.isPlaying) {
          musicEngineRef.current.start().catch(() => {});
        }
      }}
      onTouchStart={() => {
        if (musicEngineRef.current && isPlayingMusic) {
          musicEngineRef.current.start().catch(() => {});
        }
      }}
      onClick={() => {
        // First click anywhere on the splash unblocks and plays audio immediately
        if (musicEngineRef.current && isPlayingMusic) {
          musicEngineRef.current.start().catch(() => {});
        }
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none overflow-hidden transition-all duration-400 bg-[#060002] ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Futuristic Animated Business Video / Canvas Background */}
      <FuturisticVideoBackground />

      {/* 2. Cyber Telemetry Corner HUD Elements */}
      <div className="absolute top-6 left-6 z-20 hidden md:flex flex-col gap-1 text-[11px] font-mono text-red-300/60 uppercase tracking-widest pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span>PORTAL CORPORATIVO • 5G+</span>
        </div>
        <span className="text-white/40 text-[10px]">ID: LOJA-TIETÊ-PLAZA-07</span>
      </div>

      <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-4 text-[11px] font-mono text-white/40 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>SERVIÇOS ONLINE</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-red-400" />
          <span>TELEMETRIA DIÁRIA</span>
        </div>
      </div>

      {/* Floating Animated Audio Equalizer Badge */}
      <div className="absolute top-5 right-5 z-30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMusic();
          }}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl text-white text-xs font-bold border border-red-500/30 hover:border-red-400/60 transition-all cursor-pointer shadow-[0_4px_20px_rgba(234,29,44,0.25)] active:scale-95 group"
          title={isPlayingMusic ? 'Silenciar áudio' : 'Ativar áudio'}
        >
          {isPlayingMusic ? (
            <>
              {/* Equalizer Bars Animation */}
              <div className="flex items-end gap-0.5 h-3.5 w-4">
                <span className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.1s] h-full" />
                <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_ease-in-out_0.3s] h-3/4" />
                <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.5s_infinite_ease-in-out_0.2s] h-4/5" />
              </div>
              <span className="inline font-mono tracking-wide text-white group-hover:text-red-300 transition-colors">Áudio Ativo</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-white/70" />
              <span className="inline font-mono tracking-wide text-white/80">Áudio Pausado</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container - High Tech Holographic Business Card */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center px-4">
        
        {/* Holographic Card Frame */}
        <div
          className={`w-full relative p-6 sm:p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-red-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(234,29,44,0.2)] transition-all duration-700 transform ${
            isLoaded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
        >
          {/* Cyber Decorative Corner Accents */}
          <div className="absolute top-2.5 left-3 text-red-500/40 font-mono text-xs select-none">┌ [SYS.01]</div>
          <div className="absolute top-2.5 right-3 text-red-500/40 font-mono text-xs select-none">[LIVE] ┐</div>
          <div className="absolute bottom-2.5 left-3 text-red-500/40 font-mono text-xs select-none">└</div>
          <div className="absolute bottom-2.5 right-3 text-red-500/40 font-mono text-xs select-none">┘</div>

          {/* Logo Claro with Neon Energy Aura */}
          <div className="relative inline-flex items-center justify-center mb-6 group">
            {/* Ambient Red Glow behind logo */}
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            
            <img
              src={claroLogoImg}
              alt="Claro"
              referrerPolicy="no-referrer"
              className="relative w-64 sm:w-80 md:w-96 h-auto object-contain rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.6)] border border-white/20"
            />
          </div>

          {/* Corporate Store Titles */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Bem-vindo à Loja Claro
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-red-400 tracking-wide mt-1.5 drop-shadow-md">
              Shopping Tietê Plaza
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold tracking-wider mt-4 backdrop-blur-md shadow-[0_0_15px_rgba(234,29,44,0.3)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono">SISTEMA DE INDICADORES</span>
            </div>
          </div>

          {/* Action Button: ENTRAR */}
          <div className="mt-8 w-full flex flex-col items-center">
            <button
              id="btn-splash-entrar"
              onClick={handleEnter}
              className="group relative w-full sm:w-80 py-4 px-8 bg-gradient-to-r from-white via-slate-100 to-white hover:from-white hover:to-slate-200 text-red-600 hover:text-red-700 font-black text-xl rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_30px_rgba(234,29,44,0.4)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_40px_rgba(234,29,44,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer border border-white"
            >
              <span className="tracking-wider">ENTRAR</span>
              <LogIn className="w-6 h-6 transition-transform group-hover:translate-x-2 text-red-600" />
            </button>

            <p className="text-white/60 text-xs font-mono mt-3.5 flex items-center gap-1.5">
              Clique em ENTRAR para acessar o dashboard
            </p>
          </div>
        </div>

      </div>

      {/* Corporate Footer on Splash */}
      <div className="absolute bottom-4 text-center text-white/50 text-[11px] font-mono tracking-wider z-20">
        CLARO BRASIL • SHOPPING TIETÊ PLAZA • SISTEMA INTERNO
      </div>
    </div>
  );
};

