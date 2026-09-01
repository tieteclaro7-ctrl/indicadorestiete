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
  Check,
  Award,
  Layers,
  Calendar
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { CATEGORIES, ALL_INDICATORS, CATEGORY_MAP, INDICATOR_MAP } from '../data/categories';
import { DailyEntry } from '../types';
import { formatMonthLabel, getDaysInMonth } from '../utils/calculations';

export const StoreGoalsPanel: React.FC = () => {
  const { database, filters, updateStoreGoal, updateAllStoreGoals, clearStoreGoals, showToast } = useSales();

  const currentMonthKey = filters.month;
  const currentMonthData = database.months[currentMonthKey];
  const activeSellers = useMemo(() => database.sellers.filter((s) => s.active), [database.sellers]);
  const activeSellerIds = useMemo(() => new Set(activeSellers.map((s) => s.id)), [activeSellers]);

  // Is panel expanded for full indicator editing
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

  // Days calculations for projections and daily gap rate
  const daysInfo = useMemo(() => {
    const totalDaysInMonth = getDaysInMonth(currentMonthKey);
    const daysWithSales = currentMonthData?.days
      ? Object.values(currentMonthData.days).filter((e: DailyEntry) => {
          let daySum = 0;
          Object.values(e.values || {}).forEach((sMap) => {
            Object.values(sMap || {}).forEach((q) => (daySum += Number(q) || 0));
          });
          return daySum > 0;
        }).length
      : 0;

    const remainingDays = Math.max(1, totalDaysInMonth - daysWithSales);
    return {
      totalDaysInMonth,
      daysWithSales,
      remainingDays,
    };
  }, [currentMonthData, currentMonthKey]);

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
    const remainingToGoal = totalGoal - totalRealized;
    const dailyAverage = daysInfo.daysWithSales > 0 ? totalRealized / daysInfo.daysWithSales : 0;
    const projectedMonthEnd = Math.round(dailyAverage * daysInfo.totalDaysInMonth);
    const projectedPercent = totalGoal > 0 ? (projectedMonthEnd / totalGoal) * 100 : 0;

    return {
      totalGoal,
      totalRealized,
      percentAchieved,
      remainingToGoal,
      indicatorsWithGoal,
      indicatorsAchieved,
      dailyAverage,
      projectedMonthEnd,
      projectedPercent,
    };
  }, [localGoals, realizedByIndicator, daysInfo]);

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
      showToast('Metas por indicadores salvas com sucesso!', 'success');
    }, 500);
  };

  const handleClearGoals = () => {
    if (window.confirm(`Deseja realmente zerar as metas detalhadas para ${formatMonthLabel(currentMonthKey)}?`)) {
      setLocalGoals({});
      clearStoreGoals(currentMonthKey);
      showToast('Metas zeradas com sucesso.', 'info');
    }
  };

  return (
    <div
      id="meta-detalhada-indicadores-panel"
      className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all duration-300 space-y-4 p-5"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-zinc-900 uppercase tracking-tight">
                METAS POR INDICADORES DETALHADOS — {formatMonthLabel(currentMonthKey)}
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                {summary.indicatorsWithGoal > 0 ? `${summary.indicatorsWithGoal} com meta definida` : 'Planejamento'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Defina e acompanhe a meta individual de cada produto/serviço (GROSS, M-PLAY, RESIDENCIAIS, SERVIÇOS e PORTABILIDADES).
            </p>
          </div>
        </div>

        {/* Quick Action Toggle & Save */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors cursor-pointer border border-zinc-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-600" />
            <span>{isExpanded ? 'Recolher Indicadores' : 'Expandir Indicadores (36)'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5 MACRO INDICATOR PILLARS (META TOTAL, REALIZADO, % ATINGIMENTO, GAP, PROJEÇÃO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Meta da Loja (Soma dos Indicadores) */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80">
          <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
            Meta Total da Loja
          </span>
          <div className="text-2xl font-black text-zinc-900 leading-tight">
            {summary.totalGoal}
            <span className="text-xs font-semibold text-zinc-500 ml-1">vendas</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-1">
            Soma dos {summary.indicatorsWithGoal} indicadores
          </span>
        </div>

        {/* 2. Realizado */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80">
          <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
            Realizado Geral
          </span>
          <div className="text-2xl font-black text-zinc-900 leading-tight">
            {summary.totalRealized}
            <span className="text-xs font-semibold text-zinc-500 ml-1">vendas</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-1">
            {summary.totalGoal > 0 && summary.totalRealized >= summary.totalGoal
              ? '🎉 Meta da Loja atingida!'
              : `${daysInfo.daysWithSales} dias com vendas`}
          </span>
        </div>

        {/* 3. % de Atingimento */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80">
          <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
            % Atingimento Geral
          </span>
          <div
            className={`text-2xl font-black leading-tight ${
              summary.totalGoal === 0
                ? 'text-zinc-500'
                : summary.percentAchieved >= 100
                ? 'text-emerald-600'
                : summary.percentAchieved >= 75
                ? 'text-amber-600'
                : 'text-red-600'
            }`}
          >
            {summary.totalGoal > 0 ? `${summary.percentAchieved.toFixed(1)}%` : '—'}
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                summary.percentAchieved >= 100
                  ? 'bg-emerald-500'
                  : summary.percentAchieved >= 75
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, summary.percentAchieved))}%` }}
            />
          </div>
        </div>

        {/* 4. Gap para a Meta */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80">
          <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
            Gap Geral
          </span>
          <div className="text-lg font-black text-zinc-900 leading-tight">
            {summary.totalGoal === 0 ? (
              <span className="text-zinc-400 text-sm font-semibold">Defina as metas</span>
            ) : summary.remainingToGoal > 0 ? (
              <span className="text-amber-600">Faltam {summary.remainingToGoal}</span>
            ) : (
              <span className="text-emerald-600">+{Math.abs(summary.remainingToGoal)} batida</span>
            )}
          </div>
          <span className="text-[10px] text-zinc-500 block mt-1">
            {summary.totalGoal > 0 && summary.remainingToGoal > 0
              ? `${(summary.remainingToGoal / daysInfo.remainingDays).toFixed(1)}/dia restante`
              : summary.totalGoal > 0
              ? 'Superou a meta!'
              : 'Preencha abaixo'}
          </span>
        </div>

        {/* 5. Projeção do Mês */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/80 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
            Projeção do Mês
          </span>
          <div className="text-2xl font-black text-zinc-900 leading-tight">
            {summary.projectedMonthEnd}
            <span className="text-xs font-semibold text-zinc-500 ml-1">vendas</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-600 block mt-1">
            {summary.totalGoal > 0 ? `${summary.projectedPercent.toFixed(1)}% da meta` : 'Estimativa'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY BREAKDOWN SUMMARY BAR                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {categorySummaries.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              setSelectedCategoryTab(cat.id === selectedCategoryTab ? 'all' : cat.id);
              if (!isExpanded) setIsExpanded(true);
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCategoryTab === cat.id
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-zinc-50/90 hover:bg-zinc-100 border-zinc-200/80 text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span
                className={`text-[11px] font-black uppercase tracking-tight truncate ${
                  selectedCategoryTab === cat.id ? 'text-white' : 'text-zinc-800'
                }`}
              >
                {cat.name}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-1.5">
              <span className="text-xs font-medium opacity-80">
                Meta: <strong>{cat.goal}</strong>
              </span>
              <span
                className={`text-xs font-black ${
                  selectedCategoryTab === cat.id
                    ? 'text-emerald-300'
                    : cat.percent >= 100
                    ? 'text-emerald-600'
                    : 'text-zinc-900'
                }`}
              >
                {cat.realized} un
              </span>
            </div>
            <div className="w-full bg-zinc-200/50 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  backgroundColor: cat.color,
                  width: `${Math.min(100, Math.max(0, cat.percent))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* DETAILED INDICATORS GRID                                                  */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Controls Bar: Category Filter Tabs, Search & Bulk Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryTab === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-600 hover:bg-zinc-200/70 border border-zinc-200'
                }`}
              >
                Todos (36)
              </button>
              {categorySummaries.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategoryTab(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryTab === cat.id
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-zinc-600 hover:bg-zinc-200/70 border border-zinc-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      selectedCategoryTab === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {cat.realized}/{cat.goal}
                  </span>
                </button>
              ))}
            </div>

            {/* Search and Save All */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar indicador..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-xs"
                title="Salvar todas as metas"
              >
                {isSavingAll ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSavingAll ? 'Salvo!' : 'Salvar Metas'}</span>
              </button>

              {summary.totalGoal > 0 && (
                <button
                  type="button"
                  onClick={handleClearGoals}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Zerar metas do mês"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Detailed Categories and Indicators List */}
          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const catSummary = categorySummaries.find((c) => c.id === category.id);
              const catPercent = catSummary?.percent || 0;

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-2xs"
                >
                  {/* Category Header Bar */}
                  <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
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

                    {/* Category Totals */}
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

                  {/* Indicator Cards Grid */}
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
                          {/* Indicator Name Header */}
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
                                Meta:
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

          {/* Footer note */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
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

