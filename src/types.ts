export interface IndicatorDefinition {
  id: string;
  name: string;
  subtitle?: string;
  categoryId: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  indicators: IndicatorDefinition[];
}

export interface Seller {
  id: string;
  name: string;
  active: boolean;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  passwordsCount?: string; // "SENHAS" do cabeçalho da folha
  notes?: string;
  // map indicatorId -> { sellerId: quantity }
  values: Record<string, Record<string, number>>;
  updatedAt: string;
}

export interface MonthData {
  monthKey: string; // YYYY-MM
  days: Record<string, DailyEntry>; // YYYY-MM-DD -> DailyEntry
  goals?: Record<string, number>; // indicatorId -> meta de vendas do mês
  storeGoal?: number; // Meta geral da loja para o mês selecionado (ex: 120)
}

export interface StoreGoalSummary {
  indicatorId: string;
  indicatorName: string;
  subtitle?: string;
  categoryId: string;
  categoryName: string;
  goal: number;
  realized: number;
  percent: number;
  remaining: number;
  status: 'achieved' | 'on_track' | 'warning' | 'no_goal';
}

export interface StoreDatabase {
  version: number;
  storeName: string;
  sellers: Seller[];
  months: Record<string, MonthData>;
  monthlyGoals?: Record<string, Record<string, number>>; // monthKey -> indicatorId -> goal
  storeGoals?: Record<string, number>; // monthKey -> Meta da loja (ex: 120)
  lastSelectedDate: string;
  updatedAt?: string;
}

export type ViewTab =
  | 'dashboard'
  | 'daily-entry'
  | 'residential-tracking'
  | 'seller-view'
  | 'indicator-view'
  | 'monthly-evolution'
  | 'ai-projection'
  | 'reports'
  | 'radio-mix'
  | 'settings';

export type ResidentialPeriod = '8:00 às 12:00' | '12:00 às 15:00' | '15:00 às 18:00';
export type YesNoOption = 'SIM' | 'NÃO';
export type ResidentialStatus = 'PENDENTE' | 'CONECTADO' | 'DESCONECTADO';

export interface ResidentialSale {
  id: string;
  contract: string; // Formato de referência: ____/____ (digitação livre)
  installationDate: string; // YYYY-MM-DD
  period: ResidentialPeriod; // Exatamente: '8:00 às 12:00' | '12:00 às 15:00' | '15:00 às 18:00'
  solar: YesNoOption; // 'SIM' | 'NÃO'
  mplay: YesNoOption; // 'SIM' | 'NÃO'
  service: string; // Ex: 'Fibra 350 Mega', 'Fibra 500 Mega', 'Fibra 750 Mega', 'Fibra 1 Giga'
  secondPointVirtua: YesNoOption; // 'SIM' | 'NÃO'
  cpf: string; // 000.000.000-00
  status: ResidentialStatus; // 'PENDENTE' | 'CONECTADO' | 'DESCONECTADO'
  sellerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentialFilterState {
  contract: string;
  cpf: string;
  installationDate: string;
  period: string; // 'all' | ResidentialPeriod
  solar: string; // 'all' | 'SIM' | 'NÃO'
  mplay: string; // 'all' | 'SIM' | 'NÃO'
  secondPointVirtua: string; // 'all' | 'SIM' | 'NÃO'
  service: string;
  status: string; // 'all' | 'PENDENTE' | 'CONECTADO' | 'DESCONECTADO'
}

export interface ResidentialSummary {
  totalInstallations: number;
  pendingCount: number;
  connectedCount: number;
  disconnectedCount: number;
  solarCount: number;
  mplayCount: number;
  secondPointVirtuaCount: number;
}

export interface KPIStats {
  totalSales: number;
  activeIndicatorsCount: number;
  dailyAverage: number;
  bestSeller: { name: string; total: number; share: number } | null;
  bestIndicator: { name: string; total: number; category: string } | null;
  projectedMonthEnd: number;
  daysWithSales: number;
  totalDaysInMonth: number;
}

export interface SellerStat {
  id: string;
  name: string;
  total: number;
  share: number;
  dailyAverage: number;
  topIndicator: string;
  categoryBreakdown: Record<string, number>;
}

export interface IndicatorStat {
  id: string;
  name: string;
  subtitle?: string;
  categoryId: string;
  categoryName: string;
  total: number;
  dailyAverage: number;
  bestSeller: { name: string; total: number } | null;
  sellerBreakdown: Record<string, number>;
  growthVsPreviousMonth?: number;
}

export interface FilterState {
  month: string; // YYYY-MM
  day: string; // 'all' or 'YYYY-MM-DD'
  sellerId: string; // 'all' or seller id
  categoryId: string; // 'all' or category id
  indicatorId: string; // 'all' or indicator id
}
