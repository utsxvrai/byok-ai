# Configuration Guide

## Environment Variables

### Required

- **`BYOK_MASTER_KEY`** (string, required)
  - A 32-byte secret key used for AES-256-GCM encryption of user API keys
  - Generate a secure key using: `openssl rand -base64 32`
  - **Never commit this key to version control**
  - Must be kept secure and consistent across application restarts (keys encrypted with one master key cannot be decrypted with another)

### Optional

- **`DATABASE_URL`** (string, optional)

  - Database connection string for persistent storage adapters (PostgreSQL, etc.)
  - Example: `postgresql://user:password@localhost:5432/byok_ai`

- **`MONGODB_URI`** (string, optional)

  - MongoDB connection string for MongoDB store adapter
  - Example: `mongodb://localhost:27017/byok_ai`

- **`LOG_LEVEL`** (string, optional)

  - Logging level: `debug`, `info`, `warn`, `error`
  - Default: `info`

- **`NODE_ENV`** (string, optional)
  - Node environment: `development`, `production`, `test`
  - Default: `development`

## Example `.env` File

```env
# Master Encryption Key (32-byte secret)
BYOK_MASTER_KEY=your-32-byte-master-encryption-key-here

# Optional: Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/byok_ai

# Optional: Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Security Notes

1. **Never commit `.env` files** - Add `.env` to your `.gitignore`
2. **Use strong master keys** - Generate using cryptographically secure random generators
3. **Rotate keys carefully** - Changing `BYOK_MASTER_KEY` will make all encrypted keys unreadable
4. **Use different keys per environment** - Development, staging, and production should have separate master keys


