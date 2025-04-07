import { useState, useRef, useEffect } from "react";
import { SettingsConfig, AnalysisResult } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement>,
  settings: SettingsConfig
) {
  const [nextCaptureTime, setNextCaptureTime] = useState<number | null>(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<Date | null>(null);
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Mutation for sending captured frames to the server
  const analyzeMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const res = await apiRequest("POST", "/api/analyze", { imageData });
      return res.json() as Promise<AnalysisResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/captures"] });
    },
    onError: (error) => {
      toast({
        title: "Analysis error",
        description: error.message || "Failed to analyze the image",
        variant: "destructive",
      });
    }
  });
  
  // Capture a frame from the video feed
  const captureFrame = async () => {
    if (!videoRef.current || !videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create a canvas to capture the frame
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Draw the video frame to the canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Get the image data as a base64 string
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      
      // Send the image data to the server for analysis
      await analyzeMutation.mutateAsync(imageData);
      
      // Update state
      setLastAnalyzedTime(new Date());
      setFramesAnalyzed(prev => prev + 1);
      
    } catch (error) {
      console.error("Error capturing frame:", error);
      
      toast({
        title: "Capture error",
        description: "Failed to capture or process the frame",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Start a countdown timer for the next capture
  const startCountdown = (seconds: number) => {
    setNextCaptureTime(seconds);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setNextCaptureTime(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Effect to handle auto-capturing based on settings
  useEffect(() => {
    // Only run if auto-capture is enabled
    if (settings.autoCapture) {
      // Clear any existing intervals
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      
      // Start a new capture interval
      captureIntervalRef.current = setInterval(() => {
        captureFrame();
        startCountdown(settings.frameInterval);
      }, settings.frameInterval * 1000);
      
      // Initial countdown
      startCountdown(settings.frameInterval);
      
      // Clean up on unmount or when settings change
      return () => {
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    } else {
      // Clean up intervals if auto-capture is disabled
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setNextCaptureTime(null);
    }
  }, [settings.autoCapture, settings.frameInterval]);
  
  return {
    nextCaptureTime,
    lastAnalyzedTime,
    framesAnalyzed,
    isProcessing,
    captureFrame
  };
}
