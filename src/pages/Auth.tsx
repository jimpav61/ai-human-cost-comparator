
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: adminCheck } = await supabase
            .from('allowed_admins')
            .select('email')
            .eq('email', session.user.email)
            .single();
          
          if (adminCheck) {
            window.location.href = '/admin';
          } else {
            console.log("Not an admin, signing out");
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    checkExistingSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // First, check if the email is in allowed_admins
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('allowed_admins')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (adminCheckError || !adminCheck) {
        throw new Error("Unauthorized access attempt");
      }

      // If admin is allowed, attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (signInError) throw signInError;

      if (!data.session) {
        throw new Error("No session created");
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      window.location.href = '/admin';
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message === "Unauthorized access attempt" 
          ? "This email is not authorized for admin access" 
          : "Invalid email or password",
        variant: "destructive",
      });
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

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
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
