import React, { useEffect, useState } from 'react';
import {
  LogIn,
  Activity,
  Cpu,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import claroLogoImg from '../assets/images/claro_splash_logo_1787398577283.jpg';
import { FuturisticVideoBackground } from './FuturisticVideoBackground';
import { globalAudioEngine } from '../utils/audioPlayer';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  // Subscribe to audio engine state & auto-play on load
  useEffect(() => {
    const unsubscribe = globalAudioEngine.subscribe((playing) => {
      setIsPlaying(playing);
    });

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    // Start playback immediately of the official 05.mp3 track
    globalAudioEngine.setVolume(volume);
    globalAudioEngine.play('claro-official-05').then((played) => {
      setIsPlaying(played);
    }).catch(() => {
      setIsPlaying(false);
    });

    // Gesture listeners for any touch/click/scroll unlocking on mobile browsers
    const forcePlayOnGesture = () => {
      if (!globalAudioEngine.isPlaying()) {
        globalAudioEngine.play('claro-official-05').then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    };

    const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'scroll'];
    events.forEach((evt) => {
      window.addEventListener(evt, forcePlayOnGesture, { capture: true, passive: true });
      document.addEventListener(evt, forcePlayOnGesture, { capture: true, passive: true });
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
      events.forEach((evt) => {
        window.removeEventListener(evt, forcePlayOnGesture, { capture: true });
        document.removeEventListener(evt, forcePlayOnGesture, { capture: true });
      });
    };
  }, []);

  // Volume sync
  useEffect(() => {
    globalAudioEngine.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  const togglePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPlaying) {
      globalAudioEngine.pause();
    } else {
      globalAudioEngine.play('claro-official-05');
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleEnter = () => {
    globalAudioEngine.fadeOutAndStop(350);
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 380);
  };

  return (
    <div
      id="splash-screen-container"
      onClick={() => {
        if (!isPlaying) {
          globalAudioEngine.play('claro-official-05');
        }
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-4 select-none overflow-hidden transition-all duration-400 bg-[#060002] ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Futuristic Animated Business Canvas Background */}
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
          <span>SISTEMA ONLINE</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-red-400" />
          <span>ÁUDIO OFICIAL TIETÊ PLAZA</span>
        </div>
      </div>

      {/* Top Floating Music Bar: Clean Single Pill Control */}
      <div className="absolute top-3 sm:top-5 right-3 sm:right-5 z-30 flex items-center gap-2">
        <button
          type="button"
          id="btn-splash-toggle-music"
          onClick={togglePlayPause}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full backdrop-blur-xl text-white text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95 group border ${
            isPlaying
              ? 'bg-red-600/85 border-red-400 shadow-[0_0_20px_rgba(234,29,44,0.4)]'
              : 'bg-black/70 border-white/20 hover:bg-black/90'
          }`}
          title={isPlaying ? 'Pausar música' : 'Tocar música'}
        >
          {isPlaying ? (
            <>
              {/* Equalizer bars */}
              <div className="flex items-end gap-0.5 h-3.5 w-3.5">
                <span className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.1s] h-full" />
                <span className="w-1 bg-red-200 rounded-full animate-[bounce_0.8s_infinite_ease-in-out_0.3s] h-3/4" />
                <span className="w-1 bg-white rounded-full animate-[bounce_0.5s_infinite_ease-in-out_0.2s] h-4/5" />
              </div>
              <span className="font-mono text-[11px] sm:text-xs text-white">
                Música Ativa
              </span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />
              <span className="font-mono text-[11px] sm:text-xs text-white">Tocar Música</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="btn-splash-toggle-mute"
          onClick={toggleMute}
          className="p-2 rounded-full backdrop-blur-xl bg-black/70 text-white/80 border border-white/20 hover:bg-black/90 transition-all cursor-pointer"
          title={isMuted ? 'Desmutar som' : 'Silenciar som'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Holographic Business Card */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full text-center px-2 sm:px-4">
        <div
          className={`w-full relative p-5 sm:p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-red-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(234,29,44,0.2)] transition-all duration-700 transform ${
            isLoaded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
        >
          {/* Cyber Corner Marks */}
          <div className="absolute top-2.5 left-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">┌ [SYS.01]</div>
          <div className="absolute top-2.5 right-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">[LIVE] ┐</div>
          <div className="absolute bottom-2.5 left-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">└</div>
          <div className="absolute bottom-2.5 right-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">┘</div>

          {/* Logo Claro */}
          <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6 group">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            
            <img
              src={claroLogoImg}
              alt="Claro"
              referrerPolicy="no-referrer"
              className="relative w-56 sm:w-80 md:w-96 h-auto object-contain rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.6)] border border-white/20"
            />
          </div>

          {/* Titles */}
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
              Toque em ENTRAR para acessar o dashboard
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
