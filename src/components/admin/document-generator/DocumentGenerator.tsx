
import { ProposalGenerator } from "./components/ProposalGenerator";
import { ReportGenerator } from "./components/ReportGenerator";
import { Lead } from "@/types/leads";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VersionHistoryButton } from "./components/VersionHistoryButton";

interface DocumentGeneratorProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export const DocumentGenerator = ({ lead, onLeadUpdated }: DocumentGeneratorProps) => {
  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <h3 className="text-lg font-semibold">Document Generation</h3>
          <VersionHistoryButton lead={lead} />
        </div>
        
        <Separator className="my-3" />
        
        <div className="space-y-6">
          <ProposalGenerator lead={lead} onLeadUpdated={onLeadUpdated} />
          <Separator className="my-3" />
          <ReportGenerator lead={lead} />
        </div>
      </CardContent>
    </Card>
  );
};
