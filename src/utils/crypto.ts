import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY!; // 32 bytes key

if (!secretKey) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

export function encryptToken(token: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptToken(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(
    algorithm, 
    Buffer.from(secretKey, 'hex'), 
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function encryptSensitiveData(data: any): string {
  const jsonString = JSON.stringify(data);
  const { encrypted, iv, tag } = encryptToken(jsonString);
  
  return JSON.stringify({ encrypted, iv, tag });
}

export function decryptSensitiveData(encryptedData: string): any {
  const { encrypted, iv, tag } = JSON.parse(encryptedData);
  const decrypted = decryptToken(encrypted, iv, tag);
  
  return JSON.parse(decrypted);
} 