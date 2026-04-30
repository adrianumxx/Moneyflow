import { authenticatedFetch } from "../utils/api";

export interface PurgeDryRunResponse {
  profileExists: boolean;
  collectionCounts: Record<string, number>;
  groupsImpactSummary: {
    ownedGroupsCount: number;
    membershipsCount: number;
  };
  message: string;
}

/**
 * Initiates a non-destructive audit of all user data paths.
 * Returns counts of documents that would be affected by a purge.
 */
export async function getPurgeDryRun(): Promise<PurgeDryRunResponse> {
  const response = await authenticatedFetch('/api/user/purge/dry-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to perform data audit');
  }

  return response.json();
}

/**
 * Permanently deletes all personal financial data.
 * @param confirmText Must be "DELETE" to proceed.
 */
export async function purgeUserData(confirmText: string): Promise<any> {
  const response = await authenticatedFetch('/api/user/purge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmText })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to erase data');
  }

  return response.json();
}

