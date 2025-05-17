import crypto from 'crypto';

/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private algorithm: string;
  private masterKeyEnvVar: string;
  private ivLength: number;
  private keyLength: number;
  private isInitialized: boolean = false;
  private masterKey: Buffer | null = null;
  
  private constructor() {
    // Use AES-256-GCM for authenticated encryption
    this.algorithm = 'aes-256-gcm';
    this.masterKeyEnvVar = 'ENCRYPTION_MASTER_KEY';
    this.ivLength = 16; // 16 bytes for AES
    this.keyLength = 32; // 32 bytes for AES-256
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }
  
  /**
   * Initialize the encryption service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Get the master key from environment variable
    const masterKeyBase64 = process.env[this.masterKeyEnvVar];
    
    if (!masterKeyBase64) {
      // In development, generate a temporary key
      if (process.env.NODE_ENV === 'development') {
        console.warn('No encryption master key found. Generating temporary key for development.');
        this.masterKey = crypto.randomBytes(this.keyLength);
      } else {
        throw new Error(`Encryption master key not found in environment variable ${this.masterKeyEnvVar}`);
      }
    } else {
      // Decode the base64 master key
      this.masterKey = Buffer.from(masterKeyBase64, 'base64');
      
      // Validate key length
      if (this.masterKey.length !== this.keyLength) {
        throw new Error(`Invalid master key length. Expected ${this.keyLength} bytes.`);
      }
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Generate a new encryption key
   * @returns Base64 encoded encryption key
   */
  public generateKey(): string {
    const key = crypto.randomBytes(this.keyLength);
    return key.toString('base64');
  }
  
  /**
   * Encrypt data using envelope encryption
   * 1. Generate a data key
   * 2. Encrypt the data with the data key
   * 3. Encrypt the data key with the master key
   * 4. Return the encrypted data and encrypted data key
   * 
   * @param data - Data to encrypt
   * @returns Encrypted data with metadata
   */
  public async encrypt(data: string): Promise<string> {
    await this.initialize();
    
    if (!this.masterKey) {
      throw new Error('Encryption service not properly initialized');
    }
    
    // Generate a random IV
    const iv = crypto.randomBytes(this.ivLength);
    
    // Generate a data key for this encryption
    const dataKey = crypto.randomBytes(this.keyLength);
    
    // Encrypt the data with the data key
    const cipher = crypto.createCipheriv(this.algorithm, dataKey, iv);
    let encryptedData = cipher.update(data, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    
    // Get the auth tag (for GCM mode)
    const authTag = cipher.getAuthTag();
    
    // Encrypt the data key with the master key
    const keyCipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    let encryptedKey = keyCipher.update(dataKey.toString('binary'), 'binary', 'base64');
    encryptedKey += keyCipher.final('base64');
    
    // Get the auth tag for the key encryption
    const keyAuthTag = keyCipher.getAuthTag();
    
    // Combine all components into a single string
    // Format: base64(iv):base64(authTag):base64(keyAuthTag):base64(encryptedKey):base64(encryptedData)
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      keyAuthTag.toString('base64'),
      encryptedKey,
      encryptedData
    ].join(':');
  }
  
  /**
   * Decrypt data using envelope encryption
   * 1. Extract the encrypted data key and encrypted data
   * 2. Decrypt the data key with the master key
   * 3. Decrypt the data with the data key
   * 
   * @param encryptedPackage - Encrypted data package
   * @returns Decrypted data
   */
  public async decrypt(encryptedPackage: string): Promise<string> {
    await this.initialize();
    
    if (!this.masterKey) {
      throw new Error('Encryption service not properly initialized');
    }
    
    // Split the package into components
    const [ivBase64, authTagBase64, keyAuthTagBase64, encryptedKey, encryptedData] = encryptedPackage.split(':');
    
    if (!ivBase64 || !authTagBase64 || !keyAuthTagBase64 || !encryptedKey || !encryptedData) {
      throw new Error('Invalid encrypted package format');
    }
    
    // Decode the components
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const keyAuthTag = Buffer.from(keyAuthTagBase64, 'base64');
    
    // Decrypt the data key
    const keyDecipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
    keyDecipher.setAuthTag(keyAuthTag);
    
    let decryptedKey;
    try {
      let key = keyDecipher.update(encryptedKey, 'base64', 'binary');
      key += keyDecipher.final('binary');
      decryptedKey = Buffer.from(key, 'binary');
    } catch (error) {
      throw new Error('Failed to decrypt the data key. The master key may be incorrect.');
    }
    
    // Decrypt the data with the data key
    const decipher = crypto.createDecipheriv(this.algorithm, decryptedKey, iv);
    decipher.setAuthTag(authTag);
    
    try {
      let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
      decryptedData += decipher.final('utf8');
      return decryptedData;
    } catch (error) {
      throw new Error('Failed to decrypt the data. The data may be corrupted.');
    }
  }
  
  /**
   * Generate a secure hash of data
   * @param data - Data to hash
   * @returns SHA-256 hash of the data
   */
  public generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Generate a secure random token
   * @param length - Length of the token in bytes
   * @returns Base64 encoded random token
   */
  public generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }
}
