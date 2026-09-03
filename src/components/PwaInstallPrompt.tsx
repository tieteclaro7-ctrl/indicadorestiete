import React, { useEffect, useState } from 'react';
import {
  Share,
  PlusSquare,
  X,
  Smartphone,
  Laptop,
  Check,
} from 'lucide-react';
import {
  isRunningStandalone,
  isIosDevice,
  subscribeInstallPrompt,
  promptInstallApp,
  hasNativeInstallPrompt,
  isAppAlreadyInstalled,
} from '../pwaRegistration';

export const PwaInstallButton: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canPrompt, setCanPrompt] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const isIos = isIosDevice();

  useEffect(() => {
    // Verifica se já está rodando instalado como standalone
    setIsInstalled(isAppAlreadyInstalled());

    const unsubscribe = subscribeInstallPrompt((canInstall) => {
      setCanPrompt(canInstall);
      setIsInstalled(isAppAlreadyInstalled());
    });

    return () => unsubscribe();
  }, []);

  // Depois que o aplicativo estiver instalado, ocultar o botão automaticamente
  if (isInstalled) {
    return null;
  }

  const handleButtonClick = async () => {
    // 1. iPhone / Safari: iOS não suporta beforeinstallprompt; abre modal de instruções
    if (isIos) {
      setIsModalOpen(true);
      return;
    }

    // 2. Android / Chrome: se beforeinstallprompt estiver disponível, abre prompt nativo
    if (canPrompt || hasNativeInstallPrompt()) {
      const outcome = await promptInstallApp();
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      return;
    }

    // 3. Caso o navegador não tenha disparado beforeinstallprompt, abre instrução em vez de ficar quebrado
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Botão Visível no Header */}
      <button
        type="button"
        id="btn-pwa-install-header"
        onClick={handleButtonClick}
        title="Instalar aplicativo no seu celular ou computador"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-red-600 hover:bg-red-50 active:bg-slate-100 border border-white/80 text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 select-none"
      >
        <span className="text-sm">📲</span>
        <span className="tracking-wide uppercase">INSTALAR APP</span>
      </button>

      {/* Modal / Instrução Simples de Instalação */}
      {isModalOpen && (
        <div
          id="modal-install-instructions-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="modal-install-instructions-card"
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📲</span>
                <div>
                  <h3 className="font-black text-base text-slate-900 leading-tight uppercase tracking-tight">
                    INSTALAR APP
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    VENDAS TIETÊ PLAZA
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-install-modal-x"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar"
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal: iPhone (iOS) */}
            {isIos ? (
              <div className="space-y-3 text-xs text-slate-700 font-medium">
                <p className="font-bold text-slate-900">
                  Para instalar no iPhone:
                </p>

                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <p className="leading-snug">
                      Toque em{' '}
                      <strong className="text-slate-900 inline-flex items-center gap-1 font-bold">
                        <Share className="w-3.5 h-3.5 text-blue-600 inline" /> Compartilhar
                      </strong>{' '}
                      na barra inferior do Safari.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <p className="leading-snug">
                      Toque em{' '}
                      <strong className="text-slate-900 inline-flex items-center gap-1 font-bold">
                        <PlusSquare className="w-3.5 h-3.5 text-slate-800 inline" /> ‘Adicionar à Tela de Início’
                      </strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                      3
                    </span>
                    <p className="leading-snug">
                      Confirme em <strong className="text-red-600 font-bold">‘Adicionar’</strong> no topo direito.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Corpo do Modal: Android ou Computador quando o prompt nativo ainda não disparou */
              <div className="space-y-3 text-xs text-slate-700 font-medium">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No celular (Android / Chrome):</span>
                </p>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p>
                    1. Toque nos <strong>três pontinhos (⋮)</strong> no canto superior do navegador.
                  </p>
                  <p>
                    2. Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </p>
                  <p>
                    3. Confirme em <strong>"Instalar"</strong>.
                  </p>
                </div>

                <p className="font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                  <Laptop className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>No computador (Chrome / Edge):</span>
                </p>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p>
                    Clique no ícone de <strong>instalar (computador com seta para baixo)</strong> na barra de endereços do navegador.
                  </p>
                </div>
              </div>
            )}

            {/* Botão FECHAR obrigatório */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-close-install-modal"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>FECHAR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
