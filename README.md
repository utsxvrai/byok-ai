# byok-ai 🔑

**A Universal "Bring-Your-Own-Key" Plugin for AI Services.**

`byok-ai` is a secure, backend-only Node.js library that makes it easy for developers to let users use their own AI API keys (Gemini, etc.) within an application. It handles encryption, secure storage, and provider abstraction so you can focus on building features, not security infrastructure.

---

## Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [Architecture](#️-architecture)
- [Security Model](#-security-model)
- [Roadmap](#️-roadmap)
- [Contributing](#-contributing)
- [License](#️-license)

---

## ✨ Features

- 🔐 **Secure by Default**: Built-in AES-256-GCM encryption for API keys at rest.
- 🛠️ **Provider Agnostic**: Unified API for multiple AI services (Starting with Google Gemini).
- 👤 **User-Scoped**: Keys are strictly isolated per user and per provider.
- 📦 **Pluggable Storage**: Use the default In-Memory store for dev, or plug in your own Database adapter (PostgreSQL, MongoDB, etc.) for production.
- 🛡️ **Zero-Leak Design**: Raw keys are never logged, never returned to the frontend, and exist only briefly in memory during requests.

---

## 🚀 Getting Started

### Installation

```bash
npm install byok-ai
```

### Basic Usage

**TypeScript**

```typescript
import { BYOK, MemoryStore } from "byok-ai";

// 1. Initialize with a Master Encryption Key
const byok = new BYOK({
  masterKey: process.env.BYOK_MASTER_KEY, // 32-byte secret
  store: new MemoryStore(),
});

// 2. Register a user's Gemini key (Validates & Encrypts automatically)
await byok.registerKey({
  userId: "user_123",
  provider: "gemini",
  apiKey: "USER_PROVIDED_GEMINI_KEY",
});

// 3. Use the AI capability without handling the key again
const response = await byok.use("user_123").chat({
  prompt: "What is the capital of France?",
});

console.log(response.text);
```

---

## 🏗️ Architecture

The library is organized into three main components:

- **Core**: Handles the orchestration and security logic.
- **Providers**: Adapters for external AI services (Current focus: Google Gemini).
- **Stores**: Pluggable modules for persisting encrypted keys.

---

## 🔒 Security Model

`byok-ai` implements a multi-layered security approach:

1. **Transmission**: The frontend sends the API key to your backend once over HTTPS.
2. **Encryption**: `byok-ai` immediately encrypts the key using AES-256-GCM before it hits your database.
3. **Isolation**: Every key is bound to a specific `userId`.
4. **Execution**: When an AI call is made, the key is decrypted in memory, used for the request, and then immediately discarded.

---

## 🗺️ Roadmap

- [ ] Core Encryption & Manager Logic
- [ ] Google Gemini Adapter (Validation & Chat)
- [ ] PostgreSQL / Prisma Store Adapter
- [ ] Streaming Support (SSE)
- [ ] Additional Providers (OpenAI, Anthropic)

---

## 🤝 Contributing

This project is in early development. Contributions for new Provider Adapters or Store Adapters are welcome!

---

## ⚖️ License

MIT
