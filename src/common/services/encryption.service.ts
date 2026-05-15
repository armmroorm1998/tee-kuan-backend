import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * AES-256-GCM symmetric encryption for sensitive fields at rest (e.g. PromptPay number).
 * Key is loaded from ENCRYPTION_KEY env var (64 hex chars = 32 bytes).
 *
 * Ciphertext format: <iv_hex>:<authTag_hex>:<encrypted_hex>
 *
 * Backward-compat: if a stored value does not contain the ':' separator it is treated
 * as legacy plaintext and returned as-is so existing rows keep working until re-saved.
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
          'Generate one with: openssl rand -hex 32',
      );
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  /** Encrypt a plaintext string. Returns `iv:authTag:ciphertext` (all hex). */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Verify tag length for consistency
    if (authTag.length !== TAG_BYTES) {
      throw new Error('Unexpected auth tag length');
    }
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypt a value previously encrypted with `encrypt()`.
   * Returns the original plaintext.
   * Throws if tampering is detected (GCM auth tag mismatch).
   */
  decrypt(value: string): string {
    // Legacy plaintext fallback — value was stored before encryption was added
    if (!value.includes(':')) {
      return value;
    }

    const parts = value.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedData = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]).toString('utf8');
  }
}
