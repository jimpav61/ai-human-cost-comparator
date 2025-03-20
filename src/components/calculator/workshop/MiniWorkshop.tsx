
import React, { useState, useEffect, useRef } from 'react';
import { LeadData } from '../types';
import { Button } from '@/components/ui/button';
import { generateWorkshopContent } from './generateWorkshopContent';
import { PlayCircle, PauseCircle, Volume2 } from 'lucide-react';
import { WorkshopSection } from './WorkshopSection';

interface MiniWorkshopProps {
  leadData: LeadData;
  aiType: string;
  tierName: string;
}

export const MiniWorkshop: React.FC<MiniWorkshopProps> = ({ 
  leadData, 
  aiType, 
  tierName 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const workshopContent = generateWorkshopContent(leadData, aiType, tierName);
  
  const toggleAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      playCurrentSection();
    }
  };
  
  const playCurrentSection = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(workshopContent[currentSection].content);
      
      // Configure the voice (try to get a female voice if available)
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Google UK English Female')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Set rate slightly slower for better comprehension
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      // Handle end of speech
      utterance.onend = () => {
        setIsPlaying(false);
        // Optional: Auto-advance to next section
        // if (currentSection < workshopContent.length - 1) {
        //   setCurrentSection(currentSection + 1);
        //   setTimeout(playCurrentSection, 1000);
        // }
      };
      
      // Handle errors
      utterance.onerror = () => {
        setIsPlaying(false);
        console.error('Speech synthesis failed');
      };
      
      // Store reference to cancel later if needed
      speechSynthRef.current = utterance;
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };
  
  useEffect(() => {
    // Load voices when component mounts
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    
    // Cleanup on unmount
    return () => {
      if ('speechSynthesis' in window && speechSynthRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Clean up audio when changing sections
  useEffect(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, [currentSection]);

  return (
    <div className="mt-12 bg-white rounded-xl shadow-md p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Personalized AI Implementation Mini-Workshop
        </h2>
        <Button 
          onClick={toggleAudio} 
          variant={isPlaying ? "destructive" : "default"}
          size="sm"
          className="flex items-center gap-2"
        >
          {isPlaying ? (
            <>
              <PauseCircle className="h-5 w-5" />
              Stop Audio
            </>
          ) : (
            <>
              <PlayCircle className="h-5 w-5" />
              Listen
            </>
          )}
        </Button>
      </div>
      
      <p className="text-gray-600 mb-8">
        This personalized workshop will guide you through implementing AI in your business based on your specific needs.
      </p>
      
      <div className="space-y-4">
        {workshopContent.map((section, index) => (
          <WorkshopSection
            key={index}
            section={section}
            isActive={currentSection === index}
            onClick={() => setCurrentSection(index)}
            isPlaying={isPlaying && currentSection === index}
            onPlayPause={() => {
              if (currentSection !== index) {
                setCurrentSection(index);
                setTimeout(() => {
                  setIsPlaying(false);
                  playCurrentSection();
                }, 100);
              } else {
                toggleAudio();
              }
            }}
          />
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This content is generated based on your calculator inputs and industry data.</p>
      </div>
    </div>
  );
};
