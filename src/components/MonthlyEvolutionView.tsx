import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Award,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useSales } from '../context/SalesContext';
import { ALL_INDICATORS, CATEGORIES, CATEGORY_MAP } from '../data/categories';
import { formatMonthLabel } from '../utils/calculations';

export const MonthlyEvolutionView: React.FC = () => {
  const { database } = useSales();

  // All recorded month keys sorted chronologically
  const monthKeys = React.useMemo(() => {
    return Object.keys(database.months).sort();
  }, [database.months]);

  // Aggregate monthly totals by indicator and by category
  const monthlyData = React.useMemo(() => {
    const indicatorTotalsByMonth: Record<string, Record<string, number>> = {}; // indId -> monthKey -> total
    const categoryTotalsByMonth: Record<string, Record<string, number>> = {}; // catId -> monthKey -> total
    const grandTotalsByMonth: Record<string, number> = {}; // monthKey -> total

    monthKeys.forEach((mKey) => {
      grandTotalsByMonth[mKey] = 0;
      categoryTotalsByMonth[mKey] = {};
      CATEGORIES.forEach((c) => (categoryTotalsByMonth[mKey][c.id] = 0));
    });

    ALL_INDICATORS.forEach((ind) => {
      indicatorTotalsByMonth[ind.id] = {};
      monthKeys.forEach((mKey) => (indicatorTotalsByMonth[ind.id][mKey] = 0));
    });

    monthKeys.forEach((mKey) => {
      const mData = database.months[mKey];
      Object.values(mData?.days || {}).forEach((entry: any) => {
        Object.entries(entry?.values || {}).forEach(([indId, sMap]: [string, any]) => {
          const ind = ALL_INDICATORS.find((i) => i.id === indId);
          let sum = 0;
          Object.values(sMap || {}).forEach((q: any) => (sum += Number(q) || 0));

          if (sum > 0) {
            indicatorTotalsByMonth[indId][mKey] = (indicatorTotalsByMonth[indId][mKey] || 0) + sum;
            grandTotalsByMonth[mKey] += sum;
            if (ind) {
              categoryTotalsByMonth[mKey][ind.categoryId] = (categoryTotalsByMonth[mKey][ind.categoryId] || 0) + sum;
            }
          }
        });
      });
    });

    return { indicatorTotalsByMonth, categoryTotalsByMonth, grandTotalsByMonth };
  }, [database.months, monthKeys]);

  // Chart data formatted for Recharts
  const chartData = React.useMemo(() => {
    return monthKeys.map((mKey) => {
      const row: any = {
        month: formatMonthLabel(mKey),
        monthKey: mKey,
        Total: monthlyData.grandTotalsByMonth[mKey] || 0,
      };
      CATEGORIES.forEach((cat) => {
        row[cat.name] = monthlyData.categoryTotalsByMonth[mKey]?.[cat.id] || 0;
      });
      return row;
    });
  }, [monthKeys, monthlyData]);

  // Best and worst months
  const { bestMonth, worstMonth } = React.useMemo(() => {
    let best = { key: '', total: -1 };
    let worst = { key: '', total: Infinity };

    monthKeys.forEach((mKey) => {
      const val = monthlyData.grandTotalsByMonth[mKey] || 0;
      if (val > best.total) best = { key: mKey, total: val };
      if (val < worst.total && val > 0) worst = { key: mKey, total: val };
    });

    return {
      bestMonth: best.key ? { label: formatMonthLabel(best.key), total: best.total } : null,
      worstMonth: worst.key && worst.total !== Infinity ? { label: formatMonthLabel(worst.key), total: worst.total } : null,
    };
  }, [monthKeys, monthlyData]);

  return (
    <div id="monthly-evolution-view" className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl p-6 border-b-4 border-red-600 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/30 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            Histórico Comparativo
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            Evolução Mensal de Vendas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Acompanhamento e comparativo acumulado entre os meses cadastrados
          </p>
        </div>

        {/* Highlights: Best and Worst Month */}
        <div className="flex items-center gap-3">
          {bestMonth && (
            <div className="bg-zinc-800/90 border border-zinc-700 px-4 py-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Melhor Mês
              </span>
              <span className="text-sm sm:text-base font-black text-white">{bestMonth.label}</span>
              <span className="text-xs text-emerald-400 font-bold ml-1.5">({bestMonth.total} vendas)</span>
            </div>
          )}
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-600" />
              Comparativo de Vendas Totais por Mês
            </h3>
            <p className="text-xs text-zinc-500">Crescimento geral da loja</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
              <Tooltip
                formatter={(val: any, name: any) => [`${val} vendas`, name]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="Total" fill="#DC2626" radius={[6, 6, 0, 0]} />
              <Bar dataKey="GROSS" fill="#B91C1C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="RESIDENCIAIS" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="SERVIÇOS" fill="#D97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Monthly Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden w-full max-w-full">
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-600" />
            Matriz Completa de Indicadores por Mês
          </h3>
          <span className="text-xs font-bold text-zinc-500">
            {monthKeys.length} meses comparados
          </span>
        </div>

        <div className="overflow-x-auto w-full max-w-full overscroll-x-contain">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 text-[11px] uppercase tracking-wider font-extrabold border-b border-zinc-300">
                <th className="py-3 px-4 sticky left-0 bg-zinc-200 z-10 w-64 border-r border-zinc-300">
                  INDICADOR / CATEGORIA
                </th>
                {monthKeys.map((mKey) => (
                  <th key={mKey} className="py-3 px-3 text-center border-r border-zinc-200 min-w-[100px]">
                    {formatMonthLabel(mKey)}
                  </th>
                ))}
                {monthKeys.length >= 2 && (
                  <th className="py-3 px-3 text-center bg-zinc-800 text-white min-w-[100px]">
                    EVOLUÇÃO % (MoM)
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {CATEGORIES.map((cat) => (
                <React.Fragment key={cat.id}>
                  {/* Category Summary Row */}
                  <tr className="bg-zinc-200/90 font-black text-xs border-t-2 border-b border-zinc-300">
                    <td
                      className="py-2 px-4 uppercase tracking-wider sticky left-0 bg-zinc-200 z-10 border-r border-zinc-300"
                      style={{ color: cat.color }}
                    >
                      {cat.name}
                    </td>
                    {monthKeys.map((mKey) => (
                      <td key={mKey} className="py-2 px-3 text-center font-extrabold text-zinc-900 border-r border-zinc-200">
                        {monthlyData.categoryTotalsByMonth[mKey]?.[cat.id] || 0}
                      </td>
                    ))}
                    {monthKeys.length >= 2 && (
                      <td className="py-2 px-3 text-center font-bold text-zinc-900 bg-zinc-200">
                        {(() => {
                          const last = monthlyData.categoryTotalsByMonth[monthKeys[monthKeys.length - 1]]?.[cat.id] || 0;
                          const prev = monthlyData.categoryTotalsByMonth[monthKeys[monthKeys.length - 2]]?.[cat.id] || 0;
                          if (prev === 0) return '—';
                          const pct = Number((((last - prev) / prev) * 100).toFixed(1));
                          return (
                            <span className={pct >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                              {pct > 0 ? '+' : ''}{pct}%
                            </span>
                          );
                        })()}
                      </td>
                    )}
                  </tr>

                  {/* Indicator Rows */}
                  {cat.indicators.map((ind, indIdx) => {
                    const isEven = indIdx % 2 === 0;
                    return (
                      <tr
                        key={ind.id}
                        className={`border-b border-zinc-200/70 hover:bg-red-50/20 text-xs font-semibold ${
                          isEven ? 'bg-white' : 'bg-zinc-50/40'
                        }`}
                      >
                        <td className="py-2 px-4 sticky left-0 bg-white z-10 border-r border-zinc-200 text-zinc-800">
                          <span>{ind.name}</span>
                          {ind.subtitle && (
                            <span className="text-[10px] text-zinc-400 font-normal block">{ind.subtitle}</span>
                          )}
                        </td>

                        {monthKeys.map((mKey) => {
                          const val = monthlyData.indicatorTotalsByMonth[ind.id]?.[mKey] || 0;
                          return (
                            <td key={mKey} className="py-2 px-3 text-center border-r border-zinc-200 font-bold text-zinc-800">
                              {val > 0 ? val : '—'}
                            </td>
                          );
                        })}

                        {monthKeys.length >= 2 && (
                          <td className="py-2 px-3 text-center font-bold">
                            {(() => {
                              const last = monthlyData.indicatorTotalsByMonth[ind.id]?.[monthKeys[monthKeys.length - 1]] || 0;
                              const prev = monthlyData.indicatorTotalsByMonth[ind.id]?.[monthKeys[monthKeys.length - 2]] || 0;
                              if (prev === 0 && last === 0) return '—';
                              if (prev === 0 && last > 0) return <span className="text-emerald-600 font-bold">+100%</span>;
                              const pct = Number((((last - prev) / prev) * 100).toFixed(1));
                              return (
                                <span className={pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                  {pct > 0 ? '+' : ''}{pct}%
                                </span>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Bottom Grand Total Row */}
              <tr className="bg-zinc-900 text-white font-black text-xs border-t-2 border-red-600">
                <td className="py-3.5 px-4 uppercase tracking-wider sticky left-0 bg-zinc-900 z-10 border-r border-zinc-700">
                  TOTAL GERAL DA LOJA
                </td>
                {monthKeys.map((mKey) => (
                  <td key={mKey} className="py-3.5 px-3 text-center text-sm font-black text-red-400 border-r border-zinc-800">
                    {monthlyData.grandTotalsByMonth[mKey] || 0}
                  </td>
                ))}
                {monthKeys.length >= 2 && (
                  <td className="py-3.5 px-3 text-center text-sm font-black bg-red-600 text-white">
                    {(() => {
                      const last = monthlyData.grandTotalsByMonth[monthKeys[monthKeys.length - 1]] || 0;
                      const prev = monthlyData.grandTotalsByMonth[monthKeys[monthKeys.length - 2]] || 0;
                      if (prev === 0) return '—';
                      const pct = Number((((last - prev) / prev) * 100).toFixed(1));
                      return `${pct > 0 ? '+' : ''}${pct}%`;
                    })()}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
