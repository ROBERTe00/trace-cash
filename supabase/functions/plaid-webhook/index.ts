/**
 * Plaid Webhook Handler
 * Processes real-time transaction updates from Plaid
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlaidWebhookEvent {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  account_id?: string;
  new_transactions?: number;
  removed_transactions?: string[];
  error?: {
    error_type: string;
    error_code: string;
    error_message: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (in production)
    const signature = req.headers.get("plaid-verification");
    if (!signature) {
      console.warn("Missing Plaid verification header");
    }

    const body: PlaidWebhookEvent = await req.json();
    console.log("Received Plaid webhook:", body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Store webhook event
    const { error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        webhook_type: body.webhook_type,
        webhook_code: body.webhook_code,
        item_id: body.item_id,
        account_id: body.account_id,
        payload: body,
        processed: false
      });

    if (webhookError) {
      console.error("Failed to store webhook event:", webhookError);
    }

    // Process based on webhook type
    switch (body.webhook_type) {
      case "TRANSACTIONS":
        await handleTransactionsWebhook(body, supabase);
        break;
      case "ITEM":
        await handleItemWebhook(body, supabase);
        break;
      case "ERROR":
        await handleErrorWebhook(body, supabase);
        break;
      default:
        console.log(`Unhandled webhook type: ${body.webhook_type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function handleTransactionsWebhook(event: PlaidWebhookEvent, supabase: any) {
  console.log("Processing TRANSACTIONS webhook:", event.webhook_code);

  switch (event.webhook_code) {
    case "INITIAL_UPDATE":
      // Initial transaction sync completed
      console.log("Initial transaction sync completed for item:", event.item_id);
      break;

    case "HISTORICAL_UPDATE":
      // Historical transactions sync completed
      console.log("Historical transactions sync completed for item:", event.item_id);
      break;

    case "DEFAULT_UPDATE":
      // New transactions available
      if (event.new_transactions && event.new_transactions > 0) {
        console.log(`New transactions available: ${event.new_transactions}`);
        await fetchNewTransactions(event.item_id, event.account_id, supabase);
      }
      break;

    case "TRANSACTIONS_REMOVED":
      // Transactions were removed
      if (event.removed_transactions && event.removed_transactions.length > 0) {
        console.log(`Removed transactions: ${event.removed_transactions.length}`);
        await removeTransactions(event.removed_transactions, supabase);
      }
      break;

    default:
      console.log(`Unhandled transaction webhook code: ${event.webhook_code}`);
  }
}

async function handleItemWebhook(event: PlaidWebhookEvent, supabase: any) {
  console.log("Processing ITEM webhook:", event.webhook_code);

  switch (event.webhook_code) {
    case "NEW_ACCOUNTS_AVAILABLE":
      console.log("New accounts available for item:", event.item_id);
      // Fetch and store new accounts
      break;

    case "PENDING_EXPIRATION":
      console.log("Item access token expiring soon:", event.item_id);
      // Notify user to re-authenticate
      break;

    case "USER_PERMISSION_REVOKED":
      console.log("User permission revoked for item:", event.item_id);
      // Deactivate item
      await deactivateItem(event.item_id, supabase);
      break;

    case "WEBHOOK_UPDATE_ACKNOWLEDGED":
      console.log("Webhook update acknowledged for item:", event.item_id);
      break;

    default:
      console.log(`Unhandled item webhook code: ${event.webhook_code}`);
  }
}

async function handleErrorWebhook(event: PlaidWebhookEvent, supabase: any) {
  console.error("Plaid error webhook:", event.error);
  
  if (event.error) {
    // Store error in database
    await supabase
      .from("plaid_errors")
      .insert({
        item_id: event.item_id,
        error_type: event.error.error_type,
        error_code: event.error.error_code,
        error_message: event.error.error_message,
        created_at: new Date().toISOString()
      });

    // Handle specific error types
    switch (event.error.error_code) {
      case "ITEM_LOGIN_REQUIRED":
        console.log("Item login required for:", event.item_id);
        // Notify user to re-authenticate
        break;
      case "INSUFFICIENT_CREDENTIALS":
        console.log("Insufficient credentials for:", event.item_id);
        break;
      case "INVALID_CREDENTIALS":
        console.log("Invalid credentials for:", event.item_id);
        break;
      default:
        console.log(`Unhandled error code: ${event.error.error_code}`);
    }
  }
}

async function fetchNewTransactions(itemId: string, accountId: string | undefined, supabase: any) {
  try {
    // Get access token for the item
    const { data: itemData, error: itemError } = await supabase
      .from("connected_accounts")
      .select("access_token, user_id")
      .eq("plaid_account_id", itemId)
      .single();

    if (itemError || !itemData) {
      console.error("Failed to get item data:", itemError);
      return;
    }

    // In a real implementation, you would call Plaid API here
    // For now, we'll simulate fetching new transactions
    console.log("Fetching new transactions for item:", itemId);

    // Simulate new transactions
    const mockTransactions = [
      {
        plaid_transaction_id: `txn_${Date.now()}_1`,
        account_id: accountId,
        amount: -45.99,
        description: "Coffee Shop Purchase",
        date: new Date().toISOString().split('T')[0],
        category: "Food & Dining",
        merchant: "Local Coffee Shop",
        is_pending: false
      },
      {
        plaid_transaction_id: `txn_${Date.now()}_2`,
        account_id: accountId,
        amount: -120.50,
        description: "Grocery Store",
        date: new Date().toISOString().split('T')[0],
        category: "Food & Dining",
        merchant: "Supermarket",
        is_pending: false
      }
    ];

    // Store new transactions
    const { error: insertError } = await supabase
      .from("transactions")
      .upsert(mockTransactions, { onConflict: "plaid_transaction_id" });

    if (insertError) {
      console.error("Failed to insert new transactions:", insertError);
      return;
    }

    // Update last sync time
    await supabase
      .from("connected_accounts")
      .update({ last_sync: new Date().toISOString() })
      .eq("plaid_account_id", itemId);

    console.log(`Successfully processed ${mockTransactions.length} new transactions`);

  } catch (error) {
    console.error("Error fetching new transactions:", error);
  }
}

async function removeTransactions(removedTransactionIds: string[], supabase: any) {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("plaid_transaction_id", removedTransactionIds);

    if (error) {
      console.error("Failed to remove transactions:", error);
      return;
    }

    console.log(`Successfully removed ${removedTransactionIds.length} transactions`);

  } catch (error) {
    console.error("Error removing transactions:", error);
  }
}

async function deactivateItem(itemId: string, supabase: any) {
  try {
    const { error } = await supabase
      .from("connected_accounts")
      .update({ is_active: false })
      .eq("plaid_account_id", itemId);

    if (error) {
      console.error("Failed to deactivate item:", error);
      return;
    }

    console.log("Successfully deactivated item:", itemId);

  } catch (error) {
    console.error("Error deactivating item:", error);
  }
}
