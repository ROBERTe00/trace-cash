/**
 * Plaid Link React Component
 * Integrates credit card connection with react-plaid-link
 */

import { useState, useCallback, useEffect } from "react";
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from "react-plaid-link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createLinkToken,
  exchangePublicToken,
  getConnectedAccounts,
  syncTransactions,
  removeConnection,
  type PlaidAccount,
} from "@/lib/plaidService";
import { Badge } from "@/components/ui/badge";

export const PlaidLinkComponent = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<PlaidAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load connected accounts on mount
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const accounts = await getConnectedAccounts();
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error("Failed to load connected accounts:", error);
    }
  };

  // Create link token when component mounts or user clicks connect
  const initializePlaidLink = async () => {
    setIsLoading(true);
    try {
      const tokenData = await createLinkToken();
      setLinkToken(tokenData.link_token);
    } catch (error) {
      toast.error("Failed to initialize Plaid connection");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful connection
  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      setIsLoading(true);
      try {
        console.log("✅ [Plaid] Connection successful:", metadata.institution?.name);

        // Exchange public token for access token
        const result = await exchangePublicToken(publicToken);

        toast.success(`Connected ${metadata.institution?.name || "account"} successfully!`, {
          description: `${result.accounts.length} account(s) connected`,
        });

        // Reload connected accounts
        await loadConnectedAccounts();

        // Reset link token
        setLinkToken(null);
      } catch (error) {
        toast.error("Failed to complete connection");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Handle connection exit (user closes modal)
  const onExit = useCallback((error: any, metadata: any) => {
    if (error) {
      console.error("❌ [Plaid] Connection error:", error);
      toast.error("Connection failed. Please try again.");
    } else {
      console.log("ℹ️ [Plaid] User exited:", metadata);
    }
    setLinkToken(null);
  }, []);

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  // Open Plaid Link modal when token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  // Handle sync transactions
  const handleSyncTransactions = async (itemId: string, accountName: string) => {
    setIsSyncing(true);
    try {
      const transactions = await syncTransactions(itemId);
      toast.success(`Synced ${transactions.length} transactions from ${accountName}`);
      await loadConnectedAccounts();
    } catch (error) {
      toast.error("Failed to sync transactions");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle remove connection
  const handleRemoveConnection = async (itemId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${accountName}?`)) {
      return;
    }

    try {
      await removeConnection(itemId);
      toast.success(`Disconnected ${accountName}`);
      await loadConnectedAccounts();
    } catch (error) {
      toast.error("Failed to remove connection");
      console.error(error);
    }
  };

  return (
    <Card className="glass-card border-2 hover-lift p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-xl font-bold">Connected Cards</h3>
              <p className="text-sm text-muted-foreground">
                Connect your credit/debit cards for automatic transaction tracking
              </p>
            </div>
          </div>

          <Button
            onClick={initializePlaidLink}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Connect Card
          </Button>
        </div>

        {/* Connected Accounts List */}
        {connectedAccounts.length > 0 ? (
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <Card key={account.account_id} className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.name}</p>
                        {account.mask && (
                          <Badge variant="outline" className="text-xs">
                            ••••{account.mask}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.official_name || account.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4">
                      <p className="font-semibold">
                        ${account.balance_current?.toFixed(2) || "0.00"}
                      </p>
                      {account.balance_available && (
                        <p className="text-xs text-muted-foreground">
                          Available: ${account.balance_available.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTransactions(account.account_id, account.name)}
                      disabled={isSyncing}
                      className="gap-2"
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Sync
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveConnection(account.account_id, account.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No cards connected yet</p>
            <p className="text-sm">Click "Connect Card" to get started</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-primary/5 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Secure Connection via Plaid</p>
              <ul className="text-muted-foreground space-y-1 mt-1">
                <li>✓ Bank-level encryption (256-bit SSL)</li>
                <li>✓ Read-only access to transactions</li>
                <li>✓ Credentials never stored on our servers</li>
                <li>✓ Trusted by 10,000+ financial apps</li>
                <li>✓ Automatic transaction categorization</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Supported Banks Notice */}
        <div className="text-xs text-muted-foreground text-center">
          <p>
            Supports 11,000+ banks and financial institutions worldwide including Chase, Bank of
            America, Wells Fargo, Capital One, and more.
          </p>
        </div>
      </div>
    </Card>
  );
};

