
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const Admin = () => {
  const {
    session,
    isAdmin,
    isLoading,
    authError,
    leads,
    loadingTimeout,
    retryCount,
    handleRetry,
    handleGoBack
  } = useAdminAuth();

  if (loadingTimeout) {
    return (
      <AdminErrorState 
        errorType="timeout" 
        onRetry={handleRetry} 
        onGoBack={handleGoBack} 
      />
    );
  }

  if (isLoading) {
    return <AdminLoadingState retryCount={retryCount} />;
  }

  if (authError) {
    return (
      <AdminErrorState 
        errorType="error" 
        errorMessage={authError}
        onRetry={handleRetry} 
        onGoBack={handleGoBack} 
      />
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return <AdminDashboard leads={leads} isLoading={isLoading} />;
};

export default Admin;
