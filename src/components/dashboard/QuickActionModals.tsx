import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Receipt, TrendingUp, FileUp, Receipt as Banknote } from "lucide-react";
import { toast } from "sonner";

interface QuickActionModalsProps {
  activeModal: 'add_expense' | 'add_income' | 'import_file' | 'bank_statement' | null;
  onClose: () => void;
}

export const QuickActionModals = ({ activeModal, onClose }: QuickActionModalsProps) => {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleSubmit = (action: string) => {
    toast.success(`${action} action completed`, {
      description: `Amount: $${amount}`,
    });
    setAmount("");
    setRecipient("");
    onClose();
  };

  return (
    <>
      {/* Add Expense Modal */}
      <Dialog open={activeModal === 'add_expense'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-red-500" />
              </div>
              <DialogTitle className="text-2xl">Aggiungi Spesa</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-description">Descrizione</Label>
              <Input
                id="expense-description"
                placeholder="Es. Pranzo al ristorante"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="expense-amount">Importo (€)</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-2xl font-mono"
              />
            </div>
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
              onClick={() => handleSubmit("Aggiungi Spesa")}
            >
              Registra €{amount || "0.00"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Income Modal */}
      <Dialog open={activeModal === 'add_income'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <DialogTitle className="text-2xl">Aggiungi Entrata</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="income-description">Descrizione</Label>
              <Input
                id="income-description"
                placeholder="Es. Stipendio mensile"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="income-amount">Importo (€)</Label>
              <Input
                id="income-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 text-2xl font-mono"
              />
            </div>
            <Button 
              className="w-full bg-green-500 hover:bg-green-600 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all"
              onClick={() => handleSubmit("Aggiungi Entrata")}
            >
              Registra €{amount || "0.00"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import File Modal */}
      <Dialog open={activeModal === 'import_file'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <FileUp className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Importa File</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carica un file CSV o Excel con le tue transazioni bancarie per importarle automaticamente.
            </p>
            <Button 
              className="w-full hover:shadow-[0_0_20px_rgba(139,0,255,0.4)] transition-all"
              onClick={() => handleSubmit("Importa File")}
            >
              Scegli File da Importare
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Statement Modal */}
      <Dialog open={activeModal === 'bank_statement'} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-primary/10 p-2">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Estratto Conto</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Carica un estratto conto bancario in formato PDF per estrarre automaticamente tutte le transazioni.
            </p>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(139,0,255,0.4)] transition-all"
              onClick={() => handleSubmit("Estratto Conto")}
            >
              Carica PDF Estrado Conto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
