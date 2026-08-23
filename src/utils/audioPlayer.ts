// Premium Corporate Tech Audio Engine for Loja Claro Shopping Tietê Plaza
// Genre: Ambient Techno / Deep House / Soft Cyberpunk (122 BPM)
// Pure high-fidelity royalty-free instrumental stream with warm analog pads, deep bass, and seamless loop.

export interface TrackInfo {
  id: string;
  name: string;
  genre: string;
  url: string;
}

// Stable, high-speed public CDN audio streams (Royalty-free / Creative Commons)
export const PRIMARY_AMBIENT_TECH_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';

export const AUDIO_PLAYLIST: TrackInfo[] = [
  {
    id: 'ambient-cyber-tech',
    name: 'Ambient Techno & Deep Tech Lounge • Claro 5G Tietê Plaza',
    genre: 'Ambient Techno / Soft Cyberpunk (122 BPM)',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
  {
    id: 'deep-house-corporate',
    name: 'Deep Melodic House & Tech Horizon • Claro Enterprise',
    genre: 'Deep House / Progressive Tech',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'edm-tech-detection',
    name: 'EDM Tech Detection • Kevin MacLeod (Royalty-Free)',
    genre: 'Corporate Electronic / Synthwave',
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/EDM%20Detection%20Mode.mp3',
  },
  {
    id: 'claro-local-master',
    name: 'Master Analog Synthwave Loop (Local Backup)',
    genre: 'Soft Cyberpunk (122 BPM)',
    url: '/ambient_techno.wav',
  },
];

class AudioEngine {
  private htmlAudio: HTMLAudioElement | null = null;
  private currentTrackUrl: string = PRIMARY_AMBIENT_TECH_URL;
  private volume: number = 0.95;
  private isMuted: boolean = false;
  private onStateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];

  public subscribe(cb: (isPlaying: boolean) => void) {
    this.onStateChangeCallbacks.push(cb);
    cb(this.isPlaying());
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    const playing = this.isPlaying();
    this.onStateChangeCallbacks.forEach((cb) => {
      try {
        cb(playing);
      } catch {
        // ignore callback errors
      }
    });
  }

  /**
   * Configures and returns the HTMLAudioElement pointing directly to the stable royalty-free music link.
   */
  public getAudio(): HTMLAudioElement {
    if (!this.htmlAudio) {
      const existingDomAudio =
        typeof document !== 'undefined'
          ? (document.getElementById('global-bg-audio') as HTMLAudioElement | null)
          : null;

      const audio = existingDomAudio || new Audio();

      // Configure direct CDN stream URL
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        audio.src = this.currentTrackUrl;
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
      audio.addEventListener('ended', () => {
        // Guarantee continuous seamless playback on loop boundary
        audio.currentTime = 0;
        audio.play().catch(() => {});
        this.notify();
      });
      audio.addEventListener('volumechange', () => this.notify());

      // Graceful CDN fallback to local master if offline or blocked
      audio.addEventListener('error', () => {
        if (audio.src !== window.location.origin + '/ambient_techno.wav' && audio.src !== '/ambient_techno.wav') {
          console.warn('CDN stream unavailable, switching to local backup audio...');
          audio.src = '/ambient_techno.wav';
          audio.load();
          audio.play().catch(() => {});
        }
      });
    }
    return this.htmlAudio;
  }

  /**
   * Triggered exclusively upon user interaction (clicking ENTRAR).
   * Fully satisfies browser user-gesture requirements.
   */
  public async playOnEnterGesture(): Promise<boolean> {
    const audio = this.getAudio();
    audio.muted = this.isMuted;
    audio.volume = this.isMuted ? 0 : this.volume;

    try {
      await audio.play();
      this.notify();
      return true;
    } catch {
      try {
        audio.muted = false;
        await audio.play();
        this.notify();
        return true;
      } catch (err) {
        console.warn('Audio play prevented:', err);
        this.notify();
        return false;
      }
    }
  }

  public setTrack(url: string) {
    this.currentTrackUrl = url;
    const wasPlaying = this.isPlaying();
    const audio = this.getAudio();
    audio.src = url;
    audio.load();
    if (wasPlaying) {
      audio.play().catch(() => {});
    }
    this.notify();
  }

  public getCurrentTrack(): string {
    return this.currentTrackUrl;
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
    return this.playOnEnterGesture();
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

  public toggle() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.setMuted(false);
      this.play();
    }
  }
}

export const globalAudioEngine = new AudioEngine();
