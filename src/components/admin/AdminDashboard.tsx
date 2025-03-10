
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsTable } from "@/components/admin/leads-table/LeadsTable";
import { PricingManager } from "@/components/admin/PricingManager";
import { CsvUploader } from "@/components/admin/CsvUploader";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Lead } from "@/types/leads";

interface AdminDashboardProps {
  leads: Lead[];
  isLoading: boolean;
}

export const AdminDashboard = ({ leads, isLoading }: AdminDashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <AdminHeader isLoading={isLoading} />
      
      <main className="max-w-full lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4 sm:mb-6 w-full flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="leads" className="flex-1">Leads Management</TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1">Pricing Configuration</TabsTrigger>
            <TabsTrigger value="import" className="flex-1">Import Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4 sm:space-y-6 lg:space-y-8 overflow-x-auto">
            <LeadsTable leads={leads} />
          </TabsContent>
          
          <TabsContent value="pricing">
            <PricingManager />
          </TabsContent>
          
          <TabsContent value="import">
            <CsvUploader />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
