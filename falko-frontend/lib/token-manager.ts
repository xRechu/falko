/**
 * Enhanced Token Manager with Remember Me functionality
 * Production-ready with encryption and security features
 */

import CryptoJS from 'crypto-js';

// Encryption key - in production, this should come from environment
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'falko-project-default-key-2025';

// Token storage keys
const TOKEN_KEYS = {
  AUTH_TOKEN: 'medusa_auth_token',
  CUSTOMER_DATA: 'medusa_customer_data',
  REMEMBER_FLAG: 'medusa_remember_me',
  EMAIL: 'remembered_email',
  TOKEN_TIMESTAMP: 'token_timestamp'
} as const;

// Token expiration times
const EXPIRATION = {
  SESSION: 24 * 60 * 60 * 1000, // 24 hours for session storage
  PERSISTENT: 30 * 24 * 60 * 60 * 1000, // 30 days for localStorage
} as const;

interface TokenData {
  token: string;
  timestamp: number;
  rememberMe: boolean;
}

export class TokenManager {
  
  /**
   * Encrypt sensitive data before storage
   */
  private static encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return data; // Fallback to unencrypted in case of error
    }
  }
  
  /**
   * Decrypt sensitive data from storage
   */
  private static decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || encryptedData; // Fallback if decryption fails
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return encryptedData; // Return as-is if decryption fails
    }
  }
  
  /**
   * Save authentication token with remember me functionality
   */
  static save(token: string, rememberMe: boolean = false, customerData?: any): void {
    try {
      const timestamp = Date.now();
      const tokenData: TokenData = {
        token,
        timestamp,
        rememberMe
      };
      
      // Choose storage based on remember me
      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      
      // Encrypt token before storage
      const encryptedToken = this.encrypt(token);
      const encryptedTokenData = this.encrypt(JSON.stringify(tokenData));
      
      // Save to chosen storage
      storage.setItem(TOKEN_KEYS.AUTH_TOKEN, encryptedToken);
      storage.setItem(TOKEN_KEYS.TOKEN_TIMESTAMP, encryptedTokenData);
      storage.setItem(TOKEN_KEYS.REMEMBER_FLAG, rememberMe.toString());
      
      // Save customer data if provided
      if (customerData) {
        const encryptedCustomer = this.encrypt(JSON.stringify(customerData));
        storage.setItem(TOKEN_KEYS.CUSTOMER_DATA, encryptedCustomer);
      }
      
      // Clear from other storage to avoid conflicts
      otherStorage.removeItem(TOKEN_KEYS.AUTH_TOKEN);
      otherStorage.removeItem(TOKEN_KEYS.TOKEN_TIMESTAMP);
      otherStorage.removeItem(TOKEN_KEYS.REMEMBER_FLAG);
      otherStorage.removeItem(TOKEN_KEYS.CUSTOMER_DATA);
      
      console.log(`💾 Token saved to ${rememberMe ? 'localStorage' : 'sessionStorage'} (encrypted)`);
      console.log(`⏰ Token expires: ${rememberMe ? '30 days' : '24 hours'}`);
      
    } catch (error) {
      console.error('❌ Error saving token:', error);
    }
  }
  
  /**
   * Get authentication token from storage
   */
  static get(): string | null {
    try {
      // Check localStorage first (persistent)
      let encryptedToken = localStorage.getItem(TOKEN_KEYS.AUTH_TOKEN);
      let storage: Storage = localStorage;
      
      // If not in localStorage, check sessionStorage
      if (!encryptedToken) {
        encryptedToken = sessionStorage.getItem(TOKEN_KEYS.AUTH_TOKEN);
        storage = sessionStorage;
      }
      
      if (!encryptedToken) {
        return null;
      }
      
      // Check if token is expired
      if (this.isExpired(storage)) {
        console.log('⏰ Token expired, clearing storage');
        this.clearStorage(storage);
        return null;
      }
      
      // Decrypt and return token
      const token = this.decrypt(encryptedToken);
      return token;
      
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  }
  
  /**
   * Get customer data from storage
   */
  static getCustomerData(): any | null {
    try {
      // Check localStorage first
      let encryptedData = localStorage.getItem(TOKEN_KEYS.CUSTOMER_DATA);
      
      // If not in localStorage, check sessionStorage
      if (!encryptedData) {
        encryptedData = sessionStorage.getItem(TOKEN_KEYS.CUSTOMER_DATA);
      }
      
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
      
    } catch (error) {
      console.error('❌ Error getting customer data:', error);
      return null;
    }
  }
  
  /**
   * Check if current session is remembered (persistent)
   */
  static isRemembered(): boolean {
    try {
      const rememberFlag = localStorage.getItem(TOKEN_KEYS.REMEMBER_FLAG);
      return rememberFlag === 'true';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if token is expired
   */
  private static isExpired(storage: Storage): boolean {
    try {
      const encryptedTokenData = storage.getItem(TOKEN_KEYS.TOKEN_TIMESTAMP);
      if (!encryptedTokenData) return true;
      
      const tokenDataStr = this.decrypt(encryptedTokenData);
      const tokenData: TokenData = JSON.parse(tokenDataStr);
      
      const now = Date.now();
      const expirationTime = tokenData.rememberMe ? EXPIRATION.PERSISTENT : EXPIRATION.SESSION;
      
      return (now - tokenData.timestamp) > expirationTime;
      
    } catch (error) {
      console.error('❌ Error checking expiration:', error);
      return true; // Assume expired on error
    }
  }
  
  /**
   * Clear specific storage
   */
  private static clearStorage(storage: Storage): void {
    storage.removeItem(TOKEN_KEYS.AUTH_TOKEN);
    storage.removeItem(TOKEN_KEYS.TOKEN_TIMESTAMP);
    storage.removeItem(TOKEN_KEYS.REMEMBER_FLAG);
    storage.removeItem(TOKEN_KEYS.CUSTOMER_DATA);
  }
  
  /**
   * Clear all authentication data
   */
  static clear(): void {
    try {
      // Clear both storages
      this.clearStorage(localStorage);
      this.clearStorage(sessionStorage);
      
      console.log('🗑️ All authentication data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }
  
  /**
   * Save/remove remembered email
   */
  static setRememberedEmail(email: string, remember: boolean): void {
    try {
      if (remember) {
        const encryptedEmail = this.encrypt(email);
        localStorage.setItem(TOKEN_KEYS.EMAIL, encryptedEmail);
        console.log('📧 Email saved for next login');
      } else {
        localStorage.removeItem(TOKEN_KEYS.EMAIL);
        console.log('📧 Email removed from storage');
      }
    } catch (error) {
      console.error('❌ Error managing remembered email:', error);
    }
  }
  
  /**
   * Get remembered email
   */
  static getRememberedEmail(): string | null {
    try {
      const encryptedEmail = localStorage.getItem(TOKEN_KEYS.EMAIL);
      if (!encryptedEmail) return null;
      
      return this.decrypt(encryptedEmail);
    } catch (error) {
      console.error('❌ Error getting remembered email:', error);
      return null;
    }
  }
  
  /**
   * Get token info for debugging
   */
  static getTokenInfo(): {
    hasToken: boolean;
    isRemembered: boolean;
    expiresIn: string;
    storage: 'localStorage' | 'sessionStorage' | 'none';
  } {
    try {
      const hasLocalToken = !!localStorage.getItem(TOKEN_KEYS.AUTH_TOKEN);
      const hasSessionToken = !!sessionStorage.getItem(TOKEN_KEYS.AUTH_TOKEN);
      const isRemembered = this.isRemembered();
      
      let expiresIn = 'N/A';
      let storage: 'localStorage' | 'sessionStorage' | 'none' = 'none';
      
      if (hasLocalToken) {
        storage = 'localStorage';
        expiresIn = '30 days';
      } else if (hasSessionToken) {
        storage = 'sessionStorage';
        expiresIn = '24 hours';
      }
      
      return {
        hasToken: hasLocalToken || hasSessionToken,
        isRemembered,
        expiresIn,
        storage
      };
    } catch (error) {
      return {
        hasToken: false,
        isRemembered: false,
        expiresIn: 'Error',
        storage: 'none'
      };
    }
  }

  /**
   * Set token in SDK for API requests
   */
  static setInSDK(token: string): void {
    if (!token || token.startsWith('fake_token_')) {
      console.log('⏭️ Pomijam ustawianie tokenu (brak realnego tokenu JWT)');
      return;
    }
    try {
      console.log('🔑 Setting real token in SDK...', token.substring(0, 20) + '...');
      // Import SDK dynamically to avoid circular dependencies
      import('@/lib/medusa-client').then(({ sdk }) => {
        if ((sdk as any).client && (sdk as any).client.setHeaders) {
          (sdk as any).client.setHeaders({ 'Authorization': `Bearer ${token}` });
        }
      });
    } catch (error) {
      console.error('❌ Failed to set token in SDK:', error);
    }
  }
}

export default TokenManager;