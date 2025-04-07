import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoFeedPanel from "@/components/VideoFeedPanel";
import SettingsPanel from "@/components/SettingsPanel";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import CaptureDetailModal from "@/components/CaptureDetailModal";
import { CaptureResult, SettingsConfig } from "@/lib/types";
import { Video, Settings as SettingsIcon } from "lucide-react";

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState<CaptureResult | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch initial settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch recent captures
  const { data: captures, isLoading: isLoadingCaptures } = useQuery({
    queryKey: ["/api/captures"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const defaultSettings: SettingsConfig = {
    frameInterval: 5,
    confidenceThreshold: 80,
    enableAgeAnalysis: true,
    enableGenderAnalysis: true,
    enableEmotionAnalysis: true,
    autoCapture: true,
  };

  // Use fetched settings or default
  const currentSettings = settings || defaultSettings;

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleViewCaptureDetails = (capture: CaptureResult) => {
    setSelectedCapture(capture);
  };

  const handleCloseModal = () => {
    setSelectedCapture(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Video className="mr-2 h-5 w-5" />
            <h1 className="text-xl font-medium">Crowd Analytics Dashboard</h1>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-[#28A745]' : 'bg-[#DC3545]'} mr-2`}></span>
              <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button 
              onClick={toggleSettings}
              className="flex items-center p-1 hover:bg-primary-dark rounded-md transition-colors"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Video Feed and Settings */}
          <div className="lg:col-span-1">
            <VideoFeedPanel settings={currentSettings} />
            
            {showSettings && (
              <SettingsPanel 
                settings={currentSettings} 
                onClose={toggleSettings} 
              />
            )}
          </div>
          
          {/* Right Panel: Dashboard */}
          <div className="lg:col-span-2">
            <AnalyticsDashboard 
              captures={captures || []} 
              isLoading={isLoadingCaptures}
              onViewCaptureDetails={handleViewCaptureDetails}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E1E1E1] mt-auto">
        <div className="container mx-auto px-4 py-3 text-sm text-gray-600 flex justify-between items-center">
          <div>
            Crowd Analytics Dashboard v1.0
          </div>
          <div>
            <span className="mr-4">Using: Amazon Rekognition</span>
            <span>Status: <span className="text-[#28A745]">Online</span></span>
          </div>
        </div>
      </footer>

      {/* Capture Detail Modal */}
      {selectedCapture && (
        <CaptureDetailModal 
          capture={selectedCapture} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}
