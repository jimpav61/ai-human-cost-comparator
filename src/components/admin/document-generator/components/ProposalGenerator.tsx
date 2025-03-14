
import { Lead } from "@/types/leads";
import { useProposalGenerator } from "@/hooks/useProposalGenerator";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface ProposalGeneratorProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => void;
  onProposalGenerated?: (proposalPdf: string) => void;
}

export const ProposalGenerator = ({ lead, onLeadUpdated, onProposalGenerated }: ProposalGeneratorProps) => {
  const { generating, generationError, proposalPdf, generationSuccess, generateProposal } = useProposalGenerator();
  const [retryCount, setRetryCount] = useState(0);

  const handleGenerateProposal = async () => {
    try {
      // Check if lead has required data
      if (!lead?.id) {
        toast({
          title: "Error",
          description: "Lead data is incomplete",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Starting proposal generation for lead:", lead.id);
      
      // Generate the proposal
      const pdf = await generateProposal(lead);
      
      if (!pdf) {
        throw new Error("Failed to generate proposal: No PDF content returned");
      }
      
      console.log("Proposal generated successfully, PDF length:", pdf.length);
      
      // Call both callbacks if provided
      if (onProposalGenerated && pdf) {
        onProposalGenerated(pdf);
      }
      
      // If the lead was updated during proposal generation, notify parent
      if (onLeadUpdated) {
        onLeadUpdated(lead);
      }
    } catch (error) {
      console.error("Error in proposal generation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate proposal",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    handleGenerateProposal();
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleGenerateProposal}
        disabled={generating}
        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50 min-w-[200px]"
      >
        {generating ? "Generating..." : "Generate Proposal"}
      </Button>
      
      {generationSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Proposal generated successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {generationError && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {generationError}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className="mt-2"
          >
            Retry Generation
          </Button>
        </div>
      )}
    </div>
  );
};
