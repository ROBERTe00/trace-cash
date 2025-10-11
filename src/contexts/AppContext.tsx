import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "EUR" | "USD" | "GBP" | "JPY" | "CHF" | "CNY" | "AUD" | "CAD" | "BRL" | "INR" | "RUB" | "SEK" | "NOK" | "DKK" | "PLN" | "MXN" | "ZAR" | "SGD" | "HKD" | "KRW" | "TRY" | "AED" | "THB" | "IDR" | "MYR";
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
  CNY: "¥",
  AUD: "A$",
  CAD: "C$",
  BRL: "R$",
  INR: "₹",
  RUB: "₽",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  MXN: "Mex$",
  ZAR: "R",
  SGD: "S$",
  HKD: "HK$",
  KRW: "₩",
  TRY: "₺",
  AED: "د.إ",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
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
    close: "Close",
    confirm: "Confirm",
    refresh: "Refresh",
    optional: "Optional",
    
    // Theme
    "theme.settings": "Theme Settings",
    "theme.appearance": "Appearance",
    "theme.dark": "Dark",
    "theme.light": "Light",
    "theme.darkActivated": "Dark mode activated",
    "theme.lightActivated": "Light mode activated",
    "theme.colorTheme": "Color Theme",
    "theme.applied": "theme applied",
    
    // Currency & Language  
    "currency.label": "Currency",
    "currency.default": "Default Currency",
    "currency.changed": "Currency changed to",
    "language.label": "Language",
    "language.interface": "Interface Language",
    "language.changed": "Language changed to",
    
    // Voice Input
    "voice.input": "Voice Input",
    "voice.listening": "Listening...",
    "voice.speak": "Speak now!",
    "voice.notSupported": "Speech recognition not supported in this browser",
    "voice.detected": "Expense detected! Review and confirm below",
    "voice.error": "Couldn't understand the command. Try: 'Add 50 euros food expense'",
    "voice.errorRecognizing": "Error recognizing speech. Please try again.",
    "voice.detectedExpense": "Detected Expense",
    "voice.confirmAdd": "Confirm & Add",
    "voice.tryExample": "Try: 'Add 50 euros food expense' or 'Spent 30 on transport'",
    "voice.added": "Added",
    "voice.to": "to",
    "voice.stop": "Stop Recording",
    "voice.start": "Start Voice Input",
    
    // AI Insights
    "ai.insights": "AI Insights",
    "ai.refresh": "Refresh",
    "ai.noInsights": "No insights yet",
    "ai.addMore": "Add more transactions to get personalized advice",
    "ai.powered": "Insights powered by AI - recommendations based on your financial patterns",
    "ai.highImpact": "high impact",
    "ai.mediumImpact": "medium impact",
    "ai.lowImpact": "low impact",
    "ai.learnMore": "Learn More",
    "ai.goalBehindSchedule": "Goal Behind Schedule",
    "ai.youAreBehind": "You're behind on",
    "ai.increaseSavings": "Increase savings by",
    "ai.toStayOnTrack": "to stay on track",
    "ai.reduceTopCategory": "Reduce Top Spending",
    "ai.accountsFor": "accounts for",
    "ai.considerCutting": "Consider cutting",
    "ai.toAccelerateGoals": "to accelerate your goals",
    "ai.diversifyPortfolio": "Diversify Your Portfolio",
    "ai.diversifyPortfolioDesc": "Consider adding 2-3 more assets to reduce risk. ETFs provide instant diversification.",
    "ai.actionSteps": "Recommended Action",
    "ai.reviewYourData": "Review your financial data regularly",
    "ai.setSmartGoals": "Set SMART goals and track progress",
    "ai.trackProgress": "Monitor and adjust your strategy monthly",
    "ai.financialInsights": "AI Financial Insights",
    "ai.insightsAvailable": "personalized insights",
    "ai.updated": "Updated",
    "ai.analyzing": "Analyzing...",
    "ai.noInsightsTitle": "No Insights Yet",
    "ai.noInsightsDesc": "Add transactions and investments to get personalized AI-powered insights about your financial health.",
    "ai.poweredBy": "Insights powered by AI based on your financial data",
    "ai.typeWarning": "Warning",
    "ai.typeTip": "Tip",
    "ai.typeSuccess": "Success",
    "ai.typeInfo": "Info",
    
    // Charts
    "chart.expenseAnalysis": "Interactive Expense Analysis",
    "chart.investmentPerformance": "Investment Performance",
    "chart.categoryBreakdown": "Category Breakdown",
    "chart.pieView": "Pie View",
    "chart.barView": "Bar View",
    "chart.lineView": "Line View",
    "chart.areaView": "Area View",
    "chart.showZoom": "Show Zoom",
    "chart.hideZoom": "Hide Zoom",
    "chart.noExpenses": "No expenses yet",
    "chart.noInvestments": "No investments yet",
    "chart.ofTotal": "of total",
    "chart.moreTransactions": "more transactions",
    "chart.currentValue": "Current Value",
    "chart.totalChange": "Total Change",
    "chart.assets": "Assets",
    "chart.individualAssets": "Individual Assets",
    "chart.shares": "shares",
    "chart.portfolioValue": "Portfolio Value",
    
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
    "investment.selectType": "Select investment type",
    "investment.enterName": "Enter investment name",
    "investment.searchAsset": "Search asset...",
    "investment.profitPercent": "Profit Percentage",
    "investment.shares": "Number of Shares",
    "investment.symbolOptional": "Symbol (Optional)",
    "investment.willBe": "will be",
    "investment.loading": "Loading price...",
    "investment.typeStock": "Stock",
    "investment.typeETF": "ETF",
    "investment.typeCrypto": "Cryptocurrency",
    "investment.typeCash": "Cash",
    "investment.addCustomAsset": "Add Custom Asset",
    "investment.assetName": "Asset Name",
    
    // Investments Page
    "investments.title": "Investments",
    "investments.subtitle": "Advanced portfolio management and analytics",
    "investments.overview": "Overview",
    "investments.analytics": "Analytics",
    "investments.simulator": "Simulator",
    "investments.import": "Import",
    "investments.quickAdd": "Quick Add Investment",
    "investments.all": "All",
    "investments.totalValue": "Total Value",
    "investments.totalReturn": "Total Return",
    "investments.filterBy": "Filter by:",
    "investments.addNew": "Add New Investment",
    "investments.addNewDesc": "Fill in the details below to add a new investment to your portfolio",
    "investments.portfolio": "Investment Portfolio",
    "investments.syncPrices": "Sync All Prices",
    "investments.category": "Category",
    "investments.name": "Name",
    "investments.quantity": "Quantity",
    "investments.purchasePrice": "Purchase Price",
    "investments.currentPrice": "Current Price",
    "investments.initialValue": "Initial Value",
    "investments.currentValue": "Current Value",
    "investments.yield": "Yield %",
    "investments.noInvestments": "No investments yet",
    "investments.comingSoon": "Coming Soon",
    "investments.moreBrokers": "More broker integrations including Interactive Brokers, Coinbase, and Binance",
    
    // Common
    "common.exportCSV": "Export CSV",
    "common.exportPDF": "Export PDF",
    "common.optional": "Optional",
    
    // Portfolio
    "portfolio.analysis": "Portfolio Analysis",
    "portfolio.addInvestments": "Add investments to see your portfolio analysis",
    "portfolio.assetAllocation": "Asset Allocation",
    "portfolio.allocation": "Asset Allocation",
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
    "metrics.needsAttention": "Needs Attention",
    "metrics.consider": "Consider Improvements",
    
    // Settings
    "settings.appearance": "Appearance",
    "settings.security": "Security",
    "settings.data": "Data & Privacy",
    "settings.offline": "Offline Mode",
    "settings.appearanceDesc": "Customize the look and feel of your app",
    "settings.securityDesc": "Protect your account and data",
    "settings.dataDesc": "Manage your data and privacy settings",
    "settings.offlineDesc": "Work without an internet connection",
    managePreferences: "Manage your preferences",
    exportSuccess: "Data exported successfully!",
    
    // Toast Messages
    investmentAdded: "Investment added successfully!",
    investmentDeleted: "Investment deleted successfully!",
    investmentFailed: "Failed to perform operation",
    priceUpdateFailed: "Failed to update price",
    pricesUpdated: "Updated {count} asset(s)!",
    loginRequired: "Please log in to add investments",
    loadFailed: "Failed to load data",
    logoutError: "Logout error",
  },
  it: {
    // Navigation
    dashboard: "Dashboard",
    expenses: "Spese",
    insights: "Analisi",
    investments: "Investimenti",
    progress: "Progresso",
    community: "Comunità",
    future: "Pianificatore Futuro",
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
    close: "Chiudi",
    confirm: "Conferma",
    refresh: "Aggiorna",
    optional: "Opzionale",
    
    // Theme
    "theme.settings": "Impostazioni Tema",
    "theme.appearance": "Aspetto",
    "theme.dark": "Scuro",
    "theme.light": "Chiaro",
    "theme.darkActivated": "Modalità scura attivata",
    "theme.lightActivated": "Modalità chiara attivata",
    "theme.colorTheme": "Tema Colore",
    "theme.applied": "tema applicato",
    
    // Currency & Language
    "currency.label": "Valuta",
    "currency.default": "Valuta Predefinita",
    "currency.changed": "Valuta cambiata in",
    "language.label": "Lingua",
    "language.interface": "Lingua dell'Interfaccia",
    "language.changed": "Lingua cambiata in",
    
    // Voice Input
    "voice.input": "Input Vocale",
    "voice.listening": "In ascolto...",
    "voice.speak": "Parla ora!",
    "voice.notSupported": "Riconoscimento vocale non supportato in questo browser",
    "voice.detected": "Spesa rilevata! Controlla e conferma qui sotto",
    "voice.error": "Comando non compreso. Prova: 'Aggiungi 50 euro spesa cibo'",
    "voice.errorRecognizing": "Errore nel riconoscimento vocale. Riprova.",
    "voice.detectedExpense": "Spesa Rilevata",
    "voice.confirmAdd": "Conferma e Aggiungi",
    "voice.tryExample": "Prova: 'Aggiungi 50 euro spesa cibo' o 'Spesi 30 per trasporto'",
    "voice.added": "Aggiunto",
    "voice.to": "a",
    "voice.stop": "Ferma Registrazione",
    "voice.start": "Avvia Input Vocale",
    
    // AI Insights
    "ai.insights": "Analisi AI",
    "ai.refresh": "Aggiorna",
    "ai.noInsights": "Nessuna analisi ancora",
    "ai.addMore": "Aggiungi più transazioni per ricevere consigli personalizzati",
    "ai.powered": "Analisi basate su AI - raccomandazioni sui tuoi pattern finanziari",
    "ai.highImpact": "alto impatto",
    "ai.mediumImpact": "medio impatto",
    "ai.lowImpact": "basso impatto",
    "ai.learnMore": "Scopri di Più",
    "ai.goalBehindSchedule": "Obiettivo in Ritardo",
    "ai.youAreBehind": "Sei in ritardo su",
    "ai.increaseSavings": "Aumenta i risparmi di",
    "ai.toStayOnTrack": "per restare in pista",
    "ai.reduceTopCategory": "Riduci Spese Principali",
    "ai.accountsFor": "rappresenta",
    "ai.considerCutting": "Considera di ridurre del",
    "ai.toAccelerateGoals": "per accelerare i tuoi obiettivi",
    "ai.diversifyPortfolio": "Diversifica il Portfolio",
    "ai.diversifyPortfolioDesc": "Considera di aggiungere 2-3 asset per ridurre il rischio. Gli ETF offrono diversificazione istantanea.",
    "ai.actionSteps": "Azione Consigliata",
    "ai.reviewYourData": "Rivedi i tuoi dati finanziari regolarmente",
    "ai.setSmartGoals": "Imposta obiettivi SMART e traccia i progressi",
    "ai.trackProgress": "Monitora e regola la tua strategia mensilmente",
    "ai.financialInsights": "Analisi AI Finanziari",
    "ai.insightsAvailable": "analisi personalizzate",
    "ai.updated": "Aggiornato",
    "ai.analyzing": "Analizzando...",
    "ai.noInsightsTitle": "Nessuna Analisi",
    "ai.noInsightsDesc": "Aggiungi transazioni e investimenti per ottenere analisi AI personalizzate sulla tua salute finanziaria.",
    "ai.poweredBy": "Analisi generate dall'AI basate sui tuoi dati finanziari",
    "ai.typeWarning": "Avviso",
    "ai.typeTip": "Suggerimento",
    "ai.typeSuccess": "Successo",
    "ai.typeInfo": "Info",
    
    // Charts
    "chart.expenseAnalysis": "Analisi Spese Interattiva",
    "chart.investmentPerformance": "Performance Investimenti",
    "chart.categoryBreakdown": "Dettaglio per Categoria",
    "chart.pieView": "Vista Torta",
    "chart.barView": "Vista Barre",
    "chart.lineView": "Vista Linea",
    "chart.areaView": "Vista Area",
    "chart.showZoom": "Mostra Zoom",
    "chart.hideZoom": "Nascondi Zoom",
    "chart.noExpenses": "Nessuna spesa ancora",
    "chart.noInvestments": "Nessun investimento ancora",
    "chart.ofTotal": "del totale",
    "chart.moreTransactions": "altre transazioni",
    "chart.currentValue": "Valore Corrente",
    "chart.totalChange": "Cambio Totale",
    "chart.assets": "Asset",
    "chart.individualAssets": "Asset Individuali",
    "chart.shares": "azioni",
    "chart.portfolioValue": "Valore Portfolio",
    
    // Investment translations
    "investment.quickAdd": "Aggiungi Investimento Rapido",
    "investment.type": "Tipo",
    "investment.name": "Nome",
    "investment.symbol": "Simbolo",
    "investment.currentPrice": "Prezzo Corrente",
    "investment.purchasePrice": "Prezzo d'Acquisto",
    "investment.quantity": "Quantità",
    "investment.profitLoss": "Profitto/Perdita",
    "investment.liveTracking": "Abilita Monitoraggio Prezzo Live",
    "investment.addButton": "Aggiungi Investimento",
    "investment.livePrice": "Live",
    "investment.selectType": "Seleziona tipo di investimento",
    "investment.enterName": "Inserisci nome investimento",
    "investment.searchAsset": "Cerca asset...",
    "investment.profitPercent": "Percentuale di Profitto",
    "investment.shares": "Numero di Azioni",
    "investment.symbolOptional": "Simbolo (Opzionale)",
    "investment.willBe": "sarà",
    "investment.loading": "Caricamento prezzo...",
    "investment.typeStock": "Azioni",
    "investment.typeETF": "ETF",
    "investment.typeCrypto": "Criptovaluta",
    "investment.typeCash": "Contanti",
    "investment.addCustomAsset": "Aggiungi Asset Personalizzato",
    "investment.assetName": "Nome Asset",
    
    // Investments Page
    "investments.title": "Investimenti",
    "investments.subtitle": "Gestione avanzata del portafoglio e analisi",
    "investments.overview": "Panoramica",
    "investments.analytics": "Analisi",
    "investments.simulator": "Simulatore",
    "investments.import": "Importa",
    "investments.quickAdd": "Aggiungi Investimento",
    "investments.all": "Tutti",
    "investments.totalValue": "Valore Totale",
    "investments.totalReturn": "Rendimento Totale",
    "investments.filterBy": "Filtra per:",
    "investments.addNew": "Aggiungi Investimento",
    "investments.addNewDesc": "Compila i dettagli per aggiungere un nuovo investimento al tuo portafoglio",
    "investments.portfolio": "Portafoglio Investimenti",
    "investments.syncPrices": "Sincronizza Prezzi",
    "investments.category": "Categoria",
    "investments.name": "Nome",
    "investments.quantity": "Quantità",
    "investments.purchasePrice": "Prezzo Acquisto",
    "investments.currentPrice": "Prezzo Attuale",
    "investments.initialValue": "Valore Iniziale",
    "investments.currentValue": "Valore Attuale",
    "investments.yield": "Rendimento %",
    "investments.noInvestments": "Nessun investimento ancora",
    "investments.comingSoon": "Prossimamente",
    "investments.moreBrokers": "Più integrazioni broker tra cui Interactive Brokers, Coinbase e Binance",
    
    // Common
    "common.exportCSV": "Esporta CSV",
    "common.exportPDF": "Esporta PDF",
    "common.optional": "Opzionale",
    
    // Portfolio
    "portfolio.analysis": "Analisi Portfolio",
    "portfolio.addInvestments": "Aggiungi investimenti per vedere l'analisi del portfolio",
    "portfolio.assetAllocation": "Allocazione Asset",
    "portfolio.allocation": "Allocazione Asset",
    "portfolio.diversification": "Punteggio Diversificazione",
    "portfolio.excellentDiv": "Diversificazione eccellente",
    "portfolio.goodDiv": "Buona diversificazione",
    "portfolio.considerDiv": "Considera di diversificare di più",
    "portfolio.riskLevel": "Livello di Rischio",
    "portfolio.riskBased": "Basato su allocazione asset e volatilità",
    "portfolio.totalYield": "Rendimento Totale",
    "portfolio.avgReturn": "rendimento medio",
    
    // Simulator
    "simulator.title": "Simulatore di Scenario",
    "simulator.description": "Proietta la crescita del tuo portfolio con contributi mensili",
    "simulator.monthlyContribution": "Contributo Mensile",
    "simulator.timeHorizon": "Orizzonte Temporale (Anni)",
    "simulator.expectedReturn": "Rendimento Annuale Atteso",
    "simulator.taxRate": "Tassa su Plusvalenze",
    "simulator.projectedValue": "Valore Proiettato",
    "simulator.totalContributions": "Contributi Totali",
    "simulator.totalGains": "Guadagni Totali",
    "simulator.taxLiability": "Responsabilità Fiscale",
    "simulator.projectedGrowth": "Crescita Proiettata",
    "simulator.netValue": "Valore Netto Dopo Tasse",
    "simulator.finalValue": "Valore finale dopo",
    "simulator.conservative": "Conservativo (4-6%)",
    "simulator.moderate": "Moderato (7-10%)",
    "simulator.aggressive": "Aggressivo (11%+)",
    "simulator.italyTax": "Italia: 26% standard, fino al 43% per alcuni asset",
    
    // Metrics
    "metrics.alerts": "Avvisi Portfolio",
    "metrics.totalValue": "Valore Totale",
    "metrics.annualizedReturn": "Rendimento Annualizzato",
    "metrics.volatility": "Volatilità",
    "metrics.sharpeRatio": "Rapporto Sharpe",
    "metrics.diversification": "Diversificazione Asset",
    "metrics.wellDiversified": "Ben Diversificato",
    "metrics.needsAttention": "Richiede Attenzione",
    "metrics.consider": "Considera Miglioramenti",
    
    // Settings
    "settings.appearance": "Aspetto",
    "settings.security": "Sicurezza",
    "settings.data": "Dati e Privacy",
    "settings.offline": "Modalità Offline",
    "settings.appearanceDesc": "Personalizza l'aspetto della tua app",
    "settings.securityDesc": "Proteggi il tuo account e i tuoi dati",
    "settings.dataDesc": "Gestisci i tuoi dati e le impostazioni della privacy",
    "settings.offlineDesc": "Lavora senza connessione internet",
    managePreferences: "Gestisci le tue preferenze",
    exportSuccess: "Dati esportati con successo!",
    
    // Toast Messages
    investmentAdded: "Investimento aggiunto con successo!",
    investmentDeleted: "Investimento eliminato con successo!",
    investmentFailed: "Operazione fallita",
    priceUpdateFailed: "Aggiornamento prezzo fallito",
    pricesUpdated: "{count} asset aggiornati!",
    loginRequired: "Effettua il login per aggiungere investimenti",
    loadFailed: "Caricamento dati fallito",
    logoutError: "Errore durante il logout",
  },
  es: {
    // Navigation
    dashboard: "Panel",
    expenses: "Gastos",
    insights: "Análisis",
    investments: "Inversiones",
    progress: "Progreso",
    community: "Comunidad",
    future: "Planificador Futuro",
    upload: "Subir",
    settings: "Configuración",
    profile: "Perfil",
    logout: "Salir",
    
    // Common Actions
    add: "Añadir",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    confirm: "Confirmar",
    refresh: "Actualizar",
    
    // Theme
    "theme.settings": "Configuración de Tema",
    "theme.appearance": "Apariencia",
    "theme.dark": "Oscuro",
    "theme.light": "Claro",
    "theme.darkActivated": "Modo oscuro activado",
    "theme.lightActivated": "Modo claro activado",
    "theme.colorTheme": "Tema de Color",
    "theme.applied": "tema aplicado",
    
    // Add similar translations for all other keys...
    "investment.quickAdd": "Añadir Inversión Rápida",
    "voice.input": "Entrada de Voz",
    "ai.insights": "Análisis IA",
    "chart.expenseAnalysis": "Análisis de Gastos Interactivo",
  },
  fr: {
    // Navigation
    dashboard: "Tableau de bord",
    expenses: "Dépenses",
    insights: "Analyses",
    investments: "Investissements",
    progress: "Progrès",
    community: "Communauté",
    future: "Planificateur Futur",
    upload: "Télécharger",
    settings: "Paramètres",
    profile: "Profil",
    logout: "Déconnexion",
    
    // Common Actions
    add: "Ajouter",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    close: "Fermer",
    confirm: "Confirmer",
    refresh: "Actualiser",
    
    // Theme
    "theme.settings": "Paramètres du Thème",
    "theme.appearance": "Apparence",
    "theme.dark": "Sombre",
    "theme.light": "Clair",
    "theme.darkActivated": "Mode sombre activé",
    "theme.lightActivated": "Mode clair activé",
    "theme.colorTheme": "Thème de Couleur",
    "theme.applied": "thème appliqué",
    
    // Add similar translations for all other keys...
    "investment.quickAdd": "Ajouter Investissement Rapide",
    "voice.input": "Entrée Vocale",
    "ai.insights": "Analyses IA",
    "chart.expenseAnalysis": "Analyse des Dépenses Interactive",
  },
  de: {
    // Navigation
    dashboard: "Dashboard",
    expenses: "Ausgaben",
    insights: "Einblicke",
    investments: "Investitionen",
    progress: "Fortschritt",
    community: "Gemeinschaft",
    future: "Zukunftsplaner",
    upload: "Hochladen",
    settings: "Einstellungen",
    profile: "Profil",
    logout: "Abmelden",
    
    // Common Actions
    add: "Hinzufügen",
    edit: "Bearbeiten",
    delete: "Löschen",
    save: "Speichern",
    cancel: "Abbrechen",
    close: "Schließen",
    confirm: "Bestätigen",
    refresh: "Aktualisieren",
    
    // Theme
    "theme.settings": "Theme-Einstellungen",
    "theme.appearance": "Erscheinungsbild",
    "theme.dark": "Dunkel",
    "theme.light": "Hell",
    "theme.darkActivated": "Dunkler Modus aktiviert",
    "theme.lightActivated": "Heller Modus aktiviert",
    "theme.colorTheme": "Farbthema",
    "theme.applied": "Theme angewendet",
    
    // Add similar translations for all other keys...
    "investment.quickAdd": "Schnell Investition Hinzufügen",
    "voice.input": "Spracheingabe",
    "ai.insights": "KI-Einblicke",
    "chart.expenseAnalysis": "Interaktive Ausgabenanalyse",
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
  if (context === undefined) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
