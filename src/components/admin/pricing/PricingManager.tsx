
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { PricingConfiguration } from '@/types/pricing';
import { usePricingConfigurations } from './hooks/usePricingConfigurations';
import { PricingTierCard } from './components/PricingTierCard';

export const PricingManager = () => {
  const { 
    configurations, 
    loading, 
    handleInputChange, 
    handleSave, 
    saving 
  } = usePricingConfigurations();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Pricing Configuration</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {configurations.map((config) => (
          <PricingTierCard
            key={config.tier}
            config={config}
            handleInputChange={handleInputChange}
          />
        ))}
      </div>
    </div>
  );
};
