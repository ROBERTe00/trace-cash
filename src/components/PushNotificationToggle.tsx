import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Sparkles } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const PushNotificationToggle = () => {
  const {
    isSubscribed,
    isSupported,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Receive real-time alerts for goals, budgets, achievements, and market news
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable Notifications</div>
            <div className="text-xs text-muted-foreground">
              Get notified about important financial events
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={(checked) => {
              if (checked) {
                subscribeToPush();
              } else {
                unsubscribeFromPush();
              }
            }}
            disabled={isLoading}
          />
        </div>

        {isSubscribed && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">You'll receive notifications for:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Goal milestones (25%, 50%, 75%, 100%)</li>
                  <li>Budget alerts when approaching limits</li>
                  <li>Achievement unlocks and level-ups</li>
                  <li>High-impact financial news</li>
                  <li>Investment suggestions</li>
                </ul>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={sendTestNotification}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
