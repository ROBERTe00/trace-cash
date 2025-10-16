import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface AIFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

const CATEGORIES = [
  { value: "Food", label: "🍔 Food", color: "bg-orange-500" },
  { value: "Transport", label: "🚗 Transport", color: "bg-blue-500" },
  { value: "Entertainment", label: "🎬 Entertainment", color: "bg-purple-500" },
  { value: "Shopping", label: "🛍️ Shopping", color: "bg-pink-500" },
  { value: "Bills", label: "💡 Bills", color: "bg-yellow-500" },
  { value: "Healthcare", label: "🏥 Healthcare", color: "bg-red-500" },
  { value: "Education", label: "📚 Education", color: "bg-indigo-500" },
  { value: "Income", label: "💰 Income", color: "bg-green-500" },
  { value: "Investment", label: "📈 Investment", color: "bg-emerald-500" },
  { value: "Other", label: "📦 Other", color: "bg-gray-500" },
];

export const AIFeedbackModal = ({ open, onClose, transactions }: AIFeedbackModalProps) => {
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getCategoryDetails = (categoryValue: string) => {
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[CATEGORIES.length - 1];
  };

  const handleCorrection = (txnId: string, newCategory: string) => {
    setCorrections(prev => ({
      ...prev,
      [txnId]: newCategory
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update corrected transactions
      const updatePromises = Object.entries(corrections).map(([txnId, correctCategory]) => {
        const originalTxn = transactions.find(t => t.id === txnId);
        return supabase
          .from("expenses")
          .update({ category: correctCategory })
          .eq("id", txnId);
      });

      await Promise.all(updatePromises);

      // Store feedback for AI training
      const feedbackData = Object.entries(corrections).map(([txnId, correctCategory]) => {
        const originalTxn = transactions.find(t => t.id === txnId);
        return {
          user_id: user.id,
          original_category: originalTxn?.category,
          corrected_category: correctCategory,
          description: originalTxn?.description || "",
          amount: originalTxn?.amount || 0,
        };
      });

      if (feedbackData.length > 0) {
        await supabase.from("ai_feedback").insert(feedbackData);
      }

      toast.success(`✅ ${Object.keys(corrections).length > 0 ? `${Object.keys(corrections).length} correzioni salvate!` : "Grazie per la conferma!"} L'AI migliorerà con il tuo feedback.`);
      onClose();
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Errore nel salvare le correzioni");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            🎯 Verifica Categorizzazione AI
          </DialogTitle>
          <DialogDescription>
            L'AI ha categorizzato {transactions.length} transazioni. Correggi eventuali errori per migliorare la precisione futura.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-3">
            {transactions.map((txn) => {
              const currentCategory = corrections[txn.id] || txn.category;
              const categoryDetails = getCategoryDetails(currentCategory);
              const wasCorrected = corrections[txn.id] && corrections[txn.id] !== txn.category;

              return (
                <div 
                  key={txn.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    wasCorrected ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800" : "bg-card"
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      {wasCorrected && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                      <p className="font-medium truncate">{txn.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>€{txn.amount.toFixed(2)}</span>
                      <span>•</span>
                      <span>{new Date(txn.date).toLocaleDateString('it-IT')}</span>
                      {wasCorrected && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600 dark:text-orange-400">
                            {getCategoryDetails(txn.category).label} → {categoryDetails.label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Select
                    value={currentCategory}
                    onValueChange={(value) => handleCorrection(txn.id, value)}
                  >
                    <SelectTrigger className="w-48 flex-shrink-0">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${categoryDetails.color}`} />
                          <span>{categoryDetails.label}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {Object.keys(corrections).length > 0 ? (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {Object.keys(corrections).length} correzioni in sospeso
              </span>
            ) : (
              <span>Nessuna correzione necessaria</span>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Salta
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvando..." : "✅ Conferma"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
