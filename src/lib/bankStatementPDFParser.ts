/**
 * Advanced PDF Parser for Bank Statements
 * Robust text extraction with OCR fallback for scanned documents
 */

import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFParseResult {
  text: string;
  structuredData: any[];
  pageCount: number;
  confidence: number;
  method: 'text' | 'ocr' | 'hybrid';
  errors: string[];
}

export interface BankStatementPattern {
  bankName: string;
  patterns: {
    date: RegExp[];
    amount: RegExp[];
    description: RegExp[];
    transaction: RegExp[];
  };
  pageStructure: {
    headerPattern?: RegExp;
    footerPattern?: RegExp;
    transactionStart?: RegExp;
    transactionEnd?: RegExp;
  };
}

class BankStatementPDFParser {
  private readonly bankPatterns: BankStatementPattern[] = [
    {
      bankName: 'Intesa Sanpaolo',
      patterns: {
        date: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
          /(\d{2}\/\d{2}\/\d{4})/g
        ],
        amount: [
          /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
          /(\d+,\d{2})/g
        ],
        description: [
          /([A-Z][A-Z\s]{10,50})/g,
          /([A-Za-z\s]{10,50})/g
        ],
        transaction: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([A-Za-z\s]{10,50})\s+([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g
        ]
      },
      pageStructure: {
        headerPattern: /INTESA\s+SANPAOLO/i,
        transactionStart: /DATA\s+DESCRIZIONE\s+IMPORTO/i,
        transactionEnd: /TOTALE|SALDO|RIEPILOGO/i
      }
    },
    {
      bankName: 'UniCredit',
      patterns: {
        date: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
          /(\d{2}\/\d{2}\/\d{4})/g
        ],
        amount: [
          /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
          /(\d+,\d{2})/g
        ],
        description: [
          /([A-Z][A-Z\s]{10,50})/g,
          /([A-Za-z\s]{10,50})/g
        ],
        transaction: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([A-Za-z\s]{10,50})\s+([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g
        ]
      },
      pageStructure: {
        headerPattern: /UNICREDIT/i,
        transactionStart: /DATA\s+DESCRIZIONE\s+IMPORTO/i,
        transactionEnd: /TOTALE|SALDO|RIEPILOGO/i
      }
    },
    {
      bankName: 'Poste Italiane',
      patterns: {
        date: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
          /(\d{2}\/\d{2}\/\d{4})/g
        ],
        amount: [
          /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
          /(\d+,\d{2})/g
        ],
        description: [
          /([A-Z][A-Z\s]{10,50})/g,
          /([A-Za-z\s]{10,50})/g
        ],
        transaction: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([A-Za-z\s]{10,50})\s+([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g
        ]
      },
      pageStructure: {
        headerPattern: /POSTE\s+ITALIANE/i,
        transactionStart: /DATA\s+DESCRIZIONE\s+IMPORTO/i,
        transactionEnd: /TOTALE|SALDO|RIEPILOGO/i
      }
    },
    {
      bankName: 'BNL',
      patterns: {
        date: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g,
          /(\d{2}\/\d{2}\/\d{4})/g
        ],
        amount: [
          /([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
          /(\d+,\d{2})/g
        ],
        description: [
          /([A-Z][A-Z\s]{10,50})/g,
          /([A-Za-z\s]{10,50})/g
        ],
        transaction: [
          /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s+([A-Za-z\s]{10,50})\s+([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g
        ]
      },
      pageStructure: {
        headerPattern: /BNL/i,
        transactionStart: /DATA\s+DESCRIZIONE\s+IMPORTO/i,
        transactionEnd: /TOTALE|SALDO|RIEPILOGO/i
      }
    }
  ];

  /**
   * Main PDF parsing method
   */
  async parsePDF(file: File, enableOCR: boolean = true): Promise<PDFParseResult> {
    const result: PDFParseResult = {
      text: '',
      structuredData: [],
      pageCount: 0,
      confidence: 0,
      method: 'text',
      errors: []
    };

    try {
      console.log(`📄 Starting PDF parsing for: ${file.name}`);
      
      // Method 1: Try PDF.js text extraction first
      const textResult = await this.extractTextWithPDFJS(file);
      
      if (textResult.success && textResult.text.length > 100) {
        result.text = textResult.text;
        result.pageCount = textResult.pageCount;
        result.method = 'text';
        result.confidence = this.calculateTextConfidence(textResult.text);
        
        console.log(`✅ PDF.js extraction successful: ${textResult.text.length} chars, ${textResult.pageCount} pages`);
      } else {
        console.log(`⚠️ PDF.js extraction failed or insufficient text: ${textResult.text.length} chars`);
        
        if (enableOCR) {
          console.log(`🔍 Falling back to OCR...`);
          const ocrResult = await this.extractTextWithOCR(file);
          
          result.text = ocrResult.text;
          result.pageCount = ocrResult.pageCount;
          result.method = 'ocr';
          result.confidence = ocrResult.confidence;
          
          console.log(`✅ OCR extraction successful: ${ocrResult.text.length} chars`);
        } else {
          throw new Error('PDF text extraction failed and OCR is disabled');
        }
      }

      // Extract structured data from text
      result.structuredData = this.extractStructuredData(result.text);
      
      console.log(`📊 Extracted ${result.structuredData.length} potential transactions`);
      
      return result;

    } catch (error) {
      console.error('PDF parsing error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Extract text using PDF.js
   */
  private async extractTextWithPDFJS(file: File): Promise<{
    success: boolean;
    text: string;
    pageCount: number;
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `\n=== PAGE ${pageNum} ===\n${pageText}\n`;
      }
      
      return {
        success: true,
        text: fullText,
        pageCount
      };
      
    } catch (error) {
      console.error('PDF.js extraction error:', error);
      return {
        success: false,
        text: '',
        pageCount: 0
      };
    }
  }

  /**
   * Extract text using OCR (Tesseract.js)
   */
  private async extractTextWithOCR(file: File): Promise<{
    text: string;
    pageCount: number;
    confidence: number;
  }> {
    try {
      console.log('🔍 Starting OCR processing...');
      
      const worker = await Tesseract.createWorker('eng+ita', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const imageUrl = URL.createObjectURL(blob);

      const { data: { text, confidence } } = await worker.recognize(imageUrl);
      
      URL.revokeObjectURL(imageUrl);
      await worker.terminate();

      return {
        text,
        pageCount: 1, // OCR treats PDF as single image
        confidence: confidence / 100 // Normalize to 0-1
      };
      
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate confidence based on text quality
   */
  private calculateTextConfidence(text: string): number {
    if (text.length < 100) return 0.1;
    
    // Check for common bank statement patterns
    const hasDates = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text);
    const hasAmounts = /\d+[,\.]\d{2}/.test(text);
    const hasBankKeywords = /(banca|bank|conto|account|saldo|movimento|transazione)/i.test(text);
    
    let confidence = 0.5; // Base confidence
    
    if (hasDates) confidence += 0.2;
    if (hasAmounts) confidence += 0.2;
    if (hasBankKeywords) confidence += 0.1;
    
    // Check for corrupted characters
    const corruptedChars = text.match(/[\x00-\x1F\x7F-\xFF]/g)?.length || 0;
    const corruptionRatio = corruptedChars / text.length;
    
    if (corruptionRatio > 0.1) {
      confidence -= 0.3;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Extract structured data from text
   */
  private extractStructuredData(text: string): any[] {
    const transactions: any[] = [];
    
    // Detect bank type
    const bankPattern = this.detectBankPattern(text);
    
    if (!bankPattern) {
      console.log('⚠️ Could not detect bank pattern, using generic extraction');
      return this.extractGenericTransactions(text);
    }
    
    console.log(`🏦 Detected bank: ${bankPattern.bankName}`);
    
    // Extract transactions using bank-specific patterns
    const lines = text.split('\n');
    let inTransactionSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering transaction section
      if (bankPattern.pageStructure.transactionStart && 
          bankPattern.pageStructure.transactionStart.test(line)) {
        inTransactionSection = true;
        continue;
      }
      
      // Check if we're leaving transaction section
      if (bankPattern.pageStructure.transactionEnd && 
          bankPattern.pageStructure.transactionEnd.test(line)) {
        inTransactionSection = false;
        continue;
      }
      
      // Extract transactions from lines
      if (inTransactionSection || this.looksLikeTransaction(line)) {
        const transaction = this.parseTransactionLine(line, bankPattern);
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
    
    return transactions;
  }

  /**
   * Detect which bank pattern matches the text
   */
  private detectBankPattern(text: string): BankStatementPattern | null {
    for (const pattern of this.bankPatterns) {
      if (pattern.pageStructure.headerPattern && 
          pattern.pageStructure.headerPattern.test(text)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Check if a line looks like a transaction
   */
  private looksLikeTransaction(line: string): boolean {
    // Must have date and amount
    const hasDate = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(line);
    const hasAmount = /\d+[,\.]\d{2}/.test(line);
    const hasDescription = line.length > 10;
    
    return hasDate && hasAmount && hasDescription;
  }

  /**
   * Parse a single transaction line
   */
  private parseTransactionLine(line: string, bankPattern: BankStatementPattern): any | null {
    try {
      // Try bank-specific transaction pattern first
      for (const pattern of bankPattern.patterns.transaction) {
        const match = line.match(pattern);
        if (match) {
          return {
            date: this.normalizeDate(match[1]),
            description: match[2].trim(),
            amount: this.normalizeAmount(match[3]),
            raw: line
          };
        }
      }
      
      // Fallback to generic parsing
      const dateMatch = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
      const amountMatch = line.match(/([+-]?\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
      
      if (dateMatch && amountMatch) {
        const date = this.normalizeDate(dateMatch[1]);
        const amount = this.normalizeAmount(amountMatch[1]);
        const description = line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
        
        return {
          date,
          description,
          amount,
          raw: line
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing transaction line:', line, error);
      return null;
    }
  }

  /**
   * Extract transactions using generic patterns
   */
  private extractGenericTransactions(text: string): any[] {
    const transactions: any[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (this.looksLikeTransaction(line)) {
        const transaction = this.parseTransactionLine(line, this.bankPatterns[0]); // Use first pattern as fallback
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }
    
    return transactions;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string): string {
    try {
      // Handle different date formats
      const formats = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, // DD/MM/YYYY or DD-MM-YYYY
        /(\d{2,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/  // YYYY/MM/DD or YYYY-MM-DD
      ];
      
      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          let day, month, year;
          
          if (format.source.includes('(\\d{2,4})')) {
            // YYYY/MM/DD format
            [, year, month, day] = match;
          } else {
            // DD/MM/YYYY format
            [, day, month, year] = match;
          }
          
          // Normalize year
          if (year.length === 2) {
            year = '20' + year;
          }
          
          // Normalize month and day
          month = month.padStart(2, '0');
          day = day.padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        }
      }
      
      return dateStr; // Return original if can't parse
    } catch (error) {
      console.error('Date normalization error:', error);
      return dateStr;
    }
  }

  /**
   * Normalize amount to number
   */
  private normalizeAmount(amountStr: string): number {
    try {
      // Remove currency symbols and spaces
      let cleaned = amountStr.replace(/[€$£¥,\s]/g, '');
      
      // Handle Italian decimal format (comma as decimal separator)
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
      
      // Handle negative amounts
      const isNegative = cleaned.includes('-') || amountStr.includes('(');
      
      const numericValue = parseFloat(cleaned.replace(/[()]/g, ''));
      
      if (isNaN(numericValue)) return 0;
      
      return isNegative ? -Math.abs(numericValue) : Math.abs(numericValue);
    } catch (error) {
      console.error('Amount normalization error:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const bankStatementPDFParser = new BankStatementPDFParser();
export default bankStatementPDFParser;
