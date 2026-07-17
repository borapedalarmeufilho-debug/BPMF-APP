/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parser with a higher limit for images
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ==========================================
// API ROUTES
// ==========================================

// 1. Gemini Generate text with Google Maps grounding
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "O prompt é obrigatório." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "";
    // Check if there are grounding metadata references
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({ text, groundingChunks });
  } catch (error: any) {
    console.error("Erro no Gemini Generate:", error);
    res.status(500).json({ error: error.message || "Erro interno ao chamar o Gemini." });
  }
});

// 2. Gemini Image Generation with gemini-3.1-flash-image
app.post("/api/gemini/image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "O prompt da imagem é obrigatório." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    });

    let base64Image = "";
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      return res.status(500).json({ error: "Nenhuma imagem foi retornada pelo modelo." });
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Erro na geração de imagem:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar imagem." });
  }
});

// 3. Sync to Google Sheets
app.post("/api/sheets/sync", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token de acesso Google OAuth não fornecido." });
  }

  try {
    const { config, expenses, checklist, contentPlan, daysData } = req.body;

    // Create a new spreadsheet with 4 tabs pre-configured
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: `BPMF Rota da Luz - Dashboard de Cicloviagem (${config.tripDate || "Agosto 2026"})`,
        },
        sheets: [
          { properties: { title: "Resumo e Roteiro" } },
          { properties: { title: "Gastos e Divisão" } },
          { properties: { title: "Checklist de Equipamento" } },
          { properties: { title: "Planejamento de Conteúdo" } },
        ],
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json();
      throw new Error(errorData.error?.message || "Falha ao criar planilha.");
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // Build values data arrays
    // A. Resumo e Roteiro
    const routeValues = [
      ["BPMF - ROTA DA LUZ (MOGI DAS CRUZES -> APARECIDA)"],
      ["Data de Partida", config.tripDate || "Não configurada"],
      ["Integrantes", config.people.join(", ")],
      [],
      ["DIA", "DE", "PARA", "DISTÂNCIA", "ELEVAÇÃO ACUMULADA", "SAÍDA", "CHEGADA ESTIMADA", "PONTOS DE REFERÊNCIA"],
    ];
    daysData.forEach((day: any) => {
      routeValues.push([
        `Dia ${day.n}`,
        day.from,
        day.to,
        `${day.km} km`,
        `${day.elev} m`,
        day.saida,
        day.chegada,
        day.refs,
      ]);
    });

    // B. Gastos e Divisão
    const expenseValues = [
      ["HISTÓRICO DE DESPESAS - ROTA DA LUZ"],
      [],
      ["DESCRIÇÃO", "VALOR", "CATEGORIA", "PAGO POR", "DIVISÃO"],
    ];
    expenses.forEach((exp: any) => {
      expenseValues.push([
        exp.desc,
        exp.valor,
        exp.cat,
        exp.quem,
        exp.divide === "todos" ? "Dividido com todos" : "Custo individual",
      ]);
    });

    // C. Checklist de Equipamento
    const checklistValues = [
      ["CHECKLIST DE EQUIPAMENTOS E PREPARAÇÃO"],
      [],
      ["CATEGORIA", "ITEM", "STATUS"],
    ];
    Object.keys(checklist).forEach((key) => {
      // key is category::index
      const parts = key.split("::");
      if (parts.length === 2) {
        const cat = parts[0];
        const item = parts[1];
        checklistValues.push([cat, item, checklist[key] ? "Concluído" : "Pendente"]);
      }
    });

    // D. Planejamento de Conteúdo
    const contentValues = [
      ["GRADE EDITORIAL E CRONOGRAMA DE MÍDIAS - BPMF"],
      [],
      ["FASE", "PORTA DO CONTEÚDO", "TÍTULO REEL/TIKTOK", "CAPTION REEL", "TÍTULO CARROSSEL", "CAPTION CARROSSEL"],
    ];
    contentPlan.forEach((stage: any) => {
      contentValues.push([
        stage.stage,
        stage.porta,
        stage.reel.titulo,
        stage.reel.caption,
        stage.carrossel.titulo,
        stage.carrossel.caption,
      ]);
    });

    // Write all sheets values in batch
    const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          { range: "'Resumo e Roteiro'!A1", values: routeValues },
          { range: "'Gastos e Divisão'!A1", values: expenseValues },
          { range: "'Checklist de Equipamento'!A1", values: checklistValues },
          { range: "'Planejamento de Conteúdo'!A1", values: contentValues },
        ],
      }),
    });

    if (!batchRes.ok) {
      const errorData = await batchRes.json();
      throw new Error(errorData.error?.message || "Falha ao preencher dados na planilha.");
    }

    res.json({ spreadsheetId, spreadsheetUrl });
  } catch (error: any) {
    console.error("Erro no sincronismo com Sheets:", error);
    res.status(500).json({ error: error.message || "Erro ao sincronizar com Google Sheets." });
  }
});

// 4. Send Summary by Gmail
app.post("/api/gmail/send", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token de acesso Google OAuth não fornecido." });
  }

  try {
    const { emails, subject, htmlContent } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "A lista de e-mails dos destinatários é obrigatória." });
    }

    // Build the raw MIME message (RFC 2822 format)
    const emailLines = [
      `To: ${emails.join(", ")}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      htmlContent,
    ];
    const rawEmail = emailLines.join("\r\n");

    // Encode standard base64url format
    const base64UrlEmail = Buffer.from(rawEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64UrlEmail,
      }),
    });

    if (!sendRes.ok) {
      const errorData = await sendRes.json();
      throw new Error(errorData.error?.message || "Falha ao enviar e-mail via Gmail API.");
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro no envio do Gmail:", error);
    res.status(500).json({ error: error.message || "Erro ao enviar o e-mail." });
  }
});

// ==========================================
// DEV SERVER & STATIC MIDDLEWARE SETUP
// ==========================================

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BPMF Applet] Rodando em http://localhost:${PORT}`);
  });
}

startServer();
