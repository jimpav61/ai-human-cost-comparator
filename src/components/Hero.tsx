
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Transform Your Business with AI</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Harness the power of artificial intelligence to streamline operations, enhance customer experience, and drive growth.
        </p>
        <Button asChild size="lg" className="mr-4">
          <Link to="/auth">Get Started</Link>
        </Button>
      </div>
    </section>
  );
};

export default Hero;
