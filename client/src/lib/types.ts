export interface AgeRange {
  low: number;
  high: number;
}

export interface BoundingBox {
  width: number;
  height: number;
  left: number;
  top: number;
}

export interface DetectedFace {
  id: string;
  boundingBox: BoundingBox;
  confidence: number;
  ageRange?: AgeRange;
  gender?: {
    value: string;
    confidence: number;
  };
  emotions?: Array<{
    type: string;
    confidence: number;
  }>;
  smile?: {
    value: boolean;
    confidence: number;
  };
  eyesOpen?: {
    value: boolean;
    confidence: number;
  };
  mouthOpen?: {
    value: boolean;
    confidence: number;
  };
  eyeglasses?: {
    value: boolean;
    confidence: number;
  };
  sunglasses?: {
    value: boolean;
    confidence: number;
  };
  beard?: {
    value: boolean;
    confidence: number;
  };
  mustache?: {
    value: boolean;
    confidence: number;
  };
  pose?: {
    roll: number;
    yaw: number;
    pitch: number;
  };
  quality?: {
    brightness: number;
    sharpness: number;
  };
}

export interface AnalysisResult {
  faces: DetectedFace[];
  peopleCount: number;
  averageAge?: number;
  malePercentage?: number;
  femalePercentage?: number;
  primaryEmotion?: string;
  primaryEmotionPercentage?: number;
  engagementScore?: number;
  attentionTime?: number; // Average attention time in seconds
  timestamp: Date;
  rawData?: any; // Added to support storing API raw responses
}

export interface CaptureResult extends AnalysisResult {
  id: number;
}

export interface AgeDistribution {
  label: string;
  count: number;
}

export interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number;
}

export interface EmotionDistribution {
  emotion: string;
  count: number;
  percentage: number;
}

export interface TimelineDataPoint {
  time: string;
  count: number;
}

export type ApiProvider = 'aws' | 'facepp';

export interface SettingsConfig {
  frameInterval: number;
  confidenceThreshold: number;
  enableAgeAnalysis: boolean;
  enableGenderAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  autoCapture: boolean;
  apiProvider: ApiProvider;
}

export interface CameraState {
  isEnabled: boolean;
  isCapturing: boolean;
  error: string | null;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  changeDirection?: 'up' | 'down';
}
