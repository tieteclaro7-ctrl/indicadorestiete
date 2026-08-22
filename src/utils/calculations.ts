import { ALL_INDICATORS, CATEGORIES, CATEGORY_MAP, INDICATOR_MAP } from '../data/categories';
import { DailyEntry, FilterState, IndicatorStat, KPIStats, MonthData, Seller, SellerStat } from '../types';

export const MONTH_NAMES: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
};

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[month] || month} / ${year}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatLongDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const mName = MONTH_NAMES[month]?.toLowerCase() || month;
  return `${parseInt(day, 10)} de ${mName} de ${year}`;
}

export function getDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

/**
 * Filter entries according to active filter state
 */
export function getFilteredDailyEntries(
  monthData: MonthData | undefined,
  filters: FilterState
): DailyEntry[] {
  if (!monthData || !monthData.days) return [];
  const entries = Object.values(monthData.days);

  if (filters.day && filters.day !== 'all') {
    return entries.filter((e) => e.date === filters.day);
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Computes all sales KPI metrics for a given month or day
 */
export function calculateKPIStats(
  monthData: MonthData | undefined,
  sellers: Seller[],
  filters: FilterState
): KPIStats {
  const entries = getFilteredDailyEntries(monthData, filters);
  const activeSellers = sellers.filter((s) => s.active);
  const activeSellerIds = new Set(activeSellers.map((s) => s.id));

  let totalSales = 0;
  const sellerTotals: Record<string, number> = {};
  const indicatorTotals: Record<string, number> = {};

  activeSellers.forEach((s) => (sellerTotals[s.id] = 0));
  ALL_INDICATORS.forEach((i) => (indicatorTotals[i.id] = 0));

  entries.forEach((entry) => {
    Object.entries(entry.values || {}).forEach(([indId, sellerMap]) => {
      // Check category filter
      const ind = INDICATOR_MAP.get(indId);
      if (filters.categoryId !== 'all' && ind?.categoryId !== filters.categoryId) {
        return;
      }
      // Check indicator filter
      if (filters.indicatorId !== 'all' && indId !== filters.indicatorId) {
        return;
      }

      Object.entries(sellerMap || {}).forEach(([sellerId, qty]) => {
        if (!activeSellerIds.has(sellerId)) return;
        if (filters.sellerId !== 'all' && sellerId !== filters.sellerId) return;

        const val = Number(qty) || 0;
        if (val > 0) {
          totalSales += val;
          sellerTotals[sellerId] = (sellerTotals[sellerId] || 0) + val;
          indicatorTotals[indId] = (indicatorTotals[indId] || 0) + val;
        }
      });
    });
  });

  const daysWithSales = entries.filter((e) => {
    let daySum = 0;
    Object.values(e.values || {}).forEach((sMap) => {
      Object.values(sMap || {}).forEach((q) => (daySum += Number(q) || 0));
    });
    return daySum > 0;
  }).length;

  const totalDaysInMonth = getDaysInMonth(filters.month);
  const divisor = daysWithSales > 0 ? daysWithSales : 1;
  const dailyAverage = totalSales / divisor;
  const projectedMonthEnd = Math.round(dailyAverage * totalDaysInMonth);

  // Best seller
  let bestSeller: KPIStats['bestSeller'] = null;
  let maxSellerVal = -1;
  Object.entries(sellerTotals).forEach(([sId, val]) => {
    if (val > maxSellerVal) {
      maxSellerVal = val;
      const sObj = sellers.find((s) => s.id === sId);
      bestSeller = {
        name: sObj ? sObj.name : 'Vendedor',
        total: val,
        share: totalSales > 0 ? (val / totalSales) * 100 : 0,
      };
    }
  });

  // Best indicator
  let bestIndicator: KPIStats['bestIndicator'] = null;
  let maxIndVal = -1;
  Object.entries(indicatorTotals).forEach(([iId, val]) => {
    if (val > maxIndVal && val > 0) {
      maxIndVal = val;
      const indObj = INDICATOR_MAP.get(iId);
      bestIndicator = {
        name: indObj ? indObj.name : iId,
        total: val,
        category: indObj ? CATEGORY_MAP.get(indObj.categoryId)?.name || '' : '',
      };
    }
  });

  const activeIndicatorsCount = Object.values(indicatorTotals).filter((v) => v > 0).length;

  return {
    totalSales,
    activeIndicatorsCount,
    dailyAverage: Number(dailyAverage.toFixed(1)),
    bestSeller: maxSellerVal > 0 ? bestSeller : null,
    bestIndicator: maxIndVal > 0 ? bestIndicator : null,
    projectedMonthEnd,
    daysWithSales,
    totalDaysInMonth,
  };
}

/**
 * Computes rankings and statistics per seller
 */
export function calculateSellerStats(
  monthData: MonthData | undefined,
  sellers: Seller[],
  filters: FilterState
): SellerStat[] {
  const entries = getFilteredDailyEntries(monthData, { ...filters, sellerId: 'all' });
  const activeSellers = sellers.filter((s) => s.active);

  const stats: Record<string, { total: number; categories: Record<string, number>; indicators: Record<string, number> }> = {};
  activeSellers.forEach((s) => {
    stats[s.id] = { total: 0, categories: {}, indicators: {} };
    CATEGORIES.forEach((c) => (stats[s.id].categories[c.id] = 0));
  });

  let grandTotal = 0;

  entries.forEach((entry) => {
    Object.entries(entry.values || {}).forEach(([indId, sMap]) => {
      const ind = INDICATOR_MAP.get(indId);
      if (filters.categoryId !== 'all' && ind?.categoryId !== filters.categoryId) return;
      if (filters.indicatorId !== 'all' && indId !== filters.indicatorId) return;

      Object.entries(sMap || {}).forEach(([sId, qty]) => {
        if (!stats[sId]) return;
        const val = Number(qty) || 0;
        if (val > 0) {
          stats[sId].total += val;
          grandTotal += val;
          if (ind) {
            stats[sId].categories[ind.categoryId] = (stats[sId].categories[ind.categoryId] || 0) + val;
          }
          stats[sId].indicators[indId] = (stats[sId].indicators[indId] || 0) + val;
        }
      });
    });
  });

  const daysCount = entries.length > 0 ? entries.length : 1;

  const result: SellerStat[] = activeSellers.map((seller) => {
    const sData = stats[seller.id];
    let topIndicatorName = 'Nenhum';
    let maxIndCount = 0;
    Object.entries(sData.indicators).forEach(([indId, count]) => {
      if (count > maxIndCount) {
        maxIndCount = count;
        topIndicatorName = INDICATOR_MAP.get(indId)?.name || indId;
      }
    });

    return {
      id: seller.id,
      name: seller.name,
      total: sData.total,
      share: grandTotal > 0 ? Number(((sData.total / grandTotal) * 100).toFixed(1)) : 0,
      dailyAverage: Number((sData.total / daysCount).toFixed(1)),
      topIndicator: topIndicatorName,
      categoryBreakdown: sData.categories,
    };
  });

  return result.sort((a, b) => b.total - a.total);
}

/**
 * Computes rankings and stats per indicator
 */
export function calculateIndicatorStats(
  monthData: MonthData | undefined,
  previousMonthData: MonthData | undefined,
  sellers: Seller[],
  filters: FilterState
): IndicatorStat[] {
  const entries = getFilteredDailyEntries(monthData, filters);
  const prevEntries = previousMonthData ? Object.values(previousMonthData.days || {}) : [];
  const activeSellers = sellers.filter((s) => s.active);
  const activeSellerIds = new Set(activeSellers.map((s) => s.id));

  const stats: Record<string, { total: number; sellers: Record<string, number> }> = {};
  const prevTotals: Record<string, number> = {};

  ALL_INDICATORS.forEach((ind) => {
    stats[ind.id] = { total: 0, sellers: {} };
    prevTotals[ind.id] = 0;
  });

  entries.forEach((entry) => {
    Object.entries(entry.values || {}).forEach(([indId, sMap]) => {
      if (!stats[indId]) return;
      Object.entries(sMap || {}).forEach(([sId, qty]) => {
        if (!activeSellerIds.has(sId)) return;
        if (filters.sellerId !== 'all' && sId !== filters.sellerId) return;
        const val = Number(qty) || 0;
        if (val > 0) {
          stats[indId].total += val;
          stats[indId].sellers[sId] = (stats[indId].sellers[sId] || 0) + val;
        }
      });
    });
  });

  prevEntries.forEach((entry) => {
    Object.entries(entry.values || {}).forEach(([indId, sMap]) => {
      if (prevTotals[indId] === undefined) return;
      Object.entries(sMap || {}).forEach(([sId, qty]) => {
        if (!activeSellerIds.has(sId)) return;
        if (filters.sellerId !== 'all' && sId !== filters.sellerId) return;
        const val = Number(qty) || 0;
        prevTotals[indId] += val;
      });
    });
  });

  const daysCount = entries.length > 0 ? entries.length : 1;

  const result: IndicatorStat[] = ALL_INDICATORS.map((ind) => {
    const sData = stats[ind.id];
    const cat = CATEGORY_MAP.get(ind.categoryId);

    let bestSeller: { name: string; total: number } | null = null;
    let maxSellerVal = 0;
    Object.entries(sData.sellers).forEach(([sId, count]) => {
      if (count > maxSellerVal) {
        maxSellerVal = count;
        const sObj = sellers.find((s) => s.id === sId);
        bestSeller = {
          name: sObj ? sObj.name : sId,
          total: count,
        };
      }
    });

    const prevVal = prevTotals[ind.id] || 0;
    let growth: number | undefined = undefined;
    if (prevVal > 0) {
      growth = Number((((sData.total - prevVal) / prevVal) * 100).toFixed(1));
    }

    return {
      id: ind.id,
      name: ind.name,
      subtitle: ind.subtitle,
      categoryId: ind.categoryId,
      categoryName: cat?.name || '',
      total: sData.total,
      dailyAverage: Number((sData.total / daysCount).toFixed(1)),
      bestSeller,
      sellerBreakdown: sData.sellers,
      growthVsPreviousMonth: growth,
    };
  });

  if (filters.categoryId !== 'all') {
    return result.filter((i) => i.categoryId === filters.categoryId);
  }
  return result.sort((a, b) => b.total - a.total);
}

/**
 * Category breakdown summary for pie/bar charts
 */
export function calculateCategoryBreakdown(
  monthData: MonthData | undefined,
  filters: FilterState
): { name: string; total: number; color: string; percentage: number }[] {
  const entries = getFilteredDailyEntries(monthData, filters);
  const totals: Record<string, number> = {};
  CATEGORIES.forEach((c) => (totals[c.id] = 0));

  let grandTotal = 0;
  entries.forEach((entry) => {
    Object.entries(entry.values || {}).forEach(([indId, sMap]) => {
      const ind = INDICATOR_MAP.get(indId);
      if (!ind) return;
      if (filters.indicatorId !== 'all' && indId !== filters.indicatorId) return;

      Object.entries(sMap || {}).forEach(([sId, qty]) => {
        if (filters.sellerId !== 'all' && sId !== filters.sellerId) return;
        const val = Number(qty) || 0;
        totals[ind.categoryId] = (totals[ind.categoryId] || 0) + val;
        grandTotal += val;
      });
    });
  });

  return CATEGORIES.map((cat) => ({
    name: cat.name,
    total: totals[cat.id] || 0,
    color: cat.color,
    percentage: grandTotal > 0 ? Number(((totals[cat.id] / grandTotal) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.total - a.total);
}

/**
 * Daily evolution timeline series for charts
 */
export function calculateDailyEvolution(
  monthData: MonthData | undefined,
  filters: FilterState
): { day: string; date: string; total: number; gross: number; residencia: number; servicos: number; portabilidade: number; mplay: number }[] {
  if (!monthData || !monthData.days) return [];

  const dayKeys = Object.keys(monthData.days).sort();
  return dayKeys.map((dateStr) => {
    const entry = monthData.days[dateStr];
    const [year, month, day] = dateStr.split('-');
    let total = 0;
    let gross = 0;
    let residencia = 0;
    let servicos = 0;
    let portabilidade = 0;
    let mplay = 0;

    Object.entries(entry?.values || {}).forEach(([indId, sMap]) => {
      const ind = INDICATOR_MAP.get(indId);
      if (filters.categoryId !== 'all' && ind?.categoryId !== filters.categoryId) return;
      if (filters.indicatorId !== 'all' && indId !== filters.indicatorId) return;

      Object.entries(sMap || {}).forEach(([sId, qty]) => {
        if (filters.sellerId !== 'all' && sId !== filters.sellerId) return;
        const val = Number(qty) || 0;
        total += val;
        if (ind?.categoryId === 'gross') gross += val;
        if (ind?.categoryId === 'residenciais') residencia += val;
        if (ind?.categoryId === 'servicos') servicos += val;
        if (ind?.categoryId === 'portabilidades') portabilidade += val;
        if (ind?.categoryId === 'mplay') mplay += val;
      });
    });

    return {
      day: `${day}/${month}`,
      date: dateStr,
      total,
      gross,
      residencia,
      servicos,
      portabilidade,
      mplay,
    };
  });
}
