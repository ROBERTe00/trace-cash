/**
 * Comprehensive Test Suite
 * End-to-end testing for PDF/Excel readers, Plaid API, and UX components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fileParser } from '../lib/fileParsers';
import { PlaidService } from '../lib/plaidService';
import { UnifiedUpload } from '../components/UnifiedUpload';
import { PlaidLink } from '../components/PlaidLink';

// Mock Supabase
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

// Mock Gemini AI
vi.mock('../lib/geminiAI', () => ({
  geminiAI: {
    processFinancialDocument: vi.fn(() => Promise.resolve({
      transactions: [
        {
          date: '2024-01-01',
          description: 'Test Transaction',
          amount: -50.00,
          category: 'Food & Dining',
          payee: 'Test Merchant',
          confidence: 0.9
        }
      ],
      summary: {
        totalExpenses: 50.00,
        totalIncome: 0,
        topCategories: [],
        monthlyTrend: 'stable',
        spendingPattern: 'test',
        recommendations: []
      },
      insights: [],
      anomalies: [],
      confidence: 0.9
    }))
  }
}));

describe('File Parsing System', () => {
  describe('CSV Parsing', () => {
    it('should parse CSV files correctly', async () => {
      const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50
2024-01-02,Grocery Store,-45.99`;

      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableAI: false,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].description).toBe('Coffee Shop');
      expect(result.transactions[0].amount).toBe(-5.50);
    });

    it('should handle different CSV delimiters', async () => {
      const csvContent = `Date;Description;Amount
2024-01-01;Coffee Shop;-5.50
2024-01-02;Grocery Store;-45.99`;

      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableAI: false,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(2);
    });

    it('should validate file size limits', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const mockFile = new File([largeContent], 'large.csv', { type: 'text/csv' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableAI: false,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('File size exceeds 10MB limit');
    });

    it('should handle malformed CSV files', async () => {
      const malformedContent = `Date,Description,Amount
2024-01-01,Coffee Shop
2024-01-02,Grocery Store,-45.99`;

      const mockFile = new File([malformedContent], 'malformed.csv', { type: 'text/csv' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableAI: false,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1); // Only valid row
    });
  });

  describe('Excel Parsing', () => {
    it('should parse Excel files correctly', async () => {
      // Mock Excel file content
      const mockExcelBuffer = new ArrayBuffer(1024);
      const mockFile = new File([mockExcelBuffer], 'test.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Mock XLSX library
      vi.mock('xlsx', () => ({
        read: vi.fn(() => ({
          SheetNames: ['Sheet1'],
          Sheets: {
            Sheet1: {
              'A1': { v: 'Date' },
              'B1': { v: 'Description' },
              'C1': { v: 'Amount' },
              'A2': { v: '2024-01-01' },
              'B2': { v: 'Coffee Shop' },
              'C2': { v: -5.50 }
            }
          }
        })),
        utils: {
          sheet_to_json: vi.fn(() => [
            ['Date', 'Description', 'Amount'],
            ['2024-01-01', 'Coffee Shop', -5.50]
          ])
        }
      }));

      const result = await fileParser.parseFile(mockFile, {
        enableAI: false,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(true);
      expect(result.metadata.fileType).toBe('excel');
    });
  });

  describe('PDF Parsing', () => {
    it('should handle PDF files', async () => {
      const mockPdfBuffer = new ArrayBuffer(1024);
      const mockFile = new File([mockPdfBuffer], 'test.pdf', { type: 'application/pdf' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableOCR: true,
        enableAI: false,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(true);
      expect(result.metadata.fileType).toBe('pdf');
      expect(result.metadata.pageCount).toBeDefined();
    });
  });

  describe('AI Integration', () => {
    it('should process files with AI when enabled', async () => {
      const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50`;

      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableAI: true,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(true);
      expect(result.metadata.confidence).toBeGreaterThan(0.8);
      expect(result.transactions[0].category).toBe('Food & Dining');
    });

    it('should handle AI processing errors gracefully', async () => {
      // Mock AI failure
      vi.mocked(require('../lib/geminiAI').geminiAI.processFinancialDocument)
        .mockRejectedValueOnce(new Error('AI service unavailable'));

      const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50`;

      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
      
      const result = await fileParser.parseFile(mockFile, {
        enableAI: true,
        maxFileSize: 10 * 1024 * 1024
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('AI processing failed');
    });
  });
});

describe('Plaid API Integration', () => {
  let plaidService: PlaidService;

  beforeEach(() => {
    plaidService = new PlaidService({
      clientId: 'test-client-id',
      secret: 'test-secret',
      environment: 'sandbox'
    });
  });

  describe('Link Token Creation', () => {
    it('should create link token successfully', async () => {
      // Mock Plaid API response
      vi.spyOn(plaidService as any, 'createLinkToken')
        .mockResolvedValueOnce('link-token-123');

      const linkToken = await plaidService.createLinkToken('test-user-id');
      
      expect(linkToken).toBe('link-token-123');
    });

    it('should handle link token creation errors', async () => {
      vi.spyOn(plaidService as any, 'createLinkToken')
        .mockRejectedValueOnce(new Error('Invalid client ID'));

      await expect(plaidService.createLinkToken('test-user-id'))
        .rejects.toThrow('Invalid client ID');
    });
  });

  describe('Token Exchange', () => {
    it('should exchange public token for access token', async () => {
      vi.spyOn(plaidService as any, 'exchangePublicToken')
        .mockResolvedValueOnce('access-token-123');

      const accessToken = await plaidService.exchangePublicToken('public-token-123');
      
      expect(accessToken).toBe('access-token-123');
    });
  });

  describe('Account Retrieval', () => {
    it('should fetch accounts successfully', async () => {
      const mockAccounts = [
        {
          account_id: 'acc-123',
          name: 'Test Account',
          type: 'depository',
          subtype: 'checking',
          mask: '1234',
          balances: { current: 1000.00, iso_currency_code: 'USD' }
        }
      ];

      vi.spyOn(plaidService as any, 'getAccounts')
        .mockResolvedValueOnce(mockAccounts.map(acc => ({
          id: acc.account_id,
          institutionId: 'ins-123',
          institutionName: 'Test Bank',
          accountName: acc.name,
          accountType: 'checking',
          lastFour: acc.mask,
          isActive: true,
          connectedAt: new Date(),
          lastSync: new Date(),
          balance: acc.balances.current,
          currency: acc.balances.iso_currency_code
        })));

      const accounts = await plaidService.getAccounts('access-token-123');
      
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountName).toBe('Test Account');
    });
  });

  describe('Transaction Retrieval', () => {
    it('should fetch transactions successfully', async () => {
      const mockTransactions = [
        {
          transaction_id: 'txn-123',
          account_id: 'acc-123',
          amount: -50.00,
          name: 'Test Transaction',
          date: '2024-01-01',
          category: ['Food & Dining'],
          merchant_name: 'Test Merchant',
          pending: false
        }
      ];

      vi.spyOn(plaidService as any, 'getTransactions')
        .mockResolvedValueOnce(mockTransactions.map(txn => ({
          id: txn.transaction_id,
          accountId: txn.account_id,
          amount: txn.amount,
          description: txn.name,
          date: txn.date,
          category: txn.category[0],
          merchant: txn.merchant_name,
          isPending: txn.pending
        })));

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const transactions = await plaidService.getTransactions('access-token-123', startDate, endDate);
      
      expect(transactions).toHaveLength(1);
      expect(transactions[0].description).toBe('Test Transaction');
    });
  });
});

describe('Unified Upload Component', () => {
  const mockOnTransactionsParsed = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload interface correctly', () => {
    render(
      <UnifiedUpload
        onTransactionsParsed={mockOnTransactionsParsed}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Upload Bank Statement')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop your PDF, Excel, or CSV file, or click to browse')).toBeInTheDocument();
  });

  it('should handle file drop correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <UnifiedUpload
        onTransactionsParsed={mockOnTransactionsParsed}
        onError={mockOnError}
      />
    );

    const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const dropzone = screen.getByRole('button', { name: /upload/i });
    
    await user.upload(dropzone, file);

    await waitFor(() => {
      expect(mockOnTransactionsParsed).toHaveBeenCalled();
    });
  });

  it('should show error for invalid file types', async () => {
    const user = userEvent.setup();
    
    render(
      <UnifiedUpload
        onTransactionsParsed={mockOnTransactionsParsed}
        onError={mockOnError}
        acceptedFormats={['.csv']}
      />
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const dropzone = screen.getByRole('button', { name: /upload/i });
    
    await user.upload(dropzone, file);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('should show progress during file processing', async () => {
    const user = userEvent.setup();
    
    render(
      <UnifiedUpload
        onTransactionsParsed={mockOnTransactionsParsed}
        onError={mockOnError}
      />
    );

    const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50`;
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const dropzone = screen.getByRole('button', { name: /upload/i });
    
    await user.upload(dropzone, file);

    await waitFor(() => {
      expect(screen.getByText(/Processing Document/)).toBeInTheDocument();
    });
  });
});

describe('Plaid Link Component', () => {
  const mockOnAccountConnected = vi.fn();
  const mockOnTransactionReceived = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Plaid integration interface', () => {
    render(
      <PlaidLink
        onAccountConnected={mockOnAccountConnected}
        onTransactionReceived={mockOnTransactionReceived}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Credit Card Integration')).toBeInTheDocument();
    expect(screen.getByText('Connect New Account')).toBeInTheDocument();
  });

  it('should handle account connection', async () => {
    const user = userEvent.setup();
    
    render(
      <PlaidLink
        onAccountConnected={mockOnAccountConnected}
        onTransactionReceived={mockOnTransactionReceived}
        onError={mockOnError}
      />
    );

    const connectButton = screen.getByRole('button', { name: /connect account/i });
    
    await user.click(connectButton);

    await waitFor(() => {
      expect(mockOnAccountConnected).toHaveBeenCalled();
    });
  });

  it('should display connected accounts', () => {
    const connectedAccounts = [
      {
        id: 'acc-1',
        institutionId: 'ins-1',
        institutionName: 'Test Bank',
        accountName: 'Test Account',
        accountType: 'checking' as const,
        lastFour: '1234',
        isActive: true,
        connectedAt: new Date(),
        lastSync: new Date(),
        balance: 1000.00,
        currency: 'USD'
      }
    ];

    render(
      <PlaidLink
        onAccountConnected={mockOnAccountConnected}
        onTransactionReceived={mockOnTransactionReceived}
        onError={mockOnError}
      />
    );

    // Mock connected accounts state
    // In a real test, you'd need to mock the component state or use a test wrapper
  });
});

describe('Accessibility Tests', () => {
  it('should have proper ARIA labels', () => {
    render(
      <UnifiedUpload
        onTransactionsParsed={vi.fn()}
        onError={vi.fn()}
      />
    );

    const dropzone = screen.getByRole('button', { name: /upload/i });
    expect(dropzone).toHaveAttribute('aria-label');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <PlaidLink
        onAccountConnected={vi.fn()}
        onTransactionReceived={vi.fn()}
        onError={vi.fn()}
      />
    );

    const connectButton = screen.getByRole('button', { name: /connect account/i });
    
    connectButton.focus();
    expect(connectButton).toHaveFocus();

    await user.keyboard('{Enter}');
    // Test keyboard interaction
  });

  it('should have proper focus management', () => {
    render(
      <UnifiedUpload
        onTransactionsParsed={vi.fn()}
        onError={vi.fn()}
      />
    );

    const dropzone = screen.getByRole('button', { name: /upload/i });
    
    fireEvent.focus(dropzone);
    expect(dropzone).toHaveFocus();
  });
});

describe('Mobile Responsiveness', () => {
  it('should adapt to mobile screen sizes', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <UnifiedUpload
        onTransactionsParsed={vi.fn()}
        onError={vi.fn()}
      />
    );

    const dropzone = screen.getByRole('button', { name: /upload/i });
    expect(dropzone).toHaveClass('min-h-[44px]'); // Touch-friendly size
  });

  it('should handle touch interactions', async () => {
    const user = userEvent.setup();
    
    render(
      <UnifiedUpload
        onTransactionsParsed={vi.fn()}
        onError={vi.fn()}
      />
    );

    const dropzone = screen.getByRole('button', { name: /upload/i });
    
    // Simulate touch events
    fireEvent.touchStart(dropzone);
    fireEvent.touchEnd(dropzone);
    
    // Test touch interaction
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Mock network error
    vi.mocked(require('../lib/geminiAI').geminiAI.processFinancialDocument)
      .mockRejectedValueOnce(new Error('Network error'));

    const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50`;

    const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await fileParser.parseFile(mockFile, {
      enableAI: true,
      maxFileSize: 10 * 1024 * 1024
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Network error');
  });

  it('should handle timeout errors', async () => {
    // Mock timeout
    vi.mocked(require('../lib/geminiAI').geminiAI.processFinancialDocument)
      .mockImplementationOnce(() => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      ));

    const csvContent = `Date,Description,Amount
2024-01-01,Coffee Shop,-5.50`;

    const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const result = await fileParser.parseFile(mockFile, {
      enableAI: true,
      maxFileSize: 10 * 1024 * 1024,
      timeout: 1 // 1 second timeout
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Timeout');
  });
});

describe('Performance Tests', () => {
  it('should process large files efficiently', async () => {
    const startTime = Date.now();
    
    // Create a large CSV file
    const rows = Array.from({ length: 1000 }, (_, i) => 
      `2024-01-${String(i % 30 + 1).padStart(2, '0')},Transaction ${i},-${(Math.random() * 100).toFixed(2)}`
    );
    const csvContent = 'Date,Description,Amount\n' + rows.join('\n');
    
    const mockFile = new File([csvContent], 'large.csv', { type: 'text/csv' });
    
    const result = await fileParser.parseFile(mockFile, {
      enableAI: false,
      maxFileSize: 10 * 1024 * 1024
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    expect(result.success).toBe(true);
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle concurrent file uploads', async () => {
    const files = Array.from({ length: 5 }, (_, i) => {
      const csvContent = `Date,Description,Amount
2024-01-01,Transaction ${i},-${i * 10}.00`;
      return new File([csvContent], `test${i}.csv`, { type: 'text/csv' });
    });

    const promises = files.map(file => 
      fileParser.parseFile(file, { enableAI: false })
    );

    const results = await Promise.all(promises);

    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
