
const Features = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            "Natural Language Processing",
            "Multi-language Support",
            "Custom Knowledge Base",
            "Analytics Dashboard",
            "Easy Integration",
            "Secure Data Handling"
          ].map((feature) => (
            <div key={feature} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-3">{feature}</h3>
              <p className="text-gray-600">Advanced AI capabilities designed to enhance your customer experience.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
