
import { Lead } from "@/types/leads";
import { useProposalGenerator } from "@/hooks/useProposalGenerator";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, Settings } from "lucide-react";
import { useState } from "react";
import { useProposalRevisions } from "../hooks/useProposalRevisions";
import { standardizeLeadData } from "@/utils/proposal/standardizeLeadData";
import { useProposalEdit } from "../hooks/useProposalEdit";
import { ProposalEditDialog } from "./edit-proposal/ProposalEditDialog";

interface ProposalGeneratorProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => void;
  onProposalGenerated?: (proposalPdf: string) => void;
}

export const ProposalGenerator = ({ lead, onLeadUpdated, onProposalGenerated }: ProposalGeneratorProps) => {
  const { generating, generationError, proposalPdf, generationSuccess, generateProposal } = useProposalGenerator();
  const { saveProposalRevision } = useProposalRevisions();
  const { isDialogOpen, handleOpenDialog, handleCloseDialog, handleSaveProposalSettings } = useProposalEdit(lead, onLeadUpdated);
  const [retryCount, setRetryCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

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
      
      // Log what we're working with
      console.log("Starting proposal generation for lead:", lead.id);
      
      // Pre-process lead data using standardized utility
      const standardData = standardizeLeadData(lead);
      console.log("Using standardized lead data:", {
        company: standardData.companyName,
        tier: standardData.tierKey,
        aiType: standardData.aiType,
        additionalVoiceMinutes: standardData.additionalVoiceMinutes,
        totalPrice: standardData.totalMonthlyPrice
      });
      
      // Generate the proposal
      const pdf = await generateProposal(lead);
      
      if (!pdf) {
        throw new Error("Failed to generate proposal: No PDF content returned");
      }
      
      console.log("Proposal generated successfully, PDF length:", pdf.length);

      // IMPORTANT: Save the proposal as a revision
      try {
        console.log("Saving proposal as a new revision");
        const title = `Proposal for ${standardData.companyName}`;
        const notes = JSON.stringify({
          aiTier: standardData.tierKey,
          aiType: standardData.aiType,
          callVolume: standardData.additionalVoiceMinutes,
          basePrice: standardData.basePrice,
          totalPrice: standardData.totalMonthlyPrice
        });
        
        const newRevision = await saveProposalRevision(lead.id, pdf, title, notes);
        
        console.log("Proposal saved as revision:", newRevision);
        
        toast({
          title: "Success",
          description: `Proposal generated and saved as version ${newRevision.version_number}`,
          variant: "default",
        });
      } catch (saveError) {
        console.error("Error saving proposal revision:", saveError);
        // Continue anyway since the PDF was generated successfully
        toast({
          title: "Warning",
          description: "Proposal generated but couldn't be saved as a revision",
          variant: "default",
        });
      }
      
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
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handleGenerateProposal}
          disabled={generating}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Proposal"}
        </Button>
        
        <Button
          onClick={handleOpenDialog}
          variant="outline"
          className="flex items-center gap-1"
        >
          <Settings className="h-4 w-4" />
          Edit Settings
        </Button>
      </div>
      
      {generationSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Proposal generated successfully!
          </AlertDescription>
        </Alert>
      )}
      
      {!lead.calculator_results && !generationError && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Information</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This lead doesn't have calculator results. You'll need to edit the lead first to add calculator data.
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
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="mt-2"
            >
              Retry Generation
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowHelp(!showHelp)}
              className="mt-2"
            >
              {showHelp ? "Hide Help" : "Show Help"}
            </Button>
          </div>
          
          {showHelp && (
            <Alert className="bg-blue-50 border-blue-200 mt-2">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Troubleshooting</AlertTitle>
              <AlertDescription className="text-blue-700">
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Check that the lead has calculator results defined</li>
                  <li>Try editing the lead to update calculator settings</li>
                  <li>Make sure both aiTier and aiType are set correctly</li>
                  <li>For voice plans, ensure callVolume is properly defined</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <ProposalEditDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog} 
        lead={lead}
        onSave={handleSaveProposalSettings}
      />
    </div>
  );
};
