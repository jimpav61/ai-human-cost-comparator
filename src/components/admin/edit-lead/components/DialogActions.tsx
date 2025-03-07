
import { Button } from "@/components/ui/button";

interface DialogActionsProps {
  onClose: () => void;
  onSave: () => void;
}

export const DialogActions = ({ onClose, onSave }: DialogActionsProps) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onSave}>Save Changes</Button>
    </div>
  );
};
