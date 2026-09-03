import { ResidentialSale, StoreDatabase } from '../types';
import { INITIAL_RESIDENTIAL_SALES, RESIDENTIAL_STORAGE_KEY } from './residentialStorage';

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

// Helper: Ensure every record has a unique ID and remove duplicates
export function deduplicateSales(sales: ResidentialSale[]): ResidentialSale[] {
  if (!Array.isArray(sales)) return [];
  const map = new Map<string, ResidentialSale>();

  for (const item of sales) {
    if (!item) continue;
    const id = item.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
          // Update local cache strictly as an offline fallback
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

  // Network failed on all endpoints: Fallback to LocalStorage cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(RESIDENTIAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            success: false,
            sales: deduplicateSales(parsed),
            source: 'local',
            updatedTime: getLastSyncTime(),
            error: 'Servidor indisponível. Carregando dados locais temporários.',
          };
        }
      }
    } catch {}
  }

  return {
    success: false,
    sales: INITIAL_RESIDENTIAL_SALES,
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
export async function fetchRemoteStoreDatabase(): Promise<StoreDatabase | null> {
  const endpoints = ['/api/store-db', '/.netlify/functions/database'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.months) {
          updateLastSyncTime();
          return result.data;
        }
      }
    } catch {}
  }
  return null;
}

export async function pushRemoteStoreDatabase(database: StoreDatabase): Promise<boolean> {
  updateLastSyncTime();
  const endpoints = ['/api/store-db', '/.netlify/functions/database'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database }),
      });
      if (response.ok) {
        return true;
      }
    } catch {}
  }
  return false;
}
