
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Mail, Lock, Info, RefreshCw } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkTimeout, setCheckTimeout] = useState(false);
  const navigate = useNavigate();

  const checkSessionWithTimeout = async () => {
    console.log("Starting auth check with timeout in Auth component");
    // Reset states
    setAuthError(null);
    setCheckTimeout(false);
    setIsCheckingAuth(true);
    
    // Set a timeout to catch hanging requests
    const timeoutId = setTimeout(() => {
      console.log("Auth check timed out after 8 seconds");
      setCheckTimeout(true);
      setIsCheckingAuth(false);
    }, 8000);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      // Clear timeout as we got a response
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Error checking session:", error);
        setAuthError(error.message);
        setIsCheckingAuth(false);
        return;
      }
      
      setSession(data.session);
      
      if (data.session) {
        // Check if user has admin role using RPC function
        try {
          const { data: userData, error: userError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (userError) {
            setAuthError(userError.message);
            setIsAdmin(false);
            setIsCheckingAuth(false);
            return;
          }
          
          setIsAdmin(userData || false);
        } catch (err) {
          console.error("Error checking admin role:", err);
          setAuthError(err instanceof Error ? err.message : "Error checking admin status");
          setIsAdmin(false);
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error("Session check error:", e);
      setAuthError(e instanceof Error ? e.message : "Unknown error checking session");
    } finally {
      clearTimeout(timeoutId);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    // Check session on initial load
    checkSessionWithTimeout();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setSession(session);
      
      if (session) {
        try {
          const { data: userData, error: userError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (userError) throw userError;
          
          setIsAdmin(userData || false);
        } catch (err) {
          console.error("Error checking admin role:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignup) {
        // When signing up, first check if the email is in the allowed_admins table
        const { data: isAllowedData, error: isAllowedError } = await supabase
          .rpc('is_allowed_admin', { email });
        
        if (isAllowedError) {
          console.error("Error checking if admin is allowed:", isAllowedError);
          throw new Error("Error verifying admin status");
        }
        
        // Proceed with registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;
        
        // Try to sign in immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (!signInError) {
          toast({
            title: "Account created and logged in",
            description: isAllowedData ? "Admin account created successfully." : "Account created successfully.",
          });
          return;
        }
        
        // If immediate sign-in fails, show message and switch to login view
        toast({
          title: "Account Created",
          description: "Your account has been created. Please sign in with your credentials.",
        });
        setIsSignup(false);
      } else {
        // Regular login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        console.log("Login successful", data);
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });
        
        // Check admin role directly after login
        const { data: isAdminData, error: isAdminError } = await supabase
          .rpc('has_role', { role_to_check: 'admin' });
          
        if (!isAdminError && isAdminData) {
          navigate('/admin');
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Debugging output
  console.log("Auth state:", { isCheckingAuth, session, isAdmin, checkTimeout, authError });
  
  // Handle timeout case
  if (checkTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <Card className="w-[450px]">
          <CardHeader>
            <div className="flex items-center justify-center mb-4 text-amber-500">
              <Info size={48} />
            </div>
            <CardTitle className="text-center text-2xl">Authentication Timeout</CardTitle>
            <CardDescription className="text-center">
              The authentication request is taking longer than expected. This may be due to network issues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              Please try checking your connection and retry, or login with your credentials.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={checkSessionWithTimeout}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Authentication Check
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setCheckTimeout(false);
                setSession(null);
                setIsAdmin(false);
              }}
              className="w-full"
            >
              Proceed to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Show auth error
  if (authError && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <Card className="w-[450px]">
          <CardHeader>
            <div className="flex items-center justify-center mb-4 text-red-500">
              <Info size={48} />
            </div>
            <CardTitle className="text-center text-2xl">Authentication Error</CardTitle>
            <CardDescription className="text-center">
              {authError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              There was a problem with the authentication process. Please try again.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              onClick={checkSessionWithTimeout}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setAuthError(null);
                setSession(null);
                setIsAdmin(false);
              }}
              className="w-full"
            >
              Proceed to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If user is authenticated and admin, redirect to admin page
  if (session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // If user is authenticated but not admin, show access denied
  if (session && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <Card className="w-[450px]">
          <CardHeader>
            <div className="flex items-center justify-center mb-4 text-red-500">
              <Info size={48} />
            </div>
            <CardTitle className="text-center text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Your account doesn't have administrator privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              Please contact an administrator if you believe this is a mistake.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If we get here, show the login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{isSignup ? "Create Admin Account" : "Admin Login"}</CardTitle>
          <CardDescription className="text-center">
            {isSignup 
              ? "Create a new admin account to access the dashboard" 
              : "Enter your credentials to access the admin dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
