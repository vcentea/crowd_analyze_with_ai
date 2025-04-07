import { DetectedFace } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  AlertTriangle, 
  Award, 
  Cpu,
  Glasses, 
  Smile, 
  Eye, 
  Frown,
  Meh, 
  Rotate3D
} from "lucide-react";

interface FaceAttributesPanelProps {
  face: DetectedFace;
  faceIndex: number;
}

export default function FaceAttributesPanel({ 
  face,
  faceIndex
}: FaceAttributesPanelProps) {
  
  // Helper function to format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence)}%`;
  };
  
  // Get primary emotion
  const getPrimaryEmotion = () => {
    if (!face.emotions || face.emotions.length === 0) return { type: "Unknown", confidence: 0 };
    return face.emotions.reduce((prev, current) => 
      (current.confidence > prev.confidence) ? current : prev
    );
  };
  
  const primaryEmotion = getPrimaryEmotion();
  
  // Get emotion icon based on type
  const getEmotionIcon = (type: string) => {
    switch(type.toUpperCase()) {
      case 'HAPPY': return <Smile className="h-5 w-5 text-green-500" />;
      case 'CALM': return <Meh className="h-5 w-5 text-blue-500" />;
      case 'SAD': return <Frown className="h-5 w-5 text-yellow-500" />;
      case 'ANGRY': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'CONFUSED': return <Rotate3D className="h-5 w-5 text-purple-500" />;
      case 'DISGUSTED': return <Frown className="h-5 w-5 text-gray-500" />;
      case 'SURPRISED': return <Activity className="h-5 w-5 text-cyan-500" />;
      case 'FEAR': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <Meh className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Calculate engagement score for this individual face
  const calculateFaceEngagement = (): number => {
    let score = 0;
    let maxPoints = 0;
    
    // Emotion factor (0-1)
    if (face.emotions && face.emotions.length > 0) {
      const emotionMap: Record<string, number> = {
        "HAPPY": 1.0,
        "SURPRISED": 0.9,
        "CALM": 0.7,
        "CONFUSED": 0.6,
        "FEAR": 0.5,
        "SAD": 0.3,
        "ANGRY": 0.2,
        "DISGUSTED": 0.1
      };
      
      score += emotionMap[primaryEmotion.type] || 0.5;
      maxPoints += 1;
    }
    
    // Visual attention - eyes open
    if (face.eyesOpen) {
      score += face.eyesOpen.value ? 1.0 : 0.0;
      maxPoints += 1;
    }
    
    // Pose assessment
    if (face.pose) {
      const yawFactor = Math.max(0, 1 - Math.abs(face.pose.yaw) / 45);
      const pitchFactor = Math.max(0, 1 - Math.abs(face.pose.pitch) / 45);
      const rollFactor = Math.max(0, 1 - Math.abs(face.pose.roll) / 45);
      
      score += (yawFactor + pitchFactor + rollFactor) / 3;
      maxPoints += 1;
    }
    
    // Expression
    let expressionScore = 0;
    if (face.smile && face.smile.value) {
      expressionScore += 0.7;
    }
    if (face.mouthOpen && face.mouthOpen.value) {
      expressionScore += 0.3;
    }
    score += expressionScore;
    maxPoints += 1;
    
    // Calculate percentage
    return maxPoints > 0 ? Math.round((score / maxPoints) * 100) : 0;
  };
  
  const engagementScore = calculateFaceEngagement();
  
  // Determine engagement level
  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { text: "High", color: "bg-green-500" };
    if (score >= 50) return { text: "Medium", color: "bg-yellow-500" };
    return { text: "Low", color: "bg-red-500" };
  };
  
  const engagementLevel = getEngagementLevel(engagementScore);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Face #{faceIndex + 1}</span>
          <Badge className={`${engagementLevel.color} text-white`}>
            {engagementLevel.text} Engagement
          </Badge>
        </CardTitle>
        <CardDescription>
          Confidence: {formatConfidence(face.confidence)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age Information */}
          {face.ageRange && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Age Range</h4>
              <p className="text-xl font-bold">{face.ageRange.low} - {face.ageRange.high} years</p>
            </div>
          )}
          
          {/* Gender Information */}
          {face.gender && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Gender</h4>
              <p className="text-xl font-bold flex items-center gap-2">
                {face.gender.value} 
                <span className="text-sm font-normal text-gray-500">
                  ({formatConfidence(face.gender.confidence)})
                </span>
              </p>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Emotions Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Primary Emotion</h4>
          <div className="flex items-center gap-2">
            {getEmotionIcon(primaryEmotion.type)}
            <span className="text-lg font-semibold">{primaryEmotion.type}</span>
            <span className="text-sm text-gray-500">
              ({formatConfidence(primaryEmotion.confidence)})
            </span>
          </div>
          
          {/* All Emotions */}
          {face.emotions && face.emotions.length > 1 && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium">All Detected Emotions</h4>
              <div className="flex flex-wrap gap-2">
                {face.emotions
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((emotion, i) => (
                    <Badge 
                      key={i} 
                      variant={i === 0 ? "default" : "outline"}
                      className="flex items-center gap-1"
                    >
                      {emotion.type} ({formatConfidence(emotion.confidence)})
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Face Attributes Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Face Attributes</h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Smile */}
            {face.smile && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Smile className="h-4 w-4" /> Smile
                  </span>
                  <span className="text-xs">
                    {face.smile.value ? "Yes" : "No"} 
                    ({formatConfidence(face.smile.confidence)})
                  </span>
                </div>
                <Progress value={face.smile.confidence} className="h-2" />
              </div>
            )}
            
            {/* Eyes Open */}
            {face.eyesOpen && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Eye className="h-4 w-4" /> Eyes Open
                  </span>
                  <span className="text-xs">
                    {face.eyesOpen.value ? "Yes" : "No"} 
                    ({formatConfidence(face.eyesOpen.confidence)})
                  </span>
                </div>
                <Progress value={face.eyesOpen.confidence} className="h-2" />
              </div>
            )}
            
            {/* Mouth Open */}
            {face.mouthOpen && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Meh className="h-4 w-4" /> Mouth Open
                  </span>
                  <span className="text-xs">
                    {face.mouthOpen.value ? "Yes" : "No"} 
                    ({formatConfidence(face.mouthOpen.confidence)})
                  </span>
                </div>
                <Progress value={face.mouthOpen.confidence} className="h-2" />
              </div>
            )}
            
            {/* Eyeglasses */}
            {face.eyeglasses && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Glasses className="h-4 w-4" /> Glasses
                  </span>
                  <span className="text-xs">
                    {face.eyeglasses.value ? "Yes" : "No"} 
                    ({formatConfidence(face.eyeglasses.confidence)})
                  </span>
                </div>
                <Progress value={face.eyeglasses.confidence} className="h-2" />
              </div>
            )}
            
            {/* Sunglasses */}
            {face.sunglasses && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Glasses className="h-4 w-4" /> Sunglasses
                  </span>
                  <span className="text-xs">
                    {face.sunglasses.value ? "Yes" : "No"} 
                    ({formatConfidence(face.sunglasses.confidence)})
                  </span>
                </div>
                <Progress value={face.sunglasses.confidence} className="h-2" />
              </div>
            )}
            
            {/* Beard */}
            {face.beard && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Award className="h-4 w-4" /> Beard
                  </span>
                  <span className="text-xs">
                    {face.beard.value ? "Yes" : "No"} 
                    ({formatConfidence(face.beard.confidence)})
                  </span>
                </div>
                <Progress value={face.beard.confidence} className="h-2" />
              </div>
            )}
            
            {/* Mustache */}
            {face.mustache && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Award className="h-4 w-4" /> Mustache
                  </span>
                  <span className="text-xs">
                    {face.mustache.value ? "Yes" : "No"} 
                    ({formatConfidence(face.mustache.confidence)})
                  </span>
                </div>
                <Progress value={face.mustache.confidence} className="h-2" />
              </div>
            )}
          </div>
        </div>
        
        {/* Face Pose Section */}
        {face.pose && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Rotate3D className="h-4 w-4" /> Face Pose
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-xs">Yaw (side-to-side)</span>
                  <p className="font-medium">{face.pose.yaw.toFixed(1)}°</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs">Pitch (up-down)</span>
                  <p className="font-medium">{face.pose.pitch.toFixed(1)}°</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs">Roll (tilt)</span>
                  <p className="font-medium">{face.pose.roll.toFixed(1)}°</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Image Quality Section */}
        {face.quality && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Cpu className="h-4 w-4" /> Image Quality
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs">Brightness</span>
                  <Progress value={face.quality.brightness} className="h-2" />
                  <p className="text-xs text-right">{face.quality.brightness.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs">Sharpness</span>
                  <Progress value={face.quality.sharpness} className="h-2" />
                  <p className="text-xs text-right">{face.quality.sharpness.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Engagement Score */}
        <Separator className="my-4" />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Engagement Score</h4>
            <span className="font-bold">{engagementScore}%</span>
          </div>
          <Progress value={engagementScore} className="h-3" />
        </div>
      </CardContent>
    </Card>
  );
}