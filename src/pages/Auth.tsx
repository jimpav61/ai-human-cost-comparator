
import { useEffect } from "react";

const Auth = () => {
  useEffect(() => {
    // Automatically redirect to admin page without authentication
    window.location.href = "/admin";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
};

export default Auth;
