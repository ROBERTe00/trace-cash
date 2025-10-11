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
    <Card className="glass-card p-6 animate-fade-in hover-lift border-2 border-primary/10">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
        Add Transaction
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as Expense["category"] })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Rent">Rent</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Grocery shopping"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (€)</Label>
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

        <div>
          <Label>Type</Label>
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
                Expense
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Income" id="income" />
              <Label htmlFor="income" className="cursor-pointer">
                Income
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="recurring">Recurrence</Label>
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
                <SelectItem value="none">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </form>
    </Card>
  );
};