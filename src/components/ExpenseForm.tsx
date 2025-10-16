import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { Expense } from "@/lib/storage";

interface ExpenseFormProps {
  onAdd: (expense: Omit<Expense, "id">) => void;
}

export const ExpenseForm = ({ onAdd }: ExpenseFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Other" as Expense["category"],
    description: "",
    amount: "",
    type: "Expense" as "Income" | "Expense",
    recurring: false,
    recurrenceType: "monthly" as "weekly" | "monthly" | "yearly",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    onAdd({
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      recurring: formData.recurring,
      recurrenceType: formData.recurring ? formData.recurrenceType : undefined,
    });

    setFormData({
      date: new Date().toISOString().split("T")[0],
      category: "Other",
      description: "",
      amount: "",
      type: "Expense",
      recurring: false,
      recurrenceType: "monthly",
    });
  };

  return (
    <Card className="glass-card p-6 animate-fade-in hover-lift border border-primary/10">
      <h3 className="text-card-title mb-4 flex items-center gap-2">
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
        Aggiungi Transazione
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Compact layout: Date + Category in same row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as Expense["category"] })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Cibo</SelectItem>
                <SelectItem value="Transport">Trasporti</SelectItem>
                <SelectItem value="Entertainment">Intrattenimento</SelectItem>
                <SelectItem value="Rent">Affitto</SelectItem>
                <SelectItem value="Other">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description + Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="es., Spesa supermercato"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="amount">Importo (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </div>

        {/* Type + Recurrence in same row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Tipo</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as "Income" | "Expense" })
              }
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Expense" id="expense" />
                <Label htmlFor="expense" className="cursor-pointer">
                  Spesa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Income" id="income" />
                <Label htmlFor="income" className="cursor-pointer">
                  Entrata
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="recurring">Ricorrenza</Label>
            <Select
              value={formData.recurring ? formData.recurrenceType : "none"}
              onValueChange={(value) => {
                if (value === "none") {
                  setFormData({ ...formData, recurring: false });
                } else {
                  setFormData({ ...formData, recurring: true, recurrenceType: value as "weekly" | "monthly" | "yearly" });
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Una tantum</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="monthly">Mensile</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full">
          <Plus className="icon-button mr-2" />
          Aggiungi Transazione
        </Button>
      </form>
    </Card>
  );
};