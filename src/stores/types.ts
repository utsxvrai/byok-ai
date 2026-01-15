export type ProviderId = "gemini";

export interface KeyRecord {
  userId: string;
  provider: ProviderId;
  encryptedKey: string;
  createdAt: Date;
}

export interface KeyStore {
  set(record: KeyRecord): Promise<void>;
  get(userId: string, provider: ProviderId): Promise<KeyRecord | null>;
  delete(userId: string, provider: ProviderId): Promise<boolean>;
  has(userId: string, provider: ProviderId): Promise<boolean>;
}


