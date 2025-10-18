/**
 * Mock API for bank connection simulation
 * This simulates real bank API behavior and can be easily replaced with actual integrations
 */

import { 
  BankConnectionRequest, 
  BankConnectionResponse, 
  BankSyncRequest, 
  BankSyncResponse,
  MockBankCredentials,
  MockBankResponse,
  AVAILABLE_BANKS,
  MOCK_ACCOUNTS,
  BankConnection,
  BankSyncStatus
} from '@/types/bank';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock authentication endpoint
export const mockBankAuth = async (
  bankId: string, 
  credentials: MockBankCredentials
): Promise<MockBankResponse> => {
  // Simulate network delay
  await delay(1500 + Math.random() * 1000);
  
  // Simulate authentication failure (10% chance)
  if (Math.random() < 0.1) {
    return {
      success: false,
      connectionId: '',
      bankName: '',
      accountName: '',
      balance: 0,
      currency: 'EUR',
      message: 'Invalid credentials. Please check your username and password.',
    };
  }
  
  const bank = AVAILABLE_BANKS.find(b => b.id === bankId);
  if (!bank) {
    throw new Error('Bank not found');
  }
  
  const accounts = MOCK_ACCOUNTS[bankId];
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts available for this bank');
  }
  
  // Select primary account (first checking account or first account)
  const primaryAccount = accounts.find(acc => acc.type === 'checking') || accounts[0];
  
  return {
    success: true,
    connectionId: `${bankId}-${Date.now()}`,
    bankName: bank.name,
    accountName: primaryAccount.name,
    balance: primaryAccount.balance,
    currency: primaryAccount.currency,
    message: 'Bank account connected successfully!',
  };
};

// Mock connection endpoint
export const mockConnectBank = async (
  request: BankConnectionRequest
): Promise<BankConnectionResponse> => {
  await delay(2000 + Math.random() * 1000);
  
  try {
    const authResponse = await mockBankAuth(request.bankId, {
      username: 'demo_user',
      password: 'demo_password',
    });
    
    if (!authResponse.success) {
      return {
        success: false,
        error: authResponse.message,
      };
    }
    
    return {
      success: true,
      connectionId: authResponse.connectionId,
      message: authResponse.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
};

// Mock sync endpoint
export const mockSyncBank = async (
  request: BankSyncRequest
): Promise<BankSyncResponse> => {
  await delay(1000 + Math.random() * 500);
  
  // Simulate sync failure (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      lastSync: new Date().toISOString(),
      balance: 0,
      transactions: 0,
      error: 'Sync failed. Please try again.',
    };
  }
  
  // Extract bank ID from connection ID
  const bankId = request.connectionId.split('-')[0];
  const accounts = MOCK_ACCOUNTS[bankId];
  
  if (!accounts) {
    return {
      success: false,
      lastSync: new Date().toISOString(),
      balance: 0,
      transactions: 0,
      error: 'Bank not found',
    };
  }
  
  const primaryAccount = accounts.find(acc => acc.type === 'checking') || accounts[0];
  
  // Simulate slight balance variation
  const variation = (Math.random() - 0.5) * 100; // ±50 currency units
  const newBalance = Math.max(0, primaryAccount.balance + variation);
  
  return {
    success: true,
    lastSync: new Date().toISOString(),
    balance: newBalance,
    transactions: Math.floor(Math.random() * 10) + 1, // 1-10 new transactions
  };
};

// Mock disconnect endpoint
export const mockDisconnectBank = async (
  connectionId: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  await delay(500);
  
  // Simulate disconnect failure (2% chance)
  if (Math.random() < 0.02) {
    return {
      success: false,
      error: 'Failed to disconnect. Please try again.',
    };
  }
  
  return {
    success: true,
    message: 'Bank account disconnected successfully.',
  };
};

// Mock get connection status
export const mockGetConnectionStatus = async (
  connectionId: string
): Promise<BankSyncStatus> => {
  await delay(300);
  
  const bankId = connectionId.split('-')[0];
  const accounts = MOCK_ACCOUNTS[bankId];
  
  if (!accounts) {
    return {
      isConnected: false,
      isSyncing: false,
      error: 'Connection not found',
    };
  }
  
  const primaryAccount = accounts.find(acc => acc.type === 'checking') || accounts[0];
  const bank = AVAILABLE_BANKS.find(b => b.id === bankId);
  
  return {
    isConnected: true,
    lastSync: primaryAccount.lastUpdated,
    balance: primaryAccount.balance,
    currency: primaryAccount.currency,
    bankName: bank?.name || 'Unknown Bank',
    accountName: primaryAccount.name,
    isSyncing: false,
  };
};

// Mock get all connections
export const mockGetAllConnections = async (): Promise<BankConnection[]> => {
  await delay(200);
  
  // Return empty array for now - connections will be managed in localStorage
  return [];
};

// Utility function to format currency
export const formatBankBalance = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

// Utility function to format last sync date
export const formatLastSync = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Export all mock functions
export const mockBankAPI = {
  connect: mockConnectBank,
  sync: mockSyncBank,
  disconnect: mockDisconnectBank,
  getStatus: mockGetConnectionStatus,
  getAllConnections: mockGetAllConnections,
  auth: mockBankAuth,
  formatBalance: formatBankBalance,
  formatLastSync: formatLastSync,
};
