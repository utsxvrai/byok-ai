import express from "express";
import dotenv from "dotenv";
import { BYOK } from "..";

dotenv.config();

const app = express();
app.use(express.json());

const masterKey = process.env.BYOK_MASTER_KEY;

if (!masterKey) {
  throw new Error("BYOK_MASTER_KEY is required in .env");
}

const byok = new BYOK({ masterKey });

// Register a user's Gemini key
app.post("/keys/gemini", async (req, res) => {
  try {
    const { userId, apiKey } = req.body;
    await byok.registerKey({ userId, provider: "gemini", apiKey });
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ ok: false, error: message });
  }
});

// Simple chat endpoint using the stored key
app.post("/chat", async (req, res) => {
  try {
    const { userId, prompt, model } = req.body;
    const response = await byok.use(userId).chat({ prompt, model, provider: "gemini" });
    res.json({ ok: true, text: response.text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ ok: false, error: message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`byok-ai Gemini demo running on http://localhost:${port}`);
});

