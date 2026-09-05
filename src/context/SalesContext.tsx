import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { createCleanDatabase, DEFAULT_SELLERS, generateDemoSampleDatabase } from '../data/categories';
import { DailyEntry, FilterState, MonthData, Seller, StoreDatabase, ViewTab } from '../types';
import {
  fetchRemoteStoreDatabase,
  pushRemoteStoreDatabase,
  mergeStoreDatabases,
  areStoreDatabasesEqual,
  formatCurrentTime,
  getLastSyncTime,
  updateLastSyncTime,
} from '../utils/syncService';

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
  saveDailyEntry: (customDate?: string) => Promise<{ success: boolean; error?: string }>;
  clearDailyEntry: (customDate?: string) => Promise<{ success: boolean; error?: string }>;
  // Sellers management
  updateSellerName: (sellerId: string, newName: string) => void;
  addSeller: (name: string) => void;
  removeSeller: (sellerId: string) => void;
  toggleSellerActive: (sellerId: string) => void;
  // Store goals management
  updateStoreMonthlyGoal: (monthKey: string, goal: number) => void;
  updateStoreGoal: (monthKey: string, indicatorId: string, value: number) => void;
  updateAllStoreGoals: (monthKey: string, goals: Record<string, number>) => Promise<void> | void;
  clearStoreGoals: (monthKey: string) => Promise<void> | void;
  // Data actions
  resetToSampleData: () => void;
  clearAllData: () => void;
  clearCacheAndReset: () => void;
  exportDatabaseJSON: () => void;
  exportDatabaseCSV: () => void;
  importDatabaseJSON: (jsonStr: string) => boolean;
  // Cross-device sync status
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSyncTime: string;
  manualSync: () => Promise<void>;
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

export const ensureAllDefaultSellers = (sellersList: Seller[] | undefined): Seller[] => {
  const map = new Map<string, Seller>();
  // Pre-fill with all 11 default official team sellers
  DEFAULT_SELLERS.forEach((s) => {
    map.set(s.id, { ...s, active: true });
  });

  if (Array.isArray(sellersList)) {
    sellersList.forEach((s) => {
      if (s && s.id) {
        const def = map.get(s.id);
        map.set(s.id, {
          id: s.id,
          name: s.name || def?.name || s.id,
          active: true, // Keep all team sellers permanently active on the daily table
        });
      }
    });
  }

  return sortSellersAlphabetically(Array.from(map.values()));
};

export const sanitizeStoreDatabase = (db: StoreDatabase | null | undefined): StoreDatabase => {
  if (!db || typeof db !== 'object') {
    return createCleanDatabase();
  }
  return {
    ...db,
    sellers: ensureAllDefaultSellers(db.sellers),
  };
};

const SalesContext = createContext<SalesContextType | null>(null);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read local cache initially for immediate render while remote syncs
  const [database, setDatabase] = useState<StoreDatabase>(() => {
    try {
      localStorage.removeItem('claro_tiete_plaza_db_v1');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          return sanitizeStoreDatabase(parsed);
        }
      }
    } catch (e) {
      console.error('Falha ao ler cache local:', e);
    }
    return createCleanDatabase();
  });

  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(database.lastSelectedDate || todayStr);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Synchronization status state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');
  const [lastSyncTimeString, setLastSyncTimeString] = useState<string>(getLastSyncTime() || formatCurrentTime());

  // Refs for tracking in-flight operations without triggering re-renders
  const isPollingRef = useRef<boolean>(false);
  const databaseRef = useRef<StoreDatabase>(database);
  databaseRef.current = database;
  const hasPendingEditsRef = useRef<boolean>(false);

  const selectedMonth = useMemo(() => selectedDate.substring(0, 7), [selectedDate]);

  const [filters, setFilters] = useState<FilterState>({
    month: selectedMonth,
    day: 'all',
    sellerId: 'all',
    categoryId: 'all',
    indicatorId: 'all',
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  // Dedicated poll function: reads remote shared server data as source of truth
  const performSync = async (silent = true) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    if (!silent) setSyncStatus('syncing');

    try {
      const res = await fetchRemoteStoreDatabase();
      if (res.success && res.data) {
        const sanitized = sanitizeStoreDatabase(res.data);
        const current = databaseRef.current;
        if (!areStoreDatabasesEqual(current, sanitized)) {
          // Check if user is typing or if there are unsaved local edits
          const isUserTyping = typeof document !== 'undefined' && document.activeElement &&
            ['input', 'textarea', 'select'].includes(document.activeElement.tagName?.toLowerCase());

          // During silent background sync, NEVER overwrite if user is typing or has unsaved edits
          if (silent && (isUserTyping || hasPendingEditsRef.current)) {
            return;
          }

          // Server is the single source of truth: apply server data directly
          setDatabase(sanitized);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          } catch {}
        }
        setSyncStatus('synced');
        setLastSyncTimeString(res.updatedAt);
        updateLastSyncTime(res.updatedAt);
      } else if (!res.success) {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    } finally {
      isPollingRef.current = false;
    }
  };

  const manualSync = async () => {
    showToast('Consultando servidor compartilhado...', 'info');
    await performSync(false);
    if (syncStatus === 'synced' || syncStatus === 'syncing') {
      showToast('Dados sincronizados com o servidor!', 'success');
    } else {
      showToast('Não foi possível conectar ao servidor.', 'error');
    }
  };

  // Initial startup synchronization and migration
  useEffect(() => {
    let isMounted = true;

    async function initialSync() {
      setSyncStatus('syncing');
      try {
        const remoteRes = await fetchRemoteStoreDatabase();
        if (!isMounted) return;

        let localCached: StoreDatabase | null = null;
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) localCached = JSON.parse(stored);
        } catch {}

        if (remoteRes.success && remoteRes.data) {
          // Server is the single source of truth: adopt server data directly
          const sanitized = sanitizeStoreDatabase(remoteRes.data);
          setDatabase(sanitized);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          } catch {}
          setSyncStatus('synced');
          setLastSyncTimeString(remoteRes.updatedAt);
        } else if (localCached && Object.keys(localCached.months || {}).length > 0) {
          // Remote was empty or fresh, but local has data: push to remote
          const sanitized = sanitizeStoreDatabase(localCached);
          await pushRemoteStoreDatabase(sanitized);
          setDatabase(sanitized);
          setSyncStatus('synced');
        } else if (!remoteRes.success) {
          setSyncStatus('error');
        }
      } catch {
        if (isMounted) setSyncStatus('error');
      }
    }

    initialSync();

    // 5-second polling interval
    const intervalId = setInterval(() => {
      performSync(true);
    }, 5000);

    // Sync immediately when user switches tabs or window gains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        performSync(false);
      }
    };
    const handleFocus = () => {
      performSync(true);
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Keep filter month in sync when selected date changes
  useEffect(() => {
    const monthKey = selectedDate.substring(0, 7);
    setFilters((prev) => ({ ...prev, month: monthKey }));
  }, [selectedDate]);

  // Current daily entry for the selected date
  const currentDailyEntry = useMemo((): DailyEntry => {
    const monthKey = selectedDate.substring(0, 7);
    const month = database.months[monthKey];
    if (month && month.days && month.days[selectedDate]) {
      return month.days[selectedDate];
    }
    return {
      date: selectedDate,
      passwordsCount: '',
      values: {},
      updatedAt: new Date().toISOString(),
    };
  }, [database.months, selectedDate]);

  // Update cell value in current session state
  const updateCellValue = (indicatorId: string, sellerId: string, value: number) => {
    hasPendingEditsRef.current = true;
    const safeValue = Math.max(0, isNaN(value) ? 0 : value);
    const monthKey = selectedDate.substring(0, 7);

    setDatabase((prev) => {
      const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
      const existingDay = existingMonth.days[selectedDate] || {
        date: selectedDate,
        passwordsCount: '',
        values: {},
        updatedAt: new Date().toISOString(),
      };

      const currentIndicatorValues = existingDay.values[indicatorId] || {};
      const updatedIndicatorValues = { ...currentIndicatorValues };

      if (safeValue === 0) {
        delete updatedIndicatorValues[sellerId];
      } else {
        updatedIndicatorValues[sellerId] = safeValue;
      }

      const updatedValues = { ...existingDay.values };
      if (Object.keys(updatedIndicatorValues).length === 0) {
        delete updatedValues[indicatorId];
      } else {
        updatedValues[indicatorId] = updatedIndicatorValues;
      }

      const updatedDay: DailyEntry = {
        ...existingDay,
        values: updatedValues,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        lastSelectedDate: selectedDate,
        months: {
          ...prev.months,
          [monthKey]: {
            ...existingMonth,
            days: {
              ...existingMonth.days,
              [selectedDate]: updatedDay,
            },
          },
        },
      };
    });
  };

  const updatePasswordsCount = (count: string) => {
    hasPendingEditsRef.current = true;
    const monthKey = selectedDate.substring(0, 7);
    setDatabase((prev) => {
      const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
      const existingDay = existingMonth.days[selectedDate] || {
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
                ...existingDay,
                passwordsCount: count,
                updatedAt: new Date().toISOString(),
              },
            },
          },
        },
      };
    });
  };

  // Save daily entry: sends data to server, awaits confirmation, updates state and local storage
  const saveDailyEntry = async (customDate?: string): Promise<{ success: boolean; error?: string }> => {
    const targetDate = customDate || selectedDate;
    const monthKey = targetDate.substring(0, 7);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      showToast('Data inválida para o lançamento.', 'error');
      return { success: false, error: 'Data inválida.' };
    }

    setSyncStatus('syncing');

    const prev = databaseRef.current;
    const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
    const existingEntry = existingMonth.days[targetDate] || {
      date: targetDate,
      passwordsCount: '',
      values: {},
      updatedAt: new Date().toISOString(),
    };

    const updatedEntry: DailyEntry = {
      ...existingEntry,
      updatedAt: new Date().toISOString(),
    };

    const newDatabase: StoreDatabase = {
      ...prev,
      lastSelectedDate: targetDate,
      updatedAt: new Date().toISOString(),
      months: {
        ...prev.months,
        [monthKey]: {
          ...existingMonth,
          days: {
            ...existingMonth.days,
            [targetDate]: updatedEntry,
          },
        },
      },
    };

    // Push to server and await confirmation
    const pushRes = await pushRemoteStoreDatabase(newDatabase);

    if (pushRes.success) {
      hasPendingEditsRef.current = false;
      setDatabase(newDatabase);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase));
      } catch {}
      setSyncStatus('synced');
      setLastSyncTimeString(pushRes.updatedAt);
      return { success: true };
    } else {
      setSyncStatus('error');
      return {
        success: false,
        error: pushRes.error || 'Falha ao salvar no servidor compartilhado.',
      };
    }
  };

  // Clear daily entry: clears day on server and local
  const clearDailyEntry = async (customDate?: string): Promise<{ success: boolean; error?: string }> => {
    const targetDate = customDate || selectedDate;
    const monthKey = targetDate.substring(0, 7);
    setSyncStatus('syncing');

    const prev = databaseRef.current;
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

    const newDatabase: StoreDatabase = {
      ...prev,
      lastSelectedDate: targetDate,
      updatedAt: new Date().toISOString(),
      months: {
        ...prev.months,
        [monthKey]: {
          ...existingMonth,
          days: updatedDays,
        },
      },
    };

    const pushRes = await pushRemoteStoreDatabase(newDatabase);

    if (pushRes.success) {
      hasPendingEditsRef.current = false;
      setDatabase(newDatabase);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatabase));
      } catch {}
      setSyncStatus('synced');
      setLastSyncTimeString(pushRes.updatedAt);
      showToast(`Todos os lançamentos do dia ${targetDate.split('-').reverse().join('/')} foram zerados e sincronizados!`, 'info');
      return { success: true };
    } else {
      setSyncStatus('error');
      showToast('Falha ao zerar no servidor compartilhado.', 'error');
      return { success: false, error: pushRes.error };
    }
  };

  // Seller management functions with automatic remote synchronization
  const updateSellerName = (sellerId: string, newName: string) => {
    if (!newName.trim()) return;
    const prev = databaseRef.current;
    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      sellers: sortSellersAlphabetically(
        prev.sellers.map((s) => (s.id === sellerId ? { ...s, name: newName.trim() } : s))
      ),
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    pushRemoteStoreDatabase(updated).catch(() => {});
    showToast(`Nome do vendedor atualizado para "${newName.trim()}".`, 'info');
  };

  const addSeller = (name: string) => {
    if (!name.trim()) return;
    const newId = `s_${Date.now()}`;
    const prev = databaseRef.current;
    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      sellers: sortSellersAlphabetically([
        ...prev.sellers,
        { id: newId, name: name.trim(), active: true },
      ]),
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    pushRemoteStoreDatabase(updated).catch(() => {});
    showToast(`Vendedor "${name.trim()}" adicionado à equipe!`, 'success');
  };

  const removeSeller = (sellerId: string) => {
    const isDefault = DEFAULT_SELLERS.some((d) => d.id === sellerId);
    if (isDefault) {
      showToast('Os 11 vendedores da equipe oficial são mantidos fixos na folha de lançamento diário.', 'info');
      return;
    }
    const prev = databaseRef.current;
    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      sellers: prev.sellers.filter((s) => s.id !== sellerId),
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    pushRemoteStoreDatabase(updated).catch(() => {});
    showToast('Vendedor removido com sucesso.', 'info');
  };

  const toggleSellerActive = (sellerId: string) => {
    const prev = databaseRef.current;
    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      sellers: prev.sellers.map((s) => (s.id === sellerId ? { ...s, active: !s.active } : s)),
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    pushRemoteStoreDatabase(updated).catch(() => {});
  };

  // Goals management functions with automatic remote synchronization
  const updateStoreMonthlyGoal = (monthKey: string, goal: number) => {
    const safeGoal = Math.max(0, isNaN(goal) ? 0 : goal);
    const prev = databaseRef.current;
    const existingMonth = prev.months[monthKey] || { monthKey, days: {} };

    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      months: {
        ...prev.months,
        [monthKey]: {
          ...existingMonth,
          storeGoal: safeGoal,
        },
      },
      storeGoals: {
        ...(prev.storeGoals || {}),
        [monthKey]: safeGoal,
      },
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    pushRemoteStoreDatabase(updated).catch(() => {});
    showToast(`Meta da Loja para ${monthKey.split('-').reverse().join('/')} configurada: ${safeGoal} vendas!`, 'success');
  };

  const updateStoreGoal = (monthKey: string, indicatorId: string, value: number) => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    const prev = databaseRef.current;
    const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
    const currentGoals = { ...(existingMonth.goals || {}) };
    if (safeVal === 0) {
      delete currentGoals[indicatorId];
    } else {
      currentGoals[indicatorId] = safeVal;
    }

    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      months: {
        ...prev.months,
        [monthKey]: {
          ...existingMonth,
          goals: currentGoals,
        },
      },
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    pushRemoteStoreDatabase(updated).catch(() => {});
  };

  const updateAllStoreGoals = async (monthKey: string, goals: Record<string, number>) => {
    hasPendingEditsRef.current = false;
    const prev = databaseRef.current;
    const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
    const cleanGoals: Record<string, number> = {};
    Object.entries(goals).forEach(([k, v]) => {
      const num = Math.max(0, isNaN(v) ? 0 : v);
      if (num > 0) cleanGoals[k] = num;
    });

    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      months: {
        ...prev.months,
        [monthKey]: {
          ...existingMonth,
          goals: cleanGoals,
        },
      },
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    try {
      const res = await pushRemoteStoreDatabase(updated);
      if (res.success) {
        setSyncStatus('synced');
        setLastSyncTimeString(res.updatedAt);
      }
    } catch {}
    showToast(`Metas da loja para ${monthKey.split('-').reverse().join('/')} salvas com sucesso!`, 'success');
  };

  const clearStoreGoals = async (monthKey: string) => {
    hasPendingEditsRef.current = false;
    const prev = databaseRef.current;
    const existingMonth = prev.months[monthKey] || { monthKey, days: {} };
    const updated: StoreDatabase = {
      ...prev,
      updatedAt: new Date().toISOString(),
      months: {
        ...prev.months,
        [monthKey]: {
          ...existingMonth,
          goals: {},
        },
      },
    };
    setDatabase(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    try {
      const res = await pushRemoteStoreDatabase(updated);
      if (res.success) {
        setSyncStatus('synced');
        setLastSyncTimeString(res.updatedAt);
      }
    } catch {}
    showToast(`Metas do mês ${monthKey.split('-').reverse().join('/')} foram zeradas.`, 'info');
  };

  const resetToSampleData = () => {
    const demo = generateDemoSampleDatabase();
    setDatabase(demo);
    setSelectedDate(demo.lastSelectedDate);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch {}
    pushRemoteStoreDatabase(demo).catch(() => {});
    showToast('Dados de exemplo carregados e sincronizados com o servidor!', 'success');
  };

  const clearAllData = () => {
    const clean = createCleanDatabase();
    setDatabase(clean);
    setSelectedDate(clean.lastSelectedDate);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {}
    pushRemoteStoreDatabase(clean).catch(() => {});
    showToast('Todos os dados foram reiniciados com sucesso.', 'info');
  };

  const clearCacheAndReset = () => {
    try {
      localStorage.removeItem('claro_tiete_plaza_db_v1');
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear();
    } catch (e) {
      console.warn('Erro ao limpar localStorage:', e);
    }
    const freshDb = createCleanDatabase();
    setDatabase(freshDb);
    setSelectedDate(freshDb.lastSelectedDate);
    pushRemoteStoreDatabase(freshDb).catch(() => {});
    showToast('Cache local limpo e sistema sincronizado.', 'success');
  };

  const exportDatabaseJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(database, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `claro_tiete_plaza_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Backup JSON exportado com sucesso!', 'success');
    } catch {
      showToast('Erro ao exportar backup.', 'error');
    }
  };

  const exportDatabaseCSV = () => {
    try {
      const rows: string[] = [];
      rows.push('Data;Vendedor;Categoria;Indicador;Quantidade');
      Object.entries(database.months).forEach(([, monthData]) => {
        const m = monthData as MonthData;
        Object.entries(m.days || {}).forEach(([date, dayEntry]) => {
          const d = dayEntry as DailyEntry;
          Object.entries(d.values || {}).forEach(([indicatorId, sellerMap]) => {
            Object.entries(sellerMap || {}).forEach(([sellerId, qty]) => {
              if (Number(qty) > 0) {
                const seller = database.sellers.find((s) => s.id === sellerId);
                const sellerName = seller ? seller.name : sellerId;
                rows.push(`${date};${sellerName};;${indicatorId};${qty}`);
              }
            });
          });
        });
      });
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute('download', `claro_tiete_plaza_vendas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Relatório CSV exportado com sucesso!', 'success');
    } catch {
      showToast('Erro ao exportar CSV.', 'error');
    }
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.version && parsed.months && Array.isArray(parsed.sellers)) {
        const merged = mergeStoreDatabases(databaseRef.current, parsed);
        setDatabase(merged);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        pushRemoteStoreDatabase(merged).catch(() => {});
        showToast('Backup restaurado e sincronizado com o servidor com sucesso!', 'success');
        return true;
      }
      showToast('Arquivo de backup inválido.', 'error');
      return false;
    } catch {
      showToast('Erro ao processar arquivo JSON.', 'error');
      return false;
    }
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
        updateStoreMonthlyGoal,
        updateStoreGoal,
        updateAllStoreGoals,
        clearStoreGoals,
        resetToSampleData,
        clearAllData,
        clearCacheAndReset,
        exportDatabaseJSON,
        exportDatabaseCSV,
        importDatabaseJSON,
        syncStatus,
        lastSyncTime: lastSyncTimeString,
        manualSync,
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
