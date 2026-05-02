import axios from 'axios';

const SNAPTRADE_API_URL = 'https://api.snaptrade.com/api/v1';

/**
 * SnapTrade Provider Utility
 * Handles global Broker and Crypto Exchange connections.
 */

export async function registerSnapTradeUser(userId: string) {
  const apiKey = process.env.SNAPTRADE_API_KEY;
  const clientId = process.env.SNAPTRADE_CLIENT_ID;

  if (!apiKey || !clientId) throw new Error('SNAPTRADE_NOT_CONFIGURED');

  try {
    const response = await axios.post(`${SNAPTRADE_API_URL}/snapTrade/registerUser`, {
      userId: userId
    }, {
      params: { clientId, timestamp: Date.now() },
      headers: { 'X-Api-Key': apiKey }
    });
    return response.data; // { userHandle, userSecret }
  } catch (error: any) {
    console.error('[SnapTrade] Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

export async function createSnapTradeRedirect(userHandle: string, userSecret: string) {
  const apiKey = process.env.SNAPTRADE_API_KEY;
  const clientId = process.env.SNAPTRADE_CLIENT_ID;

  const response = await axios.post(`${SNAPTRADE_API_URL}/snapTrade/login`, {
    userHandle,
    userSecret
  }, {
    params: { clientId, timestamp: Date.now() },
    headers: { 'X-Api-Key': apiKey }
  });

  return response.data.redirectURI;
}

export async function fetchSnapTradeHoldings(userHandle: string, userSecret: string) {
  const apiKey = process.env.SNAPTRADE_API_KEY;
  const clientId = process.env.SNAPTRADE_CLIENT_ID;

  const response = await axios.get(`${SNAPTRADE_API_URL}/holdings`, {
    params: { clientId, timestamp: Date.now(), userHandle, userSecret },
    headers: { 'X-Api-Key': apiKey }
  });

  return response.data;
}
