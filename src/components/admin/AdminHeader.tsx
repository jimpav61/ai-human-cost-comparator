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

export const AdminHeader = () => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      
      console.log("Logout successful");
      navigate('/');
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
    }
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
            <Button variant="outline">Add Admin User</Button>
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
          variant="destructive"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};
