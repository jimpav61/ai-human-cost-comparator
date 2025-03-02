
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface FileUploaderProps {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export const FileUploader = ({ handleFileChange, isUploading }: FileUploaderProps) => {
  return (
    <div className="grid gap-2">
      <Input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <div className="text-xs text-gray-500">
        CSV must include columns: name, email, company_name
      </div>
    </div>
  );
};
