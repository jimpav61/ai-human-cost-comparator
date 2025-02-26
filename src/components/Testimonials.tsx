
const Testimonials = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Johnson",
              role: "CEO, TechStart",
              quote: "ChatSites.ai transformed our customer service operations. Our response times improved by 80%."
            },
            {
              name: "Michael Chen",
              role: "CTO, Digital Solutions",
              quote: "The AI integration was seamless, and the results were immediate. Highly recommended!"
            },
            {
              name: "Emma Williams",
              role: "Support Manager, GlobalTech",
              quote: "Our team loves how easy it is to manage and customize the AI responses."
            }
          ].map((testimonial) => (
            <div key={testimonial.name} className="p-6 border rounded-lg">
              <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
