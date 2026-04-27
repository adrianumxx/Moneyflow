import { Request, Response } from 'express';

// ==========================================
// PLAID API INTEGRATION STUBS (US / GLOBAL)
// ==========================================
// To use this in production:
// 1. Sign up at https://dashboard.plaid.com/
// 2. Get your PLAID_CLIENT_ID and PLAID_SECRET
// 3. Use the 'plaid' npm package to exchange tokens

export const createPlaidLinkToken = async (req: Request, res: Response) => {
  try {
    // const { userId } = req.body;
    // const response = await plaidClient.linkTokenCreate({ ... });
    // res.json({ link_token: response.data.link_token });
    
    res.status(200).json({ 
      success: true, 
      link_token: "link-development-placeholder",
      message: "Register on Plaid to get real link tokens." 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create link token" });
  }
};

export const exchangePlaidPublicToken = async (req: Request, res: Response) => {
  try {
    const { public_token } = req.body;
    // const response = await plaidClient.itemPublicTokenExchange({ public_token });
    // const access_token = response.data.access_token;
    // Save access_token to Firestore securely
    
    res.status(200).json({ success: true, message: "Token exchanged successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to exchange token" });
  }
};

// ==========================================
// GOCARDLESS API INTEGRATION STUBS (EU / UK)
// ==========================================
// To use this in production:
// 1. Sign up at https://bankaccountdata.gocardless.com/
// 2. Get your Secret ID and Secret Key
// 3. Generate access tokens and create Requisitions

export const generateGoCardlessLink = async (req: Request, res: Response) => {
  try {
    // const { institutionId } = req.body;
    // 1. Get Access Token using Secret ID/Key
    // 2. Create Requisition for the institutionId
    // 3. Return the requisition link
    
    res.status(200).json({ 
      success: true, 
      link: "https://ob.gocardless.com/placeholder-link",
      message: "Register on GoCardless Bank Account Data to generate real links." 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate bank link" });
  }
};
