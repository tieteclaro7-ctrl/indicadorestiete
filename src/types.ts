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
}

export interface StoreDatabase {
  version: number;
  storeName: string;
  sellers: Seller[];
  months: Record<string, MonthData>;
  lastSelectedDate: string;
}

export type ViewTab =
  | 'dashboard'
  | 'daily-entry'
  | 'seller-view'
  | 'indicator-view'
  | 'monthly-evolution'
  | 'ai-projection'
  | 'reports'
  | 'settings';

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
