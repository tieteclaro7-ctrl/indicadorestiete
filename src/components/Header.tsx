import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardPen,
  Home,
  Users,
  Target,
  TrendingUp,
  BrainCircuit,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { formatMonthLabel } from '../utils/calculations';
import { ViewTab } from '../types';
import { globalAudioEngine, RadioState } from '../utils/audioPlayer';
import { PwaInstallButton } from './PwaInstallPrompt';

interface HeaderProps {
  onToggleRadio?: () => void;
  isRadioOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleRadio, isRadioOpen = false }) => {
  const {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    toast,
    syncStatus,
    lastSyncTime,
    manualSync,
  } = useSales();
  const [radioState, setRadioState] = useState<RadioState>(globalAudioEngine.getState());
  const activeTabRef = React.useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const unsub = globalAudioEngine.subscribe((state) => {
      setRadioState(state);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    globalAudioEngine.toggle();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    globalAudioEngine.toggleMute();
  };

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-entry', label: 'Lançamento Diário', icon: ClipboardPen },
    { id: 'residential-tracking', label: 'Acompanhamento Residencial', icon: Home },
    { id: 'seller-view', label: 'Por Vendedor', icon: Users },
    { id: 'indicator-view', label: 'Por Indicador', icon: Target },
    { id: 'monthly-evolution', label: 'Evolução Mensal', icon: TrendingUp },
    { id: 'ai-projection', label: 'Análise IA', icon: BrainCircuit },
    { id: 'reports', label: 'Relatórios & PDF', icon: FileText },
    { id: 'radio-mix', label: 'Rádio Mix FM', icon: Radio },
  ];

  return (
    <header id="main-header" className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-xs">
      {/* Top red header bar */}
      <div className="bg-red-600 text-white px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-black text-base sm:text-lg shadow-sm shrink-0">
              C
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-base lg:text-lg font-extrabold tracking-tight leading-tight uppercase truncate">
                Dashboard de Vendas — CLARO Tietê Plaza
              </h1>
              <p className="text-[10px] sm:text-xs text-red-100 font-medium truncate">
                Controle Diário de Indicadores • LOJA CLARO Shopping Tietê Plaza
              </p>
            </div>
          </div>

          {/* Quick Controls: Radio Mix Player + Date */}
          <div className="flex items-center gap-2 self-stretch sm:self-start lg:self-auto shrink-0 flex-wrap max-w-full">
            {/* RÁDIO MIX FM 106.3 SP LIVE HEADER BAR CONTROLLER */}
            <div
              id="header-radio-mix-controller"
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-xl border transition-all shadow-sm ${
                radioState.isPlaying && !radioState.isMuted
                  ? 'bg-zinc-950 text-white border-red-500/60 shadow-[0_0_15px_rgba(234,29,44,0.35)]'
                  : 'bg-red-800/90 text-white border-red-400/50'
              }`}
            >
              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                id="btn-radio-play-pause-header"
                onClick={handleTogglePlay}
                className={`p-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  radioState.isPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                    : 'bg-white text-red-600 hover:bg-red-50 shadow-sm'
                }`}
                title={radioState.isPlaying ? 'Pausar Rádio Mix FM' : 'Tocar Rádio Mix FM Ao Vivo'}
              >
                {radioState.isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              {/* Station Label & Live Waves */}
              <div
                className="flex items-center gap-1.5 cursor-pointer select-none"
                onClick={onToggleRadio}
                title="Clique para abrir controles detalhados"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[11px] sm:text-xs tracking-tight text-white uppercase leading-none">
                      Mix FM 106.3
                    </span>
                    <span className="bg-red-500 text-white text-[9px] font-black px-1 py-0.2 rounded-xs uppercase tracking-wider">
                      SP
                    </span>
                  </div>
                  <span className="text-[10px] text-red-200 font-medium leading-tight flex items-center gap-1">
                    {radioState.isPlaying ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span className="text-emerald-300 font-bold">Ao Vivo</span>
                      </>
                    ) : (
                      <span>Clique ▶ p/ Tocar</span>
                    )}
                  </span>
                </div>

                {/* Animated Equalizer Waveform */}
                {radioState.isPlaying && !radioState.isMuted && (
                  <div className="flex items-end gap-0.5 h-3.5 w-3.5 ml-1">
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_ease-in-out_0.1s] h-full" />
                    <span className="w-0.5 bg-red-400 rounded-full animate-[bounce_0.8s_infinite_ease-in-out_0.3s] h-3/4" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.5s_infinite_ease-in-out_0.2s] h-4/5" />
                  </div>
                )}
              </div>

              {/* Mute Button */}
              <button
                type="button"
                id="btn-radio-mute-header"
                onClick={handleToggleMute}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
                title={radioState.isMuted ? 'Desmutar rádio' : 'Mutar rádio'}
              >
                {radioState.isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-300" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                )}
              </button>

              {/* Expand / Popup Button */}
              {onToggleRadio && (
                <button
                  type="button"
                  id="btn-radio-expand-header"
                  onClick={onToggleRadio}
                  className={`p-1 rounded-md transition-colors cursor-pointer ml-0.5 ${
                    isRadioOpen
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title="Abrir player visual completo"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* PWA Install Button (Exibido apenas quando não estiver instalado) */}
            <PwaInstallButton />

            {/* Cross-device Cloud Sync Status Badge */}
            <button
              type="button"
              id="header-sync-status-btn"
              onClick={manualSync}
              title={`Status de sincronização com o servidor.\nÚltima sincronização: ${lastSyncTime}\nClique para sincronizar agora.`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-800/90 hover:bg-red-900 border border-red-400/50 text-[10px] sm:text-xs font-bold text-white transition-all cursor-pointer shadow-xs"
            >
              {syncStatus === 'synced' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="tracking-wide">🟢 SINCRONIZADO</span>
                  <span className="hidden xl:inline text-red-200 text-[10px] font-normal">({lastSyncTime})</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-300 animate-spin shrink-0" />
                  <span className="tracking-wide text-amber-200">SINCRONIZANDO...</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-300 shrink-0" />
                  <span className="tracking-wide text-red-100">🔴 SEM CONEXÃO</span>
                </>
              )}
            </button>

            {/* Date Input */}
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
      <div className="max-w-7xl mx-auto px-2 sm:px-6 w-full max-w-full overflow-hidden">
        <nav
          id="header-nav-tabs"
          className="flex space-x-1.5 overflow-x-auto py-2 scroll-smooth no-scrollbar touch-pan-x w-full max-w-full"
          aria-label="Tabs"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={isActive ? activeTabRef : undefined}
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

