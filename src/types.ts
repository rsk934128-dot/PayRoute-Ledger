export type Currency = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AED' | 'SAR' | 'JPY';

export type WalletType = 'user' | 'business' | 'merchant' | 'system';

export interface Wallet {
  id: string;
  accountNo: string;
  ownerName: string;
  ownerType: WalletType;
  currency: Currency; // Primary display currency
  baseCurrency?: Currency; // Portfolio base currency
  supportedCurrencies?: Currency[]; // List of currencies held by wallet
  balances?: Record<string, number>; // Sub-balances per currency e.g. { BDT: 145250, USD: 1250, EUR: 850 }
  balance: number; // Primary currency balance
  lockedBalance: number;
  overdraftLimit: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'FROZEN';
  lastUpdated: string;
}

export interface ExchangeRateData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isLive: boolean;
}

export type LedgerType = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  walletId: string;
  walletOwner: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  currency: Currency;
  timestamp: string;
  description: string;
}

export type TransactionStatus = 
  | 'PENDING' 
  | 'QUEUED' 
  | 'PROCESSING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'ROLLED_BACK';

export type PaymentRailType = 
  | 'INTERNAL' 
  | 'BKASH' 
  | 'NAGAD' 
  | 'BRAC_BANK' 
  | 'VISA_MASTERCARD' 
  | 'STRIPE';

export interface Transaction {
  id: string;
  senderWalletId: string;
  senderName: string;
  receiverWalletId: string;
  receiverName: string;
  amount: number;
  fee: number;
  currency: Currency;
  status: TransactionStatus;
  requestedRail: PaymentRailType;
  executedRail: PaymentRailType;
  wasRerouted: boolean;
  rerouteReason?: string;
  reference: string;
  timestamp: string;
  idempotencyKey: string;
  hash: string;
  failureReason?: string;
}

export interface PaymentRail {
  id: PaymentRailType;
  name: string;
  type: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  successRate: number; // 0-100%
  latencyMs: number;
  feePercentage: number;
  flatFee: number;
  isBackupAvailable: boolean;
  backupRail?: PaymentRailType;
}

export interface QueueTask {
  id: string;
  transactionId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export interface WebhookDeliveryLog {
  attempt: number;
  timestamp: string;
  statusCode: number;
  status: 'DELIVERED' | 'FAILED';
  responseBody: string;
  delaySeconds: number;
  endpointUrl: string;
}

export interface WebhookEvent {
  id: string;
  transactionId: string;
  merchantId: string;
  eventType: 'transaction.success' | 'transaction.failed' | 'ledger.created' | 'failover.triggered';
  payload: any;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  statusCode?: number;
  timestamp: string;
  signature: string;
  endpointUrl?: string;
  attemptCount?: number;
  maxAttempts?: number;
  lastAttemptAt?: string;
  nextRetryDelaySeconds?: number;
  failureReason?: string;
  deliveryLogs?: WebhookDeliveryLog[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  iconLink?: string;
  createdTime: string;
  size?: string;
  mimeType: string;
}

export interface AnomalyAlert {
  id: string;
  transactionId: string;
  senderName: string;
  receiverName: string;
  amount: number;
  currency: Currency;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0-100
  reason: string;
  recommendation: string;
  timestamp: string;
}

export interface AuditReportExportRequest {
  startDate: string;
  endDate: string;
  format: 'PDF' | 'CSV' | 'JSON';
  includeAnomalies: boolean;
}

export interface OpenBankProvider {
  id: string;
  bankName: string;
  swiftCode: string;
  apiSpec: 'UK_OPEN_BANKING_V3.1' | 'PSD2_BERLIN_GROUP' | 'BANGLADESH_BANK_OPEN_API';
  status: 'ONLINE' | 'MAINTENANCE' | 'DEGRADED';
  supportedScopes: ('ReadAccounts' | 'ReadBalances' | 'ReadTransactions' | 'InitiateSinglePayment' | 'InitiateRecurringPayment')[];
  logoUrl?: string;
  sandboxUrl: string;
}

export interface OpenBankingConsent {
  id: string;
  consentId: string;
  bankId: string;
  bankName: string;
  tppName: string; // Third-Party Provider Name e.g. "PayRoute TPP"
  status: 'AWAITING_AUTHORISATION' | 'AUTHORISED' | 'REVOKED' | 'EXPIRED';
  permissions: string[];
  expirationDateTime: string;
  createdAt: string;
  accessKey: string;
}

export interface ExternalBankAccount {
  accountId: string;
  bankId: string;
  bankName: string;
  accountNumberMasked: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'BUSINESS';
  currency: Currency;
  availableBalance: number;
  consentId: string;
  lastSyncedAt: string;
}

export interface OpenBankingPISPayment {
  paymentId: string;
  consentId: string;
  debtorAccountId: string;
  creditorWalletId: string;
  creditorName: string;
  amount: number;
  currency: Currency;
  status: 'ACCEPTED_SETTLEMENT_IN_PROCESS' | 'SETTLED' | 'REJECTED';
  idempotencyKey: string;
  fapiFinancialId: string;
  createdAt: string;
}

export interface WalletLimit {
  walletId: string;
  ownerName: string;
  dailyCap: number;
  monthlyCap: number;
  currentDailySpent: number;
  currentMonthlySpent: number;
  alertOnThresholdPercent: number;
  status: 'NORMAL' | 'WARNING' | 'LIMIT_EXCEEDED';
  lastUpdated: string;
}

export interface PassportEndorsement {
  id: string;
  passportNumber: string;
  holderName: string;
  nidNumber: string;
  issueDate: string;
  expiryDate: string;
  annualTravelQuotaUSD: number;
  usedTravelQuotaUSD: number;
  remainingQuotaUSD: number;
  status: 'VERIFIED_BB_SYNCED' | 'PENDING_VERIFICATION' | 'REJECTED' | 'EXPIRED';
  verificationHash: string;
  verifiedAt: string;
}

export interface VirtualCard {
  id: string;
  walletId: string;
  passportNumber: string;
  cardNumberMasked: string;
  fullCardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  cardType: 'VIRTUAL_VISA' | 'VIRTUAL_MASTERCARD';
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  currency: 'USD' | 'BDT';
  cardLimitUSD: number;
  spentUSD: number;
  isInternationalEnabled: boolean;
  createdAt: string;
}

export interface GmailNotificationLog {
  id: string;
  recipientEmail: string;
  subject: string;
  notificationType: 'TRANSACTION_ALERT' | 'WEBHOOK_FAILURE' | 'SYSTEM_AUDIT' | 'CUSTOM';
  messageId?: string;
  status: 'SENT' | 'FAILED';
  sentAt: string;
  error?: string;
}

export interface ElectricityBillPayment {
  id: string;
  userId?: string;
  userEmail?: string;
  biller: 'NESCO_Prepaid' | 'DESCO_Prepaid' | 'DPDC_Prepaid' | 'BREB_PalliBidyut' | 'WZPDCL_Prepaid';
  billerNameBn: string;
  meterId: string;
  billNo: string;
  amountBDT: number;
  paymentRail: PaymentRail;
  txnId: string;
  token?: string;
  paidAt: string;
  status: 'PAID' | 'PROCESSING' | 'FAILED';
  smsReceipt: string;
}

