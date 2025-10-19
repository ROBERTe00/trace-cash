/**
 * Definitive PDF Bank Statement Parser
 * Unified system with robust text extraction, OCR fallback, and AI analysis
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { geminiAI } from './geminiAI';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface DefinitiveParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  metadata: {
    fileName: string;
    fileType: 'pdf';
    fileSize: number;
    pageCount: number;
    processingTime: number;
    confidence: number;
    method: 'pdfjs' | 'ocr' | 'hybrid';
    language: string;
    bankDetected: string;
  };
  errors: string[];
  warnings: string[];
  rawText: string;
  aiAnalysis?: {
    summary: string;
    insights: string[];
    anomalies: string[];
  };
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee?: string;
  merchant?: string;
  location?: string;
  confidence: number;
  tags: string[];
  raw?: string;
}

class DefinitivePDFParser {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly TIMEOUT = 300000; // 5 minutes
  private readonly MIN_TEXT_LENGTH = 100; // Minimum text length for valid extraction

  /**
   * Main parsing method - handles the complete workflow
   */
  async parseBankStatement(
    file: File,
    options: {
      enableOCR?: boolean;
      enableAI?: boolean;
      language?: 'auto' | 'it' | 'en';
      onProgress?: (progress: number, stage: string) => void;
    } = {}
  ): Promise<DefinitiveParseResult> {
    const startTime = Date.now();
    const {
      enableOCR = true,
      enableAI = true,
      language = 'auto',
      onProgress
    } = options;

    const result: DefinitiveParseResult = {
      success: false,
      transactions: [],
      metadata: {
        fileName: file.name,
        fileType: 'pdf',
        fileSize: file.size,
        pageCount: 0,
        processingTime: 0,
        confidence: 0,
        method: 'pdfjs',
        language: 'unknown',
        bankDetected: 'Unknown'
      },
      errors: [],
      warnings: [],
      rawText: ''
    };

    try {
      console.log(`🚀 [Definitive Parser] Starting processing: ${file.name}`);
      onProgress?.(10, 'Validating file...');

      // Step 1: File validation
      this.validateFile(file, result);
      if (result.errors.length > 0) {
        return result;
      }

      // Step 2: Text extraction with fallback chain
      onProgress?.(20, 'Extracting text from PDF...');
      const textResult = await this.extractTextWithFallback(file, enableOCR, onProgress);
      
      result.rawText = textResult.text;
      result.metadata.pageCount = textResult.pageCount;
      result.metadata.method = textResult.method;
      result.metadata.confidence = textResult.confidence;
      result.metadata.language = textResult.language;

      if (result.rawText.length < this.MIN_TEXT_LENGTH) {
        result.errors.push('Insufficient text extracted from PDF. File might be corrupted or image-only.');
        return result;
      }

      console.log(`✅ [Definitive Parser] Text extracted: ${result.rawText.length} chars via ${textResult.method}`);

      // Step 3: Bank detection and language detection
      onProgress?.(60, 'Detecting bank and language...');
      const detectionResult = await this.detectBankAndLanguage(result.rawText);
      result.metadata.bankDetected = detectionResult.bank;
      result.metadata.language = detectionResult.language;

      // Step 4: AI Analysis and transaction extraction
      if (enableAI) {
        onProgress?.(70, 'Analyzing with AI...');
        const aiResult = await this.processWithAI(result.rawText, detectionResult, onProgress);
        
        result.transactions = aiResult.transactions;
        result.aiAnalysis = aiResult.analysis;
        result.metadata.confidence = Math.max(result.metadata.confidence, aiResult.confidence);
        
        if (aiResult.errors.length > 0) {
          result.warnings.push(...aiResult.errors);
        }
      } else {
        // Fallback to pattern-based extraction
        onProgress?.(70, 'Extracting transactions with patterns...');
        result.transactions = this.extractTransactionsWithPatterns(result.rawText, detectionResult);
        result.metadata.confidence = Math.max(result.metadata.confidence, 0.6);
      }

      // Step 5: Validation and cleanup
      onProgress?.(90, 'Validating results...');
      this.validateAndCleanTransactions(result);

      result.success = result.transactions.length > 0;
      result.metadata.processingTime = Date.now() - startTime;

      console.log(`🎉 [Definitive Parser] Processing complete: ${result.transactions.length} transactions found`);

      return result;

    } catch (error) {
      console.error('❌ [Definitive Parser] Critical error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      result.metadata.processingTime = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Extract text with fallback chain: PDF.js → OCR → Hybrid
   */
  private async extractTextWithFallback(
    file: File,
    enableOCR: boolean,
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{
    text: string;
    pageCount: number;
    method: 'pdfjs' | 'ocr' | 'hybrid';
    confidence: number;
    language: string;
  }> {
    // Method 1: PDF.js text extraction
    onProgress?.(25, 'Trying PDF.js extraction...');
    try {
      const pdfjsResult = await this.extractWithPDFJS(file);
      
      if (pdfjsResult.text.length > this.MIN_TEXT_LENGTH && this.isTextQualityGood(pdfjsResult.text)) {
        console.log(`✅ [PDF.js] Success: ${pdfjsResult.text.length} chars`);
        return {
          text: pdfjsResult.text,
          pageCount: pdfjsResult.pageCount,
          method: 'pdfjs',
          confidence: this.calculateTextConfidence(pdfjsResult.text),
          language: this.detectLanguage(pdfjsResult.text)
        };
      }
      
      console.log(`⚠️ [PDF.js] Insufficient quality: ${pdfjsResult.text.length} chars`);
    } catch (error) {
      console.log(`❌ [PDF.js] Failed:`, error);
    }

    // Method 2: OCR fallback
    if (enableOCR) {
      onProgress?.(40, 'Trying OCR extraction...');
      try {
        const ocrResult = await this.extractWithOCR(file);
        
        if (ocrResult.text.length > this.MIN_TEXT_LENGTH) {
          console.log(`✅ [OCR] Success: ${ocrResult.text.length} chars`);
          return {
            text: ocrResult.text,
            pageCount: ocrResult.pageCount,
            method: 'ocr',
            confidence: ocrResult.confidence,
            language: ocrResult.language
          };
        }
        
        console.log(`⚠️ [OCR] Insufficient text: ${ocrResult.text.length} chars`);
      } catch (error) {
        console.log(`❌ [OCR] Failed:`, error);
      }
    }

    // Method 3: Hybrid approach (combine both)
    onProgress?.(50, 'Trying hybrid extraction...');
    try {
      const pdfjsResult = await this.extractWithPDFJS(file);
      const ocrResult = enableOCR ? await this.extractWithOCR(file) : null;
      
      const combinedText = this.combineExtractionResults(pdfjsResult.text, ocrResult?.text || '');
      
      if (combinedText.length > this.MIN_TEXT_LENGTH) {
        console.log(`✅ [Hybrid] Success: ${combinedText.length} chars`);
        return {
          text: combinedText,
          pageCount: Math.max(pdfjsResult.pageCount, ocrResult?.pageCount || 0),
          method: 'hybrid',
          confidence: Math.max(
            this.calculateTextConfidence(pdfjsResult.text),
            ocrResult?.confidence || 0
          ),
          language: this.detectLanguage(combinedText)
        };
      }
    } catch (error) {
      console.log(`❌ [Hybrid] Failed:`, error);
    }

    throw new Error('All text extraction methods failed. PDF might be corrupted or password-protected.');
  }

  /**
   * Extract text using PDF.js
   */
  private async extractWithPDFJS(file: File): Promise<{
    text: string;
    pageCount: number;
  }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      if (pageText) {
        fullText += `\n=== PAGE ${pageNum} ===\n${pageText}\n`;
      }
    }
    
    return {
      text: fullText.trim(),
      pageCount
    };
  }

  /**
   * Extract text using OCR with multi-language support
   */
  private async extractWithOCR(file: File): Promise<{
    text: string;
    pageCount: number;
    confidence: number;
    language: string;
  }> {
    console.log('🔍 [OCR] Starting Tesseract processing...');
    
    // Create worker with multiple language support
    const worker = await Tesseract.createWorker('eng+ita', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`🔍 [OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const imageUrl = URL.createObjectURL(blob);

      const { data: { text, confidence } } = await worker.recognize(imageUrl);
      
      URL.revokeObjectURL(imageUrl);
      
      const detectedLanguage = this.detectLanguage(text);
      
      return {
        text: text.trim(),
        pageCount: 1, // OCR treats PDF as single image
        confidence: confidence / 100,
        language: detectedLanguage
      };
      
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Detect bank and language using AI
   */
  private async detectBankAndLanguage(text: string): Promise<{
    bank: string;
    language: string;
  }> {
    try {
      const prompt = `Analyze this bank statement text and return ONLY a JSON object with:
1. "bank": bank name (e.g., "Intesa Sanpaolo", "UniCredit", "Poste Italiane", "BNL", "Unknown")
2. "language": detected language ("it" for Italian, "en" for English, "unknown")

Text sample: ${text.substring(0, 1000)}

Return ONLY: {"bank": "Bank Name", "language": "it"}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        
        try {
          const result = JSON.parse(content);
          return {
            bank: result.bank || 'Unknown',
            language: result.language || 'unknown'
          };
        } catch {
          // Fallback parsing
          return this.parseBankAndLanguageFallback(content);
        }
      }
    } catch (error) {
      console.log('⚠️ [AI Detection] Failed, using fallback:', error);
    }

    // Fallback to pattern-based detection
    return this.detectBankAndLanguageFallback(text);
  }

  /**
   * Process with AI for transaction extraction
   */
  private async processWithAI(
    text: string,
    detection: { bank: string; language: string },
    onProgress?: (progress: number, stage: string) => void
  ): Promise<{
    transactions: ParsedTransaction[];
    analysis: {
      summary: string;
      insights: string[];
      anomalies: string[];
    };
    confidence: number;
    errors: string[];
  }> {
    try {
      onProgress?.(75, 'Sending to AI for analysis...');
      
      const prompt = `Extract ALL transactions from this ${detection.bank} bank statement (${detection.language} language).

CRITICAL RULES:
1. Extract EVERY transaction you can find
2. Return ONLY a valid JSON array
3. Negative amounts for expenses, positive for income
4. Date format: YYYY-MM-DD
5. Include confidence score (0.0-1.0) for each transaction
6. Categorize appropriately

CATEGORIES: Food & Dining, Transportation, Shopping, Entertainment, Healthcare, Bills & Utilities, Income, Investments, Other

OUTPUT FORMAT:
[
  {
    "date": "YYYY-MM-DD",
    "description": "Transaction description",
    "amount": -99.99,
    "category": "Food & Dining",
    "payee": "Merchant name",
    "confidence": 0.85,
    "tags": ["tag1", "tag2"]
  }
]

Bank statement text:
${text}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 8000
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      
      onProgress?.(85, 'Parsing AI response...');
      
      // Parse AI response
      const transactions = this.parseAIResponse(content);
      
      // Generate analysis
      const analysis = await this.generateAnalysis(transactions, detection);
      
      return {
        transactions,
        analysis,
        confidence: this.calculateOverallConfidence(transactions),
        errors: []
      };

    } catch (error) {
      console.error('❌ [AI Processing] Error:', error);
      return {
        transactions: [],
        analysis: {
          summary: 'AI analysis failed',
          insights: [],
          anomalies: []
        },
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'AI processing failed']
      };
    }
  }

  /**
   * Utility methods
   */
  private validateFile(file: File, result: DefinitiveParseResult): void {
    if (file.size > this.MAX_FILE_SIZE) {
      result.errors.push(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      result.errors.push('Only PDF files are supported');
    }
    
    if (file.size === 0) {
      result.errors.push('File is empty');
    }
  }

  private isTextQualityGood(text: string): boolean {
    // Check for corrupted characters
    const corruptedChars = text.match(/[\x00-\x1F\x7F-\xFF]/g)?.length || 0;
    const corruptionRatio = corruptedChars / text.length;
    
    // Check for sufficient readable content
    const readableChars = text.replace(/[^a-zA-Z0-9\s]/g, '').length;
    const readabilityRatio = readableChars / text.length;
    
    return corruptionRatio < 0.1 && readabilityRatio > 0.5;
  }

  private calculateTextConfidence(text: string): number {
    if (text.length < 100) return 0.1;
    
    let confidence = 0.5;
    
    // Check for financial keywords
    const financialKeywords = /(banca|bank|conto|account|saldo|movimento|transazione|transaction|balance|statement)/i;
    if (financialKeywords.test(text)) confidence += 0.2;
    
    // Check for dates
    const hasDates = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text);
    if (hasDates) confidence += 0.2;
    
    // Check for amounts
    const hasAmounts = /\d+[,\.]\d{2}/.test(text);
    if (hasAmounts) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const italianWords = /(banca|conto|saldo|movimento|transazione|euro|€)/i;
    const englishWords = /(bank|account|balance|transaction|statement|dollar|\$)/i;
    
    if (italianWords.test(text)) return 'it';
    if (englishWords.test(text)) return 'en';
    return 'unknown';
  }

  private combineExtractionResults(pdfjsText: string, ocrText: string): string {
    // Combine both extractions, prioritizing longer and cleaner text
    if (pdfjsText.length > ocrText.length * 1.5) {
      return pdfjsText + '\n\n[OCR Supplement]\n' + ocrText;
    } else if (ocrText.length > pdfjsText.length * 1.5) {
      return ocrText + '\n\n[PDF.js Supplement]\n' + pdfjsText;
    } else {
      return pdfjsText + '\n\n' + ocrText;
    }
  }

  private parseAIResponse(content: string): ParsedTransaction[] {
    try {
      // Clean the response
      const cleaned = content.replace(/```json|```/g, '').trim();
      const transactions = JSON.parse(cleaned);
      
      if (!Array.isArray(transactions)) {
        throw new Error('Response is not an array');
      }
      
      return transactions.map((t: any) => ({
        date: t.date || '',
        description: t.description || '',
        amount: parseFloat(t.amount) || 0,
        category: t.category || 'Other',
        payee: t.payee || '',
        merchant: t.merchant || t.payee || '',
        location: t.location || '',
        confidence: parseFloat(t.confidence) || 0.5,
        tags: Array.isArray(t.tags) ? t.tags : [],
        raw: JSON.stringify(t)
      }));
      
    } catch (error) {
      console.error('❌ [AI Response Parsing] Error:', error);
      return [];
    }
  }

  private async generateAnalysis(
    transactions: ParsedTransaction[],
    detection: { bank: string; language: string }
  ): Promise<{
    summary: string;
    insights: string[];
    anomalies: string[];
  }> {
    if (transactions.length === 0) {
      return {
        summary: 'No transactions found',
        insights: [],
        anomalies: []
      };
    }

    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const categories = [...new Set(transactions.map(t => t.category))];
    
    return {
      summary: `Found ${transactions.length} transactions from ${detection.bank}. Total expenses: €${totalExpenses.toFixed(2)}, Total income: €${totalIncome.toFixed(2)}`,
      insights: [
        `Top category: ${categories[0] || 'Unknown'}`,
        `Average transaction: €${(Math.abs(totalExpenses + totalIncome) / transactions.length).toFixed(2)}`,
        `Transaction confidence: ${(transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length * 100).toFixed(0)}%`
      ],
      anomalies: this.detectAnomalies(transactions)
    };
  }

  private detectAnomalies(transactions: ParsedTransaction[]): string[] {
    const anomalies: string[] = [];
    
    // Check for duplicate transactions
    const descriptions = transactions.map(t => t.description.toLowerCase());
    const duplicates = descriptions.filter((desc, index) => descriptions.indexOf(desc) !== index);
    if (duplicates.length > 0) {
      anomalies.push(`Found ${duplicates.length} potential duplicate transactions`);
    }
    
    // Check for unusually high amounts
    const amounts = transactions.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const highAmounts = amounts.filter(amt => amt > avgAmount * 5);
    if (highAmounts.length > 0) {
      anomalies.push(`Found ${highAmounts.length} unusually high amount transactions`);
    }
    
    return anomalies;
  }

  private calculateOverallConfidence(transactions: ParsedTransaction[]): number {
    if (transactions.length === 0) return 0;
    
    const avgConfidence = transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length;
    const completenessScore = transactions.filter(t => t.date && t.description && t.amount !== 0).length / transactions.length;
    
    return (avgConfidence + completenessScore) / 2;
  }

  private extractTransactionsWithPatterns(
    text: string,
    detection: { bank: string; language: string }
  ): ParsedTransaction[] {
    // Pattern-based extraction as fallback
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const transaction = this.parseTransactionLine(line);
      if (transaction) {
        transactions.push(transaction);
      }
    }
    
    return transactions;
  }

  private parseTransactionLine(line: string): ParsedTransaction | null {
    // Simple pattern matching for transaction lines
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const amountPattern = /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/;
    
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);
    
    if (dateMatch && amountMatch && line.length > 10) {
      return {
        date: this.normalizeDate(dateMatch[1]),
        description: line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim(),
        amount: this.normalizeAmount(amountMatch[1]),
        category: 'Other',
        confidence: 0.6,
        tags: [],
        raw: line
      };
    }
    
    return null;
  }

  private normalizeDate(dateStr: string): string {
    try {
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        let day, month, year;
        
        if (parts[0].length === 4) {
          [year, month, day] = parts;
        } else {
          [day, month, year] = parts;
        }
        
        if (year.length === 2) {
          year = '20' + year;
        }
        
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('Date normalization error:', error);
    }
    
    return dateStr;
  }

  private normalizeAmount(amountStr: string): number {
    try {
      let cleaned = amountStr.replace(/[€$£¥,\s]/g, '');
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
      
      const isNegative = cleaned.includes('-') || amountStr.includes('(');
      const numericValue = parseFloat(cleaned.replace(/[()]/g, ''));
      
      if (isNaN(numericValue)) return 0;
      
      return isNegative ? -Math.abs(numericValue) : Math.abs(numericValue);
    } catch (error) {
      console.error('Amount normalization error:', error);
      return 0;
    }
  }

  private validateAndCleanTransactions(result: DefinitiveParseResult): void {
    // Remove invalid transactions
    result.transactions = result.transactions.filter(t => 
      t.date && 
      t.description && 
      t.amount !== 0 &&
      t.confidence > 0.1
    );
    
    // Sort by date
    result.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Add warnings for low confidence
    const lowConfidenceCount = result.transactions.filter(t => t.confidence < 0.5).length;
    if (lowConfidenceCount > 0) {
      result.warnings.push(`${lowConfidenceCount} transactions have low confidence scores`);
    }
  }

  private detectBankAndLanguageFallback(text: string): { bank: string; language: string } {
    const banks = [
      { name: 'Intesa Sanpaolo', pattern: /intesa\s+sanpaolo/i },
      { name: 'UniCredit', pattern: /unicredit/i },
      { name: 'Poste Italiane', pattern: /poste\s+italiane/i },
      { name: 'BNL', pattern: /bnl/i },
      { name: 'Banco BPM', pattern: /banco\s+bpm/i }
    ];
    
    const detectedBank = banks.find(bank => bank.pattern.test(text))?.name || 'Unknown';
    const language = this.detectLanguage(text);
    
    return { bank: detectedBank, language };
  }

  private parseBankAndLanguageFallback(content: string): { bank: string; language: string } {
    // Try to extract bank and language from AI response even if JSON parsing failed
    const bankMatch = content.match(/"bank":\s*"([^"]+)"/i);
    const langMatch = content.match(/"language":\s*"([^"]+)"/i);
    
    return {
      bank: bankMatch?.[1] || 'Unknown',
      language: langMatch?.[1] || 'unknown'
    };
  }
}

// Export singleton instance
export const definitivePDFParser = new DefinitivePDFParser();
export default definitivePDFParser;
