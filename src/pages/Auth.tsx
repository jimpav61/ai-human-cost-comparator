
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const Auth = () => {
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setLoading(false);
          setInitialCheckDone(true);
          return;
        }

        if (!session) {
          console.log("No active session found");
          setLoading(false);
          setInitialCheckDone(true);
          return;
        }

        console.log("Session found, checking if admin...");
        // User is logged in, check if they're an admin
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();
        
        if (adminCheckError) {
          console.error("Admin check error:", adminCheckError);
          await supabase.auth.signOut();
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your admin status. Please try logging in again.",
            variant: "destructive",
          });
          setLoading(false);
          setInitialCheckDone(true);
          return;
        }
        
        if (adminCheck) {
          console.log("User is an admin, redirecting to admin dashboard...");
          window.location.href = '/admin';
        } else {
          console.log("User is not an admin, signing out...");
          await supabase.auth.signOut();
          toast({
            title: "Unauthorized",
            description: "You do not have admin access.",
            variant: "destructive",
          });
          setLoading(false);
          setInitialCheckDone(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setLoading(false);
        setInitialCheckDone(true);
      }
    };
    
    checkExistingSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginInProgress) {
      return; // Prevent multiple submissions
    }

    // Form validation
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoginInProgress(true);
    
    try {
      console.log("Checking if email is in allowed_admins...");
      // First, check if the email is in allowed_admins
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('allowed_admins')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (adminCheckError) {
        console.error("Admin check error:", adminCheckError);
        throw new Error("This email is not authorized for admin access");
      }

      if (!adminCheck) {
        console.error("Email not found in allowed_admins");
        throw new Error("This email is not authorized for admin access");
      }

      console.log("Email is authorized, attempting to sign in...");
      // If admin is allowed, attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password.trim()
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      if (!data || !data.session) {
        console.error("No session created after sign in");
        throw new Error("Failed to create session. Please try again.");
      }

      console.log("Login successful, redirecting to admin dashboard...");
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // Use a slight delay to ensure the toast is visible
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Ensure we're signed out if there was an error
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error("Error during sign out:", signOutError);
      }
    } finally {
      setLoginInProgress(false);
    }
  };

  // Don't render the form until the initial session check is complete
  if (loading && !initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full"
              autoComplete="email"
              disabled={loginInProgress}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full"
              autoComplete="current-password"
              disabled={loginInProgress}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loginInProgress}
          >
            {loginInProgress ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
