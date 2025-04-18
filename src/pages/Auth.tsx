
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast"; 
import { Mail, Lock, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  
  // Check if already authenticated - improved approach for the live preview
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        // Check for existing session first
        const { data } = await supabase.auth.getSession();
        
        if (data.session && isMounted) {
          console.log("Found existing session, redirecting to admin");
          // Use navigate instead of direct location change for better React integration
          navigate("/admin");
          return;
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log("Auth state changed:", event, !!currentSession);
            if (currentSession && isMounted) {
              console.log("Session detected during auth state change, navigating to admin");
              navigate("/admin");
            }
          }
        );
        
        // Only set checkingSession to false if we're still mounted
        if (isMounted) {
          setCheckingSession(false);
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking session:", error);
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    try {
      if (isSignup) {
        // Sign up flow
        console.log("Attempting signup with:", email);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback"
          }
        });
        
        if (signUpError) throw signUpError;
        
        console.log("Sign up response:", signUpData);
        
        // Try to sign in immediately after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.log("Immediate sign in failed:", signInError);
          toast({
            title: "Account Created",
            description: "Your account has been created. Please sign in with your credentials."
          });
          setIsSignup(false);
          setLoading(false);
          return;
        }
        
        console.log("Immediate sign in successful:", signInData);
        toast({
          title: "Success",
          description: "Account created and logged in successfully."
        });
        
        // Use navigate instead of direct location change
        navigate("/admin");
      } else {
        // Login flow
        console.log("Attempting login with:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        console.log("Login successful:", data);
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully."
        });
        
        // Use navigate instead of direct location change
        navigate("/admin");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMessage(error.message || "Authentication failed");
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isSignup ? "Create Admin Account" : "Admin Login"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignup 
              ? "Create a new admin account to access the dashboard" 
              : "Enter your credentials to access the admin dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                <p>Error: {errorMessage}</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignup ? "Creating Account..." : "Logging in..."}
                </>
              ) : (
                <>{isSignup ? "Create Account" : "Login"}</>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center w-full">
            <Button
              variant="link"
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm"
            >
              {isSignup 
                ? "Already have an account? Login" 
                : "Need an account? Sign up"}
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
