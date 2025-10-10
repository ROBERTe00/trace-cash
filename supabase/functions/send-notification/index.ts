import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  type: 'weekly_reminder' | 'monthly_report' | 'budget_alert';
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, data }: NotificationRequest = await req.json();

    // Log notification for now (email functionality requires Resend setup)
    console.log("Notification scheduled:", { email, type, data });

    // TODO: Implement email sending with Resend when RESEND_API_KEY is configured
    // For now, return success to allow app to function
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification logged. Email functionality requires Resend API key setup." 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
