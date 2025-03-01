
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  retryCount: number;
}

export const LoadingState = ({ retryCount }: LoadingStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admin dashboard...</p>
        {retryCount > 0 && (
          <p className="text-gray-500 mt-2">Attempt {retryCount + 1}...</p>
        )}
      </div>
    </div>
  );
};

interface LoadingTimeoutProps {
  onRetry: () => void;
  onGoBack: () => void;
}

export const LoadingTimeout = ({ onRetry, onGoBack }: LoadingTimeoutProps) => {
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
};

interface AuthErrorProps {
  error: string;
  onRetry: () => void;
  onGoBack: () => void;
}

export const AuthError = ({ error, onRetry, onGoBack }: AuthErrorProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          {error}
        </p>
        <div className="flex flex-col space-y-3">
          <Button onClick={onRetry}>Try Again</Button>
          <Button variant="outline" onClick={onGoBack}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
};
