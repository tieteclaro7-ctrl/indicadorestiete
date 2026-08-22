import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createCleanDatabase, DEFAULT_SELLERS, generateDemoSampleDatabase } from '../data/categories';
import { DailyEntry, FilterState, MonthData, Seller, StoreDatabase, ViewTab } from '../types';

interface SalesContextType {
  database: StoreDatabase;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  // Daily entry helpers
  currentDailyEntry: DailyEntry;
  updateCellValue: (indicatorId: string, sellerId: string, value: number) => void;
  updatePasswordsCount: (count: string) => void;
  saveDailyEntry: (customDate?: string) => void;
  clearDailyEntry: () => void;
  // Sellers management
  updateSellerName: (sellerId: string, newName: string) => void;
  addSeller: (name: string) => void;
  removeSeller: (sellerId: string) => void;
  toggleSellerActive: (sellerId: string) => void;
  // Data actions
  resetToSampleData: () => void;
  clearAllData: () => void;
  clearCacheAndReset: () => void;
  exportDatabaseJSON: () => void;
  exportDatabaseCSV: () => void;
  importDatabaseJSON: (jsonStr: string) => boolean;
  // Toast notifications
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const STORAGE_KEY = 'claro_tiete_plaza_db_v2';

export const sortSellersAlphabetically = (sellersList: Seller[]): Seller[] => {
  return [...sellersList].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );
};

const SalesContext = createContext<SalesContextType | null>(null);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [database, setDatabase] = useState<StoreDatabase>(() => {
    try {
      // Clear legacy storage versions to prevent cached sample data from persisting
      localStorage.removeItem('claro_tiete_plaza_db_v1');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.sellers) && parsed.sellers.length > 0) {
          return {
            ...parsed,
            sellers: sortSellersAlphabetically(parsed.sellers),
          };
        }
      }
    } catch (e) {
      console.error('Falha ao carregar localStorage:', e);
    }
    return createCleanDatabase();
  });

  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(database.lastSelectedDate || todayStr);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const selectedMonth = useMemo(() => selectedDate.substring(0, 7), [selectedDate]);

  const [filters, setFilters] = useState<FilterState>({
    month: selectedMonth,
    day: 'all',
    sellerId: 'all',
    categoryId: 'all',
    indicatorId: 'all',
  });

  // Keep localStorage updated whenever database changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
    } catch (e) {
      console.error('Falha ao persistir no localStorage:', e);
    }
  }, [database]);

  // Keep filter month in sync when selected date changes
  useEffect(() => {
    const monthKey = selectedDate.substring(0, 7);
    setFilters((prev) => ({ ...prev, month: monthKey }));
  }, [selectedDate]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  const resetFilters = () => {
    setFilters({
      month: selectedMonth,
      day: 'all',
      sellerId: 'all',
      categoryId: 'all',
      indicatorId: 'all',
    });
  };

  // Compute or initialize current daily entry for editing
  const currentDailyEntry = useMemo<DailyEntry>(() => {
    const monthKey = selectedDate.substring(0, 7);
    const monthData = database.months[monthKey];
    if (monthData && monthData.days[selectedDate]) {
      return monthData.days[selectedDate];
    }
    // Return empty entry with structure
    return {
      date: selectedDate,
      passwordsCount: '',
      values: {},
      updatedAt: new Date().toISOString(),
    };
  }, [database, selectedDate]);

  const updateCellValue = (indicatorId: string, sellerId: string, value: number) => {
    const monthKey = selectedDate.substring(0, 7);
    const num = Math.max(0, isNaN(value) ? 0 : value);

    setDatabase((prev) => {
      const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
      const existingEntry = existingMonth.days[selectedDate] || {
        date: selectedDate,
        passwordsCount: '',
        values: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedValues = {
        ...existingEntry.values,
        [indicatorId]: {
          ...(existingEntry.values[indicatorId] || {}),
          [sellerId]: num,
        },
      };

      const updatedDays = {
        ...existingMonth.days,
        [selectedDate]: {
          ...existingEntry,
          values: updatedValues,
          updatedAt: new Date().toISOString(),
        },
      };

      return {
        ...prev,
        lastSelectedDate: selectedDate,
        months: {
          ...prev.months,
          [monthKey]: {
            ...existingMonth,
            days: updatedDays,
          },
        },
      };
    });
  };

  const updatePasswordsCount = (count: string) => {
    const monthKey = selectedDate.substring(0, 7);
    setDatabase((prev) => {
      const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
      const existingEntry = existingMonth.days[selectedDate] || {
        date: selectedDate,
        passwordsCount: '',
        values: {},
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        months: {
          ...prev.months,
          [monthKey]: {
            ...existingMonth,
            days: {
              ...existingMonth.days,
              [selectedDate]: {
                ...existingEntry,
                passwordsCount: count,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        },
      };
    });
  };

  const saveDailyEntry = (customDate?: string) => {
    const targetDate = customDate || selectedDate;
    const monthKey = targetDate.substring(0, 7);

    setDatabase((prev) => {
      const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
      const existingEntry = existingMonth.days[targetDate] || {
        date: targetDate,
        passwordsCount: '',
        values: {},
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        lastSelectedDate: targetDate,
        months: {
          ...prev.months,
          [monthKey]: {
            ...existingMonth,
            days: {
              ...existingMonth.days,
              [targetDate]: {
                ...existingEntry,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        },
      };
    });

    showToast(`Lançamento do dia ${targetDate.split('-').reverse().join('/')} salvo com sucesso!`, 'success');
  };

  const clearDailyEntry = (customDate?: string) => {
    const targetDate = customDate || selectedDate;
    const monthKey = targetDate.substring(0, 7);
    setDatabase((prev) => {
      const existingMonth = prev.months[monthKey] || { monthKey, days: {} };

      const updatedDays = {
        ...existingMonth.days,
        [targetDate]: {
          date: targetDate,
          passwordsCount: '',
          values: {},
          updatedAt: new Date().toISOString(),
        },
      };

      return {
        ...prev,
        lastSelectedDate: targetDate,
        months: {
          ...prev.months,
          [monthKey]: {
            ...existingMonth,
            days: updatedDays,
          },
        },
      };
    });
    showToast(`Todos os lançamentos do dia ${targetDate.split('-').reverse().join('/')} foram zerados com sucesso!`, 'info');
  };

  const updateSellerName = (sellerId: string, newName: string) => {
    if (!newName.trim()) return;
    setDatabase((prev) => ({
      ...prev,
      sellers: sortSellersAlphabetically(
        prev.sellers.map((s) => (s.id === sellerId ? { ...s, name: newName.trim() } : s))
      ),
    }));
    showToast(`Nome do vendedor atualizado para "${newName.trim()}".`, 'info');
  };

  const addSeller = (name: string) => {
    if (!name.trim()) return;
    const newId = `s_${Date.now()}`;
    setDatabase((prev) => ({
      ...prev,
      sellers: sortSellersAlphabetically([
        ...prev.sellers,
        { id: newId, name: name.trim(), active: true },
      ]),
    }));
    showToast(`Vendedor "${name.trim()}" adicionado à equipe!`, 'success');
  };

  const removeSeller = (sellerId: string) => {
    setDatabase((prev) => ({
      ...prev,
      sellers: prev.sellers.filter((s) => s.id !== sellerId),
    }));
    showToast('Vendedor removido com sucesso.', 'info');
  };

  const toggleSellerActive = (sellerId: string) => {
    setDatabase((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) => (s.id === sellerId ? { ...s, active: !s.active } : s)),
    }));
  };

  const resetToSampleData = () => {
    const demo = generateDemoSampleDatabase();
    setDatabase(demo);
    setSelectedDate(demo.lastSelectedDate);
    showToast('Dados de exemplo da Claro Tietê Plaza carregados com sucesso!', 'success');
  };

  const clearAllData = () => {
    const empty = createCleanDatabase();
    setDatabase(empty);
    setSelectedDate(empty.lastSelectedDate);
    showToast('Dashboard limpo e zerado. Pronto para novos lançamentos!', 'info');
  };

  const clearCacheAndReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('claro_tiete_plaza_db_v1');
    } catch (e) {
      console.error(e);
    }
    const clean = createCleanDatabase();
    setDatabase(clean);
    setSelectedDate(clean.lastSelectedDate);
    showToast('Cache zerado com sucesso! Dashboard limpo com a equipe atualizada.', 'success');
  };

  const exportDatabaseJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(database, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `claro_tiete_plaza_backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup JSON exportado com sucesso!', 'success');
  };

  const exportDatabaseCSV = () => {
    // Generate CSV for current month
    const monthKey = filters.month;
    const monthData = database.months[monthKey];
    if (!monthData || !monthData.days) {
      showToast('Nenhum dado encontrado para exportar neste mês.', 'error');
      return;
    }

    const activeSellers = database.sellers.filter((s) => s.active);
    let csv = `DATA;INDICADOR;CATEGORIA;${activeSellers.map((s) => s.name).join(';')};TOTAL_DIA\n`;

    Object.values(monthData.days).forEach((entry: any) => {
      Object.entries(entry?.values || {}).forEach(([indId, sMap]: [string, any]) => {
        let rowSum = 0;
        const sellerValues = activeSellers.map((s) => {
          const val = Number(sMap?.[s.id]) || 0;
          rowSum += val;
          return val;
        });

        if (rowSum > 0) {
          csv += `${entry.date};${indId};${sellerValues.join(';')};${rowSum}\n`;
        }
      });
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `claro_tiete_plaza_${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Planilha CSV gerada com sucesso!', 'success');
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.sellers) && parsed.months) {
        setDatabase({
          ...parsed,
          sellers: sortSellersAlphabetically(parsed.sellers),
        });
        showToast('Dados importados com sucesso!', 'success');
        return true;
      }
    } catch (e) {
      console.error('Erro ao importar JSON:', e);
    }
    showToast('Arquivo JSON inválido.', 'error');
    return false;
  };

  return (
    <SalesContext.Provider
      value={{
        database,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        filters,
        setFilters,
        resetFilters,
        currentDailyEntry,
        updateCellValue,
        updatePasswordsCount,
        saveDailyEntry,
        clearDailyEntry,
        updateSellerName,
        addSeller,
        removeSeller,
        toggleSellerActive,
        resetToSampleData,
        clearAllData,
        clearCacheAndReset,
        exportDatabaseJSON,
        exportDatabaseCSV,
        importDatabaseJSON,
        toast,
        showToast,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales deve ser usado dentro de um SalesProvider');
  }
  return context;
};
