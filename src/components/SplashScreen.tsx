import React, { useEffect, useState } from 'react';
import {
  LogIn,
  Activity,
  Radio,
  Sparkles,
  Download,
} from 'lucide-react';
import claroLogoImg from '../assets/images/claro_splash_logo_1787398577283.jpg';
import { FuturisticVideoBackground } from './FuturisticVideoBackground';
import { globalAudioEngine } from '../utils/audioPlayer';
import { AppDownloadModal } from './AppDownloadModal';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 60);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Enter trigger: start Radio Mix FM streaming & transition smoothly into Dashboard
  const handleEnter = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    // Auto-start Radio Mix FM stream immediately upon user gesture
    globalAudioEngine.play();

    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 350);
  };

  return (
    <div
      id="splash-screen-container"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between sm:justify-center p-4 sm:p-6 select-none overflow-y-auto overflow-x-hidden transition-all duration-400 bg-[#060002] ${
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
          <Radio className="w-3.5 h-3.5 text-red-400" />
          <span>RÁDIO MIX FM 106.3 • SÃO PAULO</span>
        </div>
      </div>

      {/* Main Holographic Business Card */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full text-center my-auto px-2 sm:px-4">
        <div
          className={`w-full relative p-6 sm:p-9 rounded-3xl bg-black/55 backdrop-blur-2xl border border-red-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(234,29,44,0.25)] transition-all duration-700 transform ${
            isLoaded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-6'
          }`}
        >
          {/* Cyber Corner Marks */}
          <div className="absolute top-3 left-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">┌ [SYS.01]</div>
          <div className="absolute top-3 right-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">[5G+ LIVE] ┐</div>
          <div className="absolute bottom-3 left-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">└</div>
          <div className="absolute bottom-3 right-3 text-red-500/40 font-mono text-[10px] sm:text-xs select-none">┘</div>

          {/* Logo Claro */}
          <div className="relative inline-flex items-center justify-center mb-5 sm:mb-6 group">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            
            <img
              src={claroLogoImg}
              alt="Claro"
              referrerPolicy="no-referrer"
              className="relative w-48 sm:w-72 md:w-80 max-h-44 object-contain rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.6)] border border-white/20"
            />
          </div>

          {/* Titles */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight">
              Bem-vindo à Loja Claro
            </h2>
            <p className="text-base sm:text-xl font-bold text-red-400 tracking-wide mt-1 drop-shadow-md">
              Shopping Tietê Plaza
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/70 border border-red-500/40 text-red-200 text-[10px] sm:text-xs font-bold tracking-wider mt-3 sm:mt-4 backdrop-blur-md shadow-[0_0_15px_rgba(234,29,44,0.3)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono">SISTEMA DE INDICADORES DE VENDAS</span>
            </div>
          </div>

          {/* Action Buttons: ENTRAR & BAIXAR O APP */}
          <div className="mt-6 sm:mt-8 w-full flex flex-col items-center">
            <button
              type="button"
              id="btn-splash-entrar"
              onClick={handleEnter}
              onTouchEnd={handleEnter}
              className="group relative w-full sm:w-72 py-4 px-8 bg-gradient-to-r from-white via-slate-100 to-white hover:from-white hover:to-slate-200 text-red-600 hover:text-red-700 font-black text-lg sm:text-xl rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_30px_rgba(234,29,44,0.4)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_40px_rgba(234,29,44,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer border border-white"
            >
              <span className="tracking-wider">ENTRAR</span>
              <LogIn className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-2 text-red-600" />
            </button>

            {/* Botão Baixar o App (Embaixo do botão ENTRAR) */}
            <button
              type="button"
              id="btn-splash-download-app"
              onClick={(e) => {
                e.stopPropagation();
                setIsDownloadModalOpen(true);
              }}
              className="group relative w-full sm:w-72 mt-3 py-3 px-6 bg-red-950/70 hover:bg-red-900/90 active:bg-red-950 text-white font-extrabold text-sm sm:text-base rounded-2xl border border-red-500/50 hover:border-red-400 shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(234,29,44,0.25)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(234,29,44,0.45)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer backdrop-blur-md"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 group-hover:scale-110 transition-transform stroke-[2.5]" />
              <span className="tracking-wide">BAIXAR O APP</span>
            </button>

            <p className="text-white/60 text-[11px] font-mono mt-3 flex items-center gap-1.5 text-center">
              <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Clique em ENTRAR para iniciar ou baixe o app no seu dispositivo.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Corporate Footer on Splash */}
      <div className="text-center text-white/50 text-[10px] sm:text-[11px] font-mono tracking-wider z-20 pb-2 sm:pb-0 sm:absolute sm:bottom-3">
        CLARO BRASIL • SHOPPING TIETÊ PLAZA • SISTEMA INTERNO
      </div>

      {/* Modal para Baixar / Instalar App */}
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
