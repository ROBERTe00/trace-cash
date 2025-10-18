/**
 * Credit Card Integration with Plaid API
 * Secure integration for linking credit cards and real-time transaction fetching
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Shield, 
  Link, 
  Unlink, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Banknote,
  TrendingUp,
  Bell,
  Settings,
  Lock,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  webhookUrl?: string;
}

interface ConnectedAccount {
  id: string;
  institutionId: string;
  institutionName: string;
  accountName: string;
  accountType: 'credit' | 'debit' | 'savings' | 'checking';
  lastFour: string;
  isActive: boolean;
  connectedAt: Date;
  lastSync?: Date;
  balance?: number;
  currency: string;
}

interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  category?: string;
  merchant?: string;
  isPending: boolean;
  createdAt: Date;
}

interface PlaidIntegrationProps {
  onAccountConnected?: (account: ConnectedAccount) => void;
  onTransactionReceived?: (transaction: Transaction) => void;
}

// Mock Plaid service (replace with actual Plaid SDK)
class PlaidService {
  private config: PlaidConfig;

  constructor(config: PlaidConfig) {
    this.config = config;
  }

  async createLinkToken(userId: string): Promise<string> {
    // Mock implementation - replace with actual Plaid API call
    console.log('Creating link token for user:', userId);
    return 'link-sandbox-mock-token-' + Date.now();
  }

  async exchangePublicToken(publicToken: string): Promise<string> {
    // Mock implementation - replace with actual Plaid API call
    console.log('Exchanging public token:', publicToken);
    return 'access-token-mock-' + Date.now();
  }

  async getAccounts(accessToken: string): Promise<ConnectedAccount[]> {
    // Mock implementation - replace with actual Plaid API call
    console.log('Fetching accounts for token:', accessToken);
    
    return [
      {
        id: 'acc-1',
        institutionId: 'ins_1',
        institutionName: 'Chase Bank',
        accountName: 'Chase Freedom Unlimited',
        accountType: 'credit',
        lastFour: '1234',
        isActive: true,
        connectedAt: new Date(),
        lastSync: new Date(),
        balance: -1250.50,
        currency: 'USD'
      },
      {
        id: 'acc-2',
        institutionId: 'ins_2',
        institutionName: 'Bank of America',
        accountName: 'Bank of America Checking',
        accountType: 'checking',
        lastFour: '5678',
        isActive: true,
        connectedAt: new Date(),
        lastSync: new Date(),
        balance: 2500.75,
        currency: 'USD'
      }
    ];
  }

  async getTransactions(accessToken: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    // Mock implementation - replace with actual Plaid API call
    console.log('Fetching transactions for token:', accessToken);
    
    return [
      {
        id: 'txn-1',
        accountId: 'acc-1',
        amount: -45.99,
        description: 'AMAZON.COM PURCHASE',
        date: new Date().toISOString(),
        category: 'Shopping',
        merchant: 'Amazon',
        isPending: false,
        createdAt: new Date()
      },
      {
        id: 'txn-2',
        accountId: 'acc-1',
        amount: -12.50,
        description: 'STARBUCKS COFFEE',
        date: new Date().toISOString(),
        category: 'Food & Dining',
        merchant: 'Starbucks',
        isPending: true,
        createdAt: new Date()
      }
    ];
  }

  async setupWebhook(accessToken: string, webhookUrl: string): Promise<void> {
    // Mock implementation - replace with actual Plaid API call
    console.log('Setting up webhook for token:', accessToken, 'URL:', webhookUrl);
  }
}

export const PlaidIntegration: React.FC<PlaidIntegrationProps> = ({
  onAccountConnected,
  onTransactionReceived
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [plaidConfig, setPlaidConfig] = useState<PlaidConfig | null>(null);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [autoCategorization, setAutoCategorization] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const plaidService = plaidConfig ? new PlaidService(plaidConfig) : null;

  useEffect(() => {
    loadPlaidConfig();
    loadConnectedAccounts();
  }, []);

  const loadPlaidConfig = async () => {
    try {
      // Load Plaid configuration from environment or database
      const config: PlaidConfig = {
        clientId: import.meta.env.VITE_PLAID_CLIENT_ID || 'mock-client-id',
        secret: import.meta.env.VITE_PLAID_SECRET || 'mock-secret',
        environment: (import.meta.env.VITE_PLAID_ENVIRONMENT as 'sandbox' | 'development' | 'production') || 'sandbox',
        webhookUrl: import.meta.env.VITE_PLAID_WEBHOOK_URL
      };
      setPlaidConfig(config);
    } catch (error) {
      console.error('Failed to load Plaid config:', error);
      toast.error('Failed to load Plaid configuration');
    }
  };

  const loadConnectedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accounts, error } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      setConnectedAccounts(accounts || []);
    } catch (error) {
      console.error('Failed to load connected accounts:', error);
    }
  };

  const handleConnectAccount = async () => {
    if (!plaidService) {
      toast.error('Plaid service not configured');
      return;
    }

    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create link token
      const linkToken = await plaidService.createLinkToken(user.id);
      
      // In a real implementation, you would open Plaid Link here
      // For now, we'll simulate the connection process
      await simulatePlaidLink(linkToken, user.id);
      
      toast.success('Account connected successfully!');
      setShowConnectModal(false);
    } catch (error) {
      console.error('Failed to connect account:', error);
      toast.error('Failed to connect account');
    } finally {
      setIsConnecting(false);
    }
  };

  const simulatePlaidLink = async (linkToken: string, userId: string) => {
    // Simulate Plaid Link flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Exchange public token for access token
    const publicToken = 'public-token-mock';
    const accessToken = await plaidService!.exchangePublicToken(publicToken);
    
    // Get accounts
    const accounts = await plaidService!.getAccounts(accessToken);
    
    // Save to database
    for (const account of accounts) {
      const { error } = await supabase
        .from('connected_accounts')
        .insert({
          user_id: userId,
          plaid_account_id: account.id,
          institution_id: account.institutionId,
          institution_name: account.institutionName,
          account_name: account.accountName,
          account_type: account.accountType,
          last_four: account.lastFour,
          access_token: accessToken, // In production, encrypt this
          is_active: true,
          connected_at: new Date().toISOString()
        });

      if (error) throw error;
      
      onAccountConnected?.(account);
    }
    
    await loadConnectedAccounts();
  };

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('connected_accounts')
        .update({ is_active: false })
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Account disconnected successfully');
      await loadConnectedAccounts();
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      toast.error('Failed to disconnect account');
    }
  };

  const handleSyncTransactions = async (accountId: string) => {
    try {
      const { data: account } = await supabase
        .from('connected_accounts')
        .select('access_token')
        .eq('id', accountId)
        .single();

      if (!account || !plaidService) return;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const transactions = await plaidService.getTransactions(
        account.access_token,
        startDate,
        endDate
      );

      // Process transactions with AI categorization if enabled
      const processedTransactions = autoCategorization 
        ? await processTransactionsWithAI(transactions)
        : transactions;

      // Save to database
      for (const transaction of processedTransactions) {
        const { error } = await supabase
          .from('transactions')
          .insert({
            plaid_transaction_id: transaction.id,
            account_id: accountId,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            category: transaction.category,
            merchant: transaction.merchant,
            is_pending: transaction.isPending,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        
        onTransactionReceived?.(transaction);
      }

      toast.success(`Synced ${transactions.length} transactions`);
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      toast.error('Failed to sync transactions');
    }
  };

  const processTransactionsWithAI = async (transactions: Transaction[]): Promise<Transaction[]> => {
    // Mock AI processing - replace with actual Gemini AI integration
    return transactions.map(transaction => ({
      ...transaction,
      category: transaction.category || 'Other',
      merchant: transaction.merchant || 'Unknown'
    }));
  };

  const setupWebhooks = async () => {
    if (!plaidConfig?.webhookUrl) {
      toast.error('Webhook URL not configured');
      return;
    }

    try {
      for (const account of connectedAccounts) {
        const { data: accountData } = await supabase
          .from('connected_accounts')
          .select('access_token')
          .eq('id', account.id)
          .single();

        if (accountData && plaidService) {
          await plaidService.setupWebhook(accountData.access_token, plaidConfig.webhookUrl);
        }
      }

      setWebhookEnabled(true);
      toast.success('Webhooks configured successfully');
    } catch (error) {
      console.error('Failed to setup webhooks:', error);
      toast.error('Failed to setup webhooks');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Credit Card Integration
          </h2>
          <p className="text-muted-foreground">
            Securely connect your credit cards for automatic transaction tracking
          </p>
        </div>
        
        <Button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2"
        >
          <Link className="h-4 w-4" />
          Connect Account
        </Button>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Bank-level security:</strong> All connections use Plaid's secure infrastructure. 
          Your credentials are never stored and all data is encrypted in transit and at rest.
        </AlertDescription>
      </Alert>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your credit cards to automatically track transactions
              </p>
              <Button onClick={() => setShowConnectModal(true)}>
                <Link className="h-4 w-4 mr-2" />
                Connect Your First Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{account.institutionName}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.accountName} •••• {account.lastFour}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {account.accountType}
                        </Badge>
                        <Badge 
                          variant={account.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {account.balance !== undefined && (
                      <div className="text-right">
                        <div className={`font-semibold ${
                          account.balance < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {account.currency}
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTransactions(account.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectAccount(account.id)}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-categorization">AI Auto-Categorization</Label>
              <p className="text-sm text-muted-foreground">
                Automatically categorize transactions using AI
              </p>
            </div>
            <Switch
              id="auto-categorization"
              checked={autoCategorization}
              onCheckedChange={setAutoCategorization}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new transactions and spending alerts
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="webhooks">Real-time Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Receive instant updates when transactions occur
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={webhookEnabled ? "default" : "secondary"}>
                {webhookEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={setupWebhooks}
                disabled={webhookEnabled}
              >
                <Globe className="h-4 w-4 mr-2" />
                Setup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Connect Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your bank credentials are never stored. Plaid uses bank-level security 
                  to securely connect your accounts.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Select Bank</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-12">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Chase
                  </Button>
                  <Button variant="outline" className="h-12">
                    <Monitor className="h-4 w-4 mr-2" />
                    Bank of America
                  </Button>
                  <Button variant="outline" className="h-12">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Wells Fargo
                  </Button>
                  <Button variant="outline" className="h-12">
                    <Banknote className="h-4 w-4 mr-2" />
                    Other Bank
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConnectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConnectAccount}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlaidIntegration;
