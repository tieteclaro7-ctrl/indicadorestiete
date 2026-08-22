import React from 'react';
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
  Info
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { formatMonthLabel } from '../utils/calculations';
import { ViewTab } from '../types';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, selectedDate, setSelectedDate, toast, database } = useSales();

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
      <div className="bg-red-600 text-white px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight uppercase">
                Dashboard de Vendas — CLARO Tietê Plaza
              </h1>
              <p className="text-xs text-red-100 font-medium">
                Controle Diário de Indicadores • LOJA CLARO Shopping Tietê Plaza
              </p>
            </div>
          </div>

          {/* Quick Date and Status Controls */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-1.5 bg-red-700/80 px-3 py-1 rounded-lg border border-red-500/50 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-red-200" />
              <span>Data Ativa:</span>
              <input
                id="header-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-red-800 text-white px-2 py-0.5 rounded text-xs font-bold outline-hidden border border-red-400 cursor-pointer"
              />
            </div>
            <span className="hidden lg:inline-flex items-center px-2 py-1 rounded bg-red-800/60 text-red-100 text-xs font-medium">
              Mês: {formatMonthLabel(selectedDate.substring(0, 7))}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav id="header-nav-tabs" className="flex space-x-1 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          id="system-toast-notification"
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-red-50 border-red-700'
                : 'bg-zinc-900 text-zinc-50 border-zinc-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </header>
  );
};
