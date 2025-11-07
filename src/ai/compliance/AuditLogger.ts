// Audit Logger - Logging per compliance e audit trail
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogRequest {
  type: string;
  userId?: string;
  timestamp: string;
  approved: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface ComplianceViolation {
  type: 'MiFID_II' | 'GDPR' | 'CONSOB';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  userId?: string;
  timestamp?: string;
  details?: Record<string, any>;
}

export class AuditLogger {
  private logs: AuditLogRequest[] = [];
  private violations: ComplianceViolation[] = [];
  private maxLocalLogs = 100;

  constructor() {
    // Carica log locali salvati
    this.loadLocalLogs();
  }

  /**
   * Log di una richiesta
   */
  async logRequest(request: AuditLogRequest): Promise<void> {
    console.log('[AuditLogger] Logging request:', {
      type: request.type,
      userId: request.userId ? `${request.userId.substring(0, 8)}...` : 'anonymous',
      approved: request.approved,
      riskLevel: request.riskLevel
    });

    // Salva localmente per audit immediato
    this.logs.push(request);
    if (this.logs.length > this.maxLocalLogs) {
      this.logs.shift(); // Rimuovi il più vecchio
    }

    // Salva su localStorage per persistenza
    try {
      const savedLogs = JSON.parse(localStorage.getItem('compliance-audit-logs') || '[]');
      savedLogs.push(request);
      // Mantieni solo ultimi 100 log
      if (savedLogs.length > this.maxLocalLogs) {
        savedLogs.shift();
      }
      localStorage.setItem('compliance-audit-logs', JSON.stringify(savedLogs));
    } catch (error) {
      console.warn('[AuditLogger] Failed to save to localStorage:', error);
    }

    // TODO: In produzione, salvare su Supabase audit_logs table
    // await this.saveToSupabase(request);
  }

  /**
   * Log di una violazione compliance
   */
  async logViolation(violation: ComplianceViolation): Promise<void> {
    const fullViolation = {
      ...violation,
      userId: violation.userId,
      timestamp: violation.timestamp || new Date().toISOString()
    };

    console.error('[AuditLogger] Compliance violation:', {
      type: violation.type,
      severity: violation.severity,
      description: violation.description,
      location: violation.location
    });

    // Salva localmente
    this.violations.push(fullViolation);
    if (this.violations.length > 50) {
      this.violations.shift();
    }

    // Salva su localStorage
    try {
      const savedViolations = JSON.parse(localStorage.getItem('compliance-violations') || '[]');
      savedViolations.push(fullViolation);
      if (savedViolations.length > 50) {
        savedViolations.shift();
      }
      localStorage.setItem('compliance-violations', JSON.stringify(savedViolations));
    } catch (error) {
      console.warn('[AuditLogger] Failed to save violation to localStorage:', error);
    }

    // TODO: In produzione, salvare su Supabase compliance_violations table
    // await this.saveViolationToSupabase(fullViolation);
  }

  /**
   * Ottiene log delle richieste
   */
  getRequestLogs(limit: number = 50): AuditLogRequest[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Ottiene violazioni
   */
  getViolations(limit: number = 20): ComplianceViolation[] {
    return this.violations.slice(-limit).reverse();
  }

  /**
   * Conta violazioni per tipo
   */
  getViolationStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.violations.forEach(v => {
      const key = `${v.type}_${v.severity}`;
      stats[key] = (stats[key] || 0) + 1;
    });

    return stats;
  }

  /**
   * Carica log da localStorage
   */
  private loadLocalLogs(): void {
    try {
      const savedLogs = localStorage.getItem('compliance-audit-logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).slice(-this.maxLocalLogs);
      }

      const savedViolations = localStorage.getItem('compliance-violations');
      if (savedViolations) {
        this.violations = JSON.parse(savedViolations).slice(-50);
      }
    } catch (error) {
      console.warn('[AuditLogger] Failed to load local logs:', error);
    }
  }

  /**
   * Salva su Supabase (TODO: implementare in produzione)
   */
  private async saveToSupabase(request: AuditLogRequest): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          request_type: request.type,
          user_id: request.userId,
          timestamp: request.timestamp,
          approved: request.approved,
          risk_level: request.riskLevel,
          metadata: request.metadata
        });

      if (error) {
        console.warn('[AuditLogger] Failed to save to Supabase:', error);
      }
    } catch (error) {
      console.warn('[AuditLogger] Supabase save failed:', error);
    }
  }

  /**
   * Salva violazione su Supabase (TODO: implementare in produzione)
   */
  private async saveViolationToSupabase(violation: ComplianceViolation): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_violations')
        .insert({
          violation_type: violation.type,
          severity: violation.severity,
          description: violation.description,
          location: violation.location,
          user_id: violation.userId,
          timestamp: violation.timestamp,
          details: violation.details
        });

      if (error) {
        console.warn('[AuditLogger] Failed to save violation to Supabase:', error);
      }
    } catch (error) {
      console.warn('[AuditLogger] Supabase violation save failed:', error);
    }
  }
}



