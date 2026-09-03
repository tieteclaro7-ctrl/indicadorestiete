import { ResidentialSale, StoreDatabase } from '../types';
import {
  RESIDENTIAL_STORAGE_KEY,
  getDeletedResidentialIds,
  recordDeletedResidentialId,
} from './residentialStorage';

export function formatCurrentTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

let lastSyncTimeString: string = formatCurrentTime();

export function getLastSyncTime(): string {
  return lastSyncTimeString;
}

export function updateLastSyncTime(customTime?: string): string {
  lastSyncTimeString = customTime || formatCurrentTime();
  return lastSyncTimeString;
}

const RESIDENTIAL_ENDPOINTS = [
  '/.netlify/functions/residential-sales',
  '/api/residential-sales',
  '/.netlify/functions/residential',
];

// Helper: Ensure every record has a unique ID, remove duplicates, and filter out deleted IDs
export function deduplicateSales(sales: ResidentialSale[]): ResidentialSale[] {
  if (!Array.isArray(sales)) return [];
  const deletedIds = getDeletedResidentialIds();
  const map = new Map<string, ResidentialSale>();

  for (const item of sales) {
    if (!item || !item.id) continue;
    const id = String(item.id);
    if (deletedIds.has(id)) continue; // Never resurrect permanently deleted sales

    const existing = map.get(id);
    if (!existing) {
      map.set(id, { ...item, id });
    } else {
      // Keep record with newer updatedAt
      const exTime = new Date(existing.updatedAt || 0).getTime();
      const itemTime = new Date(item.updatedAt || 0).getTime();
      if (itemTime >= exTime) {
        map.set(id, { ...item, id });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const da = new Date(a.installationDate || a.createdAt || 0).getTime();
    const db = new Date(b.installationDate || b.createdAt || 0).getTime();
    return db - da;
  });
}

// ---------------------------------------------------------------------------
// Residential Sales: Remote Shared Fetch (GET)
// ---------------------------------------------------------------------------
export async function fetchRemoteResidentialSales(): Promise<{
  success: boolean;
  sales: ResidentialSale[];
  source: 'remote' | 'local';
  updatedTime: string;
  error?: string;
}> {
  for (const endpoint of RESIDENTIAL_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.sales)) {
          const cleanSales = deduplicateSales(data.sales);
          // Update local cache strictly as an offline mirror of authoritative server data
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(cleanSales));
            } catch {}
          }
          const time = formatCurrentTime();
          updateLastSyncTime(time);
          return {
            success: true,
            sales: cleanSales,
            source: 'remote',
            updatedTime: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  // Network failed on all endpoints: Fallback to LocalStorage cache only
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(RESIDENTIAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return {
            success: false,
            sales: deduplicateSales(parsed),
            source: 'local',
            updatedTime: getLastSyncTime(),
            error: 'Servidor indisponível. Exibindo cache local temporário.',
          };
        }
      }
    } catch {}
  }

  return {
    success: false,
    sales: [],
    source: 'local',
    updatedTime: getLastSyncTime(),
    error: 'Sem conexão com o servidor compartilhado.',
  };
}

// ---------------------------------------------------------------------------
// Residential Sales: Create new sale (POST)
// ---------------------------------------------------------------------------
export async function createRemoteResidentialSale(sale: ResidentialSale): Promise<{
  success: boolean;
  sales?: ResidentialSale[];
  sale?: ResidentialSale;
  updatedTime?: string;
  error?: string;
}> {
  const payload = { sale };

  for (const endpoint of RESIDENTIAL_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.sales)) {
          const cleanSales = deduplicateSales(data.sales);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(cleanSales));
            } catch {}
          }
          const time = formatCurrentTime();
          updateLastSyncTime(time);
          return {
            success: true,
            sales: cleanSales,
            sale: data.sale || sale,
            updatedTime: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: false,
    error: 'Não foi possível salvar a venda no servidor compartilhado.',
  };
}

// ---------------------------------------------------------------------------
// Residential Sales: Update sale (PUT)
// ---------------------------------------------------------------------------
export async function updateRemoteResidentialSale(sale: ResidentialSale): Promise<{
  success: boolean;
  sales?: ResidentialSale[];
  sale?: ResidentialSale;
  updatedTime?: string;
  error?: string;
}> {
  const payload = { sale };

  for (const endpoint of RESIDENTIAL_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.sales)) {
          const cleanSales = deduplicateSales(data.sales);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(cleanSales));
            } catch {}
          }
          const time = formatCurrentTime();
          updateLastSyncTime(time);
          return {
            success: true,
            sales: cleanSales,
            sale: data.sale || sale,
            updatedTime: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: false,
    error: 'Não foi possível atualizar a venda no servidor compartilhado.',
  };
}

// ---------------------------------------------------------------------------
// Residential Sales: Delete sale (DELETE)
// ---------------------------------------------------------------------------
export async function deleteRemoteResidentialSale(id: string): Promise<{
  success: boolean;
  sales?: ResidentialSale[];
  updatedTime?: string;
  error?: string;
}> {
  // 1. Immediately record deletion in local tombstone
  recordDeletedResidentialId(id);

  // 2. Purge from local storage cache immediately
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(RESIDENTIAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s: any) => s && String(s.id) !== String(id));
          localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(filtered));
        }
      }
    } catch {}
  }

  for (const endpoint of RESIDENTIAL_ENDPOINTS) {
    try {
      const url = `${endpoint}?id=${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.sales)) {
          const cleanSales = deduplicateSales(data.sales);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(cleanSales));
            } catch {}
          }
          const time = formatCurrentTime();
          updateLastSyncTime(time);
          return {
            success: true,
            sales: cleanSales,
            updatedTime: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: false,
    error: 'Não foi possível excluir a venda do servidor compartilhado.',
  };
}

// ---------------------------------------------------------------------------
// Residential Sales: Bulk Replace (e.g. backup restore)
// ---------------------------------------------------------------------------
export async function replaceRemoteResidentialSales(sales: ResidentialSale[]): Promise<{
  success: boolean;
  sales?: ResidentialSale[];
  updatedTime?: string;
  error?: string;
}> {
  const clean = deduplicateSales(sales);
  for (const endpoint of RESIDENTIAL_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sales: clean }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.sales)) {
          const cleanSales = deduplicateSales(data.sales);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(cleanSales));
            } catch {}
          }
          const time = formatCurrentTime();
          updateLastSyncTime(time);
          return {
            success: true,
            sales: cleanSales,
            updatedTime: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: false,
    error: 'Não foi possível enviar o lote de dados para o servidor.',
  };
}

// Backwards compatibility alias
export async function pushRemoteResidentialSales(sales: ResidentialSale[]): Promise<boolean> {
  const res = await replaceRemoteResidentialSales(sales);
  return res.success;
}

// ---------------------------------------------------------------------------
// Store Database Sync (Daily sales, goals, sellers)
// ---------------------------------------------------------------------------
const STORE_DB_ENDPOINTS = [
  '/.netlify/functions/database',
  '/api/store-db',
  '/api/database',
];

export interface RemoteDbFetchResult {
  success: boolean;
  data: StoreDatabase | null;
  source: 'remote' | 'local';
  updatedAt: string;
  error?: string;
}

export interface RemoteDbPushResult {
  success: boolean;
  updatedAt: string;
  error?: string;
}

// Helper to safely merge local and remote databases without losing any entries
export function mergeStoreDatabases(
  local: StoreDatabase | null | undefined,
  remote: StoreDatabase | null | undefined
): StoreDatabase {
  if (!local && remote) return remote;
  if (local && !remote) return local;
  if (!local && !remote) {
    const today = new Date().toISOString().substring(0, 10);
    return {
      version: 2,
      storeName: 'Claro — Shopping Tietê Plaza',
      sellers: [],
      months: {},
      lastSelectedDate: today,
    };
  }

  const baseLocal = local!;
  const baseRemote = remote!;

  // Merge sellers: keep unique sellers, prefer remote name if available, preserve active local sellers
  const sellerMap = new Map<string, any>();
  (baseLocal.sellers || []).forEach((s) => {
    if (s && s.id) sellerMap.set(s.id, { ...s });
  });
  (baseRemote.sellers || []).forEach((s) => {
    if (s && s.id) {
      const existing = sellerMap.get(s.id);
      sellerMap.set(s.id, {
        id: s.id,
        name: s.name || existing?.name || '',
        active: s.active !== undefined ? s.active : existing?.active ?? true,
      });
    }
  });

  const mergedSellers = Array.from(sellerMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Merge Store Goals
  const mergedStoreGoals: Record<string, number> = {
    ...(baseLocal.storeGoals || {}),
    ...(baseRemote.storeGoals || {}),
  };

  // Merge Monthly Goals
  const mergedMonthlyGoals: Record<string, Record<string, number>> = {};
  const allMonthlyGoalKeys = new Set([
    ...Object.keys(baseLocal.monthlyGoals || {}),
    ...Object.keys(baseRemote.monthlyGoals || {}),
  ]);
  allMonthlyGoalKeys.forEach((mKey) => {
    mergedMonthlyGoals[mKey] = {
      ...(baseLocal.monthlyGoals?.[mKey] || {}),
      ...(baseRemote.monthlyGoals?.[mKey] || {}),
    };
  });

  // Merge Months & Daily Entries
  const mergedMonths: Record<string, any> = {};
  const allMonthKeys = new Set([
    ...Object.keys(baseLocal.months || {}),
    ...Object.keys(baseRemote.months || {}),
  ]);

  allMonthKeys.forEach((mKey) => {
    const localMonth = baseLocal.months?.[mKey];
    const remoteMonth = baseRemote.months?.[mKey];

    if (localMonth && !remoteMonth) {
      mergedMonths[mKey] = localMonth;
      return;
    }
    if (!localMonth && remoteMonth) {
      mergedMonths[mKey] = remoteMonth;
      return;
    }

    // Both exist: merge days
    const mergedDays: Record<string, any> = {};
    const allDayKeys = new Set([
      ...Object.keys(localMonth.days || {}),
      ...Object.keys(remoteMonth.days || {}),
    ]);

    allDayKeys.forEach((dKey) => {
      const localDay = localMonth.days?.[dKey];
      const remoteDay = remoteMonth.days?.[dKey];

      if (localDay && !remoteDay) {
        mergedDays[dKey] = localDay;
        return;
      }
      if (!localDay && remoteDay) {
        mergedDays[dKey] = remoteDay;
        return;
      }

      // Both have entries for this date: keep the one with values or newer updatedAt
      const localHasValues = Object.keys(localDay.values || {}).some(
        (ind) => Object.values(localDay.values[ind] || {}).some((v) => Number(v) > 0)
      );
      const remoteHasValues = Object.keys(remoteDay.values || {}).some(
        (ind) => Object.values(remoteDay.values[ind] || {}).some((v) => Number(v) > 0)
      );

      if (localHasValues && !remoteHasValues) {
        mergedDays[dKey] = localDay;
        return;
      }
      if (!localHasValues && remoteHasValues) {
        mergedDays[dKey] = remoteDay;
        return;
      }

      const tLocal = new Date(localDay.updatedAt || 0).getTime();
      const tRemote = new Date(remoteDay.updatedAt || 0).getTime();

      if (tLocal > tRemote) {
        mergedDays[dKey] = localDay;
      } else {
        mergedDays[dKey] = remoteDay;
      }
    });

    mergedMonths[mKey] = {
      monthKey: mKey,
      days: mergedDays,
      goals: {
        ...(localMonth.goals || {}),
        ...(remoteMonth.goals || {}),
      },
      storeGoal: remoteMonth.storeGoal ?? localMonth.storeGoal,
    };
  });

  return {
    version: Math.max(baseLocal.version || 2, baseRemote.version || 2),
    storeName: baseRemote.storeName || baseLocal.storeName || 'Claro — Shopping Tietê Plaza',
    sellers: mergedSellers,
    months: mergedMonths,
    storeGoals: mergedStoreGoals,
    monthlyGoals: mergedMonthlyGoals,
    lastSelectedDate: baseRemote.lastSelectedDate || baseLocal.lastSelectedDate || new Date().toISOString().substring(0, 10),
  };
}

// Helper to quickly test if two StoreDatabase states are identical
export function areStoreDatabasesEqual(
  a: StoreDatabase | null | undefined,
  b: StoreDatabase | null | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export async function fetchRemoteStoreDatabase(): Promise<RemoteDbFetchResult> {
  for (const endpoint of STORE_DB_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        if (result && result.success && result.data && typeof result.data === 'object') {
          const time = formatCurrentTime();
          updateLastSyncTime(time);
          return {
            success: true,
            data: result.data,
            source: 'remote',
            updatedAt: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: false,
    data: null,
    source: 'local',
    updatedAt: getLastSyncTime(),
    error: 'Não foi possível conectar ao servidor compartilhado.',
  };
}

export async function pushRemoteStoreDatabase(database: StoreDatabase): Promise<RemoteDbPushResult> {
  const payload = { database };
  const time = formatCurrentTime();

  for (const endpoint of STORE_DB_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        if (result && result.success) {
          updateLastSyncTime(time);
          return {
            success: true,
            updatedAt: time,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return {
    success: false,
    updatedAt: time,
    error: 'Falha ao salvar dados no servidor compartilhado.',
  };
}

