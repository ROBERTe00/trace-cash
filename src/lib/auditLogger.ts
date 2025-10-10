// Audit logging utility for tracking user actions
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  success?: boolean;
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Cannot log audit entry: user not authenticated');
        return;
      }

      const { error } = await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        details: entry.details,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        success: entry.success ?? true,
      });

      if (error) {
        console.error('Failed to log audit entry:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Convenience methods for common actions
  static logExpenseCreated(expenseId: string, details: any) {
    return this.log({
      action: 'expense_created',
      resourceType: 'expense',
      resourceId: expenseId,
      details,
    });
  }

  static logExpenseUpdated(expenseId: string, details: any) {
    return this.log({
      action: 'expense_updated',
      resourceType: 'expense',
      resourceId: expenseId,
      details,
    });
  }

  static logExpenseDeleted(expenseId: string) {
    return this.log({
      action: 'expense_deleted',
      resourceType: 'expense',
      resourceId: expenseId,
    });
  }

  static logInvestmentCreated(investmentId: string, details: any) {
    return this.log({
      action: 'investment_created',
      resourceType: 'investment',
      resourceId: investmentId,
      details,
    });
  }

  static logDataExport(format: string) {
    return this.log({
      action: 'data_exported',
      resourceType: 'export',
      details: { format },
    });
  }

  static logLogin(method: string, mfaUsed: boolean) {
    return this.log({
      action: 'user_login',
      resourceType: 'auth',
      details: { method, mfaUsed },
    });
  }

  static logLoginFailed(reason: string) {
    return this.log({
      action: 'user_login_failed',
      resourceType: 'auth',
      details: { reason },
      success: false,
    });
  }
}
