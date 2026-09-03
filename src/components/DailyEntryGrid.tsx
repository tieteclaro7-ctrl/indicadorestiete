import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Calendar,
  Printer,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Hash,
  AlertTriangle,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSales } from '../context/SalesContext';
import { ALL_INDICATORS, CATEGORIES, DEFAULT_SELLERS } from '../data/categories';
import { formatDateBR, formatLongDateBR, formatMonthLabel } from '../utils/calculations';
import { exportDailyReportPDF } from '../utils/pdfExport';

export const DailyEntryGrid: React.FC = () => {
  const {
    database,
    selectedDate,
    setSelectedDate,
    currentDailyEntry,
    updateCellValue,
    updatePasswordsCount,
    saveDailyEntry,
    clearDailyEntry,
    updateSellerName,
    showToast,
    setActiveTab,
    syncStatus,
    lastSyncTime,
    manualSync,
  } = useSales();

  const [isSaving, setIsSaving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Maintain all 11 official team sellers permanently without losing or altering any seller columns
  const activeSellers = React.useMemo(() => {
    const list = database.sellers && database.sellers.length > 0 ? database.sellers : DEFAULT_SELLERS;
    const sellerMap = new Map<string, any>();
    DEFAULT_SELLERS.forEach((s) => sellerMap.set(s.id, { ...s, active: true }));
    list.forEach((s) => {
      if (s && s.id) {
        const def = sellerMap.get(s.id);
        sellerMap.set(s.id, {
          id: s.id,
          name: s.name || def?.name || s.id,
          active: true,
        });
      }
    });
    return Array.from(sellerMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [database.sellers]);

  // Real-time calculation of row totals, column totals, and grand total
  // Note: Category subtotals (TOTAL GROSS, TOTAL M-PLAY, etc.) are computed separately
  // and MUST NOT be added into the bottom vertical column totals or grand total (preventing double-counting).
  const { rowTotals, columnTotals, categoryTotals, categorySellerTotals, grandTotal } = React.useMemo(() => {
    const rTotals: Record<string, number> = {};
    const cTotals: Record<string, number> = {};
    const catTotals: Record<string, number> = {};
    const catSellerTotals: Record<string, Record<string, number>> = {};
    let gTotal = 0;

    activeSellers.forEach((s) => {
      cTotals[s.id] = 0;
    });
    ALL_INDICATORS.forEach((i) => (rTotals[i.id] = 0));
    CATEGORIES.forEach((c) => {
      catTotals[c.id] = 0;
      catSellerTotals[c.id] = {};
      activeSellers.forEach((s) => {
        catSellerTotals[c.id][s.id] = 0;
      });
    });

    CATEGORIES.forEach((cat) => {
      cat.indicators.forEach((ind) => {
        let indSum = 0;
        activeSellers.forEach((s) => {
          const val = Number(currentDailyEntry.values?.[ind.id]?.[s.id]) || 0;
          indSum += val;
          // Sum individual indicator values only for the vertical column totals
          cTotals[s.id] = (cTotals[s.id] || 0) + val;
          catSellerTotals[cat.id][s.id] = (catSellerTotals[cat.id][s.id] || 0) + val;
          gTotal += val;
        });
        rTotals[ind.id] = indSum;
        catTotals[cat.id] = (catTotals[cat.id] || 0) + indSum;
      });
    });

    return { rowTotals: rTotals, columnTotals: cTotals, categoryTotals: catTotals, categorySellerTotals: catSellerTotals, grandTotal: gTotal };
  }, [currentDailyEntry, activeSellers]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveDailyEntry();
      if (result.success) {
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.8 },
          });
        } catch (e) {
          // ignore
        }
        showToast(
          `Lançamento do dia ${selectedDate.split('-').reverse().join('/')} salvo e sincronizado com o servidor com sucesso!`,
          'success'
        );
      } else {
        showToast(result.error || 'Erro ao sincronizar com o servidor compartilhado.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro inesperado ao salvar lançamento.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedDate(now.toISOString().substring(0, 10));
  };

  return (
    <div id="daily-entry-view" className="space-y-4 pb-16">
      {/* Top Controls Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Date Selector Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200">
            <button
              onClick={handlePrevDay}
              title="Dia anterior"
              className="p-1.5 hover:bg-white rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              id="daily-grid-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 text-xs sm:text-sm font-bold text-zinc-800 bg-transparent outline-hidden cursor-pointer"
            />
            <button
              onClick={handleNextDay}
              title="Próximo dia"
              className="p-1.5 hover:bg-white rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 cursor-pointer"
          >
            Hoje
          </button>

          {/* Senhas Input */}
          <div className="flex items-center gap-2 bg-red-50/70 border border-red-200 px-3 py-1 rounded-xl">
            <Hash className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs font-bold text-red-900">SENHAS:</span>
            <input
              id="daily-passwords-input"
              type="text"
              placeholder="Ex: 58"
              value={currentDailyEntry.passwordsCount || ''}
              onChange={(e) => updatePasswordsCount(e.target.value)}
              className="w-16 bg-white border border-red-300 rounded px-2 py-0.5 text-xs font-bold text-zinc-900 outline-hidden focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Action Buttons: Save, PDF, Clear */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync Status Badge */}
          <button
            type="button"
            onClick={manualSync}
            title="Clique para forçar sincronização manual agora"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-zinc-50 hover:bg-zinc-100"
          >
            {syncStatus === 'synced' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-bold">🟢 SINCRONIZADO</span>
              </>
            )}
            {syncStatus === 'syncing' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="text-amber-700 font-bold">SINCRONIZANDO...</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700 font-bold">🔴 SEM CONEXÃO</span>
              </>
            )}
          </button>

          <button
            id="btn-print-daily-pdf"
            onClick={() => exportDailyReportPDF(selectedDate, currentDailyEntry, database.sellers, database.storeName)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-zinc-600" />
            <span>Gerar PDF</span>
          </button>

          <button
            id="btn-clear-daily-entry"
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 hover:bg-red-50 hover:text-red-700 text-zinc-600 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zerar Dia</span>
          </button>

          <button
            id="btn-save-daily-entry"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando no servidor...' : 'SALVAR DIA'}</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Header Card */}
      <div className="bg-zinc-900 text-white rounded-t-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-red-600">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">
              DIÁRIO DE VENDAS — TIETÊ PLAZA
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            DATA: <strong className="text-white">{formatLongDateBR(selectedDate)}</strong> • SENHAS ATENDIDAS: <strong className="text-white">{currentDailyEntry.passwordsCount || '—'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-800/80 px-4 py-2 rounded-xl border border-zinc-700">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Total do Dia:</span>
          <span className="text-xl sm:text-2xl font-black text-red-400">{grandTotal}</span>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-zinc-200 shadow-sm overflow-x-auto w-full max-w-full overscroll-x-contain">
        <table id="daily-sales-grid-table" className="w-full text-left border-collapse min-w-[900px]">
          {/* Table Header: Column Sellers */}
          <thead>
            <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300 text-[11px] uppercase tracking-wider font-extrabold">
              <th className="py-2.5 px-3 sticky left-0 bg-zinc-200 z-10 w-64 border-r border-zinc-300">
                INDICADOR / PRODUTO
              </th>
              {activeSellers.map((seller) => (
                <th
                  key={seller.id}
                  className="py-2.5 px-2 text-center border-r border-zinc-200 min-w-[70px] select-none"
                >
                  <div className="flex items-center justify-center py-1">
                    <span className="truncate font-extrabold text-[11px] text-zinc-800 tracking-wider">
                      {seller.name}
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 text-center bg-zinc-800 text-white font-black w-24 sticky right-0 z-10">
                TOTAL
              </th>
            </tr>
          </thead>

          <tbody>
            {CATEGORIES.map((category) => (
              <React.Fragment key={category.id}>
                {/* Category Header Row */}
                <tr className="bg-zinc-100/90 border-t-2 border-b border-zinc-300 font-black text-xs">
                  <td
                    colSpan={activeSellers.length + 2}
                    className="py-2 px-3 uppercase tracking-wider sticky left-0 z-10 border-r border-zinc-300"
                    style={{ color: category.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black tracking-wide text-xs">{category.name}</span>
                      <span className="text-[10px] font-bold text-zinc-500 bg-white/80 px-2 py-0.5 rounded-full border border-zinc-200">
                        {category.indicators.length} {category.indicators.length === 1 ? 'indicador' : 'indicadores'}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Category Indicators Rows */}
                {category.indicators.map((indicator, indIdx) => {
                  const isEven = indIdx % 2 === 0;
                  const rowSum = rowTotals[indicator.id] || 0;

                  return (
                    <tr
                      key={indicator.id}
                      className={`border-b border-zinc-200/70 hover:bg-red-50/30 transition-colors ${
                        isEven ? 'bg-white' : 'bg-zinc-50/50'
                      }`}
                    >
                      {/* Indicator Title Cell */}
                      <td className="py-1.5 px-3 text-xs font-bold text-zinc-800 sticky left-0 bg-white z-10 border-r border-zinc-200">
                        <div className="flex flex-col">
                          <span>{indicator.name}</span>
                          {indicator.subtitle && (
                            <span className="text-[10px] text-zinc-400 font-normal">{indicator.subtitle}</span>
                          )}
                        </div>
                      </td>

                      {/* Editable Cells per Seller */}
                      {activeSellers.map((seller) => {
                        const cellVal = currentDailyEntry.values?.[indicator.id]?.[seller.id] ?? '';
                        const hasVal = cellVal !== '' && cellVal !== 0 && cellVal !== '0';

                        return (
                          <td
                            key={seller.id}
                            className={`py-0.5 px-1 text-center border-r border-zinc-200/80 ${
                              hasVal ? 'bg-red-50/60 font-black' : ''
                            }`}
                          >
                            <input
                              type="number"
                              min="0"
                              max="999"
                              value={cellVal === 0 ? '' : cellVal}
                              placeholder=""
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                updateCellValue(indicator.id, seller.id, val);
                              }}
                              className="w-full text-center py-1 rounded text-xs font-bold text-zinc-900 bg-transparent outline-hidden hover:bg-white focus:bg-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td
                        className={`py-1.5 px-2 text-center text-xs font-black sticky right-0 z-10 border-l border-zinc-200 ${
                          rowSum > 0 ? 'bg-red-100 text-red-900' : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {rowSum}
                      </td>
                    </tr>
                  );
                })}

                {/* Session Total Row: TOTAL GROSS, TOTAL M-PLAY, etc. */}
                <tr className="bg-zinc-200/90 border-t border-b-2 border-zinc-300 font-black text-xs">
                  <td
                    className="py-2 px-3 uppercase tracking-wider sticky left-0 bg-zinc-200 z-10 border-r border-zinc-300 font-extrabold"
                    style={{ color: category.color }}
                  >
                    TOTAL {category.name}
                  </td>
                  {activeSellers.map((seller) => {
                    const sellerCatSum = categorySellerTotals[category.id]?.[seller.id] || 0;
                    return (
                      <td
                        key={seller.id}
                        className={`py-1.5 px-1.5 text-center text-xs font-black border-r border-zinc-300 ${
                          sellerCatSum > 0 ? 'text-zinc-900 bg-zinc-200/60' : 'text-zinc-400'
                        }`}
                      >
                        {sellerCatSum}
                      </td>
                    );
                  })}
                  <td
                    className="py-2 px-2 text-center text-xs font-black bg-zinc-300 text-zinc-950 sticky right-0 z-10 border-l border-zinc-300"
                  >
                    {categoryTotals[category.id] || 0}
                  </td>
                </tr>
              </React.Fragment>
            ))}

            {/* Bottom Total Row */}
            <tr className="bg-zinc-900 text-white font-black text-xs border-t-2 border-red-600">
              <td className="py-3 px-3 uppercase tracking-wider sticky left-0 bg-zinc-900 z-10 border-r border-zinc-700">
                TOTAL GERAL DO DIA
              </td>
              {activeSellers.map((seller) => {
                const sTotal = columnTotals[seller.id] || 0;
                return (
                  <td
                    key={seller.id}
                    className="py-3 px-1.5 text-center text-sm font-black border-r border-zinc-800 text-red-400"
                  >
                    {sTotal}
                  </td>
                );
              })}
              <td className="py-3 px-3 text-center text-base sm:text-lg font-black bg-red-600 text-white sticky right-0 z-10">
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Quick guide notes & instructions */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>Dica de Uso:</strong> Digite as quantidades diretamente nas células. O sistema calcula totais em tempo real. Clique em <strong>SALVAR DIA</strong> para armazenar no navegador.
          </span>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 transition-colors cursor-pointer shrink-0"
        >
          Salvar Alterações
        </button>
      </div>

      {/* Confirmation Modal to Clear Day */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowClearModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Zerar Lançamentos do Dia?
            </h3>
            <p className="text-sm text-zinc-600 mb-6">
              Tem certeza que deseja zerar todos os lançamentos do dia <strong>{formatDateBR(selectedDate)}</strong>? Todas as quantidades inseridas na tabela deste dia serão limpas.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await clearDailyEntry();
                  setShowClearModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sim, Zerar Tabela</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
