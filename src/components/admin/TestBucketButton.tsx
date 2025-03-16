
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyReportsBucket, testStorageBucketConnectivity } from "@/utils/report/bucketUtils";
import { Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const TestBucketButton = () => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestBucket = async () => {
    try {
      setIsTesting(true);
      toast({
        title: "Testing Bucket Access",
        description: "Running bucket verification tests...",
        variant: "default"
      });
      
      console.log("==========================================");
      console.log("STARTING BUCKET VERIFICATION TEST");
      console.log("==========================================");
      
      // Basic verification
      const basicVerification = await verifyReportsBucket();
      console.log("Basic bucket verification result:", basicVerification);
      
      // Advanced diagnostics
      const diagnosticResult = await testStorageBucketConnectivity();
      console.log("Advanced diagnostic result:", diagnosticResult);
      
      console.log("==========================================");
      console.log("BUCKET TEST COMPLETE");
      console.log("==========================================");
      
      // Show results to user
      if (basicVerification && diagnosticResult.success) {
        toast({
          title: "Bucket Access Successful",
          description: `Found ${diagnosticResult.availableBuckets.length} buckets. Reports bucket is accessible.`,
          variant: "default"
        });
      } else {
        let errorMessage = "Could not access the reports bucket. ";
        
        if (!diagnosticResult.authStatus) {
          errorMessage += "You are not authenticated. ";
        }
        
        if (diagnosticResult.bucketsError) {
          errorMessage += "Error listing buckets. ";
        }
        
        if (diagnosticResult.error) {
          errorMessage += diagnosticResult.error.message || "Unknown error.";
        }
        
        toast({
          title: "Bucket Access Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during bucket test:", error);
      toast({
        title: "Test Error",
        description: "An unexpected error occurred during testing.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      onClick={handleTestBucket}
      disabled={isTesting}
      variant="outline"
      size="sm"
      className="bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100"
    >
      <Database className="h-4 w-4 mr-2" />
      {isTesting ? "Testing..." : "Test Bucket Access"}
    </Button>
  );
};
