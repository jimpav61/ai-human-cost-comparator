
import { Button } from "@/components/ui/button";
import { AI_RATES } from "@/constants/pricing";

const Pricing = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing Plans</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(AI_RATES.chatbot).map(([tier, rates]) => (
            <div key={tier} className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 capitalize">{tier}</h3>
              <div className="text-4xl font-bold mb-6">${rates.base}<span className="text-lg">/mo</span></div>
              <ul className="mb-8 space-y-4">
                <li>✓ {(1000000 * rates.perMessage).toFixed(0)}k messages included</li>
                <li>✓ 24/7 Support</li>
                <li>✓ Analytics Dashboard</li>
              </ul>
              <Button className="w-full">Get Started</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
