
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
      setConfigurations(data || []);
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
      const { error } = await supabase
        .from('pricing_configurations')
        .upsert(
          configurations.map(config => ({
            tier: config.tier,
            voice_per_minute: config.voice_per_minute,
            chatbot_base_price: config.chatbot_base_price,
            chatbot_per_message: config.chatbot_per_message
          }))
        );

      if (error) throw error;

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
              {config.tier} Package
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
