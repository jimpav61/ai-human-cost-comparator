
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const Auth = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  // Handle initial session check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user?.email) {
          try {
            console.log("Session check - user email:", session.user.email);
            
            // Perform admin check
            const { data: adminCheck } = await supabase
              .from('allowed_admins')
              .select('*')
              .ilike('email', session.user.email);
            
            console.log("Admin check for session:", adminCheck);

            if (adminCheck && adminCheck.length > 0) {
              window.location.replace('/admin');
            } else {
              await supabase.auth.signOut();
              toast({
                title: "Access Denied",
                description: "You do not have admin access",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error("Admin check error:", error);
          }
        }
      }
    );

    // Check initial session
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          console.log("Initial session user:", session.user.email);
          
          const { data: adminCheck } = await supabase
            .from('allowed_admins')
            .select('*')
            .ilike('email', session.user.email);

          if (adminCheck && adminCheck.length > 0) {
            window.location.replace('/admin');
          } else {
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error("Initial session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginInProgress) return;
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setLoginInProgress(true);
    
    try {
      // Sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      if (signInError) {
        throw signInError;
      }

      if (!signInData.user?.email) {
        throw new Error("No user email found after sign in");
      }

      // Then check admin access
      const { data: adminCheck } = await supabase
        .from('allowed_admins')
        .select('*')
        .ilike('email', signInData.user.email);

      if (!adminCheck || adminCheck.length === 0) {
        await supabase.auth.signOut();
        throw new Error("This email is not authorized for admin access");
      }

      // Success! Redirect to admin page
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      window.location.replace('/admin');
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoginInProgress(false);
    }
  };

  if (loading) {
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
