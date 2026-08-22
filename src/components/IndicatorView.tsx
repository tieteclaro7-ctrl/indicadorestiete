import React, { useState } from 'react';
import {
  Target,
  Flame,
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { useSales } from '../context/SalesContext';
import { ALL_INDICATORS, CATEGORIES, CATEGORY_MAP, INDICATOR_MAP } from '../data/categories';
import {
  calculateIndicatorStats,
  formatDateBR,
  formatMonthLabel,
  getDaysInMonth
} from '../utils/calculations';

export const IndicatorView: React.FC = () => {
  const { database, filters, setFilters } = useSales();
  const currentMonthData = database.months[filters.month];

  // Previous month calculation
  const prevMonthKey = React.useMemo(() => {
    const [y, m] = filters.month.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const pY = prevDate.getFullYear();
    const pM = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    return `${pY}-${pM}`;
  }, [filters.month]);

  const prevMonthData = database.months[prevMonthKey];
  const activeSellers = database.sellers.filter((s) => s.active);

  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(
    filters.indicatorId !== 'all' ? filters.indicatorId : 'claro_fibra'
  );

  const selectedIndicator = INDICATOR_MAP.get(selectedIndicatorId) || ALL_INDICATORS[0];
  const category = CATEGORY_MAP.get(selectedIndicator.categoryId);

  // Calculate indicator stats
  const allIndicatorStats = React.useMemo(() => {
    return calculateIndicatorStats(currentMonthData, prevMonthData, database.sellers, {
      ...filters,
      categoryId: 'all',
      indicatorId: 'all',
    });
  }, [currentMonthData, prevMonthData, database.sellers, filters]);

  const currentStat = allIndicatorStats.find((i) => i.id === selectedIndicator.id) || {
    total: 0,
    dailyAverage: 0,
    bestSeller: null,
    sellerBreakdown: {},
    growthVsPreviousMonth: undefined,
  };

  // Ranking of sellers for this specific indicator
  const sellerRankings = React.useMemo(() => {
    const list = activeSellers.map((seller) => {
      const qty = currentStat.sellerBreakdown[seller.id] || 0;
      return {
        id: seller.id,
        name: seller.name,
        total: qty,
        percentage: currentStat.total > 0 ? Number(((qty / currentStat.total) * 100).toFixed(1)) : 0,
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [activeSellers, currentStat]);

  // Daily evolution for this specific indicator
  const indicatorDailyEvolution = React.useMemo(() => {
    if (!currentMonthData || !currentMonthData.days) return [];
    const dayKeys = Object.keys(currentMonthData.days).sort();

    return dayKeys.map((dStr) => {
      const entry = currentMonthData.days[dStr];
      const [year, month, day] = dStr.split('-');
      let daySum = 0;

      Object.values(entry.values?.[selectedIndicator.id] || {}).forEach((q) => {
        daySum += Number(q) || 0;
      });

      return {
        day: `${day}/${month}`,
        date: dStr,
        vendas: daySum,
      };
    });
  }, [currentMonthData, selectedIndicator.id]);

  // Indicator monthly projection
  const totalDays = getDaysInMonth(filters.month);
  const daysRecorded = currentMonthData ? Object.keys(currentMonthData.days).length : 0;
  const projectedTotal = daysRecorded > 0 ? Math.round((currentStat.total / daysRecorded) * totalDays) : 0;

  return (
    <div id="indicator-view-content" className="space-y-6 pb-12">
      {/* Indicator Selection Carousel */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-600 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-600" />
            Selecione o Indicador para Detalhamento
          </span>
          <span className="text-xs font-bold text-zinc-500">
            {ALL_INDICATORS.length} indicadores cadastrados
          </span>
        </div>

        {/* Grouped by category pills */}
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: cat.color }}>
                {cat.name}
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {cat.indicators.map((ind) => {
                  const isSelected = ind.id === selectedIndicator.id;
                  const stat = allIndicatorStats.find((i) => i.id === ind.id);

                  return (
                    <button
                      key={ind.id}
                      id={`btn-ind-select-${ind.id}`}
                      onClick={() => {
                        setSelectedIndicatorId(ind.id);
                        setFilters((prev) => ({ ...prev, indicatorId: ind.id }));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-md scale-102'
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      <span>{ind.name}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {stat?.total || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Indicator Banner */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6 border-b-4 border-red-600 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase"
              style={{ backgroundColor: `${category?.color}30`, color: category?.color }}
            >
              {category?.name}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              {selectedIndicator.name}
            </h2>
          </div>
          {selectedIndicator.subtitle && (
            <span className="text-xs text-zinc-400 font-medium block mt-0.5">
              {selectedIndicator.subtitle}
            </span>
          )}
          <p className="text-xs text-zinc-400 mt-1">
            Análise consolidada para o mês de <strong>{formatMonthLabel(filters.month)}</strong>
          </p>
        </div>

        {/* 4 Key Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-800/80 p-3 rounded-xl border border-zinc-700">
          <div className="text-center px-2">
            <span className="block text-[10px] text-zinc-400 uppercase font-bold">Total Mês</span>
            <span className="text-lg sm:text-xl font-black text-red-400">{currentStat.total}</span>
          </div>
          <div className="text-center px-2 border-l border-zinc-700">
            <span className="block text-[10px] text-zinc-400 uppercase font-bold">Média / Dia</span>
            <span className="text-lg sm:text-xl font-black text-white">{currentStat.dailyAverage}</span>
          </div>
          <div className="text-center px-2 border-l border-zinc-700">
            <span className="block text-[10px] text-zinc-400 uppercase font-bold">Projeção Mês</span>
            <span className="text-lg sm:text-xl font-black text-amber-400">~{projectedTotal}</span>
          </div>
          <div className="text-center px-2 border-l border-zinc-700">
            <span className="block text-[10px] text-zinc-400 uppercase font-bold">Evolução MoM</span>
            <span
              className={`text-sm sm:text-base font-black ${
                currentStat.growthVsPreviousMonth === undefined
                  ? 'text-zinc-400'
                  : currentStat.growthVsPreviousMonth >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {currentStat.growthVsPreviousMonth !== undefined
                ? `${currentStat.growthVsPreviousMonth > 0 ? '+' : ''}${currentStat.growthVsPreviousMonth}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts for Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Evolution Chart */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-600" />
                Evolução Diária de {selectedIndicator.name}
              </h3>
              <p className="text-xs text-zinc-500">Unidades vendidas por dia no mês</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={indicatorDailyEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="indArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={category?.color || '#DC2626'} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={category?.color || '#DC2626'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} unidades`, selectedIndicator.name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke={category?.color || '#DC2626'}
                  strokeWidth={2.5}
                  fill="url(#indArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking of Sellers for this product */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Ranking de Vendedores — {selectedIndicator.name}
              </h3>
              <p className="text-xs text-zinc-500">Quem mais vende este produto na equipe</p>
            </div>
            {currentStat.bestSeller && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Top: {currentStat.bestSeller.name} ({currentStat.bestSeller.total})
              </span>
            )}
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {sellerRankings.map((seller, idx) => {
              const maxVal = sellerRankings[0]?.total || 1;
              const percentOfMax = (seller.total / maxVal) * 100;

              return (
                <div
                  key={seller.id}
                  className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}º
                      </span>
                      <span className="font-extrabold text-zinc-900">{seller.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-zinc-900">{seller.total} un</span>
                      <span className="text-[11px] text-zinc-400 font-semibold">({seller.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-200/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, percentOfMax)}%`,
                        backgroundColor: category?.color || '#DC2626',
                      }}
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
