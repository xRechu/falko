/**
 * Enhanced Session Management for Remember Me functionality
 * Handles session restoration, token validation, and automatic logout
 */

import { TokenManager } from './token-manager';
import { Customer } from './types/customer';

export interface SessionInfo {
  isValid: boolean;
  customer: Customer | null;
  isRemembered: boolean;
  expiresIn: string;
  error?: string;
}

export class SessionManager {
  
  /**
   * Restore session from storage on app initialization
   */
  static async restoreSession(): Promise<SessionInfo> {
    try {
      console.log('🔄 [SessionManager] Attempting session restoration...');
      
      // Get token from storage
      const token = TokenManager.get();
      if (!token) {
        console.log('ℹ️ [SessionManager] No token found');
        return {
          isValid: false,
          customer: null,
          isRemembered: false,
          expiresIn: 'N/A'
        };
      }
      
      // Get customer data from storage
      const customerData = TokenManager.getCustomerData();
      const isRemembered = TokenManager.isRemembered();
      const tokenInfo = TokenManager.getTokenInfo();
      
      console.log('🔐 [SessionManager] Token info:', tokenInfo);
      
      if (customerData) {
        // We have both token and customer data
        console.log(`✅ [SessionManager] Session restored successfully (remembered: ${isRemembered})`);
        
        return {
          isValid: true,
          customer: customerData,
          isRemembered,
          expiresIn: tokenInfo.expiresIn
        };
      } else {
        // We have token but no customer data - need to fetch from API
        console.log('🔄 [SessionManager] Token found but no customer data, validating with API...');
        
        try {
          // Validate token with backend (you'll need to implement this)
          const customer = await this.validateTokenWithAPI(token);
          
          if (customer) {
            // Save customer data for future use
            TokenManager.save(token, isRemembered, customer);
            
            console.log(`✅ [SessionManager] Token validated and customer data restored`);
            
            return {
              isValid: true,
              customer,
              isRemembered,
              expiresIn: tokenInfo.expiresIn
            };
          } else {
            throw new Error('Invalid token response from API');
          }
          
        } catch (apiError) {
          console.error('❌ [SessionManager] Token validation failed:', apiError);
          
          // Clear invalid token
          TokenManager.clear();
          
          return {
            isValid: false,
            customer: null,
            isRemembered: false,
            expiresIn: 'Expired',
            error: 'Token validation failed'
          };
        }
      }
      
    } catch (error) {
      console.error('❌ [SessionManager] Session restoration error:', error);
      
      // Clear potentially corrupted data
      TokenManager.clear();
      
      return {
        isValid: false,
        customer: null,
        isRemembered: false,
        expiresIn: 'Error',
        error: error instanceof Error ? error.message : 'Session restoration failed'
      };
    }
  }
  
  /**
   * Validate token with backend API
   */
  private static async validateTokenWithAPI(token: string): Promise<Customer | null> {
    try {
      // This should call your Medusa API to validate the token
      // For now, we'll use a placeholder implementation
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.customer;
      } else {
        console.log('🔒 [SessionManager] Token validation failed - API returned error');
        return null;
      }
      
    } catch (error) {
      console.error('❌ [SessionManager] API validation error:', error);
      return null;
    }
  }
  
  /**
   * Get remembered email for login form
   */
  static getRememberedEmail(): string {
    try {
      if (typeof window === 'undefined') return '';
      return localStorage.getItem('remembered_email') || '';
    } catch (error) {
      console.error('Error getting remembered email:', error);
      return '';
    }
  }
  
  /**
   * Check if user should be remembered
   */
  static shouldRememberUser(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem('auth_remember') === 'true';
    } catch (error) {
      console.error('Error checking remember status:', error);
      return false;
    }
  }
  
  /**
   * Get session status for debugging
   */
  static getSessionStatus(): {
    hasActiveSession: boolean;
    tokenInfo: ReturnType<typeof TokenManager.getTokenInfo>;
    rememberedEmail: string | null;
  } {
    return {
      hasActiveSession: !!TokenManager.get(),
      tokenInfo: TokenManager.getTokenInfo(),
      rememberedEmail: TokenManager.getRememberedEmail()
    };
  }
  
  /**
   * Force session cleanup (for debugging or admin purposes)
   */
  static forceCleanup(): void {
    console.log('🧹 [SessionManager] Forcing session cleanup...');
    TokenManager.clear();
    console.log('✅ [SessionManager] Session cleanup complete');
  }
}

export default SessionManager;