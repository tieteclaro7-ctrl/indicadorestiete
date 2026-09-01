import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Flame,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Layers,
  ChevronRight,
  UserCheck,
  CheckCircle,
  BarChart3,
  PieChart as PieIcon,
  Target,
  Edit3,
  Clock,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { useSales } from '../context/SalesContext';
import {
  calculateCategoryBreakdown,
  calculateDailyEvolution,
  calculateIndicatorStats,
  calculateKPIStats,
  calculateSellerStats,
  formatDateBR,
  formatMonthLabel
} from '../utils/calculations';
import { getLastSyncTime } from '../utils/syncService';
import { FilterBar } from './FilterBar';
import { StoreGoalsPanel } from './StoreGoalsPanel';

export const DashboardView: React.FC = () => {
  const { database, filters, setFilters, setActiveTab } = useSales();

  const currentMonthData = database.months[filters.month];
  const activeSellers = database.sellers.filter((s) => s.active);

  const kpis = React.useMemo(() => {
    return calculateKPIStats(currentMonthData, database.sellers, filters);
  }, [currentMonthData, database.sellers, filters]);

  const sellerStats = React.useMemo(() => {
    return calculateSellerStats(currentMonthData, database.sellers, filters);
  }, [currentMonthData, database.sellers, filters]);

  const indicatorStats = React.useMemo(() => {
    return calculateIndicatorStats(currentMonthData, undefined, database.sellers, filters);
  }, [currentMonthData, database.sellers, filters]);

  const categoryBreakdown = React.useMemo(() => {
    return calculateCategoryBreakdown(currentMonthData, filters);
  }, [currentMonthData, filters]);

  const dailyEvolution = React.useMemo(() => {
    return calculateDailyEvolution(currentMonthData, filters);
  }, [currentMonthData, filters]);

  return (
    <div id="dashboard-view-content" className="space-y-6 pb-12">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
              DASHBOARD
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/25 text-red-100 text-[11px] font-medium">
              <Clock className="w-3 h-3" />
              Última sincronização: {getLastSyncTime()}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            INDICADORES — {formatMonthLabel(filters.month)}
          </h2>
          <p className="text-xs sm:text-sm text-red-100 mt-0.5">
            {filters.day === 'all'
              ? `Acumulado de ${kpis.daysWithSales} dias registrados no mês`
              : `Resultados específicos do dia ${formatDateBR(filters.day)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-quick-new-entry"
            onClick={() => setActiveTab('daily-entry')}
            className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>+ Lançar Vendas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* ========================================================================= */}
      {/* PAINEL DE METAS DA LOJA POR INDICADORES DETALHADOS                       */}
      {/* ========================================================================= */}
      <StoreGoalsPanel />

      {/* 6 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Vendido */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Vendido</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 leading-none">
              {kpis.totalSales}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium mt-1 inline-block">
              {filters.day === 'all' ? 'acumulado do mês' : 'total no dia'}
            </span>
          </div>
        </div>

        {/* Card 2: Total de Indicadores Ativos */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Indicadores</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 leading-none">
              {kpis.activeIndicatorsCount}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium mt-1 inline-block">
              produtos com vendas
            </span>
          </div>
        </div>

        {/* Card 3: Média Diária */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Média Diária</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 leading-none">
              {kpis.dailyAverage.toFixed(1)}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium mt-1 inline-block">
              vendas por dia trabalhado
            </span>
          </div>
        </div>

        {/* Card 4: Melhor Vendedor */}
        <div
          onClick={() => {
            if (kpis.bestSeller) {
              const sObj = database.sellers.find((s) => s.name === kpis.bestSeller?.name);
              if (sObj) setFilters((prev) => ({ ...prev, sellerId: sObj.id }));
              setActiveTab('seller-view');
            }
          }}
          className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition-colors"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Melhor Vendedor</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-zinc-900 truncate leading-tight">
              {kpis.bestSeller ? kpis.bestSeller.name : '—'}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">
              {kpis.bestSeller ? `${kpis.bestSeller.total} vendas (${kpis.bestSeller.share.toFixed(1)}%)` : 'Sem vendas'}
            </span>
          </div>
        </div>

        {/* Card 5: Melhor Indicador */}
        <div
          onClick={() => {
            if (kpis.bestIndicator) {
              setActiveTab('indicator-view');
            }
          }}
          className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition-colors"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Produto</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-zinc-900 truncate leading-tight" title={kpis.bestIndicator?.name}>
              {kpis.bestIndicator ? kpis.bestIndicator.name : '—'}
            </div>
            <span className="text-[11px] text-rose-600 font-bold mt-1 inline-block">
              {kpis.bestIndicator ? `${kpis.bestIndicator.total} vendas` : 'Sem vendas'}
            </span>
          </div>
        </div>

        {/* Card 6: Projeção do Mês */}
        <div
          onClick={() => setActiveTab('ai-projection')}
          className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-xl p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Projeção Mês</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white leading-none">
              ~{kpis.projectedMonthEnd}
            </div>
            <span className="text-[11px] text-zinc-300 font-medium mt-1 inline-block">
              fechamento estimado
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Evolução Diária das Vendas */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-600" />
                Evolução Diária de Vendas
              </h3>
              <p className="text-xs text-zinc-500">Volume diário ao longo do mês</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">
              {dailyEvolution.length} dias no mês
            </span>
          </div>

          <div className="h-64 w-full">
            {dailyEvolution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717A' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} vendas`, 'Total']}
                    labelFormatter={(label) => `Dia ${label}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Nenhum lançamento no mês selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Distribuição por Categoria */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div className="mb-3">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-red-600" />
              Distribuição por Categoria
            </h3>
            <p className="text-xs text-zinc-500">Participação de cada grupo de produtos</p>
          </div>

          <div className="h-52 w-full">
            {categoryBreakdown.some((c) => c.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown.filter((c) => c.total > 0)}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} vendas`, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Sem vendas computadas no filtro.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-zinc-700">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{cat.total}</span>
                  <span className="text-zinc-400 text-[11px]">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Rankings Row: Ranking de Vendedores & Ranking de Indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Desempenho
              </h3>
              <p className="text-xs text-zinc-500">Desempenho individual</p>
            </div>
            <button
              onClick={() => setActiveTab('seller-view')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {sellerStats.slice(0, 7).map((seller, index) => {
              const maxTotal = sellerStats[0]?.total || 1;
              const percentOfMax = (seller.total / maxTotal) * 100;
              const isPodium = index < 3 && seller.total > 0;

              return (
                <div
                  key={seller.id}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, sellerId: seller.id }));
                    setActiveTab('seller-view');
                  }}
                  className="p-2.5 rounded-xl border border-zinc-100 hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          index === 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : index === 1
                            ? 'bg-zinc-200 text-zinc-700'
                            : index === 2
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {index + 1}º
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-zinc-900">{seller.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-zinc-900">{seller.total} vendas</span>
                      <span className="text-[11px] font-semibold text-zinc-400">{seller.share}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-red-600' : index === 1 ? 'bg-red-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${Math.max(4, percentOfMax)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ranking de Indicadores / Produtos */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-600" />
                Indicadores (Top Produtos)
              </h3>
              <p className="text-xs text-zinc-500">Produtos com maior volume de saídas</p>
            </div>
            <button
              onClick={() => setActiveTab('indicator-view')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            >
              Ver Todos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {indicatorStats.slice(0, 7).map((ind, index) => {
              const maxIndTotal = indicatorStats[0]?.total || 1;
              const percentOfMax = (ind.total / maxIndTotal) * 100;

              return (
                <div
                  key={ind.id}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, indicatorId: ind.id }));
                    setActiveTab('indicator-view');
                  }}
                  className="p-2.5 rounded-xl border border-zinc-100 hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-zinc-400 w-5">{index + 1}º</span>
                      <div>
                        <span className="text-xs font-bold text-zinc-900">{ind.name}</span>
                        <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium">
                          {ind.categoryName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-zinc-900">{ind.total}</span>
                      <span className="text-[10px] text-zinc-400 ml-1">vendas</span>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-800 transition-all duration-500"
                      style={{ width: `${Math.max(3, percentOfMax)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
