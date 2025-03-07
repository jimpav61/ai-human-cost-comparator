
import { Button } from "@/components/ui/button";

interface AdminErrorStateProps {
  errorType: "timeout" | "error";
  errorMessage?: string;
  retryCount?: number;
  onRetry: () => void;
  onGoBack: () => void;
}

export const AdminErrorState = ({ 
  errorType, 
  errorMessage, 
  retryCount,
  onRetry, 
  onGoBack 
}: AdminErrorStateProps) => {
  if (errorType === "timeout") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Taking Too Long</h1>
          <p className="text-gray-600 mb-6">
            We're having trouble verifying your admin credentials. This could be due to network issues or server response delays.
          </p>
          <div className="flex flex-col space-y-3">
            <Button onClick={onRetry}>Try Again</Button>
            <Button variant="outline" onClick={onGoBack}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          {errorMessage || "An error occurred during authentication"}
        </p>
        <div className="flex flex-col space-y-3">
          <Button onClick={onRetry}>Try Again</Button>
          <Button variant="outline" onClick={onGoBack}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
};
