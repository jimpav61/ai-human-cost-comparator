
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatPercent } from '@/utils/formatters';

export const AdminDashboard = () => {
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Error Loading Leads",
          description: "Could not load lead data",
          variant: "destructive",
        });
        throw error;
      }
      
      return data;
    },
  });

  const { data: calculations, isLoading: calculationsLoading } = useQuery({
    queryKey: ['calculations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Error Loading Calculations",
          description: "Could not load calculation data",
          variant: "destructive",
        });
        throw error;
      }
      
      return data;
    },
  });

  if (leadsLoading || calculationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Leads Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Recent Leads</h2>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads?.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{lead.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{lead.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{lead.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{lead.phone_number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculations Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Calculations</h2>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Savings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yearly Savings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Savings %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calculations?.map((calc) => (
                <tr key={calc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(calc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {calc.input_data.aiType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(calc.results.monthlySavings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(calc.results.yearlySavings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPercent(calc.results.savingsPercentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
