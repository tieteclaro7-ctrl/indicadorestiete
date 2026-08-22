import React, { useEffect, useState, useRef } from 'react';
import {
  LogIn,
  Volume2,
  VolumeX,
  Music,
  Activity,
  Cpu,
  Sparkles,
  Upload,
  Play,
  Pause,
  SkipForward,
  Sliders,
  Radio,
} from 'lucide-react';
import claroLogoImg from '../assets/images/claro_splash_logo_1787398577283.jpg';
import { FuturisticVideoBackground } from './FuturisticVideoBackground';

interface SplashScreenProps {
  onEnter: () => void;
}

export interface AudioTrack {
  id: string;
  name: string;
  genre: string;
  url: string;
  durationHint: string;
}

export const REAL_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'edm-energy',
    name: 'Festival EDM & Brazilian House',
    genre: 'Eletrônica Pesada / Rave Studio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    durationHint: 'Studio Mix',
  },
  {
    id: 'commercial-dance',
    name: 'Top Hit Dance & Club Vibes',
    genre: 'House Comercial / Vendas Top',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    durationHint: 'Energia Alta',
  },
  {
    id: 'club-party',
    name: 'Euro Dance & Electro Beat',
    genre: 'Batida Eletrizante',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    durationHint: 'Peak Time',
  },
  {
    id: 'synth-groove',
    name: 'Future Bass & Synthwave',
    genre: 'Groove & Bateria Real',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    durationHint: 'Moderna',
  },
  {
    id: 'deep-drive',
    name: 'Deep Tech & Acid Bass Drive',
    genre: 'Techno / Underground Hit',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
    durationHint: 'Pesado',
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [customTrack, setCustomTrack] = useState<{ name: string; url: string } | null>(null);
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active track info
  const currentTrack = customTrack || REAL_AUDIO_TRACKS[selectedTrackIndex];

  // Initialize and play audio
  useEffect(() => {
    // Entrance visual effect
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 60);

    const audio = new Audio();
    audio.src = currentTrack.url;
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const playAudio = async () => {
      try {
        setAudioError(false);
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Browsers block autoplay until user interaction
        setIsPlaying(false);
      }
    };

    playAudio();

    // User gesture unlocking: touch, click, pointer
    const handleFirstGesture = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('click', handleFirstGesture, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentTrack.url]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAudioError(false);
      }).catch(() => {
        setAudioError(true);
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleNextTrack = () => {
    if (customTrack) {
      setCustomTrack(null);
      setSelectedTrackIndex(0);
    } else {
      setSelectedTrackIndex((prev) => (prev + 1) % REAL_AUDIO_TRACKS.length);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setCustomTrack({
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: blobUrl,
      });
      setIsPlaying(true);
      setShowMusicSettings(false);
    }
  };

  const handleEnter = () => {
    // Smooth audio fade out
    if (audioRef.current) {
      const currentVol = audioRef.current.volume;
      let fadeStep = currentVol;
      const fadeInterval = setInterval(() => {
        fadeStep -= 0.15;
        if (fadeStep <= 0.05 && audioRef.current) {
          audioRef.current.pause();
          clearInterval(fadeInterval);
        } else if (audioRef.current) {
          audioRef.current.volume = Math.max(0, fadeStep);
        }
      }, 50);
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
        if (audioRef.current && audioRef.current.paused && isPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-4 select-none overflow-hidden transition-all duration-400 bg-[#060002] ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Futuristic Animated Business Video / Canvas Background */}
      <FuturisticVideoBackground />

      {/* 2. Cyber Telemetry Corner HUD Elements (Desktop) */}
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
          <span>MÚSICA REAL EM ALTA DEFINIÇÃO</span>
        </div>
      </div>

      {/* Top Floating Music Bar & Controls */}
      <div className="absolute top-3 sm:top-5 right-3 sm:right-5 z-30 flex items-center gap-2">
        {/* Play/Pause & Equalizer Pill */}
        <button
          type="button"
          id="btn-splash-toggle-music"
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl text-white text-xs font-bold border border-red-500/30 hover:border-red-400/60 transition-all cursor-pointer shadow-[0_4px_20px_rgba(234,29,44,0.25)] active:scale-95 group"
          title={isPlaying ? 'Pausar música' : 'Tocar música'}
        >
          {isPlaying ? (
            <>
              {/* Equalizer animation */}
              <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                <span className="w-1 bg-red-400 rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.1s] h-full" />
                <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_ease-in-out_0.3s] h-3/4" />
                <span className="w-1 bg-red-500 rounded-full animate-[bounce_0.5s_infinite_ease-in-out_0.2s] h-4/5" />
              </div>
              <span className="font-mono text-[11px] sm:text-xs text-white group-hover:text-red-300 transition-colors truncate max-w-[120px] sm:max-w-[180px]">
                {currentTrack.name}
              </span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span className="font-mono text-[11px] sm:text-xs text-white/80">Tocar Música</span>
            </>
          )}
        </button>

        {/* Music Options & Track Switcher Trigger */}
        <button
          type="button"
          id="btn-splash-music-settings"
          onClick={(e) => {
            e.stopPropagation();
            setShowMusicSettings(!showMusicSettings);
          }}
          className={`p-2 rounded-full backdrop-blur-xl transition-all cursor-pointer border ${
            showMusicSettings
              ? 'bg-red-600 text-white border-white shadow-md'
              : 'bg-black/60 text-white/80 border-red-500/30 hover:bg-black/80'
          }`}
          title="Escolher faixa de música ou enviar arquivo"
        >
          <Music className="w-4 h-4" />
        </button>
      </div>

      {/* Music Selection Modal/Drawer */}
      {showMusicSettings && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-3 sm:right-5 z-40 w-[92vw] sm:w-84 bg-zinc-950/95 backdrop-blur-2xl border border-red-500/40 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white space-y-3 animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-red-400">
              <Radio className="w-3.5 h-3.5" />
              <span>Trilhas Sonoras Reais</span>
            </div>
            <button
              onClick={() => setShowMusicSettings(false)}
              className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded-md hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
              <span>Volume: {Math.round((isMuted ? 0 : volume) * 100)}%</span>
              <button
                onClick={toggleMute}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{isMuted ? 'Desmutar' : 'Mudo'}</span>
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Track List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar pt-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Escolha uma Música:
            </p>
            {REAL_AUDIO_TRACKS.map((t, idx) => {
              const isSelected = !customTrack && selectedTrackIndex === idx;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setCustomTrack(null);
                    setSelectedTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white font-black shadow-md'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate font-bold">{t.name}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-red-100' : 'text-zinc-400'}`}>
                      {t.genre}
                    </p>
                  </div>
                  {isSelected && <span className="text-[10px] font-black shrink-0">TOCANDO</span>}
                </button>
              );
            })}
          </div>

          {/* Custom File Upload Option */}
          <div className="pt-2 border-t border-zinc-800">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleCustomFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-red-500/40 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Carregar Música do Celular / PC</span>
            </button>
            {customTrack && (
              <p className="text-[10px] text-emerald-400 font-medium mt-1 truncate text-center">
                ✓ Tocando personalizada: {customTrack.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Container - High Tech Holographic Business Card */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center px-2 sm:px-4">
        
        {/* Holographic Card Frame */}
        <div
          className={`w-full relative p-5 sm:p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-red-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(234,29,44,0.2)] transition-all duration-700 transform ${
            isLoaded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
        >
          {/* Cyber Decorative Corner Accents */}
          <div className="absolute top-2.5 left-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">┌ [SYS.01]</div>
          <div className="absolute top-2.5 right-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">[LIVE] ┐</div>
          <div className="absolute bottom-2.5 left-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">└</div>
          <div className="absolute bottom-2.5 right-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">┘</div>

          {/* Logo Claro with Neon Energy Aura */}
          <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6 group">
            {/* Ambient Red Glow behind logo */}
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            
            <img
              src={claroLogoImg}
              alt="Claro"
              referrerPolicy="no-referrer"
              className="relative w-56 sm:w-80 md:w-96 h-auto object-contain rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.6)] border border-white/20"
            />
          </div>

          {/* Corporate Store Titles */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Bem-vindo à Loja Claro
            </h2>
            <p className="text-lg sm:text-2xl font-bold text-red-400 tracking-wide mt-1 drop-shadow-md">
              Shopping Tietê Plaza
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-200 text-[11px] sm:text-xs font-bold tracking-wider mt-3 sm:mt-4 backdrop-blur-md shadow-[0_0_15px_rgba(234,29,44,0.3)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono">SISTEMA DE INDICADORES</span>
            </div>
          </div>

          {/* Action Button: ENTRAR */}
          <div className="mt-6 sm:mt-8 w-full flex flex-col items-center">
            <button
              id="btn-splash-entrar"
              onClick={handleEnter}
              className="group relative w-full sm:w-80 py-3.5 sm:py-4 px-6 sm:px-8 bg-gradient-to-r from-white via-slate-100 to-white hover:from-white hover:to-slate-200 text-red-600 hover:text-red-700 font-black text-lg sm:text-xl rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_30px_rgba(234,29,44,0.4)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_40px_rgba(234,29,44,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer border border-white"
            >
              <span className="tracking-wider">ENTRAR</span>
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-2 text-red-600" />
            </button>

            <p className="text-white/60 text-[11px] sm:text-xs font-mono mt-3 flex items-center gap-1.5">
              Toque em ENTRAR para abrir o dashboard
            </p>
          </div>
        </div>

      </div>

      {/* Corporate Footer on Splash */}
      <div className="absolute bottom-3 text-center text-white/50 text-[10px] sm:text-[11px] font-mono tracking-wider z-20">
        CLARO BRASIL • SHOPPING TIETÊ PLAZA • SISTEMA INTERNO
      </div>
    </div>
  );
};
