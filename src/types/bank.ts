/**
 * Types for bank connection functionality
 */

export interface BankConnection {
  id: string;
  userId: string;
  bankName: string;
  bankId: string;
  accountId: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  currency: string;
  balance: number;
  lastSync: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  createdAt: string;
  updatedAt: string;
}

export interface BankSyncStatus {
  isConnected: boolean;
  lastSync?: string;
  balance?: number;
  currency?: string;
  bankName?: string;
  accountName?: string;
  error?: string;
  isSyncing: boolean;
}

export interface Bank {
  id: string;
  name: string;
  logo: string;
  country: string;
  supported: boolean;
  features: string[];
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface BankConnectionRequest {
  bankId: string;
  accountId: string;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

export interface BankConnectionResponse {
  success: boolean;
  connectionId?: string;
  error?: string;
  message?: string;
}

export interface BankSyncRequest {
  connectionId: string;
  forceSync?: boolean;
}

export interface BankSyncResponse {
  success: boolean;
  lastSync: string;
  balance: number;
  transactions?: number;
  error?: string;
}

// Mock data types
export interface MockBankCredentials {
  username: string;
  password: string;
}

export interface MockBankResponse {
  success: boolean;
  connectionId: string;
  bankName: string;
  accountName: string;
  balance: number;
  currency: string;
  message: string;
}

// Available banks for selection
export const AVAILABLE_BANKS: Bank[] = [
  {
    id: 'commonwealth',
    name: 'Commonwealth Bank',
    logo: '/banks/commonwealth.png',
    country: 'AU',
    supported: true,
    features: ['transactions', 'balance', 'transfers'],
  },
  {
    id: 'revolut',
    name: 'Revolut',
    logo: '/banks/revolut.png',
    country: 'EU',
    supported: true,
    features: ['transactions', 'balance', 'crypto', 'stocks'],
  },
  {
    id: 'ing',
    name: 'ING Bank',
    logo: '/banks/ing.png',
    country: 'EU',
    supported: true,
    features: ['transactions', 'balance', 'investments'],
  },
  {
    id: 'unicredit',
    name: 'UniCredit',
    logo: '/banks/unicredit.png',
    country: 'IT',
    supported: true,
    features: ['transactions', 'balance', 'loans'],
  },
  {
    id: 'intesa',
    name: 'Intesa Sanpaolo',
    logo: '/banks/intesa.png',
    country: 'IT',
    supported: true,
    features: ['transactions', 'balance', 'investments'],
  },
  {
    id: 'bnp',
    name: 'BNP Paribas',
    logo: '/banks/bnp.png',
    country: 'FR',
    supported: true,
    features: ['transactions', 'balance', 'investments'],
  },
  {
    id: 'deutsche',
    name: 'Deutsche Bank',
    logo: '/banks/deutsche.png',
    country: 'DE',
    supported: true,
    features: ['transactions', 'balance', 'investments'],
  },
  {
    id: 'santander',
    name: 'Santander',
    logo: '/banks/santander.png',
    country: 'ES',
    supported: true,
    features: ['transactions', 'balance', 'loans'],
  },
];

// Mock account data for simulation
export const MOCK_ACCOUNTS: Record<string, BankAccount[]> = {
  commonwealth: [
    {
      id: 'cba-checking',
      name: 'Everyday Account',
      type: 'checking',
      balance: 12540.00,
      currency: 'AUD',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'cba-savings',
      name: 'NetBank Saver',
      type: 'savings',
      balance: 25000.00,
      currency: 'AUD',
      lastUpdated: new Date().toISOString(),
    },
  ],
  revolut: [
    {
      id: 'revolut-eur',
      name: 'EUR Account',
      type: 'checking',
      balance: 8500.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'revolut-usd',
      name: 'USD Account',
      type: 'checking',
      balance: 3200.00,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
    },
  ],
  ing: [
    {
      id: 'ing-checking',
      name: 'Orange Account',
      type: 'checking',
      balance: 15200.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
  ],
  unicredit: [
    {
      id: 'unicredit-checking',
      name: 'Conto Corrente',
      type: 'checking',
      balance: 8750.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'unicredit-savings',
      name: 'Conto Risparmio',
      type: 'savings',
      balance: 15000.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
  ],
  intesa: [
    {
      id: 'intesa-checking',
      name: 'Conto Corrente',
      type: 'checking',
      balance: 12300.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
  ],
  bnp: [
    {
      id: 'bnp-checking',
      name: 'Compte Courant',
      type: 'checking',
      balance: 9800.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
  ],
  deutsche: [
    {
      id: 'deutsche-checking',
      name: 'Girokonto',
      type: 'checking',
      balance: 11200.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
  ],
  santander: [
    {
      id: 'santander-checking',
      name: 'Cuenta Corriente',
      type: 'checking',
      balance: 7600.00,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
    },
  ],
};