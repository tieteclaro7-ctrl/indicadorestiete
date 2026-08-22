import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import {
  calculateIndicatorStats,
  calculateKPIStats,
  calculateSellerStats,
  formatMonthLabel,
  getDaysInMonth
} from '../utils/calculations';
import { FilterBar } from './FilterBar';

export const AiProjectionView: React.FC = () => {
  const { database, filters } = useSales();
  const currentMonthData = database.months[filters.month];
  const activeSellers = database.sellers.filter((s) => s.active);

  // Previous month for comparison
  const prevMonthKey = React.useMemo(() => {
    const [y, m] = filters.month.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const pY = prevDate.getFullYear();
    const pM = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    return `${pY}-${pM}`;
  }, [filters.month]);

  const prevMonthData = database.months[prevMonthKey];

  const kpis = React.useMemo(() => {
    return calculateKPIStats(currentMonthData, database.sellers, { ...filters, day: 'all' });
  }, [currentMonthData, database.sellers, filters]);

  const sellerStats = React.useMemo(() => {
    return calculateSellerStats(currentMonthData, database.sellers, { ...filters, day: 'all', sellerId: 'all' });
  }, [currentMonthData, database.sellers, filters]);

  const indicatorStats = React.useMemo(() => {
    return calculateIndicatorStats(currentMonthData, prevMonthData, database.sellers, {
      ...filters,
      day: 'all',
      categoryId: 'all',
      indicatorId: 'all',
    });
  }, [currentMonthData, prevMonthData, database.sellers, filters]);

  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string>('');

  const totalDaysInMonth = getDaysInMonth(filters.month);
  const daysRecorded = kpis.daysWithSales;
  const hasSufficientData = daysRecorded >= 1 && kpis.totalSales > 0;

  // Indicators in uptrend and downtrend
  const highIndicators = indicatorStats.filter((i) => (i.growthVsPreviousMonth ?? 0) > 0 || i.total >= 10).slice(0, 4);
  const lowIndicators = indicatorStats.filter((i) => (i.growthVsPreviousMonth ?? 0) < 0 || (i.total === 0 && daysRecorded > 5)).slice(0, 4);

  const fetchAiAnalysis = async () => {
    if (!hasSufficientData) {
      setAiAnalysisText('Dados insuficientes para projeção.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        month: formatMonthLabel(filters.month),
        daysRecorded,
        totalDaysInMonth,
        totalSales: kpis.totalSales,
        dailyAverage: kpis.dailyAverage,
        projectedTotal: kpis.projectedMonthEnd,
        topSellers: sellerStats.slice(0, 4).map((s) => ({ name: s.name, total: s.total, share: s.share })),
        topIndicators: indicatorStats.slice(0, 4).map((i) => ({ name: i.name, total: i.total, category: i.categoryName })),
        lowIndicators: lowIndicators.map((i) => ({ name: i.name, total: i.total })),
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysisText(data.analysis);
      } else {
        throw new Error('API offline');
      }
    } catch (e) {
      // Deterministic smart mathematical fallback analysis
      setAiAnalysisText(
        `Até o momento foram realizadas ${kpis.totalSales} vendas em ${daysRecorded} dias computados. Mantendo a média atual de ${kpis.dailyAverage.toFixed(1)} vendas por dia, a projeção de fechamento para ${formatMonthLabel(filters.month)} é de aproximadamente ${kpis.projectedMonthEnd} vendas.\n\n` +
        `• Ritmo da Equipe: A loja opera com ritmo consistente. ${sellerStats[0]?.name || 'O líder'} lidera o volume com ${sellerStats[0]?.total || 0} vendas (${sellerStats[0]?.share || 0}% de participação).\n` +
        `• Indicadores em Alta: Destaque para ${highIndicators.map((i) => i.name).join(', ') || 'linhas principais'}.\n` +
        `• Pontos de Atenção: Alavancar ativações de ${lowIndicators.map((i) => i.name).join(', ') || 'serviços complementares'}.`
      );
    } finally {
      setIsLoading(false);
      setAnalysisTimestamp(new Date().toLocaleTimeString('pt-BR'));
    }
  };

  useEffect(() => {
    fetchAiAnalysis();
  }, [filters.month, kpis.totalSales, daysRecorded]);

  return (
    <div id="ai-projection-view" className="space-y-6 pb-16">
      <FilterBar />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-red-950 text-white rounded-2xl p-6 border-b-4 border-red-600 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                Inteligência Comercial
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase mt-0.5">
              Análise & Projeção com IA
            </h2>
            <p className="text-xs text-zinc-400">
              Projeção estatística e diagnósticos de vendas para <strong>{formatMonthLabel(filters.month)}</strong>
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-ai-analysis"
          onClick={fetchAiAnalysis}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analisando dados...' : 'Atualizar Diagnóstico'}</span>
        </button>
      </div>

      {/* Primary Mathematical Run-Rate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ritmo Atual */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ritmo Atual</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 leading-none">
              {kpis.totalSales} <span className="text-sm font-semibold text-zinc-400">vendas</span>
            </div>
            <span className="text-xs text-zinc-500 font-medium mt-1 inline-block">
              {daysRecorded} de {totalDaysInMonth} dias trabalhados
            </span>
          </div>
        </div>

        {/* Card 2: Média Diária */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Média Diária</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 leading-none">
              {kpis.dailyAverage.toFixed(1)} <span className="text-sm font-semibold text-zinc-400">/dia</span>
            </div>
            <span className="text-xs text-zinc-500 font-medium mt-1 inline-block">
              velocidade média de conversão
            </span>
          </div>
        </div>

        {/* Card 3: Projeção de Fechamento */}
        <div className="bg-white rounded-2xl p-5 border-2 border-red-500 bg-red-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Projeção do Mês</span>
            <Sparkles className="w-5 h-5 text-red-600 animate-bounce" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-red-600 leading-none">
              ~{kpis.projectedMonthEnd}
            </div>
            <span className="text-xs text-red-900 font-bold mt-1 inline-block">
              estimativa mantendo o ritmo
            </span>
          </div>
        </div>

        {/* Card 4: Tendência */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tendência</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 leading-tight">
              {kpis.dailyAverage >= 3 ? 'Crescimento / Estável' : 'Atenção ao Ritmo'}
            </div>
            <span className="text-xs text-zinc-500 font-medium mt-1 inline-block">
              baseado na média de ativações
            </span>
          </div>
        </div>
      </div>

      {/* Main AI Executive Text Panel */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight">
              Parecer Executivo da Inteligência Artificial
            </h3>
          </div>
          {analysisTimestamp && (
            <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Atualizado às {analysisTimestamp}
            </span>
          )}
        </div>

        <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200/80">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
              <span className="text-xs font-bold">Processando dados e gerando projeção inteligente...</span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium whitespace-pre-line">
              {aiAnalysisText || 'Dados insuficientes para projeção.'}
            </div>
          )}
        </div>
      </div>

      {/* Dual Diagnosis Columns: Indicadores em Alta vs Pontos de Atenção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Indicadores em Alta */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-black text-sm uppercase tracking-wider mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Indicadores em Alta & Destaques</span>
          </div>

          <div className="space-y-2.5">
            {highIndicators.length > 0 ? (
              highIndicators.map((ind) => (
                <div key={ind.id} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-zinc-900 block">{ind.name}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">{ind.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">{ind.total} vendas</span>
                    {ind.growthVsPreviousMonth !== undefined && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        +{ind.growthVsPreviousMonth}% vs mês anterior
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center">Nenhum indicador em destaque no momento.</p>
            )}
          </div>
        </div>

        {/* Pontos de Atenção & Alavancagem */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 font-black text-sm uppercase tracking-wider mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Pontos de Atenção & Alavancagem</span>
          </div>

          <div className="space-y-2.5">
            {lowIndicators.length > 0 ? (
              lowIndicators.map((ind) => (
                <div key={ind.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-zinc-900 block">{ind.name}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">{ind.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-800">{ind.total} vendas</span>
                    <span className="text-[10px] font-bold text-amber-600 block">Oportunidade de foco</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 py-4 text-center">Todos os indicadores com boa tração.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
