import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().max(100).optional(),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  // Check for password recovery token in URL
  useState(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsSettingNewPassword(true);
      setIsLogin(false);
      setIsResetPassword(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSettingNewPassword) {
        console.log("🔐 [Auth] Setting new password...");
        
        if (formData.newPassword.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (error) {
          console.error("🔐 [Auth] Password update error:", error);
          toast.error(error.message);
          return;
        }

        // Refresh session after password update
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error("🔐 [Auth] Session refresh failed:", sessionError);
          toast.error("Password updated but session refresh failed. Please sign in again.");
          setIsSettingNewPassword(false);
          setIsLogin(true);
          return;
        }

        console.log("🔐 [Auth] Password updated successfully, user:", session.user.email);
        toast.success("Password updated successfully! Redirecting...");
        
        // Clear the hash to remove recovery token
        window.history.replaceState(null, '', window.location.pathname);
        
        // Wait a bit then navigate
        setTimeout(() => {
          navigate("/");
        }, 500);
        
        return;
      }

      if (isResetPassword) {
        console.log("🔐 [Auth] Requesting password reset for:", formData.email);
        
        const validation = z.object({
          email: z.string().email("Invalid email address").max(255),
        }).safeParse({ email: formData.email.trim() });

        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(
          formData.email.trim(),
          {
            redirectTo: `${window.location.origin}/`,
          }
        );

        if (error) {
          console.error("🔐 [Auth] Password reset error:", error);
          toast.error(error.message);
          return;
        }

        console.log("🔐 [Auth] Password reset email sent");
        toast.success("Password reset email sent! Check your inbox.");
        setIsResetPassword(false);
        return;
      }

      // Validate input
      const validation = authSchema.safeParse({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      if (isLogin) {
        console.log("🔐 [Auth] Attempting login for:", formData.email);
        
        const { error, data } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          console.error("🔐 [Auth] Login error:", error);
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email address before signing in");
          } else {
            toast.error(error.message);
          }
          return;
        }

        console.log("🔐 [Auth] Login successful:", data.user?.email, "Session:", !!data.session);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        console.log("🔐 [Auth] Attempting signup for:", formData.email);
        
        if (!formData.name.trim()) {
          toast.error("Please enter your name");
          return;
        }

        const { error, data } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: formData.name.trim(),
            },
          },
        });

        if (error) {
          console.error("🔐 [Auth] Signup error:", error);
          if (error.message.includes("already registered")) {
            toast.error("Email already registered. Please sign in.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        console.log("🔐 [Auth] Signup successful:", data.user?.email);
        
        // Don't use localStorage - the database trigger will set onboarding_completed = false
        toast.success("Account created successfully! Welcome!");
        
        // Navigate to home - the OnboardingWrapper will check database and show onboarding
        navigate("/");
      }
    } catch (error) {
      console.error("🔐 [Auth] Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      // This ALWAYS runs, ensuring loading state is cleared
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="glass-card w-full max-w-md p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mb-4">
            <span className="text-3xl font-bold text-white">€</span>
          </div>
          <h1 className="text-2xl font-bold">MyFinance Tracker</h1>
          <p className="text-muted-foreground mt-2">
            {isSettingNewPassword 
              ? "Set your new password" 
              : isResetPassword 
              ? "Reset your password" 
              : isLogin 
              ? "Welcome back!" 
              : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSettingNewPassword ? (
            <>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  className="mt-1"
                  required
                />
              </div>
            </>
          ) : (
            <>
              {!isLogin && !isResetPassword && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="you@example.com"
              className="mt-1"
            />
              </div>

              {!isResetPassword && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading 
              ? "Loading..." 
              : isSettingNewPassword 
              ? "Update Password" 
              : isResetPassword 
              ? "Send Reset Email" 
              : isLogin 
              ? "Sign In" 
              : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {isSettingNewPassword ? null : isResetPassword ? (
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(false);
                setIsLogin(true);
              }}
              className="text-sm text-primary hover:underline"
            >
              Back to sign in
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline block w-full"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline block w-full"
                >
                  Forgot password?
                </button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}