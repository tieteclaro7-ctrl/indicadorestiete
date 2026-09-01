import { ResidentialSale, StoreDatabase } from '../types';
import { INITIAL_RESIDENTIAL_SALES, RESIDENTIAL_STORAGE_KEY } from './residentialStorage';

const STORE_STORAGE_KEY = 'claro_tiete_plaza_db_v2';
let lastSyncTimeString: string = formatCurrentTime();

function formatCurrentTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getLastSyncTime(): string {
  return lastSyncTimeString;
}

export function updateLastSyncTime(): string {
  lastSyncTimeString = formatCurrentTime();
  return lastSyncTimeString;
}

// ---------------------------------------------------------------------------
// Residential Sales Sync
// ---------------------------------------------------------------------------

export async function fetchRemoteResidentialSales(): Promise<{ sales: ResidentialSale[]; source: 'remote' | 'local' }> {
  // 1. Try Netlify function / API endpoints
  const endpoints = ['/api/residential-sales', '/.netlify/functions/residential'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.sales) && data.sales.length > 0) {
          // Merge with local to avoid losing local-only additions
          const remoteSales: ResidentialSale[] = data.sales;
          const localRaw = typeof window !== 'undefined' ? localStorage.getItem(RESIDENTIAL_STORAGE_KEY) : null;
          let merged = remoteSales;

          if (localRaw) {
            try {
              const localSales: ResidentialSale[] = JSON.parse(localRaw);
              if (Array.isArray(localSales)) {
                const map = new Map<string, ResidentialSale>();
                remoteSales.forEach((s) => map.set(s.id, s));
                localSales.forEach((s) => {
                  if (!map.has(s.id)) {
                    map.set(s.id, s);
                  } else {
                    // Compare updated dates if present
                    const rem = map.get(s.id)!;
                    if (new Date(s.updatedAt || 0) > new Date(rem.updatedAt || 0)) {
                      map.set(s.id, s);
                    }
                  }
                });
                merged = Array.from(map.values());
              }
            } catch {
              // Ignore parse error
            }
          }

          // Cache in local storage
          if (typeof window !== 'undefined') {
            localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(merged));
          }
          updateLastSyncTime();
          return { sales: merged, source: 'remote' };
        }
      }
    } catch {
      // Continue to next endpoint or local fallback
    }
  }

  // 2. Fallback to LocalStorage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(RESIDENTIAL_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Push to remote in background so other devices get it
          pushRemoteResidentialSales(parsed).catch(() => {});
          return { sales: parsed, source: 'local' };
        }
      } catch {
        // Ignore
      }
    }
  }

  return { sales: INITIAL_RESIDENTIAL_SALES, source: 'local' };
}

export async function pushRemoteResidentialSales(sales: ResidentialSale[]): Promise<boolean> {
  // Always update local cache first
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(sales));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }
  updateLastSyncTime();

  const endpoints = ['/api/residential-sales', '/.netlify/functions/residential'];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales }),
      });
      if (response.ok) {
        return true;
      }
    } catch {
      // Try next endpoint
    }
  }
  return false;
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
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.months) {
          updateLastSyncTime();
          return result.data;
        }
      }
    } catch {
      // Next
    }
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
    } catch {
      // Next
    }
  }
  return false;
}
