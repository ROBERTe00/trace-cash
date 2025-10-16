import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancialGoals, FinancialGoal } from "@/hooks/useFinancialGoals";
import { useApp } from "@/contexts/AppContext";
import { useInvestments } from "@/hooks/useInvestments";
import { useInvestmentSuggestions } from "@/hooks/useInvestmentSuggestions";
import { Target, Plus, Trash2, TrendingUp, Calendar, DollarSign, Link2, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface FinancialGoalsProps {
  openDialog?: boolean;
  onDialogChange?: (open: boolean) => void;
}

export const FinancialGoals = ({ openDialog = false, onDialogChange }: FinancialGoalsProps = {}) => {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useFinancialGoals();
  const { formatCurrency } = useApp();
  const { investments, predictGrowth } = useInvestments();
  const { suggestions } = useInvestmentSuggestions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<FinancialGoal>>({
    title: '',
    description: '',
    target_amount: 0,
    current_amount: 0,
    goal_type: 'savings',
    priority: 'medium',
    status: 'active',
  });

  // Sync with external control
  useEffect(() => {
    if (openDialog !== undefined) {
      setDialogOpen(openDialog);
    }
  }, [openDialog]);

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (onDialogChange) {
      onDialogChange(open);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal(formData as any);
    handleDialogChange(false);
    setFormData({
      title: '',
      description: '',
      target_amount: 0,
      current_amount: 0,
      goal_type: 'savings',
      priority: 'medium',
      status: 'active',
    });
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'investment': return <TrendingUp className="h-4 w-4" />;
      case 'savings': return <DollarSign className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Track and achieve your financial objectives</CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Financial Goal</DialogTitle>
                <DialogDescription>Set a new financial objective to work towards</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your goal..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_amount">Target Amount</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="0.01"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_amount">Current Amount</Label>
                    <Input
                      id="current_amount"
                      type="number"
                      step="0.01"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline || ''}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goal_type">Goal Type</Label>
                    <Select
                      value={formData.goal_type}
                      onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="debt_payoff">Debt Payoff</SelectItem>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="emergency_fund">Emergency Fund</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No financial goals yet</p>
            <p className="text-sm">Create your first goal to start tracking progress</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal.current_amount, goal.target_amount);
            const remaining = goal.target_amount - goal.current_amount;
            
            return (
              <Card key={goal.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getGoalTypeIcon(goal.goal_type)}
                        <div>
                          <h4 className="font-semibold">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(goal.priority) as any}>
                          {goal.priority}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                        </span>
                        <span className="text-primary font-medium">
                      {formatCurrency(remaining)} remaining
                    </span>
                  </div>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
                  </div>
                )}

                {goal.goal_type === 'investment' && remaining > 0 && (
                  <div className="mt-3 p-3 bg-accent/10 border border-accent rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-accent mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Investment Opportunity</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Invest {formatCurrency(remaining)} now for projected growth of{' '}
                          <span className="font-semibold text-green-600">
                            {formatCurrency(predictGrowth(remaining, 12))}
                          </span>{' '}
                          in 12 months (8% annual return)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {goal.investment_link && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                    <Link2 className="h-4 w-4" />
                    <span>Linked to portfolio</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })
    )}
  </CardContent>
</Card>
  );
};