import React, { useState } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { ALL_INDICATORS, CATEGORIES } from '../data/categories';
import {
  calculateIndicatorStats,
  calculateKPIStats,
  calculateSellerStats,
  formatDateBR,
  formatLongDateBR,
  formatMonthLabel
} from '../utils/calculations';
import { exportDailyReportPDF, exportMonthlyReportPDF } from '../utils/pdfExport';

export const ReportsView: React.FC = () => {
  const { database, selectedDate, setSelectedDate, filters, setFilters } = useSales();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');

  const currentMonthKey = selectedDate.substring(0, 7);
  const currentMonthData = database.months[currentMonthKey];
  const currentDailyEntry = currentMonthData?.days?.[selectedDate];
  const activeSellers = database.sellers.filter((s) => s.active);

  // Previous month data for monthly comparison
  const prevMonthKey = React.useMemo(() => {
    const [y, m] = currentMonthKey.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const pY = prevDate.getFullYear();
    const pM = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    return `${pY}-${pM}`;
  }, [currentMonthKey]);

  const prevMonthData = database.months[prevMonthKey];

  // Daily stats calculation
  const dailySellerTotals: Record<string, number> = {};
  activeSellers.forEach((s) => (dailySellerTotals[s.id] = 0));
  let dailyGrandTotal = 0;

  CATEGORIES.forEach((cat) => {
    cat.indicators.forEach((ind) => {
      activeSellers.forEach((s) => {
        const val = Number(currentDailyEntry?.values?.[ind.id]?.[s.id]) || 0;
        dailySellerTotals[s.id] += val;
        dailyGrandTotal += val;
      });
    });
  });

  const dailySellerRanking = activeSellers
    .map((s) => ({
      id: s.id,
      name: s.name,
      total: dailySellerTotals[s.id] || 0,
      share: dailyGrandTotal > 0 ? Number(((dailySellerTotals[s.id] / dailyGrandTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Monthly stats
  const monthlyKpis = calculateKPIStats(currentMonthData, database.sellers, {
    month: currentMonthKey,
    day: 'all',
    sellerId: 'all',
    categoryId: 'all',
    indicatorId: 'all',
  });

  const monthlySellerStats = calculateSellerStats(currentMonthData, database.sellers, {
    month: currentMonthKey,
    day: 'all',
    sellerId: 'all',
    categoryId: 'all',
    indicatorId: 'all',
  });

  const monthlyIndicatorStats = calculateIndicatorStats(currentMonthData, prevMonthData, database.sellers, {
    month: currentMonthKey,
    day: 'all',
    sellerId: 'all',
    categoryId: 'all',
    indicatorId: 'all',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (reportType === 'daily') {
      exportDailyReportPDF(selectedDate, currentDailyEntry, database.sellers, database.storeName);
    } else {
      exportMonthlyReportPDF(currentMonthKey, currentMonthData, prevMonthData, database.sellers, database.storeName);
    }
  };

  return (
    <div id="reports-view-container" className="space-y-6 pb-20">
      {/* Top Controls & Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Toggle Report Type */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
          <button
            id="btn-switch-daily-report"
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'daily'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Relatório Diário
          </button>
          <button
            id="btn-switch-monthly-report"
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'monthly'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Relatório Mensal Consolidado
          </button>
        </div>

        {/* Date / Month Picker based on type */}
        <div className="flex items-center gap-2">
          {reportType === 'daily' ? (
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-red-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-zinc-900 bg-transparent outline-hidden cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-red-600" />
              <select
                value={currentMonthKey}
                onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
                className="text-xs font-bold text-zinc-900 bg-transparent outline-hidden cursor-pointer"
              >
                {Object.keys(database.months)
                  .sort()
                  .reverse()
                  .map((mKey) => (
                    <option key={mKey} value={mKey}>
                      {formatMonthLabel(mKey)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Action Buttons: Print & Generate PDF */}
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR</span>
          </button>

          <button
            id="btn-generate-report-pdf"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>GERAR PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Paper Document Container */}
      <div
        id="printable-report-sheet"
        className="bg-white rounded-2xl border border-zinc-300 shadow-md p-6 sm:p-10 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="border-b-2 border-red-600 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-black uppercase text-red-600 tracking-wider">
              {database.storeName}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight uppercase">
              {reportType === 'daily'
                ? `Relatório Diário de Vendas • ${formatLongDateBR(selectedDate)}`
                : `Relatório Mensal Consolidado • ${formatMonthLabel(currentMonthKey)}`}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Emitido em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-zinc-400 block uppercase">Volume Total</span>
            <span className="text-2xl sm:text-3xl font-black text-red-600">
              {reportType === 'daily' ? dailyGrandTotal : monthlyKpis.totalSales}
            </span>
            <span className="text-[11px] text-zinc-500 font-medium block">vendas registradas</span>
          </div>
        </div>

        {reportType === 'daily' ? (
          /* DAILY REPORT CONTENT */
          <div className="space-y-6">
            {/* Daily KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Senhas Atendidas</span>
                <span className="text-lg font-black text-zinc-900">{currentDailyEntry?.passwordsCount || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total do Dia</span>
                <span className="text-lg font-black text-red-600">{dailyGrandTotal}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Top Vendedor</span>
                <span className="text-sm font-black text-zinc-900">
                  {dailySellerRanking[0]?.total > 0 ? `${dailySellerRanking[0].name} (${dailySellerRanking[0].total})` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Equipe Ativa</span>
                <span className="text-sm font-bold text-zinc-700">{activeSellers.length} vendedores</span>
              </div>
            </div>

            {/* Daily Seller Ranking */}
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-red-700">
                <Award className="w-3.5 h-3.5" /> Ranking do Dia
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {dailySellerRanking.map((s, idx) => (
                  <div key={s.id} className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50">
                    <span className="text-[10px] font-bold text-zinc-400 block">{idx + 1}º Lugar</span>
                    <span className="text-xs font-black text-zinc-900 truncate block">{s.name}</span>
                    <span className="text-xs font-extrabold text-red-600">{s.total} vendas</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Category & Indicator Breakdown for Day */}
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-red-700">
                <Layers className="w-3.5 h-3.5" /> Detalhamento por Indicador e Vendedor
              </h3>
              <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-700 font-extrabold text-[10px] uppercase border-b border-zinc-200">
                      <th className="py-2 px-3">Indicador</th>
                      {activeSellers.map((s) => (
                        <th key={s.id} className="py-2 px-1 text-center">{s.name}</th>
                      ))}
                      <th className="py-2 px-2 text-center bg-zinc-800 text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORIES.map((cat) => {
                      let catTotal = 0;
                      return (
                        <React.Fragment key={cat.id}>
                          <tr className="bg-zinc-100/90 font-black text-[11px] border-t-2 border-b border-zinc-200">
                            <td className="py-1.5 px-3 uppercase tracking-wider" style={{ color: cat.color }}>
                              {cat.name}
                            </td>
                            <td colSpan={activeSellers.length + 1}></td>
                          </tr>
                          {cat.indicators.map((ind) => {
                            let indSum = 0;
                            return (
                              <tr key={ind.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                                <td className="py-1 px-3 text-[11px] font-semibold text-zinc-800">
                                  {ind.name} {ind.subtitle && <span className="text-[10px] text-zinc-400 font-normal">{ind.subtitle}</span>}
                                </td>
                                {activeSellers.map((s) => {
                                  const qty = Number(currentDailyEntry?.values?.[ind.id]?.[s.id]) || 0;
                                  indSum += qty;
                                  return (
                                    <td key={s.id} className="py-1 px-1 text-center text-zinc-700">
                                      {qty > 0 ? qty : '0'}
                                    </td>
                                  );
                                })}
                                <td className="py-1 px-2 text-center font-bold text-zinc-900 bg-zinc-50">
                                  {indSum}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Category Total Row */}
                          <tr className="bg-zinc-200/90 font-black text-[11px] border-t border-b-2 border-zinc-300">
                            <td className="py-1.5 px-3 uppercase" style={{ color: cat.color }}>
                              TOTAL {cat.name}
                            </td>
                            {activeSellers.map((s) => {
                              let sellerCatSum = 0;
                              cat.indicators.forEach((ind) => {
                                sellerCatSum += Number(currentDailyEntry?.values?.[ind.id]?.[s.id]) || 0;
                              });
                              catTotal += sellerCatSum;
                              return (
                                <td key={s.id} className="py-1.5 px-1 text-center font-bold text-zinc-900">
                                  {sellerCatSum}
                                </td>
                              );
                            })}
                            <td className="py-1.5 px-2 text-center font-black bg-zinc-300 text-zinc-950">
                              {cat.indicators.reduce((acc, ind) => {
                                let sum = 0;
                                activeSellers.forEach((s) => {
                                  sum += Number(currentDailyEntry?.values?.[ind.id]?.[s.id]) || 0;
                                });
                                return acc + sum;
                              }, 0)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Grand Total Row */}
                    <tr className="bg-zinc-900 text-white font-black text-xs border-t-2 border-red-600">
                      <td className="py-2.5 px-3 uppercase">TOTAL GERAL DO DIA</td>
                      {activeSellers.map((s) => {
                        let sSum = 0;
                        ALL_INDICATORS.forEach((ind) => {
                          sSum += Number(currentDailyEntry?.values?.[ind.id]?.[s.id]) || 0;
                        });
                        return (
                          <td key={s.id} className="py-2.5 px-1 text-center text-red-300 font-bold">
                            {sSum}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-2 text-center bg-red-600 text-white font-black text-sm">
                        {dailyGrandTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* MONTHLY CONSOLIDATED REPORT CONTENT */
          <div className="space-y-6">
            {/* Monthly KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total do Mês</span>
                <span className="text-xl font-black text-red-600">{monthlyKpis.totalSales}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Média Diária</span>
                <span className="text-xl font-black text-zinc-900">{monthlyKpis.dailyAverage.toFixed(1)}/dia</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Projeção Fechamento</span>
                <span className="text-xl font-black text-amber-600">~{monthlyKpis.projectedMonthEnd}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Top Vendedor</span>
                <span className="text-sm font-black text-zinc-900">
                  {monthlyKpis.bestSeller ? `${monthlyKpis.bestSeller.name} (${monthlyKpis.bestSeller.total})` : '—'}
                </span>
              </div>
            </div>

            {/* Monthly Seller Ranking Table */}
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-red-700">
                <Award className="w-3.5 h-3.5" /> 1. Ranking e Resultado por Vendedor (Acumulado)
              </h3>
              <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-700 font-extrabold text-[10px] uppercase border-b border-zinc-200">
                      <th className="py-2 px-3 text-center">Pos</th>
                      <th className="py-2 px-3">Vendedor</th>
                      <th className="py-2 px-2 text-center font-black">Total</th>
                      <th className="py-2 px-2 text-center">Part %</th>
                      <th className="py-2 px-2 text-center">Média/Dia</th>
                      <th className="py-2 px-3">Top Produto</th>
                      <th className="py-2 px-2 text-center">Gross</th>
                      <th className="py-2 px-2 text-center">Fibra</th>
                      <th className="py-2 px-2 text-center">Serviços</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySellerStats.map((s, idx) => (
                      <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="py-1.5 px-3 text-center font-black text-zinc-500">{idx + 1}º</td>
                        <td className="py-1.5 px-3 font-bold text-zinc-900">{s.name}</td>
                        <td className="py-1.5 px-2 text-center font-black text-red-600">{s.total}</td>
                        <td className="py-1.5 px-2 text-center font-semibold text-zinc-600">{s.share}%</td>
                        <td className="py-1.5 px-2 text-center font-semibold text-zinc-600">{s.dailyAverage}</td>
                        <td className="py-1.5 px-3 text-zinc-700 truncate max-w-[140px]">{s.topIndicator}</td>
                        <td className="py-1.5 px-2 text-center text-zinc-700">{s.categoryBreakdown['gross'] || 0}</td>
                        <td className="py-1.5 px-2 text-center text-zinc-700">{s.categoryBreakdown['residenciais'] || 0}</td>
                        <td className="py-1.5 px-2 text-center text-zinc-700">{s.categoryBreakdown['servicos'] || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Indicator Table */}
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-red-700">
                <Layers className="w-3.5 h-3.5" /> 2. Principais Indicadores do Mês
              </h3>
              <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-700 font-extrabold text-[10px] uppercase border-b border-zinc-200">
                      <th className="py-2 px-3">Indicador</th>
                      <th className="py-2 px-3">Categoria</th>
                      <th className="py-2 px-2 text-center font-black">Total</th>
                      <th className="py-2 px-2 text-center">Média/Dia</th>
                      <th className="py-2 px-3">Melhor Vendedor</th>
                      <th className="py-2 px-2 text-center">Evolução MoM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyIndicatorStats.slice(0, 15).map((ind) => (
                      <tr key={ind.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="py-1.5 px-3 font-bold text-zinc-900">{ind.name}</td>
                        <td className="py-1.5 px-3 text-zinc-500 font-medium">{ind.categoryName}</td>
                        <td className="py-1.5 px-2 text-center font-black text-red-600">{ind.total}</td>
                        <td className="py-1.5 px-2 text-center text-zinc-600">{ind.dailyAverage}</td>
                        <td className="py-1.5 px-3 text-zinc-700">
                          {ind.bestSeller ? `${ind.bestSeller.name} (${ind.bestSeller.total})` : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold">
                          {ind.growthVsPreviousMonth !== undefined ? (
                            <span className={ind.growthVsPreviousMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {ind.growthVsPreviousMonth > 0 ? '+' : ''}{ind.growthVsPreviousMonth}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
