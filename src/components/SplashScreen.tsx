import React, { useEffect, useState, useRef } from 'react';
import { LogIn, Volume2, VolumeX, ShieldCheck, Activity, Cpu, Sparkles } from 'lucide-react';
import claroLogoImg from '../assets/images/claro_splash_logo_1787398577283.jpg';
import { FuturisticVideoBackground } from './FuturisticVideoBackground';

interface SplashScreenProps {
  onEnter: () => void;
}

// Energetic, Upbeat Sales Motivation Music Synthesizer (126 BPM)
class SalesEnergyMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private step = 0;
  private bpm = 126;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // Ignored if audio not supported
    }
  }

  public async start() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Handled by user interaction unlock
      }
    }

    if (this.isPlaying) {
      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch {}
      }
      return;
    }

    this.isPlaying = true;

    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.linearRampToValueAtTime(0.42, now + 0.4);

    this.scheduleBeatLoop();
  }

  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playSnareClap(time: number) {
    if (!this.ctx || !this.masterGain) return;
    
    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1100, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);

    // Tone body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(130, time + 0.08);

    oscGain.gain.setValueAtTime(0.18, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playHiHat(time: number, isAccent = false) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isAccent ? 0.12 : 0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccent ? 0.06 : 0.035));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  private playSynthNote(freq: number, time: number, dur: number, gainVal = 0.1, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + dur);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private playBass(freq: number, time: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq / 2, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.05);
    sub.stop(time + dur + 0.05);
  }

  private scheduleBeatLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const secondsPer16th = 60 / this.bpm / 4;
    const startTime = this.ctx.currentTime + 0.05;

    // Upbeat chords in key of C Major / A Minor: C -> G -> Am -> F (Triumphant, victorious sales anthem)
    // 16 steps per bar (4 bars loop = 64 sixteenth steps)
    const barChords = [
      { bass: 130.81, treble: [523.25, 659.25, 783.99, 1046.5] }, // C Major (C5, E5, G5, C6)
      { bass: 98.00, treble: [392.00, 493.88, 587.33, 783.99] },  // G Major (G4, B4, D5, G5)
      { bass: 110.00, treble: [440.00, 523.25, 659.25, 880.00] }, // A Minor (A4, C5, E5, A5)
      { bass: 87.31, treble: [349.23, 440.00, 523.25, 698.46] },  // F Major (F4, A4, C5, F5)
    ];

    const currentBarIdx = Math.floor((this.step % 64) / 16);
    const chord = barChords[currentBarIdx];

    for (let s = 0; s < 16; s++) {
      const t = startTime + s * secondsPer16th;

      // 1. Kick on beats 0, 4, 8, 12 (Four-on-the-floor energy)
      if (s % 4 === 0) {
        this.playKick(t);
      }

      // 2. Snare / Clap on beats 4, 12
      if (s === 4 || s === 12) {
        this.playSnareClap(t);
      }

      // 3. Offbeat Open Hi-Hat on 2, 6, 10, 14 & Shakers
      if (s % 2 === 0) {
        this.playHiHat(t, s % 4 === 2);
      }

      // 4. Energetic Driving Bassline (Groove pattern: 0, 3, 6, 8, 11, 14)
      if ([0, 3, 6, 8, 11, 14].includes(s)) {
        this.playBass(chord.bass, t, secondsPer16th * 1.5);
      }

      // 5. Bright Motivational Synth Chords & Riffs
      if ([0, 3, 6, 8, 10, 12, 14].includes(s)) {
        const note = chord.treble[s % chord.treble.length];
        this.playSynthNote(note, t, secondsPer16th * 1.8, 0.08, 'sawtooth');
      }
    }

    this.step += 16;
    const barDurationMs = 16 * secondsPer16th * 1000;
    this.timerId = window.setTimeout(() => {
      this.scheduleBeatLoop();
    }, barDurationMs - 40);
  }

  public stop(fadeOutSeconds = 0.6) {
    if (!this.ctx || !this.masterGain) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSeconds);
      setTimeout(() => {
        if (this.ctx && this.ctx.state !== 'closed') {
          this.ctx.close().catch(() => {});
          this.ctx = null;
        }
      }, fadeOutSeconds * 1000 + 50);
    } catch {
      // Ignored
    }
  }
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const musicEngineRef = useRef<SalesEnergyMusicEngine | null>(null);

  useEffect(() => {
    // Instantiate upbeat sales music synthesizer
    const engine = new SalesEnergyMusicEngine();
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
      onClick={() => {
        // First click anywhere on the splash unblocks and plays audio immediately
        if (musicEngineRef.current && isPlayingMusic) {
          musicEngineRef.current.start();
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

