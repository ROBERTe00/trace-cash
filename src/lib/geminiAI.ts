/**
 * Advanced Google Gemini Flash 2.5 AI Service
 * Enhanced AI processing for financial data with advanced capabilities
 */

export interface GeminiConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
}

export interface TransactionAnalysis {
  transactions: ParsedTransaction[];
  summary: FinancialSummary;
  insights: AIInsight[];
  anomalies: Anomaly[];
  confidence: number;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee: string;
  confidence: number;
  merchant?: string;
  location?: string;
  tags?: string[];
}

export interface FinancialSummary {
  totalExpenses: number;
  totalIncome: number;
  topCategories: CategoryBreakdown[];
  monthlyTrend: 'increasing' | 'decreasing' | 'stable';
  spendingPattern: string;
  recommendations: string[];
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: string;
}

export interface Anomaly {
  type: 'duplicate' | 'unusual_amount' | 'suspicious_pattern' | 'missing_data';
  description: string;
  severity: 'low' | 'medium' | 'high';
  transactions: ParsedTransaction[];
  suggestion: string;
}

class GeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_LOVABLE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ LOVABLE_API_KEY not found. AI features will be limited.');
    }
  }

  /**
   * Advanced PDF/Excel processing with enhanced AI capabilities
   */
  async processFinancialDocument(
    fileContent: string,
    fileType: 'pdf' | 'csv' | 'excel',
    userId: string,
    options: {
      enableAnomalyDetection?: boolean;
      enableInsights?: boolean;
      enableSummarization?: boolean;
      customCategories?: string[];
    } = {}
  ): Promise<TransactionAnalysis> {
    const {
      enableAnomalyDetection = true,
      enableInsights = true,
      enableSummarization = true,
      customCategories = []
    } = options;

    const config: GeminiConfig = {
      model: 'google/gemini-2.5-flash',
      maxTokens: 32000,
      temperature: 0.1,
      topP: 0.9,
      topK: 40
    };

    const systemPrompt = this.buildAdvancedSystemPrompt(
      enableAnomalyDetection,
      enableInsights,
      enableSummarization,
      customCategories
    );

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Process this ${fileType.toUpperCase()} financial document:\n\n${fileContent}`
            }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          top_k: config.topK,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return this.parseAdvancedResponse(content);
    } catch (error) {
      console.error('Gemini AI processing error:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate AI-powered financial insights
   */
  async generateFinancialInsights(
    transactions: ParsedTransaction[],
    userProfile?: {
      monthlyIncome?: number;
      financialGoals?: string[];
      riskTolerance?: 'low' | 'medium' | 'high';
    }
  ): Promise<AIInsight[]> {
    const config: GeminiConfig = {
      model: 'google/gemini-2.5-flash',
      maxTokens: 8000,
      temperature: 0.3,
    };

    const systemPrompt = `You are an expert financial advisor AI. Analyze the user's transaction data and generate personalized insights.

CRITICAL RULES:
1. Generate 3-5 actionable insights maximum
2. Focus on specific, actionable advice
3. Use Italian language for responses
4. Consider user's financial profile if provided
5. Prioritize insights that can improve financial health

INSIGHT TYPES:
- success: Positive achievements or good practices
- warning: Potential issues or overspending
- info: Educational information or trends
- tip: Actionable suggestions for improvement

OUTPUT FORMAT (pure JSON array):
[
  {
    "type": "success|warning|info|tip",
    "title": "Brief title",
    "description": "Detailed explanation with specific numbers",
    "impact": "high|medium|low",
    "actionable": true/false,
    "category": "spending|saving|investing|budgeting"
  }
]`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Analyze these transactions and generate insights:\n\n${JSON.stringify({
                transactions: transactions.slice(0, 50), // Limit for token efficiency
                userProfile
              })}`
            }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI insights error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return this.parseInsightsResponse(content);
    } catch (error) {
      console.error('AI insights generation error:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in transaction data
   */
  async detectAnomalies(transactions: ParsedTransaction[]): Promise<Anomaly[]> {
    const config: GeminiConfig = {
      model: 'google/gemini-2.5-flash',
      maxTokens: 4000,
      temperature: 0.1,
    };

    const systemPrompt = `You are a financial fraud detection AI. Analyze transactions for anomalies.

ANOMALY TYPES:
- duplicate: Exact or near-duplicate transactions
- unusual_amount: Amounts significantly different from user's typical spending
- suspicious_pattern: Unusual timing, location, or merchant patterns
- missing_data: Incomplete transaction information

OUTPUT FORMAT (pure JSON array):
[
  {
    "type": "duplicate|unusual_amount|suspicious_pattern|missing_data",
    "description": "Clear explanation of the anomaly",
    "severity": "low|medium|high",
    "transactions": [array of affected transactions],
    "suggestion": "Recommended action"
  }
]`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Detect anomalies in these transactions:\n\n${JSON.stringify(transactions.slice(0, 100))}`
            }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anomaly detection error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return this.parseAnomaliesResponse(content);
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * Generate post-upload summary
   */
  async generateUploadSummary(
    transactions: ParsedTransaction[],
    fileName: string
  ): Promise<{
    summary: string;
    keyStats: {
      totalTransactions: number;
      totalAmount: number;
      topCategory: string;
      dateRange: string;
    };
    recommendations: string[];
  }> {
    const config: GeminiConfig = {
      model: 'google/gemini-2.5-flash',
      maxTokens: 2000,
      temperature: 0.4,
    };

    const systemPrompt = `Generate a concise, engaging summary of uploaded financial data in Italian.

REQUIREMENTS:
1. Maximum 2-3 sentences for summary
2. Include key statistics
3. Provide 2-3 actionable recommendations
4. Use friendly, encouraging tone
5. Focus on insights that help users understand their spending

OUTPUT FORMAT (pure JSON):
{
  "summary": "Brief engaging summary",
  "keyStats": {
    "totalTransactions": number,
    "totalAmount": number,
    "topCategory": "category name",
    "dateRange": "date range string"
  },
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Generate summary for file "${fileName}" with ${transactions.length} transactions:\n\n${JSON.stringify({
                transactions: transactions.slice(0, 20), // Sample for efficiency
                fileName
              })}`
            }
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Summary generation error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return this.parseSummaryResponse(content);
    } catch (error) {
      console.error('Summary generation error:', error);
      return {
        summary: `Elaborazione completata per ${fileName}`,
        keyStats: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
          topCategory: 'N/A',
          dateRange: 'N/A'
        },
        recommendations: ['Continua a tracciare le tue spese per insights più dettagliati']
      };
    }
  }

  private buildAdvancedSystemPrompt(
    enableAnomalyDetection: boolean,
    enableInsights: boolean,
    enableSummarization: boolean,
    customCategories: string[]
  ): string {
    const baseCategories = [
      'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
      'Healthcare', 'Bills & Utilities', 'Income', 'Other'
    ];
    
    const categories = customCategories.length > 0 ? customCategories : baseCategories;

    return `You are an advanced financial AI assistant specializing in document processing and analysis.

CORE CAPABILITIES:
1. Extract ALL transactions from financial documents
2. Categorize with high accuracy using provided categories
3. Detect anomalies and suspicious patterns
4. Generate actionable financial insights
5. Provide comprehensive summaries

CRITICAL RULES:
1. **EXTRACT EVERYTHING** - Process ALL pages, ALL transactions
2. Return ONLY valid JSON, no markdown or explanations
3. NEGATIVE amounts (-) for expenses/debits
4. POSITIVE amounts (+) for income/credits
5. Normalize dates to YYYY-MM-DD format
6. Assign confidence scores (0.0-1.0) for each categorization
7. Include merchant detection and location extraction when possible

CATEGORIES (use EXACTLY these):
${categories.map(cat => `- "${cat}"`).join('\n')}

OUTPUT FORMAT (pure JSON object):
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "clean description",
      "amount": -45.99 or +1000.00,
      "category": "exact category from list",
      "payee": "merchant/payee name",
      "confidence": 0.85,
      "merchant": "detected merchant",
      "location": "detected location",
      "tags": ["tag1", "tag2"]
    }
  ],
  "summary": {
    "totalExpenses": 1500.00,
    "totalIncome": 3000.00,
    "topCategories": [
      {
        "category": "Food & Dining",
        "amount": 450.00,
        "percentage": 30.0,
        "trend": "up"
      }
    ],
    "monthlyTrend": "stable",
    "spendingPattern": "description",
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "insights": [
    {
      "type": "success|warning|info|tip",
      "title": "Brief title",
      "description": "Detailed explanation",
      "impact": "high|medium|low",
      "actionable": true,
      "category": "spending|saving|investing|budgeting"
    }
  ],
  "anomalies": [
    {
      "type": "duplicate|unusual_amount|suspicious_pattern|missing_data",
      "description": "Anomaly description",
      "severity": "low|medium|high",
      "transactions": [affected transactions],
      "suggestion": "Recommended action"
    }
  ],
  "confidence": 0.85
}

${enableAnomalyDetection ? 'ANOMALY DETECTION: Enabled - Look for duplicates, unusual amounts, suspicious patterns' : ''}
${enableInsights ? 'INSIGHTS GENERATION: Enabled - Provide actionable financial advice' : ''}
${enableSummarization ? 'SUMMARIZATION: Enabled - Include comprehensive summary' : ''}

IGNORE: Headers, footers, page numbers, totals, balances, non-transaction text.`;
  }

  private parseAdvancedResponse(content: string): TransactionAnalysis {
    try {
      // Clean the response and extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        transactions: parsed.transactions || [],
        summary: parsed.summary || {
          totalExpenses: 0,
          totalIncome: 0,
          topCategories: [],
          monthlyTrend: 'stable',
          spendingPattern: '',
          recommendations: []
        },
        insights: parsed.insights || [],
        anomalies: parsed.anomalies || [],
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Failed to parse advanced AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private parseInsightsResponse(content: string): AIInsight[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse insights response:', error);
      return [];
    }
  }

  private parseAnomaliesResponse(content: string): Anomaly[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse anomalies response:', error);
      return [];
    }
  }

  private parseSummaryResponse(content: string): {
    summary: string;
    keyStats: any;
    recommendations: string[];
  } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in summary response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse summary response:', error);
      throw new Error('Invalid summary response format');
    }
  }
}

// Export singleton instance
export const geminiAI = new GeminiAIService();
export default geminiAI;
