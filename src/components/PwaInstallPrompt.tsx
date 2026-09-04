import React, { useEffect, useState } from 'react';
import {
  isRunningStandalone,
  isIosDevice,
  isAndroidDevice,
  subscribeInstallPrompt,
  promptInstallApp,
  hasNativeInstallPrompt,
  isAppAlreadyInstalled,
} from '../pwaRegistration';

export const PwaInstallButton: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canPrompt, setCanPrompt] = useState<boolean>(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);

  const isIos = isIosDevice();
  const isAndroid = isAndroidDevice();

  useEffect(() => {
    // Verifica se já está instalado ou rodando em modo standalone
    setIsInstalled(isAppAlreadyInstalled());

    // Se inscreve para atualizações do evento nativo beforeinstallprompt
    const unsubscribe = subscribeInstallPrompt((canInstall) => {
      setCanPrompt(canInstall);
      setIsInstalled(isAppAlreadyInstalled());
    });

    return () => unsubscribe();
  }, []);

  // Se já estiver instalado ou rodando em modo standalone, oculta o botão
  if (isInstalled || isRunningStandalone()) {
    return null;
  }

  // Em computador desktop comum, só exibe se o navegador disparou o evento nativo
  // No celular (Android ou iPhone), exibe o botão
  const shouldShowButton = isIos || isAndroid || canPrompt || hasNativeInstallPrompt();

  if (!shouldShowButton) {
    return null;
  }

  const handleButtonClick = async () => {
    // 1. iPhone / iOS: não suporta beforeinstallprompt nativo.
    // Abre apenas o pequeno modal direto e sem tutorial extenso.
    if (isIos) {
      setIsIosModalOpen(true);
      return;
    }

    // 2. Android / Chrome: Aciona diretamente o prompt nativo de instalação do PWA
    if (canPrompt || hasNativeInstallPrompt()) {
      const outcome = await promptInstallApp();
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      return;
    }

    // Se no Android o evento ainda não estiver carregado, tenta chamar novamente sem quebrar a interface
    const directOutcome = await promptInstallApp();
    if (directOutcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  return (
    <>
      {/* Botão Profissional e Visível no Topo / Header */}
      <button
        type="button"
        id="btn-pwa-install-header"
        onClick={handleButtonClick}
        title="Instalar aplicativo"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-red-600 hover:bg-red-50 active:bg-slate-100 border border-white/80 text-xs font-black transition-all cursor-pointer shadow-xs shrink-0 select-none"
      >
        <span className="text-sm">📲</span>
        <span className="tracking-wide uppercase">INSTALAR APP</span>
      </button>

      {/* iPhone / iOS: Pequeno aviso do sistema (apenas quando solicitado no iPhone) */}
      {isIosModalOpen && (
        <div
          id="modal-ios-install-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setIsIosModalOpen(false)}
        >
          <div
            id="modal-ios-install-card"
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-xs w-full shadow-2xl border border-slate-200 text-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título do Modal */}
            <div className="flex items-center justify-center gap-2 pb-1 border-b border-slate-100">
              <span className="text-xl">📲</span>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                INSTALAR APP
              </h3>
            </div>

            {/* Instrução Simples Exigida pelo iOS */}
            <div className="text-xs text-slate-700 leading-relaxed font-medium">
              <p className="font-bold text-slate-900 mb-1.5 text-sm">
                Para instalar no iPhone:
              </p>
              <p className="leading-snug">
                Toque em <strong>Compartilhar</strong> e depois em<br />
                <span className="text-red-600 font-bold">‘Adicionar à Tela de Início’</span>.
              </p>
            </div>

            {/* Botão FECHAR obrigatório */}
            <div className="pt-1">
              <button
                type="button"
                id="btn-close-ios-install-modal"
                onClick={() => setIsIosModalOpen(false)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
