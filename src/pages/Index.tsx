
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import Pitch from "@/components/Pitch";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

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
      <Hero />
      <Pitch />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
