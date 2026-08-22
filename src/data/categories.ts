import { CategoryDefinition, Seller, StoreDatabase } from '../types';

export const DEFAULT_SELLERS: Seller[] = [
  { id: 's_alex', name: 'Alex', active: true },
  { id: 's_bruno', name: 'Bruno', active: true },
  { id: 's_diego', name: 'Diego', active: true },
  { id: 's_erick', name: 'Erick', active: true },
  { id: 's_giulia', name: 'Giulia', active: true },
  { id: 's_glaucia', name: 'Glaucia', active: true },
  { id: 's_guilherme', name: 'Guilherme', active: true },
  { id: 's_italo', name: 'Italo', active: true },
  { id: 's_joao', name: 'João', active: true },
  { id: 's_matheus', name: 'Matheus', active: true },
  { id: 's_patrick', name: 'Patrick', active: true },
];

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'gross',
    name: 'GROSS',
    color: '#DC2626', // Claro Red
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    indicators: [
      { id: 'pos_titular', name: 'PÓS (TITULAR)', categoryId: 'gross' },
      { id: 'pos_titular_solar', name: 'PÓS TITULAR ((SOLAR))', categoryId: 'gross' },
      { id: 'controle_solar', name: 'CONTROLE ((SOLAR))', categoryId: 'gross' },
      { id: 'dependente_solar', name: 'DEPENDENTE ((SOLAR))', categoryId: 'gross' },
      { id: 'dependente', name: 'DEPENDENTE', categoryId: 'gross' },
      { id: 'banda_larga', name: 'BANDA LARGA', categoryId: 'gross' },
      { id: 'dep_bl', name: 'DEP BL', categoryId: 'gross' },
      { id: 'controle_single', name: 'CONTROLE (SINGLE)', categoryId: 'gross' },
      { id: 'controle_mplay', name: 'CONTROLE (MPLAY)', categoryId: 'gross' },
      { id: 'pme_03', name: 'PME (03 para cada)', categoryId: 'gross' },
      { id: 'claro_flex', name: 'CLARO FLEX', categoryId: 'gross' },
    ],
  },
  {
    id: 'mplay',
    name: 'M-PLAY',
    color: '#E11D48', // Rose Red
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    indicators: [
      { id: 'entrada_conta', name: 'ENTRADA CONTA', categoryId: 'mplay' },
      { id: 'entrada_controle', name: 'ENTRADA CONTROLE', categoryId: 'mplay' },
      { id: 'entrada_fibra', name: 'ENTRADA FIBRA', categoryId: 'mplay' },
      { id: 'entrada_tv', name: 'ENTRADA TV', categoryId: 'mplay' },
      { id: 'entrada_novo_novo', name: 'ENTRADA NOVO NOVO', categoryId: 'mplay' },
    ],
  },
  {
    id: 'residenciais',
    name: 'RESIDENCIAIS',
    color: '#2563EB', // Blue
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    indicators: [
      { id: 'claro_fibra', name: 'CLARO FIBRA', categoryId: 'residenciais' },
      { id: 'venda_solar_1_cada', name: 'VENDA SOLAR (1 cada)', categoryId: 'residenciais' },
      { id: 'mesh', name: 'MESH', categoryId: 'residenciais' },
      { id: 'claro_box', name: 'CLARO BOX', categoryId: 'residenciais' },
      { id: 'claro_fibra_pme', name: 'CLARO FIBRA PME', categoryId: 'residenciais' },
    ],
  },
  {
    id: 'servicos',
    name: 'SERVIÇOS',
    color: '#D97706', // Amber
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    indicators: [
      { id: 'aparelhos', name: 'APARELHOS', categoryId: 'servicos' },
      { id: 'seguro', name: 'SEGURO', categoryId: 'servicos' },
      { id: 'seguro_avulso', name: 'SEGURO AVULSO', categoryId: 'servicos' },
      { id: 'pelicula', name: 'PELÍCULA', categoryId: 'servicos' },
      { id: 'acessorio_baixo', name: 'ACESSÓRIO BAIXO VALOR', subtitle: '(ATÉ R$ 399,00)', categoryId: 'servicos' },
      { id: 'acessorio_alto', name: 'ACESSÓRIO ALTO VALOR', subtitle: '(ACIMA R$ 399,00)', categoryId: 'servicos' },
      { id: 'claro_troca_fy', name: 'CLARO TROCA FY', categoryId: 'servicos' },
      { id: 'claro_geek', name: 'CLARO GEEK', categoryId: 'servicos' },
      { id: 'notebook', name: 'NOTEBOOK', categoryId: 'servicos' },
      { id: 'projetor', name: 'PROJETOR', categoryId: 'servicos' },
      { id: 'tablet', name: 'TABLET', categoryId: 'servicos' },
    ],
  },
  {
    id: 'portabilidades',
    name: 'PORTABILIDADES',
    color: '#7C3AED', // Violet
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    indicators: [
      { id: 'conta_vivo', name: 'CONTA VIVO', categoryId: 'portabilidades' },
      { id: 'controle_vivo', name: 'CONTROLE VIVO', categoryId: 'portabilidades' },
      { id: 'conta_tim', name: 'CONTA TIM', categoryId: 'portabilidades' },
      { id: 'controle_tim', name: 'CONTROLE TIM', categoryId: 'portabilidades' },
    ],
  },
];

export const ALL_INDICATORS = CATEGORIES.flatMap((c) => c.indicators);

export const INDICATOR_MAP = new Map(ALL_INDICATORS.map((i) => [i.id, i]));
export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

// Returns a fresh, clean database ready for new real operational daily entries
export function createCleanDatabase(): StoreDatabase {
  const today = new Date().toISOString().substring(0, 10);
  return {
    version: 2,
    storeName: 'Claro — Shopping Tietê Plaza',
    sellers: DEFAULT_SELLERS.map((s) => ({ ...s })),
    months: {},
    lastSelectedDate: today,
  };
}

// Default initial database starts clean
export function generateInitialDatabase(): StoreDatabase {
  return createCleanDatabase();
}

// Optional sample data generator for demonstrations if requested in settings
export function generateDemoSampleDatabase(): StoreDatabase {
  const sellers = DEFAULT_SELLERS.map((s) => ({ ...s }));
  const months: StoreDatabase['months'] = {};
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;
  const currentMonthKey = `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`;
  const daysInCurrentMonth = new Date(currentYear, currentMonthNum, 0).getDate();
  const currentDayNum = Math.min(today.getDate(), daysInCurrentMonth);

  const sampleDays: Record<string, any> = {};
  
  const sellerWeights: Record<string, number> = {
    s_alex: 1.3,
    s_diego: 1.2,
    s_giulia: 1.15,
    s_joao: 1.15,
    s_bruno: 1.1,
    s_erick: 1.05,
    s_guilherme: 1.0,
    s_glaucia: 0.95,
    s_matheus: 0.95,
    s_italo: 0.9,
    s_patrick: 0.85,
  };

  const indicatorPopularity: Record<string, number> = {
    pos_titular: 0.45,
    pos_titular_solar: 0.25,
    controle_solar: 0.3,
    dependente_solar: 0.2,
    dependente: 0.25,
    banda_larga: 0.15,
    dep_bl: 0.15,
    controle_single: 0.6,
    controle_mplay: 0.4,
    pme_03: 0.2,
    claro_flex: 0.2,
    entrada_conta: 0.25,
    entrada_controle: 0.3,
    entrada_fibra: 0.25,
    entrada_tv: 0.2,
    entrada_novo_novo: 0.2,
    claro_fibra: 0.5,
    venda_solar_1_cada: 0.2,
    mesh: 0.2,
    claro_box: 0.2,
    claro_fibra_pme: 0.15,
    aparelhos: 0.55,
    seguro: 0.3,
    seguro_avulso: 0.2,
    pelicula: 0.65,
    acessorio_baixo: 0.7,
    acessorio_alto: 0.4,
    claro_troca_fy: 0.2,
    claro_geek: 0.15,
    notebook: 0.15,
    projetor: 0.1,
    tablet: 0.2,
    conta_vivo: 0.2,
    controle_vivo: 0.25,
    conta_tim: 0.15,
    controle_tim: 0.2,
  };

  for (let day = 1; day <= currentDayNum; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const date = `${currentMonthKey}-${dayStr}`;
    const values: Record<string, Record<string, number>> = {};

    ALL_INDICATORS.forEach((ind) => {
      values[ind.id] = {};
      const baseChance = indicatorPopularity[ind.id] || 0.1;

      sellers.forEach((seller) => {
        const weight = sellerWeights[seller.id] || 1.0;
        const roll = Math.random();
        let qty = 0;

        if (roll < baseChance * weight * 0.7) {
          qty = 1;
          if (roll < baseChance * weight * 0.25) {
            qty = 2;
          }
          if (roll < baseChance * weight * 0.08 && ['acessorio_baixo', 'pelicula', 'controle_single'].includes(ind.id)) {
            qty = 3;
          }
        }
        values[ind.id][seller.id] = qty;
      });
    });

    sampleDays[date] = {
      date,
      passwordsCount: `${40 + (day % 15) * 3}`,
      values,
      updatedAt: new Date(currentYear, currentMonthNum - 1, day, 19, 30).toISOString(),
    };
  }

  months[currentMonthKey] = {
    monthKey: currentMonthKey,
    days: sampleDays,
  };

  return {
    version: 2,
    storeName: 'Claro — Shopping Tietê Plaza',
    sellers,
    months,
    lastSelectedDate: today.toISOString().substring(0, 10),
  };
}
