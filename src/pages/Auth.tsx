
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
        console.log("Auth: Starting existing session check...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth: Session check error:", error);
          return;
        }
        
        if (session) {
          console.log("Auth: Found existing session, checking admin status...", session);
          const { data: adminCheck, error: adminError } = await supabase
            .from('allowed_admins')
            .select('email')
            .eq('email', session.user.email)
            .single();

          if (adminError) {
            console.error("Auth: Admin check error:", adminError);
            return;
          }
          
          if (adminCheck) {
            console.log("Auth: Valid admin session found, redirecting...");
            window.location.href = '/admin';
          }
        } else {
          console.log("Auth: No existing session found");
        }
      } catch (error) {
        console.error("Auth: Session check failed:", error);
      }
    };
    
    checkExistingSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("Auth: Starting login attempt...");
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error("Auth: Login error:", authError);
        throw authError;
      }

      console.log("Auth: Login successful, verifying admin status...", data);
      
      if (!data.session) {
        console.error("Auth: No session after login");
        throw new Error("No session created");
      }

      const { data: adminData, error: adminError } = await supabase
        .from('allowed_admins')
        .select('email')
        .eq('email', data.session.user.email)
        .single();

      if (adminError) {
        console.error("Auth: Admin verification error:", adminError);
        throw adminError;
      }

      if (!adminData) {
        console.log("Auth: Not an admin, signing out...");
        throw new Error("Unauthorized access");
      }

      console.log("Auth: Admin verified successfully, redirecting...");
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // Redirect immediately after successful admin verification
      window.location.href = '/admin';
      
    } catch (error: any) {
      console.error("Auth: Login process failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
