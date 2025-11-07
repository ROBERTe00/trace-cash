// Report Template Engine - Gestisce template e struttura dei report
export type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom' | 'health';

export interface ReportTemplate {
  sections: string[];
  format: 'detailed' | 'summary' | 'executive';
  includeCharts: boolean;
  includeRecommendations: boolean;
}

export class ReportTemplateEngine {
  private templates: Map<ReportType, ReportTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Ottiene il template per un tipo di report
   */
  getTemplate(type: ReportType): ReportTemplate {
    return this.templates.get(type) || this.templates.get('monthly')!;
  }

  /**
   * Inizializza i template predefiniti
   */
  private initializeTemplates() {
    // Monthly Report Template
    this.templates.set('monthly', {
      sections: [
        'executiveSummary',
        'spending',
        'savings',
        'investments',
        'trends',
        'recommendations'
      ],
      format: 'detailed',
      includeCharts: true,
      includeRecommendations: true
    });

    // Quarterly Report Template
    this.templates.set('quarterly', {
      sections: [
        'executiveSummary',
        'spending',
        'savings',
        'investments',
        'comparison',
        'trends',
        'recommendations',
        'forecast'
      ],
      format: 'detailed',
      includeCharts: true,
      includeRecommendations: true
    });

    // Annual Report Template
    this.templates.set('annual', {
      sections: [
        'executiveSummary',
        'spending',
        'savings',
        'investments',
        'comparison',
        'trends',
        'milestones',
        'forecast',
        'recommendations',
        'actionPlan'
      ],
      format: 'detailed',
      includeCharts: true,
      includeRecommendations: true
    });

    // Financial Health Report Template
    this.templates.set('health', {
      sections: [
        'executiveSummary',
        'healthScore',
        'categoryScores',
        'strengths',
        'improvements',
        'trend',
        'comparison',
        'actionPlan'
      ],
      format: 'executive',
      includeCharts: true,
      includeRecommendations: true
    });

    // Custom Report Template
    this.templates.set('custom', {
      sections: ['executiveSummary'],
      format: 'summary',
      includeCharts: false,
      includeRecommendations: false
    });
  }

  /**
   * Crea un template personalizzato
   */
  createCustomTemplate(sections: string[], format: 'detailed' | 'summary' | 'executive'): ReportTemplate {
    return {
      sections,
      format,
      includeCharts: sections.includes('spending') || sections.includes('investments'),
      includeRecommendations: sections.includes('recommendations') || sections.includes('actionPlan')
    };
  }

  /**
   * Valida sezione del report
   */
  isValidSection(section: string): boolean {
    const validSections = [
      'executiveSummary',
      'spending',
      'savings',
      'investments',
      'trends',
      'comparison',
      'forecast',
      'milestones',
      'recommendations',
      'actionPlan',
      'healthScore',
      'categoryScores',
      'strengths',
      'improvements',
      'trend'
    ];
    return validSections.includes(section);
  }
}



