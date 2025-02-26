
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-gray-100">
      <nav className="p-4">
        <div className="container mx-auto flex justify-end">
          <Link to="/auth">
            <Button variant="outline">Admin Login</Button>
          </Link>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to ChatSites.ai</h1>
        <p className="text-xl text-gray-600 mb-8">
          Transform your business with AI-powered solutions
        </p>
        <Button asChild>
          <Link to="/auth">Get Started</Link>
        </Button>
      </main>
    </div>
  );
};

export default Index;
