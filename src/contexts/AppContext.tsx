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
    // Navigation
    dashboard: "Dashboard",
    income: "Income",
    expenses: "Expenses",
    investments: "Investments",
    goals: "Financial Goals",
    budget: "Budget",
    health: "Financial Health",
    settings: "Settings",
    logout: "Logout",
    insights: "Insights",
    futurePlanner: "Future Planner",
    progressHub: "Progress Hub",
    community: "Community",
    upload: "Upload",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    export: "Export",
    import: "Import",
    search: "Search",
    filter: "Filter",
    total: "Total",
    date: "Date",
    amount: "Amount",
    category: "Category",
    description: "Description",
    
    // Settings Page
    managePreferences: "Manage your preferences",
    securityCompliance: "Security & Compliance",
    dataManagement: "Data Management",
    exportData: "Export Data",
    exportSuccess: "Data exported successfully!",
    
    // Account Menu
    myAccount: "My Account",
    profile: "Profile",
    accountSettings: "Account Settings",
    help: "Help",
    documentation: "Documentation",
  },
  it: {
    // Navigation
    dashboard: "Dashboard",
    income: "Entrate",
    expenses: "Spese",
    investments: "Investimenti",
    goals: "Obiettivi Finanziari",
    budget: "Budget",
    health: "Salute Finanziaria",
    settings: "Impostazioni",
    logout: "Esci",
    insights: "Statistiche",
    futurePlanner: "Pianificatore Futuro",
    progressHub: "Hub Progressi",
    community: "Comunità",
    upload: "Carica",
    
    // Common
    save: "Salva",
    cancel: "Annulla",
    delete: "Elimina",
    edit: "Modifica",
    add: "Aggiungi",
    export: "Esporta",
    import: "Importa",
    search: "Cerca",
    filter: "Filtra",
    total: "Totale",
    date: "Data",
    amount: "Importo",
    category: "Categoria",
    description: "Descrizione",
    
    // Settings Page
    managePreferences: "Gestisci le tue preferenze",
    securityCompliance: "Sicurezza e Conformità",
    dataManagement: "Gestione Dati",
    exportData: "Esporta Dati",
    exportSuccess: "Dati esportati con successo!",
    
    // Account Menu
    myAccount: "Il Mio Account",
    profile: "Profilo",
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
