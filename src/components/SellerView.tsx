import React, { useState } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  UserCheck,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3
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
  calculateCategoryBreakdown,
  calculateKPIStats,
  calculateSellerStats,
  formatMonthLabel
} from '../utils/calculations';
import { FilterBar } from './FilterBar';

export const SellerView: React.FC = () => {
  const { database, filters, setFilters } = useSales();
  const currentMonthData = database.months[filters.month];
  const activeSellers = database.sellers.filter((s) => s.active);

  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    filters.sellerId !== 'all' ? filters.sellerId : activeSellers[0]?.id || 's_alex'
  );

  const selectedSeller = activeSellers.find((s) => s.id === selectedSellerId) || activeSellers[0];

  const sellerStats = React.useMemo(() => {
    return calculateSellerStats(currentMonthData, database.sellers, { ...filters, sellerId: 'all' });
  }, [currentMonthData, database.sellers, filters]);

  const currentRankIndex = sellerStats.findIndex((s) => s.id === selectedSeller?.id);
  const currentSellerData = sellerStats[currentRankIndex] || {
    total: 0,
    share: 0,
    dailyAverage: 0,
    topIndicator: 'Nenhum',
    categoryBreakdown: {},
  };

  // Detailed indicators for the selected seller
  const sellerIndicators = React.useMemo(() => {
    if (!currentMonthData || !selectedSeller) return [];

    const totals: Record<string, number> = {};
    ALL_INDICATORS.forEach((ind) => (totals[ind.id] = 0));

    Object.values(currentMonthData.days || {}).forEach((entry: any) => {
      Object.entries(entry?.values || {}).forEach(([indId, sMap]: [string, any]) => {
        const val = Number(sMap?.[selectedSeller.id]) || 0;
        totals[indId] = (totals[indId] || 0) + val;
      });
    });

    return ALL_INDICATORS.map((ind) => {
      const cat = CATEGORY_MAP.get(ind.categoryId);
      return {
        id: ind.id,
        name: ind.name,
        subtitle: ind.subtitle,
        categoryId: ind.categoryId,
        categoryName: cat?.name || '',
        categoryColor: cat?.color || '#DC2626',
        total: totals[ind.id] || 0,
      };
    })
      .filter((i) => i.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [currentMonthData, selectedSeller]);

  // Daily evolution for the selected seller
  const sellerDailyEvolution = React.useMemo(() => {
    if (!currentMonthData || !selectedSeller) return [];

    const dayKeys = Object.keys(currentMonthData.days || {}).sort();
    return dayKeys.map((dStr) => {
      const entry = currentMonthData.days[dStr];
      const [year, month, day] = dStr.split('-');
      let daySum = 0;

      Object.values(entry.values || {}).forEach((sMap) => {
        daySum += Number(sMap?.[selectedSeller.id]) || 0;
      });

      return {
        day: `${day}/${month}`,
        date: dStr,
        vendas: daySum,
      };
    });
  }, [currentMonthData, selectedSeller]);

  // Monthly comparison for selected seller
  const sellerMonthlyComparison = React.useMemo(() => {
    if (!selectedSeller) return [];
    const allMonths = Object.keys(database.months).sort();

    return allMonths.map((mKey) => {
      const mData = database.months[mKey];
      let sum = 0;
      Object.values(mData?.days || {}).forEach((entry: any) => {
        Object.values(entry?.values || {}).forEach((sMap: any) => {
          sum += Number(sMap?.[selectedSeller.id]) || 0;
        });
      });

      return {
        month: formatMonthLabel(mKey),
        monthKey: mKey,
        total: sum,
      };
    });
  }, [database.months, selectedSeller]);

  const teamAverage = React.useMemo(() => {
    if (sellerStats.length === 0) return 0;
    const totalTeam = sellerStats.reduce((acc, s) => acc + s.total, 0);
    return Number((totalTeam / sellerStats.length).toFixed(1));
  }, [sellerStats]);

  return (
    <div id="seller-view-content" className="space-y-6 pb-12">
      {/* Seller Selector Carousel */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-red-600" />
            Selecione o Vendedor para Análise
          </span>
          <span className="text-xs font-bold text-red-600">
            {activeSellers.length} vendedores ativos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2">
          {activeSellers.map((seller, idx) => {
            const isSelected = seller.id === selectedSeller?.id;
            const stats = sellerStats.find((s) => s.id === seller.id);
            const rank = sellerStats.findIndex((s) => s.id === seller.id) + 1;

            return (
              <button
                key={seller.id}
                id={`btn-seller-card-${seller.id}`}
                onClick={() => {
                  setSelectedSellerId(seller.id);
                  setFilters((prev) => ({ ...prev, sellerId: seller.id }));
                }}
                className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400/40'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    #{rank}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-black ${
                      isSelected ? 'text-red-100' : 'text-zinc-500'
                    }`}
                  >
                    {stats?.total || 0}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-extrabold truncate w-full">{seller.name}</span>
                <span
                  className={`text-[10px] sm:text-[11px] font-medium mt-0.5 truncate w-full ${
                    isSelected ? 'text-red-100' : 'text-zinc-400'
                  }`}
                >
                  Méd: {stats?.dailyAverage || 0}/d
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Seller Profile & Stats */}
      {selectedSeller && (
        <>
          {/* Hero Banner for Seller */}
          <div className="bg-zinc-900 text-white rounded-2xl p-6 border-b-4 border-red-600 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-2xl font-black text-white shadow-md">
                {selectedSeller.name.substring(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                    {selectedSeller.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    {currentRankIndex + 1}º Lugar na Loja
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Desempenho no mês de <strong>{formatMonthLabel(filters.month)}</strong> • Participação de {currentSellerData.share}% do total da loja
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-zinc-800/80 p-3 rounded-xl border border-zinc-700">
              <div className="text-center px-2">
                <span className="block text-[10px] text-zinc-400 uppercase font-bold">Total Vendas</span>
                <span className="text-lg sm:text-xl font-black text-red-400">{currentSellerData.total}</span>
              </div>
              <div className="text-center px-2 border-x border-zinc-700">
                <span className="block text-[10px] text-zinc-400 uppercase font-bold">Média / Dia</span>
                <span className="text-lg sm:text-xl font-black text-white">{currentSellerData.dailyAverage}</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-[10px] text-zinc-400 uppercase font-bold">Média Equipe</span>
                <span className="text-lg sm:text-xl font-black text-zinc-300">{teamAverage}</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Evolução Diária do Vendedor */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-600" />
                    Evolução Diária de {selectedSeller.name}
                  </h3>
                  <p className="text-xs text-zinc-500">Vendas registradas por dia no mês</p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sellerDailyEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sellerArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#71717A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} vendas`, selectedSeller.name]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="vendas" stroke="#DC2626" strokeWidth={2.5} fill="url(#sellerArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Evolução Mensal do Vendedor */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Evolução Mensal de {selectedSeller.name}
                  </h3>
                  <p className="text-xs text-zinc-500">Comparativo histórico entre meses</p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sellerMonthlyComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} vendas`, 'Total']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" fill="#DC2626" radius={[6, 6, 0, 0]}>
                      {sellerMonthlyComparison.map((entry, index) => (
                        <Cell
                          key={`m-cell-${index}`}
                          fill={entry.monthKey === filters.month ? '#DC2626' : '#71717A'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Breakdown por Categoria & Lista de Indicadores do Vendedor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categorias do Vendedor */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                Vendas por Categoria
              </h3>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const catVal = currentSellerData.categoryBreakdown[cat.id] || 0;
                  const catPercent = currentSellerData.total > 0 ? (catVal / currentSellerData.total) * 100 : 0;

                  return (
                    <div key={cat.id} className="p-2.5 rounded-xl border border-zinc-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-zinc-800">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-zinc-900">{catVal}</span>
                          <span className="text-zinc-400 font-semibold text-[11px]">({catPercent.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(2, catPercent)}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista Completa dos Indicadores Vendidos pelo Vendedor */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  Todos os Indicadores de {selectedSeller.name}
                </h3>
                <span className="text-xs font-bold text-zinc-500">
                  {sellerIndicators.length} produtos pontuados
                </span>
              </div>

              {sellerIndicators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {sellerIndicators.map((ind, idx) => (
                    <div
                      key={ind.id}
                      className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-xs font-black text-zinc-600 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-extrabold text-zinc-900 block leading-tight">
                            {ind.name}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400">
                            {ind.categoryName} {ind.subtitle ? `• ${ind.subtitle}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-red-600">{ind.total}</span>
                        <span className="text-[10px] text-zinc-400 block font-medium">vendas</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  Nenhum produto registrado para {selectedSeller.name} neste período.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
