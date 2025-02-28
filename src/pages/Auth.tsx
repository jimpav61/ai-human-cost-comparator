
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Mail, Lock } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignup) {
        // Check if email is in allowed_admins table before signup
        const { data: allowedAdmin, error: allowedAdminError } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', email)
          .single();
        
        if (allowedAdminError || !allowedAdmin) {
          toast({
            title: "Access Denied",
            description: "This email is not authorized to create an admin account.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Handle signup
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (signUpError) throw signUpError;
        
        toast({
          title: "Account Created",
          description: "Your admin account has been created. Please log in with your credentials.",
        });
        
        setIsSignup(false);
      } else {
        // Handle login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        
        // Check if user is admin
        if (data.user) {
          const { data: isAdmin, error: adminCheckError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (adminCheckError || !isAdmin) {
            console.error("Admin check failed or user is not admin:", { adminCheckError, isAdmin });
            await supabase.auth.signOut();
            
            toast({
              title: "Access Denied",
              description: "Your account does not have admin privileges.",
              variant: "destructive",
            });
            
            setLoading(false);
            return;
          }
        }
        
        // Successfully logged in as admin
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard!",
        });
        
        navigate('/admin');
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
