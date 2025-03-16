
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FixStorageButton } from "./FixStorageButton";
import { LogOut, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminHeaderProps {
  isLoading: boolean;
}

export const AdminHeader = ({ isLoading }: AdminHeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container max-w-[1920px] mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 mr-4">Admin Dashboard</h1>
          {!isLoading && (
            <div className="flex items-center">
              <FixStorageButton />
              <div className="ml-2 hidden md:block">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  onClick={() => {
                    toast({
                      title: "Storage Tip",
                      description: "If report downloads work but storage checks fail, the reports bucket might need configuration. Use the Fix Storage button.",
                      variant: "warning",
                    });
                  }}
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  Storage Help
                </Button>
              </div>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
