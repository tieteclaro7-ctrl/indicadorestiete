import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// In-memory fallback for local development or non-blob setups
let inMemoryResidentialSales: any[] = [];

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  try {
    let blobStore: any = null;
    try {
      blobStore = getStore({ name: "claro-residential-store", consistency: "strong" });
    } catch {
      // Blobs unavailable in current environment; fallback to memory
    }

    if (event.httpMethod === "GET") {
      let sales: any[] = [];
      if (blobStore) {
        try {
          const raw = await blobStore.get("residential-sales", { type: "json" });
          if (raw && Array.isArray(raw)) {
            sales = raw;
          }
        } catch (e) {
          console.warn("Netlify Blobs get error, using fallback", e);
        }
      }

      if (sales.length === 0 && inMemoryResidentialSales.length > 0) {
        sales = inMemoryResidentialSales;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          sales,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
      const payload = JSON.parse(event.body || "{}");
      const sales = Array.isArray(payload) ? payload : payload.sales || [];

      inMemoryResidentialSales = sales;

      if (blobStore) {
        try {
          await blobStore.setJSON("residential-sales", sales);
        } catch (e) {
          console.warn("Netlify Blobs set error", e);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          count: sales.length,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};
