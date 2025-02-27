
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
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setIsCheckingAuth(false);
        return;
      }
      
      setSession(data.session);
      
      if (data.session) {
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.session.user.id)
          .single();
          
        if (userError) {
          console.error("Error checking user role:", userError);
          setIsAdmin(false);
        } else if (userData && userData.role === 'admin') {
          setIsAdmin(true);
        }
      }
      
      setIsCheckingAuth(false);
    };
    
    checkUserSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setSession(session);
      
      if (session) {
        const { data: userData, error: userError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
          
        if (userError) {
          console.error("Error checking user role:", userError);
          setIsAdmin(false);
        } else if (userData && userData.role === 'admin') {
          setIsAdmin(true);
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
        
        // Now proceed with registration
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        // If email is in allowed_admins, the trigger will automatically add the admin role
        if (isAllowedData) {
          toast({
            title: "Admin Account Created",
            description: "Your account has been created with admin privileges. Please check your email for verification instructions.",
          });
        } else {
          toast({
            title: "Account Created",
            description: "Your account has been created. Please check your email for verification instructions.",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        console.log("Login successful", data);
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
