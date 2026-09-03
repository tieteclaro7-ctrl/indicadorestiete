import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Radio,
  ArrowRight,
} from 'lucide-react';
import {
  isRunningStandalone,
  isIosDevice,
  subscribeInstallPrompt,
  promptInstallApp,
} from '../pwaRegistration';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const isIos = isIosDevice();

  // Detect OS to default tab
  const getInitialDevice = (): 'android' | 'ios' | 'desktop' => {
    if (isIos) return 'ios';
    if (typeof window !== 'undefined' && /android/i.test(navigator.userAgent)) {
      return 'android';
    }
    return 'desktop';
  };

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(getInitialDevice());
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    setIsStandalone(isRunningStandalone());
    const unsub = subscribeInstallPrompt((canInstall) => {
      setCanPromptInstall(canInstall);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const outcome = await promptInstallApp();
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div
      id="app-download-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="app-download-modal-card"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 text-slate-800 my-auto overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Claro Brand Styling */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-red-600 flex items-center justify-center shadow-md shrink-0">
              <Download className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-red-950/40 border border-white/20 uppercase font-semibold">
                  App PWA Oficial
                </span>
                <span className="text-[10px] font-mono text-red-200">v2.5</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight mt-0.5">
                Baixar Aplicativo da Loja
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Shopping Tietê Plaza • Indicadores de Vendas
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* If already running in standalone mode */}
          {isStandalone && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Você já está executando o aplicativo instalado neste dispositivo!</span>
            </div>
          )}

          {/* If install prompt is ready (Chrome / Android / Edge) */}
          {canPromptInstall && !installSuccess && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-red-950">Instalação Direta Disponível</h4>
                  <p className="text-[11px] text-red-700">Seu navegador permite instalar com 1 toque</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-direct-install-modal"
                onClick={handleDirectInstall}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora</span>
              </button>
            </div>
          )}

          {installSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Aplicativo adicionado à tela inicial com sucesso!</span>
            </div>
          )}

          {/* Device Tabs Selector */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Selecione o seu dispositivo para ver o passo a passo:
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span>iPhone (iOS)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5 shrink-0" />
                <span>Computador</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Android */}
          {activeTab === 'android' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-1 border-b border-slate-200">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Instalar no celular Android (Chrome ou Samsung Internet)</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p>
                  Abra o painel no <strong>Google Chrome</strong> e toque no menu de <strong>3 pontos verticais (⋮)</strong> no canto superior direito.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p>
                  Selecione a opção <strong className="text-slate-900">"Instalar aplicativo"</strong> ou <strong className="text-slate-900">"Adicionar à tela inicial"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p>
                  Confirme em <strong className="text-red-700">"Instalar"</strong>. O ícone oficial da Claro Tietê ficará disponível junto aos seus apps normais!
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: iPhone (iOS) */}
          {activeTab === 'ios' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-1 border-b border-slate-200">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Instalar no iPhone ou iPad (Safari)</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p>
                  No Safari, toque no botão <strong className="text-slate-900 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-blue-600 inline" /> Compartilhar</strong> na barra inferior.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p>
                  Role as opções e toque em <strong className="text-slate-900 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-slate-800 inline" /> Adicionar à Tela de Início</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p>
                  Toque em <strong className="text-red-700">Adicionar</strong> no canto superior direito. O app abrirá em tela cheia sem a barra do Safari!
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-1 border-b border-slate-200">
                <Laptop className="w-4 h-4 text-purple-600" />
                <span>Instalar no Computador (Windows / Mac)</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p>
                  No <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>, olhe para a <strong>barra de endereços</strong> no topo direito (ao lado da estrela de favoritos).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p>
                  Clique no ícone de <strong className="text-slate-900">computador com seta para baixo (Instalar)</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p>
                  Ou clique no menu de <strong>3 pontos (⋮)</strong> &gt; <strong>"Salvar e compartilhar"</strong> &gt; <strong>"Instalar VENDAS Tietê Plaza"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Features Vantagens */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sincronização 100% segura</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <Radio className="w-4 h-4 text-red-600 shrink-0" />
              <span>Rádio Mix FM ao vivo integrada</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-mono">
            Loja Claro Shopping Tietê Plaza
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
