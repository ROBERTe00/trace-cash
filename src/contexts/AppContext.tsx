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
  currencySymbols: Record<Currency, string>;
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
    // Navigation
    dashboard: "Dashboard",
    expenses: "Expenses",
    insights: "Insights",
    investments: "Investments",
    progress: "Progress",
    community: "Community",
    future: "Future Planner",
    upload: "Upload",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    
    // Common Actions
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    
    // Investment translations
    "investment.quickAdd": "Quick Add Investment",
    "investment.type": "Type",
    "investment.name": "Name",
    "investment.symbol": "Symbol",
    "investment.currentPrice": "Current Price",
    "investment.purchasePrice": "Purchase Price",
    "investment.quantity": "Quantity",
    "investment.profitLoss": "Profit/Loss",
    "investment.liveTracking": "Enable Live Price Tracking",
    "investment.addButton": "Add Investment",
    "investment.livePrice": "Live",
    
    // Portfolio
    "portfolio.analysis": "Portfolio Analysis",
    "portfolio.addInvestments": "Add investments to see your portfolio analysis",
    "portfolio.assetAllocation": "Asset Allocation",
    "portfolio.diversification": "Diversification Score",
    "portfolio.excellentDiv": "Excellent diversification",
    "portfolio.goodDiv": "Good diversification",
    "portfolio.considerDiv": "Consider diversifying more",
    "portfolio.riskLevel": "Risk Level",
    "portfolio.riskBased": "Based on asset allocation and volatility",
    "portfolio.totalYield": "Total Yield",
    "portfolio.avgReturn": "average return",
    
    // Simulator
    "simulator.title": "Scenario Simulator",
    "simulator.description": "Project your portfolio growth with monthly contributions",
    "simulator.monthlyContribution": "Monthly Contribution",
    "simulator.timeHorizon": "Time Horizon (Years)",
    "simulator.expectedReturn": "Expected Annual Return",
    "simulator.taxRate": "Capital Gains Tax",
    "simulator.projectedValue": "Projected Value",
    "simulator.totalContributions": "Total Contributions",
    "simulator.totalGains": "Total Gains",
    "simulator.taxLiability": "Tax Liability",
    "simulator.projectedGrowth": "Projected Growth",
    "simulator.netValue": "Net Value After Taxes",
    "simulator.finalValue": "Final value after",
    "simulator.conservative": "Conservative (4-6%)",
    "simulator.moderate": "Moderate (7-10%)",
    "simulator.aggressive": "Aggressive (11%+)",
    "simulator.italyTax": "Italy: 26% standard, up to 43% for some assets",
    
    // Metrics
    "metrics.alerts": "Portfolio Alerts",
    "metrics.totalValue": "Total Value",
    "metrics.annualizedReturn": "Annualized Return",
    "metrics.volatility": "Volatility",
    "metrics.sharpeRatio": "Sharpe Ratio",
    "metrics.diversification": "Asset Diversification",
    "metrics.wellDiversified": "Well Diversified",
    "metrics.concentrated": "Concentrated",
    "metrics.lowerBetter": "Lower is better",
    "metrics.good": "Good",
    "metrics.fair": "Fair",
    "metrics.poor": "Poor",
    
    // Settings Page
    managePreferences: "Manage your preferences",
    securityCompliance: "Security & Compliance",
    dataManagement: "Data Management",
    exportData: "Export Data",
    exportSuccess: "Data exported successfully!",
    
    // Account Menu
    myAccount: "My Account",
    accountSettings: "Account Settings",
    help: "Help",
    documentation: "Documentation",
  },
  it: {
    // Navigation
    dashboard: "Dashboard",
    expenses: "Spese",
    insights: "Analisi",
    investments: "Investimenti",
    progress: "Progressi",
    community: "Community",
    future: "Pianificazione",
    upload: "Carica",
    settings: "Impostazioni",
    profile: "Profilo",
    logout: "Esci",
    
    // Common Actions
    add: "Aggiungi",
    edit: "Modifica",
    delete: "Elimina",
    save: "Salva",
    cancel: "Annulla",
    
    // Investment translations
    "investment.quickAdd": "Aggiungi Investimento",
    "investment.type": "Tipo",
    "investment.name": "Nome",
    "investment.symbol": "Simbolo",
    "investment.currentPrice": "Prezzo Attuale",
    "investment.purchasePrice": "Prezzo d'Acquisto",
    "investment.quantity": "Quantità",
    "investment.profitLoss": "Profitto/Perdita",
    "investment.liveTracking": "Attiva Prezzi Live",
    "investment.addButton": "Aggiungi Investimento",
    "investment.livePrice": "Live",
    
    // Portfolio
    "portfolio.analysis": "Analisi Portfolio",
    "portfolio.addInvestments": "Aggiungi investimenti per vedere l'analisi",
    "portfolio.assetAllocation": "Allocazione Asset",
    "portfolio.diversification": "Punteggio Diversificazione",
    "portfolio.excellentDiv": "Ottima diversificazione",
    "portfolio.goodDiv": "Buona diversificazione",
    "portfolio.considerDiv": "Considera di diversificare",
    "portfolio.riskLevel": "Livello di Rischio",
    "portfolio.riskBased": "Basato su allocazione e volatilità",
    "portfolio.totalYield": "Rendimento Totale",
    "portfolio.avgReturn": "rendimento medio",
    
    // Simulator
    "simulator.title": "Simulatore Scenari",
    "simulator.description": "Proietta la crescita del portfolio",
    "simulator.monthlyContribution": "Contributo Mensile",
    "simulator.timeHorizon": "Orizzonte Temporale (Anni)",
    "simulator.expectedReturn": "Rendimento Annuo Atteso",
    "simulator.taxRate": "Tassazione Capital Gain",
    "simulator.projectedValue": "Valore Proiettato",
    "simulator.totalContributions": "Contributi Totali",
    "simulator.totalGains": "Guadagni Totali",
    "simulator.taxLiability": "Imposte",
    "simulator.projectedGrowth": "Crescita Proiettata",
    "simulator.netValue": "Valore Netto Dopo Tasse",
    "simulator.finalValue": "Valore finale dopo",
    "simulator.conservative": "Conservativo (4-6%)",
    "simulator.moderate": "Moderato (7-10%)",
    "simulator.aggressive": "Aggressivo (11%+)",
    "simulator.italyTax": "Italia: 26% standard, 43% per alcuni asset",
    
    // Metrics
    "metrics.alerts": "Avvisi Portfolio",
    "metrics.totalValue": "Valore Totale",
    "metrics.annualizedReturn": "Rendimento Annualizzato",
    "metrics.volatility": "Volatilità",
    "metrics.sharpeRatio": "Indice di Sharpe",
    "metrics.diversification": "Diversificazione Asset",
    "metrics.wellDiversified": "Ben Diversificato",
    "metrics.concentrated": "Concentrato",
    "metrics.lowerBetter": "Più basso è meglio",
    "metrics.good": "Buono",
    "metrics.fair": "Discreto",
    "metrics.poor": "Scarso",
    
    // Settings Page
    managePreferences: "Gestisci le tue preferenze",
    securityCompliance: "Sicurezza e Conformità",
    dataManagement: "Gestione Dati",
    exportData: "Esporta Dati",
    exportSuccess: "Dati esportati con successo!",
    
    // Account Menu
    myAccount: "Il Mio Account",
    accountSettings: "Impostazioni Account",
    help: "Aiuto",
    documentation: "Documentazione",
  },
  es: {
    // Navigation
    dashboard: "Panel",
    income: "Ingresos",
    expenses: "Gastos",
    investments: "Inversiones",
    goals: "Objetivos Financieros",
    budget: "Presupuesto",
    health: "Salud Financiera",
    settings: "Configuración",
    logout: "Salir",
    insights: "Análisis",
    futurePlanner: "Planificador Futuro",
    progressHub: "Centro de Progreso",
    community: "Comunidad",
    upload: "Subir",
    
    // Common
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Añadir",
    export: "Exportar",
    import: "Importar",
    search: "Buscar",
    filter: "Filtrar",
    total: "Total",
    date: "Fecha",
    amount: "Cantidad",
    category: "Categoría",
    description: "Descripción",
    
    // Settings Page
    managePreferences: "Gestionar preferencias",
    securityCompliance: "Seguridad y Cumplimiento",
    dataManagement: "Gestión de Datos",
    exportData: "Exportar Datos",
    exportSuccess: "¡Datos exportados con éxito!",
    
    // Account Menu
    myAccount: "Mi Cuenta",
    profile: "Perfil",
    accountSettings: "Configuración de Cuenta",
    help: "Ayuda",
    documentation: "Documentación",
  },
  fr: {
    // Navigation
    dashboard: "Tableau de bord",
    income: "Revenus",
    expenses: "Dépenses",
    investments: "Investissements",
    goals: "Objectifs Financiers",
    budget: "Budget",
    health: "Santé Financière",
    settings: "Paramètres",
    logout: "Déconnexion",
    insights: "Analyses",
    futurePlanner: "Planificateur Futur",
    progressHub: "Hub de Progrès",
    community: "Communauté",
    upload: "Télécharger",
    
    // Common
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    export: "Exporter",
    import: "Importer",
    search: "Rechercher",
    filter: "Filtrer",
    total: "Total",
    date: "Date",
    amount: "Montant",
    category: "Catégorie",
    description: "Description",
    
    // Settings Page
    managePreferences: "Gérer vos préférences",
    securityCompliance: "Sécurité et Conformité",
    dataManagement: "Gestion des Données",
    exportData: "Exporter les Données",
    exportSuccess: "Données exportées avec succès!",
    
    // Account Menu
    myAccount: "Mon Compte",
    profile: "Profil",
    accountSettings: "Paramètres du Compte",
    help: "Aide",
    documentation: "Documentation",
  },
  de: {
    // Navigation
    dashboard: "Dashboard",
    income: "Einnahmen",
    expenses: "Ausgaben",
    investments: "Investitionen",
    goals: "Finanzziele",
    budget: "Budget",
    health: "Finanzielle Gesundheit",
    settings: "Einstellungen",
    logout: "Abmelden",
    insights: "Einblicke",
    futurePlanner: "Zukunftsplaner",
    progressHub: "Fortschrittszentrum",
    community: "Gemeinschaft",
    upload: "Hochladen",
    
    // Common
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    export: "Exportieren",
    import: "Importieren",
    search: "Suchen",
    filter: "Filtern",
    total: "Gesamt",
    date: "Datum",
    amount: "Betrag",
    category: "Kategorie",
    description: "Beschreibung",
    
    // Settings Page
    managePreferences: "Einstellungen verwalten",
    securityCompliance: "Sicherheit und Compliance",
    dataManagement: "Datenverwaltung",
    exportData: "Daten exportieren",
    exportSuccess: "Daten erfolgreich exportiert!",
    
    // Account Menu
    myAccount: "Mein Konto",
    profile: "Profil",
    accountSettings: "Kontoeinstellungen",
    help: "Hilfe",
    documentation: "Dokumentation",
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
      value={{ currency, language, setCurrency, setLanguage, formatCurrency, t, currencySymbols }}
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
