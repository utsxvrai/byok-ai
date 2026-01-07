import { Encryption } from "./Encryption";
import { MemoryStore } from "../stores/MemoryStore";
import { GeminiProvider } from "../providers/gemini";
import type { KeyStore } from "../stores/types";
import type { ProviderId } from "../providers/types";

export interface BYOKConfig {
  masterKey: string | Buffer;
  store?: KeyStore;
}

export interface RegisterKeyInput {
  userId: string;
  provider: ProviderId;
  apiKey: string;
}

export interface ChatInput {
  prompt: string;
  model?: string;
}

/**
 * BYOK - Bring Your Own Key
 *
 * Minimal implementation focused on Gemini support.
 */
export class BYOK {
  private readonly encryption: Encryption;
  private readonly masterKey: Buffer;
  private readonly store: KeyStore;

  constructor(config: BYOKConfig) {
    if (!config.masterKey) {
      throw new Error("masterKey is required in BYOK configuration");
    }

    this.masterKey = this.normalizeMasterKey(config.masterKey);

    if (this.masterKey.length !== 32) {
      throw new Error(
        `Master key must be exactly 32 bytes (256 bits). ` +
        `Received ${this.masterKey.length} bytes. ` +
        `Generate a key using: openssl rand -base64 32`
      );
    }

    this.encryption = new Encryption();
    this.store = config.store || new MemoryStore();
  }

  /**
   * Registers (validates + encrypts + stores) a user's provider key.
   */
  async registerKey(input: RegisterKeyInput): Promise<void> {
    this.ensureValid();

    if (!input.userId) throw new Error("userId is required");
    if (!input.provider) throw new Error("provider is required");
    if (!input.apiKey) throw new Error("apiKey is required");
    if (input.provider !== "gemini") {
      throw new Error("Only provider 'gemini' is supported in this preview");
    }

    // Basic key validation (Gemini keys typically start with AI)
    if (!/^AI[a-zA-Z0-9_-]{10,}$/.test(input.apiKey)) {
      throw new Error("Gemini API key appears invalid");
    }

    const encryptedKey = this.encryption.encrypt(input.apiKey, this.masterKey);
    await this.store.set({
      userId: input.userId,
      provider: input.provider,
      encryptedKey,
      createdAt: new Date(),
    });
  }

  /**
   * Deletes a stored key for a user/provider.
   */
  async deleteKey(userId: string, provider: ProviderId): Promise<boolean> {
    this.ensureValid();
    return this.store.delete(userId, provider);
  }

  /**
   * Checks if a key exists for a user/provider.
   */
  async hasKey(userId: string, provider: ProviderId): Promise<boolean> {
    this.ensureValid();
    return this.store.has(userId, provider);
  }

  /**
   * Returns a provider-bound client for the given user.
   */
  use(userId: string) {
    this.ensureValid();
    const self = this;

    return {
      async chat(input: ChatInput & { provider?: ProviderId; model?: string }) {
        const provider = input.provider || "gemini";
        if (provider !== "gemini") {
          throw new Error("Only provider 'gemini' is supported in this preview");
        }

        const record = await self.store.get(userId, provider);
        if (!record) {
          throw new Error("No key found for this user/provider");
        }

        const apiKey = self.encryption.decrypt(record.encryptedKey, self.masterKey);
        const gemini = new GeminiProvider(apiKey);
        return gemini.chat({
          prompt: input.prompt,
          model: input.model,
        });
      },
    };
  }

  private ensureValid() {
    if (!this.masterKey || this.masterKey.length !== 32 || !this.encryption) {
      throw new Error("BYOK is not properly configured");
    }
  }

  /**
   * Accepts masterKey as Buffer, raw string (32 chars), or base64 string (44 chars).
   */
  private normalizeMasterKey(masterKey: string | Buffer): Buffer {
    if (Buffer.isBuffer(masterKey)) {
      return masterKey;
    }

    // Try base64 decode first
    const base64Buffer = Buffer.from(masterKey, "base64");
    if (base64Buffer.length === 32) {
      return base64Buffer;
    }

    // Fallback: interpret as utf-8 string
    return Buffer.from(masterKey, "utf-8");
  }
}