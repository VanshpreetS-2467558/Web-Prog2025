import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derive encryption key from organizer password
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt employee password using organizer password as key
 */
export function encryptPassword(employeePassword, organizerPassword) {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from organizer password
    const key = deriveKey(organizerPassword, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(employeePassword, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "hex")
    ]);
    
    // Return as base64 for easy storage
    return combined.toString("base64");
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Failed to encrypt password");
  }
}

/**
 * Decrypt employee password using organizer password as key
 */
export function decryptPassword(encryptedData, organizerPassword) {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, "base64");
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from organizer password
    const key = deriveKey(organizerPassword, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, null, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    throw new Error("Failed to decrypt password. Incorrect organizer password or corrupted data.");
  }
}

