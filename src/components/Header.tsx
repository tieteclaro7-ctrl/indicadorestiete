import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardPen,
  Users,
  Target,
  TrendingUp,
  BrainCircuit,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Radio
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { formatMonthLabel } from '../utils/calculations';
import { ViewTab } from '../types';
import { globalAudioEngine } from '../utils/audioPlayer';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, selectedDate, setSelectedDate, toast } = useSales();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const unsub = globalAudioEngine.subscribe((playing) => {
      setIsPlaying(playing);
      setIsMuted(globalAudioEngine.isMutedState());
    });
    return () => unsub();
  }, []);

  const toggleMusic = () => {
    if (isPlaying) {
      globalAudioEngine.pause();
    } else {
      globalAudioEngine.setMuted(false);
      globalAudioEngine.play();
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    globalAudioEngine.setMuted(next);
  };

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-entry', label: 'Lançamento Diário', icon: ClipboardPen },
    { id: 'seller-view', label: 'Por Vendedor', icon: Users },
    { id: 'indicator-view', label: 'Por Indicador', icon: Target },
    { id: 'monthly-evolution', label: 'Evolução Mensal', icon: TrendingUp },
    { id: 'ai-projection', label: 'Análise IA', icon: BrainCircuit },
    { id: 'reports', label: 'Relatórios & PDF', icon: FileText },
  ];

  return (
    <header id="main-header" className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-xs">
      {/* Top red header bar */}
      <div className="bg-red-600 text-white px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-black text-base sm:text-lg shadow-sm shrink-0">
              C
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-extrabold tracking-tight leading-tight uppercase truncate">
                Dashboard de Vendas — CLARO Tietê Plaza
              </h1>
              <p className="text-[11px] sm:text-xs text-red-100 font-medium truncate">
                Controle Diário de Indicadores • LOJA CLARO Shopping Tietê Plaza
              </p>
            </div>
          </div>

          {/* Quick Controls: Audio + Date */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* Premium Ambient Soundtrack Control Button */}
            <div className="flex items-center gap-1 bg-red-800/80 px-2 sm:px-2.5 py-1 rounded-lg border border-red-400/40">
              <button
                type="button"
                id="btn-header-toggle-music"
                onClick={toggleMusic}
                className="flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-red-100 cursor-pointer"
                title={isPlaying ? 'Pausar Trilha Sonora Ambient' : 'Tocar Trilha Sonora Ambient Techno'}
              >
                {isPlaying && !isMuted ? (
                  <>
                    <div className="flex items-end gap-0.5 h-3 w-3">
                      <span className="w-0.5 bg-emerald-300 rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.1s] h-full" />
                      <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_infinite_ease-in-out_0.3s] h-3/4" />
                      <span className="w-0.5 bg-emerald-300 rounded-full animate-[bounce_0.5s_infinite_ease-in-out_0.2s] h-4/5" />
                    </div>
                    <span className="font-mono text-[10px] sm:text-[11px]">Trilha Sonora</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-red-200 fill-red-200" />
                    <span className="font-mono text-[10px] sm:text-[11px]">Tocar Som</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-header-toggle-mute"
                onClick={toggleMute}
                className="p-0.5 rounded text-white/80 hover:text-white cursor-pointer ml-1"
                title={isMuted ? 'Desmutar som' : 'Mutar som'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-300" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-red-700/80 px-2.5 sm:px-3 py-1 rounded-lg border border-red-500/50 text-[11px] sm:text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-red-200 shrink-0" />
              <span className="hidden xs:inline">Data:</span>
              <input
                id="header-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-red-800 text-white px-1.5 sm:px-2 py-0.5 rounded text-[11px] sm:text-xs font-bold outline-hidden border border-red-400 cursor-pointer"
              />
            </div>
            <span className="hidden md:inline-flex items-center px-2 py-1 rounded bg-red-800/60 text-red-100 text-xs font-medium">
              Mês: {formatMonthLabel(selectedDate.substring(0, 7))}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <nav
          id="header-nav-tabs"
          className="flex space-x-1.5 overflow-x-auto py-2 no-scrollbar touch-pan-x"
          aria-label="Tabs"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-red-600' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          id="system-toast-notification"
          className="fixed bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-[90vw]"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-red-50 border-red-700'
                : 'bg-zinc-900 text-zinc-50 border-zinc-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </header>
  );
};
