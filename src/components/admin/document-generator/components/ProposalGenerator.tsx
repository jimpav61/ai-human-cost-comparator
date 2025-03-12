
import { Lead } from "@/types/leads";
import { useProposalGenerator } from "@/hooks/useProposalGenerator";
import { toast } from "@/hooks/use-toast";

interface ProposalGeneratorProps {
  lead: Lead;
  onProposalGenerated?: (proposalPdf: string) => void;
}

export const ProposalGenerator = ({ lead, onProposalGenerated }: ProposalGeneratorProps) => {
  const { generating, generationError, proposalPdf, generationSuccess, generateProposal } = useProposalGenerator();

  const handleGenerateProposal = async () => {
    try {
      const pdf = await generateProposal(lead);
      if (onProposalGenerated) {
        onProposalGenerated(pdf);
      }
    } catch (error) {
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
