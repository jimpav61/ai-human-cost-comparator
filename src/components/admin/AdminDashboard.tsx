import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsTable } from "@/components/admin/LeadsTable";
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
    <div className="min-h-screen bg-gray-50">
      <AdminHeader isLoading={isLoading} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Leads Management</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Configuration</TabsTrigger>
            <TabsTrigger value="import">Import Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-8">
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
