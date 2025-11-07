// Enhanced Transactions Page - Demonstrates integration of new systems
import { EnhancedExpenseForm } from '@/components/forms/EnhancedExpenseForm';
import { AdvancedFilterSystem } from '@/components/filters/AdvancedFilterSystem';
import { Modal } from '@/components/modals/ModalSystem';
import { useModal } from '@/hooks/useInteractions';
import { useExpenses } from '@/hooks/useExpenses';
import { eventBus, Events } from '@/core/event-system';
import { Wallet, Plus, Download, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { exportToCSV } from '@/lib/exportUtils';

export default function TransactionsEnhanced() {
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses();
  const addModal = useModal();
  const editModal = useModal<{ expense: any }>();
  const [filteredExpenses, setFilteredExpenses] = useState(expenses || []);

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

  const handleAddExpense = async (expense: any) => {
    await createExpense.mutateAsync(expense);
    addModal.close();
  };

  const handleEditExpense = async (expense: any) => {
    if (editModal.data?.expense) {
      await updateExpense.mutateAsync({
        id: editModal.data.expense.id,
        ...expense
      });
      editModal.close();
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteExpense.mutateAsync(id);
    }
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No transactions to export');
      return;
    }
    exportToCSV(filteredExpenses, 'transactions');
  };

  // Calculate totals from filtered expenses
  const totalIncome = filteredExpenses
    .filter((e) => e.type === 'Income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = filteredExpenses
    .filter((e) => e.type === 'Expense')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white antialiased p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
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
            className="bg-white/5 hover:bg-white/10 border border-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/5 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Totale Entrate</p>
              <p className="text-2xl font-bold text-green-400">
                €{totalIncome.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="bg-white/5 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Totale Spese</p>
              <p className="text-2xl font-bold text-red-400">
                €{totalExpenses.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </Card>
        
        <Card className="bg-white/5 border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Bilancio</p>
              <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                €{(totalIncome - totalExpenses).toFixed(2)}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Advanced Filter System */}
      <div className="mb-6">
        <AdvancedFilterSystem
          items={expenses || []}
          onFiltered={setFilteredExpenses}
          showCategories={true}
          showDateRange={true}
          showAmountRange={true}
          showType={true}
          showSearch={true}
          persistToURL={true}
        />
      </div>

      {/* Transactions List */}
      <Card className="bg-white/5 border-gray-700">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${expense.type === 'Income' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-400">
                          {expense.category} • {new Date(expense.date).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-semibold ${expense.type === 'Income' ? 'text-green-400' : 'text-red-400'}`}>
                      {expense.type === 'Income' ? '+' : '-'}€{Math.abs(expense.amount).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editModal.open({ expense })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add Transaction Modal */}
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

      {/* Edit Transaction Modal */}
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
              recurring: editModal.data.expense.recurring,
              recurrenceType: editModal.data.expense.recurrence_type,
            }}
          />
        )}
      </Modal>
    </div>
  );
}



