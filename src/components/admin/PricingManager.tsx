
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { PricingConfiguration } from '@/types/pricing';
import { 
  Loader2,
  DollarSign, 
  MessageCircle, 
  Phone, 
  Package, 
  Tag, 
  CreditCard,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const PricingManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configurations, setConfigurations] = useState<PricingConfiguration[]>([]);
  const [activeTab, setActiveTab] = useState('all');

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
            included_voice_minutes: 0,
            additional_voice_rate: 0
          },
          {
            tier: 'growth',
            voice_per_minute: 0.12,
            chatbot_base_price: 229,
            chatbot_per_message: 0.005,
            setup_fee: 749,
            annual_price: 2290,
            included_voice_minutes: 600,
            additional_voice_rate: 0.12
          },
          {
            tier: 'premium',
            voice_per_minute: 0.12,
            chatbot_base_price: 429,
            chatbot_per_message: 0.008,
            setup_fee: 1149, 
            annual_price: 4290,
            included_voice_minutes: 600,
            additional_voice_rate: 0.12
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
            included_voice_minutes: typeof config.included_voice_minutes === 'number' ? config.included_voice_minutes : 0,
            additional_voice_rate: typeof config.additional_voice_rate === 'number' ? config.additional_voice_rate : config.voice_per_minute as number
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
          included_voice_minutes: config.included_voice_minutes,
          additional_voice_rate: config.additional_voice_rate
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

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'starter': return 'Starter Plan';
      case 'growth': return 'Growth Plan';
      case 'premium': return 'Premium Plan';
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'growth': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div>
          <h2 className="text-2xl font-semibold">Pricing Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage pricing for all plan tiers and features
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="starter">Starter</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {configurations.map((config) => (
              <PricingCard 
                key={config.tier}
                config={config}
                handleInputChange={handleInputChange}
                tierColor={getTierColor(config.tier)}
                tierName={getTierName(config.tier)}
              />
            ))}
          </div>
        </TabsContent>

        {configurations.map((config) => (
          <TabsContent key={config.tier} value={config.tier} className="mt-4">
            <PricingCard 
              config={config}
              handleInputChange={handleInputChange}
              tierColor={getTierColor(config.tier)}
              tierName={getTierName(config.tier)}
              detailed
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

interface PricingCardProps {
  config: PricingConfiguration;
  handleInputChange: (tier: string, field: keyof PricingConfiguration, value: string) => void;
  tierColor: string;
  tierName: string;
  detailed?: boolean;
}

const PricingCard = ({ config, handleInputChange, tierColor, tierName, detailed = false }: PricingCardProps) => {
  return (
    <Card className={detailed ? "w-full" : "h-full"}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{tierName}</CardTitle>
            <CardDescription>
              {config.tier === 'starter' ? 'Text Only' : 
               config.tier === 'growth' ? 'Text & Basic Voice' : 
               'Text & Conversational Voice'}
            </CardDescription>
          </div>
          <Badge className={tierColor}>{config.tier}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={detailed ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
          <div className="space-y-4">
            <h3 className="font-medium text-sm flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Base Pricing
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  Monthly Base Price
                </label>
                <Input
                  type="number"
                  value={config.chatbot_base_price}
                  onChange={(e) => handleInputChange(config.tier, 'chatbot_base_price', e.target.value)}
                  step="1"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  Setup Fee (one-time)
                </label>
                <Input
                  type="number"
                  value={config.setup_fee}
                  onChange={(e) => handleInputChange(config.tier, 'setup_fee', e.target.value)}
                  step="1"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Annual Price
                </label>
                <Input
                  type="number"
                  value={config.annual_price}
                  onChange={(e) => handleInputChange(config.tier, 'annual_price', e.target.value)}
                  step="1"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
          
          {(detailed || config.tier !== 'starter') && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                Voice Pricing
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Included Voice Minutes
                  </label>
                  <Input
                    type="number"
                    value={config.included_voice_minutes}
                    onChange={(e) => handleInputChange(config.tier, 'included_voice_minutes', e.target.value)}
                    step="1"
                    min="0"
                    disabled={config.tier === 'starter'}
                    className="h-8 text-sm"
                  />
                  {config.tier === 'starter' && (
                    <p className="text-xs text-gray-500">Not available in Starter Plan</p>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    Voice Rate (per minute)
                  </label>
                  <Input
                    type="number"
                    value={config.voice_per_minute}
                    onChange={(e) => handleInputChange(config.tier, 'voice_per_minute', e.target.value)}
                    step="0.001"
                    min="0"
                    disabled={config.tier === 'starter'}
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    Additional Voice Rate
                  </label>
                  <Input
                    type="number"
                    value={config.additional_voice_rate || config.voice_per_minute}
                    onChange={(e) => handleInputChange(config.tier, 'additional_voice_rate', e.target.value)}
                    step="0.001"
                    min="0"
                    disabled={config.tier === 'starter'}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {detailed && (
          <div className="space-y-4 pt-2">
            <Separator />
            <h3 className="font-medium text-sm flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              Chatbot Pricing
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Chatbot Price (per message)</label>
                <Input
                  type="number"
                  value={config.chatbot_per_message}
                  onChange={(e) => handleInputChange(config.tier, 'chatbot_per_message', e.target.value)}
                  step="0.001"
                  min="0"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full text-xs text-gray-500">
          {detailed ? (
            <div className="flex justify-between">
              <span>Last updated: {new Date(config.updated_at).toLocaleDateString()}</span>
              <span>ID: {config.id}</span>
            </div>
          ) : (
            <div className="flex justify-end">
              <span className="italic">Edit in {config.tier} tab for more options</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
