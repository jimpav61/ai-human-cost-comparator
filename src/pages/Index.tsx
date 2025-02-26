
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIVsHumanCalculator } from '@/components/AIVsHumanCalculator';
import { LeadForm } from '@/components/LeadForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useState } from 'react';

const queryClient = new QueryClient();

export default function IndexPage() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);

  const handleLeadSubmit = (data: any) => {
    setHasSubmittedLead(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!showAdmin && (
            <div className="text-right mb-4">
              <button
                onClick={() => setShowAdmin(true)}
                className="text-sm text-gray-600 hover:text-brand-500"
              >
                Admin Dashboard →
              </button>
            </div>
          )}

          {showAdmin ? (
            <div>
              <button
                onClick={() => setShowAdmin(false)}
                className="mb-4 text-sm text-gray-600 hover:text-brand-500"
              >
                ← Back to Calculator
              </button>
              <AdminDashboard />
            </div>
          ) : (
            <>
              {!hasSubmittedLead ? (
                <LeadForm onSubmit={handleLeadSubmit} />
              ) : (
                <AIVsHumanCalculator />
              )}
            </>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
