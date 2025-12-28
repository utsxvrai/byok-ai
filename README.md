# byok-ai 🔑

**A Universal "Bring-Your-Own-Key" Plugin for AI Services.**

`byok-ai` is a secure, backend-only Node.js plugin that solves the problem of managing user-provided AI API keys in multi-user applications. It abstracts away encryption, storage, provider SDKs, and safety concerns, allowing developers to focus on building product features rather than re-implementing fragile infrastructure.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
- [How It Works](#-how-it-works)
- [Architecture](#️-architecture)
- [Security Model](#-security-model)
- [Provider & Capability Abstraction](#-provider--capability-abstraction)
- [Roadmap](#️-roadmap)
- [Contributing](#-contributing)
- [License](#️-license)

---

## The Problem

When building AI-powered applications, developers typically start with a single API key stored in an environment variable. This works for demos but breaks down in real, multi-user applications. If users are allowed to bring their own AI keys, developers must:

- Design secure database schemas
- Implement correct encryption for keys at rest
- Validate keys for multiple providers
- Manage multiple provider SDKs
- Ensure keys are never logged or leaked
- Route the correct key to the correct user on every request

These tasks are easy to get wrong, expensive to maintain, and not the core value of the application. Without a standard solution, every team re-implements this differently, leading to duplicated effort, inconsistent security practices, and fragile codebases.

---

## The Solution

`byok-ai` acts as an infrastructure layer between your application and external AI services. It separates intent from implementation: developers express intent (e.g., "this user wants to generate text") without worrying about which provider is used, how the key is stored, or how the request is authenticated. The plugin handles those concerns safely and consistently.

From the application's perspective, it's a simple plugin: install it, initialize it once, and call a small, consistent API whenever AI functionality is needed. Internally, the plugin securely manages user-provided API keys, encrypts them before storage, retrieves and decrypts them only when needed, and routes requests to the correct AI provider.

---

## ✨ Features

- 🔐 **Secure by Default**: Built-in AES-256-GCM encryption for API keys at rest. Raw keys can never be retrieved once stored.
- 🛠️ **Provider Agnostic**: Unified API for multiple AI services (OpenAI, Gemini, ElevenLabs, and more).
- 🎯 **Capability-Based**: Abstract interface for AI capabilities (chat, text-to-speech, speech-to-text, image generation, embeddings).
- 👤 **User-Scoped**: Keys are strictly isolated per user and per provider.
- 📦 **Pluggable Storage**: Use the default in-memory store for rapid prototyping, or plug in your own database adapter (PostgreSQL, MongoDB, etc.) for production.
- 🛡️ **Zero-Leak Design**: Raw keys are never logged, never returned to the frontend, and exist only briefly in memory during requests.
- 🚫 **Backend-Only**: Designed for server-side use only, ensuring keys never reach client-side code.
- 🔧 **Framework Agnostic**: Works with any Node.js server framework (Express, Fastify, etc.).

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
  store: new MemoryStore(), // Use in-memory store for dev
});

// 2. Register a user's API key (Validates & Encrypts automatically)
await byok.registerKey({
  userId: "user_123",
  provider: "openai", // or "gemini", "elevenlabs", etc.
  apiKey: "USER_PROVIDED_API_KEY",
});

// 3. Use AI capabilities without handling the key again
const response = await byok.use("user_123").chat({
  prompt: "What is the capital of France?",
});

console.log(response.text);
```

---

## 🔄 How It Works

### User Flow

1. **Initial Setup**: When a user enables AI features, they paste their API key for a supported provider (OpenAI, Gemini, ElevenLabs, etc.). This key is sent once from the frontend to the backend over HTTPS.

2. **Secure Storage**: After that moment, the frontend never sees or stores the key again. On the backend, `byok-ai` immediately validates the key, encrypts it using your master encryption key, and stores only the encrypted version.

3. **AI Requests**: When the user later triggers an AI feature, the backend asks `byok-ai` to perform the request on the user's behalf. The plugin:
   - Retrieves the encrypted key from storage
   - Decrypts it in memory
   - Makes the provider request using the appropriate SDK
   - Returns the result
   - Discards the key from memory

All future AI interactions happen without the key being present in client-side code or network requests.

---

## 🏗️ Architecture

`byok-ai` is built with TypeScript for strong typing, safer refactoring, and better contributor experience, while being compiled to JavaScript for broad compatibility in the Node.js ecosystem.

The library is organized into modular components:

- **Core**: Handles orchestration, security logic, and capability routing.
- **Providers**: Adapters for external AI services. Each provider adapter knows how to validate keys and execute requests for that service.
- **Stores**: Pluggable modules for persisting encrypted keys. Default in-memory store for development, with database adapters for production.

This architecture makes the system scalable and future-proof. Adding support for a new provider doesn't require changes to core logic—only implementing a new adapter. This allows the community to contribute new providers without touching sensitive core code.

---

## 🔒 Security Model

Security is a first-class concern in `byok-ai`. The plugin implements a multi-layered security approach:

1. **Backend-Only**: The plugin is designed to be backend-only and cannot be used safely in browser environments.

2. **Transmission**: The frontend sends the API key to your backend once over HTTPS.

3. **Encryption**: `byok-ai` immediately encrypts the key using AES-256-GCM before it hits your database. The master encryption key is provided by your application and never stored by the plugin.

4. **Isolation**: Every key is bound to both a specific `userId` and a `provider`, ensuring strict isolation between users and services.

5. **Execution**: When an AI call is made, the key is decrypted in memory, used for the request, and then immediately discarded. The raw key exists only briefly in memory.

6. **Safe Defaults**: The public API is intentionally designed so that raw keys can never be retrieved once stored. Developers can check whether a user has a key, store or delete a key, and make requests using a key, but they cannot accidentally expose the key itself.

---

## 🎯 Provider & Capability Abstraction

Instead of being tightly coupled to specific AI models or vendors, `byok-ai` is designed around the concept of **providers** and **capabilities**.

- **Provider**: Represents an external service (OpenAI, Gemini, ElevenLabs, etc.)
- **Capability**: Represents what that service can do (chat completion, text-to-speech, speech-to-text, image generation, embeddings)

This design allows a single, consistent API to work across many different services. Developers express intent (e.g., "generate text" or "convert text to speech") without worrying about provider-specific implementations. The plugin routes requests to the appropriate provider adapter based on what the user has configured.

---

## 🗺️ Roadmap

- [ ] Core Encryption & Manager Logic
- [ ] Provider Adapters
  - [ ] Google Gemini (Chat, Validation)
  - [ ] OpenAI (Chat, Embeddings)
  - [ ] ElevenLabs (Text-to-Speech)
  - [ ] Anthropic Claude
- [ ] Store Adapters
  - [ ] PostgreSQL / Prisma Store Adapter
  - [ ] MongoDB Store Adapter
- [ ] Capability Support
  - [ ] Chat Completion
  - [ ] Text-to-Speech
  - [ ] Speech-to-Text
  - [ ] Image Generation
  - [ ] Embeddings
- [ ] Streaming Support (SSE)
- [ ] Advanced Features
  - [ ] Key rotation
  - [ ] Usage analytics
  - [ ] Rate limiting per user

---

## 🤝 Contributing

This project is in early development. Contributions are welcome, especially for:

- **New Provider Adapters**: Implement support for additional AI services
- **New Store Adapters**: Add database backends for persistent storage
- **New Capabilities**: Extend capability support for existing providers
- **Documentation**: Improve guides, examples, and API documentation

The modular architecture makes it easy to contribute new providers or stores without touching sensitive core code. See our contributing guidelines (coming soon) for more details.

---

## ⚖️ License

MIT
