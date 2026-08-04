import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { 
  Wallet, 
  PaymentRail, 
  Transaction, 
  LedgerEntry, 
  QueueTask, 
  WebhookEvent, 
  AnomalyAlert,
  OpenBankProvider,
  OpenBankingConsent,
  ExternalBankAccount,
  OpenBankingPISPayment,
  WalletLimit,
  PassportEndorsement,
  VirtualCard,
  GmailNotificationLog
} from './src/types.js';
import { 
  INITIAL_WALLETS, 
  INITIAL_PAYMENT_RAILS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LEDGER_ENTRIES 
} from './src/data/initialData.js';

const app = express();
app.use(express.json());

// Google OAuth Helper function for Workspace APIs (Gmail)
export function getOAuth2Client(req: Request): any {
  const accessToken = req.headers['x-goog-authenticated-user-token'] as string;
  const refreshToken = req.headers['x-goog-authenticated-user-refresh-token'] as string;

  const client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET
  );

  if (accessToken || refreshToken) {
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}

let gmailNotificationLogs: GmailNotificationLog[] = [];

const PORT = 3000;

// ==========================================
// IN-MEMORY ACID DATA STORE & STATE MUTEX
// ==========================================
let wallets: Wallet[] = [...INITIAL_WALLETS];
let rails: PaymentRail[] = [...INITIAL_PAYMENT_RAILS];
let transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let ledgerEntries: LedgerEntry[] = [...INITIAL_LEDGER_ENTRIES];
let queueTasks: QueueTask[] = [];
let webhookEvents: WebhookEvent[] = [
  {
    id: 'WH-880912',
    transactionId: 'TXN-908122-882',
    merchantId: 'WAL-MERCH-301',
    eventType: 'transaction.failed',
    payload: {
      event: 'payment.failed',
      transactionId: 'TXN-908122-882',
      amount: 12500.00,
      currency: 'BDT',
      merchantName: 'Daraz Online Express',
      errorReason: 'Merchant Webhook Gateway Timeout (504)'
    },
    status: 'FAILED',
    statusCode: 504,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    signature: '7f9a12c8b3e4019a8d712f6a90823b1109a87234125f67a912e345b678c901ab',
    endpointUrl: 'https://api.daraz.com.bd/v1/payroute/webhook',
    attemptCount: 2,
    maxAttempts: 5,
    lastAttemptAt: new Date(Date.now() - 10 * 60000).toISOString(),
    nextRetryDelaySeconds: 8, // 2^2 * 2 = 8s
    failureReason: 'HTTP 504 Gateway Timeout: Merchant API failed to respond within 5000ms.',
    deliveryLogs: [
      {
        attempt: 1,
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        statusCode: 504,
        status: 'FAILED',
        responseBody: '{"error": "Gateway Timeout", "code": 504, "message": "Upstream merchant socket disconnected"}',
        delaySeconds: 0,
        endpointUrl: 'https://api.daraz.com.bd/v1/payroute/webhook'
      },
      {
        attempt: 2,
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        statusCode: 500,
        status: 'FAILED',
        responseBody: '{"error": "Internal Server Error", "code": 500, "message": "Database transaction lock timeout"}',
        delaySeconds: 2,
        endpointUrl: 'https://api.daraz.com.bd/v1/payroute/webhook'
      }
    ]
  },
  {
    id: 'WH-880911',
    transactionId: 'TXN-908122-883',
    merchantId: 'WAL-USER-101',
    eventType: 'transaction.failed',
    payload: {
      event: 'transfer.rejected',
      transactionId: 'TXN-908122-883',
      amount: 3500.00,
      currency: 'BDT',
      recipient: 'Rahat Hossain',
      errorReason: 'SSL Certificate Handshake Error'
    },
    status: 'FAILED',
    statusCode: 502,
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    signature: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    endpointUrl: 'https://hooks.payroute.net/callback/rahathossain',
    attemptCount: 1,
    maxAttempts: 5,
    lastAttemptAt: new Date(Date.now() - 25 * 60000).toISOString(),
    nextRetryDelaySeconds: 4, // 2^1 * 2 = 4s
    failureReason: 'HTTP 502 Bad Gateway: Upstream SSL certificate verification failed.',
    deliveryLogs: [
      {
        attempt: 1,
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        statusCode: 502,
        status: 'FAILED',
        responseBody: '{"error": "Bad Gateway", "reason": "Self-signed certificate in chain"}',
        delaySeconds: 0,
        endpointUrl: 'https://hooks.payroute.net/callback/rahathossain'
      }
    ]
  },
  {
    id: 'WH-880910',
    transactionId: 'TXN-908122-881',
    merchantId: 'WAL-USER-101',
    eventType: 'transaction.success',
    payload: {
      event: 'salary.disbursed',
      transactionId: 'TXN-908122-881',
      amount: 45000.00,
      currency: 'BDT',
      sender: 'TechCraft Solutions Ltd.',
      receiver: 'Rahat Hossain'
    },
    status: 'DELIVERED',
    statusCode: 200,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    signature: '8f4e5a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    endpointUrl: 'https://webhook.site/payroute-payroll-callback',
    attemptCount: 1,
    maxAttempts: 5,
    lastAttemptAt: new Date(Date.now() - 45 * 60000).toISOString(),
    nextRetryDelaySeconds: 0,
    deliveryLogs: [
      {
        attempt: 1,
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        statusCode: 200,
        status: 'DELIVERED',
        responseBody: '{"success": true, "acknowledged": true, "receivedAt": "2026-07-30T10:10:00Z"}',
        delaySeconds: 0,
        endpointUrl: 'https://webhook.site/payroute-payroll-callback'
      }
    ]
  }
];
let anomalyAlerts: AnomalyAlert[] = [];
const processedIdempotencyKeys = new Set<string>();

// Transaction Limits & Caps Store
let walletLimitConfigs: Map<string, { dailyCap: number; monthlyCap: number; alertOnThresholdPercent: number }> = new Map([
  ['WAL-1001', { dailyCap: 100000, monthlyCap: 500000, alertOnThresholdPercent: 80 }],
  ['WAL-1002', { dailyCap: 75000, monthlyCap: 300000, alertOnThresholdPercent: 80 }],
  ['WAL-MERCHANT-01', { dailyCap: 1000000, monthlyCap: 5000000, alertOnThresholdPercent: 90 }],
  ['WAL-CORP-501', { dailyCap: 5000000, monthlyCap: 25000000, alertOnThresholdPercent: 85 }],
  ['WAL-SYS-901', { dailyCap: 50000000, monthlyCap: 200000000, alertOnThresholdPercent: 95 }],
]);

// Active System Administrator User Profile
let systemAdminUser = {
  email: 'rubels1k994@gmail.com',
  name: 'Rubel Admin',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  lastActive: new Date().toISOString()
};

// Passport Endorsement & Bangladesh Bank Foreign Travel Quota State
let currentPassportEndorsement: PassportEndorsement | null = {
  id: 'PASS-ENDORSE-2026-9081',
  passportNumber: 'A09876543',
  holderName: 'RAHIM AHMED',
  nidNumber: '1992269123450098',
  issueDate: '2022-05-15',
  expiryDate: '2032-05-14',
  annualTravelQuotaUSD: 12000,
  usedTravelQuotaUSD: 1450,
  remainingQuotaUSD: 10550,
  status: 'VERIFIED_BB_SYNCED',
  verificationHash: 'BB-FX-CLEARANCE-9948210394-SHA256',
  verifiedAt: '2026-01-10T09:30:00.000Z'
};

// Open Virtual Cards Store
let virtualCards: VirtualCard[] = [
  {
    id: 'VCARD-4091-8812',
    walletId: 'WAL-1001',
    passportNumber: 'A09876543',
    cardNumberMasked: '4242 •••• •••• 8812',
    fullCardNumber: '4242 8891 0023 8812',
    cardholderName: 'RAHIM AHMED',
    expiryDate: '08/29',
    cvv: '894',
    cardType: 'VIRTUAL_VISA',
    status: 'ACTIVE',
    currency: 'USD',
    cardLimitUSD: 2000,
    spentUSD: 450,
    isInternationalEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'VCARD-5520-3341',
    walletId: 'WAL-1001',
    passportNumber: 'A09876543',
    cardNumberMasked: '5520 •••• •••• 3341',
    fullCardNumber: '5520 9941 7712 3341',
    cardholderName: 'RAHIM AHMED',
    expiryDate: '11/28',
    cvv: '210',
    cardType: 'VIRTUAL_MASTERCARD',
    status: 'ACTIVE',
    currency: 'USD',
    cardLimitUSD: 1000,
    spentUSD: 1000,
    isInternationalEnabled: true,
    createdAt: new Date().toISOString()
  }
];


function getWalletSpendingStats(walletId: string): WalletLimit {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let currentDailySpent = 0;
  let currentMonthlySpent = 0;

  for (const tx of transactions) {
    if (tx.senderWalletId === walletId && tx.status === 'SUCCESS') {
      const txTime = new Date(tx.timestamp).getTime();
      if (txTime >= startOfDay) {
        currentDailySpent += tx.amount;
      }
      if (txTime >= startOfMonth) {
        currentMonthlySpent += tx.amount;
      }
    }
  }

  const config = walletLimitConfigs.get(walletId) || { dailyCap: 100000, monthlyCap: 500000, alertOnThresholdPercent: 80 };
  const dailyPct = (currentDailySpent / config.dailyCap) * 100;
  const monthlyPct = (currentMonthlySpent / config.monthlyCap) * 100;

  let status: 'NORMAL' | 'WARNING' | 'LIMIT_EXCEEDED' = 'NORMAL';
  if (dailyPct >= 100 || monthlyPct >= 100) {
    status = 'LIMIT_EXCEEDED';
  } else if (dailyPct >= config.alertOnThresholdPercent || monthlyPct >= config.alertOnThresholdPercent) {
    status = 'WARNING';
  }

  const wallet = wallets.find(w => w.id === walletId);

  return {
    walletId,
    ownerName: wallet?.ownerName || walletId,
    dailyCap: config.dailyCap,
    monthlyCap: config.monthlyCap,
    currentDailySpent,
    currentMonthlySpent,
    alertOnThresholdPercent: config.alertOnThresholdPercent,
    status,
    lastUpdated: new Date().toISOString()
  };
}

// Open Banking Mock Data Store
let openBankProviders: OpenBankProvider[] = [
  {
    id: 'OB-BRAC-01',
    bankName: 'BRAC Bank Open API',
    swiftCode: 'BRACBDDH',
    apiSpec: 'BANGLADESH_BANK_OPEN_API',
    status: 'ONLINE',
    supportedScopes: ['ReadAccounts', 'ReadBalances', 'ReadTransactions', 'InitiateSinglePayment', 'InitiateRecurringPayment'],
    sandboxUrl: 'https://sandbox.bracbank.com/open-banking/v1'
  },
  {
    id: 'OB-CITY-02',
    bankName: 'City Bank Open Gateway',
    swiftCode: 'CIYTBDDH',
    apiSpec: 'PSD2_BERLIN_GROUP',
    status: 'ONLINE',
    supportedScopes: ['ReadAccounts', 'ReadBalances', 'ReadTransactions', 'InitiateSinglePayment'],
    sandboxUrl: 'https://developer.thecitybank.com/psd2/v1'
  },
  {
    id: 'OB-EBL-03',
    bankName: 'Eastern Bank Open API',
    swiftCode: 'EBLBDDH',
    apiSpec: 'BANGLADESH_BANK_OPEN_API',
    status: 'ONLINE',
    supportedScopes: ['ReadAccounts', 'ReadBalances', 'ReadTransactions', 'InitiateSinglePayment'],
    sandboxUrl: 'https://open.ebl.com.bd/api/v2'
  },
  {
    id: 'OB-SCB-04',
    bankName: 'Standard Chartered Open Banking',
    swiftCode: 'SCBLBDDX',
    apiSpec: 'UK_OPEN_BANKING_V3.1',
    status: 'DEGRADED',
    supportedScopes: ['ReadAccounts', 'ReadBalances', 'ReadTransactions', 'InitiateSinglePayment'],
    sandboxUrl: 'https://developer.sc.com/openbanking/v3.1'
  }
];

let openBankConsents: OpenBankingConsent[] = [
  {
    id: 'cst-001',
    consentId: 'bb-consent-9981-brac',
    bankId: 'OB-BRAC-01',
    bankName: 'BRAC Bank Open API',
    tppName: 'PayRoute Open Banking Engine',
    status: 'AUTHORISED',
    permissions: ['ReadAccountsDetail', 'ReadBalances', 'ReadTransactionsDetail', 'CreatePaymentInitiation'],
    expirationDateTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    accessKey: 'tpp_access_token_brac_live_771239'
  },
  {
    id: 'cst-002',
    consentId: 'psd2-consent-4412-city',
    bankId: 'OB-CITY-02',
    bankName: 'City Bank Open Gateway',
    tppName: 'PayRoute Open Banking Engine',
    status: 'AUTHORISED',
    permissions: ['ReadAccountsDetail', 'ReadBalances', 'CreatePaymentInitiation'],
    expirationDateTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    accessKey: 'tpp_access_token_city_live_884102'
  }
];

let externalBankAccounts: ExternalBankAccount[] = [
  {
    accountId: 'acc-brac-110293',
    bankId: 'OB-BRAC-01',
    bankName: 'BRAC Bank Open API',
    accountNumberMasked: '1501****2094',
    accountType: 'BUSINESS',
    currency: 'BDT',
    availableBalance: 4500000.00,
    consentId: 'bb-consent-9981-brac',
    lastSyncedAt: new Date().toISOString()
  },
  {
    accountId: 'acc-brac-991002',
    bankId: 'OB-BRAC-01',
    bankName: 'BRAC Bank Open API',
    accountNumberMasked: '2019****8811',
    accountType: 'SAVINGS',
    currency: 'BDT',
    availableBalance: 850000.00,
    consentId: 'bb-consent-9981-brac',
    lastSyncedAt: new Date().toISOString()
  },
  {
    accountId: 'acc-city-550192',
    bankId: 'OB-CITY-02',
    bankName: 'City Bank Open Gateway',
    accountNumberMasked: '3109****4412',
    accountType: 'BUSINESS',
    currency: 'BDT',
    availableBalance: 12500000.00,
    consentId: 'psd2-consent-4412-city',
    lastSyncedAt: new Date().toISOString()
  }
];

let pisPayments: OpenBankingPISPayment[] = [];

// Simple mutex implementation to ensure strict ACID isolation in Node.js event loop
let isProcessingTransaction = false;
const transactionQueue: (() => void)[] = [];

function acquireLock(): Promise<void> {
  return new Promise((resolve) => {
    if (!isProcessingTransaction) {
      isProcessingTransaction = true;
      resolve();
    } else {
      transactionQueue.push(resolve);
    }
  });
}

function releaseLock() {
  if (transactionQueue.length > 0) {
    const next = transactionQueue.shift();
    if (next) next();
  } else {
    isProcessingTransaction = false;
  }
}

// Google OAuth Token Memory Cache
let googleOAuthTokens: {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user_email?: string;
} | null = null;

// Helper: Calculate SHA-256 for Immutable Ledger Cryptographic Check
function calculateTxHash(tx: Partial<Transaction>): string {
  const payload = `${tx.senderWalletId}:${tx.receiverWalletId}:${tx.amount}:${tx.currency}:${tx.timestamp}:${tx.idempotencyKey}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ==========================================
// GOOGLE OAUTH & GOOGLE DRIVE API ENDPOINTS
// ==========================================

function getAppUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}

app.get('/api/auth/google/url', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const appUrl = getAppUrl(req);
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file email profile');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.json({
    authUrl,
    configured: Boolean(clientId),
    redirectUri,
  });
});

app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('OAuth callback code missing.');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const appUrl = getAppUrl(req);
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Google OAuth token error:', tokenData);
      return res.status(400).send(`Token Error: ${tokenData.error_description || tokenData.error}`);
    }

    googleOAuthTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || googleOAuthTokens?.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
    };

    // Fetch user profile info if possible
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      if (userData.email) {
        googleOAuthTokens.user_email = userData.email;
      }
    } catch (e) {
      // Ignore
    }

    // Redirect user back to the application UI
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive Connected</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; }
            .card { background: #1e293b; max-width: 480px; margin: 0 auto; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Google Drive Connection Successful!</h2>
            <p>PayRoute Ledger is now authorized to save audit statements directly to your Drive.</p>
            <a class="btn" href="/">Return to Dashboard</a>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS' }, '*');
              window.close();
            } else {
              setTimeout(() => { window.location.href = '/'; }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Callback exception:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

app.get('/api/auth/google/status', (req: Request, res: Response) => {
  const isConnected = Boolean(googleOAuthTokens && googleOAuthTokens.access_token);
  res.json({
    connected: isConnected,
    userEmail: googleOAuthTokens?.user_email || 'Connected Google Drive User',
  });
});

app.post('/api/auth/google/disconnect', (req: Request, res: Response) => {
  googleOAuthTokens = null;
  res.json({ success: true });
});

// Export Audit Statements to Google Drive
app.post('/api/drive/export', async (req: Request, res: Response) => {
  if (!googleOAuthTokens || !googleOAuthTokens.access_token) {
    return res.status(401).json({ 
      error: 'Google Drive is not connected. Please complete OAuth authentication first.' 
    });
  }

  const { title, format, filter } = req.body;
  const fileName = `${title || 'PayRoute_Ledger_Statement'}_${new Date().toISOString().slice(0, 10)}.${format === 'JSON' ? 'json' : format === 'CSV' ? 'csv' : 'txt'}`;

  let fileContent = '';

  if (format === 'JSON') {
    fileContent = JSON.stringify({
      exportMetadata: {
        title: title || 'PayRoute Financial Ledger Statement',
        generatedAt: new Date().toISOString(),
        totalWallets: wallets.length,
        totalTransactions: transactions.length,
        systemReserveBalance: wallets.find(w => w.id === 'WAL-SYS-901')?.balance,
      },
      wallets,
      recentTransactions: transactions,
      recentLedgerEntries: ledgerEntries,
    }, null, 2);
  } else if (format === 'CSV') {
    const csvHeader = 'TransactionID,Date,Sender,Receiver,Amount,Currency,Rail,Status,ACID_Hash\n';
    const csvRows = transactions.map(t => 
      `"${t.id}","${t.timestamp}","${t.senderName}","${t.receiverName}",${t.amount},"${t.currency}","${t.executedRail}","${t.status}","${t.hash}"`
    ).join('\n');
    fileContent = csvHeader + csvRows;
  } else {
    fileContent = `===========================================================\n` +
                  `          PAYROUTE AUTOMATED LEDGER AUDIT REPORT           \n` +
                  `===========================================================\n` +
                  `Generated Date: ${new Date().toLocaleString()}\n` +
                  `Export Format: Text Audit Document\n\n` +
                  `1. SYSTEM SUMMARY:\n` +
                  `   - Total Active Accounts: ${wallets.length}\n` +
                  `   - Total Recorded Transactions: ${transactions.length}\n` +
                  `   - System Fee Reserve Balance: ${wallets.find(w => w.id === 'WAL-SYS-901')?.balance.toFixed(2)} BDT\n\n` +
                  `2. WALLET BALANCES (DOUBLE-ENTRY SUMMARY):\n` +
                  wallets.map(w => `   - ${w.ownerName} (${w.id}): ${w.balance.toFixed(2)} ${w.currency} [Status: ${w.status}]`).join('\n') + `\n\n` +
                  `3. RECENT IMMUTABLE TRANSACTIONS:\n` +
                  transactions.map(t => 
                    `   [${t.status}] ${t.id} | ${t.timestamp.slice(0, 19)} | ${t.senderName} -> ${t.receiverName} | ${t.amount} ${t.currency} | Rail: ${t.executedRail}${t.wasRerouted ? ' (Auto-Rerouted)' : ''} | Hash: ${t.hash.slice(0, 16)}...`
                  ).join('\n') + `\n\n` +
                  `===========================================================\n` +
                  `Certified Cryptographically Signed by PayRoute ACID Engine.\n`;
  }

  try {
    const mimeType = format === 'JSON' ? 'application/json' : format === 'CSV' ? 'text/csv' : 'text/plain';
    
    // Multipart upload to Google Drive v3 API
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      description: 'Automated Financial Ledger Statement exported from PayRoute System.',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      fileContent +
      close_delim;

    const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleOAuthTokens.access_token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    const driveData = await driveRes.json();

    if (driveData.error) {
      console.error('Google Drive Upload error:', driveData);
      return res.status(500).json({ error: driveData.error.message || 'Drive upload failed' });
    }

    const fileId = driveData.id;
    const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;

    res.json({
      success: true,
      fileId,
      fileName,
      webViewLink,
      createdTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message || 'Export error' });
  }
});

// List drive exported statements
app.get('/api/drive/list', async (req: Request, res: Response) => {
  if (!googleOAuthTokens || !googleOAuthTokens.access_token) {
    return res.json({ files: [] });
  }

  try {
    const listRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=name+contains+%27PayRoute%27&fields=files(id,name,webViewLink,iconLink,createdTime,size,mimeType)',
      {
        headers: { Authorization: `Bearer ${googleOAuthTokens.access_token}` },
      }
    );
    const data = await listRes.json();
    res.json({ files: data.files || [] });
  } catch (err) {
    res.json({ files: [] });
  }
});

// ==========================================
// INTERNAL ACID LEDGER & TRANSACTION ENGINE
// ==========================================

app.get('/api/admin/profile', (req: Request, res: Response) => {
  res.json({
    admin: systemAdminUser
  });
});

// Get Wallets, Transactions, Rails, Ledger, Alerts
app.get('/api/ledger/overview', (req: Request, res: Response) => {
  res.json({
    wallets,
    rails,
    transactions: transactions.slice(0, 30),
    ledgerEntries: ledgerEntries.slice(0, 50),
    queueTasks: queueTasks.slice(0, 20),
    webhookEvents: webhookEvents.slice(0, 20),
    anomalyAlerts: anomalyAlerts.slice(0, 10),
  });
});

// Live Multi-Currency Exchange Rates API
app.get('/api/exchange-rates', (req: Request, res: Response) => {
  res.json({
    base: 'USD',
    rates: {
      USD: 1.0,
      BDT: 121.50,
      EUR: 0.92,
      GBP: 0.78,
      INR: 83.50,
      CAD: 1.36,
      AED: 3.67,
      SAR: 3.75,
      JPY: 155.20
    },
    lastUpdated: new Date().toISOString(),
    isLive: true
  });
});

// Execute Instant Currency Swap/Conversion within Wallet
app.post('/api/wallets/convert', async (req: Request, res: Response) => {
  await acquireLock();

  try {
    const { walletId, fromCurrency, toCurrency, amount } = req.body;
    const convertAmt = Number(amount);

    if (!walletId || !fromCurrency || !toCurrency || isNaN(convertAmt) || convertAmt <= 0) {
      releaseLock();
      return res.status(400).json({ error: 'Invalid conversion payload arguments.' });
    }

    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) {
      releaseLock();
      return res.status(404).json({ error: 'Wallet account not found.' });
    }

    if (wallet.status !== 'ACTIVE') {
      releaseLock();
      return res.status(403).json({ error: `Wallet is currently ${wallet.status}.` });
    }

    if (!wallet.balances) {
      wallet.balances = { [wallet.currency]: wallet.balance };
    }

    const currentFromBalance = wallet.balances[fromCurrency] || 0;
    if (currentFromBalance < convertAmt) {
      releaseLock();
      return res.status(400).json({ 
        error: `Insufficient ${fromCurrency} balance. Available: ${currentFromBalance} ${fromCurrency}, Required: ${convertAmt} ${fromCurrency}` 
      });
    }

    // Exchange rates relative to USD
    const ratesMap: Record<string, number> = {
      USD: 1.0,
      BDT: 121.50,
      EUR: 0.92,
      GBP: 0.78,
      INR: 83.50,
      CAD: 1.36,
      AED: 3.67,
      SAR: 3.75,
      JPY: 155.20
    };

    const fromRate = ratesMap[fromCurrency] || 1.0;
    const toRate = ratesMap[toCurrency] || 1.0;

    // Convert
    const amtInUSD = convertAmt / fromRate;
    const convertedAmt = Math.round((amtInUSD * toRate) * 100) / 100;

    // Mutate wallet balances
    wallet.balances[fromCurrency] = Math.round((currentFromBalance - convertAmt) * 100) / 100;
    wallet.balances[toCurrency] = Math.round(((wallet.balances[toCurrency] || 0) + convertedAmt) * 100) / 100;

    // Update primary balance if converted from/to primary currency
    if (fromCurrency === wallet.currency) {
      wallet.balance = wallet.balances[wallet.currency];
    } else if (toCurrency === wallet.currency) {
      wallet.balance = wallet.balances[wallet.currency];
    }

    wallet.lastUpdated = new Date().toISOString();

    // Create Ledger Log Entry
    const ledgerEntry: LedgerEntry = {
      id: `LEDGER-SWAP-${Date.now().toString().slice(-6)}`,
      transactionId: `TXN-SWAP-${Date.now().toString().slice(-8)}`,
      walletId: wallet.id,
      walletOwner: wallet.ownerName,
      type: 'CREDIT',
      amount: convertedAmt,
      balanceAfter: wallet.balances[toCurrency],
      currency: toCurrency as any,
      timestamp: new Date().toISOString(),
      description: `Converted ${convertAmt} ${fromCurrency} to ${convertedAmt} ${toCurrency} (Rate: 1 ${fromCurrency} = ${(toRate / fromRate).toFixed(4)} ${toCurrency})`
    };

    ledgerEntries.unshift(ledgerEntry);

    releaseLock();

    res.json({
      success: true,
      message: `Successfully swapped ${convertAmt} ${fromCurrency} to ${convertedAmt} ${toCurrency}`,
      wallet,
      convertedAmount: convertedAmt,
      ledgerEntry
    });
  } catch (err: any) {
    releaseLock();
    res.status(500).json({ error: err.message || 'Internal conversion error.' });
  }
});

// Smart Failover & Rail Selector
function resolveOptimalRail(requestedRailType: PaymentRail['id']): {
  selectedRail: PaymentRail;
  wasRerouted: boolean;
  rerouteReason?: string;
} {
  const primary = rails.find((r) => r.id === requestedRailType);
  
  if (!primary) {
    const internal = rails.find((r) => r.id === 'INTERNAL')!;
    return { selectedRail: internal, wasRerouted: true, rerouteReason: 'Requested rail non-existent' };
  }

  // If operational, use primary
  if (primary.status === 'OPERATIONAL' && primary.latencyMs <= 400) {
    return { selectedRail: primary, wasRerouted: false };
  }

  // Smart failover routing logic!
  const backupType = primary.backupRail || 'INTERNAL';
  const backup = rails.find((r) => r.id === backupType) || rails.find((r) => r.id === 'INTERNAL')!;

  const reason = primary.status === 'OUTAGE' 
    ? `Primary rail '${primary.name}' is currently in OUTAGE. Smart Failover engaged.`
    : `Primary rail '${primary.name}' latency (${primary.latencyMs}ms) exceeded maximum threshold (400ms). Smart Failover engaged.`;

  return { selectedRail: backup, wasRerouted: true, rerouteReason: reason };
}

// Execute Atomic ACID Transfer
app.post('/api/ledger/transfer', async (req: Request, res: Response) => {
  await acquireLock();

  try {
    const { 
      senderWalletId, 
      receiverWalletId, 
      amount, 
      requestedRail, 
      reference, 
      idempotencyKey 
    } = req.body;

    const transferAmount = Number(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      releaseLock();
      return res.status(400).json({ error: 'Transfer amount must be a positive number.' });
    }

    // Idempotency check
    if (idempotencyKey && processedIdempotencyKeys.has(idempotencyKey)) {
      releaseLock();
      return res.status(409).json({ error: 'Duplicate transaction attempt detected (Idempotency Key match).' });
    }

    const sender = wallets.find((w) => w.id === senderWalletId);
    const receiver = wallets.find((w) => w.id === receiverWalletId);
    const sysReserve = wallets.find((w) => w.id === 'WAL-SYS-901')!;

    if (!sender || !receiver) {
      releaseLock();
      return res.status(404).json({ error: 'Sender or Receiver wallet not found.' });
    }

    if (sender.id === receiver.id) {
      releaseLock();
      return res.status(400).json({ error: 'Sender and Receiver wallets cannot be identical.' });
    }

    if (sender.status !== 'ACTIVE') {
      releaseLock();
      return res.status(403).json({ error: `Sender account is ${sender.status}. Transfer rejected.` });
    }

    // Smart Routing resolution
    const routingResult = resolveOptimalRail(requestedRail || 'INTERNAL');
    const executedRail = routingResult.selectedRail;

    // Calculate Fees
    const fee = (transferAmount * (executedRail.feePercentage / 100)) + executedRail.flatFee;
    const totalDeduction = transferAmount + fee;

    // ACID Balance Check (Available = balance - lockedBalance + overdraftLimit)
    const availableBalance = sender.balance - sender.lockedBalance + sender.overdraftLimit;

    if (availableBalance < totalDeduction) {
      releaseLock();
      return res.status(402).json({ 
        error: `Insufficient funds. Available: ${availableBalance.toFixed(2)} ${sender.currency}, Required: ${totalDeduction.toFixed(2)} ${sender.currency} (including ${fee.toFixed(2)} fee)` 
      });
    }

    // ==========================================
    // TRANSACTION LIMITS & CAP COMPLIANCE CHECK
    // ==========================================
    const spendingStats = getWalletSpendingStats(sender.id);
    const proposedDaily = spendingStats.currentDailySpent + transferAmount;
    const proposedMonthly = spendingStats.currentMonthlySpent + transferAmount;

    if (proposedDaily > spendingStats.dailyCap) {
      const alertId = `ALERT-LIMIT-${Date.now().toString().slice(-6)}`;
      anomalyAlerts.unshift({
        id: alertId,
        transactionId: `BLOCKED-${Date.now().toString().slice(-4)}`,
        senderName: sender.ownerName,
        receiverName: receiver.ownerName,
        amount: transferAmount,
        currency: sender.currency,
        severity: 'CRITICAL',
        score: 98,
        reason: `DAILY LIMIT BREACH: Transfer of ৳${transferAmount.toLocaleString()} exceeds Wallet Daily Cap (৳${spendingStats.dailyCap.toLocaleString()}). Spent today: ৳${spendingStats.currentDailySpent.toLocaleString()}.`,
        recommendation: `Transaction blocked by Risk Engine. Increase daily limit for wallet ${sender.id} in Limits Module.`,
        timestamp: new Date().toISOString()
      });

      releaseLock();
      return res.status(422).json({ 
        error: `Transaction Rejected: Exceeds Wallet Daily Limit. Current Spent: ৳${spendingStats.currentDailySpent.toLocaleString()} / Daily Cap: ৳${spendingStats.dailyCap.toLocaleString()} BDT.`,
        limitExceeded: true,
        capType: 'DAILY'
      });
    }

    if (proposedMonthly > spendingStats.monthlyCap) {
      const alertId = `ALERT-LIMIT-${Date.now().toString().slice(-6)}`;
      anomalyAlerts.unshift({
        id: alertId,
        transactionId: `BLOCKED-${Date.now().toString().slice(-4)}`,
        senderName: sender.ownerName,
        receiverName: receiver.ownerName,
        amount: transferAmount,
        currency: sender.currency,
        severity: 'CRITICAL',
        score: 98,
        reason: `MONTHLY LIMIT BREACH: Transfer of ৳${transferAmount.toLocaleString()} exceeds Wallet Monthly Cap (৳${spendingStats.monthlyCap.toLocaleString()}). Spent this month: ৳${spendingStats.currentMonthlySpent.toLocaleString()}.`,
        recommendation: `Transaction blocked by Risk Engine. Increase monthly limit for wallet ${sender.id} in Limits Module.`,
        timestamp: new Date().toISOString()
      });

      releaseLock();
      return res.status(422).json({ 
        error: `Transaction Rejected: Exceeds Wallet Monthly Limit. Current Spent: ৳${spendingStats.currentMonthlySpent.toLocaleString()} / Monthly Cap: ৳${spendingStats.monthlyCap.toLocaleString()} BDT.`,
        limitExceeded: true,
        capType: 'MONTHLY'
      });
    }

    // Warning alert if threshold reached
    if (proposedDaily >= spendingStats.dailyCap * (spendingStats.alertOnThresholdPercent / 100)) {
      anomalyAlerts.unshift({
        id: `ALERT-WARN-${Date.now().toString().slice(-6)}`,
        transactionId: `TXN-WARN`,
        senderName: sender.ownerName,
        receiverName: receiver.ownerName,
        amount: transferAmount,
        currency: sender.currency,
        severity: 'MEDIUM',
        score: 70,
        reason: `CAP WARNING THRESHOLD: ${sender.ownerName} reached ${(proposedDaily / spendingStats.dailyCap * 100).toFixed(1)}% of daily cap (৳${proposedDaily.toLocaleString()} / ৳${spendingStats.dailyCap.toLocaleString()}).`,
        recommendation: `High velocity monitoring active for wallet ${sender.id}.`,
        timestamp: new Date().toISOString()
      });
    }

    // Prepare Transaction Object
    const txId = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`;
    const now = new Date().toISOString();
    const idKey = idempotencyKey || `IDEMP-${txId}`;

    const tx: Transaction = {
      id: txId,
      senderWalletId: sender.id,
      senderName: sender.ownerName,
      receiverWalletId: receiver.id,
      receiverName: receiver.ownerName,
      amount: transferAmount,
      fee: fee,
      currency: sender.currency,
      status: 'SUCCESS',
      requestedRail: requestedRail || 'INTERNAL',
      executedRail: executedRail.id,
      wasRerouted: routingResult.wasRerouted,
      rerouteReason: routingResult.rerouteReason,
      reference: reference || 'Ledger Transfer',
      timestamp: now,
      idempotencyKey: idKey,
      hash: '',
    };

    tx.hash = calculateTxHash(tx);

    // ATOMIC STATE MUTATION (ACID Step 1: Debit Sender)
    sender.balance -= totalDeduction;
    sender.lastUpdated = now;

    // ATOMIC STATE MUTATION (ACID Step 2: Credit Receiver)
    receiver.balance += transferAmount;
    receiver.lastUpdated = now;

    // ATOMIC STATE MUTATION (ACID Step 3: Credit System Fee Reserve)
    if (fee > 0) {
      sysReserve.balance += fee;
      sysReserve.lastUpdated = now;
    }

    // ATOMIC STATE MUTATION (ACID Step 4: Ledger Lines)
    const debitEntry: LedgerEntry = {
      id: `LEDGER-${Date.now()}-1`,
      transactionId: tx.id,
      walletId: sender.id,
      walletOwner: sender.ownerName,
      type: 'DEBIT',
      amount: totalDeduction,
      balanceAfter: sender.balance,
      currency: sender.currency,
      timestamp: now,
      description: `DEBIT for transfer to ${receiver.ownerName}${fee > 0 ? ` (incl. ${fee.toFixed(2)} fee)` : ''}`,
    };

    const creditEntry: LedgerEntry = {
      id: `LEDGER-${Date.now()}-2`,
      transactionId: tx.id,
      walletId: receiver.id,
      walletOwner: receiver.ownerName,
      type: 'CREDIT',
      amount: transferAmount,
      balanceAfter: receiver.balance,
      currency: receiver.currency,
      timestamp: now,
      description: `CREDIT from ${sender.ownerName} via ${executedRail.name}`,
    };

    ledgerEntries.unshift(debitEntry, creditEntry);

    if (fee > 0) {
      ledgerEntries.unshift({
        id: `LEDGER-${Date.now()}-3`,
        transactionId: tx.id,
        walletId: sysReserve.id,
        walletOwner: sysReserve.ownerName,
        type: 'CREDIT',
        amount: fee,
        balanceAfter: sysReserve.balance,
        currency: sysReserve.currency,
        timestamp: now,
        description: `Fee collected from ${tx.id} via ${executedRail.name}`,
      });
    }

    transactions.unshift(tx);
    processedIdempotencyKeys.add(idKey);

    // Create Webhook Event
    const webhookEv: WebhookEvent = {
      id: `WH-${Date.now().toString().slice(-6)}`,
      transactionId: tx.id,
      merchantId: receiver.ownerType === 'merchant' ? receiver.id : sender.id,
      eventType: 'transaction.success',
      payload: { transactionId: tx.id, amount: tx.amount, sender: sender.ownerName, receiver: receiver.ownerName },
      status: 'DELIVERED',
      statusCode: 200,
      timestamp: now,
      signature: crypto.createHmac('sha256', 'payroute_secret_key').update(JSON.stringify(tx)).digest('hex'),
    };
    webhookEvents.unshift(webhookEv);

    // Check for high-velocity / anomaly detection triggers
    if (transferAmount > 100000 || routingResult.wasRerouted) {
      const anomalyScore = transferAmount > 200000 ? 85 : 45;
      anomalyAlerts.unshift({
        id: `ALERT-${Date.now().toString().slice(-6)}`,
        transactionId: tx.id,
        senderName: sender.ownerName,
        receiverName: receiver.ownerName,
        amount: transferAmount,
        currency: sender.currency,
        severity: anomalyScore > 80 ? 'CRITICAL' : routingResult.wasRerouted ? 'MEDIUM' : 'LOW',
        score: anomalyScore,
        reason: routingResult.wasRerouted 
          ? `High value transaction auto-rerouted due to gateway degradation: ${routingResult.rerouteReason}` 
          : `Large volume single transfer exceeding BDT 100,000 baseline.`,
        recommendation: anomalyScore > 80 ? 'Require 2FA AML verification for recipient wallet.' : 'Log to audit compliance ledger.',
        timestamp: now,
      });
    }

    releaseLock();

    return res.json({
      success: true,
      transaction: tx,
      debitEntry,
      creditEntry,
      senderBalance: sender.balance,
      receiverBalance: receiver.balance,
    });
  } catch (err: any) {
    releaseLock();
    return res.status(500).json({ error: `ACID Execution Error: ${err.message}` });
  }
});

// ==========================================
// TRANSACTION LIMITS & CAP MANAGEMENT ENDPOINTS
// ==========================================

// Get all wallet transaction limits and current spending stats
app.get('/api/ledger/limits', (req: Request, res: Response) => {
  const limits = wallets.map(w => getWalletSpendingStats(w.id));
  res.json({ limits });
});

// Update daily and monthly caps for a specific wallet
app.post('/api/ledger/limits/update', (req: Request, res: Response) => {
  const { walletId, dailyCap, monthlyCap, alertOnThresholdPercent } = req.body;

  if (!walletId) {
    return res.status(400).json({ error: 'walletId is required' });
  }

  const existing = walletLimitConfigs.get(walletId) || { dailyCap: 100000, monthlyCap: 500000, alertOnThresholdPercent: 80 };

  walletLimitConfigs.set(walletId, {
    dailyCap: typeof dailyCap === 'number' && dailyCap > 0 ? dailyCap : existing.dailyCap,
    monthlyCap: typeof monthlyCap === 'number' && monthlyCap > 0 ? monthlyCap : existing.monthlyCap,
    alertOnThresholdPercent: typeof alertOnThresholdPercent === 'number' && alertOnThresholdPercent > 0 ? alertOnThresholdPercent : existing.alertOnThresholdPercent
  });

  const updatedLimit = getWalletSpendingStats(walletId);
  res.json({ success: true, limit: updatedLimit });
});

// Process mobile transactions endpoint (alias to transfer engine with limit enforcement)
app.post('/api/transactions/process', async (req: Request, res: Response) => {
  // Normalize params if needed
  if (!req.body.senderWalletId && req.body.walletId) {
    req.body.senderWalletId = req.body.walletId;
  }
  
  // Forward to /api/ledger/transfer route handler
  const transferUrl = '/api/ledger/transfer';
  req.url = transferUrl;
  return app._router.handle(req, res, () => {});
});

// Toggle Gateway Rail Status (for testing Smart Failover)
app.post('/api/routing/update-rail', (req: Request, res: Response) => {
  const { railId, status, latencyMs } = req.body;
  const rail = rails.find((r) => r.id === railId);
  if (!rail) {
    return res.status(404).json({ error: 'Rail not found' });
  }

  if (status) rail.status = status;
  if (typeof latencyMs === 'number') rail.latencyMs = latencyMs;

  res.json({ success: true, rail });
});

// ==========================================
// WEBHOOK DISPATCH & EXPONENTIAL BACKOFF RETRY ENDPOINTS
// ==========================================

// Get all Webhook events
app.get('/api/webhooks', (req: Request, res: Response) => {
  res.json({ webhookEvents });
});

// Manually retry a specific failed webhook event or force attempt
app.post('/api/webhooks/retry', (req: Request, res: Response) => {
  const { webhookId, forceSuccess = false } = req.body;
  if (!webhookId) {
    return res.status(400).json({ error: 'webhookId is required' });
  }

  const evIndex = webhookEvents.findIndex(w => w.id === webhookId);
  if (evIndex === -1) {
    return res.status(404).json({ error: 'Webhook event not found' });
  }

  const ev = webhookEvents[evIndex];
  const currentAttempts = (ev.attemptCount || 1) + 1;
  const maxAttempts = ev.maxAttempts || 5;

  // Calculate exponential backoff delay for current attempt: 2^(attempt-1) * 2 seconds
  const delaySeconds = Math.pow(2, currentAttempts - 1) * 2;
  const nextDelaySeconds = Math.pow(2, currentAttempts) * 2;

  // Simulate delivery outcome: forceSuccess or 80% chance of success on manual trigger
  const isSuccessful = forceSuccess || Math.random() < 0.8 || currentAttempts >= 3;
  const statusCode = isSuccessful ? 200 : (ev.statusCode === 504 ? 500 : 502);
  const now = new Date().toISOString();

  const logEntry = {
    attempt: currentAttempts,
    timestamp: now,
    statusCode,
    status: (isSuccessful ? 'DELIVERED' : 'FAILED') as 'DELIVERED' | 'FAILED',
    responseBody: isSuccessful 
      ? JSON.stringify({ success: true, message: "Webhook acknowledged by merchant endpoint", deliveryTimeMs: 142 })
      : JSON.stringify({ error: "Retry attempt failed", code: statusCode, detail: `Merchant server returned ${statusCode}` }),
    delaySeconds,
    endpointUrl: ev.endpointUrl || 'https://api.merchant.com/v1/webhook'
  };

  const logs = ev.deliveryLogs || [];
  logs.push(logEntry);

  const updatedEv: WebhookEvent = {
    ...ev,
    status: isSuccessful ? 'DELIVERED' : 'FAILED',
    statusCode,
    attemptCount: currentAttempts,
    maxAttempts,
    lastAttemptAt: now,
    nextRetryDelaySeconds: isSuccessful ? 0 : nextDelaySeconds,
    failureReason: isSuccessful 
      ? undefined 
      : `Attempt #${currentAttempts} failed with HTTP ${statusCode}. Next exponential backoff: ${nextDelaySeconds}s`,
    deliveryLogs: logs
  };

  webhookEvents[evIndex] = updatedEv;

  res.json({
    success: true,
    message: isSuccessful 
      ? `Webhook ${webhookId} successfully re-delivered (200 OK)!`
      : `Webhook ${webhookId} retry failed with HTTP ${statusCode}.`,
    webhookEvent: updatedEv
  });
});

// Retry all failed webhooks at once
app.post('/api/webhooks/retry-all-failed', (req: Request, res: Response) => {
  const failedEvents = webhookEvents.filter(w => w.status === 'FAILED');
  let succeededCount = 0;
  let failedCount = 0;

  failedEvents.forEach(ev => {
    const currentAttempts = (ev.attemptCount || 1) + 1;
    const maxAttempts = ev.maxAttempts || 5;
    const delaySeconds = Math.pow(2, currentAttempts - 1) * 2;
    const nextDelaySeconds = Math.pow(2, currentAttempts) * 2;
    const isSuccessful = Math.random() < 0.85 || currentAttempts >= 3;
    const statusCode = isSuccessful ? 200 : 500;
    const now = new Date().toISOString();

    if (isSuccessful) succeededCount++; else failedCount++;

    const logEntry = {
      attempt: currentAttempts,
      timestamp: now,
      statusCode,
      status: (isSuccessful ? 'DELIVERED' : 'FAILED') as 'DELIVERED' | 'FAILED',
      responseBody: isSuccessful 
        ? JSON.stringify({ success: true, message: "Batch retry acknowledged" })
        : JSON.stringify({ error: "Batch retry failed", code: 500 }),
      delaySeconds,
      endpointUrl: ev.endpointUrl || 'https://api.merchant.com/v1/webhook'
    };

    const logs = ev.deliveryLogs || [];
    logs.push(logEntry);

    ev.status = isSuccessful ? 'DELIVERED' : 'FAILED';
    ev.statusCode = statusCode;
    ev.attemptCount = currentAttempts;
    ev.maxAttempts = maxAttempts;
    ev.lastAttemptAt = now;
    ev.nextRetryDelaySeconds = isSuccessful ? 0 : nextDelaySeconds;
    ev.failureReason = isSuccessful ? undefined : `Batch retry #${currentAttempts} failed. Next backoff: ${nextDelaySeconds}s`;
    ev.deliveryLogs = logs;
  });

  res.json({
    success: true,
    totalRetried: failedEvents.length,
    succeededCount,
    failedCount,
    webhookEvents
  });
});

// Simulate generating a new failed webhook event for testing
app.post('/api/webhooks/simulate-failure', (req: Request, res: Response) => {
  const newId = `WH-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const newEv: WebhookEvent = {
    id: newId,
    transactionId: `TXN-SIM-${Math.floor(Math.random() * 89999 + 10000)}`,
    merchantId: 'WAL-MERCH-301',
    eventType: 'transaction.failed',
    payload: {
      event: 'payment.timeout',
      amount: Math.floor(Math.random() * 20000 + 1000),
      currency: 'BDT',
      merchantName: 'Simulated Merchant API',
      simulated: true
    },
    status: 'FAILED',
    statusCode: 500,
    timestamp: now,
    signature: crypto.createHmac('sha256', 'payroute_secret_key').update(newId).digest('hex'),
    endpointUrl: 'https://simulated-merchant.io/v1/webhook',
    attemptCount: 1,
    maxAttempts: 5,
    lastAttemptAt: now,
    nextRetryDelaySeconds: 4, // 2^1 * 2 = 4s
    failureReason: 'HTTP 500 Internal Server Error: Merchant test endpoint unreachable.',
    deliveryLogs: [
      {
        attempt: 1,
        timestamp: now,
        statusCode: 500,
        status: 'FAILED',
        responseBody: '{"error": "Simulated Merchant Endpoint Crash", "code": 500}',
        delaySeconds: 0,
        endpointUrl: 'https://simulated-merchant.io/v1/webhook'
      }
    ]
  };

  webhookEvents.unshift(newEv);
  res.json({ success: true, webhookEvent: newEv });
});

// Run Batch Simulation (Queue Worker Engine)
app.post('/api/queue/batch-simulate', async (req: Request, res: Response) => {
  const { count = 10 } = req.body;
  const numTransfers = Math.min(Math.max(Number(count), 1), 50);

  const senderPool = wallets.filter(w => w.id !== 'WAL-SYS-901');
  const results = [];

  for (let i = 0; i < numTransfers; i++) {
    const s = senderPool[Math.floor(Math.random() * senderPool.length)];
    let r = senderPool[Math.floor(Math.random() * senderPool.length)];
    while (r.id === s.id) {
      r = senderPool[Math.floor(Math.random() * senderPool.length)];
    }

    const randomAmt = Math.floor(Math.random() * 4500 + 500);
    const railsList: PaymentRail['id'][] = ['INTERNAL', 'BKASH', 'NAGAD', 'BRAC_BANK', 'VISA_MASTERCARD'];
    const chosenRail = railsList[Math.floor(Math.random() * railsList.length)];

    // Enqueue task
    const taskId = `TASK-${Date.now()}-${i}`;
    const task: QueueTask = {
      id: taskId,
      transactionId: `TXN-PENDING-${i}`,
      status: 'PROCESSING',
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };
    queueTasks.unshift(task);

    // Perform internal transfer
    try {
      const routingResult = resolveOptimalRail(chosenRail);
      const executedRail = routingResult.selectedRail;
      const fee = (randomAmt * (executedRail.feePercentage / 100)) + executedRail.flatFee;
      
      if (s.balance >= randomAmt + fee) {
        s.balance -= (randomAmt + fee);
        r.balance += randomAmt;

        const txId = `TXN-BATCH-${Date.now().toString().slice(-4)}-${i}`;
        const now = new Date().toISOString();

        const tx: Transaction = {
          id: txId,
          senderWalletId: s.id,
          senderName: s.ownerName,
          receiverWalletId: r.id,
          receiverName: r.ownerName,
          amount: randomAmt,
          fee: fee,
          currency: 'BDT',
          status: 'SUCCESS',
          requestedRail: chosenRail,
          executedRail: executedRail.id,
          wasRerouted: routingResult.wasRerouted,
          rerouteReason: routingResult.rerouteReason,
          reference: `Batch Payroll Run #${i + 1}`,
          timestamp: now,
          idempotencyKey: `IDEMP-BATCH-${txId}`,
          hash: '',
        };

        tx.hash = calculateTxHash(tx);
        transactions.unshift(tx);

        task.status = 'COMPLETED';
        task.processedAt = now;
        task.transactionId = txId;
        results.push(tx);
      } else {
        task.status = 'FAILED';
        task.error = 'Insufficient balance';
      }
    } catch (err: any) {
      task.status = 'FAILED';
      task.error = err.message;
    }
  }

  res.json({
    success: true,
    processedCount: numTransfers,
    completed: results.length,
    tasks: queueTasks.slice(0, numTransfers),
  });
});

// ==========================================
// GEMINI AI AUDIT & ANOMALY ANALYSIS API
// ==========================================
app.post('/api/ai/audit', async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(400).json({ 
      error: 'GEMINI_API_KEY is not configured in environment secrets.' 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const summaryData = {
      walletsCount: wallets.length,
      totalTxCount: transactions.length,
      recentTransactions: transactions.slice(0, 8).map(t => ({
        id: t.id,
        sender: t.senderName,
        receiver: t.receiverName,
        amount: t.amount,
        rail: t.executedRail,
        rerouted: t.wasRerouted,
      })),
      gatewaysStatus: rails.map(r => ({ name: r.name, status: r.status, latency: r.latencyMs })),
    };

    const prompt = `You are PayRoute's Senior Financial Software Engineer & AI Compliance Auditor.
Analyze the following real-time transaction ledger state and payment gateway metrics:
${JSON.stringify(summaryData, null, 2)}

Provide a structured financial audit report in BOTH English and Bengali (বাংলা).
Include:
1. Executive Health Summary (ACID consistency status, total liquidity).
2. Smart Routing Performance & Gateway Health Assessment.
3. Identified Security/Anomaly Risks or recommendations.
4. Bangla translation summary for executive stakeholders.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      auditReport: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Gemini AI error:', err);
    res.status(500).json({ error: `Gemini AI service error: ${err.message}` });
  }
});

// ==========================================
// OPEN BANKING API ENDPOINTS (PSD2 / BB API)
// ==========================================

// Get list of Open Banking Providers / Gateways
app.get('/api/open-banking/providers', (req: Request, res: Response) => {
  res.json({ providers: openBankProviders });
});

// Get user consents
app.get('/api/open-banking/consents', (req: Request, res: Response) => {
  res.json({ consents: openBankConsents });
});

// Create TPP Consent Authorization (AISP/PISP)
app.post('/api/open-banking/consents/create', (req: Request, res: Response) => {
  const { bankId, permissions, expirationDays } = req.body;
  const bank = openBankProviders.find(p => p.id === bankId);
  if (!bank) {
    return res.status(404).json({ error: 'Bank provider not found' });
  }

  const consentId = `cst-ob-${Date.now().toString().slice(-6)}`;
  const fapiConsentRef = `${bank.apiSpec.toLowerCase()}-${crypto.randomBytes(4).toString('hex')}`;
  
  const newConsent: OpenBankingConsent = {
    id: consentId,
    consentId: fapiConsentRef,
    bankId: bank.id,
    bankName: bank.bankName,
    tppName: 'PayRoute Open Banking TPP',
    status: 'AUTHORISED',
    permissions: permissions || ['ReadAccountsDetail', 'ReadBalances', 'CreatePaymentInitiation'],
    expirationDateTime: new Date(Date.now() + (expirationDays || 90) * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    accessKey: `ob_access_token_${crypto.randomBytes(8).toString('hex')}`
  };

  openBankConsents.unshift(newConsent);

  // Auto-mock mock linked external account for this newly authorised bank consent
  const mockExternalAcc: ExternalBankAccount = {
    accountId: `acc-${bank.id.toLowerCase()}-${Date.now().toString().slice(-4)}`,
    bankId: bank.id,
    bankName: bank.bankName,
    accountNumberMasked: `${Math.floor(1000 + Math.random() * 9000)}****${Math.floor(1000 + Math.random() * 9000)}`,
    accountType: 'BUSINESS',
    currency: 'BDT',
    availableBalance: Math.floor(100000 + Math.random() * 2500000),
    consentId: fapiConsentRef,
    lastSyncedAt: new Date().toISOString()
  };

  externalBankAccounts.unshift(mockExternalAcc);

  res.json({
    success: true,
    consent: newConsent,
    linkedAccount: mockExternalAcc
  });
});

// Revoke Consent
app.post('/api/open-banking/consents/revoke', (req: Request, res: Response) => {
  const { consentId } = req.body;
  const consent = openBankConsents.find(c => c.consentId === consentId || c.id === consentId);
  if (!consent) {
    return res.status(404).json({ error: 'Consent not found' });
  }

  consent.status = 'REVOKED';
  res.json({ success: true, consent });
});

// Get External Bank Accounts linked via Open Banking
app.get('/api/open-banking/accounts', (req: Request, res: Response) => {
  // Only accounts linked to AUTHORISED consents
  const activeConsentIds = openBankConsents
    .filter(c => c.status === 'AUTHORISED')
    .map(c => c.consentId);

  const activeAccounts = externalBankAccounts.filter(a => activeConsentIds.includes(a.consentId));
  res.json({ accounts: activeAccounts, totalAccounts: activeAccounts.length });
});

// Sync account balance (simulating real-time Open Banking AIS call)
app.post('/api/open-banking/accounts/sync', (req: Request, res: Response) => {
  const { accountId } = req.body;
  const acc = externalBankAccounts.find(a => a.accountId === accountId);
  if (!acc) {
    return res.status(404).json({ error: 'External account not found' });
  }

  acc.lastSyncedAt = new Date().toISOString();
  res.json({ success: true, account: acc });
});

// Open Banking Payment Initiation Service (PIS) - Direct Bank Transfer into PayRoute Ledger
app.post('/api/open-banking/pis/pay', async (req: Request, res: Response) => {
  const { debtorAccountId, creditorWalletId, amount, currency = 'BDT', idempotencyKey } = req.body;

  if (!debtorAccountId || !creditorWalletId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid Payment Initiation parameters' });
  }

  await acquireLock();

  try {
    const extAcc = externalBankAccounts.find(a => a.accountId === debtorAccountId);
    if (!extAcc) {
      releaseLock();
      return res.status(404).json({ error: 'Debtor external account not found' });
    }

    if (extAcc.availableBalance < amount) {
      releaseLock();
      return res.status(400).json({ error: 'Insufficient funds in external bank account' });
    }

    const creditorWallet = wallets.find(w => w.id === creditorWalletId);
    if (!creditorWallet) {
      releaseLock();
      return res.status(404).json({ error: 'Creditor ledger wallet not found' });
    }

    // Deduct from external bank account & credit PayRoute wallet
    extAcc.availableBalance -= amount;
    creditorWallet.balance += amount;

    const txId = `TXN-PIS-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const fapiFinancialId = `fapi-bb-${crypto.randomBytes(6).toString('hex')}`;
    const idKey = idempotencyKey || `PIS-KEY-${Date.now()}`;

    const newTx: Transaction = {
      id: txId,
      senderWalletId: extAcc.accountNumberMasked,
      senderName: `${extAcc.bankName} (${extAcc.accountNumberMasked})`,
      receiverWalletId: creditorWallet.id,
      receiverName: creditorWallet.ownerName,
      amount: Number(amount),
      fee: 0,
      currency: currency as any,
      status: 'SUCCESS',
      requestedRail: 'BRAC_BANK',
      executedRail: 'BRAC_BANK',
      wasRerouted: false,
      reference: `Open Banking PIS (${fapiFinancialId})`,
      timestamp: now,
      idempotencyKey: idKey,
      hash: ''
    };

    newTx.hash = calculateTxHash(newTx);

    transactions.unshift(newTx);
    processedIdempotencyKeys.add(idKey);

    // Double-entry ledger booking
    const debitEntry: LedgerEntry = {
      id: `LED-${Date.now()}-1`,
      transactionId: txId,
      walletId: `EXT-${extAcc.bankName.replace(/\s+/g, '')}`,
      walletOwner: extAcc.bankName,
      type: 'DEBIT',
      amount: Number(amount),
      balanceAfter: extAcc.availableBalance,
      currency: currency as any,
      timestamp: now,
      description: `Open Banking PIS debit from ${extAcc.bankName} ${extAcc.accountNumberMasked}`
    };

    const creditEntry: LedgerEntry = {
      id: `LED-${Date.now()}-2`,
      transactionId: txId,
      walletId: creditorWallet.id,
      walletOwner: creditorWallet.ownerName,
      type: 'CREDIT',
      amount: Number(amount),
      balanceAfter: creditorWallet.balance,
      currency: currency as any,
      timestamp: now,
      description: `Open Banking PIS deposit from ${extAcc.bankName}`
    };

    ledgerEntries.unshift(debitEntry, creditEntry);

    // Record PIS Payment
    const pisPaymentRecord: OpenBankingPISPayment = {
      paymentId: txId,
      consentId: extAcc.consentId,
      debtorAccountId: extAcc.accountId,
      creditorWalletId: creditorWallet.id,
      creditorName: creditorWallet.ownerName,
      amount: Number(amount),
      currency: currency as any,
      status: 'SETTLED',
      idempotencyKey: newTx.idempotencyKey,
      fapiFinancialId,
      createdAt: now
    };

    pisPayments.unshift(pisPaymentRecord);

    // Dispatch Webhook Event
    const webhookEv: WebhookEvent = {
      id: `WH-${Date.now().toString().slice(-6)}`,
      transactionId: txId,
      merchantId: creditorWallet.id,
      eventType: 'transaction.success',
      payload: {
        paymentType: 'OPEN_BANKING_PIS',
        paymentId: txId,
        bankName: extAcc.bankName,
        debtorAccount: extAcc.accountNumberMasked,
        creditorWallet: creditorWallet.ownerName,
        amount,
        currency,
        fapiFinancialId
      },
      status: 'DELIVERED',
      statusCode: 200,
      timestamp: now,
      signature: crypto.createHmac('sha256', 'payroute_secret_key').update(JSON.stringify(newTx)).digest('hex'),
    };
    webhookEvents.unshift(webhookEv);

    releaseLock();

    res.json({
      success: true,
      transaction: newTx,
      pisPayment: pisPaymentRecord,
      ledgerEntries: [debitEntry, creditEntry],
      debtorUpdatedBalance: extAcc.availableBalance,
      creditorUpdatedBalance: creditorWallet.balance
    });
  } catch (err: any) {
    releaseLock();
    console.error('Open Banking PIS error:', err);
    res.status(500).json({ error: err.message || 'Open Banking Payment Initiation failed' });
  }
});

// ==========================================
// PASSPORT ENDORSEMENT & VIRTUAL CARD APIs
// ==========================================

// Get Passport Endorsement & Bangladesh Bank Quota Status
app.get('/api/passport/endorsement', (req: Request, res: Response) => {
  res.json({
    endorsement: currentPassportEndorsement
  });
});

// Submit/Verify Passport Endorsement with Bangladesh Bank Foreign Exchange API
app.post('/api/passport/endorse', (req: Request, res: Response) => {
  const { passportNumber, holderName, nidNumber, issueDate, expiryDate } = req.body;

  if (!passportNumber || !holderName || !nidNumber) {
    return res.status(400).json({ error: 'Passport Number, Holder Name, and NID Number are required for BB Endorsement' });
  }

  const clearanceHash = `BB-FX-CLEARANCE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  currentPassportEndorsement = {
    id: `PASS-ENDORSE-${Date.now().toString().slice(-6)}`,
    passportNumber: passportNumber.trim().toUpperCase(),
    holderName: holderName.trim().toUpperCase(),
    nidNumber: nidNumber.trim(),
    issueDate: issueDate || '2023-01-01',
    expiryDate: expiryDate || '2033-01-01',
    annualTravelQuotaUSD: 12000,
    usedTravelQuotaUSD: 0,
    remainingQuotaUSD: 12000,
    status: 'VERIFIED_BB_SYNCED',
    verificationHash: clearanceHash,
    verifiedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Passport Endorsement verified and synced with Bangladesh Bank Foreign Exchange Portal',
    endorsement: currentPassportEndorsement
  });
});

// Get Virtual Cards list
app.get('/api/virtual-cards', (req: Request, res: Response) => {
  res.json({
    virtualCards,
    passport: currentPassportEndorsement
  });
});

// Issue a new Virtual Visa/Mastercard linked to Passport Quota & Wallet
app.post('/api/virtual-cards/issue', (req: Request, res: Response) => {
  const { walletId, cardType, currency = 'USD', cardLimitUSD = 1000 } = req.body;

  if (!currentPassportEndorsement || currentPassportEndorsement.status !== 'VERIFIED_BB_SYNCED') {
    return res.status(400).json({ 
      error: 'Active Bangladesh Bank Passport Endorsement is required before issuing multi-currency Virtual Cards' 
    });
  }

  const limitUSD = Number(cardLimitUSD);
  if (limitUSD <= 0) {
    return res.status(400).json({ error: 'Card Limit USD must be greater than $0' });
  }

  if (limitUSD > currentPassportEndorsement.remainingQuotaUSD) {
    return res.status(400).json({ 
      error: `Card limit ($${limitUSD} USD) exceeds your remaining Annual Travel Quota ($${currentPassportEndorsement.remainingQuotaUSD} USD)` 
    });
  }

  const isVisa = cardType === 'VIRTUAL_MASTERCARD' ? false : true;
  const prefix = isVisa ? '4242' : '5520';
  const mid1 = Math.floor(1000 + Math.random() * 9000);
  const mid2 = Math.floor(1000 + Math.random() * 9000);
  const last4 = Math.floor(1000 + Math.random() * 9000);

  const fullCardNumber = `${prefix} ${mid1} ${mid2} ${last4}`;
  const cardNumberMasked = `${prefix} •••• •••• ${last4}`;
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  const now = new Date();
  const expiryYear = (now.getFullYear() + 3).toString().slice(-2);
  const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
  const expiryDate = `${expiryMonth}/${expiryYear}`;

  const newCard: VirtualCard = {
    id: `VCARD-${prefix}-${last4}`,
    walletId: walletId || 'WAL-1001',
    passportNumber: currentPassportEndorsement.passportNumber,
    cardNumberMasked,
    fullCardNumber,
    cardholderName: currentPassportEndorsement.holderName,
    expiryDate,
    cvv,
    cardType: isVisa ? 'VIRTUAL_VISA' : 'VIRTUAL_MASTERCARD',
    status: 'ACTIVE',
    currency: currency as 'USD' | 'BDT',
    cardLimitUSD: limitUSD,
    spentUSD: 0,
    isInternationalEnabled: true,
    createdAt: new Date().toISOString()
  };

  // Update passport quota usage
  currentPassportEndorsement.usedTravelQuotaUSD += limitUSD;
  currentPassportEndorsement.remainingQuotaUSD -= limitUSD;

  virtualCards.unshift(newCard);

  res.json({
    success: true,
    message: 'Virtual Card issued successfully with Bangladesh Bank Passport Travel Quota allocation',
    virtualCard: newCard,
    passport: currentPassportEndorsement
  });
});

// Toggle Virtual Card Status (Active / Frozen)
app.post('/api/virtual-cards/toggle-status', (req: Request, res: Response) => {
  const { cardId } = req.body;
  const card = virtualCards.find(c => c.id === cardId);

  if (!card) {
    return res.status(404).json({ error: 'Virtual Card not found' });
  }

  card.status = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';

  res.json({
    success: true,
    status: card.status,
    virtualCard: card
  });
});

// Reveal Virtual Card Full Credentials with 2FA
app.post('/api/virtual-cards/reveal', (req: Request, res: Response) => {
  const { cardId, otpCode } = req.body;
  const card = virtualCards.find(c => c.id === cardId);

  if (!card) {
    return res.status(404).json({ error: 'Virtual Card not found' });
  }

  if (!otpCode || otpCode.trim().length < 4) {
    return res.status(400).json({ error: '2FA Verification OTP is required to reveal full card credentials' });
  }

  res.json({
    success: true,
    fullCardNumber: card.fullCardNumber,
    cvv: card.cvv,
    expiryDate: card.expiryDate,
    cardholderName: card.cardholderName
  });
});

// Simulate International Online Transaction on Virtual Card
app.post('/api/virtual-cards/charge', (req: Request, res: Response) => {
  const { cardId, merchantName, amountUSD, description } = req.body;
  const card = virtualCards.find(c => c.id === cardId);

  if (!card) {
    return res.status(404).json({ error: 'Virtual Card not found' });
  }

  if (card.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Virtual Card is frozen or inactive. Please unfreeze before charging.' });
  }

  const chargeAmt = Number(amountUSD);
  if (chargeAmt <= 0) {
    return res.status(400).json({ error: 'Charge amount must be greater than $0' });
  }

  if (card.spentUSD + chargeAmt > card.cardLimitUSD) {
    return res.status(400).json({ 
      error: `Transaction declined: Charge ($${chargeAmt} USD) exceeds card allocated limit ($${card.cardLimitUSD - card.spentUSD} USD remaining)` 
    });
  }

  card.spentUSD += chargeAmt;

  // Convert USD to BDT at market FX rate (1 USD = 120 BDT) for internal wallet ledger entry
  const bdtEquivalent = chargeAmt * 120;
  const now = new Date().toISOString();
  const txId = `TX-INTL-${Date.now().toString().slice(-6)}`;

  // Find linked wallet
  const wallet = wallets.find(w => w.id === card.walletId) || wallets[0];
  wallet.balance = Math.max(0, wallet.balance - bdtEquivalent);

  const newTx: Transaction = {
    id: txId,
    senderWalletId: wallet.id,
    senderName: `${wallet.ownerName} (${card.cardType})`,
    receiverWalletId: 'WAL-MERCHANT-01',
    receiverName: merchantName || 'International Online Merchant',
    amount: bdtEquivalent,
    fee: Math.round(bdtEquivalent * 0.015), // 1.5% FX markup fee
    currency: 'BDT',
    status: 'SUCCESS',
    requestedRail: 'VISA_MASTERCARD',
    executedRail: 'VISA_MASTERCARD',
    wasRerouted: false,
    reference: `Intl Card Charge ($${chargeAmt} USD) - ${merchantName}`,
    timestamp: now,
    idempotencyKey: `INTL-KEY-${Date.now()}`,
    hash: ''
  };

  newTx.hash = calculateTxHash(newTx);
  transactions.unshift(newTx);

  // Add ledger entry
  const debitLedger: LedgerEntry = {
    id: `LED-INTL-${Date.now()}-1`,
    transactionId: txId,
    walletId: wallet.id,
    walletOwner: wallet.ownerName,
    type: 'DEBIT',
    amount: bdtEquivalent,
    balanceAfter: wallet.balance,
    currency: 'BDT',
    timestamp: now,
    description: `Virtual Card Payment ($${chargeAmt} USD @ 120 BDT/USD) to ${merchantName}`
  };
  ledgerEntries.unshift(debitLedger);

  res.json({
    success: true,
    message: `Card charged $${chargeAmt} USD successfully (${bdtEquivalent.toLocaleString()} BDT deducted from wallet)`,
    virtualCard: card,
    transaction: newTx,
    updatedWalletBalance: wallet.balance
  });
});

// ==========================================
// GMAIL NOTIFICATION & WORKSPACE INTEGRATION APIs
// ==========================================

// Check Gmail OAuth Authorization Status
app.get('/api/gmail/status', (req: Request, res: Response) => {
  const token = req.headers['x-goog-authenticated-user-token'] as string;
  const refreshToken = req.headers['x-goog-authenticated-user-refresh-token'] as string;
  const hasToken = Boolean(token || refreshToken);

  res.json({
    authorized: hasToken,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    logsCount: gmailNotificationLogs.length,
    recentLogs: gmailNotificationLogs.slice(0, 5)
  });
});

// Send Email via Gmail API (Google Workspace Integration)
app.post('/api/gmail/send', async (req: Request, res: Response) => {
  const { to, subject, body, notificationType = 'TRANSACTION_ALERT' } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Recipient email (to), subject, and body are required' });
  }

  try {
    const auth = getOAuth2Client(req);
    const gmail = google.gmail({ version: 'v1', auth: auth as any });

    // HTML Email Template with PayRoute Financial Security Branding
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #6366f1; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">⚡ PayRoute Financial Engine</h1>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Real-Time Financial Security & Webhook Notification</p>
        </div>
        
        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border-left: 4px solid #6366f1; margin-bottom: 24px;">
          <h2 style="color: #f8fafc; margin-top: 0; font-size: 18px; font-weight: 700;">${subject}</h2>
          <div style="color: #cbd5e1; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${body}</div>
        </div>

        <div style="background-color: #020617; border-radius: 8px; padding: 12px 16px; font-size: 11px; font-family: monospace; color: #64748b; margin-bottom: 20px;">
          <div>DISPATCH TIMESTAMP: ${new Date().toISOString()}</div>
          <div>HMAC-SECURITY-HASH: ${crypto.randomBytes(16).toString('hex')}</div>
          <div>NOTIFICATION TYPE: ${notificationType}</div>
          <div>DISPATCH RAIL: GMAIL_API_V1</div>
        </div>

        <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px;">
          This security alert was generated and dispatched automatically via Google Workspace Gmail API integration.
        </div>
      </div>
    `;

    // Construct raw RFC 2822 email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      htmlBody,
    ];
    const rawMessage = messageParts.join('\n');

    // Base64url encoding
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    const logEntry: GmailNotificationLog = {
      id: `GMAIL-LOG-${Date.now().toString().slice(-6)}`,
      recipientEmail: to,
      subject,
      notificationType: notificationType as any,
      messageId: response.data.id || undefined,
      status: 'SENT',
      sentAt: new Date().toISOString()
    };

    gmailNotificationLogs.unshift(logEntry);

    res.json({
      success: true,
      message: `Gmail notification email sent to ${to} successfully!`,
      messageId: response.data.id,
      logEntry
    });
  } catch (err: any) {
    console.error('Gmail send error:', err);
    const failedLog: GmailNotificationLog = {
      id: `GMAIL-LOG-${Date.now().toString().slice(-6)}`,
      recipientEmail: to,
      subject,
      notificationType: notificationType as any,
      status: 'FAILED',
      sentAt: new Date().toISOString(),
      error: err.message
    };
    gmailNotificationLogs.unshift(failedLog);

    res.status(500).json({ 
      error: err.message || 'Failed to send Gmail email',
      details: 'Ensure user has accepted Gmail authorization scope in UI.'
    });
  }
});

// Get Gmail Notification Logs
app.get('/api/gmail/logs', (req: Request, res: Response) => {
  res.json({ logs: gmailNotificationLogs });
});


// ==========================================
// VITE MIDDLEWARE & SERVE STATIC BUILD
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PayRoute Ledger Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
