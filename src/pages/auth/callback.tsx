
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
  
        // If we have tokens in the URL, set them manually
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
  
          if (sessionError) {
            throw sessionError;
          }
        }
        
        // Now check if we have a valid session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!data.session) {
          throw new Error("No session found");
        }
        
        // Success! Redirect to admin
        window.location.href = '/admin';
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        toast({
          title: 'Authentication Error',
          description: err.message || "An unexpected error occurred",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
        <div className="text-center max-w-md px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/"
            className="inline-block px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
      <div className="text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Successful</h1>
        <p className="text-gray-600 mb-6">Redirecting you to the admin dashboard...</p>
      </div>
    </div>
  );
}
