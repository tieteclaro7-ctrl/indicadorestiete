import React, { useEffect, useState } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import {
  isRunningStandalone,
  isIosDevice,
  subscribeInstallPrompt,
  promptInstallApp,
} from '../pwaRegistration';

export const PwaInstallButton: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState(true);
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const isIos = isIosDevice();

  useEffect(() => {
    setIsStandalone(isRunningStandalone());

    const unsubscribe = subscribeInstallPrompt((canInstall) => {
      setCanPromptInstall(canInstall);
    });

    return () => unsubscribe();
  }, []);

  // Se já está instalado e rodando como app standalone, não exibe botão de instalação
  if (isStandalone) {
    return null;
  }

  // Se não é instalável no navegador atual (e não é iOS), oculta para não poluir
  if (!canPromptInstall && !isIos) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (canPromptInstall) {
      const outcome = await promptInstallApp();
      if (outcome === 'accepted') {
        setCanPromptInstall(false);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        id="btn-pwa-install-header"
        onClick={handleInstallClick}
        title="Instalar aplicativo na tela inicial do celular ou computador"
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-white text-red-600 hover:bg-red-50 border border-white/60 text-[10px] sm:text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 animate-pulse hover:animate-none"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">App</span>
      </button>

      {/* Modal explicativo específico para iPhone (iOS) */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Instalar no iPhone
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    VENDAS Tietê Plaza
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para instalar este Dashboard como aplicativo no seu iPhone sem barra de endereços:
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p>
                  Toque no botão <strong className="text-slate-900 inline-flex items-center gap-1 font-bold"><Share className="w-3.5 h-3.5 text-blue-600 inline" /> Compartilhar</strong> na barra inferior do Safari.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p>
                  Role para baixo e selecione <strong className="text-slate-900 inline-flex items-center gap-1 font-bold"><PlusSquare className="w-3.5 h-3.5 text-slate-800 inline" /> Adicionar à Tela de Início</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p>
                  Toque em <strong className="text-slate-900 font-bold">Adicionar</strong> no canto superior direito. Pronto!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
