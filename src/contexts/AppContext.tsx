import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "EUR" | "USD" | "GBP" | "JPY" | "CHF";
export type Language = "en" | "it" | "es" | "fr" | "de";

interface AppContextType {
  currency: Currency;
  language: Language;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  formatCurrency: (amount: number) => string;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const currencySymbols: Record<Currency, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF",
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    income: "Income",
    expenses: "Expenses",
    investments: "Investments",
    goals: "Financial Goals",
    budget: "Budget",
    health: "Financial Health",
    settings: "Settings",
    logout: "Logout",
  },
  it: {
    dashboard: "Dashboard",
    income: "Entrate",
    expenses: "Spese",
    investments: "Investimenti",
    goals: "Obiettivi Finanziari",
    budget: "Budget",
    health: "Salute Finanziaria",
    settings: "Impostazioni",
    logout: "Esci",
  },
  es: {
    dashboard: "Panel",
    income: "Ingresos",
    expenses: "Gastos",
    investments: "Inversiones",
    goals: "Objetivos Financieros",
    budget: "Presupuesto",
    health: "Salud Financiera",
    settings: "Configuración",
    logout: "Salir",
  },
  fr: {
    dashboard: "Tableau de bord",
    income: "Revenus",
    expenses: "Dépenses",
    investments: "Investissements",
    goals: "Objectifs Financiers",
    budget: "Budget",
    health: "Santé Financière",
    settings: "Paramètres",
    logout: "Déconnexion",
  },
  de: {
    dashboard: "Dashboard",
    income: "Einnahmen",
    expenses: "Ausgaben",
    investments: "Investitionen",
    goals: "Finanzziele",
    budget: "Budget",
    health: "Finanzielle Gesundheit",
    settings: "Einstellungen",
    logout: "Abmelden",
  },
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency");
    return (saved as Currency) || "EUR";
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const formatCurrency = (amount: number) => {
    const symbol = currencySymbols[currency];
    return `${symbol}${amount.toFixed(2)}`;
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  return (
    <AppContext.Provider
      value={{ currency, language, setCurrency, setLanguage, formatCurrency, t }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
