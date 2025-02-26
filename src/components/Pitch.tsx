
const Pitch = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ChatSites.ai?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">24/7 Availability</h3>
            <p className="text-gray-600">AI-powered support that never sleeps, ensuring your customers always get help.</p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Cost Effective</h3>
            <p className="text-gray-600">Reduce operational costs while maintaining high-quality customer service.</p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold mb-4">Scalable Solution</h3>
            <p className="text-gray-600">Easily handle increasing customer inquiries without additional staffing.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pitch;
