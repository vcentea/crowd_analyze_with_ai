import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, Video, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useCamera from "@/hooks/useCamera";
import useFrameCapture from "@/hooks/useFrameCapture";
import { SettingsConfig } from "@/lib/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface VideoFeedPanelProps {
  settings: SettingsConfig;
}

export default function VideoFeedPanel({ settings }: VideoFeedPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [awsError, setAwsError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { 
    cameraState, 
    requestCameraPermission, 
    startCapture, 
    stopCapture 
  } = useCamera(videoRef);
  
  const {
    nextCaptureTime,
    lastAnalyzedTime,
    framesAnalyzed,
    isProcessing,
    captureFrame,
    lastError
  } = useFrameCapture(videoRef, settings);

  // Format the last analyzed time
  const formattedLastAnalyzedTime = lastAnalyzedTime 
    ? format(lastAnalyzedTime, "hh:mm:ss a") 
    : "None";
    
  // Check for AWS-specific errors
  useEffect(() => {
    if (lastError) {
      if (lastError.includes("AWS") || lastError.includes("Authentication failed")) {
        setAwsError(lastError);
      } else {
        setAwsError(null);
      }
    } else {
      setAwsError(null);
    }
  }, [lastError]);

  return (
    <Card className="bg-white rounded-lg shadow-md h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Live Feed</h2>
          <div className="flex">
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
                  onClick={() => cameraState.isCapturing ? stopCapture() : startCapture()}
                  className="text-primary hover:text-primary-dark p-1"
                >
                  {cameraState.isCapturing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center mb-4">
          <div className="relative bg-black rounded-md overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', width: '70%' }}>
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain" 
              autoPlay 
              muted 
              playsInline
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              Preview (Full resolution used for analysis)
            </div>

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
        </div>

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
