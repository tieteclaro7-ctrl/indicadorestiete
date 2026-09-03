import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Dashboard de Vendas Tietê Plaza" });
});

// ---------------------------------------------------------------------------
// Shared Persistent Data Store for Cross-Device Synchronization
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const RESIDENTIAL_FILE = path.join(DATA_DIR, "residential-sales.json");
const RESIDENTIAL_DELETED_FILE = path.join(DATA_DIR, "residential-deleted-ids.json");
const STORE_DB_FILE = path.join(DATA_DIR, "store-db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SEED_RESIDENTIAL_SALES = [
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

function deduplicateList(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const map = new Map<string, any>();
  for (const item of list) {
    if (!item) continue;
    const id = item.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, { ...item, id });
    } else {
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

// Memory caches declared before helper functions that reference them
let sharedResidentialSales: any[] = [];
let sharedStoreDb: any = null;
let lastSyncTimestamp: string = new Date().toISOString();

function loadDeletedSalesIds(): Set<string> {
  try {
    if (fs.existsSync(RESIDENTIAL_DELETED_FILE)) {
      const raw = fs.readFileSync(RESIDENTIAL_DELETED_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((id) => String(id)));
      }
    }
  } catch (err) {
    console.warn("Error reading residential deleted IDs file:", err);
  }
  return new Set<string>();
}

function persistDeletedSaleId(id: string) {
  if (!id) return;
  const deletedSet = loadDeletedSalesIds();
  deletedSet.add(String(id));
  try {
    fs.writeFileSync(
      RESIDENTIAL_DELETED_FILE,
      JSON.stringify(Array.from(deletedSet), null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("Error saving residential deleted IDs file:", err);
  }
}

function loadDiskResidentialSales(): any[] {
  const deletedIds = loadDeletedSalesIds();
  try {
    if (fs.existsSync(RESIDENTIAL_FILE)) {
      const raw = fs.readFileSync(RESIDENTIAL_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Return file contents filtered by permanently deleted IDs. NEVER auto re-seed if empty!
        return deduplicateList(parsed).filter((s: any) => s && s.id && !deletedIds.has(String(s.id)));
      }
    }
  } catch (err) {
    console.warn("Error reading residential sales file:", err);
  }
  return [];
}

function saveDiskResidentialSales(sales: any[]) {
  const deletedIds = loadDeletedSalesIds();
  const clean = deduplicateList(sales).filter((s: any) => s && s.id && !deletedIds.has(String(s.id)));
  sharedResidentialSales = clean;
  lastSyncTimestamp = new Date().toISOString();
  try {
    fs.writeFileSync(RESIDENTIAL_FILE, JSON.stringify(clean, null, 2), "utf-8");
  } catch (err) {
    console.warn("Error writing residential sales file:", err);
  }
}

const DEFAULT_STORE_SELLERS = [
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

function sanitizeStoreDb(db: any): any {
  if (!db || typeof db !== 'object') {
    return {
      version: 2,
      storeName: 'Claro — Shopping Tietê Plaza',
      sellers: DEFAULT_STORE_SELLERS,
      months: {},
      lastSelectedDate: new Date().toISOString().substring(0, 10),
    };
  }

  // Ensure all 11 official team sellers are ALWAYS preserved and active
  const sellerMap = new Map<string, any>();
  DEFAULT_STORE_SELLERS.forEach((s) => sellerMap.set(s.id, { ...s }));

  if (Array.isArray(db.sellers)) {
    db.sellers.forEach((s: any) => {
      if (s && s.id) {
        const def = sellerMap.get(s.id);
        sellerMap.set(s.id, {
          id: s.id,
          name: s.name || def?.name || s.id,
          active: true,
        });
      }
    });
  }

  const finalSellers = Array.from(sellerMap.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'pt-BR', { sensitivity: 'base' })
  );

  return {
    ...db,
    sellers: finalSellers,
  };
}

function loadDiskStoreDb(): any {
  try {
    if (fs.existsSync(STORE_DB_FILE)) {
      const raw = fs.readFileSync(STORE_DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return sanitizeStoreDb(parsed);
    }
  } catch (err) {
    console.warn("Error reading store db file:", err);
  }
  return sanitizeStoreDb(null);
}

function saveDiskStoreDb(db: any) {
  const sanitized = sanitizeStoreDb(db);
  sharedStoreDb = sanitized;
  lastSyncTimestamp = new Date().toISOString();
  try {
    fs.writeFileSync(STORE_DB_FILE, JSON.stringify(sanitized, null, 2), "utf-8");
  } catch (err) {
    console.warn("Error writing store db file:", err);
  }
}

// Initialize memory caches from disk
sharedResidentialSales = loadDiskResidentialSales();
sharedStoreDb = loadDiskStoreDb();

const RESIDENTIAL_ROUTES = [
  "/api/residential-sales",
  "/.netlify/functions/residential-sales",
  "/.netlify/functions/residential",
];

// 1. GET: Retrieve all current sales
app.get(RESIDENTIAL_ROUTES, (_req, res) => {
  const sales = loadDiskResidentialSales();
  res.json({
    success: true,
    sales,
    count: sales.length,
    updatedAt: lastSyncTimestamp,
  });
});

// 2. POST: Create a new sale OR replace full list
app.post(RESIDENTIAL_ROUTES, (req, res) => {
  const payload = req.body;
  const currentSales = loadDiskResidentialSales();

  // Full list replacement (e.g. backup import)
  if (Array.isArray(payload.sales)) {
    saveDiskResidentialSales(payload.sales);
    return res.json({
      success: true,
      sales: sharedResidentialSales,
      count: sharedResidentialSales.length,
      updatedAt: lastSyncTimestamp,
    });
  }

  // Single sale creation
  const newSale = payload.sale || payload;
  if (!newSale || (!newSale.contract && !newSale.id)) {
    return res.status(400).json({
      success: false,
      error: "Dados inválidos para nova venda residencial.",
    });
  }

  const now = new Date().toISOString();
  const cleanItem = {
    ...newSale,
    id: newSale.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: newSale.createdAt || now,
    updatedAt: now,
  };

  const filtered = currentSales.filter((s: any) => s.id !== cleanItem.id);
  const updated = [cleanItem, ...filtered];
  saveDiskResidentialSales(updated);

  return res.status(201).json({
    success: true,
    sale: cleanItem,
    sales: sharedResidentialSales,
    count: sharedResidentialSales.length,
    updatedAt: lastSyncTimestamp,
  });
});

// 3. PUT / PATCH: Update an existing sale
const handleUpdateSale = (req: express.Request, res: express.Response) => {
  const payload = req.body;
  const itemToUpdate = payload.sale || payload;

  if (!itemToUpdate || !itemToUpdate.id) {
    return res.status(400).json({
      success: false,
      error: "ID obrigatório para atualizar venda residencial.",
    });
  }

  const currentSales = loadDiskResidentialSales();
  const now = new Date().toISOString();
  let found = false;

  const updated = currentSales.map((item: any) => {
    if (item.id === itemToUpdate.id) {
      found = true;
      return {
        ...item,
        ...itemToUpdate,
        updatedAt: now,
      };
    }
    return item;
  });

  if (!found) {
    updated.unshift({
      ...itemToUpdate,
      createdAt: itemToUpdate.createdAt || now,
      updatedAt: now,
    });
  }

  saveDiskResidentialSales(updated);

  return res.json({
    success: true,
    sale: itemToUpdate,
    sales: sharedResidentialSales,
    count: sharedResidentialSales.length,
    updatedAt: lastSyncTimestamp,
  });
};

app.put(RESIDENTIAL_ROUTES, handleUpdateSale);
app.patch(RESIDENTIAL_ROUTES, handleUpdateSale);

// 4. DELETE: Delete a sale by ID
app.delete(RESIDENTIAL_ROUTES, (req, res) => {
  const idToDelete = (req.query.id as string) || req.body?.id;

  if (!idToDelete) {
    return res.status(400).json({
      success: false,
      error: "ID obrigatório para exclusão da venda residencial.",
    });
  }

  // Permanently record deletion in deleted IDs store
  persistDeletedSaleId(idToDelete);

  const currentSales = loadDiskResidentialSales();
  const filtered = currentSales.filter((s: any) => s.id !== idToDelete);
  saveDiskResidentialSales(filtered);

  return res.json({
    success: true,
    deletedId: idToDelete,
    sales: sharedResidentialSales,
    count: sharedResidentialSales.length,
    updatedAt: lastSyncTimestamp,
  });
});

// Store Database sync endpoints
const STORE_DB_ROUTES = ["/api/store-db", "/api/database", "/.netlify/functions/database"];

app.get(STORE_DB_ROUTES, (_req, res) => {
  const db = loadDiskStoreDb() || sharedStoreDb;
  res.json({
    success: true,
    data: db,
    updatedAt: lastSyncTimestamp,
  });
});

app.post(STORE_DB_ROUTES, (req, res) => {
  const payload = req.body;
  const db = payload.database || payload;
  saveDiskStoreDb(db);
  res.json({
    success: true,
    updatedAt: lastSyncTimestamp,
  });
});

// Dedicated routes for audio assets to ensure clean streaming with Range headers for mobile & desktop
app.get(["/ambient_techno.wav", "/futuristic_anthem.wav", "/05.mp3", "/electronic_anthem.wav"], (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "ambient_techno.wav");
  res.sendFile(filePath, {
    headers: {
      "Content-Type": "audio/wav",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000",
    },
  });
});

app.use(express.static(path.join(process.cwd(), "public")));
app.use("/assets", express.static(path.join(process.cwd(), "src", "assets")));

// API endpoint for AI sales projection & intelligent insights
app.post("/api/analyze", async (req, res) => {
  try {
    const { month, daysRecorded, totalDaysInMonth, totalSales, dailyAverage, projectedTotal, topSellers, topIndicators, lowIndicators, historicalComparison } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback structured message if no API key is provided
      return res.json({
        success: true,
        source: "fallback",
        analysis: `Até o momento foram registradas ${totalSales || 0} vendas em ${daysRecorded || 0} dias computados. Mantendo o ritmo médio diário de ${(dailyAverage || 0).toFixed(1)} vendas/dia, a projeção de fechamento para ${month} é de aproximadamente ${Math.round(projectedTotal || 0)} vendas.\n\n` +
          `• Destaques: ${(topSellers || []).slice(0, 2).map((s: any) => `${s.name} (${s.total} vendas)`).join(", ")} lideram o ranking.\n` +
          `• Principais Produtos: ${(topIndicators || []).slice(0, 3).map((i: any) => i.name).join(", ")}.\n` +
          `• Pontos de Atenção: Foco necessário em ${(lowIndicators || []).slice(0, 2).map((i: any) => i.name).join(", ") || "produtos secundários"}.`
      });
    }

    const prompt = `Você é o consultor executivo e analista comercial da loja Claro Tietê Plaza.
Analise os números reais de vendas do mês de ${month}:

DADOS DO MÊS:
- Dias com vendas lançadas: ${daysRecorded} de ${totalDaysInMonth} dias
- Total de vendas realizadas até agora: ${totalSales}
- Média diária: ${dailyAverage?.toFixed(1)} vendas/dia
- Projeção estatística de fechamento: ${Math.round(projectedTotal || 0)} vendas
- Melhores vendedores: ${JSON.stringify(topSellers?.slice(0, 4) || [])}
- Indicadores mais fortes: ${JSON.stringify(topIndicators?.slice(0, 4) || [])}
- Indicadores com menor volume: ${JSON.stringify(lowIndicators?.slice(0, 4) || [])}
- Comparativo histórico: ${JSON.stringify(historicalComparison || {})}

DIRETRIZES:
1. Faça uma análise curta, objetiva, profissional e motivadora em português (máximo 3 parágrafos curtos ou tópicos diretos).
2. Não invente números fora dos fornecidos.
3. Destaque: Ritmo atual, Projeção calculada, Indicadores em alta, Indicadores para alavancar e Destaque da equipe.
4. Linguagem comercial do varejo de telecomunicações (Claro, Gross, Fibra, Serviços).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({
      success: true,
      source: "gemini",
      analysis: response.text || "Análise concluída com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro na análise IA:", error);
    return res.status(200).json({
      success: true,
      source: "fallback_on_error",
      analysis: "Até o momento foram registradas vendas consistentes. Acompanhe a média diária e mantenha o foco nos indicadores prioritários (Gross, Claro Fibra e Aparelhos).",
    });
  }
});

// Vite middleware for development vs static build for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dashboard Tietê Plaza rodando em http://localhost:${PORT}`);
  });
}

startServer();
