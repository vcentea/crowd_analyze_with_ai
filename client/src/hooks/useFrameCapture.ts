import { useState, useRef, useEffect } from "react";
import { SettingsConfig, AnalysisResult } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function useFrameCapture(
  videoRef: React.RefObject<HTMLVideoElement>,
  settings: SettingsConfig,
  isCapturing: boolean
) {
  const [nextCaptureTime, setNextCaptureTime] = useState<number | null>(null);
  const [lastAnalyzedTime, setLastAnalyzedTime] = useState<Date | null>(null);
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
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
      // Clear any previous errors on success
      setLastError(null);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to analyze the image";
      
      // Store the error message
      setLastError(errorMessage);
      
      toast({
        title: "Analysis error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  
  // Capture a frame from the video feed
  const captureFrame = async () => {
    if (!videoRef.current || !isCapturing) {
      return;
    }
    
    // Check if video has enough data to capture
    if (videoRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return;
    }
    
    try {
      setIsProcessingFrame(true);
      
      // Create a canvas to capture the frame
      const canvas = document.createElement("canvas");
      // Use full resolution as requested
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      // Draw the video frame to the canvas at full resolution
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Get the image data as a base64 string with high quality
      const imageData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Send the image data to the server for analysis
      await analyzeMutation.mutateAsync(imageData);
      
      // Update state
      setLastAnalyzedTime(new Date());
      setFramesAnalyzed(prev => prev + 1);
      
    } catch (error) {
      console.error("Error capturing frame:", error);
      
      let errorMessage = "Failed to capture or process the frame";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "Capture error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingFrame(false);
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
          if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Effect to handle auto-capturing based on settings
  useEffect(() => {
    // Function to clear intervals
    const cleanupIntervals = () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setNextCaptureTime(null);
    };

    // Only run if auto-capture is enabled AND isCapturing is true
    if (settings.autoCapture && isCapturing) {
      cleanupIntervals(); // Clear previous intervals before starting new ones
      
      // Start a new capture interval
      captureIntervalRef.current = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          captureFrame(); // captureFrame already checks for isCapturing
          startCountdown(settings.frameInterval);
        }
      }, settings.frameInterval * 1000);
      
      // Initial countdown
      startCountdown(settings.frameInterval);
      
      // Clean up on unmount or when settings/isCapturing change
      return cleanupIntervals;
    } else {
      // Clean up intervals if auto-capture is disabled or isCapturing is false
      cleanupIntervals();
    }
  }, [settings.autoCapture, settings.frameInterval, isCapturing, videoRef]); // Added isCapturing and videoRef to dependencies
  
  return {
    nextCaptureTime,
    lastAnalyzedTime,
    framesAnalyzed,
    isProcessing: isProcessingFrame, // Use the renamed state variable
    lastError,
    captureFrame // Expose captureFrame if manual capture is needed elsewhere
  };
}
