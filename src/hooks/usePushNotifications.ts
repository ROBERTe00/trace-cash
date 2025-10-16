import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please allow notifications to receive updates.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Save subscription to backend
      const { error } = await supabase.functions.invoke("register-push-subscription", {
        body: { subscription: sub.toJSON() },
      });

      if (error) throw error;

      setSubscription(sub);
      setIsSubscribed(true);

      toast({
        title: "Notifications Enabled",
        description: "You'll now receive important financial updates!",
      });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Could not enable notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    setIsLoading(true);

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);

      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore.",
      });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast({
        title: "Error",
        description: "Could not disable notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const { error } = await supabase.functions.invoke("send-notification", {
        body: {
          title: "🎉 Test Notification",
          message: "Your push notifications are working perfectly!",
          type: "success",
        },
      });

      if (error) throw error;

      toast({
        title: "Test Sent",
        description: "Check your notifications!",
      });
    } catch (error) {
      console.error("Error sending test:", error);
      toast({
        title: "Error",
        description: "Could not send test notification",
        variant: "destructive",
      });
    }
  };

  return {
    subscription,
    isSubscribed,
    isSupported,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  };
};
