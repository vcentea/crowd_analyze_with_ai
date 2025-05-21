import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, Video, AlertTriangle, RefreshCw, Clock, AlertCircle, Timer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useCamera from "@/hooks/useCamera";
import useFrameCapture from "@/hooks/useFrameCapture";
import { SettingsConfig, ApiUsageData } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Default auto-stop timeout in minutes (fallback if env variable is missing)
const DEFAULT_AUTO_STOP_TIMEOUT = 1;

interface VideoFeedPanelProps {
  settings: SettingsConfig;
}

export default function VideoFeedPanel({ settings }: VideoFeedPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [awsError, setAwsError] = useState<string | null>(null);
  const [apiLimitError, setApiLimitError] = useState<{message: string, resetDate: string} | null>(null);
  const [autoStopTimer, setAutoStopTimer] = useState<number | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Get auto-stop timeout from settings or environment variable (in minutes)
  const autoStopTimeoutMinutes = 
    settings.autoStopTimeoutMinutes || 
    Number(import.meta.env.VITE_AUTO_STOP_TIMEOUT_MINUTES) || 
    DEFAULT_AUTO_STOP_TIMEOUT;
  
  // Fetch usage data to check for limits
  const { data: apiUsage } = useQuery<ApiUsageData>({
    queryKey: ["/api/usage"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const { 
    cameraState, 
    requestCameraPermission, 
    startCapture, 
    stopCapture,
    devices,
    selectedDeviceId,
    selectCamera
  } = useCamera(videoRef);
  
  const {
    nextCaptureTime,
    lastAnalyzedTime,
    framesAnalyzed,
    isProcessing,
    captureFrame,
    lastError
  } = useFrameCapture(videoRef, settings, cameraState.isCapturing);

  // Format the last analyzed time
  const formattedLastAnalyzedTime = lastAnalyzedTime 
    ? format(lastAnalyzedTime, "hh:mm:ss a") 
    : "None";
    
  // Check for errors
  useEffect(() => {
    if (lastError) {
      // Check for API limit errors
      if (lastError.includes("limit reached") || lastError.includes("rate limit exceeded")) {
        const match = lastError.match(/resetDate: (\d{1,2}\/\d{1,2}\/\d{4})/);
        const resetDate = match ? match[1] : "next billing cycle";
        setApiLimitError({ 
          message: lastError,
          resetDate: resetDate
        });
        setAwsError(null);
      } 
      // Check for AWS credential errors
      else if (lastError.includes("AWS") || lastError.includes("Authentication failed")) {
        setAwsError(lastError);
        setApiLimitError(null);
      } else {
        setAwsError(null);
        setApiLimitError(null);
      }
    } else {
      setAwsError(null);
      setApiLimitError(null);
    }
  }, [lastError]);

  // Also check API usage data for limits
  useEffect(() => {
    if (apiUsage) {
      // Check if current API provider has reached its limit
      const currentProvider = settings.apiProvider;
      if (currentProvider === 'aws' && apiUsage.aws.reachedLimit) {
        const resetDate = format(new Date(apiUsage.aws.resetDate), 'MM/dd/yyyy');
        
        setApiLimitError({
          message: `AWS Rekognition monthly limit has been reached.`,
          resetDate
        });
        
        // If capturing, stop capture
        if (cameraState.isCapturing) {
          stopCapture();
        }
      } else if (currentProvider === 'facepp' && apiUsage.facepp.reachedLimit) {
        const resetDate = format(new Date(apiUsage.facepp.resetDate), 'MM/dd/yyyy');
        
        setApiLimitError({
          message: `Face++ API monthly limit or rate limit has been reached.`,
          resetDate
        });
        
        // If capturing, stop capture
        if (cameraState.isCapturing) {
          stopCapture();
        }
      }
    }
  }, [apiUsage, settings.apiProvider, cameraState.isCapturing, stopCapture]);

  // Handle auto-stop timer
  useEffect(() => {
    // Clean up any existing timer when component unmounts
    return () => {
      if (autoStopTimerRef.current) {
        clearInterval(autoStopTimerRef.current);
      }
    };
  }, []);

  // Start or stop the auto-stop timer based on capturing state
  useEffect(() => {
    if (cameraState.isCapturing) {
      // Start the auto-stop timer when capturing begins
      const totalSeconds = autoStopTimeoutMinutes * 60;
      setAutoStopTimer(totalSeconds);
      
      // Clear any existing timer
      if (autoStopTimerRef.current) {
        clearInterval(autoStopTimerRef.current);
      }
      
      // Start countdown
      autoStopTimerRef.current = setInterval(() => {
        setAutoStopTimer(prev => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          } else {
            // Auto-stop when timer reaches zero
            stopCapture();
            
            // Show notification
            toast({
              title: "Auto-stop activated",
              description: `Capture stopped automatically after ${autoStopTimeoutMinutes} ${
                autoStopTimeoutMinutes === 1 ? 'minute' : 'minutes'
              } to save API calls.`,
            });
            
            // Clear the interval
            if (autoStopTimerRef.current) {
              clearInterval(autoStopTimerRef.current);
              autoStopTimerRef.current = null;
            }
            return null;
          }
        });
      }, 1000);
    } else {
      // Clear timer when capturing stops
      if (autoStopTimerRef.current) {
        clearInterval(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      setAutoStopTimer(null);
    }
  }, [cameraState.isCapturing, autoStopTimeoutMinutes, stopCapture, toast]);

  const handleCaptureToggle = () => {
    // Don't allow capturing if API limit is reached
    if (apiLimitError) {
      toast({
        title: "Cannot start capture",
        description: `API limit reached. Service will reset on ${apiLimitError.resetDate}.`,
        variant: "destructive"
      });
      return;
    }

    if (cameraState.isEnabled) {
      cameraState.isCapturing ? stopCapture() : startCapture();
    } else {
      toast({
        title: "Camera is not enabled",
        description: "Please enable the camera to start capturing."
      });
    }
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white rounded-lg shadow-md h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Live Feed</h2>
          <div className="flex items-center">
            {/* Camera Picker */}
            <select
              className="mr-4 border rounded px-2 py-1 text-sm"
              value={selectedDeviceId || ""}
              onChange={e => selectCamera(e.target.value || null)}
            >
              <option value="">None</option>
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || device.deviceId}
                </option>
              ))}
            </select>
            {cameraState.isEnabled && (
              <>
                {cameraState.isCapturing && (
                  <div className="flex items-center text-sm mr-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#28A745] animate-pulse mr-1"></span>
                    <span>Capturing</span>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCaptureToggle}
                  className="text-primary hover:text-primary-dark p-1"
                  disabled={!!apiLimitError}
                >
                  {cameraState.isCapturing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={stopCapture}
                  className="text-primary hover:text-primary-dark p-1 ml-2"
                >
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative bg-black rounded-md overflow-hidden flex items-center justify-center mb-4 mx-auto" style={{ aspectRatio: '16/9', width: '50%' }}>
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain" 
            autoPlay 
            muted 
            playsInline
          />
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            Preview (Full resolution for API)
          </div>

          {/* Auto-stop timer display */}
          {autoStopTimer !== null && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
              <Timer className="h-3 w-3 mr-1" />
              <span>Auto-stop: {formatTime(autoStopTimer)}</span>
            </div>
          )}

          {/* Camera permission overlay */}
          {!cameraState.isEnabled && (
            <div className="absolute inset-0 bg-[#323130] bg-opacity-90 flex flex-col items-center justify-center p-6 text-white">
              <Video className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-medium mb-2">Camera Access Required</h3>
              <p className="text-center mb-4">This application needs camera access to analyze crowd demographics.</p>
              <Button 
                onClick={requestCameraPermission} 
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2"
              >
                Enable Camera
              </Button>
              {cameraState.error && (
                <p className="mt-3 text-[#DC3545] text-sm">{cameraState.error}</p>
              )}
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-[#323130] bg-opacity-70 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin mb-2 h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p>Processing frame...</p>
              </div>
            </div>
          )}
        </div>

        {/* API limit error alert */}
        {apiLimitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Usage Limit Reached</AlertTitle>
            <AlertDescription>
              <p>{apiLimitError.message}</p>
              <div className="mt-2 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Service will reset on: {apiLimitError.resetDate}</span>
              </div>
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    // Open settings to switch API provider
                    toast({
                      title: "Try switching API provider",
                      description: "You can switch to another API provider in the settings."
                    });
                  }}
                >
                  Switch API Provider
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-stop timeout notice */}
        <Alert className="mb-4">
          <Clock className="h-4 w-4" />
          <AlertTitle>Auto-stop Enabled</AlertTitle>
          <AlertDescription>
            To save API usage, capture will automatically stop after {autoStopTimeoutMinutes} {autoStopTimeoutMinutes === 1 ? 'minute' : 'minutes'}.
          </AlertDescription>
        </Alert>

        {/* AWS credentials alert */}
        {awsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>AWS Configuration Error</AlertTitle>
            <AlertDescription>
              {awsError}
              <div className="mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Capture metadata */}
        <div className="mt-2 text-sm text-[#323130] font-mono">
          <div className="flex justify-between items-center">
            <span>Next capture in:</span>
            <span>{typeof nextCaptureTime === 'number' ? `${nextCaptureTime}s` : 'Paused'}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span>Last analyzed:</span>
            <span>{formattedLastAnalyzedTime}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span>Frames analyzed:</span>
            <span>{framesAnalyzed}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
