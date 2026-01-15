import type { KeyRecord, KeyStore, ProviderId } from "./types";

export class MemoryStore implements KeyStore {
  private readonly store = new Map<string, KeyRecord>();

  private key(userId: string, provider: ProviderId) {
    return `${userId}:${provider}`;
  }

  async set(record: KeyRecord): Promise<void> {
    this.store.set(this.key(record.userId, record.provider), record);
  }

  async get(userId: string, provider: ProviderId): Promise<KeyRecord | null> {
    return this.store.get(this.key(userId, provider)) ?? null;
  }

  async delete(userId: string, provider: ProviderId): Promise<boolean> {
    return this.store.delete(this.key(userId, provider));
  }

  async has(userId: string, provider: ProviderId): Promise<boolean> {
    return this.store.has(this.key(userId, provider));
  }
}


