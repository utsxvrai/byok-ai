## byok-ai Usage Guide 🔑

**A Universal "Bring-Your-Own-Key" Plugin for AI Services (Gemini-focused preview).**

This guide shows how to install, configure, and use `byok-ai` as a backend plugin in **any Node.js application** (Express, Fastify, etc.), with a concrete example for **Google Gemini**.

---

## 1. What Problem Does This Solve?

Modern AI apps often want users to bring their **own AI provider keys** (e.g., Gemini), but:

- Keys must be **encrypted at rest**
- Keys must be **scoped per user + provider**
- Keys must **never be logged or sent back to the frontend**
- The right key must be used on every request

`byok-ai` gives you a small, focused API that:

- Encrypts and stores user-provided keys securely
- Decrypts them only when needed for a request
- Calls the provider (Gemini) on behalf of the user
- Keeps your app code free from raw API keys

---

## 2. Installation

Install the plugin (from npm or local tarball if you're developing it):

```bash
npm install byok-ai
```

You also need the Gemini SDK in your application:

```bash
npm install @google/generative-ai
```

> If you are consuming `byok-ai` as a published package, the Gemini SDK may already be included as a dependency; the command above is safe regardless.

---

## 3. Environment Setup

`byok-ai` uses a **master encryption key** to encrypt all user API keys.

Add this to your `.env`:

```env
BYOK_MASTER_KEY=your-32-byte-master-key-or-base64-here
```

Recommended: generate a secure key (base64) with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

This base64 string can be used directly as `BYOK_MASTER_KEY`.  
`byok-ai` accepts:

- A **Buffer** (32 bytes), or
- A **raw string** of 32 characters, or
- A **base64 string** that decodes to 32 bytes

---

## 4. Quick Start (Backend Integration)

### 4.1 Initialize BYOK

```ts
import { BYOK, MemoryStore } from "byok-ai";

const byok = new BYOK({
  masterKey: process.env.BYOK_MASTER_KEY!, // required
  store: new MemoryStore(),                // in-memory store (good for dev)
});
```

> In production you will likely replace `MemoryStore` with a persistent store (Postgres, Mongo, etc.) in the future.

### 4.2 Register a User’s Gemini Key

Call this when a user pastes their Gemini API key in your UI:

```ts
await byok.registerKey({
  userId: "user_123",           // your app's user identifier
  provider: "gemini",           // only "gemini" is supported in this preview
  apiKey: "USER_GEMINI_API_KEY" // raw Gemini key from the user
});
```

What happens:

- The key is validated (simple format check)
- Encrypted with AES-256-GCM using your master key
- Stored via the configured store (here: in-memory)

### 4.3 Use Gemini on Behalf of the User

Later, when the user triggers an AI action:

```ts
const response = await byok.use("user_123").chat({
  prompt: "Explain BYOK in one sentence.",
  // model: "gemini-1.5-flash", // optional, defaults to gemini-1.5-flash
});

console.log(response.text);
```

What happens:

- The plugin loads the encrypted key from the store
- Decrypts it in memory
- Calls Gemini’s API with the user’s key
- Returns the model’s text response

---

## 5. Express Example (Minimal)

You can plug this into any framework. Here is a minimal **Express** example you can paste into your own app:

```ts
import express from "express";
import { BYOK, MemoryStore } from "byok-ai";

const app = express();
app.use(express.json());

const byok = new BYOK({
  masterKey: process.env.BYOK_MASTER_KEY!,
  store: new MemoryStore(),
});

// Endpoint to register a user's Gemini key
app.post("/keys/gemini", async (req, res) => {
  try {
    const { userId, apiKey } = req.body;

    await byok.registerKey({
      userId,
      provider: "gemini",
      apiKey,
    });

    res.json({ ok: true });
  } catch (error) {
    res
      .status(400)
      .json({ ok: false, error: (error as Error).message });
  }
});

// Endpoint to call Gemini using the stored key
app.post("/chat", async (req, res) => {
  try {
    const { userId, prompt, model } = req.body;

    const result = await byok.use(userId).chat({
      prompt,
      model, // optional
    });

    res.json({ ok: true, text: result.text });
  } catch (error) {
    res
      .status(400)
      .json({ ok: false, error: (error as Error).message });
  }
});

app.listen(3000, () => {
  console.log("BYOK + Gemini running on http://localhost:3000");
});
```

---

## 6. Public API (Current Preview)

### 6.1 `BYOK` Class

**Constructor**

```ts
new BYOK(config: BYOKConfig)
```

**`BYOKConfig`**

- `masterKey: string | Buffer` (required)  
  Master encryption key (see [Environment Setup](#3-environment-setup)).

- `store?: KeyStore` (optional)  
  Storage adapter implementation. Defaults to `MemoryStore`.

---

### 6.2 `registerKey`

```ts
await byok.registerKey({
  userId: string;
  provider: "gemini";
  apiKey: string;
});
```

- Encrypts and stores the user’s provider key
- Currently only `"gemini"` is supported as `provider`

Throws if:

- `userId`, `provider`, or `apiKey` is missing
- `provider` is not `"gemini"`
- The key format appears invalid

---

### 6.3 `use(userId).chat(...)`

```ts
const client = byok.use(userId);

const result = await client.chat({
  prompt: string;
  model?: string;       // optional Gemini model ID
  provider?: "gemini";  // optional, defaults to "gemini"
});
```

Returns:

```ts
{ text: string }
```

Throws if:

- No key is stored for this `userId` + provider
- The stored key cannot be decrypted
- The provider call fails

---

### 6.4 Key Management Helpers

```ts
await byok.hasKey(userId, "gemini");   // boolean
await byok.deleteKey(userId, "gemini"); // boolean
```

Use these to check or remove keys for a given user/provider.

---

## 7. Security Notes

- **Backend-only**: Never use `byok-ai` in browser/client code.
- **No raw key retrieval**: Once stored, keys are only usable via BYOK API (no “get raw key” method).
- **Short-lived decryption**: Keys are decrypted in memory only for the duration of a request.
- **Master key critical**: If you lose or change `BYOK_MASTER_KEY`, previously stored keys cannot be decrypted.

---

## 8. Current Limitations (Preview)

- Only **Google Gemini** is supported (`provider: "gemini"`).
- Default storage is **in-memory** (`MemoryStore`), suitable for development only.
- API surface is intentionally minimal and may expand as more providers and stores are added.

---

## 9. Next Steps

- Swap `MemoryStore` for a database-backed store (PostgreSQL, MongoDB, etc.).
- Add more providers (OpenAI, Anthropic, ElevenLabs) behind the same API.
- Add more capabilities (TTS, STT, images, embeddings) as separate methods.

For now, this guide should be enough to:

1. Install `byok-ai`
2. Configure your master key
3. Let users register their Gemini key
4. Call Gemini on their behalf via a simple, safe API


