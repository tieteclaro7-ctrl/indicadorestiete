import express from "express";
import path from "path";
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

// Shared in-memory data store for cross-device synchronization
let sharedResidentialSales: any[] = [];
let sharedStoreDb: any = null;
let lastSyncTimestamp: string = new Date().toISOString();

// Residential Sales sync endpoints
app.get(["/api/residential-sales", "/.netlify/functions/residential"], (_req, res) => {
  res.json({
    success: true,
    sales: sharedResidentialSales,
    updatedAt: lastSyncTimestamp,
  });
});

app.post(["/api/residential-sales", "/.netlify/functions/residential"], (req, res) => {
  const payload = req.body;
  const sales = Array.isArray(payload) ? payload : payload.sales || [];
  sharedResidentialSales = sales;
  lastSyncTimestamp = new Date().toISOString();
  res.json({
    success: true,
    count: sales.length,
    updatedAt: lastSyncTimestamp,
  });
});

// Store Database sync endpoints
app.get(["/api/store-db", "/.netlify/functions/database"], (_req, res) => {
  res.json({
    success: true,
    data: sharedStoreDb,
    updatedAt: lastSyncTimestamp,
  });
});

app.post(["/api/store-db", "/.netlify/functions/database"], (req, res) => {
  const payload = req.body;
  sharedStoreDb = payload.database || payload;
  lastSyncTimestamp = new Date().toISOString();
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
