
interface AdminLoadingStateProps {
  retryCount?: number;
}

export const AdminLoadingState = ({ retryCount = 0 }: AdminLoadingStateProps) => {
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
