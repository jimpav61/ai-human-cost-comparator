
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoTab } from "./tabs/BasicInfoTab";
import { CalculatorOptionsTab } from "./tabs/CalculatorOptionsTab";
import { Lead } from "@/types/leads";
import { CalculatorInputs } from "@/hooks/useCalculator";

interface EditLeadTabsProps {
  formData: Lead;
  calculatorInputs: CalculatorInputs;
  handleBasicInfoChange: (field: keyof Lead, value: string | number) => void;
  handleCalculatorInputChange: (field: string, value: any) => void;
  calculationResults: any;
}

export const EditLeadTabs = ({
  formData,
  calculatorInputs,
  handleBasicInfoChange,
  handleCalculatorInputChange,
  calculationResults
}: EditLeadTabsProps) => {
  const safeFormatNumber = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(2);
  };

  return (
    <Tabs defaultValue="basic">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="calculator">Calculator Options</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4 mt-4">
        <BasicInfoTab 
          formData={formData} 
          handleBasicInfoChange={handleBasicInfoChange} 
        />
      </TabsContent>
      
      <TabsContent value="calculator" className="space-y-4 mt-4">
        <CalculatorOptionsTab
          calculatorInputs={calculatorInputs}
          handleCalculatorInputChange={handleCalculatorInputChange}
          calculationResults={calculationResults}
          safeFormatNumber={safeFormatNumber}
        />
      </TabsContent>
    </Tabs>
  );
};
