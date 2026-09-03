/**
 * PWA Service Worker Registration & Lifecycle Management
 * Garante atualizações transparentes, suporte a instalação no Android e iPhone,
 * e integridade total dos dados de sincronização.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();
let isAppInstalled = false;

// Detecta se o app está rodando instalado (standalone)
export const isRunningStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Registra o Service Worker
export const registerPWA = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Checa por atualizações imediatamente ao carregar
        registration.update().catch(() => {});

        // Checagem periódica a cada 20 minutos
        setInterval(() => {
          registration.update().catch(() => {});
        }, 20 * 60 * 1000);

        // Checagem quando a aba ou aplicativo volta ao primeiro plano
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });

        // Detecta quando um novo Service Worker está pronto
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // Nova versão detectada — avisa o worker para assumir o controle
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', error);
      });

    // Atualiza automaticamente quando o novo service worker assumir controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        // Não recarrega agressivamente se o usuário estiver preenchendo formulário
        console.log('[PWA] Nova versão do Dashboard ativada.');
      }
    });
  });

  // Captura o evento nativo de instalação no Android / Chrome
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    isAppInstalled = false;
    notifyInstallListeners(true);
  });

  // Detecta quando o app foi instalado com sucesso
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isAppInstalled = true;
    notifyInstallListeners(false);
    console.log('[PWA] Aplicativo instalado com sucesso na tela inicial!');
  });
};

const notifyInstallListeners = (canInstall: boolean) => {
  installListeners.forEach((listener) => listener(canInstall));
};

export const hasNativeInstallPrompt = (): boolean => {
  return deferredPrompt !== null;
};

export const isAppAlreadyInstalled = (): boolean => {
  return isAppInstalled || isRunningStandalone();
};

export const subscribeInstallPrompt = (callback: (canInstall: boolean) => void) => {
  installListeners.add(callback);
  callback(deferredPrompt !== null && !isRunningStandalone());
  return () => {
    installListeners.delete(callback);
  };
};

// Dispara a instalação nativa
export const promptInstallApp = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferredPrompt) {
    return 'unavailable';
  }
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyInstallListeners(false);
    return choice.outcome;
  } catch (err) {
    console.error('[PWA] Erro ao abrir diálogo de instalação:', err);
    return 'unavailable';
  }
};

// Informa se é dispositivo iOS (iPhone / iPad) para exibir instrução personalizada
export const isIosDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};
