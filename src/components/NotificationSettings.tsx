import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  weeklyReminder: boolean;
  monthlyReport: boolean;
  budgetAlerts: boolean;
  reminderDay: string;
  email: string;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    weeklyReminder: false,
    monthlyReport: false,
    budgetAlerts: true,
    reminderDay: 'monday',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadUserEmail();
  }, []);

  const loadPreferences = () => {
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      setPreferences(JSON.parse(stored));
    }
  };

  const loadUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setPreferences(prev => ({ ...prev, email: user.email }));
    }
  };

  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
    toast.success('Notification preferences saved');
  };

  const testNotification = async () => {
    if (!preferences.email) {
      toast.error('Please set your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          email: preferences.email,
          type: 'weekly_reminder',
          data: {
            appUrl: window.location.origin,
          },
        },
      });

      if (error) throw error;
      toast.success('Test notification sent! Check your email.');
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Smart Notifications
        </CardTitle>
        <CardDescription>
          Stay on track with intelligent reminders and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex gap-2">
            <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={preferences.email}
              onChange={(e) =>
                savePreferences({ ...preferences, email: e.target.value })
              }
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reminder">Weekly Expense Reminder</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to log your expenses
              </p>
            </div>
            <Switch
              id="weekly-reminder"
              checked={preferences.weeklyReminder}
              onCheckedChange={(checked) =>
                savePreferences({ ...preferences, weeklyReminder: checked })
              }
            />
          </div>

          {preferences.weeklyReminder && (
            <div className="ml-6 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="reminder-day" className="text-sm">
                Reminder Day:
              </Label>
              <Select
                value={preferences.reminderDay}
                onValueChange={(value) =>
                  savePreferences({ ...preferences, reminderDay: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthly-report">Monthly Financial Report</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary at the end of each month
              </p>
            </div>
            <Switch
              id="monthly-report"
              checked={preferences.monthlyReport}
              onCheckedChange={(checked) =>
                savePreferences({ ...preferences, monthlyReport: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budget-alerts">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when approaching budget limits
              </p>
            </div>
            <Switch
              id="budget-alerts"
              checked={preferences.budgetAlerts}
              onCheckedChange={(checked) =>
                savePreferences({ ...preferences, budgetAlerts: checked })
              }
            />
          </div>
        </div>

        <Button
          onClick={testNotification}
          disabled={loading || !preferences.email}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </CardContent>
    </Card>
  );
}
