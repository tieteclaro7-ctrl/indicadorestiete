import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Database,
  RotateCcw,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useSales } from '../context/SalesContext';

export const DataManagementView: React.FC = () => {
  const {
    database,
    exportDatabaseJSON,
    exportDatabaseCSV,
    importDatabaseJSON,
    resetToSampleData,
    clearAllData,
    clearCacheAndReset,
    updateSellerName,
    addSeller,
    removeSeller,
    toggleSellerActive,
    showToast,
  } = useSales();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSellerName, setNewSellerName] = useState('');
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [editingSellerName, setEditingSellerName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJSON(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSellerName.trim()) {
      addSeller(newSellerName.trim());
      setNewSellerName('');
    }
  };

  const handleSaveRename = (sellerId: string) => {
    if (editingSellerName.trim()) {
      updateSellerName(sellerId, editingSellerName.trim());
    }
    setEditingSellerId(null);
  };

  // Count total recorded entries
  const totalEntriesCount = Object.values(database.months).reduce<number>((acc, m: any) => {
    return acc + Object.keys(m?.days || {}).length;
  }, 0);

  return (
    <div id="data-management-view" className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6 border-b-4 border-red-600 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            Armazenamento & Segurança
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            Gestão de Dados & Backup
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Todos os lançamentos são salvos automaticamente no <strong>localStorage do navegador</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700 text-xs">
          <Database className="w-4 h-4 text-red-400" />
          <span className="font-bold text-zinc-300">{totalEntriesCount} dias registrados</span>
        </div>
      </div>

      {/* Export & Import Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-zinc-900">Exportar Dados (Backup)</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Baixe seus lançamentos para garantir que você tenha uma cópia segura em seu computador.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              id="btn-export-json"
              onClick={exportDatabaseJSON}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>Exportar Backup (JSON)</span>
            </button>
            <button
              id="btn-export-csv"
              onClick={exportDatabaseCSV}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Exportar Planilha (CSV)</span>
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-zinc-900">Restaurar Dados (Importar)</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Importe um arquivo JSON salvo anteriormente para restaurar todo o histórico e equipe.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <button
              id="btn-trigger-import-json"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-zinc-300 hover:border-blue-500 hover:bg-blue-50 text-zinc-700 hover:text-blue-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo JSON de Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sellers Team Management */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              Configuração da Equipe de Vendedores
            </h3>
            <p className="text-xs text-zinc-500">
              Altere os nomes que aparecem nas colunas da folha de lançamento diário.
            </p>
          </div>

          {/* Add Seller Form */}
          <form onSubmit={handleAddSellerSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Novo vendedor..."
              value={newSellerName}
              onChange={(e) => setNewSellerName(e.target.value)}
              className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 outline-hidden focus:border-red-500"
            />
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </form>
        </div>

        {/* Sellers Grid List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {database.sellers.map((seller) => (
            <div
              key={seller.id}
              className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 flex items-center justify-between gap-2"
            >
              {editingSellerId === seller.id ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    type="text"
                    value={editingSellerName}
                    onChange={(e) => setEditingSellerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(seller.id)}
                    className="w-full bg-white border border-red-400 rounded px-2 py-1 text-xs font-bold text-zinc-900"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveRename(seller.id)}
                    className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-black">
                      {seller.name.substring(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <span className="text-xs font-extrabold text-zinc-900 block">{seller.name}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {seller.active ? 'Ativo na folha' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSellerId(seller.id);
                        setEditingSellerName(seller.name);
                      }}
                      title="Renomear vendedor"
                      className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {database.sellers.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja remover ${seller.name} da equipe?`)) {
                            removeSeller(seller.id);
                          }
                        }}
                        title="Remover vendedor"
                        className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger & Reset Zone */}
      <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            Limpeza de Cache e Reinicialização
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Zere o cache do navegador e deixe o dashboard totalmente limpo com os 11 vendedores ativos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-clear-cache-reset"
            onClick={() => {
              if (window.confirm('Deseja zerar o cache e deixar o dashboard limpo com a equipe atualizada?')) {
                clearCacheAndReset();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Zerar Cache & Limpar
          </button>

          <button
            id="btn-reset-sample-data"
            onClick={() => {
              if (window.confirm('Deseja carregar dados demonstrativos para testes visuais?')) {
                resetToSampleData();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Carregar Dados Exemplo
          </button>
        </div>
      </div>
    </div>
  );
};
