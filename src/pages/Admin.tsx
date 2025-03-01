
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Lead } from "@/types/leads";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LoadingState, LoadingTimeout, AuthError } from "@/components/admin/AdminStateHandlers";

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setIsLoading(true);
    setAuthError(null);
    setLoadingTimeout(false);
    setRetryCount(retryCount + 1);
  };

  const handleGoBack = () => {
    window.location.href = '/';
  };

  // Authentication timeout screen
  if (loadingTimeout) {
    return <LoadingTimeout onRetry={handleRetry} onGoBack={handleGoBack} />;
  }

  // Loading state
  if (isLoading) {
    return <LoadingState retryCount={retryCount} />;
  }

  // Authentication error screen
  if (authError) {
    return <AuthError error={authError} onRetry={handleRetry} onGoBack={handleGoBack} />;
  }

  // No session redirect
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Not admin redirect
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  // Main admin dashboard
  return (
    <AdminAuth
      setSession={setSession}
      setIsAdmin={setIsAdmin}
      setLeads={setLeads}
      setIsLoading={setIsLoading}
      setAuthError={setAuthError}
      setLoadingTimeout={setLoadingTimeout}
      setRetryCount={setRetryCount}
      retryCount={retryCount}
    >
      <AdminDashboard leads={leads} isLoading={isLoading} />
    </AdminAuth>
  );
};

export default Admin;
