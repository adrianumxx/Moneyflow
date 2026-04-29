import { authenticatedFetch } from '../utils/api';

/**
 * Connector Sync Service
 * Bridges the frontend UI with the protected /api/sync backend foundation.
 */

export interface SyncResponse {
  success: boolean;
  status: string;
  providerId?: string;
  institutionId?: string;
  sessionToken?: string;
  nextAction?: string;
  message?: string;
  error?: string;
  lastSyncedAt?: any;
}

/**
 * Initiates a connection session for a specific provider.
 */
export async function createSyncSession(providerId: string): Promise<SyncResponse> {
  try {
    const response = await authenticatedFetch('/api/sync/session/create', {
      method: 'POST',
      body: JSON.stringify({ providerId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('[syncService] Failed to create session:', error);
    return { success: false, status: 'error', error: 'Connection failed' };
  }
}

/**
 * Handles the callback/handshake response from a provider connection.
 */
export async function handleSyncCallback(providerId: string, authCode: string): Promise<SyncResponse> {
  try {
    const response = await authenticatedFetch('/api/sync/session/callback', {
      method: 'POST',
      body: JSON.stringify({ providerId, authCode })
    });
    
    return await response.json();
  } catch (error) {
    console.error('[syncService] Failed to handle callback:', error);
    return { success: false, status: 'error', error: 'Handshake failed' };
  }
}

/**
 * Triggers a synchronization refresh for an existing institution.
 */
export async function syncAccounts(institutionId: string): Promise<SyncResponse> {
  try {
    const response = await authenticatedFetch('/api/sync/accounts/sync', {
      method: 'POST',
      body: JSON.stringify({ institutionId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('[syncService] Failed to sync accounts:', error);
    return { success: false, status: 'error', error: 'Sync failed' };
  }
}

/**
 * Fetches the current connection and sync status of an institution.
 */
export async function getSyncStatus(institutionId: string): Promise<SyncResponse> {
  try {
    const response = await authenticatedFetch('/api/sync/status', {
      method: 'POST',
      body: JSON.stringify({ institutionId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('[syncService] Failed to get status:', error);
    return { success: false, status: 'error', error: 'Status check failed' };
  }
}

/**
 * Disconnects a provider and marks records as inactive.
 */
export async function disconnectInstitution(institutionId: string): Promise<SyncResponse> {
  try {
    const response = await authenticatedFetch('/api/sync/disconnect', {
      method: 'POST',
      body: JSON.stringify({ institutionId })
    });
    
    return await response.json();
  } catch (error) {
    console.error('[syncService] Failed to disconnect:', error);
    return { success: false, status: 'error', error: 'Disconnect failed' };
  }
}
