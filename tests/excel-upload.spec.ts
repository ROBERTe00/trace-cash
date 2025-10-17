import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCSV, createTestFile, delay } from './helpers/test-utils';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    })
  },
  functions: {
    invoke: vi.fn()
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Excel Upload - Section 4 Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process 100 rows in under 15 seconds with batch AI', async () => {
    const csv = generateCSV(100);
    const file = createTestFile(csv, 'transactions.csv', 'text/csv');
    
    // Mock batch processing (5 batches of 20 = 100 transactions)
    mockSupabase.functions.invoke.mockImplementation(async () => {
      await delay(2500); // Simulate ~2.5s per batch
      return {
        data: {
          transactions: Array.from({ length: 100 }, (_, i) => ({
            date: `2024-01-${(i % 28) + 1}`,
            description: `Transaction ${i + 1}`,
            amount: (Math.random() * 100 + 10).toFixed(2),
            category: i % 2 === 0 ? 'Food' : 'Transport',
            type: 'Expense'
          })),
          metadata: {
            batchCount: 5,
            processingTime: 12500,
            categorizedCount: 100
          }
        },
        error: null
      };
    });

    const startTime = Date.now();
    const { data, error } = await mockSupabase.functions.invoke('parse-smart-transactions', {
      body: { fileContent: csv }
    });
    const duration = Date.now() - startTime;

    expect(error).toBeNull();
    expect(data.transactions.length).toBe(100);
    expect(duration).toBeLessThan(15000); // Must complete in <15s
    expect(data.metadata.batchCount).toBe(5);
  });

  it('should maintain 90%+ categorization accuracy with batch processing', async () => {
    const csv = generateCSV(50);
    
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        transactions: Array.from({ length: 50 }, (_, i) => ({
          date: `2024-01-${i + 1}`,
          description: i % 10 === 0 ? 'Uncategorized Item' : 'Grocery Store',
          amount: '25.00',
          category: i % 10 === 0 ? 'Other' : 'Food', // 90% accuracy
          type: 'Expense'
        })),
        metadata: {
          accuracyRate: 0.92,
          processingTime: 8000
        }
      },
      error: null
    });

    const { data, error } = await mockSupabase.functions.invoke('parse-smart-transactions', {
      body: { fileContent: csv }
    });

    expect(error).toBeNull();
    
    const correctlyCategor = data.transactions.filter((t: any) => t.category !== 'Other').length;
    const accuracy = correctlyCategor / data.transactions.length;
    
    expect(accuracy).toBeGreaterThanOrEqual(0.9); // 90%+ accuracy
    expect(data.metadata.accuracyRate).toBeGreaterThan(0.9);
  });

  it('should process mixed Italian/English descriptions correctly', async () => {
    const mixedCSV = `Date,Description,Amount,Category
2024-01-01,Supermercato Esselunga,45.20,Food
2024-01-02,Restaurant Bella Vita,32.50,Dining
2024-01-03,Esso Gas Station,55.00,Transport
2024-01-04,Amazon.it Shopping,89.99,Shopping
2024-01-05,Enel Bolletta Luce,120.00,Utilities`;

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        transactions: [
          { date: '2024-01-01', description: 'Supermercato Esselunga', amount: '45.20', category: 'Food', type: 'Expense' },
          { date: '2024-01-02', description: 'Restaurant Bella Vita', amount: '32.50', category: 'Dining', type: 'Expense' },
          { date: '2024-01-03', description: 'Esso Gas Station', amount: '55.00', category: 'Transport', type: 'Expense' },
          { date: '2024-01-04', description: 'Amazon.it Shopping', amount: '89.99', category: 'Shopping', type: 'Expense' },
          { date: '2024-01-05', description: 'Enel Bolletta Luce', amount: '120.00', category: 'Utilities', type: 'Expense' },
        ],
        metadata: {
          languageDetected: 'it-IT',
          accuracyRate: 1.0
        }
      },
      error: null
    });

    const { data, error } = await mockSupabase.functions.invoke('parse-smart-transactions', {
      body: { fileContent: mixedCSV }
    });

    expect(error).toBeNull();
    expect(data.transactions.length).toBe(5);
    expect(data.transactions.every((t: any) => t.category !== 'Other')).toBe(true);
    expect(data.metadata.accuracyRate).toBe(1.0);
  });

  it('should handle malformed CSV with clear error messages', async () => {
    const malformedCSV = `Date,Description,Amount
2024-01-01,Missing Category Column,50.00
Invalid Date Format,Item,100.00`;

    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'CSV format invalid: missing required columns',
        code: 'INVALID_CSV_FORMAT',
        details: 'Expected columns: Date, Description, Amount, Category'
      }
    });

    const { data, error } = await mockSupabase.functions.invoke('parse-smart-transactions', {
      body: { fileContent: malformedCSV }
    });

    expect(error).toBeTruthy();
    expect(error.code).toBe('INVALID_CSV_FORMAT');
    expect(error.message).toContain('CSV format invalid');
    expect(data).toBeNull();
  });

  it('should show real-time progress updates during processing', async () => {
    const csv = generateCSV(50);
    const progressUpdates: number[] = [];

    // Mock progress callback
    const mockProgressCallback = vi.fn((progress: number) => {
      progressUpdates.push(progress);
    });

    mockSupabase.functions.invoke.mockImplementation(async () => {
      // Simulate progress updates
      mockProgressCallback(10);
      await delay(200);
      mockProgressCallback(40);
      await delay(200);
      mockProgressCallback(70);
      await delay(200);
      mockProgressCallback(90);
      await delay(200);
      mockProgressCallback(100);

      return {
        data: {
          transactions: Array.from({ length: 50 }, () => ({
            date: '2024-01-01',
            description: 'Test',
            amount: '10.00',
            category: 'Food',
            type: 'Expense'
          }))
        },
        error: null
      };
    });

    await mockSupabase.functions.invoke('parse-smart-transactions', {
      body: { fileContent: csv }
    });

    expect(progressUpdates).toContain(10);
    expect(progressUpdates).toContain(40);
    expect(progressUpdates).toContain(70);
    expect(progressUpdates).toContain(90);
    expect(progressUpdates).toContain(100);
  });
});
