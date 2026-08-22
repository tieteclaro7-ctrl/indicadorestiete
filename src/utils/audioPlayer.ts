// Audio Engine for Loja Claro Tietê Plaza
// Uses the official user-uploaded music (05).mp3 with instant autoplay and zero latency

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
  private volume: number = 0.9;
  private currentTrackId: string = 'claro-official-05';
  private onStateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];

  public subscribe(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.isPlaying()));
  }

  private getAudio(): HTMLAudioElement {
    if (!this.htmlAudio) {
      const audio = new Audio();
      audio.src = claroMusicTrack;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.htmlAudio = audio;

      audio.addEventListener('play', () => this.notify());
      audio.addEventListener('pause', () => this.notify());
      audio.addEventListener('ended', () => this.notify());
    }
    return this.htmlAudio;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isPlaying(): boolean {
    return !!(this.htmlAudio && !this.htmlAudio.paused && this.htmlAudio.currentTime >= 0);
  }

  public async play(trackId?: string): Promise<boolean> {
    if (trackId) {
      this.currentTrackId = trackId;
    }
    const audio = this.getAudio();
    audio.volume = this.volume;

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
      if (this.htmlAudio) {
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
