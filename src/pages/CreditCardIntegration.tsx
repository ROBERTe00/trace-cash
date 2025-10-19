/**
 * Credit Card Integration Page
 * Main page for managing credit card connections and settings
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Settings, 
  BarChart3, 
  Shield, 
  Bell,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Construction
} from 'lucide-react';
import { BugAuditPanel } from '@/components/BugAuditSystem';
import { MobileOptimizedCard } from '@/components/MobileOptimizations';
import { toast } from 'sonner';

export default function CreditCardIntegrationPage() {
  const [activeTab, setActiveTab] = useState('integration');
  const [auditResults, setAuditResults] = useState(null);

  const handleAuditComplete = (results: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    bugs: Array<{
      id: string;
      type: string;
      severity: string;
      category: string;
      title: string;
      description: string;
      location: string;
      status: string;
      timestamp: Date;
    }>;
    performance: {
      bundleSize: number;
      loadTime: number;
      memoryUsage: number;
      renderTime: number;
    };
    security: {
      vulnerabilities: number;
      sanitizationIssues: number;
      authIssues: number;
    };
  }) => {
    setAuditResults(results);
    console.log('Audit completed:', results);
  };

  const handleAccountConnected = (account: {
    id: string;
    institutionName: string;
    accountName: string;
    accountType: string;
    lastFour: string;
    isActive: boolean;
    connectedAt: Date;
    balance?: number;
    currency: string;
  }) => {
    toast.success('Account connected!', {
      description: `${account.institutionName} - ${account.accountName}`,
      duration: 5000
    });
  };

  const handleTransactionReceived = (transaction: {
    id: string;
    accountId: string;
    amount: number;
    description: string;
    date: string;
    category?: string;
    merchant?: string;
    isPending: boolean;
    createdAt: Date;
  }) => {
    toast.info('New transaction received', {
      description: `${transaction.description} - ${transaction.amount}`,
      duration: 3000
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Credit Card Integration
          </h1>
          <p className="text-muted-foreground mt-2">
            Securely connect your credit cards for automatic transaction tracking and AI-powered insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Bank-level Security
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            PCI Compliant
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            System Audit
          </TabsTrigger>
        </TabsList>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <MobileOptimizedCard
            title="Credit Card Integration"
            enableTouch={true}
            className="w-full"
          >
            <Alert>
              <Construction className="h-4 w-4" />
              <AlertDescription>
                Plaid integration is currently under maintenance. This feature will be available soon with the connected_accounts database table.
              </AlertDescription>
            </Alert>
          </MobileOptimizedCard>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Transaction Volume */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€2,450</div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  All accounts active
                </p>
              </CardContent>
            </Card>

            {/* AI Accuracy */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  Categorization accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Account Connected</div>
                      <div className="text-sm text-muted-foreground">Chase Freedom Unlimited</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">2 minutes ago</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Transactions Synced</div>
                      <div className="text-sm text-muted-foreground">15 new transactions processed</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">1 hour ago</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bell className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Spending Alert</div>
                      <div className="text-sm text-muted-foreground">Monthly budget exceeded</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">3 hours ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Data Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    All sensitive data is encrypted using AES-256 encryption
                  </p>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Additional security layer for account access
                  </p>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after 30 minutes of inactivity
                  </p>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    <Info className="h-3 w-3 mr-1" />
                    30 minutes
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Transaction Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new transactions
                  </p>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Spending Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Alerts when approaching budget limits
                  </p>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly spending summaries
                  </p>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Privacy & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">PCI DSS Compliant</h4>
                  <p className="text-sm text-muted-foreground">
                    Meets highest security standards
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">SOC 2 Type II</h4>
                  <p className="text-sm text-muted-foreground">
                    Audited security controls
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <Info className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium">GDPR Compliant</h4>
                  <p className="text-sm text-muted-foreground">
                    European data protection
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-2">
                <Button variant="outline">
                  View Privacy Policy
                </Button>
                <Button variant="outline">
                  Download Data
                </Button>
                <Button variant="outline">
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <MobileOptimizedCard
            title="System Audit & Bug Resolution"
            enableTouch={true}
            className="w-full"
          >
            <BugAuditPanel onAuditComplete={handleAuditComplete} />
          </MobileOptimizedCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
