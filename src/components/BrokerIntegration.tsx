import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function BrokerIntegration() {
  const [broker, setBroker] = useState('alpaca');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleSync = async () => {
    if (!apiKey || !apiSecret) {
      toast.error('Please enter your API credentials');
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-broker-data', {
        body: {
          broker,
          apiKey,
          apiSecret,
        },
      });

      if (error) throw error;

      toast.success(`Successfully synced ${data.count} positions from ${broker}`, {
        description: 'Your portfolio has been updated',
      });

      // Clear sensitive data
      setApiKey('');
      setApiSecret('');
      setShowDialog(false);
    } catch (error: any) {
      console.error('Broker sync error:', error);
      toast.error('Failed to sync broker data', {
        description: error.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Broker Integration
          </CardTitle>
          <CardDescription>
            Import your portfolio automatically from your broker
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broker">Select Broker</Label>
            <Select value={broker} onValueChange={setBroker}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpaca">Alpaca Markets</SelectItem>
                <SelectItem value="interactive" disabled>
                  Interactive Brokers (Coming Soon)
                </SelectItem>
                <SelectItem value="coinbase" disabled>
                  Coinbase (Coming Soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
            <h4 className="font-semibold mb-2">📘 How to get Alpaca API keys:</h4>
            <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
              <li>Sign up at <a href="https://alpaca.markets" target="_blank" rel="noopener" className="text-blue-500 hover:underline">alpaca.markets</a></li>
              <li>Navigate to "Paper Trading" (for testing)</li>
              <li>Go to "API Keys" section</li>
              <li>Generate new API Key and Secret</li>
              <li>Paste them below to sync your portfolio</li>
            </ol>
          </div>

          <Button
            onClick={() => setShowDialog(true)}
            className="w-full"
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Connect & Sync Portfolio'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect to {broker}</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your API credentials to sync your portfolio. Your credentials are never stored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Your API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Your API Secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-muted-foreground">
              🔒 Your credentials are transmitted securely and never stored on our servers.
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setApiKey('');
                setApiSecret('');
              }}
              className="w-full"
            >
              Cancel
            </Button>
            <Button onClick={handleSync} disabled={syncing} className="w-full">
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
