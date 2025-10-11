// LocalStorage utilities for data persistence

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Expense {
  id: string;
  date: string;
  category: "Food & Dining" | "Transportation" | "Shopping" | "Entertainment" | "Healthcare" | "Bills & Utilities" | "Income" | "Other" | "Salary" | "Food" | "Transport" | "Rent";
  description: string;
  amount: number;
  type: "Income" | "Expense";
  recurring?: boolean;
  recurrenceType?: "weekly" | "monthly" | "yearly";
}

export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
}

export interface Investment {
  id: string;
  type: "ETF" | "Crypto" | "Stock" | "Cash";
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  symbol?: string;
  liveTracking?: boolean;
  purchaseDate?: string;
}

export interface PortfolioHistory {
  id: string;
  date: string;
  value: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: "Investment" | "Savings" | "Purchase" | "Emergency" | "Retirement" | "Travel" | "Other";
  priority?: "Low" | "Medium" | "High";
}

const STORAGE_KEYS = {
  USER: "myfinance_user",
  EXPENSES: "myfinance_expenses",
  INCOMES: "myfinance_incomes",
  INVESTMENTS: "myfinance_investments",
  PORTFOLIO_HISTORY: "myfinance_portfolio_history",
  GOALS: "myfinance_goals",
};

// User management
// ⚠️ DEPRECATED: Use Supabase Auth instead (supabase.auth.getUser())
// These functions are kept for backwards compatibility with data migration only
export const saveUser = (user: User) => {
  console.warn("⚠️ saveUser is deprecated. Use Supabase Auth instead.");
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): User | null => {
  console.warn("⚠️ getUser is deprecated. Use supabase.auth.getUser() instead.");
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const clearUser = () => {
  console.warn("⚠️ clearUser is deprecated. Use supabase.auth.signOut() instead.");
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Expenses
export const saveExpenses = (expenses: Expense[]) => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const getExpenses = (): Expense[] => {
  const expenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  if (!expenses) {
    const defaults = getDefaultExpenses();
    saveExpenses(defaults);
    return defaults;
  }
  return JSON.parse(expenses);
};

// Incomes
export const saveIncomes = (incomes: Income[]) => {
  localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
};

export const getIncomes = (): Income[] => {
  const incomes = localStorage.getItem(STORAGE_KEYS.INCOMES);
  return incomes ? JSON.parse(incomes) : [];
};

// Investments
export const saveInvestments = (investments: Investment[]) => {
  localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
};

export const getInvestments = (): Investment[] => {
  const investments = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
  if (!investments) {
    const defaults = getDefaultInvestments();
    saveInvestments(defaults);
    return defaults;
  }
  return JSON.parse(investments);
};

// Portfolio History
export const savePortfolioHistory = (history: PortfolioHistory[]) => {
  localStorage.setItem(STORAGE_KEYS.PORTFOLIO_HISTORY, JSON.stringify(history));
};

export const getPortfolioHistory = (): PortfolioHistory[] => {
  const history = localStorage.getItem(STORAGE_KEYS.PORTFOLIO_HISTORY);
  return history ? JSON.parse(history) : [];
};

// Financial Goals
export const saveGoals = (goals: FinancialGoal[]) => {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
};

export const getGoals = (): FinancialGoal[] => {
  const goals = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (!goals) {
    const defaults = getDefaultGoals();
    saveGoals(defaults);
    return defaults;
  }
  return JSON.parse(goals);
};

// Helper function to get default data with sample data
const getDefaultExpenses = (): Expense[] => {
  const today = new Date();
  const thisMonth = today.toISOString().split('T')[0].slice(0, 7);
  
  return [
    {
      id: crypto.randomUUID(),
      type: "Income",
      amount: 3500,
      category: "Salary",
      description: "Monthly Salary",
      date: `${thisMonth}-01`,
      recurring: true,
      recurrenceType: "monthly",
    },
    {
      id: crypto.randomUUID(),
      type: "Expense",
      amount: 450,
      category: "Food & Dining",
      description: "Grocery Shopping",
      date: `${thisMonth}-05`,
      recurring: false,
    },
    {
      id: crypto.randomUUID(),
      type: "Expense",
      amount: 80,
      category: "Transportation",
      description: "Monthly Transit Pass",
      date: `${thisMonth}-03`,
      recurring: true,
      recurrenceType: "monthly",
    },
    {
      id: crypto.randomUUID(),
      type: "Expense",
      amount: 120,
      category: "Bills & Utilities",
      description: "Electricity Bill",
      date: `${thisMonth}-10`,
      recurring: false,
    },
    {
      id: crypto.randomUUID(),
      type: "Expense",
      amount: 60,
      category: "Entertainment",
      description: "Streaming Services",
      date: `${thisMonth}-01`,
      recurring: true,
      recurrenceType: "monthly",
    },
  ];
};

const getDefaultInvestments = (): Investment[] => [
  {
    id: crypto.randomUUID(),
    symbol: "BTC",
    name: "Bitcoin",
    type: "Crypto",
    quantity: 0.5,
    purchasePrice: 45000,
    currentPrice: 58000,
    purchaseDate: "2024-01-15",
    liveTracking: true,
  },
  {
    id: crypto.randomUUID(),
    symbol: "SPY",
    name: "S&P 500 ETF",
    type: "ETF",
    quantity: 10,
    purchasePrice: 450,
    currentPrice: 480,
    purchaseDate: "2024-02-01",
    liveTracking: true,
  },
];

const getDefaultGoals = (): FinancialGoal[] => [
  {
    id: crypto.randomUUID(),
    name: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 3500,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    category: "Savings",
  },
  {
    id: crypto.randomUUID(),
    name: "Vacation Trip",
    targetAmount: 5000,
    currentAmount: 1200,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
    category: "Travel",
  },
];

// Calculate portfolio value from investments
export const calculatePortfolioValue = (investments: Investment[]): number => {
  return investments.reduce((total, inv) => {
    return total + inv.quantity * inv.currentPrice;
  }, 0);
};

// Export data as CSV
export const exportToCSV = () => {
  const expenses = getExpenses();
  const incomes = getIncomes();
  const investments = getInvestments();
  
  let csv = "Type,Date,Category/Source,Description/Name,Amount\n";
  
  expenses.forEach(exp => {
    csv += `${exp.type},${exp.date},${exp.category},${exp.description},${exp.amount}\n`;
  });
  
  incomes.forEach(inc => {
    csv += `Income,${inc.date},${inc.source},,${inc.amount}\n`;
  });
  
  investments.forEach(inv => {
    csv += `Investment,,,${inv.name},${inv.quantity * inv.currentPrice}\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myfinance_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
};