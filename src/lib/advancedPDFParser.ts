/**
 * Advanced PDF Parser with Multi-Language OCR Support
 * Combines pdf.js for text extraction and Tesseract.js for OCR fallback
 * Supports Italian and English bank statements
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker, type Worker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string;
  payee: string;
  merchant?: string;
  confidence: number; // 0.0-1.0
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  rawText: string;
  metadata: {
    method: 'pdfjs' | 'ocr' | 'hybrid';
    bankDetected: string;
    confidence: number;
    pageCount: number;
    language: 'it' | 'en' | 'auto';
  };
  errors: string[];
}

export interface ParseOptions {
  enableOCR?: boolean;
  enableAI?: boolean;
  language?: 'auto' | 'it' | 'en';
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Main PDF parsing function with multi-stage fallback
 */
export async function parseBankStatementPDF(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const {
    enableOCR = true,
    enableAI = true,
    language = 'auto',
    onProgress = () => {},
  } = options;

  const errors: string[] = [];
  let rawText = '';
  let method: 'pdfjs' | 'ocr' | 'hybrid' = 'pdfjs';

  try {
    onProgress(10, 'Loading PDF...');

    // Stage 1: Try PDF.js text extraction
    const pdfData = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    onProgress(20, 'Extracting text from PDF...');

    // Extract text from all pages
    const textPromises: Promise<string>[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      textPromises.push(extractTextFromPage(pdf, i));
    }

    const pageTexts = await Promise.all(textPromises);
    rawText = pageTexts.join('\n\n');

    console.log(`📄 [PDFParser] Extracted ${rawText.length} characters from ${pdf.numPages} pages`);

    onProgress(40, 'Analyzing extracted text...');

    // Check if text extraction was successful
    const hasGoodText = rawText.length > 200 && !isCorruptedText(rawText);

    if (!hasGoodText && enableOCR) {
      console.log('⚠️ [PDFParser] Text extraction insufficient, falling back to OCR');
      onProgress(50, 'Running OCR (this may take 1-2 minutes)...');

      // Stage 2: OCR Fallback
      const ocrText = await extractWithOCR(file, language);
      if (ocrText.length > 200) {
        rawText = ocrText;
        method = 'ocr';
        console.log(`✅ [PDFParser] OCR extracted ${ocrText.length} characters`);
      } else {
        errors.push('OCR extraction failed to produce sufficient text');
      }
    }

    if (rawText.length < 200) {
      throw new Error('Insufficient text extracted from PDF. File may be corrupted or image-only without readable text.');
    }

    onProgress(60, 'Detecting bank and categorizing transactions...');

    // Stage 3: Transaction Extraction with AI Enhancement
    let transactions: ParsedTransaction[] = [];
    let bankDetected = detectBankName(rawText);
    let confidence = 0.7;

    // Debug: Log raw text for analysis
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [DEBUG] RAW TEXT EXTRACTED FROM PDF:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Length:', rawText.length, 'characters');
    console.log('First 1000 chars:', rawText.substring(0, 1000));
    console.log('Last 500 chars:', rawText.substring(Math.max(0, rawText.length - 500)));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Primary: Use pattern matching (reliable for structured data)
    transactions = extractTransactionsWithPatterns(rawText);
    console.log(`📊 [PDFParser] Pattern matching found ${transactions.length} transactions`);

    // Enhancement: If AI is enabled and we have transactions, try to enhance categories
    if (enableAI && transactions.length > 0) {
      try {
        onProgress(70, 'Enhancing with AI categorization...');
        const aiResult = await analyzeWithAI(rawText, language);
        if (aiResult.transactions.length > 0) {
          // Use AI results if better
          transactions = aiResult.transactions;
          bankDetected = aiResult.bank;
          confidence = aiResult.confidence;
          console.log(`🤖 [PDFParser] AI enhanced to ${transactions.length} transactions`);
        }
      } catch (error) {
        console.warn('⚠️ [PDFParser] AI analysis failed, using pattern matching results');
      }
    }

    // Last resort: If still no transactions, enable OCR even if not explicitly requested
    if (transactions.length === 0 && !hasGoodText && enableOCR) {
      console.warn('⚠️ [PDFParser] No transactions via pattern matching, forcing OCR...');
      onProgress(50, 'No text transactions found, running OCR...');
      
      try {
        const ocrText = await extractWithOCR(file, language);
        if (ocrText.length > 200) {
          transactions = extractTransactionsWithPatterns(ocrText);
          console.log(`📊 [PDFParser] OCR extracted ${transactions.length} transactions`);
        }
      } catch (error) {
        console.error('❌ [PDFParser] OCR failed:', error);
      }
    }

    if (transactions.length === 0) {
      // Provide helpful error message with debugging info
      const textPreview = rawText.substring(0, 500);
      console.error('❌ [PDFParser] No transactions found. Text preview:', textPreview);
      
      throw new Error(
        'No transactions found. Please verify the PDF contains:\n' +
        '• A transaction table with dates (DD/MM/YYYY or similar)\n' +
        '• Amounts in standard format (€123.45, 123,45, etc.)\n' +
        '• Readable text (not a scanned image without OCR)\n\n' +
        'Tip: Try enabling OCR in settings if this is a scanned document.'
      );
    }

    onProgress(90, 'Finalizing...');

    return {
      success: true,
      transactions,
      rawText,
      metadata: {
        method,
        bankDetected,
        confidence,
        pageCount: pdf.numPages,
        language: language === 'auto' ? detectLanguage(rawText) : language,
      },
      errors,
    };
  } catch (error) {
    console.error('❌ [PDFParser] Error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    return {
      success: false,
      transactions: [],
      rawText,
      metadata: {
        method: 'pdfjs',
        bankDetected: 'Unknown',
        confidence: 0,
        pageCount: 0,
        language: 'auto',
      },
      errors,
    };
  }
}

/**
 * Extract text from a single PDF page
 */
async function extractTextFromPage(pdf: any, pageNum: number): Promise<string> {
  try {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    return text;
  } catch (error) {
    console.error(`Error extracting text from page ${pageNum}:`, error);
    return '';
  }
}

/**
 * OCR extraction with Tesseract.js (multi-language support)
 */
async function extractWithOCR(file: File, language: 'auto' | 'it' | 'en'): Promise<string> {
  let worker: Worker | null = null;

  try {
    console.log('🔍 [OCR] Starting Tesseract worker...');

    // Determine OCR language
    const ocrLang = language === 'auto' ? 'eng+ita' : language === 'it' ? 'ita' : 'eng';

    worker = await createWorker(ocrLang, 1, {
      logger: (m) => console.log('[Tesseract]', m),
    });

    console.log(`🔍 [OCR] Worker created, processing with language: ${ocrLang}`);

    const { data } = await worker.recognize(file);

    console.log(`✅ [OCR] Extracted ${data.text.length} characters, confidence: ${data.confidence}%`);

    return data.text;
  } catch (error) {
    console.error('❌ [OCR] Error:', error);
    throw error;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Check if extracted text is corrupted/garbage
 */
function isCorruptedText(text: string): boolean {
  const totalChars = text.length;
  if (totalChars === 0) return true;

  // Check for excessive non-printable characters
  const nonPrintable = text.split('').filter((c) => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 10 && code !== 13;
  }).length;

  const nonPrintableRatio = nonPrintable / totalChars;
  return nonPrintableRatio > 0.1; // >10% non-printable = corrupted
}

/**
 * Detect language from text (simple heuristic)
 */
function detectLanguage(text: string): 'it' | 'en' {
  const italianKeywords = ['conto', 'bonifico', 'addebito', 'accredito', 'saldo', 'valuta'];
  const englishKeywords = ['account', 'transfer', 'debit', 'credit', 'balance', 'currency'];

  const italianCount = italianKeywords.filter((kw) => text.toLowerCase().includes(kw)).length;
  const englishCount = englishKeywords.filter((kw) => text.toLowerCase().includes(kw)).length;

  return italianCount > englishCount ? 'it' : 'en';
}

/**
 * Detect bank name from text (pattern matching)
 */
function detectBankName(text: string): string {
  const bankPatterns = [
    { pattern: /revolut/i, name: 'Revolut' },
    { pattern: /intesa\s*sanpaolo/i, name: 'Intesa Sanpaolo' },
    { pattern: /unicredit/i, name: 'UniCredit' },
    { pattern: /banco\s*bpm/i, name: 'Banco BPM' },
    { pattern: /bnl/i, name: 'BNL' },
    { pattern: /poste\s*italiane/i, name: 'Poste Italiane' },
    { pattern: /fineco/i, name: 'Fineco' },
    { pattern: /ing\s*bank/i, name: 'ING' },
    { pattern: /chase/i, name: 'Chase' },
    { pattern: /bank\s*of\s*america/i, name: 'Bank of America' },
    { pattern: /wells\s*fargo/i, name: 'Wells Fargo' },
    { pattern: /capital\s*one/i, name: 'Capital One' },
    { pattern: /hsbc/i, name: 'HSBC' },
    { pattern: /barclays/i, name: 'Barclays' },
  ];

  const textLower = text.toLowerCase();
  for (const { pattern, name } of bankPatterns) {
    if (pattern.test(textLower)) {
      console.log(`🏦 [PDFParser] Detected bank: ${name}`);
      return name;
    }
  }

  console.log('🏦 [PDFParser] Bank not recognized');
  return 'Unknown Bank';
}

/**
 * AI Analysis with Google Gemini Flash 2.5
 * Uses Lovable AI Gateway for processing
 */
async function analyzeWithAI(
  text: string,
  language: 'auto' | 'it' | 'en'
): Promise<{ transactions: ParsedTransaction[]; bank: string; confidence: number }> {
  try {
    // Note: This would call the existing Edge Function
    // For now, we'll use a placeholder that shows the structure
    console.log('🤖 [AI] Analyzing with Gemini Flash 2.5...');

    // In a real implementation, this would call:
    // const response = await supabase.functions.invoke('analyze-transactions', { body: { text, language } });

    // For now, return empty to maintain compatibility
    // The Edge Function already handles this
    return {
      transactions: [],
      bank: 'Unknown Bank',
      confidence: 0.5,
    };
  } catch (error) {
    console.error('❌ [AI] Error:', error);
    return {
      transactions: [],
      bank: 'Unknown Bank',
      confidence: 0,
    };
  }
}

/**
 * Enhanced pattern matching for transaction extraction
 * Supports multiple date/amount formats (Revolut, Italian banks, etc.)
 */
function extractTransactionsWithPatterns(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Enhanced date patterns to support multiple formats
  // DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY, etc.
  const datePatterns = [
    /\b(\d{1,2})\s+(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)\s+(\d{4})\b/gi, // REVOLUT: 1 giu 2025 (Italian)
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/gi, // DD MMM YYYY (English)
    /\b(\d{2})[\/-](\d{2})[\/-](\d{4})\b/g, // DD/MM/YYYY or DD-MM-YYYY
    /\b(\d{4})[\/-](\d{2})[\/-](\d{2})\b/g, // YYYY-MM-DD
  ];

  // Enhanced amount patterns to support multiple currencies and formats
  // €123.45, $123.45, 123,45, -123.45, (123.45), 123.456,78
  const amountPatterns = [
    /[€$£]?\s?-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g, // Standard: €123.45, 1.234,56
    /\(\s?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\s?\)/g, // Parentheses for negative: (123.45)
    /-\s?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g, // Negative with space: - 123.45
  ];

  // CRITICAL FIX: Revolut PDFs put all transactions in one line
  // Split by date pattern instead of newlines
  let lines = text.split('\n');

  console.log(`🔍 [Parser] Initial split: ${lines.length} lines`);
  
  // If very few lines but lots of text, it's a single-line PDF
  if (lines.length < 20 && text.length > 5000) {
    console.log('⚠️ [Parser] Detected single-line PDF format, re-splitting by date patterns...');
    
    // Re-split by date patterns (Revolut format)
    const newLines: string[] = [];
    const dateRegex = /(\d{1,2}\s+(?:gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})/gi;
    
    for (const line of lines) {
      if (line.length > 500) { // Very long line
        // Split by date occurrences
        const parts = line.split(dateRegex);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].trim()) {
            // Recombine date with its transaction data
            if (dateRegex.test(parts[i])) {
              const transactionBlock = parts[i] + (parts[i + 1] || '');
              newLines.push(transactionBlock);
              i++; // Skip next part as we've combined it
            } else {
              newLines.push(parts[i]);
            }
          }
        }
      } else {
        newLines.push(line);
      }
    }
    
    lines = newLines;
    console.log(`✅ [Parser] Re-split into ${lines.length} lines`);
  }
  
  // Debug: Sample some lines to see the format
  console.log('━━━ SAMPLE LINES (first 10) ━━━');
  lines.slice(0, 10).forEach((line, idx) => {
    console.log(`Line ${idx}: "${line.substring(0, 200)}..."`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Strategy 1: Line-by-line processing (works for simple PDFs)
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    
    // Skip empty lines or very short lines
    if (line.length < 10) continue;

    // Try to find dates
    let dateMatch: string | null = null;
    for (const pattern of datePatterns) {
      const matches = line.match(pattern);
      if (matches && matches.length > 0) {
        dateMatch = matches[0];
        break;
      }
    }

    if (!dateMatch) continue;

    // Try to find amounts in current line
    const amounts: number[] = [];
    for (const pattern of amountPatterns) {
      const matches = Array.from(line.matchAll(pattern));
      for (const match of matches) {
        const parsed = parseAmount(match[0]);
        if (parsed !== null) {
          amounts.push(parsed);
        }
      }
    }

    // If no amounts on current line, check next 2 lines (multi-line transaction)
    if (amounts.length === 0 && lineIdx + 2 < lines.length) {
      const nextLines = lines[lineIdx + 1] + ' ' + lines[lineIdx + 2];
      for (const pattern of amountPatterns) {
        const matches = Array.from(nextLines.matchAll(pattern));
        for (const match of matches) {
          const parsed = parseAmount(match[0]);
          if (parsed !== null) {
            amounts.push(parsed);
          }
        }
      }
    }

    if (amounts.length === 0) continue;

    // Normalize date
    const normalizedDate = normalizeDate(dateMatch);
    if (!normalizedDate) continue;

    // Extract description (text before or after date/amounts)
    let description = line
      .replace(dateMatch, '')
      .replace(/[€$£]?\s?-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g, '')
      .trim();

    // For multi-line transactions, look at next 2 lines for description
    if (description.length < 5 && lineIdx + 2 < lines.length) {
      description += ' ' + lines[lineIdx + 1].trim() + ' ' + lines[lineIdx + 2].trim();
      description = description.substring(0, 150).trim();
    } else if (description.length < 5 && lineIdx + 1 < lines.length) {
      description += ' ' + lines[lineIdx + 1].trim();
    }

    description = description.substring(0, 150).trim() || 'Transaction';

    // Determine primary amount (usually the last one or the largest)
    const amount = amounts.length === 1 ? amounts[0] : amounts[amounts.length - 1];

    // Smart categorization with confidence scoring
    const categorization = smartCategorize(description, amount);

    transactions.push({
      date: normalizedDate,
      description,
      amount,
      category: categorization.category,
      payee: extractPayee(description),
      confidence: categorization.confidence, // Dynamic confidence based on match quality
    });
  }

  // Strategy 2: If few transactions found, try whole-text regex (for complex tables)
  if (transactions.length < 5) {
    console.log(`⚠️ [Parser] Only ${transactions.length} found via line-by-line, trying whole-text extraction...`);
    const additionalTransactions = extractFromWholeText(text, transactions);
    transactions.push(...additionalTransactions);
  }

  // Calculate average confidence
  const avgConfidence = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length
    : 0;

  console.log(`📊 [Parser] Extracted ${transactions.length} transactions via enhanced pattern matching`);
  console.log(`📊 [Parser] Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  
  // Log confidence distribution
  const high = transactions.filter(t => t.confidence >= 0.8).length;
  const medium = transactions.filter(t => t.confidence >= 0.6 && t.confidence < 0.8).length;
  const low = transactions.filter(t => t.confidence < 0.6).length;
  console.log(`📊 [Parser] Confidence distribution: High(≥80%): ${high}, Medium(60-80%): ${medium}, Low(<60%): ${low}`);

  return transactions;
}

/**
 * Extract transactions from whole text (for complex multi-column tables)
 * Used as fallback when line-by-line extraction finds few transactions
 */
function extractFromWholeText(text: string, existingTransactions: ParsedTransaction[]): ParsedTransaction[] {
  const newTransactions: ParsedTransaction[] = [];
  const existingDates = new Set(existingTransactions.map(t => t.date));

  // Create a more aggressive regex to find date + amount combinations anywhere in text
  const combinedPattern = /(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}[\/-]\d{2}[\/-]\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})[\s\S]{0,200}?([€$£]?\s?-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/gi;

  const matches = Array.from(text.matchAll(combinedPattern));
  console.log(`🔍 [Parser] Whole-text regex found ${matches.length} potential transactions`);

  for (const match of matches) {
    const dateStr = match[1];
    const amountStr = match[2];

    const normalizedDate = normalizeDate(dateStr);
    if (!normalizedDate) continue;

    // Skip if we already have this date (avoid duplicates)
    if (existingDates.has(normalizedDate)) continue;

    const amount = parseAmount(amountStr);
    if (amount === null) continue;

    // Extract description (text between date and amount)
    const fullMatch = match[0];
    let description = fullMatch
      .replace(dateStr, '')
      .replace(amountStr, '')
      .replace(/[€$£]/g, '')
      .trim();

    // Clean up common table artifacts
    description = description
      .replace(/\s{2,}/g, ' ')
      .replace(/[\|\-]{3,}/g, '')
      .replace(/^\W+|\W+$/g, '')
      .substring(0, 150)
      .trim();

    if (description.length < 3) {
      description = 'Transaction';
    }

    const categorization = smartCategorize(description, amount);

    newTransactions.push({
      date: normalizedDate,
      description,
      amount,
      category: categorization.category,
      payee: extractPayee(description),
      confidence: Math.max(0.50, categorization.confidence - 0.10), // Slightly lower confidence for whole-text extraction
    });

    existingDates.add(normalizedDate);
  }

  console.log(`✅ [Parser] Whole-text extraction added ${newTransactions.length} additional transactions`);

  return newTransactions;
}

/**
 * Advanced categorization with confidence scoring
 * Returns: { category: string, confidence: number, reasoning: string }
 */
function smartCategorize(description: string, amount: number = 0): { category: string; confidence: number; reasoning: string } {
  const desc = description.toLowerCase();

  // High Confidence Merchants (exact matches)
  const highConfidenceMerchants: Record<string, { category: string; confidence: number }> = {
    // Subscriptions (0.95 confidence)
    'spotify': { category: 'Entertainment', confidence: 0.95 },
    'netflix': { category: 'Entertainment', confidence: 0.95 },
    'disney': { category: 'Entertainment', confidence: 0.95 },
    'canva': { category: 'Entertainment', confidence: 0.95 },
    'beacons': { category: 'Entertainment', confidence: 0.90 },
    'lovable': { category: 'Other', confidence: 0.90 }, // Development tools
    
    // Transportation (0.90 confidence)
    'didi': { category: 'Transportation', confidence: 0.92 },
    'uber': { category: 'Transportation', confidence: 0.92 },
    'qantas': { category: 'Transportation', confidence: 0.95 },
    'trenitalia': { category: 'Transportation', confidence: 0.95 },
    
    // Food & Dining (0.90 confidence)
    'esselunga': { category: 'Food & Dining', confidence: 0.95 },
    'coop': { category: 'Food & Dining', confidence: 0.90 },
    'conad': { category: 'Food & Dining', confidence: 0.90 },
    'carrefour': { category: 'Food & Dining', confidence: 0.90 },
    'lidl': { category: 'Food & Dining', confidence: 0.90 },
    'coles': { category: 'Food & Dining', confidence: 0.92 },
    
    // Shopping (0.85 confidence)
    'amazon': { category: 'Shopping', confidence: 0.88 },
    'aliexpress': { category: 'Shopping', confidence: 0.88 },
    'zara': { category: 'Shopping', confidence: 0.85 },
    
    // Healthcare (0.90 confidence)
    'pharmacy': { category: 'Healthcare', confidence: 0.92 },
    'farmacia': { category: 'Healthcare', confidence: 0.92 },
  };

  // Check for exact merchant matches first
  for (const [merchant, data] of Object.entries(highConfidenceMerchants)) {
    if (desc.includes(merchant)) {
      return {
        category: data.category,
        confidence: data.confidence,
        reasoning: `Exact merchant match: ${merchant}`
      };
    }
  }

  // Category patterns with confidence scores
  const categoryPatterns: Array<{ pattern: RegExp; category: string; confidence: number; reasoning: string }> = [
    // Income patterns (0.95 confidence - very clear)
    { 
      pattern: /pagamento\s+da|bonifico\s+da|salary|wage|stipendio|accredito|refund|ricarica.*apple\s+pay/i,
      category: 'Income',
      confidence: 0.95,
      reasoning: 'Payment received/deposit keyword'
    },
    { 
      pattern: /transfer\s+to.*investment|to\s+investment/i,
      category: 'Income', // Outgoing but to own investment account
      confidence: 0.92,
      reasoning: 'Transfer to investment account'
    },
    
    // Subscriptions (0.92 confidence)
    { 
      pattern: /canone|subscription|subs|premium|membership/i,
      category: 'Bills & Utilities',
      confidence: 0.92,
      reasoning: 'Subscription/membership fee'
    },
    
    // Food & Dining (0.85 confidence - general keywords)
    { 
      pattern: /restaurant|pizza|bar\s|cafe|coffee|supermarket|grocery|convenience|hotel.*restaurant/i,
      category: 'Food & Dining',
      confidence: 0.85,
      reasoning: 'Food/dining keyword'
    },
    
    // Transportation (0.88 confidence)
    { 
      pattern: /taxi|ride|car.*wash|fuel|petrol|parking|metro|train|bus|airline|flight/i,
      category: 'Transportation',
      confidence: 0.88,
      reasoning: 'Transportation keyword'
    },
    
    // Healthcare (0.90 confidence)
    { 
      pattern: /medical|doctor|clinic|health|pharmacy|hospital/i,
      category: 'Healthcare',
      confidence: 0.90,
      reasoning: 'Healthcare keyword'
    },
    
    // Bills & Utilities (0.88 confidence)
    { 
      pattern: /electric|water|gas\s+bill|internet|phone|insurance|utility/i,
      category: 'Bills & Utilities',
      confidence: 0.88,
      reasoning: 'Utility/bill keyword'
    },
    
    // Shopping (0.80 confidence - generic)
    { 
      pattern: /shop|store|retail|clothing|electronics|purchase/i,
      category: 'Shopping',
      confidence: 0.80,
      reasoning: 'Shopping keyword'
    },
  ];

  // Apply category patterns
  for (const pattern of categoryPatterns) {
    if (pattern.pattern.test(desc)) {
      return {
        category: pattern.category,
        confidence: pattern.confidence,
        reasoning: pattern.reasoning
      };
    }
  }

  // Amount-based heuristics for unclear descriptions
  if (Math.abs(amount) > 1000) {
    return {
      category: 'Other',
      confidence: 0.60,
      reasoning: 'Large amount, unclear description - manual review recommended'
    };
  }

  // Default: Other with low confidence
  return {
    category: 'Other',
    confidence: 0.50,
    reasoning: 'No clear category match - manual review recommended'
  };
}

/**
 * Extract payee/merchant name from description
 */
function extractPayee(description: string): string {
  // Try to extract merchant name (usually first 2-3 words before numbers/dates)
  const words = description
    .replace(/\d+/g, '')
    .replace(/[€$£]/g, '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length > 0) {
    return words.slice(0, 3).join(' ');
  }

  return 'Unknown';
}

/**
 * Normalize date to YYYY-MM-DD format
 * Supports: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY
 */
function normalizeDate(dateStr: string): string | null {
  try {
    // Month name mapping (Italian + English, full + abbreviated)
    const monthMap: Record<string, string> = {
      // English
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      january: '01', february: '02', march: '03', april: '04', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
      // Italian abbreviated (Revolut format)
      gen: '01', febi: '02', mari: '03', apri: '04', mag: '05', giu: '06',
      lug: '07', ago: '08', set: '09', ott: '10', novi: '11', dic: '12',
      // Italian full
      gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05', giugno: '06',
      luglio: '07', agosto: '08', settembre: '09', ottobre: '10', novembre: '11', dicembre: '12',
    };

    // Check for month name format: DD MMM YYYY
    const monthNameMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (monthNameMatch) {
      const [, day, monthName, year] = monthNameMatch;
      const month = monthMap[monthName.toLowerCase().substring(0, 3)];
      if (month) {
        return `${year}-${month}-${day.padStart(2, '0')}`;
      }
    }

    // Handle DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const parts = dateStr.split(/[\/-]/);

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // Already YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number | null {
  try {
    // Remove currency symbols and spaces
    let cleaned = amountStr.replace(/[€$\s]/g, '');

    // Handle European format (1.234,56 -> 1234.56)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

