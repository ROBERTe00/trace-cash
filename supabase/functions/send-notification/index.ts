import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    let subject = "";
    let html = "";

    switch (type) {
      case 'weekly_reminder':
        subject = "📊 Trace-Cash: Time to log your expenses!";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">Weekly Expense Reminder</h1>
            <p>Hi there! 👋</p>
            <p>It's time to log your expenses for this week. Staying on top of your finances helps you reach your goals faster!</p>
            <p>Click the button below to add your expenses:</p>
            <a href="${data?.appUrl || 'https://trace-cash.app'}/upload" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Log Expenses
            </a>
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Trace-Cash Team</p>
          </div>
        `;
        break;

      case 'monthly_report':
        subject = "📈 Your Monthly Financial Report";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">Monthly Report Ready!</h1>
            <p>Your financial summary for ${data?.month || 'this month'} is ready:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Total Expenses:</strong> €${data?.totalExpenses || 0}</p>
              <p><strong>Total Income:</strong> €${data?.totalIncome || 0}</p>
              <p><strong>Net Savings:</strong> €${data?.netSavings || 0}</p>
            </div>
            <a href="${data?.appUrl || 'https://trace-cash.app'}/insights" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Full Report
            </a>
          </div>
        `;
        break;

      case 'budget_alert':
        subject = "⚠️ Budget Alert - You're close to your limit";
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Budget Alert</h1>
            <p>You've reached ${data?.percentage || 80}% of your ${data?.category || 'monthly'} budget.</p>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
              <p><strong>Budget:</strong> €${data?.budget || 0}</p>
              <p><strong>Spent:</strong> €${data?.spent || 0}</p>
              <p><strong>Remaining:</strong> €${data?.remaining || 0}</p>
            </div>
            <p>Consider reviewing your expenses to stay on track!</p>
            <a href="${data?.appUrl || 'https://trace-cash.app'}/expenses" 
               style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review Expenses
            </a>
          </div>
        `;
        break;
    }

    const { error } = await resend.emails.send({
      from: "Trace-Cash <notifications@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("Email error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
