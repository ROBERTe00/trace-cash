import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Expense } from './storage';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  rawData: Record<string, any>;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  duplicates: ParsedTransaction[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
}

// Common column name variations
const DATE_COLUMNS = ['date', 'data', 'transaction date', 'posting date', 'value date'];
const DESCRIPTION_COLUMNS = ['description', 'descrizione', 'details', 'merchant', 'payee', 'beneficiary'];
const AMOUNT_COLUMNS = ['amount', 'importo', 'value', 'valore', 'debit', 'credit', 'transaction amount'];

function findColumn(headers: string[], possibleNames: string[]): string | null {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const index = lowerHeaders.findIndex(h => h.includes(name));
    if (index !== -1) return headers[index];
  }
  return null;
}

function parseDate(dateStr: string): string | null {
  try {
    // Try various date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return dateStr; // Already in correct format
        } else {
          // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
          const [, day, month, year] = match;
          return `${year}-${month}-${day}`;
        }
      }
    }

    // Try parsing as ISO date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return null;
  } catch {
    return null;
  }
}

function parseAmount(amountStr: string | number): number | null {
  try {
    if (typeof amountStr === 'number') return Math.abs(amountStr);
    
    // Remove currency symbols and spaces
    const cleaned = amountStr
      .replace(/[€$£,\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? null : Math.abs(amount);
  } catch {
    return null;
  }
}

function detectDuplicates(
  transactions: ParsedTransaction[],
  existingExpenses: Expense[]
): ParsedTransaction[] {
  const duplicates: ParsedTransaction[] = [];
  
  transactions.forEach(trans => {
    const isDuplicate = existingExpenses.some(exp => 
      exp.date === trans.date &&
      exp.description.toLowerCase() === trans.description.toLowerCase() &&
      Math.abs(exp.amount - trans.amount) < 0.01
    );
    
    if (isDuplicate) {
      duplicates.push(trans);
    }
  });
  
  return duplicates;
}

export async function parseCSV(
  file: File,
  existingExpenses: Expense[] = []
): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = processRows(results.data as Record<string, any>[], results.meta.fields || []);
        const duplicates = detectDuplicates(parsed.transactions, existingExpenses);
        
        resolve({
          ...parsed,
          duplicates,
          stats: {
            ...parsed.stats,
            duplicates: duplicates.length,
          },
        });
      },
      error: () => {
        resolve({
          transactions: [],
          errors: ['Failed to parse CSV file'],
          duplicates: [],
          stats: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
        });
      },
    });
  });
}

export async function parseExcel(
  file: File,
  existingExpenses: Expense[] = []
): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Use the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length < 2) {
      return {
        transactions: [],
        errors: ['Excel file is empty or has no data'],
        duplicates: [],
        stats: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
      };
    }
    
    // Convert to objects with headers
    const headers = data[0].map(h => String(h));
    const rows = data.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });
    
    const parsed = processRows(rows, headers);
    const duplicates = detectDuplicates(parsed.transactions, existingExpenses);
    
    return {
      ...parsed,
      duplicates,
      stats: {
        ...parsed.stats,
        duplicates: duplicates.length,
      },
    };
  } catch (error) {
    return {
      transactions: [],
      errors: ['Failed to parse Excel file: ' + (error instanceof Error ? error.message : 'Unknown error')],
      duplicates: [],
      stats: { total: 0, valid: 0, invalid: 0, duplicates: 0 },
    };
  }
}

function processRows(rows: Record<string, any>[], headers: string[]): Omit<ParseResult, 'duplicates'> {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  
  const dateCol = findColumn(headers, DATE_COLUMNS);
  const descCol = findColumn(headers, DESCRIPTION_COLUMNS);
  const amountCol = findColumn(headers, AMOUNT_COLUMNS);
  
  if (!dateCol || !descCol || !amountCol) {
    return {
      transactions: [],
      errors: [`Could not find required columns. Found headers: ${headers.join(', ')}`],
      stats: { total: rows.length, valid: 0, invalid: rows.length, duplicates: 0 },
    };
  }
  
  rows.forEach((row, index) => {
    const date = parseDate(String(row[dateCol] || ''));
    const description = String(row[descCol] || '').trim();
    const amount = parseAmount(row[amountCol]);
    
    if (!date || !description || amount === null || amount === 0) {
      errors.push(`Row ${index + 2}: Invalid data (date: ${row[dateCol]}, desc: ${description}, amount: ${row[amountCol]})`);
      return;
    }
    
    transactions.push({
      date,
      description,
      amount,
      rawData: row,
    });
  });
  
  return {
    transactions,
    errors,
    stats: {
      total: rows.length,
      valid: transactions.length,
      invalid: errors.length,
      duplicates: 0,
    },
  };
}

export function encryptData(data: string, key: string): string {
  // Simple XOR encryption for client-side data protection
  // For production, use Web Crypto API or a proper library
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

export function decryptData(encryptedData: string, key: string): string {
  const data = atob(encryptedData);
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}
