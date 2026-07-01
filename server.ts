import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini SDK lazily to avoid startup crash if API key is missing
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

app.use(express.json());

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: AI Chat assistant
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = getGeminiClient();
    
    const systemInstruction = `You are the UXtrade AI Assistant, a friendly, knowledgeable, and professional chatbot integrated directly into the UXtrade platform.
UXtrade is a secure multi-tier trading, savings, and digital assets platform.
Your goal is to help users understand how UXtrade works and answer their queries with precise, clear, and reassuring info.

Key aspects of UXtrade:
1. Multi-tier verification:
   - Tier 1 Status: Standard daily limits.
   - Tier 2 Status: Unlock daily limits up to $10,000 / day! Cost: $20.
   - Tier 3 Status: Unlock daily limits up to $100,000 / day! Cost: $60.
2. Balance & Deposits:
   - USDT Deposit: instant crypto credit via TRON (TRC20) or Binance Smart Chain (BEP20).
   - Naira local bank transfer: dynamic virtual bank accounts at an exchange rate of ₦1,600 / $1.
   - All legacy credit/debit card payment methods have been completely removed for enhanced security and peer-to-peer crypto alignment.
3. Virtual Cards:
   - Users can issue virtual visa/mastercards instantly for online payments.
   - Setup fee: $5.00 per card.
   - Custom skins: Deep Blue, Ice Blue, and Slate Dark.
   - Options: Freeze card, change limits, unblock, and view details.
4. Trading Bots:
   - 24/7 automated AI lobby.
   - Users can purchase, activate, and monitor automated trading bots that generate real-time simulated passive returns on investments.
5. Savings Account:
   - Earn passive yield on savings balance.

Keep your answers formatting-friendly (with lists or bold words if appropriate) and friendly. Never mention internal technical stack details (like react, node, express). Always align with UXtrade branding (safe, premium, secure, peer-to-peer). Make your answers crisp, concise and highly accurate.`;

    // Format chat history for the chats.create api
    // The history parameter is expected to be an array of objects: { role: 'user' | 'model', parts: [{ text: string }] }
    const formattedHistory = Array.isArray(history) 
      ? history.map((h: any) => ({
          role: h.role === "assistant" ? "model" : h.role,
          parts: [{ text: h.content || h.parts?.[0]?.text || "" }]
        }))
      : [];

    const chat = client.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({
      message,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "An error occurred with the AI assistant." });
  }
});

// Mount Vite middleware or serve built assets
async function setupVite() {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Vite startup error:", err);
});
