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
  const attributes: Attribute[] = ["DEFAULT"];
  
  if (settings.enableAgeAnalysis) {
    attributes.push("AGE_RANGE");
  }
  
  if (settings.enableGenderAnalysis) {
    attributes.push("GENDER");
  }
  
  if (settings.enableEmotionAnalysis) {
    attributes.push("EMOTIONS");
  }
  
  return attributes;
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
      
      // Add age range if enabled and available
      if (settings.enableAgeAnalysis && face.AgeRange) {
        detectedFace.ageRange = {
          low: face.AgeRange.Low || 0,
          high: face.AgeRange.High || 0
        };
      }
      
      // Add gender if enabled and available
      if (settings.enableGenderAnalysis && face.Gender) {
        detectedFace.gender = {
          value: face.Gender.Value || "Unknown",
          confidence: face.Gender.Confidence || 0
        };
      }
      
      // Add emotions if enabled and available
      if (settings.enableEmotionAnalysis && face.Emotions && face.Emotions.length > 0) {
        detectedFace.emotions = face.Emotions.map(emotion => ({
          type: emotion.Type || "UNKNOWN",
          confidence: emotion.Confidence || 0
        }));
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
  
  // Calculate a simple engagement score (example: percentage of happy or surprised faces)
  let engagementScore: number | undefined;
  
  if (peopleCount > 0) {
    const engagedEmotions = ["HAPPY", "SURPRISED", "CALM"];
    const engagedCount = engagedEmotions.reduce((count, emotion) => {
      return count + (emotionCounts[emotion] || 0);
    }, 0);
    
    engagementScore = Math.round((engagedCount / peopleCount) * 100);
  }
  
  return {
    peopleCount,
    averageAge,
    malePercentage,
    femalePercentage,
    primaryEmotion,
    primaryEmotionPercentage,
    engagementScore
  };
}
