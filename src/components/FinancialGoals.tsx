import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Plus, Trash2, TrendingUp } from "lucide-react";
import { FinancialGoal } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";

interface FinancialGoalsProps {
  goals: FinancialGoal[];
  onAdd: (goal: Omit<FinancialGoal, "id">) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, currentAmount: number) => void;
}

export const FinancialGoals = ({ goals, onAdd, onDelete, onUpdate }: FinancialGoalsProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    category: "Investment" as FinancialGoal["category"],
    priority: "Medium" as FinancialGoal["priority"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    onAdd({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      deadline: formData.deadline,
      category: formData.category,
      priority: formData.priority,
    });

    setFormData({
      name: "",
      targetAmount: "",
      currentAmount: "",
      deadline: "",
      category: "Investment",
      priority: "Medium",
    });
    setOpen(false);
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Financial Goals</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Financial Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Car, House Down Payment"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">Target Amount (€)</Label>
                  <Input
                    id="target"
                    type="number"
                    step="100"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="100000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="current">Current Amount (€)</Label>
                  <Input
                    id="current"
                    type="number"
                    step="100"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deadline">Target Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as FinancialGoal["category"] })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Savings">Savings</SelectItem>
                      <SelectItem value="Purchase">Purchase</SelectItem>
                      <SelectItem value="Emergency">Emergency Fund</SelectItem>
                      <SelectItem value="Retirement">Retirement</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value as FinancialGoal["priority"] })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No financial goals yet. Start by creating your first goal!</p>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-2xl font-bold">
                €{totalCurrent.toLocaleString()} / €{totalTarget.toLocaleString()}
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {overallProgress.toFixed(1)}% Complete
            </div>
          </div>

          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;
              const daysLeft = goal.deadline
                ? Math.ceil(
                    (new Date(goal.deadline).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        <Badge variant={getPriorityColor(goal.priority) as any}>
                          {goal.priority}
                        </Badge>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                      {goal.deadline && (
                        <p className="text-sm text-muted-foreground">
                          {daysLeft !== null && daysLeft > 0
                            ? `${daysLeft} days remaining`
                            : daysLeft === 0
                            ? "Due today"
                            : "Overdue"}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(goal.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        €{goal.currentAmount.toLocaleString()} / €
                        {goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(progress, 100)}
                      className="h-2"
                      indicatorClassName={progress >= 100 ? "bg-green-500" : undefined}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{progress.toFixed(1)}% achieved</span>
                      {remaining > 0 && (
                        <span className="text-muted-foreground">
                          €{remaining.toLocaleString()} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Update amount"
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const input = e.target as HTMLInputElement;
                          const value = parseFloat(input.value);
                          if (!isNaN(value) && value >= 0) {
                            onUpdate(goal.id, value);
                            input.value = "";
                          }
                        }
                      }}
                    />
                    <Button size="sm" variant="outline" className="whitespace-nowrap">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};
