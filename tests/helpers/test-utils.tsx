import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper to generate CSV content
export const generateCSV = (rows: number): string => {
  const headers = 'Date,Description,Amount,Category\n';
  const rows_data = Array.from({ length: rows }, (_, i) => {
    const date = new Date(2024, 0, i + 1).toISOString().split('T')[0];
    const descriptions = ['Groceries', 'Restaurant', 'Gas', 'Shopping', 'Bills'];
    const categories = ['Food', 'Dining', 'Transport', 'Shopping', 'Utilities'];
    const desc = descriptions[i % descriptions.length];
    const cat = categories[i % categories.length];
    const amount = (Math.random() * 100 + 10).toFixed(2);
    return `${date},${desc},${amount},${cat}`;
  }).join('\n');
  
  return headers + rows_data;
};

// Helper to create File objects
export const createTestFile = (content: string, filename: string, type: string): File => {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
};

// Helper to wait for async operations
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));
