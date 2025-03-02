
import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";

export const useFileUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
      setFile(null);
      if (e.target) e.target.value = "";
    }
  };

  return { file, setFile, handleFileChange };
};
