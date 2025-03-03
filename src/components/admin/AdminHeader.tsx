
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const AdminHeader = ({ isLoading = false }) => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      
      // Updated logout approach: directly sign out without checking for session
      const { error } = await supabase.auth.signOut();
      
      if (error && error.message !== "Session not found") {
        console.error("Logout error:", error);
        toast({
          title: "Error",
          description: "Failed to log out: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
        return;
      }
      
      console.log("Logout successful");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      
      // Force navigation after logout
      window.location.href = '/';
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    // Use navigate instead of window.location to prevent page reload
    navigate('/');
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingAdmin(true);
    
    try {
      console.log("Adding new admin:", newAdminEmail);
      const { error } = await supabase
        .from('allowed_admins')
        .insert([{ email: newAdminEmail }]);

      if (error) {
        console.error("Error adding admin:", error);
        throw error;
      }

      console.log("Admin added successfully");
      toast({
        title: "Success",
        description: "New admin added successfully",
      });

      setNewAdminEmail('');
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: "Failed to add new admin: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="flex items-center gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>Add Admin User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter admin email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddAdmin}
                disabled={isAddingAdmin}
              >
                {isAddingAdmin ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Admin...
                  </>
                ) : (
                  "Add Admin"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button 
          variant="outline"
          onClick={handleGoBack}
          disabled={isLoading}
        >
          Go Back
        </Button>
        
        <Button 
          variant="destructive"
          onClick={handleLogout}
          disabled={isLoading}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};
