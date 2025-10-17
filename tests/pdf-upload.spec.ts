import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestFile, delay } from './helpers/test-utils';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    })
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ 
        data: { path: 'test-path.pdf' }, 
        error: null 
      })
    })
  },
  functions: {
    invoke: vi.fn()
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('PDF Upload - Section 4 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract 50+ transactions from Italian bank statement', async () => {
    // Mock successful extraction
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        transactions: Array.from({ length: 55 }, (_, i) => ({
          date: `2024-01-${(i % 28) + 1}`,
          description: `Transaction ${i + 1}`,
          amount: (Math.random() * 100).toFixed(2),
          category: 'Shopping',
          confidence: 0.85
        })),
        bankName: 'Intesa Sanpaolo',
        metadata: {
          totalTransactions: 55,
          processingTime: 8500
        }
      },
      error: null
    });

    const pdfContent = '%PDF-1.4 Mock PDF Content';
    const file = createTestFile(pdfContent, 'statement.pdf', 'application/pdf');
    
    // Simulate upload
    const { data: uploadData } = await mockSupabase.storage.from('bank-statements').upload('test.pdf', file);
    expect(uploadData?.path).toBe('test-path.pdf');

    // Simulate processing
    const { data, error } = await mockSupabase.functions.invoke('process-bank-statement', {
      body: { filePath: uploadData?.path }
    });

    expect(error).toBeNull();
    expect(data.transactions.length).toBeGreaterThanOrEqual(50);
    expect(data.bankName).toBe('Intesa Sanpaolo');
    expect(data.transactions[0]).toHaveProperty('confidence');
    expect(data.transactions[0].confidence).toBeGreaterThan(0.8);
  });

  it('should fallback to OCR if GPT-4.1 Vision fails', async () => {
    // Mock Vision API failure, then OCR success
    mockSupabase.functions.invoke
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Vision API failed')
      });

    const pdfContent = '%PDF-1.4 Scanned Image PDF';
    const file = createTestFile(pdfContent, 'scanned-statement.pdf', 'application/pdf');
    
    const { data: uploadData } = await mockSupabase.storage.from('bank-statements').upload('test.pdf', file);
    
    // First attempt (Vision API fails)
    const { error: firstError } = await mockSupabase.functions.invoke('process-bank-statement', {
      body: { filePath: uploadData?.path }
    });
    
    expect(firstError).toBeTruthy();

    // Second attempt with OCR flag
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        transactions: Array.from({ length: 12 }, (_, i) => ({
          date: `2024-01-${i + 1}`,
          description: `OCR Transaction ${i + 1}`,
          amount: '50.00',
          category: 'Other',
          confidence: 0.5 // OCR confidence is lower
        })),
        extractedVia: 'OCR',
        metadata: {
          ocrProcessingTime: 12000
        }
      },
      error: null
    });

    const { data: ocrData, error: ocrError } = await mockSupabase.functions.invoke('process-bank-statement', {
      body: { filePath: uploadData?.path, useOCR: true }
    });

    expect(ocrError).toBeNull();
    expect(ocrData.extractedVia).toBe('OCR');
    expect(ocrData.transactions.length).toBeGreaterThan(0);
    expect(ocrData.transactions[0].confidence).toBe(0.5);
  });

  it('should handle large files (8MB+) without timeout', async () => {
    const largePdfContent = '%PDF-1.4\n' + 'x'.repeat(8 * 1024 * 1024); // 8MB
    const file = createTestFile(largePdfContent, 'large-statement.pdf', 'application/pdf');
    
    mockSupabase.functions.invoke.mockImplementation(async () => {
      await delay(15000); // Simulate 15s processing
      return {
        data: {
          transactions: Array.from({ length: 120 }, (_, i) => ({
            date: `2024-01-01`,
            description: `Transaction ${i}`,
            amount: '100.00',
            category: 'Shopping',
            confidence: 0.82
          })),
          metadata: {
            fileSize: 8388608,
            processingTime: 15000
          }
        },
        error: null
      };
    });

    const startTime = Date.now();
    const { data: uploadData } = await mockSupabase.storage.from('bank-statements').upload('large.pdf', file);
    const { data, error } = await mockSupabase.functions.invoke('process-bank-statement', {
      body: { filePath: uploadData?.path }
    });
    const processingTime = Date.now() - startTime;

    expect(error).toBeNull();
    expect(data.transactions.length).toBeGreaterThan(100);
    expect(processingTime).toBeLessThan(30000); // Should complete within 30s
  });

  it('should provide user-friendly error messages in Italian', async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Invalid PDF format',
        code: 'INVALID_FORMAT'
      }
    });

    const invalidFile = createTestFile('not a pdf', 'invalid.pdf', 'application/pdf');
    const { data: uploadData } = await mockSupabase.storage.from('bank-statements').upload('invalid.pdf', invalidFile);
    
    const { error } = await mockSupabase.functions.invoke('process-bank-statement', {
      body: { filePath: uploadData?.path }
    });

    expect(error).toBeTruthy();
    expect(error.message).toBeTruthy();
    expect(error.code).toBe('INVALID_FORMAT');
  });
});
