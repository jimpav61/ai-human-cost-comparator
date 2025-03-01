
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, Info } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  console.log("Auth component rendering with state:", { isCheckingAuth, session, isAdmin, authError });

  // Enhanced session check with timeout handling
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      console.log("Auth check timed out");
      setIsCheckingAuth(false);
      setAuthError("Authentication check timed out. Please try again.");
    }, 10000); // 10 second timeout
    
    const checkUserSession = async () => {
      try {
        console.log("Checking user session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setAuthError(`Session check error: ${error.message}`);
          setIsCheckingAuth(false);
          return;
        }
        
        console.log("Session data:", data.session);
        setSession(data.session);
        
        if (data.session) {
          try {
            // Check for admin role
            const { data: userData, error: userError } = await supabase
              .rpc('has_role', { role_to_check: 'admin' });
              
            if (userError) {
              console.error("Error checking user role:", userError);
              setAuthError(`Role check error: ${userError.message}`);
              setIsAdmin(false);
            } else {
              console.log("User admin status:", userData);
              setIsAdmin(userData || false);
              
              // If admin, navigate to admin page
              if (userData) {
                navigate("/admin");
              }
            }
          } catch (err: any) {
            console.error("Role check exception:", err);
            setAuthError(`Role check exception: ${err.message}`);
            setIsAdmin(false);
          }
        }
      } catch (err: any) {
        console.error("Session check error:", err);
        setAuthError(`Session check exception: ${err.message}`);
      } finally {
        clearTimeout(authTimeout);
        setIsCheckingAuth(false);
      }
    };
    
    checkUserSession();
    
    // Enhanced auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, "Session:", session);
      setSession(session);
      
      if (session) {
        try {
          // Check for admin role
          const { data: userData, error: userError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (userError) {
            console.error("Error checking user role:", userError);
            setAuthError(`Role check error: ${userError.message}`);
            setIsAdmin(false);
          } else {
            console.log("User admin status on auth change:", userData);
            setIsAdmin(userData || false);
            
            // If admin, navigate to admin page
            if (userData) {
              navigate("/admin");
            }
          }
        } catch (err: any) {
          console.error("Error checking admin role:", err);
          setAuthError(`Role check exception: ${err.message}`);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    
    return () => {
      clearTimeout(authTimeout);
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // More robust login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    
    try {
      if (isSignup) {
        // First check if email is in allowed_admins
        console.log("Checking if admin is allowed:", email);
        const { data: isAllowedData, error: isAllowedError } = await supabase
          .rpc('is_allowed_admin', { email });
        
        if (isAllowedError) {
          console.error("Error checking if admin is allowed:", isAllowedError);
          throw new Error(`Admin check error: ${isAllowedError.message}`);
        }
        
        console.log("Is allowed admin:", isAllowedData);
        
        // Proceed with registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;
        
        console.log("Signup successful:", data);
        
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
        console.log("Attempting login with:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        console.log("Login successful:", data);
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });

        // Check role and navigate
        const { data: userData, error: roleError } = await supabase
          .rpc('has_role', { role_to_check: 'admin' });
          
        if (roleError) {
          console.error("Error checking role after login:", roleError);
          throw new Error(`Role check failed: ${roleError.message}`);
        }
        
        if (userData) {
          // Navigate to admin page after successful login
          navigate("/admin");
        } else {
          toast({
            title: "Access Denied",
            description: "Your account doesn't have administrator privileges.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setAuthError(error.message || "Failed to authenticate");
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
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
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                <p>Error details: {authError}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                <p>Error: {authError}</p>
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
            onClick={() => window.location.href = "/"}
          >
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
