import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronUp, 
  Download, 
  RefreshCw 
} from "lucide-react";
import { SettingsConfig } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  settings: SettingsConfig;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onClose }: SettingsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [localSettings, setLocalSettings] = useState<SettingsConfig>(settings);
  const { toast } = useToast();

  const updateSettings = useMutation({
    mutationFn: async (updatedSettings: SettingsConfig) => {
      const res = await apiRequest("POST", "/api/settings", updatedSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (
    key: keyof SettingsConfig, 
    value: number | boolean
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    
    // Debounce the update
    const timer = setTimeout(() => {
      updateSettings.mutate({
        ...localSettings,
        [key]: value,
      });
    }, 500);
    
    return () => clearTimeout(timer);
  };

  const exportData = async () => {
    try {
      const response = await fetch("/api/captures/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crowd-analytics-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export the data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetData = async () => {
    if (window.confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
      try {
        await apiRequest("POST", "/api/captures/reset");
        queryClient.invalidateQueries({ queryKey: ["/api/captures"] });
        toast({
          title: "Data reset",
          description: "All captured data has been reset successfully",
        });
      } catch (error) {
        toast({
          title: "Reset failed",
          description: "Could not reset the data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mt-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Settings</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#323130] hover:text-primary p-1"
          >
            <ChevronUp className={`h-5 w-5 ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {!collapsed && (
          <div>
            {/* Capture Settings */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Capture Settings</h3>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <Label htmlFor="frame-interval">Frame Capture Interval</Label>
                  <span className="font-mono">{localSettings.frameInterval}s</span>
                </div>
                <Slider
                  id="frame-interval"
                  min={3}
                  max={7}
                  step={1}
                  value={[localSettings.frameInterval]}
                  onValueChange={(values) => handleSettingChange("frameInterval", values[0])}
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="auto-capture" className="cursor-pointer">Automatic capture</Label>
                <Switch
                  id="auto-capture"
                  checked={localSettings.autoCapture}
                  onCheckedChange={(checked) => handleSettingChange("autoCapture", checked)}
                />
              </div>
            </div>
            
            {/* Analysis Settings */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Analysis Settings</h3>
              
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                  <span className="font-mono">{localSettings.confidenceThreshold}%</span>
                </div>
                <Slider
                  id="confidence-threshold"
                  min={50}
                  max={99}
                  step={1}
                  value={[localSettings.confidenceThreshold]}
                  onValueChange={(values) => handleSettingChange("confidenceThreshold", values[0])}
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="age-analysis" className="cursor-pointer">Age analysis</Label>
                <Switch
                  id="age-analysis"
                  checked={localSettings.enableAgeAnalysis}
                  onCheckedChange={(checked) => handleSettingChange("enableAgeAnalysis", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="gender-analysis" className="cursor-pointer">Gender analysis</Label>
                <Switch
                  id="gender-analysis"
                  checked={localSettings.enableGenderAnalysis}
                  onCheckedChange={(checked) => handleSettingChange("enableGenderAnalysis", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="emotion-analysis" className="cursor-pointer">Emotion analysis</Label>
                <Switch
                  id="emotion-analysis"
                  checked={localSettings.enableEmotionAnalysis}
                  onCheckedChange={(checked) => handleSettingChange("enableEmotionAnalysis", checked)}
                />
              </div>
            </div>
            
            {/* Data Management */}
            <div>
              <h3 className="font-medium mb-2">Data Management</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="bg-primary hover:bg-primary-dark text-white" 
                  size="sm"
                  onClick={exportData}
                >
                  <Download className="mr-1 h-4 w-4" /> Export Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetData}
                >
                  <RefreshCw className="mr-1 h-4 w-4" /> Reset Data
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
