import React, { useEffect, useState } from 'react';
import {
  LogIn,
  Activity,
  Radio,
  Sparkles,
} from 'lucide-react';
import claroLogoImg from '../assets/images/claro_splash_logo_1787398577283.jpg';
import { FuturisticVideoBackground } from './FuturisticVideoBackground';
import { globalAudioEngine } from '../utils/audioPlayer';
import {
  hasNativeInstallPrompt,
  promptInstallApp,
  isIosDevice,
} from '../pwaRegistration';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [showNonIosNotice, setShowNonIosNotice] = useState<boolean>(false);

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

  // Install app click trigger
  const handleInstallClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // Se estiver no iPhone/iOS, exibe modal discreto específico
    if (isIosDevice()) {
      setShowIosModal(true);
      return;
    }

    // Se estiver no Android, PC (Chrome, Edge) com evento nativo capturado
    if (hasNativeInstallPrompt()) {
      await promptInstallApp();
      return;
    }

    // Se o evento nativo ainda não foi emitido ou navegador requer menu nativo
    setShowNonIosNotice(true);
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

          {/* Action Button: ENTRAR + INSTALAR APP */}
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

            {/* Botão Adicional Obrigatório: 📲 INSTALAR APP (permanece fixo e visível na primeira tela) */}
            <button
              type="button"
              id="btn-splash-instalar-app"
              onClick={handleInstallClick}
              onTouchEnd={handleInstallClick}
              className="group relative w-full sm:w-72 mt-3.5 py-3.5 px-6 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm sm:text-base rounded-2xl border-2 border-red-400/80 shadow-[0_10px_25px_rgba(234,29,44,0.4),0_0_20px_rgba(234,29,44,0.3)] hover:shadow-[0_15px_35px_rgba(234,29,44,0.6)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer z-30"
            >
              <span className="text-lg sm:text-xl">📲</span>
              <span className="tracking-wider uppercase font-black text-sm sm:text-base text-white drop-shadow">INSTALAR APP</span>
            </button>

            <p className="text-white/60 text-[11px] font-mono mt-3 flex items-center gap-1.5 text-center">
              <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Clique em ENTRAR para iniciar o painel de registro de indicadores da loja.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal Discreto: iPhone / iOS */}
      {showIosModal && (
        <div
          id="ios-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="relative w-full max-w-xs p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-red-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(234,29,44,0.3)] text-center text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-2xl">
              📲
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-black text-white">
                Para instalar no iPhone:
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Toque em <span className="text-red-400 font-bold">Compartilhar</span> e depois em{' '}
                <span className="text-white font-bold">Adicionar à Tela de Início</span>.
              </p>
            </div>

            <button
              type="button"
              id="btn-fechar-modal-ios"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-white/20"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      {/* Modal Discreto: Caso evento nativo não esteja pronto no navegador */}
      {showNonIosNotice && (
        <div
          id="non-ios-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowNonIosNotice(false)}
        >
          <div
            className="relative w-full max-w-xs p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-red-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(234,29,44,0.3)] text-center text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center mx-auto text-2xl">
              📲
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-black text-white">
                Instalar Aplicativo
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Abra o menu do navegador (<span className="text-white font-bold">⋮</span>) e selecione{' '}
                <span className="text-red-400 font-bold">"Instalar aplicativo"</span> ou{' '}
                <span className="text-white font-bold">"Adicionar à tela inicial"</span>.
              </p>
            </div>

            <button
              type="button"
              id="btn-fechar-modal-notice"
              onClick={() => setShowNonIosNotice(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-white/20"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      {/* Corporate Footer on Splash */}
      <div className="text-center text-white/50 text-[10px] sm:text-[11px] font-mono tracking-wider z-20 pb-2 sm:pb-0 sm:absolute sm:bottom-3">
        CLARO BRASIL • SHOPPING TIETÊ PLAZA • SISTEMA INTERNO
      </div>
    </div>
  );
};
