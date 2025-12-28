import crypto from "crypto";

/**
 * Encryption utility for securing API keys using AES-256-GCM.
 * 
 * This module provides secure encryption and decryption of sensitive data
 * using the Advanced Encryption Standard (AES) with 256-bit keys in
 * Galois/Counter Mode (GCM), which provides both confidentiality and authenticity.
 */
export class Encryption {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 32 bytes = 256 bits
  private readonly ivLength = 16; // 16 bytes = 128 bits
  private readonly saltLength = 32; // 32 bytes for key derivation
  private readonly tagLength = 16; // 16 bytes for GCM authentication tag

  /**
   * Validates that the master key is the correct length (32 bytes).
   * 
   * @param masterKey - The master encryption key (must be 32 bytes)
   * @throws {Error} If the master key is not 32 bytes
   */
  private validateMasterKey(masterKey: string | Buffer): void {
    const keyBuffer = Buffer.isBuffer(masterKey) ? masterKey : Buffer.from(masterKey, "utf-8");
    if (keyBuffer.length !== this.keyLength) {
      throw new Error(
        `Master key must be exactly ${this.keyLength} bytes (${this.keyLength * 8} bits). ` +
        `Received ${keyBuffer.length} bytes.`
      );
    }
  }

  /**
   * Derives a consistent encryption key from the master key.
   * Uses PBKDF2 with SHA-256 for key derivation.
   * 
   * @param masterKey - The master encryption key
   * @param salt - Salt for key derivation (optional, generates new if not provided)
   * @returns The derived key and salt
   */
  private deriveKey(masterKey: string | Buffer, salt?: Buffer): { key: Buffer; salt: Buffer } {
    const masterKeyBuffer = Buffer.isBuffer(masterKey) 
      ? masterKey 
      : Buffer.from(masterKey, "utf-8");
    
    const saltBuffer = salt || crypto.randomBytes(this.saltLength);
    const iterations = 100000; // PBKDF2 iterations
    
    const key = crypto.pbkdf2Sync(
      masterKeyBuffer,
      saltBuffer,
      iterations,
      this.keyLength,
      "sha256"
    );

    return { key, salt: saltBuffer };
  }

  /**
   * Encrypts a plaintext string using AES-256-GCM.
   * 
   * @param plaintext - The data to encrypt
   * @param masterKey - The master encryption key (32 bytes)
   * @returns Encrypted data as a base64-encoded string containing: salt + iv + tag + ciphertext
   * 
   * Format: base64(salt (32 bytes) + iv (16 bytes) + tag (16 bytes) + ciphertext)
   */
  encrypt(plaintext: string, masterKey: string | Buffer): string {
    if (!plaintext || typeof plaintext !== "string") {
      throw new Error("Plaintext must be a non-empty string");
    }

    this.validateMasterKey(masterKey);

    // Derive encryption key from master key
    const { key, salt } = this.deriveKey(masterKey);

    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf-8"),
      cipher.final(),
    ]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + ciphertext
    const combined = Buffer.concat([salt, iv, tag, encrypted]);

    // Return as base64 string
    return combined.toString("base64");
  }

  /**
   * Decrypts a ciphertext string that was encrypted with encrypt().
   * 
   * @param ciphertext - The encrypted data (base64-encoded string)
   * @param masterKey - The master encryption key (32 bytes)
   * @returns The decrypted plaintext string
   * @throws {Error} If decryption fails (invalid key, corrupted data, etc.)
   */
  decrypt(ciphertext: string, masterKey: string | Buffer): string {
    if (!ciphertext || typeof ciphertext !== "string") {
      throw new Error("Ciphertext must be a non-empty string");
    }

    this.validateMasterKey(masterKey);

    try {
      // Decode from base64
      const combined = Buffer.from(ciphertext, "base64");

      // Extract components
      // salt (32 bytes) + iv (16 bytes) + tag (16 bytes) + ciphertext
      if (combined.length < this.saltLength + this.ivLength + this.tagLength) {
        throw new Error("Invalid ciphertext format: too short");
      }

      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);

      // Derive the same encryption key using the stored salt
      const { key } = this.deriveKey(masterKey, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf-8");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decryption failed: ${error.message}`);
      }
      throw new Error("Decryption failed: Unknown error");
    }
  }

  /**
   * Generates a secure random master key (32 bytes).
   * Useful for generating initial master keys.
   * 
   * @returns A base64-encoded 32-byte random key
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString("base64");
  }
}

