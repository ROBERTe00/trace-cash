// Compliance Engine - Validazione compliance avanzata per MiFID II, GDPR, CONSOB
import { ContentFilterSystem, type FlaggedContent } from './ContentFilterSystem';
import { AuditLogger, type AuditLogRequest, type ComplianceViolation } from './AuditLogger';
import type { AIRequestType, AIRequestContext } from '@/ai/core-ai-engine';

export interface Regulations {
  EU: {
    MiFID_II: {
      forbidden: string[];
      required_disclaimers: string[];
      boundaries: {
        max_risk_level: 'low' | 'medium' | 'high';
        allowed_content_types: string[];
        forbidden_actions: string[];
      };
    };
    GDPR: {
      data_processing: string[];
      ai_limitations: string[];
    };
  };
  ITALY: {
    CONSOB: {
      restrictions: string[];
    };
  };
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  factors: Array<{
    factor: string;
    weight: number;
    description?: string;
  }>;
  score: number;
  issues: string[];
}

export interface ComplianceValidationResult {
  approved: boolean;
  reason?: string;
  details?: string[];
  constraints?: ContentConstraints;
  requiredDisclaimers?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  flaggedContent?: FlaggedContent[];
  complianceViolation?: ComplianceViolation;
  alternative?: CompliantAlternative;
}

export interface ContentConstraints {
  maxRiskLevel: 'low' | 'medium' | 'high';
  allowedContentTypes: string[];
  forbiddenActions: string[];
}

export interface CompliantAlternative {
  message: string;
  type: 'educational_alternative' | 'generic_advice' | 'data_only';
  originalContent?: string;
}

export class ComplianceEngine {
  private regulations: Regulations;
  private contentFilters: ContentFilterSystem;
  private auditLogger: AuditLogger;

  constructor() {
    this.regulations = this.loadRegulations();
    this.contentFilters = new ContentFilterSystem();
    this.auditLogger = new AuditLogger();
  }

  /**
   * Carica tutte le normative
   */
  private loadRegulations(): Regulations {
    return {
      EU: {
        MiFID_II: {
          forbidden: [
            'personal_financial_advice',
            'investment_recommendations',
            'specific_product_promotion',
            'market_timing_suggestions',
            'performance_guarantees'
          ],
          required_disclaimers: [
            'educational_purpose_only',
            'not_financial_advice',
            'consult_professional',
            'past_performance_disclaimer'
          ],
          boundaries: {
            max_risk_level: 'medium',
            allowed_content_types: ['educational', 'informational', 'analytical'],
            forbidden_actions: ['recommending', 'advising', 'promoting']
          }
        },
        GDPR: {
          data_processing: ['explicit_consent', 'right_to_erasure', 'data_portability'],
          ai_limitations: ['transparency', 'human_oversight', 'bias_prevention']
        }
      },
      ITALY: {
        CONSOB: {
          restrictions: [
            'no_individual_investment_advice',
            'no_portfolio_management_suggestions',
            'no_specific_security_recommendations'
          ]
        }
      }
    };
  }

  /**
   * Valida richiesta con risk assessment completo
   */
  async validateRequest(
    type: AIRequestType,
    data: any,
    context: AIRequestContext
  ): Promise<ComplianceValidationResult> {
    console.log('[ComplianceEngine] Validating request:', type);

    // 1. Risk assessment
    const riskAssessment = await this.assessRisk(type, data, context);
    
    if (riskAssessment.riskLevel === 'high') {
      const violation: ComplianceViolation = {
        type: 'MiFID_II',
        severity: 'high',
        description: 'Contenuto ad alto rischio rilevato',
        location: `Request type: ${type}`,
        userId: context.userId,
        details: {
          factors: riskAssessment.factors,
          score: riskAssessment.score
        }
      };

      await this.auditLogger.logViolation(violation);

      return {
        approved: false,
        reason: 'CONTENT_TOO_RISKY',
        details: riskAssessment.issues,
        riskLevel: riskAssessment.riskLevel,
        alternative: this.suggestCompliantAlternative(type, data, context),
        complianceViolation: violation
      };
    }

    // 2. Contenuti vietati
    if (this.containsForbiddenContent(data)) {
      const flagged = this.getFlaggedContent(data);
      const violation: ComplianceViolation = {
        type: 'MiFID_II',
        severity: 'critical',
        description: 'Contenuto vietato rilevato',
        location: 'Content validation',
        userId: context.userId,
        details: {
          flaggedContent: flagged.map(f => f.content)
        }
      };

      await this.auditLogger.logViolation(violation);

      return {
        approved: false,
        reason: 'FORBIDDEN_CONTENT_DETECTED',
        flaggedContent: flagged,
        complianceViolation: violation,
        alternative: this.suggestCompliantAlternative(type, data, context)
      };
    }

    // 3. Validazione GDPR
    const gdprCheck = this.validateGDPR(data, context);
    if (!gdprCheck.approved) {
      const violation: ComplianceViolation = {
        type: 'GDPR',
        severity: 'high',
        description: 'Violazione GDPR rilevata',
        location: 'GDPR validation',
        userId: context.userId,
        details: {
          issues: gdprCheck.issues
        }
      };

      await this.auditLogger.logViolation(violation);

      return {
        approved: false,
        reason: 'GDPR_VIOLATION',
        details: gdprCheck.issues,
        complianceViolation: violation
      };
    }

    // 4. Log audit per richiesta approvata
    await this.auditLogger.logRequest({
      type,
      userId: context.userId,
      timestamp: new Date().toISOString(),
      approved: true,
      riskLevel: riskAssessment.riskLevel,
      metadata: {
        requestId: context.requestId
      }
    });

    return {
      approved: true,
      constraints: this.getContentConstraints(type, context),
      requiredDisclaimers: this.getRequiredDisclaimers(type),
      riskLevel: riskAssessment.riskLevel
    };
  }

  /**
   * Valuta rischio del contenuto
   */
  async assessRisk(
    type: AIRequestType,
    data: any,
    context: AIRequestContext
  ): Promise<RiskAssessment> {
    const riskFactors: Array<{ factor: string; weight: number; description?: string }> = [];
    
    // Analisi keyword finanziarie
    if (this.containsFinancialAdviceKeywords(data)) {
      riskFactors.push({
        factor: 'financial_advice_language',
        weight: 0.9,
        description: 'Linguaggio che suggerisce consulenza finanziaria'
      });
    }
    
    // Prodotti specifici menzionati
    if (this.containsSpecificProductMentions(data)) {
      riskFactors.push({
        factor: 'specific_product_mention',
        weight: 0.8,
        description: 'Menzione di prodotti finanziari specifici'
      });
    }
    
    // Proiezioni performance
    if (this.containsPerformanceProjections(data)) {
      riskFactors.push({
        factor: 'performance_projection',
        weight: 0.7,
        description: 'Proiezioni di performance future'
      });
    }

    // Market timing
    if (this.containsMarketTimingSuggestions(data)) {
      riskFactors.push({
        factor: 'market_timing',
        weight: 0.75,
        description: 'Suggerimenti di timing di mercato'
      });
    }

    // Tipo di richiesta influisce sul rischio
    if (type === 'insight_generation' || type === 'report_generation') {
      // Questi tipi sono più sensibili
      riskFactors.push({
        factor: 'sensitive_request_type',
        weight: 0.3,
        description: 'Tipo di richiesta sensibile per compliance'
      });
    }

    // Calcolo rischio complessivo
    const totalRisk = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
    
    const riskLevel = totalRisk > 1.5 ? 'high' as const
      : totalRisk > 0.8 ? 'medium' as const
      : 'low' as const;

    return {
      riskLevel,
      factors: riskFactors,
      score: totalRisk,
      issues: riskFactors.map(f => f.description || f.factor)
    };
  }

  /**
   * Controlla keyword di consulenza finanziaria
   */
  private containsFinancialAdviceKeywords(data: any): boolean {
    const text = this.extractText(data);
    const adviceKeywords = [
      'dovresti comprare', 'dovresti investire', 'ti consiglio',
      'è un buon investimento', 'consiglio di acquistare',
      'investi in', 'compra ora', 'vendi subito',
      'ti suggerisco di', 'devi comprare'
    ];

    return adviceKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Controlla menzioni di prodotti specifici
   */
  private containsSpecificProductMentions(data: any): boolean {
    const text = this.extractText(data);
    // Pattern per ticker, ISIN, nomi prodotti specifici
    const productPatterns = [
      /fondo\s+\w+/i,
      /etf\s+\w+/i,
      /azione\s+\w+/i,
      /obbligazione\s+\w+/i,
      /\b(TSLA|AAPL|MSFT|GOOGL|AMZN|BTC|ETH|SOL|XRP|ADA)\b.*(comprare|investire|acquistare)/i
    ];

    return productPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Controlla proiezioni performance
   */
  private containsPerformanceProjections(data: any): boolean {
    const text = this.extractText(data);
    const projectionKeywords = [
      'renderà', 'guadagnerai', 'guadagnerete', 'profitto garantito',
      'rendimento sicuro', 'crescita prevista', 'guadagno atteso'
    ];

    return projectionKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Controlla suggerimenti market timing
   */
  private containsMarketTimingSuggestions(data: any): boolean {
    const text = this.extractText(data);
    const timingKeywords = [
      'è il momento di', 'ora è il momento', 'investi subito',
      'non aspettare', 'compra oggi', 'vendi domani',
      'è il momento perfetto'
    ];

    return timingKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * Controlla contenuti vietati usando ContentFilterSystem
   */
  private containsForbiddenContent(data: any): boolean {
    return this.contentFilters.containsForbiddenContent(data);
  }

  /**
   * Ottiene contenuti flaggati
   */
  private getFlaggedContent(data: any): FlaggedContent[] {
    return this.contentFilters.getFlaggedContent(data);
  }

  /**
   * Identifica tipo di violazione
   */
  private identifyViolation(data: any): ComplianceViolation | null {
    if (this.containsFinancialAdviceKeywords(data)) {
      return {
        type: 'MiFID_II',
        severity: 'high',
        description: 'Linguaggio di consulenza finanziaria rilevato',
        location: 'Content analysis'
      };
    }

    if (this.containsSpecificProductMentions(data)) {
      return {
        type: 'CONSOB',
        severity: 'medium',
        description: 'Menzione di prodotti finanziari specifici',
        location: 'Product mention check'
      };
    }

    return null;
  }

  /**
   * Suggerisce alternativa compliant
   */
  private suggestCompliantAlternative(
    type: AIRequestType,
    originalData: any,
    context: AIRequestContext
  ): CompliantAlternative {
    const text = this.extractText(originalData);
    
    // Pattern matching per tipo di violazione
    if (this.containsFinancialAdviceKeywords(originalData)) {
      return {
        original: text.substring(0, 100),
        message: "Posso mostrarti come analizzare i fondamentali di un'azienda e i principi di valutazione degli investimenti invece di suggerimenti specifici",
        type: 'educational_alternative'
      };
    }

    if (this.containsMarketTimingSuggestions(originalData)) {
      return {
        original: text.substring(0, 100),
        message: "Posso spiegarti i diversi approcci temporali negli investimenti e mostrarti dati storici sui settori invece di suggerire timing specifici",
        type: 'educational_alternative'
      };
    }

    if (this.containsSpecificProductMentions(originalData)) {
      return {
        original: text.substring(0, 100),
        message: "Posso insegnarti come valutare un fondo di investimento analizzando costi, diversificazione e strategia invece di raccomandare prodotti specifici",
        type: 'educational_alternative'
      };
    }

    return {
      message: "Posso fornirti contenuti educativi su questo argomento invece di suggerimenti specifici",
      type: "educational_alternative"
    };
  }

  /**
   * Valida compliance GDPR
   */
  private validateGDPR(
    data: any,
    context: AIRequestContext
  ): { approved: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verifica consenso esplicito per dati sensibili
    if (data?.fileContent && !context.userId) {
      issues.push('User ID mancante per tracciamento GDPR - richiesto per processamento documenti');
    }

    // Verifica che dati sensibili siano trattati correttamente
    if (data?.fileContent) {
      const sensitivePatterns = [
        /password/i,
        /pin/i,
        /cvv/i,
        /social security/i,
        /codice fiscale/i,
        /codice fiscale/i
      ];
      
      const hasSensitive = sensitivePatterns.some(pattern => pattern.test(data.fileContent));
      if (hasSensitive) {
        issues.push('Dati sensibili rilevati - richiede consenso esplicito e trattamento conforme GDPR');
      }
    }

    // Verifica data portability per analisi dati
    if (!context.userId && this.isDataAnalysisRequest(data)) {
      issues.push('User ID richiesto per data portability conforme GDPR');
    }

    return {
      approved: issues.length === 0,
      issues
    };
  }

  /**
   * Ottiene constraint per tipo di contenuto
   */
  private getContentConstraints(
    type: AIRequestType,
    context: AIRequestContext
  ): ContentConstraints {
    const mifid = this.regulations.EU.MiFID_II;

    return {
      maxRiskLevel: mifid.boundaries.max_risk_level,
      allowedContentTypes: mifid.boundaries.allowed_content_types,
      forbiddenActions: mifid.boundaries.forbidden_actions
    };
  }

  /**
   * Ottiene disclaimer richiesti per tipo
   */
  private getRequiredDisclaimers(type: AIRequestType): string[] {
    const mifid = this.regulations.EU.MiFID_II;

    // Educational content sempre richiede disclaimer
    if (type === 'educational_content') {
      return ['educational_purpose_only', 'not_financial_advice'];
    }

    // Insight generation richiede disclaimer più completo
    if (type === 'insight_generation' || type === 'report_generation') {
      return mifid.required_disclaimers;
    }

    // Chart generation con dati reali
    if (type === 'chart_generation') {
      return ['educational_purpose_only', 'past_performance_disclaimer'];
    }

    return [];
  }

  /**
   * Verifica se è una richiesta di analisi dati
   */
  private isDataAnalysisRequest(data: any): boolean {
    return data?.type === 'data_analysis' || 
           data?.analysis !== undefined ||
           data?.transactions !== undefined;
  }

  /**
   * Estrae testo da qualsiasi struttura dati
   */
  private extractText(data: any): string {
    if (typeof data === 'string') {
      return data.toLowerCase();
    }
    
    if (typeof data === 'object' && data !== null) {
      // Cerca campi testuali comuni
      const textFields = [
        data.prompt,
        data.description,
        data.content,
        data.message,
        data.text,
        data.query,
        data.request
      ].filter(Boolean);

      if (textFields.length > 0) {
        return textFields.join(' ').toLowerCase();
      }

      // Fallback: stringifica tutto l'oggetto
      return JSON.stringify(data).toLowerCase();
    }

    return String(data).toLowerCase();
  }

  /**
   * Ottiene statistiche compliance
   */
  getComplianceStats(): {
    totalRequests: number;
    approved: number;
    rejected: number;
    violations: Record<string, number>;
  } {
    const logs = this.auditLogger.getRequestLogs(1000);
    const violations = this.auditLogger.getViolationStats();

    return {
      totalRequests: logs.length,
      approved: logs.filter(l => l.approved).length,
      rejected: logs.filter(l => !l.approved).length,
      violations
    };
  }
}

export default ComplianceEngine;

