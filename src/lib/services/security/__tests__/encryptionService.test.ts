import { EncryptionService } from '../encryptionService';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  
  beforeEach(async () => {
    // Get singleton instance
    encryptionService = EncryptionService.getInstance();
    await encryptionService.initialize();
  });
  
  it('should encrypt and decrypt data correctly', async () => {
    // Test data
    const testData = JSON.stringify({
      sensitive: 'This is sensitive information',
      numbers: [1, 2, 3, 4, 5],
      nested: {
        property: 'nested value'
      }
    });
    
    // Encrypt the data
    const encrypted = await encryptionService.encrypt(testData);
    
    // Verify encrypted data is different from original
    expect(encrypted).not.toEqual(testData);
    expect(encrypted.split(':').length).toBe(5); // Format: iv:authTag:keyAuthTag:encryptedKey:encryptedData
    
    // Decrypt the data
    const decrypted = await encryptionService.decrypt(encrypted);
    
    // Verify decrypted data matches original
    expect(decrypted).toEqual(testData);
  });
  
  it('should generate different ciphertexts for the same plaintext', async () => {
    const testData = 'This is a test string';
    
    // Encrypt the same data twice
    const encrypted1 = await encryptionService.encrypt(testData);
    const encrypted2 = await encryptionService.encrypt(testData);
    
    // Verify the encrypted values are different (due to different IVs)
    expect(encrypted1).not.toEqual(encrypted2);
    
    // But both decrypt to the same original value
    const decrypted1 = await encryptionService.decrypt(encrypted1);
    const decrypted2 = await encryptionService.decrypt(encrypted2);
    
    expect(decrypted1).toEqual(testData);
    expect(decrypted2).toEqual(testData);
  });
  
  it('should throw an error when decrypting invalid data', async () => {
    // Test with invalid encrypted data
    const invalidData = 'invalid:encrypted:data:format:here';
    
    // Expect decryption to fail
    await expect(encryptionService.decrypt(invalidData)).rejects.toThrow();
  });
  
  it('should generate secure random tokens', () => {
    // Generate tokens of different lengths
    const token1 = encryptionService.generateRandomToken(16);
    const token2 = encryptionService.generateRandomToken(32);
    
    // Verify tokens are of expected length (base64 encoding increases length)
    expect(token1.length).toBeGreaterThanOrEqual(16);
    expect(token2.length).toBeGreaterThanOrEqual(32);
    
    // Generate multiple tokens and verify they're different
    const tokens = Array.from({ length: 10 }, () => encryptionService.generateRandomToken());
    const uniqueTokens = new Set(tokens);
    
    expect(uniqueTokens.size).toBe(10); // All tokens should be unique
  });
  
  it('should generate consistent hashes for the same input', () => {
    const testData = 'This is a test string';
    
    // Generate hash twice for the same input
    const hash1 = encryptionService.generateHash(testData);
    const hash2 = encryptionService.generateHash(testData);
    
    // Verify hashes are the same
    expect(hash1).toEqual(hash2);
    
    // Verify hash is of expected format (SHA-256 produces 64 hex chars)
    expect(hash1.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });
});
