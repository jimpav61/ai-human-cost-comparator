
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  onClick: () => void;
  disabled: boolean;
  isUploading: boolean;
}

export const UploadButton = ({ onClick, disabled, isUploading }: UploadButtonProps) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
      className="w-full"
    >
      {isUploading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Upload and Import
        </>
      )}
    </Button>
  );
};
