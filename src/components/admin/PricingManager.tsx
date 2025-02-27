
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { PricingConfiguration } from '@/types/pricing';
import { Loader2 } from 'lucide-react';

export const PricingManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configurations, setConfigurations] = useState<PricingConfiguration[]>([]);

  useEffect(() => {
    fetchPricingConfigurations();
  }, []);

  const fetchPricingConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_configurations')
        .select('*')
        .order('tier');

      if (error) throw error;
      
      // If no data exists, create default configurations
      if (!data || data.length === 0) {
        const defaultConfigurations: Partial<PricingConfiguration>[] = [
          {
            tier: 'starter',
            voice_per_minute: 0,
            chatbot_base_price: 99,
            chatbot_per_message: 0.003,
            setup_fee: 249,
            annual_price: 990,
            included_voice_minutes: 0
          },
          {
            tier: 'growth',
            voice_per_minute: 0.12,
            chatbot_base_price: 229,
            chatbot_per_message: 0.005,
            setup_fee: 749,
            annual_price: 2290,
            included_voice_minutes: 600
          },
          {
            tier: 'premium',
            voice_per_minute: 0.12,
            chatbot_base_price: 429,
            chatbot_per_message: 0.008,
            setup_fee: 1149, 
            annual_price: 4290,
            included_voice_minutes: 600
          }
        ];
        
        setConfigurations(defaultConfigurations as PricingConfiguration[]);
      } else {
        // Make sure we have all the required fields
        const updatedConfigurations = data.map(config => {
          return {
            ...config,
            setup_fee: config.setup_fee ?? 0,
            annual_price: config.annual_price ?? 0,
            included_voice_minutes: config.included_voice_minutes ?? 0
          } as PricingConfiguration;
        });
        
        setConfigurations(updatedConfigurations);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    tier: string,
    field: keyof PricingConfiguration,
    value: string
  ) => {
    setConfigurations(prev => prev.map(config => {
      if (config.tier === tier) {
        return {
          ...config,
          [field]: field === 'tier' ? value : parseFloat(value) || 0
        };
      }
      return config;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each configuration individually
      for (const config of configurations) {
        const { error } = await supabase
          .from('pricing_configurations')
          .upsert({
            id: config.id,
            tier: config.tier,
            voice_per_minute: config.voice_per_minute,
            chatbot_base_price: config.chatbot_base_price,
            chatbot_per_message: config.chatbot_per_message,
            setup_fee: config.setup_fee,
            annual_price: config.annual_price,
            included_voice_minutes: config.included_voice_minutes
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Pricing configurations updated successfully",
      });
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update pricing configurations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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
          <div
            key={config.tier}
            className="p-6 bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-semibold capitalize mb-4">
              {config.tier === 'starter' ? 'Starter Plan' : 
               config.tier === 'growth' ? 'Growth Plan' : 
               'Premium Plan'}
            </h3>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Voice AI (per minute)
                </label>
                <Input
                  type="number"
                  value={config.voice_per_minute}
                  onChange={(e) => handleInputChange(config.tier, 'voice_per_minute', e.target.value)}
                  step="0.001"
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Chatbot Base Price (per month)
                </label>
                <Input
                  type="number"
                  value={config.chatbot_base_price}
                  onChange={(e) => handleInputChange(config.tier, 'chatbot_base_price', e.target.value)}
                  step="1"
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Chatbot Price (per message)
                </label>
                <Input
                  type="number"
                  value={config.chatbot_per_message}
                  onChange={(e) => handleInputChange(config.tier, 'chatbot_per_message', e.target.value)}
                  step="0.001"
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Setup Fee (one-time)
                </label>
                <Input
                  type="number"
                  value={config.setup_fee}
                  onChange={(e) => handleInputChange(config.tier, 'setup_fee', e.target.value)}
                  step="1"
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Annual Price
                </label>
                <Input
                  type="number"
                  value={config.annual_price}
                  onChange={(e) => handleInputChange(config.tier, 'annual_price', e.target.value)}
                  step="1"
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Included Voice Minutes
                </label>
                <Input
                  type="number"
                  value={config.included_voice_minutes}
                  onChange={(e) => handleInputChange(config.tier, 'included_voice_minutes', e.target.value)}
                  step="1"
                  min="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
