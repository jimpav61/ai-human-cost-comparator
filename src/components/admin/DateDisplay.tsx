
import { Calendar } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface DateDisplayProps {
  dateString: string;
}

export const DateDisplay = ({ dateString }: DateDisplayProps) => {
  return (
    <div className="flex items-center text-gray-600 text-sm">
      <Calendar className="h-3 w-3 mr-1" />
      {formatDate(dateString)}
    </div>
  );
};
