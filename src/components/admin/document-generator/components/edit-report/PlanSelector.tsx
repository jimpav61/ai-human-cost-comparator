
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorInputs } from "@/hooks/calculator/types";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { 
  CheckCircle2, 
  MessageCircle, 
  Phone, 
  Zap,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlanSelectorProps {
  value: CalculatorInputs['aiTier'];
  onChange: (value: string) => void;
}

export const PlanSelector = ({ value, onChange }: PlanSelectorProps) => {
  const isMobile = useIsMobile();
  
  // Plan definitions
  const plans = [
    {
      key: 'starter',
      name: 'Starter Plan',
      description: 'Text-only AI capabilities for basic customer interactions',
      price: 99,
      setupFee: 249,
      features: [
        'Web Chat on your website',
        'Facebook Messenger',
        'WhatsApp',
        'Email Integration'
      ],
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: <MessageCircle className="h-4 w-4 text-blue-500" />
    },
    {
      key: 'growth',
      name: 'Growth Plan',
      description: 'Text and basic voice capabilities for growing businesses',
      price: 229,
      setupFee: 749,
      features: [
        'Everything in Starter Plan',
        'Basic Voice Integration',
        'Scripted Voice Responses',
        '600 Included Voice Minutes'
      ],
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: <Phone className="h-4 w-4 text-purple-500" />
    },
    {
      key: 'premium',
      name: 'Premium Plan',
      description: 'Advanced conversational AI for enterprise needs',
      price: 429,
      setupFee: 1149,
      features: [
        'Everything in Growth Plan',
        'Conversational Voice AI',
        'Dynamic Dialogue',
        'Complex Problem Solving',
        'Multi-turn Conversations'
      ],
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: <Zap className="h-4 w-4 text-amber-500" />
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="aiTier" className="text-sm font-medium">Plan</Label>
        <Select 
          value={value} 
          onValueChange={onChange}
        >
          <SelectTrigger id="aiTier" className="w-full">
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="starter">Starter Plan</SelectItem>
            <SelectItem value="growth">Growth Plan</SelectItem>
            <SelectItem value="premium">Premium Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <RadioGroup 
        value={value} 
        onValueChange={onChange}
        className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1'} gap-3`}
      >
        {plans.map((plan) => {
          const isSelected = value === plan.key;
          
          return (
            <div key={plan.key}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`relative overflow-hidden border ${isMobile ? 'p-5' : 'p-4'} transition-all ${
                        isSelected 
                          ? `${plan.color} border-2` 
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem 
                        value={plan.key} 
                        id={`plan-${plan.key}`}
                        className="absolute right-4 top-4"
                      />
                      <div className={`flex items-center ${isMobile ? 'flex-col text-center' : 'gap-3'}`}>
                        <div className={`p-2 rounded-full ${plan.color} ${isMobile ? 'mb-3' : ''}`}>
                          {plan.icon}
                        </div>
                        
                        <div className={isMobile ? 'w-full' : ''}>
                          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2`}>
                            <h3 className={`font-medium ${isSelected ? plan.textColor : ''}`}>
                              {plan.name}
                            </h3>
                            <Badge className={plan.badgeColor}>{plan.key}</Badge>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                          
                          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2 mt-2`}>
                            <span className="flex items-center font-medium">
                              <DollarSign className="h-3 w-3" />
                              {plan.price}/mo
                            </span>
                            <span className="text-xs text-gray-500">
                              (Setup: ${plan.setupFee})
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute right-1 bottom-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side={isMobile ? "bottom" : "right"} align={isMobile ? "center" : "start"} className="max-w-xs">
                    <strong>Features:</strong>
                    <ul className="text-xs mt-1 space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
