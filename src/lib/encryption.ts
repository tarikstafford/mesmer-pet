import crypto from 'crypto';

// Get encryption key from environment (should be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts sensitive text data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  try {
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag for GCM mode
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts encrypted text data
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if text appears to be encrypted (contains our format)
 * @param text - Text to check
 * @returns True if text appears encrypted
 */
export function isEncrypted(text: string): boolean {
  // Check if format matches: hex:hex:hex (3 parts separated by colons)
  const parts = text.split(':');
  if (parts.length !== 3) return false;

  // Check if all parts are valid hex strings
  const hexPattern = /^[0-9a-f]+$/i;
  return parts.every(part => hexPattern.test(part));
}

/**
 * Safely encrypt if not already encrypted
 * @param text - Text to encrypt
 * @returns Encrypted text
 */
export function safeEncrypt(text: string): string {
  if (isEncrypted(text)) {
    return text; // Already encrypted
  }
  return encrypt(text);
}

/**
 * Safely decrypt if encrypted, otherwise return as-is
 * @param text - Text to decrypt
 * @returns Decrypted text or original text
 */
export function safeDecrypt(text: string): string {
  if (!isEncrypted(text)) {
    return text; // Not encrypted, return as-is
  }
  return decrypt(text);
}
