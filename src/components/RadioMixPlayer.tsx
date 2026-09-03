import React from 'react';
import { Radio, X, Volume2, ExternalLink, Sparkles } from 'lucide-react';

interface RadioMixPlayerProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const RadioMixPlayer: React.FC<RadioMixPlayerProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
}) => {
  if (isEmbedded) {
    return (
      <div className="flex justify-center items-center my-6 px-3">
        <div
          id="radio-mix-player-card-embedded"
          className="w-full max-w-[450px] mx-auto bg-zinc-950/95 text-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(234,29,44,0.25)] border border-red-500/30 backdrop-blur-xl flex flex-col transition-all duration-300"
        >
          {/* Player Header */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm shrink-0">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-wide text-white uppercase leading-none">
                    Rádio Mix FM
                  </h3>
                  <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    106.3 FM • SP
                  </span>
                </div>
                <p className="text-[11px] text-red-100 font-medium leading-tight flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Transmissão Ao Vivo Oficial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href="https://aovivo.radiomixfm.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir no site oficial da Mix FM"
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Official Live Stream Iframe Container */}
          <div className="relative w-full h-[600px] bg-black flex items-center justify-center overflow-hidden">
            <iframe
              id="iframe-radio-mix-fm-embedded"
              src="https://aovivo.radiomixfm.com.br/"
              title="Rádio Mix FM São Paulo Ao Vivo"
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              allow="autoplay; encrypted-media; fullscreen"
              className="w-full h-full border-0 rounded-b-2xl"
              style={{
                border: 'none',
                overflow: 'hidden',
                width: '100%',
                height: '600px',
              }}
            />
          </div>

          {/* Footer Info / Controls */}
          <div className="bg-zinc-900/90 px-4 py-2 text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-red-500" />
              Controle de áudio e cidades direto no player
            </span>
            <span className="font-mono text-[10px] text-zinc-500">MIX FM SP</span>
          </div>
        </div>
      </div>
    );
  }

  // Floating / Popup Modal Mode with persistent container
  return (
    <div
      id="radio-mix-modal-overlay"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm transition-all duration-200 overflow-y-auto ${
        isOpen
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[450px] relative transition-transform duration-200 ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="radio-mix-player-card"
          className="w-full max-w-[450px] mx-auto bg-zinc-950/95 text-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(234,29,44,0.25)] border border-red-500/30 backdrop-blur-xl flex flex-col"
        >
          {/* Player Header */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 shadow-sm shrink-0">
                <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-wide text-white uppercase leading-none">
                    Rádio Mix FM
                  </h3>
                  <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    106.3 FM • SP
                  </span>
                </div>
                <p className="text-[11px] text-red-100 font-medium leading-tight flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Transmissão Ao Vivo Oficial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href="https://aovivo.radiomixfm.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir no site oficial da Mix FM"
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              {onClose && (
                <button
                  type="button"
                  id="btn-close-radio-mix"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="Fechar visualização (a rádio continua tocando no topo)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Official Live Stream Iframe Container */}
          <div className="relative w-full h-[600px] bg-black flex items-center justify-center overflow-hidden">
            <iframe
              id="iframe-radio-mix-fm"
              src="https://aovivo.radiomixfm.com.br/"
              title="Rádio Mix FM São Paulo Ao Vivo"
              width="100%"
              height="600"
              frameBorder="0"
              scrolling="no"
              allow="autoplay; encrypted-media; fullscreen"
              className="w-full h-full border-0 rounded-b-2xl"
              style={{
                border: 'none',
                overflow: 'hidden',
                width: '100%',
                height: '600px',
              }}
            />
          </div>

          {/* Footer Info / Controls */}
          <div className="bg-zinc-900/90 px-4 py-2 text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-red-500" />
              Controle de áudio e cidades direto no player
            </span>
            <span className="font-mono text-[10px] text-zinc-500">MIX FM SP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
