import { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

let inMemoryStoreDb: any = null;

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
      blobStore = getStore({ name: "claro-store-db", consistency: "strong" });
    } catch {
      // Blobs unavailable in current environment; fallback to memory
    }

    if (event.httpMethod === "GET") {
      let data: any = null;
      if (blobStore) {
        try {
          data = await blobStore.get("store-database", { type: "json" });
        } catch (e) {
          console.warn("Netlify Blobs get error for store-db", e);
        }
      }

      if (!data && inMemoryStoreDb) {
        data = inMemoryStoreDb;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data,
          updatedAt: new Date().toISOString(),
        }),
      };
    }

    if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
      const payload = JSON.parse(event.body || "{}");
      const database = payload.database || payload;

      inMemoryStoreDb = database;

      if (blobStore) {
        try {
          await blobStore.setJSON("store-database", database);
        } catch (e) {
          console.warn("Netlify Blobs set error for store-db", e);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
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
