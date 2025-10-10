// LocalStorage utilities for data persistence

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Expense {
  id: string;
  date: string;
  category: "Food" | "Transport" | "Entertainment" | "Rent" | "Other";
  description: string;
  amount: number;
  type: "Income" | "Expense";
  recurrence?: "None" | "Weekly" | "Monthly";
}

export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
}

export interface Investment {
  id: string;
  category: "ETF" | "Crypto" | "Stocks" | "Cash";
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  symbol?: string;
  liveTracking?: boolean;
  date?: string;
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
  category: "Investment" | "Savings" | "Purchase" | "Emergency" | "Retirement" | "Other";
  priority: "Low" | "Medium" | "High";
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
export const saveUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Expenses
export const saveExpenses = (expenses: Expense[]) => {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

export const getExpenses = (): Expense[] => {
  const expenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  return expenses ? JSON.parse(expenses) : [];
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
  return investments ? JSON.parse(investments) : [];
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
  return goals ? JSON.parse(goals) : [];
};

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