const BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

export interface GoCardlessInstitution {
  id: string;
  name: string;
  bic?: string;
  transaction_total_days?: string;
  logo?: string;
  countries?: string[];
}

/**
 * Retrieves a fresh access token from GoCardless.
 * Does NOT store secrets or tokens in persistent storage.
 */
async function getAccessToken(): Promise<string> {
  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error('GOCARDLESS_NOT_CONFIGURED');
  }

  const response = await fetch(`${BASE_URL}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`GoCardless Auth Failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access;
}

/**
 * Lists supported institutions for a given country.
 * Normalizes the response for the frontend.
 */
export const getInstitutionList = async (countryCode: string = 'BE') => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/institutions/?country=${countryCode}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch institutions: ${response.statusText}`);
    }

    const data: GoCardlessInstitution[] = await response.json();
    
    return data.map(inst => ({
      id: inst.id,
      name: inst.name,
      bic: inst.bic,
      transactionTotalDays: inst.transaction_total_days,
      logo: inst.logo,
      countries: inst.countries
    }));
  } catch (error: any) {
    if (error.message === 'GOCARDLESS_NOT_CONFIGURED') {
      throw error;
    }
    console.error('[GoCardless] Institution List Error:', error.message);
    throw new Error('Could not retrieve institution list');
  }
};

/**
 * Creates a GoCardless API client placeholder (deprecated in favor of direct fetch helpers).
 */
/**
 * Initiates a requisition session for bank connection.
 */
export const createRequisitionSession = async (institutionId: string, redirectUrl: string): Promise<any> => {
  try {
    const token = await getAccessToken();
    const reference = `mf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const response = await fetch(`${BASE_URL}/requisitions/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        institution_id: institutionId,
        redirect: redirectUrl,
        reference: reference,
        user_language: 'EN'
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Failed to create requisition: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      requisitionId: data.id,
      link: data.link,
      status: data.status,
      institutionId: data.institution_id
    };
  } catch (error: any) {
    if (error.message === 'GOCARDLESS_NOT_CONFIGURED') {
      throw error;
    }
    console.error('[GoCardless] Requisition Error:', error.message);
    throw new Error('Could not create requisition session');
  }
};

/**
 * Retrieves requisition status and associated accounts.
 */
export const getRequisition = async (requisitionId: string): Promise<any> => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/requisitions/${requisitionId}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch requisition: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      requisitionId: data.id,
      status: data.status,
      accounts: data.accounts || [],
      institutionId: data.institution_id
    };
  } catch (error: any) {
    if (error.message === 'GOCARDLESS_NOT_CONFIGURED') {
      throw error;
    }
    console.error('[GoCardless] Get Requisition Error:', error.message);
    throw new Error('Could not retrieve requisition status');
  }
};

/**
 * Fetches account metadata from GoCardless.
 */
export const getAccountMetadata = async (accountId: string): Promise<any> => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/accounts/${accountId}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account metadata: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      providerAccountId: data.id,
      name: data.name || data.product || 'Unknown Account',
      type: data.cash_account_type || 'checking',
      currency: data.currency || 'EUR',
      status: data.status || 'READY'
    };
  } catch (error: any) {
    if (error.message === 'GOCARDLESS_NOT_CONFIGURED') {
      throw error;
    }
    console.error('[GoCardless] Account Metadata Error:', error.message);
    throw new Error('Could not retrieve account metadata');
  }
};

/**
 * Fetches accounts associated with a requisition.
 */
export const getAccounts = async (requisitionId: string) => {
  throw new Error('getAccounts not implemented.');
};

/**
 * Fetches current balance for a specific account.
 */
export const getAccountBalances = async (accountId: string): Promise<any> => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${BASE_URL}/accounts/${accountId}/balances/`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }

    const data = await response.json();
    const balanceObj = data.balances?.find((b: any) => b.balanceType === 'expected') || data.balances?.[0];

    return {
      providerAccountId: accountId,
      balance: balanceObj ? parseFloat(balanceObj.balanceAmount.amount) : 0,
      currency: balanceObj ? balanceObj.balanceAmount.currency : 'EUR',
      balanceType: balanceObj ? balanceObj.balanceType : 'unknown',
      referenceDate: balanceObj ? balanceObj.referenceDate : undefined
    };
  } catch (error: any) {
    if (error.message === 'GOCARDLESS_NOT_CONFIGURED') {
      throw error;
    }
    console.error('[GoCardless] Balance Error:', error.message);
    throw new Error('Could not retrieve account balances');
  }
};

/**
 * Fetches transaction history for a specific account.
 */
export const getAccountTransactions = async (accountId: string, dateFrom?: string, dateTo?: string): Promise<any[]> => {
  try {
    const token = await getAccessToken();
    let url = `${BASE_URL}/accounts/${accountId}/transactions/`;
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) throw new Error(`Failed to fetch transactions: ${response.statusText}`);

    const data = await response.json();
    const booked = data.transactions?.booked || [];
    const pending = data.transactions?.pending || [];

    const normalize = (tx: any, status: 'booked' | 'pending') => {
      const amount = parseFloat(tx.transactionAmount?.amount || '0');
      return {
        providerTransactionId: tx.internalTransactionId || tx.transactionId || `tx_${Math.random().toString(36).substring(7)}`,
        providerAccountId: accountId,
        amount: Math.abs(amount),
        currency: tx.transactionAmount?.currency || 'EUR',
        description: tx.remittanceInformationUnstructured || tx.details || 'Bank Transaction',
        bookingDate: tx.bookingDate || tx.valueDate,
        valueDate: tx.valueDate,
        type: amount > 0 ? 'income' : 'expense',
        source: 'bank',
        status
      };
    };

    return [
      ...booked.map((t: any) => normalize(t, 'booked')),
      ...pending.map((t: any) => normalize(t, 'pending'))
    ];
  } catch (error: any) {
    if (error.message === 'GOCARDLESS_NOT_CONFIGURED') throw error;
    console.error('[GoCardless] Transactions Error:', error.message);
    throw new Error('Could not retrieve account transactions');
  }
};
