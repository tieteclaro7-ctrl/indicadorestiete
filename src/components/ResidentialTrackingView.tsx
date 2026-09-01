import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Printer,
  FileDown,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sun,
  Tv,
  Smartphone,
  Wifi,
  Calendar,
  Clock,
  User,
  Hash,
  AlertTriangle,
  X,
  Radio,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  ResidentialSale,
  ResidentialFilterState,
  ResidentialPeriod,
  YesNoOption,
  ResidentialStatus,
} from '../types';
import {
  getResidentialSales,
  saveResidentialSales,
  filterResidentialSales,
  calculateResidentialSummary,
  exportResidentialSalesJSON,
  importResidentialSalesJSON,
  formatCPF,
  formatContract,
  getNextResidentialStatus,
  PERIOD_OPTIONS,
  COMMON_RESIDENTIAL_SERVICES,
} from '../utils/residentialStorage';
import {
  fetchRemoteResidentialSales,
  pushRemoteResidentialSales,
  getLastSyncTime,
} from '../utils/syncService';
import { exportResidentialTrackingPDF } from '../utils/residentialPdf';
import { formatDateBR } from '../utils/calculations';
import { useSales } from '../context/SalesContext';

const INITIAL_FILTERS: ResidentialFilterState = {
  contract: '',
  cpf: '',
  installationDate: '',
  period: 'all',
  solar: 'all',
  mplay: 'all',
  secondPointVirtua: 'all',
  service: '',
  status: 'all',
};

export const ResidentialTrackingView: React.FC = () => {
  const { showToast, storeName } = useSales();
  const [sales, setSales] = useState<ResidentialSale[]>([]);
  const [filters, setFilters] = useState<ResidentialFilterState>(INITIAL_FILTERS);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<ResidentialSale | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ResidentialSale | null>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formContract, setFormContract] = useState<string>('');
  const [formInstallationDate, setFormInstallationDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [formPeriod, setFormPeriod] = useState<ResidentialPeriod>('8:00 às 12:00');
  const [formSolar, setFormSolar] = useState<YesNoOption>('NÃO');
  const [formMplay, setFormMplay] = useState<YesNoOption>('NÃO');
  const [formService, setFormService] = useState<string>('Fibra 500 Mega');
  const [formSecondPointVirtua, setFormSecondPointVirtua] = useState<YesNoOption>('NÃO');
  const [formCpf, setFormCpf] = useState<string>('');
  const [formStatus, setFormStatus] = useState<ResidentialStatus>('PENDENTE');
  const [formSellerName, setFormSellerName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Load sales with remote synchronization on mount and visibility change
  useEffect(() => {
    fetchRemoteResidentialSales().then(({ sales: loadedSales }) => {
      setSales(loadedSales);
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchRemoteResidentialSales().then(({ sales: refreshed }) => {
          setSales(refreshed);
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  // Save changes to localStorage and push to shared remote storage
  const updateSalesList = (newSales: ResidentialSale[]) => {
    setSales(newSales);
    pushRemoteResidentialSales(newSales).catch(() => {});
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return filterResidentialSales(sales, filters);
  }, [sales, filters]);

  // Dynamic summary metrics (computed from filtered or total)
  const summary = useMemo(() => {
    return calculateResidentialSummary(filteredSales);
  }, [filteredSales]);

  // Open modal for new sale
  const handleOpenNewModal = () => {
    setEditingSale(null);
    setFormContract('');
    setFormInstallationDate(new Date().toISOString().slice(0, 10));
    setFormPeriod('8:00 às 12:00');
    setFormSolar('NÃO');
    setFormMplay('NÃO');
    setFormService('Fibra 500 Mega');
    setFormSecondPointVirtua('NÃO');
    setFormCpf('');
    setFormStatus('PENDENTE');
    setFormSellerName('');
    setFormNotes('');
    setIsFormModalOpen(true);
  };

  // Open modal for editing sale
  const handleOpenEditModal = (sale: ResidentialSale) => {
    setEditingSale(sale);
    setFormContract(sale.contract);
    setFormInstallationDate(sale.installationDate);
    setFormPeriod(sale.period);
    setFormSolar(sale.solar);
    setFormMplay(sale.mplay);
    setFormService(sale.service);
    setFormSecondPointVirtua(sale.secondPointVirtua);
    setFormCpf(sale.cpf);
    setFormStatus(sale.status);
    setFormSellerName(sale.sellerName || '');
    setFormNotes(sale.notes || '');
    setIsFormModalOpen(true);
  };

  // Handle Save / Submit
  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formContract.trim()) {
      showToast('Por favor, informe o número do contrato.', 'error');
      return;
    }
    if (!formInstallationDate) {
      showToast('Por favor, selecione a data de instalação.', 'error');
      return;
    }

    const now = new Date().toISOString();

    if (editingSale) {
      // Update existing
      const updated = sales.map((item) => {
        if (item.id === editingSale.id) {
          return {
            ...item,
            contract: formatContract(formContract),
            installationDate: formInstallationDate,
            period: formPeriod,
            solar: formSolar,
            mplay: formMplay,
            service: formService.trim() || 'Fibra 500 Mega',
            secondPointVirtua: formSecondPointVirtua,
            cpf: formatCPF(formCpf),
            status: formStatus,
            sellerName: formSellerName.trim() || undefined,
            notes: formNotes.trim() || undefined,
            updatedAt: now,
          };
        }
        return item;
      });
      updateSalesList(updated);
      showToast(`Venda do contrato ${formContract} atualizada com sucesso!`, 'success');
    } else {
      // Create new
      const newSale: ResidentialSale = {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        contract: formatContract(formContract),
        installationDate: formInstallationDate,
        period: formPeriod,
        solar: formSolar,
        mplay: formMplay,
        service: formService.trim() || 'Fibra 500 Mega',
        secondPointVirtua: formSecondPointVirtua,
        cpf: formatCPF(formCpf),
        status: formStatus,
        sellerName: formSellerName.trim() || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      updateSalesList([newSale, ...sales]);
      showToast(`Nova venda cadastrada para o contrato ${formContract}!`, 'success');
    }

    setIsFormModalOpen(false);
  };

  // Toggle Status directly by clicking the status badge in the table: PENDENTE -> CONECTADO -> DESCONECTADO -> PENDENTE
  const handleToggleStatus = (sale: ResidentialSale) => {
    const nextStatus = getNextResidentialStatus(sale.status);

    const updated = sales.map((item) => {
      if (item.id === sale.id) {
        return {
          ...item,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    updateSalesList(updated);
    showToast(
      `Status do contrato ${sale.contract} alterado para ${nextStatus}!`,
      nextStatus === 'CONECTADO' ? 'success' : nextStatus === 'PENDENTE' ? 'info' : 'warning'
    );
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteCandidate) return;
    const updated = sales.filter((item) => item.id !== deleteCandidate.id);
    updateSalesList(updated);
    showToast(`Venda do contrato ${deleteCandidate.contract} excluída com sucesso!`, 'info');
    setDeleteCandidate(null);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    showToast('Filtros limpos com sucesso!', 'info');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    exportResidentialSalesJSON(sales);
    showToast(`Backup de ${sales.length} vendas residenciais exportado!`, 'success');
  };

  // Import JSON Backup
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importResidentialSalesJSON(file);
      if (imported.length === 0) {
        showToast('Nenhum registro válido encontrado no arquivo.', 'error');
        return;
      }
      updateSalesList(imported);
      showToast(`${imported.length} vendas residenciais importadas com sucesso!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao importar arquivo de backup.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Trigger Native Print
  const handlePrint = () => {
    window.print();
  };

  // Export PDF Report
  const handleGeneratePDF = () => {
    exportResidentialTrackingPDF(filteredSales, summary, storeName || 'Claro — Shopping Tietê Plaza');
    showToast('Relatório em PDF gerado com sucesso!', 'success');
  };

  const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
    if (key === 'period' || key === 'solar' || key === 'mplay' || key === 'secondPointVirtua' || key === 'status') {
      return val !== 'all';
    }
    return Boolean(val);
  });

  return (
    <div id="residential-tracking-view" className="space-y-6 pb-16">
      {/* Hidden File Input for Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-red-500/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left info column */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-white font-black uppercase tracking-wider text-[11px]">
              <Home className="w-3.5 h-3.5" />
              MÓDULO RESIDENCIAL
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/25 text-red-100 font-bold text-[11px]">
              Instalações & Contratos
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/25 text-red-100 font-medium text-[11px]">
              <Clock className="w-3 h-3 text-red-200" />
              Última sincronização: {getLastSyncTime()}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
            Acompanhamento de Vendas Residencial
          </h2>
          <p className="text-xs sm:text-sm text-red-100 font-normal leading-relaxed max-w-2xl">
            Planilha integrada para controle de instalações, períodos, serviços e acompanhamento de conexões Claro Fibra.
          </p>
        </div>

        {/* Right action button group (always aligned in one clean row) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start lg:self-center">
          <button
            type="button"
            id="btn-new-residential-sale"
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 active:scale-95 font-black px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NOVA VENDA RESIDENCIAL</span>
          </button>

          <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-white/15">
            <button
              type="button"
              id="btn-print-residential"
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:bg-white/15 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer whitespace-nowrap"
              title="Imprimir visualização formatada"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>IMPRIMIR</span>
            </button>

            <div className="w-px h-4 bg-white/20" />

            <button
              type="button"
              id="btn-pdf-residential"
              onClick={handleGeneratePDF}
              className="flex items-center gap-1.5 hover:bg-white/15 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer whitespace-nowrap"
              title="Gerar e baixar relatório em PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>GERAR PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUMMARY / RESUMO METRICS CARDS                                            */}
      {/* ========================================================================= */}
      <div id="residential-summary-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* TOTAL INSTALAÇÕES */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
              TOTAL
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {summary.totalInstallations}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">vendas</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            {sales.length !== filteredSales.length ? `Filtradas (${sales.length} total)` : 'Total registrado'}
          </div>
        </div>

        {/* PENDENTES */}
        <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              PENDENTES
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
              {summary.pendingCount}
            </span>
            <span className="text-[11px] text-blue-600 font-bold">
              {summary.totalInstallations > 0
                ? `${Math.round((summary.pendingCount / summary.totalInstallations) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="text-[10px] text-blue-700 font-medium mt-1">
            Aguardando instalação
          </div>
        </div>

        {/* CONECTADOS */}
        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              CONECTADOS
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {summary.connectedCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">
              {summary.totalInstallations > 0
                ? `${Math.round((summary.connectedCount / summary.totalInstallations) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">
            Instalações ativas / OK
          </div>
        </div>

        {/* DESCONECTADOS */}
        <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              DESCONECTADOS
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {summary.disconnectedCount}
            </span>
            <span className="text-[11px] text-rose-600 font-bold">
              {summary.totalInstallations > 0
                ? `${Math.round((summary.disconnectedCount / summary.totalInstallations) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="text-[10px] text-rose-700 font-medium mt-1">
            Quebra / Pendência
          </div>
        </div>

        {/* SOLAR */}
        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              SOLAR
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {summary.solarCount}
            </span>
            <span className="text-[11px] text-amber-600 font-bold">
              {summary.totalInstallations > 0
                ? `${Math.round((summary.solarCount / summary.totalInstallations) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="text-[10px] text-amber-700 font-medium mt-1">
            Adesões Solar
          </div>
        </div>

        {/* M-PLAY */}
        <div className="bg-sky-50/70 rounded-2xl p-4 border border-sky-200 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              M-PLAY
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-sky-700 tracking-tight">
              {summary.mplayCount}
            </span>
            <span className="text-[11px] text-sky-600 font-bold">
              {summary.totalInstallations > 0
                ? `${Math.round((summary.mplayCount / summary.totalInstallations) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="text-[10px] text-sky-700 font-medium mt-1">
            Combos com M-Play
          </div>
        </div>

        {/* 2º PONTO VIRTUA */}
        <div className="bg-purple-50/70 rounded-2xl p-4 border border-purple-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              2º PONTO
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
              {summary.secondPointVirtuaCount}
            </span>
            <span className="text-[11px] text-purple-600 font-bold">
              {summary.totalInstallations > 0
                ? `${Math.round((summary.secondPointVirtuaCount / summary.totalInstallations) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="text-[10px] text-purple-700 font-medium mt-1">
            Ponto adicional
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTROS NO TOPO DA PÁGINA                                                 */}
      {/* ========================================================================= */}
      <div id="filter-bar-container" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-600" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Filtros de Busca
            </h3>
            {hasActiveFilters && (
              <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Filtros Ativos ({filteredSales.length} de {sales.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                id="btn-clear-residential-filters"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>LIMPAR FILTROS</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterCollapsed((prev) => !prev)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
            >
              {isFilterCollapsed ? 'Expandir Filtros ▼' : 'Recolher ▲'}
            </button>
          </div>
        </div>

        {!isFilterCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 text-xs">
            {/* 1. Contrato */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Contrato
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 1048/2026"
                  value={filters.contract}
                  onChange={(e) => setFilters({ ...filters, contract: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs"
                />
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* 2. CPF */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                CPF do Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={filters.cpf}
                  onChange={(e) => setFilters({ ...filters, cpf: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* 3. Data de Instalação */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Data de Instalação
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filters.installationDate}
                  onChange={(e) => setFilters({ ...filters, installationDate: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* 4. Período */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Período
              </label>
              <div className="relative">
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs cursor-pointer"
                >
                  <option value="all">Todos os Períodos</option>
                  <option value="8:00 às 12:00">8:00 às 12:00</option>
                  <option value="12:00 às 15:00">12:00 às 15:00</option>
                  <option value="15:00 às 18:00">15:00 às 18:00</option>
                </select>
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 5. Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="PENDENTE">🔵 PENDENTE DE INSTALAÇÃO</option>
                <option value="CONECTADO">🟢 CONECTADO</option>
                <option value="DESCONECTADO">🔴 DESCONECTADO / QUEBRA</option>
              </select>
            </div>

            {/* 6. Solar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Solar
              </label>
              <select
                value={filters.solar}
                onChange={(e) => setFilters({ ...filters, solar: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs cursor-pointer"
              >
                <option value="all">Solar: Todos</option>
                <option value="SIM">SIM</option>
                <option value="NÃO">NÃO</option>
              </select>
            </div>

            {/* 7. M-Play */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                M-Play
              </label>
              <select
                value={filters.mplay}
                onChange={(e) => setFilters({ ...filters, mplay: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs cursor-pointer"
              >
                <option value="all">M-Play: Todos</option>
                <option value="SIM">SIM</option>
                <option value="NÃO">NÃO</option>
              </select>
            </div>

            {/* 8. 2º Ponto Virtua */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                2º Ponto Virtua
              </label>
              <select
                value={filters.secondPointVirtua}
                onChange={(e) => setFilters({ ...filters, secondPointVirtua: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs cursor-pointer"
              >
                <option value="all">2º Ponto: Todos</option>
                <option value="SIM">SIM</option>
                <option value="NÃO">NÃO</option>
              </select>
            </div>

            {/* 9. Serviço */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Plano / Serviço
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Fibra 500 Mega, Fibra 1 Giga..."
                  value={filters.service}
                  onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-semibold text-xs"
                />
                <Wifi className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TABELA DE ACOMPANHAMENTO RESIDENCIAL                                      */}
      {/* ========================================================================= */}
      <div id="residential-sales-table-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Title Bar */}
        <div className="px-4 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <h3 className="font-extrabold text-xs sm:text-sm tracking-wide uppercase">
              Planilha de Instalações Residenciais ({filteredSales.length}{' '}
              {filteredSales.length === 1 ? 'registro' : 'registros'})
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              Clique no botão de status para alternar
            </span>
            <button
              type="button"
              id="btn-lancar-dados-table-bar"
              onClick={handleOpenNewModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ LANÇAR DADOS</span>
            </button>
          </div>
        </div>

        {/* Responsive Table Scroll Container */}
        <div className="overflow-x-auto">
          <table id="residential-sales-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[11px] border-b border-slate-200 select-none">
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Contrato</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Data de Instalação</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Período</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap">Solar</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap">M-Play</th>
                <th className="py-3 px-3.5 text-left whitespace-nowrap">Serviço</th>
                <th className="py-3 px-2.5 text-center whitespace-nowrap">2º Ponto Virtua</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">CPF do Cliente</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status (Clique p/ Alternar)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Home className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-600 text-sm">
                        Nenhuma venda residencial encontrada.
                      </p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'Tente ajustar ou limpar os filtros no topo.'
                          : 'Clique em "+ NOVA VENDA RESIDENCIAL" para começar.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-2 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Limpar todos os filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isConnected = sale.status === 'CONECTADO';
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Contrato */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 inline-block font-semibold">
                          {sale.contract || '—'}
                        </span>
                      </td>

                      {/* 2. Data de Instalação */}
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-700 font-medium">
                        {formatDateBR(sale.installationDate)}
                      </td>

                      {/* 3. Período */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {sale.period}
                        </span>
                      </td>

                      {/* 4. Solar */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            sale.solar === 'SIM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {sale.solar}
                        </span>
                      </td>

                      {/* 5. M-Play */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            sale.mplay === 'SIM'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {sale.mplay}
                        </span>
                      </td>

                      {/* 6. Serviço */}
                      <td className="py-3 px-3.5 text-left font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{sale.service || '—'}</span>
                        </div>
                      </td>

                      {/* 7. 2º Ponto Virtua */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            sale.secondPointVirtua === 'SIM'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {sale.secondPointVirtua}
                        </span>
                      </td>

                      {/* 8. CPF do Cliente */}
                      <td className="py-3 px-3 text-center font-mono text-slate-700 whitespace-nowrap font-medium">
                        {sale.cpf || '—'}
                      </td>

                      {/* 9. Status (Clickable Toggle Button) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          id={`btn-toggle-status-${sale.id}`}
                          onClick={() => handleToggleStatus(sale)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 select-none ${
                            sale.status === 'PENDENTE'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                              : sale.status === 'CONECTADO'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                          }`}
                          title="Clique para alternar: Pendente → Conectado → Desconectado"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sale.status === 'PENDENTE'
                                ? 'bg-white animate-pulse'
                                : sale.status === 'CONECTADO'
                                ? 'bg-white'
                                : 'bg-white'
                            }`}
                          />
                          <span>
                            {sale.status === 'PENDENTE'
                              ? '🔵 PENDENTE'
                              : sale.status === 'CONECTADO'
                              ? '🟢 CONECTADO'
                              : '🔴 DESCONECTADO'}
                          </span>
                        </button>
                      </td>

                      {/* 10. Ações: Editar e Excluir */}
                      <td className="py-3 px-3 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            id={`btn-edit-sale-${sale.id}`}
                            onClick={() => handleOpenEditModal(sale)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Editar venda residencial"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            id={`btn-delete-sale-${sale.id}`}
                            onClick={() => setDeleteCandidate(sale)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir venda residencial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap font-medium">
            <span>
              Exibindo <strong>{filteredSales.length}</strong> de{' '}
              <strong>{sales.length}</strong> vendas residenciais
            </span>
            <span>•</span>
            <span className="text-blue-700 font-bold">
              {summary.pendingCount} Pendentes
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">
              {summary.connectedCount} Conectadas
            </span>
            <span>•</span>
            <span className="text-rose-700 font-bold">
              {summary.disconnectedCount} Desconectadas
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Armazenamento seguro em localStorage • Claro Tietê Plaza
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NOVA VENDA RESIDENCIAL / EDITAR VENDA                              */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div
          id="modal-residential-form-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            id="modal-residential-form-card"
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-bold shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">
                    {editingSale ? 'Editar Venda Residencial' : 'Nova Venda Residencial'}
                  </h3>
                  <p className="text-xs text-red-100 font-medium">
                    Preencha os dados da instalação e serviços contratados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSale} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Contrato */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    Número do Contrato <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ex: 1048/2026"
                      value={formContract}
                      onChange={(e) => setFormContract(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-slate-900 font-mono font-bold text-xs"
                    />
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Formato de referência: ____/____ (digitação livre)
                  </span>
                </div>

                {/* 2. Data de Instalação */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    Data de Instalação <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formInstallationDate}
                      onChange={(e) => setFormInstallationDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-slate-900 font-bold text-xs"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* 3. Período */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    Período da Instalação <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value as ResidentialPeriod)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-slate-900 font-bold text-xs cursor-pointer"
                    >
                      {PERIOD_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Opções exatas de janela técnica de agendamento
                  </span>
                </div>

                {/* 4. CPF do Cliente */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                    CPF do Cliente
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="000.000.000-00"
                      value={formCpf}
                      onChange={(e) => setFormCpf(formatCPF(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-slate-900 font-mono font-bold text-xs"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Máscara aplicada automaticamente
                  </span>
                </div>
              </div>

              {/* 5. Serviço / Plano Vendido */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">
                  Plano / Serviço Vendido <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="services-datalist"
                    required
                    placeholder="Ex: Fibra 500 Mega, Fibra 750 Mega, Fibra 1 Giga..."
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-slate-900 font-bold text-xs"
                  />
                  <Wifi className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                  <datalist id="services-datalist">
                    {COMMON_RESIDENTIAL_SERVICES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold">Atalhos rápidos:</span>
                  {['Fibra 350 Mega', 'Fibra 500 Mega', 'Fibra 750 Mega', 'Fibra 1 Giga'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormService(s)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition-colors cursor-pointer ${
                        formService === s
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Triplo Seletor: Solar, M-Play, 2º Ponto Virtua */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-slate-700 block tracking-wider">
                  Serviços Adicionais & Parcerias
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Solar */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Solar:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['SIM', 'NÃO'] as YesNoOption[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormSolar(opt)}
                          className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            formSolar === opt
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* M-Play */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      M-Play:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['SIM', 'NÃO'] as YesNoOption[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormMplay(opt)}
                          className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            formMplay === opt
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2º Ponto Virtua */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                      <Tv className="w-4 h-4 text-purple-500" />
                      2º Ponto Virtua:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['SIM', 'NÃO'] as YesNoOption[]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormSecondPointVirtua(opt)}
                          className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            formSecondPointVirtua === opt
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status da Instalação */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1.5">
                  Status da Instalação <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus('PENDENTE')}
                    className={`py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formStatus === 'PENDENTE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>🔵 PENDENTE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('CONECTADO')}
                    className={`py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formStatus === 'CONECTADO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>🟢 CONECTADO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('DESCONECTADO')}
                    className={`py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formStatus === 'DESCONECTADO'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>🔴 DESCONECTADO</span>
                  </button>
                </div>
              </div>

              {/* Vendedor & Observações (Opcionais) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Vendedor Responsável (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do consultor"
                    value={formSellerName}
                    onChange={(e) => setFormSellerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 outline-none text-slate-900 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Observações / Motivo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Reagendado, tubulação, etc."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-red-600 outline-none text-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-submit-save-residential"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer text-xs"
                >
                  {editingSale ? 'Atualizar Venda' : 'Cadastrar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO                                            */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div
          id="modal-delete-confirm-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setDeleteCandidate(null)}
        >
          <div
            id="modal-delete-confirm-card"
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação removerá permanentemente o registro de venda.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <strong>Contrato:</strong> {deleteCandidate.contract}
              </p>
              <p>
                <strong>Data de Instalação:</strong>{' '}
                {formatDateBR(deleteCandidate.installationDate)} ({deleteCandidate.period})
              </p>
              <p>
                <strong>Serviço:</strong> {deleteCandidate.service}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={
                    deleteCandidate.status === 'PENDENTE'
                      ? 'text-blue-700 font-bold'
                      : deleteCandidate.status === 'CONECTADO'
                      ? 'text-emerald-700 font-bold'
                      : 'text-rose-700 font-bold'
                  }
                >
                  {deleteCandidate.status}
                </span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-residential"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
              >
                Sim, Excluir Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
