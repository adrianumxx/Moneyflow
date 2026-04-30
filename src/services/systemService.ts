import { authenticatedFetch } from '../utils/api.js';

/**
 * System Diagnostics Service
 * Fetches the backend configuration status for beta environment verification.
 */

export interface SystemStatus {
  firebaseAdminConfigured: boolean;
  geminiConfigured: boolean;
  gocardlessConfigured: boolean;
  stripeConfigured: boolean;
  newsProviderEnabled: boolean;
  appUrlConfigured: boolean;
  environment: string;
}

/**
 * Fetches the backend system status.
 * Requires authentication.
 */
export async function getSystemStatus(): Promise<SystemStatus | null> {
  try {
    const response = await authenticatedFetch('/api/system/status', {
      method: 'GET'
    });
    
    if (!response.ok) {
      if (response.status === 401) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[systemService] Failed to fetch system status:', error);
    return null;
  }
}
