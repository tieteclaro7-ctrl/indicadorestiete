import React, { useState, useMemo } from 'react';
import {
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Sparkles,
  TrendingUp,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { CATEGORIES, ALL_INDICATORS, CATEGORY_MAP, INDICATOR_MAP } from '../data/categories';
import { DailyEntry } from '../types';
import { formatMonthLabel } from '../utils/calculations';

export const StoreGoalsPanel: React.FC = () => {
  const { database, filters, updateStoreGoal, updateAllStoreGoals, clearStoreGoals, showToast } = useSales();

  const currentMonthKey = filters.month;
  const currentMonthData = database.months[currentMonthKey];
  const activeSellers = useMemo(() => database.sellers.filter((s) => s.active), [database.sellers]);
  const activeSellerIds = useMemo(() => new Set(activeSellers.map((s) => s.id)), [activeSellers]);

  // Is panel expanded for full indicator editing or collapsed to summary
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Current goals map for the active month
  const savedGoals: Record<string, number> = useMemo(() => {
    return currentMonthData?.goals || database.monthlyGoals?.[currentMonthKey] || {};
  }, [currentMonthData, database.monthlyGoals, currentMonthKey]);

  // Local draft state for quick inputs before debouncing or direct change
  const [localGoals, setLocalGoals] = useState<Record<string, number>>(savedGoals);

  // Sync local goals when saved goals change
  React.useEffect(() => {
    setLocalGoals(savedGoals);
  }, [savedGoals]);

  // Calculate realized totals per indicator for the entire month across all active sellers
  const realizedByIndicator = useMemo(() => {
    const totals: Record<string, number> = {};
    ALL_INDICATORS.forEach((i) => (totals[i.id] = 0));

    if (currentMonthData && currentMonthData.days) {
      Object.values(currentMonthData.days).forEach((entry: DailyEntry) => {
        Object.entries(entry?.values || {}).forEach(([indId, sMap]) => {
          Object.entries(sMap || {}).forEach(([sellerId, qty]) => {
            if (activeSellerIds.has(sellerId)) {
              const val = Number(qty) || 0;
              if (val > 0) {
                totals[indId] = (totals[indId] || 0) + val;
              }
            }
          });
        });
      });
    }

    return totals;
  }, [currentMonthData, activeSellerIds]);

  // Global summary statistics
  const summary = useMemo(() => {
    let totalGoal = 0;
    let totalRealized = 0;
    let indicatorsWithGoal = 0;
    let indicatorsAchieved = 0;

    ALL_INDICATORS.forEach((ind) => {
      const goalVal = localGoals[ind.id] || 0;
      const realVal = realizedByIndicator[ind.id] || 0;

      if (goalVal > 0) {
        totalGoal += goalVal;
        indicatorsWithGoal++;
        if (realVal >= goalVal) {
          indicatorsAchieved++;
        }
      }
      totalRealized += realVal;
    });

    const percentAchieved = totalGoal > 0 ? (totalRealized / totalGoal) * 100 : 0;
    const remainingToGoal = Math.max(0, totalGoal - totalRealized);

    return {
      totalGoal,
      totalRealized,
      percentAchieved,
      remainingToGoal,
      indicatorsWithGoal,
      indicatorsAchieved,
    };
  }, [localGoals, realizedByIndicator]);

  // Category-specific summaries
  const categorySummaries = useMemo(() => {
    return CATEGORIES.map((cat) => {
      let catGoal = 0;
      let catRealized = 0;
      let catAchievedCount = 0;
      let catIndicatorsWithGoal = 0;

      cat.indicators.forEach((ind) => {
        const g = localGoals[ind.id] || 0;
        const r = realizedByIndicator[ind.id] || 0;
        if (g > 0) {
          catGoal += g;
          catIndicatorsWithGoal++;
          if (r >= g) catAchievedCount++;
        }
        catRealized += r;
      });

      const catPercent = catGoal > 0 ? (catRealized / catGoal) * 100 : 0;

      return {
        ...cat,
        goal: catGoal,
        realized: catRealized,
        percent: catPercent,
        indicatorsWithGoal: catIndicatorsWithGoal,
        achievedCount: catAchievedCount,
      };
    });
  }, [localGoals, realizedByIndicator]);

  // Filtered categories/indicators list
  const filteredCategories = useMemo(() => {
    return CATEGORIES.map((cat) => {
      let list = cat.indicators;

      if (selectedCategoryTab !== 'all' && cat.id !== selectedCategoryTab) {
        return null;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (ind) =>
            ind.name.toLowerCase().includes(q) ||
            (ind.subtitle && ind.subtitle.toLowerCase().includes(q))
        );
      }

      if (list.length === 0) return null;

      return {
        ...cat,
        indicators: list,
      };
    }).filter(Boolean) as (typeof CATEGORIES[0])[];
  }, [selectedCategoryTab, searchQuery]);

  const handleGoalChange = (indicatorId: string, valueStr: string) => {
    const val = valueStr === '' ? 0 : parseInt(valueStr, 10);
    const safeVal = isNaN(val) ? 0 : Math.max(0, val);

    setLocalGoals((prev) => {
      const next = { ...prev };
      if (safeVal === 0) {
        delete next[indicatorId];
      } else {
        next[indicatorId] = safeVal;
      }
      return next;
    });

    // Auto-persist per indicator
    updateStoreGoal(currentMonthKey, indicatorId, safeVal);
  };

  const handleSaveAll = () => {
    setIsSavingAll(true);
    updateAllStoreGoals(currentMonthKey, localGoals);
    setTimeout(() => {
      setIsSavingAll(false);
    }, 600);
  };

  const handleClearGoals = () => {
    if (window.confirm(`Deseja realmente zerar todas as metas da loja para ${formatMonthLabel(currentMonthKey)}?`)) {
      setLocalGoals({});
      clearStoreGoals(currentMonthKey);
    }
  };

  return (
    <div
      id="meta-geral-loja-panel"
      className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden transition-all duration-300"
    >
      {/* Header Banner da Meta Geral */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Context */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                  PLANEJAMENTO
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {formatMonthLabel(currentMonthKey)}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                META GERAL DA LOJA
              </h3>
            </div>
          </div>

          {/* Quick Metrics Badges in Header */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Meta Total */}
            <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-semibold uppercase">Meta Loja:</span>
              <span className="text-sm font-black text-white">
                {summary.totalGoal > 0 ? summary.totalGoal : 'Não definida'}
              </span>
            </div>

            {/* Realizado Total */}
            <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-semibold uppercase">Realizado:</span>
              <span className="text-sm font-black text-emerald-400">
                {summary.totalRealized} vendas
              </span>
            </div>

            {/* % Atingimento */}
            <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-semibold uppercase">Atingimento:</span>
              <span
                className={`text-sm font-black ${
                  summary.totalGoal === 0
                    ? 'text-zinc-400'
                    : summary.percentAchieved >= 100
                    ? 'text-emerald-400'
                    : summary.percentAchieved >= 70
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {summary.totalGoal > 0 ? `${summary.percentAchieved.toFixed(1)}%` : '—'}
              </span>
            </div>

            {/* Toggle Button */}
            <button
              id="btn-toggle-meta-fields"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isExpanded ? 'Recolher Metas' : 'Preencher / Ajustar Metas'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Global Progress Bar in Header */}
        {summary.totalGoal > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-700/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-medium">Cenário Geral da Meta da Loja:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    summary.percentAchieved >= 100
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : summary.percentAchieved >= 80
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : summary.percentAchieved >= 50
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {summary.percentAchieved >= 100
                    ? `🎯 Meta Batida (+${summary.totalRealized - summary.totalGoal})`
                    : `⚡ Faltam ${summary.remainingToGoal} vendas`}
                </span>
              </div>
              <span className="text-zinc-400 font-bold text-[11px]">
                {summary.indicatorsAchieved} de {summary.indicatorsWithGoal} indicadores batidos
              </span>
            </div>
            <div className="w-full bg-zinc-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.percentAchieved >= 100
                    ? 'bg-emerald-500'
                    : summary.percentAchieved >= 80
                    ? 'bg-blue-500'
                    : summary.percentAchieved >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, summary.percentAchieved))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content: Indicator Input Fields and Progress */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-5 bg-zinc-50/50">
          {/* Controls Bar: Category Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryTab === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Todos os Indicadores (36)
              </button>
              {categorySummaries.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryTab(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryTab === cat.id
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.goal > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        selectedCategoryTab === cat.id
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {cat.realized}/{cat.goal}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search & Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar indicador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <button
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                title="Salvar todas as metas do mês"
              >
                {isSavingAll ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSavingAll ? 'Salvo!' : 'Salvar Metas'}</span>
              </button>

              {summary.totalGoal > 0 && (
                <button
                  onClick={handleClearGoals}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Zerar metas do mês"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Grid of Categories and Indicator Meta Fields */}
          <div className="space-y-5">
            {filteredCategories.map((category) => {
              const catSummary = categorySummaries.find((c) => c.id === category.id);
              const catPercent = catSummary?.percent || 0;

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-2xs"
                >
                  {/* Category Header Strip */}
                  <div className="px-4 py-2.5 bg-zinc-100/80 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <h4 className="text-xs sm:text-sm font-black text-zinc-900 tracking-wide uppercase">
                        {category.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-zinc-500">
                        ({category.indicators.length} indicadores)
                      </span>
                    </div>

                    {/* Category Metrics Summary */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium text-[11px]">Meta Categoria:</span>
                        <span className="font-extrabold text-zinc-900">
                          {catSummary?.goal || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium text-[11px]">Realizado:</span>
                        <span className="font-extrabold text-emerald-600">
                          {catSummary?.realized || 0}
                        </span>
                      </div>
                      {catSummary && catSummary.goal > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            catPercent >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : catPercent >= 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {catPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Indicator Meta Field Cards Grid */}
                  <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {category.indicators.map((indicator) => {
                      const goalValue = localGoals[indicator.id] ?? '';
                      const numGoal = typeof goalValue === 'number' ? goalValue : 0;
                      const realizedValue = realizedByIndicator[indicator.id] || 0;
                      const hasGoal = numGoal > 0;
                      const percent = hasGoal ? (realizedValue / numGoal) * 100 : 0;
                      const isAchieved = hasGoal && realizedValue >= numGoal;
                      const remaining = Math.max(0, numGoal - realizedValue);

                      return (
                        <div
                          key={indicator.id}
                          className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                            hasGoal
                              ? isAchieved
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : percent >= 70
                                ? 'bg-amber-50/30 border-amber-200'
                                : 'bg-white border-zinc-200'
                              : 'bg-zinc-50/60 border-zinc-200/80'
                          }`}
                        >
                          {/* Indicator Header */}
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span
                                className="text-xs font-black text-zinc-900 leading-tight uppercase line-clamp-2"
                                title={indicator.name}
                              >
                                {indicator.name}
                              </span>
                              {isAchieved && (
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            {indicator.subtitle && (
                              <p className="text-[10px] font-semibold text-zinc-400 mb-2 leading-tight">
                                {indicator.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Inputs and Live Realized Status */}
                          <div className="mt-2 space-y-2 pt-2 border-t border-zinc-100">
                            {/* Input Field for Store Goal */}
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                Meta Loja:
                              </label>
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={goalValue}
                                  onChange={(e) => handleGoalChange(indicator.id, e.target.value)}
                                  className="w-full text-right px-2 py-1 text-xs font-black text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-red-500 focus:border-red-500"
                                />
                              </div>
                            </div>

                            {/* Realized Sales Badge */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                                Realizado:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-zinc-900">{realizedValue}</span>
                                <span className="text-[10px] text-zinc-400">un</span>
                              </div>
                            </div>

                            {/* Progress bar and % completion */}
                            {hasGoal ? (
                              <div>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span
                                    className={`font-bold ${
                                      isAchieved
                                        ? 'text-emerald-700'
                                        : percent >= 70
                                        ? 'text-amber-700'
                                        : 'text-zinc-600'
                                    }`}
                                  >
                                    {isAchieved
                                      ? `+${realizedValue - numGoal} superado`
                                      : `Faltam ${remaining}`}
                                  </span>
                                  <span
                                    className={`font-black ${
                                      isAchieved
                                        ? 'text-emerald-700'
                                        : percent >= 70
                                        ? 'text-amber-700'
                                        : 'text-zinc-700'
                                    }`}
                                  >
                                    {percent.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-200/80 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isAchieved
                                        ? 'bg-emerald-500'
                                        : percent >= 70
                                        ? 'bg-amber-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-400 italic text-center py-0.5">
                                Digite a meta acima
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note explaining dynamic sum behavior */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-xl border border-zinc-200 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Sincronização em Tempo Real:</strong> Ao lançar as vendas de cada vendedor na folha diária, o <strong>Realizado</strong> de cada indicador é somado automaticamente no cenário da loja.
              </span>
            </div>
            <span className="font-bold text-zinc-700 whitespace-nowrap">
              Total Acumulado: {summary.totalRealized} vendas registradas
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
