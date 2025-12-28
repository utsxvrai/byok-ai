import { Encryption } from "./Encryption";

/**
 * Configuration options for initializing the BYOK instance.
 */
export interface BYOKConfig {
  /**
   * Master encryption key (32 bytes) used to encrypt/decrypt user API keys.
   * This should be stored in an environment variable and never committed to version control.
   * 
   * Can be provided as:
   * - A string (will be converted to Buffer, must be exactly 32 bytes)
   * - A Buffer (must be exactly 32 bytes)
   * 
   * Generate a secure key using: openssl rand -base64 32
   */
  masterKey: string | Buffer;

  /**
   * Storage adapter for persisting encrypted keys.
   * If not provided, keys will only exist in memory (not recommended for production).
   */
  store?: any; // TODO: Type this properly when Store interface is defined
}

/**
 * BYOK - Bring Your Own Key
 * 
 * A secure, backend-only plugin for managing user-provided AI API keys.
 * 
 * This class handles:
 * - Encryption and decryption of user API keys using AES-256-GCM
 * - Secure storage of encrypted keys
 * - Provider abstraction for multiple AI services
 * 
 * @example
 * ```typescript
 * import { BYOK } from 'byok-ai';
 * 
 * const byok = new BYOK({
 *   masterKey: process.env.BYOK_MASTER_KEY,
 * });
 * ```
 */
export class BYOK {
  private readonly encryption: Encryption;
  private readonly masterKey: Buffer;
  private readonly store: any; // TODO: Type this properly when Store interface is defined

  /**
   * Creates a new BYOK instance.
   * 
   * @param config - Configuration object containing masterKey and optional store
   * @throws {Error} If masterKey is not provided or invalid
   */
  constructor(config: BYOKConfig) {
    if (!config.masterKey) {
      throw new Error("masterKey is required in BYOK configuration");
    }

    // Convert masterKey to Buffer if it's a string
    this.masterKey = Buffer.isBuffer(config.masterKey)
      ? config.masterKey
      : Buffer.from(config.masterKey, "utf-8");

    // Validate master key length (32 bytes = 256 bits)
    if (this.masterKey.length !== 32) {
      throw new Error(
        `Master key must be exactly 32 bytes (256 bits). ` +
        `Received ${this.masterKey.length} bytes. ` +
        `Generate a key using: openssl rand -base64 32`
      );
    }

    // Initialize encryption utility
    this.encryption = new Encryption();

    // Store the storage adapter (will be used in future phases)
    this.store = config.store || null;

    // Note: Store initialization and validation will be added in future phases
  }

  /**
   * Gets the encryption utility instance.
   * Internal use only - encryption should be handled by BYOK methods.
   * 
   * @internal
   */
  getEncryption(): Encryption {
    return this.encryption;
  }

  /**
   * Gets the master key buffer.
   * Internal use only - master key should never be exposed.
   * 
   * @internal
   */
  getMasterKey(): Buffer {
    return this.masterKey;
  }

  /**
   * Gets the storage adapter instance.
   * Internal use only - will be used in future phases for key persistence.
   * 
   * @internal
   */
  getStore(): any {
    return this.store;
  }

  /**
   * Validates that the instance is properly configured.
   * 
   * @returns true if the instance is valid
   */
  isValid(): boolean {
    return (
      this.masterKey !== null &&
      this.masterKey.length === 32 &&
      this.encryption !== null
    );
  }
}

