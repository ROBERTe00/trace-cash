/**
 * Advanced File Parsing System
 * Robust parsing for PDF, Excel, and CSV files with comprehensive error handling
 */

import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import { geminiAI, ParsedTransaction } from './geminiAI';

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  metadata: {
    fileName: string;
    fileType: 'pdf' | 'csv' | 'excel';
    fileSize: number;
    pageCount?: number;
    rowCount?: number;
    processingTime: number;
    confidence: number;
  };
  errors: string[];
  warnings: string[];
}

export interface ParseOptions {
  enableOCR?: boolean;
  enableAI?: boolean;
  customCategories?: string[];
  maxFileSize?: number; // in MB
  timeout?: number; // in seconds
}

class FileParserService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly TIMEOUT = 180; // 3 minutes

  /**
   * Main parsing method - handles all file types
   */
  async parseFile(
    file: File,
    options: ParseOptions = {}
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const {
      enableOCR = true,
      enableAI = true,
      customCategories = [],
      maxFileSize = this.MAX_FILE_SIZE,
      timeout = this.TIMEOUT
    } = options;

    const result: ParseResult = {
      success: false,
      transactions: [],
      metadata: {
        fileName: file.name,
        fileType: this.getFileType(file.name),
        fileSize: file.size,
        processingTime: 0,
        confidence: 0
      },
      errors: [],
      warnings: []
    };

    try {
      // Validation
      this.validateFile(file, maxFileSize, result);

      if (result.errors.length > 0) {
        return result;
      }

      // Parse based on file type
      let rawContent: string;
      let structuredData: any[] = [];

      switch (result.metadata.fileType) {
        case 'csv':
          rawContent = await this.parseCSV(file);
          structuredData = this.parseCSVToStructured(rawContent);
          break;
        case 'excel':
          structuredData = await this.parseExcel(file);
          rawContent = this.structuredToText(structuredData);
          break;
        case 'pdf':
          const pdfResult = await this.parsePDF(file, enableOCR);
          rawContent = pdfResult.text;
          structuredData = pdfResult.structuredData;
          result.metadata.pageCount = pdfResult.pageCount;
          break;
        default:
          throw new Error(`Unsupported file type: ${result.metadata.fileType}`);
      }

      result.metadata.rowCount = structuredData.length;

      // AI Processing if enabled
      if (enableAI && rawContent) {
        const aiResult = await this.processWithAI(
          rawContent,
          result.metadata.fileType,
          customCategories,
          timeout
        );
        
        result.transactions = aiResult.transactions;
        result.metadata.confidence = aiResult.confidence;
        
        if (aiResult.errors.length > 0) {
          result.warnings.push(...aiResult.errors);
        }
      } else {
        // Fallback to structured parsing
        result.transactions = this.parseStructuredData(structuredData);
        result.metadata.confidence = 0.7; // Medium confidence for non-AI parsing
      }

      result.success = result.transactions.length > 0;
      result.metadata.processingTime = Date.now() - startTime;

      // Add warnings for low confidence
      if (result.metadata.confidence < 0.6) {
        result.warnings.push('Low confidence parsing - please verify transactions');
      }

      if (result.transactions.length === 0) {
        result.errors.push('No transactions found in file');
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown parsing error');
      result.metadata.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Enhanced CSV parsing with multiple delimiters and encoding detection
   */
  private async parseCSV(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          reject(new Error('Failed to read CSV file'));
          return;
        }
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read CSV file'));
      };
      
      // Try different encodings
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parse CSV content to structured data
   */
  private parseCSVToStructured(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    // Detect delimiter
    const delimiter = this.detectDelimiter(lines[0]);
    
    // Parse header
    const headers = lines[0].split(delimiter).map(h => 
      h.trim().toLowerCase().replace(/"/g, '').replace(/'/g, '')
    );

    // Find column indices
    const columnMap = this.mapColumns(headers);
    
    // Parse data rows
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= headers.length) {
        const row: any = {};
        Object.entries(columnMap).forEach(([key, index]) => {
          row[key] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  }

  /**
   * Enhanced Excel parsing with multiple sheets support
   */
  private async parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read Excel file'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'array' });
          const allData: any[] = [];

          // Process all sheets
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: '',
              raw: false
            });

            if (jsonData.length > 1) {
              // Convert to structured format
              const headers = jsonData[0] as string[];
              const columnMap = this.mapColumns(headers.map(h => h.toLowerCase()));
              
              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i] as any[];
                const structuredRow: any = {};
                
                Object.entries(columnMap).forEach(([key, index]) => {
                  structuredRow[key] = row[index] || '';
                });
                
                allData.push(structuredRow);
              }
            }
          });

          resolve(allData);
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Enhanced PDF parsing with OCR fallback
   */
  private async parsePDF(file: File, enableOCR: boolean): Promise<{
    text: string;
    structuredData: any[];
    pageCount: number;
  }> {
    try {
      // Import the robust PDF parser
      const { bankStatementPDFParser } = await import('./bankStatementPDFParser');
      
      console.log(`📄 Starting robust PDF parsing for: ${file.name}`);
      
      const result = await bankStatementPDFParser.parsePDF(file, enableOCR);
      
      console.log(`✅ PDF parsing completed:`, {
        method: result.method,
        confidence: result.confidence,
        textLength: result.text.length,
        pageCount: result.pageCount,
        transactionsFound: result.structuredData.length
      });
      
      return {
        text: result.text,
        structuredData: result.structuredData,
        pageCount: result.pageCount
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`PDF parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process content with AI
   */
  private async processWithAI(
    content: string,
    fileType: string,
    customCategories: string[],
    timeout: number
  ): Promise<{
    transactions: ParsedTransaction[];
    confidence: number;
    errors: string[];
  }> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI processing timeout')), timeout * 1000);
      });

      const aiPromise = geminiAI.processFinancialDocument(
        content,
        fileType as 'pdf' | 'csv' | 'excel',
        'current-user',
        {
          enableAnomalyDetection: true,
          enableInsights: true,
          enableSummarization: true,
          customCategories
        }
      );

      const result = await Promise.race([aiPromise, timeoutPromise]);
      
      return {
        transactions: result.transactions,
        confidence: result.confidence,
        errors: []
      };
    } catch (error) {
      return {
        transactions: [],
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'AI processing failed']
      };
    }
  }

  /**
   * Fallback parsing for structured data
   */
  private parseStructuredData(data: any[]): ParsedTransaction[] {
    return data.map((row, index) => {
      // Handle both CSV/Excel rows and PDF structured data
      const isPDFStructured = row.date && row.description && typeof row.amount === 'number';
      
      if (isPDFStructured) {
        // This is already structured data from PDF parser
        return {
          date: row.date,
          description: row.description,
          amount: row.amount,
          category: this.categorizeTransaction(row.description, row.amount.toString()),
          payee: row.payee || '',
          confidence: 0.8, // Higher confidence for structured PDF data
          merchant: row.merchant || '',
          location: row.location || '',
          tags: []
        };
      } else {
        // This is CSV/Excel row data
        return {
          date: this.parseDate(row.date || row.data || ''),
          description: row.description || row.descrizione || row.details || '',
          amount: this.parseAmount(row.amount || row.importo || row.value || ''),
          category: this.categorizeTransaction(row.description || '', row.amount || ''),
          payee: row.merchant || row.payee || '',
          confidence: 0.7,
          merchant: row.merchant || '',
          location: row.location || '',
          tags: []
        };
      }
    }).filter(t => t.date && t.description && t.amount !== 0);
  }

  /**
   * Utility methods
   */
  private getFileType(fileName: string): 'pdf' | 'csv' | 'excel' {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (extension === 'pdf') return 'pdf';
    if (extension === 'csv') return 'csv';
    if (['xlsx', 'xls'].includes(extension || '')) return 'excel';
    
    throw new Error(`Unsupported file type: ${extension}`);
  }

  private validateFile(file: File, maxSize: number, result: ParseResult): void {
    if (file.size > maxSize) {
      result.errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    const supportedTypes = ['pdf', 'csv', 'xlsx', 'xls'];
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (!extension || !supportedTypes.includes(extension)) {
      result.errors.push(`Unsupported file type. Supported: ${supportedTypes.join(', ')}`);
    }
  }

  private detectDelimiter(firstLine: string): string {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let bestDelimiter = ',';

    delimiters.forEach(delimiter => {
      const count = (firstLine.match(new RegExp(delimiter, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });

    return bestDelimiter;
  }

  private mapColumns(headers: string[]): Record<string, number> {
    const columnMap: Record<string, number> = {};

    // Date columns
    const dateIndices = headers.map((h, i) => ({ h, i }))
      .filter(({ h }) => h.includes('date') || h.includes('data') || h.includes('posting'))
      .map(({ i }) => i);
    
    if (dateIndices.length > 0) {
      columnMap.date = dateIndices[0];
    }

    // Description columns
    const descIndices = headers.map((h, i) => ({ h, i }))
      .filter(({ h }) => h.includes('description') || h.includes('descrizione') || 
                         h.includes('details') || h.includes('merchant') || h.includes('payee'))
      .map(({ i }) => i);
    
    if (descIndices.length > 0) {
      columnMap.description = descIndices[0];
    }

    // Amount columns
    const amountIndices = headers.map((h, i) => ({ h, i }))
      .filter(({ h }) => h.includes('amount') || h.includes('importo') || 
                         h.includes('value') || h.includes('debit') || h.includes('credit'))
      .map(({ i }) => i);
    
    if (amountIndices.length > 0) {
      columnMap.amount = amountIndices[0];
    }

    return columnMap;
  }

  private parseDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Try different date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
      /(\d{2})\.(\d{2})\.(\d{4})/, // DD.MM.YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        // Normalize to YYYY-MM-DD
        if (format.source.includes('(\\d{4})')) {
          return `${part1}-${part2}-${part3}`;
        } else {
          return `${part3}-${part1}-${part2}`;
        }
      }
    }

    return dateStr;
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remove currency symbols and spaces
    const cleaned = amountStr.replace(/[€$£¥,\s]/g, '');
    
    // Handle negative amounts
    const isNegative = cleaned.includes('(') || cleaned.includes('-') || 
                      amountStr.includes('debit') || amountStr.includes('addebito');
    
    const numericValue = parseFloat(cleaned.replace(/[()]/g, ''));
    
    if (isNaN(numericValue)) return 0;
    
    return isNegative ? -Math.abs(numericValue) : Math.abs(numericValue);
  }

  private categorizeTransaction(description: string, amount: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('salary') || desc.includes('stipendio') || desc.includes('income')) {
      return 'Income';
    }
    if (desc.includes('food') || desc.includes('cibo') || desc.includes('restaurant') || desc.includes('supermarket')) {
      return 'Food & Dining';
    }
    if (desc.includes('transport') || desc.includes('trasporto') || desc.includes('gas') || desc.includes('metro')) {
      return 'Transportation';
    }
    if (desc.includes('shopping') || desc.includes('store') || desc.includes('negozio')) {
      return 'Shopping';
    }
    if (desc.includes('entertainment') || desc.includes('cinema') || desc.includes('movie')) {
      return 'Entertainment';
    }
    if (desc.includes('health') || desc.includes('salute') || desc.includes('doctor') || desc.includes('pharmacy')) {
      return 'Healthcare';
    }
    if (desc.includes('bill') || desc.includes('bolletta') || desc.includes('utility') || desc.includes('electric')) {
      return 'Bills & Utilities';
    }
    
    return 'Other';
  }

  private structuredToText(data: any[]): string {
    return data.map(row => 
      Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    ).join('\n');
  }
}

// Export singleton instance
export const fileParser = new FileParserService();
export default fileParser;
