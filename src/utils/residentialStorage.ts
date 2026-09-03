import { ResidentialSale, ResidentialFilterState, ResidentialSummary } from '../types';

export const RESIDENTIAL_STORAGE_KEY = 'claro_residential_sales_tracking_v1';
export const RESIDENTIAL_DELETED_KEY = 'claro_residential_deleted_ids';

export function getDeletedResidentialIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(RESIDENTIAL_DELETED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((id) => String(id)));
      }
    }
  } catch {}
  return new Set();
}

export function recordDeletedResidentialId(id: string): void {
  if (!id || typeof window === 'undefined') return;
  try {
    const set = getDeletedResidentialIds();
    set.add(String(id));
    localStorage.setItem(RESIDENTIAL_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export const RESIDENTIAL_SELLERS = [
  'Diego',
  'Bruno',
  'Giulia',
  'João',
  'Glaucia',
  'Matheus',
  'Erick',
  'Patrick',
  'Alex',
  'Guilherme',
  'Italo',
] as const;

export const RESIDENTIAL_PRODUCTS = [
  'Fibra 350 mega',
  'Fibra 600 ou 500 mega',
  'Fibra 1GB',
  'TV BOX',
  'Sound BOX',
  'Fibra + TV',
];

export const COMMON_RESIDENTIAL_SERVICES = RESIDENTIAL_PRODUCTS;

export const PERIOD_OPTIONS = [
  '08:00-12:00',
  '12:00-15:00',
  '15:00-18:00',
] as const;

export const MPLAY_OPTIONS = [
  'Sim Fibra',
  'Sim TV',
  'Sim Ambas',
  'Não',
] as const;

export const SOLAR_OPTIONS = [
  'Sim',
  'Não',
] as const;

export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isoToBrDate(iso: string): string {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return iso;
}

export function brDateToIso(br: string): string {
  if (!br) return '';
  if (br.includes('-')) return br;
  const parts = br.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return br;
}

export function getTodayBrDate(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Seed initial realistic data for first use
export const INITIAL_RESIDENTIAL_SALES: ResidentialSale[] = [
  {
    id: 'res-sale-1',
    contract: '1048/2026',
    installationDate: '2026-08-28',
    period: '8:00 às 12:00',
    solar: 'SIM',
    mplay: 'SIM',
    service: 'Fibra 500 Mega',
    secondPointVirtua: 'NÃO',
    cpf: '348.912.840-19',
    status: 'CONECTADO',
    sellerName: 'ALEX RIBEIRO',
    notes: 'Instalação concluída com sucesso no período matutino.',
    createdAt: '2026-08-28T09:30:00.000Z',
    updatedAt: '2026-08-28T11:45:00.000Z',
  },
  {
    id: 'res-sale-2',
    contract: '1052/2026',
    installationDate: '2026-08-28',
    period: '12:00 às 15:00',
    solar: 'NÃO',
    mplay: 'SIM',
    service: 'Fibra 750 Mega',
    secondPointVirtua: 'SIM',
    cpf: '412.783.921-55',
    status: 'PENDENTE',
    sellerName: 'LUCAS RODRIGUES',
    notes: 'Aguardando equipe técnica externa.',
    createdAt: '2026-08-28T10:15:00.000Z',
    updatedAt: '2026-08-28T14:20:00.000Z',
  },
  {
    id: 'res-sale-3',
    contract: '1059/2026',
    installationDate: '2026-08-29',
    period: '15:00 às 18:00',
    solar: 'SIM',
    mplay: 'NÃO',
    service: 'Fibra 1 Giga',
    secondPointVirtua: 'SIM',
    cpf: '298.451.762-08',
    status: 'CONECTADO',
    sellerName: 'MATHEUS SILVA',
    notes: 'Cliente optou por plano Gamer 1 Giga.',
    createdAt: '2026-08-29T11:00:00.000Z',
    updatedAt: '2026-08-29T16:30:00.000Z',
  },
  {
    id: 'res-sale-4',
    contract: '1063/2026',
    installationDate: '2026-08-30',
    period: '8:00 às 12:00',
    solar: 'NÃO',
    mplay: 'NÃO',
    service: 'Fibra 350 Mega',
    secondPointVirtua: 'NÃO',
    cpf: '185.632.490-44',
    status: 'DESCONECTADO',
    sellerName: 'GABRIEL SOUZA',
    notes: 'Cliente ausente no endereço. Quebra de instalação.',
    createdAt: '2026-08-30T08:45:00.000Z',
    updatedAt: '2026-08-30T11:50:00.000Z',
  },
  {
    id: 'res-sale-5',
    contract: '1070/2026',
    installationDate: '2026-08-31',
    period: '12:00 às 15:00',
    solar: 'SIM',
    mplay: 'SIM',
    service: 'Fibra 500 Mega',
    secondPointVirtua: 'NÃO',
    cpf: '523.109.847-33',
    status: 'PENDENTE',
    sellerName: 'ISABELA LIMA',
    notes: 'Adesão conjunta Solar + M-Play agendada.',
    createdAt: '2026-08-31T09:10:00.000Z',
    updatedAt: '2026-08-31T13:40:00.000Z',
  },
  {
    id: 'res-sale-6',
    contract: '1075/2026',
    installationDate: '2026-08-31',
    period: '15:00 às 18:00',
    solar: 'NÃO',
    mplay: 'SIM',
    service: 'Fibra 750 Mega',
    secondPointVirtua: 'SIM',
    cpf: '371.492.650-89',
    status: 'CONECTADO',
    sellerName: 'FELIPE COSTA',
    notes: 'Instalação concluída.',
    createdAt: '2026-08-31T14:00:00.000Z',
    updatedAt: '2026-08-31T17:10:00.000Z',
  },
];

// Helper: Format CPF 000.000.000-00
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

// Helper: Format Contract (suggests ____/____ or keeps free typing)
export function formatContract(value: string): string {
  // Allow free typing as requested
  return value.trim();
}

// Next Status Cycle: PENDENTE -> CONECTADO -> DESCONECTADO -> PENDENTE
export function getNextResidentialStatus(current: string): 'PENDENTE' | 'CONECTADO' | 'DESCONECTADO' {
  if (current === 'PENDENTE') return 'CONECTADO';
  if (current === 'CONECTADO') return 'DESCONECTADO';
  return 'PENDENTE';
}

// Get all sales from localStorage (strictly isolated cache)
export function getResidentialSales(): ResidentialSale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RESIDENTIAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deletedIds = getDeletedResidentialIds();
      return parsed.filter((item: any) => item && item.id && !deletedIds.has(String(item.id)));
    }
    return [];
  } catch (err) {
    console.error('Error loading residential sales from localStorage:', err);
    return [];
  }
}

// Save all sales to localStorage
export function saveResidentialSales(sales: ResidentialSale[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(RESIDENTIAL_STORAGE_KEY, JSON.stringify(sales));
    return true;
  } catch (err) {
    console.error('Error saving residential sales to localStorage:', err);
    return false;
  }
}

// Compute Summary Metrics based on records
export function calculateResidentialSummary(sales: ResidentialSale[]): ResidentialSummary {
  let pending = 0;
  let connected = 0;
  let disconnected = 0;
  let solar = 0;
  let mplay = 0;
  let secondPoint = 0;

  sales.forEach((s) => {
    if (s.status === 'PENDENTE') pending++;
    else if (s.status === 'CONECTADO') connected++;
    else if (s.status === 'DESCONECTADO') disconnected++;

    const sol = String(s.solar || '').trim().toLowerCase();
    if (sol === 'sim') solar++;

    const mp = String(s.mplay || '').trim().toLowerCase();
    if (mp && mp !== 'não' && mp !== 'nao') mplay++;

    const sp = String(s.secondPointVirtua || '').trim().toLowerCase();
    if (sp === 'sim') secondPoint++;
  });

  return {
    totalInstallations: sales.length,
    pendingCount: pending,
    connectedCount: connected,
    disconnectedCount: disconnected,
    solarCount: solar,
    mplayCount: mplay,
    secondPointVirtuaCount: secondPoint,
  };
}

// Filter Sales
export function filterResidentialSales(
  sales: ResidentialSale[],
  filters: ResidentialFilterState
): ResidentialSale[] {
  return sales.filter((item) => {
    // Contract filter (case-insensitive substring)
    if (filters.contract && !item.contract.toLowerCase().includes(filters.contract.toLowerCase().trim())) {
      return false;
    }

    // CPF filter (numeric or formatted comparison)
    if (filters.cpf) {
      const cleanFilterCpf = filters.cpf.replace(/\D/g, '');
      const cleanItemCpf = item.cpf.replace(/\D/g, '');
      if (!cleanItemCpf.includes(cleanFilterCpf)) {
        return false;
      }
    }

    // Installation Date filter (supports DD/MM/AAAA or YYYY-MM-DD comparison)
    if (filters.installationDate) {
      const targetIso = filters.installationDate.includes('/')
        ? brDateToIso(filters.installationDate)
        : filters.installationDate;
      const itemIso = item.installationDate.includes('/')
        ? brDateToIso(item.installationDate)
        : item.installationDate;
      if (targetIso !== itemIso) {
        return false;
      }
    }

    // Period filter
    if (filters.period && filters.period !== 'all') {
      const pNorm = (p: string) => p.replace(/\s+/g, '').replace('às', '-');
      if (pNorm(item.period) !== pNorm(filters.period) && item.period !== filters.period) {
        return false;
      }
    }

    // Solar filter
    if (filters.solar && filters.solar !== 'all') {
      const fSol = filters.solar.toLowerCase();
      const iSol = String(item.solar || '').toLowerCase();
      if (fSol !== iSol) {
        return false;
      }
    }

    // M-Play filter
    if (filters.mplay && filters.mplay !== 'all') {
      const fMp = filters.mplay.toLowerCase();
      const iMp = String(item.mplay || '').toLowerCase();
      if (fMp === 'sim') {
        if (iMp === 'não' || iMp === 'nao' || !iMp) return false;
      } else if (fMp === 'não' || fMp === 'nao') {
        if (iMp !== 'não' && iMp !== 'nao') return false;
      } else if (fMp !== iMp) {
        return false;
      }
    }

    // 2º Ponto Virtua filter
    if (filters.secondPointVirtua && filters.secondPointVirtua !== 'all') {
      const fSp = filters.secondPointVirtua.toLowerCase();
      const iSp = String(item.secondPointVirtua || '').toLowerCase();
      if (fSp !== iSp) {
        return false;
      }
    }

    // Service filter (case-insensitive substring)
    if (filters.service && !item.service.toLowerCase().includes(filters.service.toLowerCase().trim())) {
      return false;
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    return true;
  });
}

// Export backup to JSON file
export function exportResidentialSalesJSON(sales: ResidentialSale[]) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sales, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `backup_acompanhamento_residencial_claro_${dateSuffix}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Import backup from JSON file
export function importResidentialSalesJSON(file: File): Promise<ResidentialSale[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('O arquivo importado deve conter uma lista válida de vendas residenciais.');
        }
        // Basic schema verification
        const validItems = parsed.filter(
          (i) => i && typeof i.contract === 'string' && typeof i.installationDate === 'string'
        );
        if (validItems.length === 0 && parsed.length > 0) {
          throw new Error('Nenhum registro compatível encontrado no arquivo.');
        }
        resolve(validItems);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo selecionado.'));
    reader.readAsText(file);
  });
}
