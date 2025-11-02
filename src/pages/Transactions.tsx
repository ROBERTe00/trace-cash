import { ExpenseForm } from "@/components/ExpenseForm";
import { EnhancedExpenseForm } from "@/components/forms/EnhancedExpenseForm";
import { AdvancedFilterSystem } from "@/components/filters/AdvancedFilterSystem";
import { Modal } from "@/components/modals/ModalSystem";
import { useModal } from "@/hooks/useInteractions";
import { TransactionAnalysisPanel } from "@/components/transactions/TransactionAnalysisPanel";
import { AdvancedBankStatementUpload } from "@/components/AdvancedBankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { useExpenses } from "@/hooks/useExpenses";
import { eventBus, Events } from "@/core/event-system";
// Helper function to export transactions as CSV
const exportTransactionsCSV = (transactions: any[], filename: string = 'transactions') => {
  if (transactions.length === 0) return;
  
  const csv = [
    ['Date', 'Description', 'Category', 'Type', 'Amount'].join(','),
    ...transactions.map(t => [
      t.date,
      `"${t.description}"`,
      t.category,
      t.type,
      t.amount.toFixed(2)
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
import { Wallet, BarChart3, Upload, X, TrendingUp, TrendingDown, Calendar, Filter, Search, Plus, Download, Table, RefreshCw, ArrowDown, ArrowUp, CheckCircle, Clock, CreditCard as CardIcon, FileText, Mic, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Transactions() {
  const { expenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const isMobile = useIsMobile();
  const addModal = useModal();
  const editModal = useModal<{ expense: any }>();
  const [filteredExpenses, setFilteredExpenses] = useState(expenses || []);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "income" | "expense">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportType, setSelectedImportType] = useState<"pdf" | "csv" | "voice" | null>(null);

  // Listen to transaction events for real-time updates
  useEffect(() => {
    const unsubscribe = eventBus.on(Events.TRANSACTION_CREATED, (data) => {
      console.log('[Transactions] Transaction created:', data);
    });
    return unsubscribe;
  }, []);

  // Update filtered expenses when expenses change
  useEffect(() => {
    setFilteredExpenses(expenses || []);
  }, [expenses]);

  // Get category icon helper
  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'Income') return '💰';
    const icons: Record<string, string> = {
      'Food': '🍕',
      'Shopping': '🛍️',
      'Transport': '🚗',
      'Bills': '💳',
      'Entertainment': '🎬',
      'Health': '🏥',
    };
    return icons[category] || '💸';
  };

  // Handle adding expense with new enhanced form
  const handleAddExpense = async (expense: any) => {
    try {
      console.log('[Transactions] Adding expense:', expense);
      // createExpense è async ma non ritorna una promise, emettiamo event dopo
      createExpense(expense);
      addModal.close();
      // Event viene emesso automaticamente da useExpenses.onSuccess
      // Non serve emetterlo qui per evitare duplicati
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // Handle editing expense
  const handleEditExpense = async (expense: any) => {
    if (editModal.data?.expense && updateExpense) {
      try {
        updateExpense({ id: editModal.data.expense.id, ...expense });
        editModal.close();
        eventBus.emit(Events.TRANSACTION_UPDATED, { id: editModal.data.expense.id, ...expense });
      } catch (error) {
        console.error('Error editing expense:', error);
      }
    }
  };

  // Handle export CSV
  const handleExportCSV = () => {
    if (finalFilteredExpenses.length === 0) {
      alert('Nessuna transazione da esportare');
      return;
    }
    try {
      exportTransactionsCSV(finalFilteredExpenses, 'transactions');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Errore durante l\'esportazione');
    }
  };

  const handleTransactionsExtracted = (extractedExpenses: any[]) => {
    extractedExpenses.forEach(exp => createExpense(exp));
  };

  // Calculate totals
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  // Apply additional type filter on top of AdvancedFilterSystem results
  const finalFilteredExpenses = filteredExpenses.filter((e: any) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'income' && e.type === 'Income') return true;
    if (selectedFilter === 'expense' && e.type === 'Expense') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white antialiased">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center mb-8 fade-in px-6 pt-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Transazioni
          </h1>
          <p className="text-gray-400 text-lg">Gestione intelligente del tuo flusso di cassa</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => addModal.open()} 
            className="bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-purple-500/50 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuova Transazione
          </Button>
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            className="bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-purple-500/50 transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </Button>
          <Button 
            onClick={() => setShowImportModal(true)}
            variant="outline" 
            className="bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-purple-500/50 transition-all"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importa
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-6">
          {/* Enhanced Quick Stats - 4 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 fade-in">
            {/* Entrate Mese */}
            <div className="glass-card p-6 text-center hover:border-green-400/30 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl font-bold text-green-400 mb-2">
                €{totalIncome.toFixed(2)}
              </div>
              <div className="text-gray-400">Entrate Mese</div>
              <div className="text-green-400 text-sm mt-3 flex items-center justify-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <span>+12% vs mese scorso</span>
              </div>
            </div>
            
            {/* Uscite Mese */}
            <div className="glass-card p-6 text-center hover:border-red-400/30 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl font-bold text-red-400 mb-2">
                €{totalExpenses.toFixed(2)}
              </div>
              <div className="text-gray-400">Uscite Mese</div>
              <div className="text-red-400 text-sm mt-3 flex items-center justify-center gap-1">
                <ArrowDown className="w-3 h-3" />
                <span>-8% vs mese scorso</span>
              </div>
            </div>
            
            {/* Saldo Netto */}
            <div className="glass-card p-6 text-center hover:border-purple-400/30 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl font-bold text-purple-400 mb-2">
                €{(totalIncome - totalExpenses).toFixed(2)}
              </div>
              <div className="text-gray-400">Saldo Netto</div>
              <div className="text-purple-400 text-sm mt-3 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+5.2% crescita</span>
              </div>
            </div>
            
            {/* Transazioni */}
            <div className="glass-card p-6 text-center hover:border-blue-400/30 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {expenses.length}
              </div>
              <div className="text-gray-400">Transazioni</div>
              <div className="text-blue-400 text-sm mt-3 flex items-center justify-center gap-1">
                <Wallet className="w-3 h-3" />
                <span>+{expenses.length} totali</span>
              </div>
            </div>
          </div>

          {/* Advanced Filter System */}
          <div className="glass-card p-6 mb-8 fade-in">
            <div className="mb-4">
              {/* Quick Type Filter */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={selectedFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("all")}
                  className="hover:bg-white/10"
                >
                  Tutte
                </Button>
                <Button
                  variant={selectedFilter === "income" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("income")}
                  className="hover:bg-white/10"
                >
                  Entrate
                </Button>
                <Button
                  variant={selectedFilter === "expense" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter("expense")}
                  className="hover:bg-white/10"
                >
                  Uscite
                </Button>
              </div>
              
              {/* Advanced Filter System Component */}
              <AdvancedFilterSystem
                items={expenses || []}
                onFiltered={setFilteredExpenses}
                showCategories={true}
                showDateRange={true}
                showAmountRange={true}
                showType={false} // We handle type filter separately above
                showSearch={true}
                persistToURL={true}
              />
            </div>
          </div>

          {/* Enhanced Transactions List */}
          <div className="glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Transazioni Recenti</h3>
                <p className="text-gray-400">{finalFilteredExpenses.length} transazioni su {expenses.length} totali</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" size="icon" className="hover:bg-white/5" title="Export">
                  <Download className="h-4 w-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-white/5" title="Visualizzazione">
                  <Table className="h-4 w-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-white/5" title="Aggiorna">
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>

            {/* Enhanced Transaction Cards */}
            <div className="space-y-4">
              {finalFilteredExpenses.slice(0, 3).map((transaction: any) => {
                const isIncome = transaction.type === 'Income';
                const icon = getCategoryIcon(transaction.category, transaction.type);
                const date = new Date(transaction.date);
                const dateStr = format(date, 'd MMM yyyy', { locale: it });
                
                return (
                  <div
                    key={transaction.id}
                    className={`transaction-card ${isIncome ? 'income' : 'expense'} p-5 cursor-pointer group`}
                    onClick={() => console.log('Transaction clicked:', transaction.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5 flex-1">
                        <div className="relative">
                          <div className={`w-14 h-14 rounded-2xl ${isIncome ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-red-500/20 hover:bg-red-500/30'} flex items-center justify-center transition-all duration-300`}>
                            <span className="text-2xl">{icon}</span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${isIncome ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                            {isIncome ? <ArrowDown className="h-3 w-3 text-white" /> : <ArrowUp className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-semibold text-lg">{transaction.description}</div>
                            <span className={`category-badge ${isIncome ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                              {transaction.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{dateStr}</span>
                            <span className="flex items-center gap-1"><CardIcon className="h-3 w-3" />Conto Principale</span>
                            <span className={isIncome ? "text-green-400 flex items-center gap-1" : "text-yellow-400 flex items-center gap-1"}>
                              {isIncome ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              Completato
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold mb-1 ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                          {isIncome ? '+' : '-'}€{transaction.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Saldo: €{(totalIncome - totalExpenses).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pulsante Vedi tutte */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => setShowAllTransactions(true)}
                variant="outline"
                className="w-full hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                <Table className="h-4 w-4 mr-2" />
                Vedi tutte le {finalFilteredExpenses.length} transazioni filtrate
              </Button>
            </div>
          </div>

          {/* Advanced AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="glass-card p-6 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Insights AI</h3>
                  <p className="text-gray-400 text-sm">Analisi intelligente delle tue transazioni</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl hover:border-green-500/40 transition-all">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="text-green-400 text-lg mt-1" />
                    <div>
                      <div className="font-semibold text-green-400 mb-1">Risparmio Eccellente</div>
                      <div className="text-sm text-gray-300">Stai risparmiando il 45% del tuo reddito, ben sopra la media</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Statistiche Veloci</h3>
                  <p className="text-gray-400 text-sm">Overview delle tue finanze</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Spese per Categorie</span>
                    <span className="text-purple-400">€{totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🍕 Cibo</span>
                      <span className="text-sm font-semibold">23%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill bg-green-500" style={{ width: '23%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🛍️ Shopping</span>
                      <span className="text-sm font-semibold">42%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill bg-purple-500" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Modal per aggiungere transazione (Enhanced) */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        title="Aggiungi Transazione"
        size="lg"
      >
        <EnhancedExpenseForm
          onAdd={handleAddExpense}
          onCancel={addModal.close}
        />
      </Modal>

      {/* Modal per modificare transazione */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        title="Modifica Transazione"
        size="lg"
      >
        {editModal.data && (
          <EnhancedExpenseForm
            onAdd={handleEditExpense}
            onCancel={editModal.close}
            initialValues={{
              date: editModal.data.expense.date,
              category: editModal.data.expense.category,
              description: editModal.data.expense.description,
              amount: editModal.data.expense.amount.toString(),
              type: editModal.data.expense.type,
              recurring: editModal.data.expense.recurring || false,
              recurrenceType: editModal.data.expense.recurrence_type || 'monthly',
            }}
          />
        )}
      </Modal>

      {/* Sheet per tutte le transazioni */}
      <Sheet open={showAllTransactions} onOpenChange={setShowAllTransactions}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">Tutte le Transazioni</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {finalFilteredExpenses.map((transaction: any) => {
              const isIncome = transaction.type === 'Income';
              const icon = getCategoryIcon(transaction.category, transaction.type);
              const date = new Date(transaction.date);
              const dateStr = format(date, 'd MMM yyyy', { locale: it });
              
              return (
                <div
                  key={transaction.id}
                  className={`transaction-card ${isIncome ? 'income' : 'expense'} p-5 cursor-pointer group`}
                  onClick={() => console.log('Transaction clicked:', transaction.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl ${isIncome ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-red-500/20 hover:bg-red-500/30'} flex items-center justify-center transition-all duration-300`}>
                          <span className="text-2xl">{icon}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${isIncome ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                          {isIncome ? <ArrowDown className="h-3 w-3 text-white" /> : <ArrowUp className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-lg">{transaction.description}</div>
                          <span className={`category-badge ${isIncome ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                            {transaction.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{dateStr}</span>
                          <span className="flex items-center gap-1"><CardIcon className="h-3 w-3" />Conto Principale</span>
                          <span className={isIncome ? "text-green-400 flex items-center gap-1" : "text-yellow-400 flex items-center gap-1"}>
                            {isIncome ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            Completato
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold mb-1 ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                        {isIncome ? '+' : '-'}€{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog per Import */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md glass-card border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Importa Transazioni</DialogTitle>
            <DialogDescription className="text-gray-400">
              Scegli il metodo di importazione
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* PDF Import */}
            <button
              onClick={() => setSelectedImportType("pdf")}
              className="glass-card p-6 hover:border-red-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center group-hover:bg-red-500/30">
                  <FileText className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">Documento PDF</div>
                  <div className="text-sm text-gray-400">Estratto conto bancario</div>
                </div>
              </div>
            </button>

            {/* CSV/Excel Import */}
            <button
              onClick={() => setSelectedImportType("csv")}
              className="glass-card p-6 hover:border-green-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30">
                  <FileSpreadsheet className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">CSV/Excel</div>
                  <div className="text-sm text-gray-400">File tabella dati</div>
                </div>
              </div>
            </button>

            {/* Voice Import */}
            <button
              onClick={() => setSelectedImportType("voice")}
              className="glass-card p-6 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30">
                  <Mic className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-lg text-white">Voce</div>
                  <div className="text-sm text-gray-400">Dettatto vocale</div>
                </div>
              </div>
            </button>
          </div>

          {/* Mostra il componente selezionato */}
          {selectedImportType === "pdf" && (
            <div className="mt-6 glass-card p-4">
              <AdvancedBankStatementUpload onTransactionsExtracted={handleTransactionsExtracted} />
            </div>
          )}
          {selectedImportType === "csv" && (
            <div className="mt-6 glass-card p-4">
              <CSVExcelUpload onTransactionsParsed={() => setShowImportModal(false)} />
            </div>
          )}
          {selectedImportType === "voice" && (
            <div className="mt-6 glass-card p-4">
              <VoiceExpenseInput onExpenseDetected={handleAddExpense} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <button
        onClick={() => addModal.open()}
        className="fab hover:scale-110"
        title="Nuova Transazione"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}
