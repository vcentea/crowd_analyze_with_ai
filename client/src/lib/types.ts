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
  timestamp: Date;
}

export interface CaptureResult extends AnalysisResult {
  id: number;
  rawData?: any;
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

export interface SettingsConfig {
  frameInterval: number;
  confidenceThreshold: number;
  enableAgeAnalysis: boolean;
  enableGenderAnalysis: boolean;
  enableEmotionAnalysis: boolean;
  autoCapture: boolean;
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
