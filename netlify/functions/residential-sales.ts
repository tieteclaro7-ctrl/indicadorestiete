import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Fallback in-memory store if Blobs context is unavailable
let inMemorySales: any[] = [];

const SEED_SALES = [
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

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

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
  return Array.from(map.values());
}

async function getStoreInstance() {
  try {
    return getStore({ name: "claro-residential-store", consistency: "strong" });
  } catch (err) {
    console.warn("Netlify Blobs getStore error, falling back to memory:", err);
    return null;
  }
}

async function loadCurrentSales(store: any): Promise<any[]> {
  if (store) {
    try {
      const raw = await store.get("residential-sales", { type: "json" });
      if (raw && Array.isArray(raw) && raw.length > 0) {
        return deduplicateList(raw);
      }
    } catch (e) {
      console.warn("Netlify Blobs read error:", e);
    }
  }
  if (inMemorySales && inMemorySales.length > 0) {
    return deduplicateList(inMemorySales);
  }
  // Initialize with seed data
  const initial = deduplicateList(SEED_SALES);
  inMemorySales = initial;
  if (store) {
    try {
      await store.setJSON("residential-sales", initial);
    } catch (e) {
      console.warn("Netlify Blobs seed write error:", e);
    }
  }
  return initial;
}

async function saveCurrentSales(store: any, sales: any[]): Promise<any[]> {
  const clean = deduplicateList(sales);
  inMemorySales = clean;
  if (store) {
    try {
      await store.setJSON("residential-sales", clean);
    } catch (e) {
      console.warn("Netlify Blobs write error:", e);
    }
  }
  return clean;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  const store = await getStoreInstance();

  try {
    // -------------------------------------------------------------------------
    // GET: Retrieve all current sales
    // -------------------------------------------------------------------------
    if (event.httpMethod === "GET") {
      const sales = await loadCurrentSales(store);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          sales,
          count: sales.length,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    // -------------------------------------------------------------------------
    // POST: Create a new sale OR replace full list
    // -------------------------------------------------------------------------
    if (event.httpMethod === "POST") {
      const payload = JSON.parse(event.body || "{}");
      const currentSales = await loadCurrentSales(store);

      // Bulk replacement (e.g. backup restore)
      if (Array.isArray(payload.sales)) {
        const saved = await saveCurrentSales(store, payload.sales);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            sales: saved,
            count: saved.length,
            updatedAt: new Date().toISOString(),
          }),
        };
      }

      // Single item creation
      const newSale = payload.sale || payload;
      if (!newSale || (!newSale.contract && !newSale.id)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Dados inválidos para nova venda." }),
        };
      }

      const now = new Date().toISOString();
      const cleanItem = {
        ...newSale,
        id: newSale.id || `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: newSale.createdAt || now,
        updatedAt: now,
      };

      // Filter out any existing with same id and prepend
      const filtered = currentSales.filter((s: any) => s.id !== cleanItem.id);
      const updated = [cleanItem, ...filtered];
      const saved = await saveCurrentSales(store, updated);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          sale: cleanItem,
          sales: saved,
          count: saved.length,
          updatedAt: now,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // PUT or PATCH: Update an existing sale
    // -------------------------------------------------------------------------
    if (event.httpMethod === "PUT" || event.httpMethod === "PATCH") {
      const payload = JSON.parse(event.body || "{}");
      const itemToUpdate = payload.sale || payload;

      if (!itemToUpdate || !itemToUpdate.id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "ID obrigatório para atualização." }),
        };
      }

      const currentSales = await loadCurrentSales(store);
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
        // If not found, add it
        updated.unshift({
          ...itemToUpdate,
          createdAt: itemToUpdate.createdAt || now,
          updatedAt: now,
        });
      }

      const saved = await saveCurrentSales(store, updated);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          sale: itemToUpdate,
          sales: saved,
          count: saved.length,
          updatedAt: now,
        }),
      };
    }

    // -------------------------------------------------------------------------
    // DELETE: Remove a sale by ID
    // -------------------------------------------------------------------------
    if (event.httpMethod === "DELETE") {
      let idToDelete = event.queryStringParameters?.id;
      if (!idToDelete && event.body) {
        try {
          const body = JSON.parse(event.body);
          idToDelete = body.id;
        } catch {}
      }

      if (!idToDelete) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "ID obrigatório para exclusão." }),
        };
      }

      const currentSales = await loadCurrentSales(store);
      const filtered = currentSales.filter((s: any) => s.id !== idToDelete);
      const saved = await saveCurrentSales(store, filtered);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          deletedId: idToDelete,
          sales: saved,
          count: saved.length,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Método não permitido." }),
    };
  } catch (error: any) {
    console.error("Netlify Function residential error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || "Erro interno do servidor." }),
    };
  }
};
