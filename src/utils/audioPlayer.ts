// Audio Engine for Loja Claro Tietê Plaza
// Guaranteed Auto-Play with browser policy bypass and high-fidelity streaming of (05).mp3

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
    url: claroMusicTrack || '/05.mp3',
  },
];

class AudioEngine {
  private htmlAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private volume: number = 0.9;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private onStateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Global unlocking on any first interaction anywhere in the window
      const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'click', 'keydown', 'scroll', 'visibilitychange'];
      
      const onFirstGesture = () => {
        this.unlockAndPlay();
      };

      unlockEvents.forEach((evt) => {
        window.addEventListener(evt, onFirstGesture, { capture: true, passive: true });
        document.addEventListener(evt, onFirstGesture, { capture: true, passive: true });
      });

      // Try autoplaying as soon as DOM loads or script executes
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        this.initAndAutoPlay();
      } else {
        window.addEventListener('DOMContentLoaded', () => this.initAndAutoPlay());
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
      const audio = new Audio();
      // Primary src: bundled asset with fallback to /05.mp3
      audio.src = claroMusicTrack || '/05.mp3';
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
      
      audio.addEventListener('error', () => {
        // Fallback to /05.mp3 if asset import fails
        if (audio.src !== window.location.origin + '/05.mp3') {
          audio.src = '/05.mp3';
          audio.load();
          audio.play().catch(() => {});
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
      // 1. Try unmuted direct autoplay
      await audio.play();
      this.isUnlocked = true;
      this.notify();
      return true;
    } catch {
      // 2. If blocked by browser autoplay policy, start muted so stream runs immediately
      try {
        audio.muted = true;
        await audio.play();
        this.notify();
      } catch {
        // Will be unmuted on first gesture
      }
      return false;
    }
  }

  public unlockAndPlay() {
    const audio = this.getAudio();
    
    // Unlock Web Audio Context if available
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass && !this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }

    // Unmute and ensure playing with full volume
    if (audio) {
      if (audio.muted && !this.isMuted) {
        audio.muted = false;
        audio.volume = this.volume;
      }
      if (audio.paused) {
        audio.play().then(() => {
          this.isUnlocked = true;
          this.notify();
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
        this.notify();
      }
    }
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
      this.isUnlocked = true;
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
