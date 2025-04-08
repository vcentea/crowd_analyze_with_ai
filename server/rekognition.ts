import { 
  RekognitionClient,
  DetectFacesCommand,
  FaceDetail,
  BoundingBox,
  Attribute
} from "@aws-sdk/client-rekognition";
import { SettingsConfig, DetectedFace, AnalysisResult } from "@/lib/types";
import { randomUUID } from "crypto";

// Initialize the AWS Rekognition client
const region = process.env.AWS_REGION === "Global Endpoint https://sts.amazonaws.com" 
  ? "us-east-1" // Default region if the global endpoint is incorrectly set
  : (process.env.AWS_REGION || "us-east-1");

const rekognition = new RekognitionClient({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  }
});

// Log AWS configuration for debugging (without exposing secrets)
console.log(`AWS Rekognition configured with region: ${region}`);
console.log(`Original AWS_REGION value: ${process.env.AWS_REGION || "not set"}`);
console.log(`AWS credentials available: ${!!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY}`);

/**
 * Analyzes an image using Amazon Rekognition
 * @param imageBuffer - The image buffer to analyze
 * @param settings - The analysis settings
 * @returns Analysis results including face detections and aggregated statistics
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  settings: SettingsConfig
): Promise<AnalysisResult> {
  try {
    // Prepare Rekognition parameters
    const params = {
      Image: {
        Bytes: imageBuffer
      },
      Attributes: getAttributesArray(settings)
    };
    
    // Call Rekognition to detect faces
    const command = new DetectFacesCommand(params);
    const response = await rekognition.send(command);
    
    // Process the faces
    const faces = processDetectedFaces(response.FaceDetails || [], settings);
    
    // Calculate aggregate statistics
    const stats = calculateStatistics(faces);
    
    return {
      ...stats,
      faces,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error analyzing image with Rekognition:", error);
    
    // Provide more specific error messages based on the type of error
    if (error instanceof Error) {
      if (error.name === 'AccessDeniedException' || error.name === 'UnrecognizedClientException') {
        throw new Error("Authentication failed with AWS. Please check your AWS credentials.");
      } else if (error.name === 'InvalidImageFormatException') {
        throw new Error("The image format is not supported by Rekognition.");
      } else if (error.name === 'ImageTooLargeException') {
        throw new Error("The image size exceeds the limit. Please try with a smaller image.");
      } else if (error.name === 'ResourceNotFoundException') {
        throw new Error("The requested AWS resource could not be found.");
      } else {
        throw new Error(`AWS Rekognition error: ${error.message}`);
      }
    }
    
    throw new Error("Failed to analyze image with facial recognition service");
  }
}

/**
 * Determines which attributes to request from Rekognition based on settings
 */
function getAttributesArray(settings: SettingsConfig): Attribute[] {
  // Always request all available attributes for comprehensive analysis
  return [
    "DEFAULT",
    "AGE_RANGE",
    "GENDER",
    "EMOTIONS",
    "SMILE",
    "EYEGLASSES",
    "SUNGLASSES",
    "BEARD",
    "MUSTACHE",
    "EYES_OPEN",
    "MOUTH_OPEN"
  ];
}

/**
 * Processes the face details returned by Rekognition
 * @param faceDetails - The face details from Rekognition
 * @param settings - The analysis settings
 * @returns Processed face details
 */
function processDetectedFaces(
  faceDetails: FaceDetail[],
  settings: SettingsConfig
): DetectedFace[] {
  return faceDetails
    .filter(face => {
      // Filter based on confidence threshold
      return (face.Confidence || 0) >= settings.confidenceThreshold;
    })
    .map(face => {
      // Map Rekognition face details to our DetectedFace format
      const detectedFace: DetectedFace = {
        id: randomUUID(),
        boundingBox: mapBoundingBox(face.BoundingBox),
        confidence: face.Confidence || 0,
      };
      
      // Always include all attributes from AWS regardless of settings
      // Age range
      if (face.AgeRange) {
        detectedFace.ageRange = {
          low: face.AgeRange.Low || 0,
          high: face.AgeRange.High || 0
        };
      }
      
      // Gender
      if (face.Gender) {
        detectedFace.gender = {
          value: face.Gender.Value || "Unknown",
          confidence: face.Gender.Confidence || 0
        };
      }
      
      // Emotions
      if (face.Emotions && face.Emotions.length > 0) {
        detectedFace.emotions = face.Emotions.map(emotion => ({
          type: emotion.Type || "UNKNOWN",
          confidence: emotion.Confidence || 0
        }));
      }
      
      // Add smile detection
      if (face.Smile) {
        detectedFace.smile = {
          value: face.Smile.Value || false,
          confidence: face.Smile.Confidence || 0
        };
      }
      
      // Add eyes open detection
      if (face.EyesOpen) {
        detectedFace.eyesOpen = {
          value: face.EyesOpen.Value || false,
          confidence: face.EyesOpen.Confidence || 0
        };
      }
      
      // Add mouth open detection
      if (face.MouthOpen) {
        detectedFace.mouthOpen = {
          value: face.MouthOpen.Value || false,
          confidence: face.MouthOpen.Confidence || 0
        };
      }
      
      // Add eyeglasses detection
      if (face.Eyeglasses) {
        detectedFace.eyeglasses = {
          value: face.Eyeglasses.Value || false,
          confidence: face.Eyeglasses.Confidence || 0
        };
      }
      
      // Add sunglasses detection
      if (face.Sunglasses) {
        detectedFace.sunglasses = {
          value: face.Sunglasses.Value || false,
          confidence: face.Sunglasses.Confidence || 0
        };
      }
      
      // Add beard detection
      if (face.Beard) {
        detectedFace.beard = {
          value: face.Beard.Value || false,
          confidence: face.Beard.Confidence || 0
        };
      }
      
      // Add mustache detection
      if (face.Mustache) {
        detectedFace.mustache = {
          value: face.Mustache.Value || false,
          confidence: face.Mustache.Confidence || 0
        };
      }
      
      // Add face pose information
      if (face.Pose) {
        detectedFace.pose = {
          roll: face.Pose.Roll || 0,
          yaw: face.Pose.Yaw || 0,
          pitch: face.Pose.Pitch || 0
        };
      }
      
      // Add face quality information
      if (face.Quality) {
        detectedFace.quality = {
          brightness: face.Quality.Brightness || 0,
          sharpness: face.Quality.Sharpness || 0
        };
      }
      
      return detectedFace;
    });
}

/**
 * Maps AWS Rekognition BoundingBox to our format
 */
function mapBoundingBox(box?: BoundingBox): DetectedFace["boundingBox"] {
  return {
    width: box?.Width || 0,
    height: box?.Height || 0,
    left: box?.Left || 0,
    top: box?.Top || 0
  };
}

/**
 * Calculates statistics from detected faces
 */
function calculateStatistics(faces: DetectedFace[]): Omit<AnalysisResult, "faces" | "timestamp"> {
  // Count the total number of people
  const peopleCount = faces.length;
  
  // Initialize statistics
  let totalAge = 0;
  let ageCount = 0;
  let maleCount = 0;
  let femaleCount = 0;
  
  // Emotion counting
  const emotionCounts: Record<string, number> = {};
  
  // Process each face
  faces.forEach(face => {
    // Calculate age statistics
    if (face.ageRange) {
      // Use the middle of the age range
      const avgAge = (face.ageRange.low + face.ageRange.high) / 2;
      totalAge += avgAge;
      ageCount++;
    }
    
    // Calculate gender statistics
    if (face.gender) {
      if (face.gender.value === "Male") {
        maleCount++;
      } else if (face.gender.value === "Female") {
        femaleCount++;
      }
    }
    
    // Calculate emotion statistics
    if (face.emotions && face.emotions.length > 0) {
      // Find the emotion with the highest confidence
      const primaryEmotion = face.emotions.reduce((prev, current) => 
        (current.confidence > prev.confidence) ? current : prev
      );
      
      const emotion = primaryEmotion.type;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  });
  
  // Calculate average age
  const averageAge = ageCount > 0 ? totalAge / ageCount : undefined;
  
  // Calculate gender percentages
  const totalGenderCount = maleCount + femaleCount;
  const malePercentage = totalGenderCount > 0 
    ? Math.round((maleCount / totalGenderCount) * 100) 
    : undefined;
    
  const femalePercentage = totalGenderCount > 0 
    ? Math.round((femaleCount / totalGenderCount) * 100)
    : undefined;
  
  // Find the primary emotion
  let primaryEmotion: string | undefined;
  let primaryEmotionCount = 0;
  let primaryEmotionPercentage: number | undefined;
  
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    if (count > primaryEmotionCount) {
      primaryEmotion = emotion;
      primaryEmotionCount = count;
    }
  });
  
  if (primaryEmotion && peopleCount > 0) {
    primaryEmotionPercentage = Math.round((primaryEmotionCount / peopleCount) * 100);
  }
  
  // Calculate a comprehensive engagement score using multiple facial attributes
  let engagementScore: number | undefined;
  
  if (peopleCount > 0) {
    // Initialize total engagement points and maximum possible points
    let totalEngagementPoints = 0;
    let maxPossiblePoints = peopleCount * 4; // 4 dimensions: emotion, eyes, pose, expression
    
    // Process each face for engagement metrics
    faces.forEach(face => {
      // 1. Emotion engagement: positive emotions indicate higher engagement
      if (face.emotions && face.emotions.length > 0) {
        const primaryEmotion = face.emotions.reduce((prevEmo, currentEmo) => 
          (currentEmo.confidence > prevEmo.confidence) ? currentEmo : prevEmo
        );
        
        // Positive emotions score higher
        const engagedEmotions = {
          "HAPPY": 1.0,
          "SURPRISED": 0.9,
          "CALM": 0.7,
          "CONFUSED": 0.6,
          "FEAR": 0.5,
          "SAD": 0.3,
          "ANGRY": 0.2,
          "DISGUSTED": 0.1
        };
        
        const emotionScore = engagedEmotions[primaryEmotion.type as keyof typeof engagedEmotions] || 0.5;
        totalEngagementPoints += emotionScore;
      }
      
      // 2. Visual attention: eyes open indicates attention
      if (face.eyesOpen) {
        totalEngagementPoints += face.eyesOpen.value ? 1.0 : 0.0;
      }
      
      // 3. Pose assessment: facing forward (low yaw/pitch/roll values) indicates engagement
      if (face.pose) {
        // Convert yaw, pitch, roll to a normalized engagement score (0-1)
        // Lower absolute values of pose angles indicate better engagement
        const yawFactor = Math.max(0, 1 - Math.abs(face.pose.yaw) / 45);
        const pitchFactor = Math.max(0, 1 - Math.abs(face.pose.pitch) / 45);
        const rollFactor = Math.max(0, 1 - Math.abs(face.pose.roll) / 45);
        
        // Average the pose factors
        const poseScore = (yawFactor + pitchFactor + rollFactor) / 3;
        totalEngagementPoints += poseScore;
      }
      
      // 4. Expression intensity: smile and mouth movements indicate engagement
      let expressionScore = 0;
      if (face.smile && face.smile.value) {
        expressionScore += 0.7;
      }
      if (face.mouthOpen && face.mouthOpen.value) {
        expressionScore += 0.3;
      }
      totalEngagementPoints += expressionScore;
    });
    
    // Calculate final percentage score
    engagementScore = Math.round((totalEngagementPoints / maxPossiblePoints) * 100);
    
    // Calculate attention time based on engagement score
    let attentionTime: number | null = null;
    
    try {
      // Calculate estimated attention time for each face based on engagement factors
      const faceAttentionTimes: number[] = faces.map(face => {
        let attentionScore = 0;
        
        // Eyes open is critical for attention
        if (face.eyesOpen?.value) {
          attentionScore += 2.0;
        }
        
        // Emotional engagement affects attention duration
        if (face.emotions && face.emotions.length > 0) {
          const primaryEmotion = face.emotions.reduce((prevEmotion, currentEmotion) => 
            (currentEmotion.confidence > prevEmotion.confidence) ? currentEmotion : prevEmotion
          );
          
          // Weight by emotion type and confidence
          const emotionWeight = primaryEmotion.confidence / 100;
          
          if (['HAPPY', 'SURPRISED'].includes(primaryEmotion.type)) {
            attentionScore += 1.5 * emotionWeight;
          } else if (['CALM'].includes(primaryEmotion.type)) {
            attentionScore += 1.0 * emotionWeight;
          }
        }
        
        // Facing camera increases attention
        if (face.pose) {
          const yawFactor = Math.max(0, 1 - Math.abs(face.pose.yaw) / 45);
          attentionScore += yawFactor * 1.5;
        }
        
        // Map score to seconds (0-5 range)
        const normalizedScore = Math.max(0, Math.min(5, attentionScore));
        
        return normalizedScore;
      });
      
      // Calculate average attention time (if any faces detected)
      if (faceAttentionTimes.length > 0) {
        const totalAttention = faceAttentionTimes.reduce((sum, time) => sum + time, 0);
        attentionTime = Math.round((totalAttention / faceAttentionTimes.length) * 10) / 10; // Round to 1 decimal
      }
      
      console.log(`AWS Rekognition: Engagement score ${engagementScore}%, Attention time ${attentionTime || 0}s`);
    } catch (error) {
      console.error("Error calculating attention time:", error);
    }
  }
  
  // Return the statistics object with attentionTime included
  return {
    peopleCount,
    averageAge,
    malePercentage,
    femalePercentage,
    primaryEmotion,
    primaryEmotionPercentage,
    engagementScore,
    attentionTime
  };
}
