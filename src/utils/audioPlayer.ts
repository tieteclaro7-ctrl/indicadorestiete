// Premium Corporate Tech Audio Engine for Loja Claro Shopping Tietê Plaza
// Genre: Ambient Techno / Deep House / Soft Cyberpunk (122 BPM)
// Pure high-fidelity royalty-free instrumental stream with warm analog pads, deep bass, and seamless loop.

export interface TrackInfo {
  id: string;
  name: string;
  genre: string;
  url: string;
}

// Streaming URLs for Radio Mix FM 106.3 São Paulo
export const RADIO_MIX_FM_STREAM_URL = 'https://playerservices.streamtheworld.com/api/livestream-redirect/MIXFM_SPAAC.aac';
export const RADIO_MIX_FM_BACKUP_STREAM_URL = 'https://streaming.radios.com.br:8004/mixfm_sp';
export const RADIO_MIX_OFFICIAL_LIVE_URL = 'https://aovivo.radiomixfm.com.br/';

export interface RadioState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
}

class RadioMixAudioEngine {
  private htmlAudio: HTMLAudioElement | null = null;
  private isPlayingState: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.9;
  private listeners: ((state: RadioState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio(): HTMLAudioElement {
    if (!this.htmlAudio && typeof window !== 'undefined') {
      const audio = new Audio();
      audio.id = 'radio-mix-live-audio';
      audio.src = RADIO_MIX_FM_STREAM_URL;
      audio.preload = 'none';
      audio.crossOrigin = 'anonymous';
      audio.setAttribute('playsinline', 'true');
      audio.volume = this.volume;
      audio.muted = this.isMuted;

      audio.addEventListener('play', () => {
        this.isPlayingState = true;
        this.notify();
      });

      audio.addEventListener('pause', () => {
        this.isPlayingState = false;
        this.notify();
      });

      audio.addEventListener('playing', () => {
        this.isPlayingState = true;
        this.notify();
      });

      audio.addEventListener('error', () => {
        console.warn('Primary stream error, switching to backup stream...');
        if (audio.src === RADIO_MIX_FM_STREAM_URL) {
          audio.src = RADIO_MIX_FM_BACKUP_STREAM_URL;
          audio.load();
          if (this.isPlayingState) {
            audio.play().catch(() => {});
          }
        }
      });

      this.htmlAudio = audio;
    }
    return this.htmlAudio!;
  }

  public subscribe(cb: (state: RadioState) => void) {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch {
        // ignore
      }
    });
  }

  public getState(): RadioState {
    return {
      isPlaying: this.isPlayingState,
      isMuted: this.isMuted,
      volume: this.volume,
    };
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public isMutedState(): boolean {
    return this.isMuted;
  }

  public async play(): Promise<boolean> {
    const audio = this.initAudio();
    audio.muted = this.isMuted;
    audio.volume = this.isMuted ? 0 : this.volume;
    try {
      await audio.play();
      this.isPlayingState = true;
      this.notify();
      return true;
    } catch {
      try {
        audio.muted = false;
        await audio.play();
        this.isPlayingState = true;
        this.notify();
        return true;
      } catch (err) {
        console.warn('Radio stream playback prevented:', err);
        this.isPlayingState = false;
        this.notify();
        return false;
      }
    }
  }

  public pause() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    this.isPlayingState = false;
    this.notify();
  }

  public toggle() {
    if (this.isPlayingState) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.htmlAudio) {
      this.htmlAudio.muted = muted;
    }
    this.notify();
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.volume;
    }
    this.notify();
  }
}

export const globalAudioEngine = new RadioMixAudioEngine();


