
import { Lead } from "@/types/leads";
import { useProposalGenerator } from "../hooks/useProposalGenerator";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, Settings, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useProposalRevisions } from "../hooks/useProposalRevisions";
import { standardizeLeadData } from "@/utils/proposal/standardizeLeadData";
import { useProposalEdit } from "../hooks/useProposalEdit";
import { ProposalEditDialog } from "./edit-proposal/ProposalEditDialog";
import { supabase } from "@/integrations/supabase/client";
import { CalculatorInputs, CalculationResults } from "@/hooks/calculator/types";

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
  const [refreshingLead, setRefreshingLead] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead>(lead);

  // Refresh lead data from database to ensure we have latest changes
  const refreshLeadData = async () => {
    if (!lead?.id) return lead;
    
    try {
      setRefreshingLead(true);
      console.log("Refreshing lead data for ID:", lead.id);
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single();
        
      if (error) throw error;
      if (!data) throw new Error("No lead found");
      
      // Parse JSON strings if they're stored as strings
      let calculatorInputs: CalculatorInputs;
      if (typeof data.calculator_inputs === 'string') {
        try {
          calculatorInputs = JSON.parse(data.calculator_inputs);
        } catch (e) {
          console.error("Failed to parse calculator_inputs JSON:", e);
          calculatorInputs = data.calculator_inputs as unknown as CalculatorInputs;
        }
      } else {
        calculatorInputs = data.calculator_inputs as unknown as CalculatorInputs;
      }
      
      let calculatorResults: CalculationResults;
      if (typeof data.calculator_results === 'string') {
        try {
          calculatorResults = JSON.parse(data.calculator_results);
        } catch (e) {
          console.error("Failed to parse calculator_results JSON:", e);
          calculatorResults = data.calculator_results as unknown as CalculationResults;
        }
      } else {
        calculatorResults = data.calculator_results as unknown as CalculationResults;
      }
      
      // Convert the JSON data from Supabase to the expected Lead type
      const refreshedLead: Lead = {
        ...data,
        calculator_inputs: calculatorInputs,
        calculator_results: calculatorResults
      };
      
      console.log("Refreshed lead data:", {
        id: refreshedLead.id,
        tier: refreshedLead.calculator_inputs?.aiTier,
        aiType: refreshedLead.calculator_inputs?.aiType,
        callVolume: refreshedLead.calculator_inputs?.callVolume
      });
      
      setCurrentLead(refreshedLead);
      if (onLeadUpdated) {
        onLeadUpdated(refreshedLead);
      }
      
      return refreshedLead;
    } catch (error) {
      console.error("Error refreshing lead data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh lead data",
        variant: "destructive"
      });
      return lead;
    } finally {
      setRefreshingLead(false);
    }
  };

  // Update currentLead when lead prop changes
  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);

  const handleGenerateProposal = async () => {
    try {
      // Check if lead has required data
      if (!currentLead?.id) {
        toast({
          title: "Error",
          description: "Lead data is incomplete",
          variant: "destructive"
        });
        return;
      }
      
      // First refresh the lead to get latest data
      const freshLead = await refreshLeadData();
      
      // Log what we're working with
      console.log("Starting proposal generation for lead:", freshLead.id);
      console.log("Using tier:", freshLead.calculator_inputs?.aiTier);
      console.log("Using voice minutes:", freshLead.calculator_inputs?.callVolume);
      
      // Pre-process lead data using standardized utility
      const standardData = standardizeLeadData(freshLead);
      console.log("Using standardized lead data:", {
        company: standardData.companyName,
        tier: standardData.tierKey,
        aiType: standardData.aiType,
        additionalVoiceMinutes: standardData.additionalVoiceMinutes,
        totalPrice: standardData.totalMonthlyPrice
      });
      
      // Generate the proposal
      const pdf = await generateProposal(freshLead);
      
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
        
        const newRevision = await saveProposalRevision(freshLead.id, pdf, title, notes);
        
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
        onLeadUpdated(freshLead);
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
          disabled={generating || refreshingLead}
          className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {generating ? "Generating..." : refreshingLead ? "Refreshing..." : "Generate Proposal"}
        </Button>
        
        <Button
          onClick={handleOpenDialog}
          variant="outline"
          className="flex items-center gap-1"
        >
          <Settings className="h-4 w-4" />
          Edit Settings
        </Button>
        
        <Button
          onClick={refreshLeadData}
          variant="outline"
          className="flex items-center gap-1"
          disabled={refreshingLead}
        >
          <RefreshCw className={`h-4 w-4 ${refreshingLead ? "animate-spin" : ""}`} />
          Refresh Data
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
      
      {!currentLead.calculator_results && !generationError && (
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
        lead={currentLead}
        onSave={handleSaveProposalSettings}
      />
    </div>
  );
};
