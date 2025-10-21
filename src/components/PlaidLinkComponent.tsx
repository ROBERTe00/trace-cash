/**
 * Plaid Link React Component - Temporarily disabled
 */

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const PlaidLinkComponent = () => {
  return (
    <Card className="p-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Plaid integration is being configured. Please check back soon.
        </AlertDescription>
      </Alert>
    </Card>
  );
};
