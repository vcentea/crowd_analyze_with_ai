import { useState, useRef, useEffect, useCallback } from "react";

export interface CameraState {
  isEnabled: boolean;
  isCapturing: boolean;
  error: string | null;
}

export default function useCamera(videoRef: React.RefObject<HTMLVideoElement>) {
  const [cameraState, setCameraState] = useState<CameraState>({
    isEnabled: false,
    isCapturing: false,
    error: null,
  });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Enumerate video input devices on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devs => {
        const videoInputs = devs.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs as MediaDeviceInfo[]);
      })
      .catch(() => {});
  }, []);
  
  // Clean up the camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const requestCameraPermission = useCallback(async () => {
    try {
      setCameraState(prev => ({ ...prev, error: null }));
      const videoConstraints: any = {
        width: { min: 1280, ideal: 1920 },
        height: { min: 720, ideal: 1080 },
        aspectRatio: { ideal: 16/9 }
      };
      if (selectedDeviceId) {
        videoConstraints.deviceId = { exact: selectedDeviceId };
      } else {
        videoConstraints.facingMode = 'user';
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      
      setCameraState(prev => ({ 
        ...prev, 
        isEnabled: true,
      }));
      
      return true;
    } catch (error: any) {
      let errorMessage = "Failed to access camera";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add more context for common errors
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access was denied. Please allow camera access in your browser settings.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera was found on your device.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        }
      }
      
      setCameraState(prev => ({ 
        ...prev, 
        isEnabled: false,
        error: errorMessage
      }));
      
      return false;
    }
  }, [selectedDeviceId, videoRef, setCameraState]); // videoRef and setCameraState are stable
  
  const selectCamera = useCallback(async (deviceId: string | null) => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraState({ isEnabled: false, isCapturing: false, error: null });
    setSelectedDeviceId(deviceId);
    if (deviceId) {
      await requestCameraPermission();
    }
  }, [requestCameraPermission, streamRef, setCameraState, setSelectedDeviceId]); // streamRef, setCameraState, setSelectedDeviceId are stable
  
  const startCapture = useCallback(() => {
    if (!cameraState.isEnabled) {
      // Attempt to get permission, then start capture if successful
      requestCameraPermission().then(success => {
        if (success) {
          setCameraState(prev => ({ ...prev, isCapturing: true, isEnabled: true }));
        }
      });
    } else {
      setCameraState(prev => ({ ...prev, isCapturing: true }));
    }
  }, [cameraState.isEnabled, requestCameraPermission, setCameraState]);
  
  const stopCapture = useCallback(() => {
    setCameraState(prev => ({ ...prev, isCapturing: false }));
  }, [setCameraState]);
  
  return {
    cameraState,
    requestCameraPermission,
    startCapture,
    stopCapture,
    devices,
    selectedDeviceId,
    selectCamera
  };
}
