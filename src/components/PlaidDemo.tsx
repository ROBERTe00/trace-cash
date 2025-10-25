/**
 * Plaid Integration Demo Component
 * Shows how Plaid integration would work (mock version for testing without credentials)
 * Real implementation ready in PlaidLinkComponent.tsx (requires PLAID_CLIENT_ID)
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MockAccount {
  id: string;
  name: string;
  bank: string;
  mask: string;
  balance: number;
  status: 'active' | 'syncing';
}

export const PlaidDemo = () => {
  const [mockAccounts, setMockAccounts] = useState<MockAccount[]>([
    {
      id: '1',
      name: 'Chase Freedom',
      bank: 'Chase',
      mask: '1234',
      balance: 2450.00,
      status: 'active'
    }
  ]);

  const handleMockConnect = () => {
    toast.info("Demo Mode: Plaid connection simulated", {
      description: "Configure PLAID_CLIENT_ID in Supabase to enable real connections",
      duration: 5000
    });

    // Simulate adding a new account
    const newAccount: MockAccount = {
      id: Date.now().toString(),
      name: 'Bank of America Checking',
      bank: 'Bank of America',
      mask: '5678',
      balance: 1850.50,
      status: 'active'
    };

    setMockAccounts([...mockAccounts, newAccount]);
    toast.success("Mock account connected!");
  };

  const handleMockSync = (accountId: string) => {
    setMockAccounts(accounts => 
      accounts.map(acc => 
        acc.id === accountId ? { ...acc, status: 'syncing' as const } : acc
      )
    );

    toast.info("Syncing transactions...");

    setTimeout(() => {
      setMockAccounts(accounts => 
        accounts.map(acc => 
          acc.id === accountId ? { ...acc, status: 'active' as const } : acc
        )
      );
      toast.success("15 transactions synced successfully!");
    }, 2000);
  };

  const handleMockDisconnect = (accountId: string) => {
    if (!confirm('Disconnect this account?')) return;

    setMockAccounts(accounts => accounts.filter(acc => acc.id !== accountId));
    toast.success("Account disconnected");
  };

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> This is a demonstration of Plaid integration. 
          To enable real bank connections, configure <code className="px-1 py-0.5 bg-muted rounded">PLAID_CLIENT_ID</code> and <code className="px-1 py-0.5 bg-muted rounded">PLAID_SECRET</code> in Supabase project settings.
        </AlertDescription>
      </Alert>

      <Card className="p-6 glass-card border-2">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-xl font-bold">Connected Cards (Demo)</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic transaction tracking
                </p>
              </div>
            </div>

            <Button onClick={handleMockConnect} className="gap-2">
              <Plus className="h-4 w-4" />
              Connect Card
            </Button>
          </div>

          {/* Mock Accounts List */}
          {mockAccounts.length > 0 ? (
            <div className="space-y-3">
              {mockAccounts.map((account) => (
                <Card key={account.id} className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.name}</p>
                          <Badge variant="outline" className="text-xs">
                            ••••{account.mask}
                          </Badge>
                          {account.status === 'syncing' && (
                            <Badge className="text-xs bg-primary">
                              Syncing...
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{account.bank}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="font-semibold">
                          ${account.balance.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMockSync(account.id)}
                        disabled={account.status === 'syncing'}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${account.status === 'syncing' ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMockDisconnect(account.id)}
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
              <p>No cards connected</p>
              <p className="text-sm">Click "Connect Card" to get started</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Real Plaid Integration Ready</p>
                <ul className="text-muted-foreground space-y-1 mt-1">
                  <li>✓ Full implementation in <code className="text-xs">PlaidLinkComponent.tsx</code></li>
                  <li>✓ Edge Functions created and ready</li>
                  <li>✓ Database schema migrated</li>
                  <li>✓ Supports 11,000+ banks worldwide</li>
                  <li>⏳ Needs PLAID_CLIENT_ID to activate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

