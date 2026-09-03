import { Handler } from "@netlify/functions";
import { getStore, connectLambda } from "@netlify/blobs";
import fs from "fs";
import path from "path";

let inMemoryStoreDb: any = null;
const TMP_FILE = path.join("/tmp", "claro-store-database.json");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

function getBlobStore(event?: any) {
  if (event && (event as any).blobs) {
    try {
      connectLambda(event);
    } catch (e) {
      console.warn("connectLambda error:", e);
    }
  }

  try {
    const siteID = process.env.NETLIFY_SITE_ID;
    const token =
      process.env.NETLIFY_BLOBS_TOKEN ||
      process.env.NETLIFY_AUTH_TOKEN ||
      process.env.NETLIFY_API_TOKEN;

    if (siteID && token) {
      return getStore({ name: "claro-store-db", siteID, token, consistency: "strong" });
    }
    return getStore({ name: "claro-store-db", consistency: "strong" });
  } catch (err) {
    console.warn("Netlify Blobs getStore error for claro-store-db:", err);
    return null;
  }
}

function loadFallbackData(): any {
  if (inMemoryStoreDb) return inMemoryStoreDb;
  try {
    if (fs.existsSync(TMP_FILE)) {
      const raw = fs.readFileSync(TMP_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error reading tmp database file:", err);
  }
  return null;
}

function saveFallbackData(data: any) {
  inMemoryStoreDb = data;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.warn("Error writing tmp database file:", err);
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  const blobStore = getBlobStore(event);

  try {
    if (event.httpMethod === "GET") {
      let data: any = null;
      if (blobStore) {
        try {
          data = await blobStore.get("store-database", { type: "json" });
        } catch (e) {
          console.warn("Netlify Blobs get error for store-db", e);
        }
      }

      if (!data) {
        data = loadFallbackData();
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

      saveFallbackData(database);

      let savedToBlob = false;
      if (blobStore) {
        try {
          await blobStore.setJSON("store-database", database);
          savedToBlob = true;
        } catch (e) {
          console.warn("Netlify Blobs set error for store-db", e);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          savedToBlob,
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
