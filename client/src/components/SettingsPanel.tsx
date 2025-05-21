import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronUp, 
  Download, 
  RefreshCw, 
  X,
  AlertCircle,
  AlertTriangle,
  Check
} from "lucide-react";
import { SettingsConfig, ApiUsageData } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
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

  // Fetch API usage data
  const { data: apiUsage, isLoading: isLoadingUsage } = useQuery<ApiUsageData>({
    queryKey: ["/api/usage"],
    refetchInterval: 60000, // Refresh every minute
  });

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
    value: number | boolean | string
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

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate usage percentage
  const calculateUsagePercentage = (count: number, limit: number) => {
    return Math.min(Math.round((count / limit) * 100), 100);
  };

  // Determine AWS usage limit
  const awsLimit = 1000; // Default value
  const faceppLimit = 30000; // Default value
  const faceppRateLimit = 20; // Default rate limit per minute

  return (
    <Card className="bg-white rounded-lg shadow-md mt-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Settings</h2>
          <div className="flex">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="text-[#323130] hover:text-primary p-1 mr-1"
            >
              <ChevronUp className={`h-5 w-5 ${collapsed ? 'rotate-180' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-[#323130] hover:text-primary p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
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
              
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <Label htmlFor="auto-stop-timeout">Auto-stop Timeout</Label>
                  <span className="font-mono">{localSettings.autoStopTimeoutMinutes || 1} min</span>
                </div>
                <Slider
                  id="auto-stop-timeout"
                  min={1}
                  max={10}
                  step={1}
                  value={[localSettings.autoStopTimeoutMinutes || 1]}
                  onValueChange={(values) => handleSettingChange("autoStopTimeoutMinutes", values[0])}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Capture will automatically stop after this time to save API usage.
                </div>
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
            
            {/* API Provider Settings */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">API Provider</h3>
              <div className="p-3 border rounded-md mb-3">
                <div className="flex flex-col mb-3">
                  <div className="flex items-center space-x-3 mb-1">
                    <input 
                      type="radio" 
                      id="aws-provider" 
                      name="api-provider" 
                      value="aws"
                      checked={localSettings.apiProvider === 'aws'}
                      onChange={() => handleSettingChange("apiProvider", 'aws')}
                      className="h-4 w-4 text-primary"
                      disabled={apiUsage?.aws.reachedLimit}
                    />
                    <Label htmlFor="aws-provider" className={`cursor-pointer font-medium ${apiUsage?.aws.reachedLimit ? 'text-gray-400' : ''}`}>
                      Amazon Rekognition
                      {apiUsage?.aws.reachedLimit && (
                        <span className="ml-2 text-xs text-red-500 font-normal">
                          (Limit Reached)
                        </span>
                      )}
                    </Label>
                  </div>
                  <div className="ml-7 text-xs text-gray-500">
                    Requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION in environment
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center space-x-3 mb-1">
                    <input 
                      type="radio" 
                      id="facepp-provider" 
                      name="api-provider" 
                      value="facepp"
                      checked={localSettings.apiProvider === 'facepp'}
                      onChange={() => handleSettingChange("apiProvider", 'facepp')}
                      className="h-4 w-4 text-primary"
                      disabled={apiUsage?.facepp.reachedLimit}
                    />
                    <Label htmlFor="facepp-provider" className={`cursor-pointer font-medium ${apiUsage?.facepp.reachedLimit ? 'text-gray-400' : ''}`}>
                      Face++ API
                      {apiUsage?.facepp.reachedLimit && (
                        <span className="ml-2 text-xs text-red-500 font-normal">
                          (Limit Reached)
                        </span>
                      )}
                    </Label>
                  </div>
                  <div className="ml-7 text-xs text-gray-500">
                    Requires FACEPP_API_KEY, FACEPP_API_SECRET in environment
                  </div>
                </div>
              </div>
            </div>

            {/* API Usage Stats */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">API Usage Statistics</h3>
              {isLoadingUsage ? (
                <div className="text-center p-4 text-gray-500">Loading usage data...</div>
              ) : (
                <>
                  {/* AWS Usage */}
                  <div className="p-3 border rounded-md mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">AWS Rekognition</h4>
                      <div className="flex items-center">
                        {apiUsage?.aws.reachedLimit ? (
                          <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                        ) : apiUsage && calculateUsagePercentage(apiUsage.aws.count, awsLimit) > 80 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        )}
                        <span className="text-xs">
                          {apiUsage?.aws.count || 0} / {awsLimit}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          apiUsage?.aws.reachedLimit ? 'bg-red-500' :
                          apiUsage && calculateUsagePercentage(apiUsage.aws.count, awsLimit) > 80 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${apiUsage ? calculateUsagePercentage(apiUsage.aws.count, awsLimit) : 0}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Start Date: {apiUsage ? formatDate(apiUsage.aws.startDate) : 'N/A'}</span>
                        <span>Reset Date: {apiUsage ? formatDate(apiUsage.aws.resetDate) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Face++ Usage */}
                  <div className="p-3 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Face++ API</h4>
                      <div className="flex items-center">
                        {apiUsage?.facepp.reachedLimit ? (
                          <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                        ) : apiUsage && calculateUsagePercentage(apiUsage.facepp.count, faceppLimit) > 80 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mr-1" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500 mr-1" />
                        )}
                        <span className="text-xs">
                          {apiUsage?.facepp.count || 0} / {faceppLimit}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          apiUsage?.facepp.reachedLimit ? 'bg-red-500' :
                          apiUsage && calculateUsagePercentage(apiUsage.facepp.count, faceppLimit) > 80 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${apiUsage ? calculateUsagePercentage(apiUsage.facepp.count, faceppLimit) : 0}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Start Date: {apiUsage ? formatDate(apiUsage.facepp.startDate) : 'N/A'}</span>
                        <span>Reset Date: {apiUsage ? formatDate(apiUsage.facepp.resetDate) : 'N/A'}</span>
                      </div>
                      <div className="mt-1 border-t pt-1">
                        <span>Rate Limit: {apiUsage?.facepp.minuteCount || 0} / {faceppRateLimit} per minute</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
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
            <div className="mb-5">
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
            
            {/* Close Button */}
            <div className="flex justify-end">
              <Button
                onClick={onClose}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                Close Settings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
