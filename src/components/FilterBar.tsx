import React from 'react';
import { Filter, RotateCcw, Calendar, User, Tag, Layers } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { ALL_INDICATORS, CATEGORIES } from '../data/categories';
import { formatMonthLabel } from '../utils/calculations';

export const FilterBar: React.FC = () => {
  const { database, filters, setFilters, resetFilters } = useSales();

  // Extract all existing months in database plus current
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>(Object.keys(database.months));
    set.add(filters.month);
    return Array.from(set).sort().reverse();
  }, [database.months, filters.month]);

  // Extract all days for the selected month
  const availableDays = React.useMemo(() => {
    const monthData = database.months[filters.month];
    if (!monthData || !monthData.days) return [];
    return Object.keys(monthData.days).sort();
  }, [database.months, filters.month]);

  // Filter indicators by selected category if category is picked
  const filteredIndicators = React.useMemo(() => {
    if (filters.categoryId === 'all') return ALL_INDICATORS;
    return ALL_INDICATORS.filter((i) => i.categoryId === filters.categoryId);
  }, [filters.categoryId]);

  const activeSellers = database.sellers.filter((s) => s.active);

  const hasActiveFilters =
    filters.day !== 'all' ||
    filters.sellerId !== 'all' ||
    filters.categoryId !== 'all' ||
    filters.indicatorId !== 'all';

  return (
    <div id="filter-bar-container" className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-xs mb-6">
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-100">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700">
          <Filter className="w-4 h-4 text-red-600" />
          <span>Filtros do Painel</span>
        </div>
        {hasActiveFilters && (
          <button
            id="btn-reset-filters"
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Month Selector */}
        <div>
          <label htmlFor="filter-month-select" className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
            Mês
          </label>
          <div className="relative">
            <select
              id="filter-month-select"
              value={filters.month}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  month: e.target.value,
                  day: 'all', // Reset day when month changes
                }))
              }
              className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-hidden transition-all cursor-pointer"
            >
              {availableMonths.map((mKey) => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day Selector */}
        <div>
          <label htmlFor="filter-day-select" className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
            Dia Específico
          </label>
          <select
            id="filter-day-select"
            value={filters.day}
            onChange={(e) => setFilters((prev) => ({ ...prev, day: e.target.value }))}
            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-hidden transition-all cursor-pointer"
          >
            <option value="all">Mês Todo (Acumulado)</option>
            {availableDays.map((dStr) => {
              const dayNum = dStr.split('-')[2];
              return (
                <option key={dStr} value={dStr}>
                  Dia {dayNum} ({dStr.split('-').reverse().join('/')})
                </option>
              );
            })}
          </select>
        </div>

        {/* Seller Selector */}
        <div>
          <label htmlFor="filter-seller-select" className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
            Vendedor
          </label>
          <select
            id="filter-seller-select"
            value={filters.sellerId}
            onChange={(e) => setFilters((prev) => ({ ...prev, sellerId: e.target.value }))}
            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-hidden transition-all cursor-pointer"
          >
            <option value="all">Todos os Vendedores ({activeSellers.length})</option>
            {activeSellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div>
          <label htmlFor="filter-category-select" className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
            Categoria
          </label>
          <select
            id="filter-category-select"
            value={filters.categoryId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                categoryId: e.target.value,
                indicatorId: 'all', // Reset indicator when category changes
              }))
            }
            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-hidden transition-all cursor-pointer"
          >
            <option value="all">Todas as Categorias ({CATEGORIES.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Indicator Selector */}
        <div>
          <label htmlFor="filter-indicator-select" className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
            Indicador / Produto
          </label>
          <select
            id="filter-indicator-select"
            value={filters.indicatorId}
            onChange={(e) => setFilters((prev) => ({ ...prev, indicatorId: e.target.value }))}
            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-hidden transition-all cursor-pointer"
          >
            <option value="all">Todos os Indicadores ({filteredIndicators.length})</option>
            {filteredIndicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
