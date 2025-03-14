
import { Lead } from "@/types/leads";
import { useProposalGenerator } from "@/hooks/useProposalGenerator";
import { toast } from "@/hooks/use-toast";

interface ProposalGeneratorProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => void;
  onProposalGenerated?: (proposalPdf: string) => void;
}

export const ProposalGenerator = ({ lead, onLeadUpdated, onProposalGenerated }: ProposalGeneratorProps) => {
  const { generating, generationError, proposalPdf, generationSuccess, generateProposal } = useProposalGenerator();

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
      
      // Generate the proposal
      const pdf = await generateProposal(lead);
      
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
        description: generationError || "Failed to generate proposal",
        variant: "destructive"
      });
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerateProposal}
        disabled={generating}
        className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {generating ? "Generating..." : "Generate Proposal"}
      </button>
      
      {generationSuccess && (
        <p className="text-green-600 mt-2">Proposal generated successfully!</p>
      )}
      
      {generationError && (
        <p className="text-red-600 mt-2">{generationError}</p>
      )}
    </div>
  );
};
