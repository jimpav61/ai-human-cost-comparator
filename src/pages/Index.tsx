
import { AIVsHumanCalculator } from "@/components/AIVsHumanCalculator";
import Header from "@/components/Header";

const Index = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AiGent Compass</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compare the costs of AI voice agents with human employees
            </p>
          </div>
          
          <AIVsHumanCalculator />
        </div>
      </div>
    </>
  );
};

export default Index;
