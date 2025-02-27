
import { Mail, Phone } from "lucide-react";

interface ContactDisplayProps {
  email: string;
  phoneNumber?: string;
}

export const ContactDisplay = ({ email, phoneNumber }: ContactDisplayProps) => {
  return (
    <div className="space-y-1">
      <a 
        href={`mailto:${email}`}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <Mail className="h-4 w-4 mr-1" />
        {email}
      </a>
      {phoneNumber && (
        <a 
          href={`tel:${phoneNumber}`}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <Phone className="h-4 w-4 mr-1" />
          {phoneNumber}
        </a>
      )}
    </div>
  );
};
