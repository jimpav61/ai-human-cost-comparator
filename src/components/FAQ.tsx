
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>How does ChatSites.ai work?</AccordionTrigger>
              <AccordionContent>
                ChatSites.ai uses advanced AI algorithms to understand and respond to customer queries in real-time. It learns from interactions to continuously improve its responses.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I customize the AI responses?</AccordionTrigger>
              <AccordionContent>
                Yes, you can fully customize the AI's responses through our intuitive admin dashboard. You can set specific responses for different scenarios and train the AI with your business knowledge.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What kind of support do you offer?</AccordionTrigger>
              <AccordionContent>
                We offer 24/7 technical support, comprehensive documentation, and dedicated account managers for enterprise clients.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
