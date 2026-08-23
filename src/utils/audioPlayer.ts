// Audio Engine for Loja Claro Tietê Plaza
// Compatible with local development, Production build, and GitHub Pages/Static deployment
// Plays the official (05).mp3 instantly upon landing and unlocks seamlessly on any browser gesture

import claroMusicTrack from '../assets/05.mp3';

export interface TrackInfo {
  id: string;
  name: string;
  genre: string;
  url: string;
}

export const AUDIO_PLAYLIST: TrackInfo[] = [
  {
    id: 'claro-official-05',
    name: 'Música Oficial Loja Claro Tietê Plaza (05.mp3)',
    genre: 'Trilha Sonora Original • Alta Definição',
    url: claroMusicTrack,
  },
];

class AudioEngine {
  private htmlAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private volume: number = 0.9;
  private isMuted: boolean = false;
  private onStateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];
  private hasInteracted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Immediate hookup into DOM & window gesture unlockers
      const unlockAndTrigger = () => {
        this.unlockAndPlay();
      };

      const interactionEvents = [
        'touchstart',
        'touchend',
        'pointerdown',
        'mousedown',
        'click',
        'keydown',
        'scroll',
        'wheel',
        'focus',
      ];

      interactionEvents.forEach((evt) => {
        window.addEventListener(evt, unlockAndTrigger, { capture: true, passive: true });
        document.addEventListener(evt, unlockAndTrigger, { capture: true, passive: true });
      });

      // Immediate attempt as early as possible
      const startEarly = () => {
        this.initAndAutoPlay();
      };

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startEarly();
      } else {
        window.addEventListener('DOMContentLoaded', startEarly);
        window.addEventListener('load', startEarly);
      }
    }
  }

  public subscribe(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    const playing = this.isPlaying();
    this.onStateChangeCallbacks.forEach((cb) => cb(playing));
  }

  public getAudio(): HTMLAudioElement {
    if (!this.htmlAudio) {
      // First check if index.html already has the tag
      const existingDomAudio = typeof document !== 'undefined' ? (document.getElementById('global-bg-audio') as HTMLAudioElement | null) : null;
      const audio = existingDomAudio || new Audio();

      // Resolve reliable source path (bundled hash url or root path)
      const primarySrc = claroMusicTrack || '/05.mp3';
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        audio.src = primarySrc;
      }

      audio.loop = true;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.volume = this.isMuted ? 0 : this.volume;
      this.htmlAudio = audio;

      audio.addEventListener('play', () => this.notify());
      audio.addEventListener('playing', () => this.notify());
      audio.addEventListener('pause', () => this.notify());
      audio.addEventListener('ended', () => this.notify());
      audio.addEventListener('volumechange', () => this.notify());

      // Fallback mechanism: if relative URL fails in GitHub subdirectory deployment, try alternatives
      audio.addEventListener('error', () => {
        if (audio.src.includes('05.mp3')) {
          if (claroMusicTrack && audio.src !== claroMusicTrack) {
            audio.src = claroMusicTrack;
            audio.load();
            audio.play().catch(() => {});
          }
        }
      });
    }
    return this.htmlAudio;
  }

  public async initAndAutoPlay(): Promise<boolean> {
    const audio = this.getAudio();
    audio.volume = this.volume;
    audio.muted = false;

    try {
      // 1. Direct unmuted playback
      await audio.play();
      this.notify();
      return true;
    } catch {
      // 2. If browser strict autoplay policy is active, initiate unmuted on first instant touch/click/scroll
      this.notify();
      return false;
    }
  }

  public unlockAndPlay() {
    const audio = this.getAudio();

    // Unlock Web Audio Context if suspended
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass && !this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {
      // Ignore
    }

    if (audio) {
      if (audio.muted && !this.isMuted) {
        audio.muted = false;
        audio.volume = this.volume;
      }
      if (audio.paused) {
        audio.play().then(() => {
          this.notify();
        }).catch(() => {});
      }
    }
    this.hasInteracted = true;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.isMuted ? 0 : this.volume;
    }
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.htmlAudio) {
      this.htmlAudio.muted = muted;
      this.htmlAudio.volume = muted ? 0 : this.volume;
    }
    this.notify();
  }

  public isMutedState(): boolean {
    return this.isMuted || (this.htmlAudio ? this.htmlAudio.muted : false);
  }

  public getVolume(): number {
    return this.volume;
  }

  public isPlaying(): boolean {
    return !!(this.htmlAudio && !this.htmlAudio.paused && !this.htmlAudio.ended && this.htmlAudio.currentTime >= 0);
  }

  public async play(): Promise<boolean> {
    const audio = this.getAudio();
    audio.muted = this.isMuted;
    audio.volume = this.isMuted ? 0 : this.volume;

    try {
      await audio.play();
      this.notify();
      return true;
    } catch {
      this.notify();
      return false;
    }
  }

  public pause() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    this.notify();
  }

  public stop() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
    }
    this.notify();
  }

  public fadeOutAndStop(durationMs: number = 350) {
    if (!this.htmlAudio || this.htmlAudio.paused) {
      this.stop();
      return;
    }
    const startVol = this.volume;
    const steps = 8;
    const stepTime = durationMs / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const factor = 1 - currentStep / steps;
      if (this.htmlAudio && !this.isMuted) {
        this.htmlAudio.volume = Math.max(0, startVol * factor);
      }
      if (currentStep >= steps) {
        clearInterval(interval);
        this.stop();
        if (this.htmlAudio) {
          this.htmlAudio.volume = startVol;
        }
      }
    }, stepTime);
  }
}

export const globalAudioEngine = new AudioEngine();
