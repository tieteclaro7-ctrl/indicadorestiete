import React, { useState } from 'react';
import { SalesProvider, useSales } from './context/SalesContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DailyEntryGrid } from './components/DailyEntryGrid';
import { SellerView } from './components/SellerView';
import { IndicatorView } from './components/IndicatorView';
import { MonthlyEvolutionView } from './components/MonthlyEvolutionView';
import { AiProjectionView } from './components/AiProjectionView';
import { ReportsView } from './components/ReportsView';
import { SplashScreen } from './components/SplashScreen';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, toast } = useSales();
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white">
      {/* Splash Opening Screen */}
      {!hasEntered && (
        <SplashScreen onEnter={() => setHasEntered(true)} />
      )}

      {/* Navigation Header */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'daily-entry' && <DailyEntryGrid />}
        {activeTab === 'seller-view' && <SellerView />}
        {activeTab === 'indicator-view' && <IndicatorView />}
        {activeTab === 'monthly-evolution' && <MonthlyEvolutionView />}
        {activeTab === 'ai-projection' && <AiProjectionView />}
        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-xs sm:text-sm font-bold transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-600'
              : toast.type === 'info'
              ? 'bg-zinc-900'
              : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Corporate Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span className="font-extrabold text-slate-800">
              Dashboard de Vendas — CLARO Tietê Plaza
            </span>
          </div>
          <div className="text-slate-600 flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-x-3 gap-y-1 font-medium text-center sm:text-right">
            <div>
              <span>Desenvolvido por </span>
              <a
                href="mailto:alex.ribeiro@claro.com.br"
                className="font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
              >
                Alex Ribeiro - alex.ribeiro@claro.com.br
              </a>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <div>
              <span>Concepção e colaboração: </span>
              <a
                href="mailto:lucas.aparecidorodrigues@claro.com.br"
                className="font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
              >
                Lucas Rodrigues - lucas.aparecidorodrigues@claro.com.br
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SalesProvider>
      <AppContent />
    </SalesProvider>
  );
}
