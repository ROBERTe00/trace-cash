/**
 * Coordinate-Based PDF Parser for Table Extraction
 * Uses pdf.js coordinate system to properly extract tabular data
 * Prevents concatenation of headers, footers, and unrelated text
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker, type Worker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface CoordinateItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TableRow {
  y: number;
  items: CoordinateItem[];
  text: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  payee: string;
  confidence: number;
}

export interface CoordinateParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  rawText: string;
  metadata: {
    method: 'coordinate' | 'ocr' | 'hybrid';
    bankDetected: string;
    confidence: number;
    pageCount: number;
    rowsExtracted: number;
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
 * Parse bank statement using coordinate-based extraction
 */
export async function parseWithCoordinates(
  file: File,
  options: ParseOptions = {}
): Promise<CoordinateParseResult> {
  const {
    enableOCR = true,
    language = 'auto',
    onProgress = () => {},
  } = options;

  const errors: string[] = [];
  let allRows: TableRow[] = [];

  try {
    onProgress(10, 'Loading PDF with coordinate extraction...');

    const pdfData = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    console.log(`📄 [CoordinatePDF] Processing ${pdf.numPages} pages`);

    onProgress(20, 'Extracting table structure...');

    // Extract from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress(20 + (pageNum / pdf.numPages) * 30, `Processing page ${pageNum}/${pdf.numPages}...`);
      
      const pageRows = await extractTableFromPage(pdf, pageNum);
      allRows.push(...pageRows);
      
      console.log(`📄 [CoordinatePDF] Page ${pageNum}: Extracted ${pageRows.length} rows`);
    }

    console.log(`📊 [CoordinatePDF] Total rows extracted: ${allRows.length}`);

    onProgress(50, 'Filtering and parsing transactions...');

    // Filter out headers, footers, and non-transaction rows
    const transactionRows = filterTransactionRows(allRows);
    
    console.log(`📊 [CoordinatePDF] After filtering: ${transactionRows.length} transaction rows`);

    // Parse transactions from filtered rows
    const transactions = parseTransactionsFromRows(transactionRows);
    
    console.log(`✅ [CoordinatePDF] Parsed ${transactions.length} transactions`);

    onProgress(70, 'Detecting bank and categorizing...');

    // Detect bank
    const fullText = allRows.map(r => r.text).join(' ');
    const bankDetected = detectBankName(fullText);

    // Calculate confidence
    const avgConfidence = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length
      : 0;

    onProgress(90, 'Finalizing...');

    return {
      success: transactions.length > 0,
      transactions,
      rawText: fullText,
      metadata: {
        method: 'coordinate',
        bankDetected,
        confidence: avgConfidence,
        pageCount: pdf.numPages,
        rowsExtracted: transactionRows.length,
      },
      errors,
    };

  } catch (error) {
    console.error('❌ [CoordinatePDF] Error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    return {
      success: false,
      transactions: [],
      rawText: '',
      metadata: {
        method: 'coordinate',
        bankDetected: 'Unknown',
        confidence: 0,
        pageCount: 0,
        rowsExtracted: 0,
      },
      errors,
    };
  }
}

/**
 * Extract table structure from a single page using coordinates
 */
async function extractTableFromPage(pdf: any, pageNum: number): Promise<TableRow[]> {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  
  // Get viewport to understand page dimensions
  const viewport = page.getViewport({ scale: 1.0 });
  const pageHeight = viewport.height;

  // Extract items with coordinates
  const items: CoordinateItem[] = textContent.items.map((item: any) => ({
    text: item.str,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
    height: item.height,
  }));

  console.log(`📄 [CoordinatePDF] Page ${pageNum}: ${items.length} text items, height: ${pageHeight}`);

  // Group items into rows by Y coordinate (threshold: 5 units)
  const rows: Map<number, CoordinateItem[]> = new Map();
  const Y_THRESHOLD = 5;

  for (const item of items) {
    if (!item.text.trim()) continue;

    // Find existing row with similar Y coordinate
    let foundRow = false;
    for (const [y, rowItems] of rows.entries()) {
      if (Math.abs(y - item.y) <= Y_THRESHOLD) {
        rowItems.push(item);
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rows.set(item.y, [item]);
    }
  }

  // Convert to TableRow objects, sorted by Y (top to bottom)
  const tableRows: TableRow[] = Array.from(rows.entries())
    .map(([y, items]) => {
      // Sort items by X coordinate (left to right)
      const sortedItems = items.sort((a, b) => a.x - b.x);
      const text = sortedItems.map(i => i.text).join(' ');

      return {
        y,
        items: sortedItems,
        text,
      };
    })
    .sort((a, b) => b.y - a.y); // PDF coordinates: higher Y = top of page

  return tableRows;
}

/**
 * Filter out headers, footers, and non-transaction rows
 */
function filterTransactionRows(rows: TableRow[]): TableRow[] {
  // Keywords to exclude (headers, footers, page numbers)
  const excludeKeywords = [
    /revolut bank uab/i,
    /pagina\s+\d+\s+di\s+\d+/i,
    /© \d{4}/i,
    /segnala carta/i,
    /ottieni assistenza/i,
    /scansiona codice/i,
    /autorizzata/i,
    /regolamentata/i,
    /depositi sono protetti/i,
    /in caso di domande/i,
    /^data\s+descrizione/i, // Table header row
    /^saldo iniziale/i, // Summary section
    /^prodotto\s+saldo/i, // Summary header
    /^totale\s+€/i, // Total row
    /^il saldo sul tuo estratto/i, // Info text
    /^transazioni del conto dal/i, // Section header
    /denaro in uscita\s+denaro in entrata/i, // Column headers
    /iban\s+bic/i, // Footer info
  ];

  // Date pattern to identify transaction rows
  const datePattern = /\b(\d{1,2})\s+(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b/i;

  const filtered = rows.filter(row => {
    const text = row.text.toLowerCase();

    // Exclude if matches any exclude keyword
    for (const keyword of excludeKeywords) {
      if (keyword.test(text)) {
        return false;
      }
    }

    // Include only if contains a date (strong indicator of transaction row)
    return datePattern.test(row.text);
  });

  console.log(`🔍 [CoordinatePDF] Filtered ${rows.length} → ${filtered.length} rows (removed ${rows.length - filtered.length} headers/footers)`);

  return filtered;
}

/**
 * Parse transactions from coordinate-based table rows
 */
function parseTransactionsFromRows(rows: TableRow[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  const datePattern = /\b(\d{1,2})\s+(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b/i;
  const amountPattern = /€?\s?-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g;

  for (const row of rows) {
    try {
      // Extract date
      const dateMatch = row.text.match(datePattern);
      if (!dateMatch) continue;

      const date = normalizeDate(dateMatch[0]);
      if (!date) continue;

      // Extract all amounts from the row
      const amounts: number[] = [];
      const amountMatches = Array.from(row.text.matchAll(amountPattern));
      
      for (const match of amountMatches) {
        const parsed = parseAmount(match[0]);
        if (parsed !== null) {
          amounts.push(parsed);
        }
      }

      if (amounts.length === 0) continue;

      // Extract description (text between date and first amount)
      let description = row.text
        .replace(dateMatch[0], '') // Remove date
        .replace(/€?\s?-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g, '') // Remove all amounts
        .replace(/tasso revolut/gi, '') // Remove rate info
        .replace(/tasso ecb/gi, '')
        .replace(/carta:\s*\d+\*+\d+/gi, '') // Remove card numbers
        .replace(/a:\s*[^,]{0,50},\s*[A-Z]{2}/gi, '') // Remove merchant addresses
        .replace(/riferimento:/gi, '')
        .replace(/da:/gi, '')
        .trim();

      // Clean up extra whitespace
      description = description.replace(/\s{2,}/g, ' ').substring(0, 150).trim();

      if (description.length < 3) {
        description = 'Transaction';
      }

      // Determine transaction amount (usually first amount is the main one for Revolut)
      // Format: Date Description Outflow Inflow Balance
      // We want Outflow (negative) or Inflow (positive)
      const amount = amounts[0]; // Primary transaction amount

      // Categorize with confidence
      const categorization = smartCategorize(description, amount);

      transactions.push({
        date,
        description,
        amount,
        category: categorization.category,
        payee: extractPayee(description),
        confidence: categorization.confidence,
      });

    } catch (error) {
      console.warn(`⚠️ [CoordinatePDF] Failed to parse row: ${row.text.substring(0, 100)}`, error);
    }
  }

  return transactions;
}

/**
 * Advanced categorization with confidence scoring (same as advancedPDFParser.ts)
 */
function smartCategorize(description: string, amount: number): { category: string; confidence: number } {
  const desc = description.toLowerCase();

  // High Confidence Merchants
  const merchants: Record<string, { category: string; confidence: number }> = {
    'spotify': { category: 'Entertainment', confidence: 0.95 },
    'netflix': { category: 'Entertainment', confidence: 0.95 },
    'canva': { category: 'Entertainment', confidence: 0.95 },
    'beacons': { category: 'Entertainment', confidence: 0.90 },
    'didi': { category: 'Transportation', confidence: 0.92 },
    'uber': { category: 'Transportation', confidence: 0.92 },
    'qantas': { category: 'Transportation', confidence: 0.95 },
    'zoom': { category: 'Food & Dining', confidence: 0.85 },
    'coles': { category: 'Food & Dining', confidence: 0.92 },
    'esselunga': { category: 'Food & Dining', confidence: 0.95 },
    'amazon': { category: 'Shopping', confidence: 0.88 },
    'aliexpress': { category: 'Shopping', confidence: 0.88 },
    'pharmacy': { category: 'Healthcare', confidence: 0.92 },
    'farmacia': { category: 'Healthcare', confidence: 0.92 },
    'lovable': { category: 'Other', confidence: 0.90 },
  };

  for (const [merchant, data] of Object.entries(merchants)) {
    if (desc.includes(merchant)) {
      return { category: data.category, confidence: data.confidence };
    }
  }

  // Pattern-based categorization
  if (/pagamento\s+da|bonifico\s+da|ricarica/i.test(desc)) {
    return { category: 'Income', confidence: 0.95 };
  }
  if (/transfer\s+to.*investment|to\s+investment/i.test(desc)) {
    return { category: 'Income', confidence: 0.92 };
  }
  if (/canone|subscription|premium/i.test(desc)) {
    return { category: 'Bills & Utilities', confidence: 0.92 };
  }
  if (/restaurant|bar|cafe|convenience|hotel/i.test(desc)) {
    return { category: 'Food & Dining', confidence: 0.85 };
  }
  if (/taxi|car\s*wash|fuel|parking/i.test(desc)) {
    return { category: 'Transportation', confidence: 0.88 };
  }
  if (/medical|doctor|clinic/i.test(desc)) {
    return { category: 'Healthcare', confidence: 0.90 };
  }
  if (/electric|internet|phone|insurance/i.test(desc)) {
    return { category: 'Bills & Utilities', confidence: 0.88 };
  }
  if (/shop|store|retail/i.test(desc)) {
    return { category: 'Shopping', confidence: 0.80 };
  }

  return { category: 'Other', confidence: 0.50 };
}

/**
 * Extract payee/merchant name
 */
function extractPayee(description: string): string {
  const words = description
    .replace(/\d+/g, '')
    .replace(/[€$£]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2);

  return words.length > 0 ? words.slice(0, 3).join(' ') : 'Unknown';
}

/**
 * Normalize date to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string | null {
  try {
    const monthMap: Record<string, string> = {
      gen: '01', feb: '02', mar: '03', apr: '04', mag: '05', giu: '06',
      lug: '07', ago: '08', set: '09', ott: '10', nov: '11', dic: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

    const monthNameMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (monthNameMatch) {
      const [, day, monthName, year] = monthNameMatch;
      const month = monthMap[monthName.toLowerCase().substring(0, 3)];
      if (month) {
        return `${year}-${month}-${day.padStart(2, '0')}`;
      }
    }

    const parts = dateStr.split(/[\/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse amount string
 */
function parseAmount(amountStr: string): number | null {
  try {
    let cleaned = amountStr.replace(/[€$£\s]/g, '');

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

/**
 * Detect bank name from text
 */
function detectBankName(text: string): string {
  const patterns = [
    { pattern: /revolut/i, name: 'Revolut' },
    { pattern: /intesa\s*sanpaolo/i, name: 'Intesa Sanpaolo' },
    { pattern: /unicredit/i, name: 'UniCredit' },
    { pattern: /bnl/i, name: 'BNL' },
  ];

  for (const { pattern, name } of patterns) {
    if (pattern.test(text)) {
      return name;
    }
  }

  return 'Unknown Bank';
}

