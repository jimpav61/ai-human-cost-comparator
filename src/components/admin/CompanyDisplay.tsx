
import { Globe } from "lucide-react";

interface CompanyDisplayProps {
  companyName: string;
  website?: string;
}

export const CompanyDisplay = ({ companyName, website }: CompanyDisplayProps) => {
  return (
    <div>
      <div className="font-medium">{companyName}</div>
      {website && (
        <a 
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 text-xs mt-1"
        >
          <Globe className="h-3 w-3 mr-1" />
          Website
        </a>
      )}
    </div>
  );
};
