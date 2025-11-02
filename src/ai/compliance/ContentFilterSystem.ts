// Content Filter System - Filtra contenuti vietati per compliance
export interface FlaggedContent {
  type: 'forbidden_keyword' | 'advice_pattern' | 'product_mention' | 'projection';
  content: string;
  location?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export class ContentFilterSystem {
  private forbiddenKeywords: string[];
  private advicePatterns: RegExp[];
  private productPatterns: RegExp[];
  private projectionPatterns: RegExp[];

  constructor() {
    // Keyword vietate per consulenza finanziaria
    this.forbiddenKeywords = [
      'dovresti comprare',
      'devi investire',
      'ti consiglio',
      'ti suggerisco',
      'guadagno garantito',
      'rendimento sicuro',
      'investimento perfetto',
      'consiglio di vendere',
      'è il momento per',
      'non perdere questa opportunità',
      'investi subito',
      'compra ora',
      'vendi domani',
      'questo ti farà guadagnare',
      'profitto garantito'
    ];

    // Pattern regex per consulenza
    this.advicePatterns = [
      /dovresti\s+(comprare|acquistare|investire|vendere)/i,
      /ti consiglio\s+(di\s+)?(comprare|acquistare|investire|vendere)/i,
      /è il momento\s+(per|di)\s+(comprare|investire|vendere)/i,
      /devi\s+(comprare|acquistare|investire|vendere)/i,
      /ti suggerisco\s+(di\s+)?(comprare|investire)/i,
      /non aspettare.*investi/i,
      /è sicuramente.*buon investimento/i
    ];

    // Pattern per prodotti finanziari specifici
    this.productPatterns = [
      /(fondo|etf|azione|obbligazione|bond)\s+([A-Z]{2,5}|\w{3,})/i,
      /(compra|acquista|investi in)\s+([A-Z]{2,5}|\w{3,})/i,
      /ticker\s+([A-Z]{2,5})/i,
      /\b(TSLA|AAPL|MSFT|GOOGL|AMZN|BTC|ETH|SOL|XRP|ADA)\b.*(comprare|investire|acquistare)/i
    ];

    // Pattern per proiezioni performance
    this.projectionPatterns = [
      /(renderà|guadagnerai|guadagnerete|profitto.*garantito|rendimento.*sicuro)/i,
      /(crescita prevista|guadagno atteso|rendimento stimato)/i,
      /(ti farà guadagnare|genererà profitti|rendimento.*%)/i,
      /(performance.*garantite|risultati.*sicuri)/i
    ];
  }

  /**
   * Verifica se contiene contenuti vietati
   */
  containsForbiddenContent(data: any): boolean {
    const text = this.extractText(data);
    
    return this.forbiddenKeywords.some(keyword => text.includes(keyword.toLowerCase())) ||
           this.advicePatterns.some(pattern => pattern.test(text)) ||
           this.productPatterns.some(pattern => pattern.test(text)) ||
           this.projectionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Ottiene contenuti flaggati con dettagli
   */
  getFlaggedContent(data: any): FlaggedContent[] {
    const flagged: FlaggedContent[] = [];
    const text = this.extractText(data);

    // Check forbidden keywords
    this.forbiddenKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        flagged.push({
          type: 'forbidden_keyword',
          content: keyword,
          severity: 'critical',
          location: this.findLocation(text, keyword)
        });
      }
    });

    // Check advice patterns
    this.advicePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        flagged.push({
          type: 'advice_pattern',
          content: matches[0],
          severity: 'high',
          location: this.findLocation(text, matches[0])
        });
      }
    });

    // Check product patterns
    this.productPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        flagged.push({
          type: 'product_mention',
          content: matches[0],
          severity: 'high',
          location: this.findLocation(text, matches[0])
        });
      }
    });

    // Check projection patterns
    this.projectionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        flagged.push({
          type: 'projection',
          content: matches[0],
          severity: 'medium',
          location: this.findLocation(text, matches[0])
        });
      }
    });

    return flagged;
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
   * Trova posizione approssimativa del contenuto flaggato
   */
  private findLocation(text: string, searchTerm: string): string {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return 'unknown';
    
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + searchTerm.length + 20);
    return `...${text.substring(start, end)}...`;
  }

  /**
   * Sanitizza contenuto rimuovendo elementi vietati
   */
  sanitizeContent(content: string): string {
    let sanitized = content;

    // Rimuovi keyword vietate
    this.forbiddenKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '[contenuto educativo]');
    });

    // Rimuovi pattern di consulenza
    this.advicePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[contenuto educativo]');
    });

    return sanitized;
  }
}

