
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeadData } from '../types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileText, Copy, Check } from 'lucide-react';
import { generateWorkshopContent } from './generateWorkshopContent';
import { toast } from '@/components/ui/use-toast';

interface AIWorkshopProps {
  leadData: LeadData;
  aiType: string;
  tierName: string;
}

export const AIWorkshop: React.FC<AIWorkshopProps> = ({ leadData, aiType, tierName }) => {
  const workshopContent = generateWorkshopContent(leadData, aiType, tierName);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  
  const handlePrevious = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };
  
  const handleNext = () => {
    setCurrentSlide(prev => Math.min(workshopContent.length - 1, prev + 1));
  };
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [index]: true }));
    toast({
      title: "Content Copied",
      description: "Workshop content copied to clipboard",
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };
  
  const content = workshopContent[currentSlide];
  
  return (
    <div className="my-8 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
        ChatSites.ai Implementation Workshop
      </h2>
      
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-1">
          {workshopContent.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-red-600 w-3 h-3' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      
      <Card className="border-red-100 shadow-md max-w-4xl mx-auto">
        <CardHeader className="border-b border-gray-100 bg-red-50">
          <CardTitle className="text-red-800">{content.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 pb-4">
          <div className="prose max-w-none">
            {content.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="mb-4 text-gray-700">
                {paragraph}
              </p>
            ))}
            
            {content.bullets && (
              <ul className="mt-4 space-y-2">
                {content.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-gray-700">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="mt-6 text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={() => copyToClipboard(
              content.content + 
              (content.bullets ? '\n\n• ' + content.bullets.join('\n• ') : ''),
              currentSlide
            )}
          >
            {copied[currentSlide] ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </>
            )}
          </Button>
        </CardContent>
        
        <CardFooter className="border-t border-gray-100 flex justify-between bg-gray-50">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <div className="text-sm text-gray-500">
            {currentSlide + 1} of {workshopContent.length}
          </div>
          
          <Button
            variant={currentSlide === workshopContent.length - 1 ? "default" : "outline"}
            onClick={handleNext}
            disabled={currentSlide === workshopContent.length - 1}
            className={
              currentSlide === workshopContent.length - 1
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "text-gray-600 border-gray-300 hover:bg-gray-50"
            }
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
      
      <div className="flex justify-center mt-6">
        <Button 
          onClick={() => window.open("https://chatsites.ai/schedule", "_blank")}
          className="bg-red-600 hover:bg-red-700 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Schedule a Free Consultation
        </Button>
      </div>
    </div>
  );
};
