
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PricingConfiguration } from '@/types/pricing';

export const usePricingConfigurations = () => {
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
        // Make sure we have all the required fields by creating fully typed objects
        const updatedConfigurations = data.map(config => {
          // Create a new object with all the expected properties
          const typedConfig: PricingConfiguration = {
            id: config.id as string,
            created_at: config.created_at as string,
            updated_at: (config.updated_at || config.created_at) as string,
            tier: config.tier as PricingConfiguration['tier'],
            voice_per_minute: config.voice_per_minute as number,
            chatbot_base_price: config.chatbot_base_price as number,
            chatbot_per_message: config.chatbot_per_message as number,
            setup_fee: typeof config.setup_fee === 'number' ? config.setup_fee : 0,
            annual_price: typeof config.annual_price === 'number' ? config.annual_price : 0,
            included_voice_minutes: typeof config.included_voice_minutes === 'number' ? config.included_voice_minutes : 0
          };
          return typedConfig;
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
        // Explicitly define the fields we're updating
        const updateData = {
          id: config.id,
          tier: config.tier,
          voice_per_minute: config.voice_per_minute,
          chatbot_base_price: config.chatbot_base_price,
          chatbot_per_message: config.chatbot_per_message,
          setup_fee: config.setup_fee,
          annual_price: config.annual_price,
          included_voice_minutes: config.included_voice_minutes
        };
        
        const { error } = await supabase
          .from('pricing_configurations')
          .upsert([updateData]);

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

  return {
    configurations,
    loading,
    saving,
    handleInputChange,
    handleSave
  };
};
