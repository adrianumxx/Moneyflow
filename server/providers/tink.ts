import axios from 'axios';

const TINK_API_URL = 'https://api.tink.com/api/v1';

/**
 * Tink Provider Utility
 * Handles authentication and data fetching for European Banks.
 */

export async function getTinkAccessToken() {
  const clientId = process.env.TINK_CLIENT_ID;
  const clientSecret = process.env.TINK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('TINK_NOT_CONFIGURED');
  }

  const response = await axios.post('https://api.tink.com/api/v1/oauth/token', 
    new URLSearchParams({
      code: '', // Not used for client_credentials
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'accounts:read,transactions:read,investments:read'
    }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data.access_token;
}

export async function createTinkLink(userId: string, market: string = 'IT') {
  const token = await getTinkAccessToken();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const response = await axios.post(`${TINK_API_URL}/console/links`, {
    market,
    locale: 'it_IT',
    redirect_uri: `${appUrl}/callback/tink`,
    scope: 'accounts:read,transactions:read,investments:read',
    user_id: userId
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return response.data.url;
}

export async function fetchTinkAccounts(token: string) {
  const response = await axios.get(`${TINK_API_URL}/accounts/list`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data.accounts;
}

export async function fetchTinkTransactions(token: string, accountId: string) {
  const response = await axios.get(`${TINK_API_URL}/transactions/list`, {
    params: { accountId },
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data.transactions;
}
