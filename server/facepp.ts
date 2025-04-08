/**
 * Face++ API integration for facial analysis
 */
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisResult, SettingsConfig, DetectedFace, AgeRange, BoundingBox } from '../client/src/lib/types';

const FACEPP_API_URL = 'https://api-us.faceplusplus.com/facepp/v3/detect';

interface FacePlusPlusFaceAttributes {
  smile: {
    value: number;
    threshold: number;
  };
  headpose: {
    pitch_angle: number;
    roll_angle: number;
    yaw_angle: number;
  };
  gender: {
    value: string;
  };
  age: {
    value: number;
  };
  emotion: {
    anger: number;
    disgust: number;
    fear: number;
    happiness: number;
    neutral: number;
    sadness: number;
    surprise: number;
  };
  beauty: {
    female_score: number;
    male_score: number;
  };
  eyestatus: {
    left_eye_status: {
      normal_glass_eye_open: number;
      no_glass_eye_close: number;
      occlusion: number;
      no_glass_eye_open: number;
      normal_glass_eye_close: number;
      dark_glasses: number;
    };
    right_eye_status: {
      normal_glass_eye_open: number;
      no_glass_eye_close: number;
      occlusion: number;
      no_glass_eye_open: number;
      normal_glass_eye_close: number;
      dark_glasses: number;
    };
  };
  eyegaze: {
    right_eye_gaze: {
      position_x_coordinate: number;
      position_y_coordinate: number;
      vector_x_component: number;
      vector_y_component: number;
      vector_z_component: number;
    };
    left_eye_gaze: {
      position_x_coordinate: number;
      position_y_coordinate: number;
      vector_x_component: number;
      vector_y_component: number;
      vector_z_component: number;
    };
  };
  mouthstatus: {
    surgical_mask_or_respirator: number;
    other_occlusion: number;
    close: number;
    open: number;
  };
  glass: {
    value: string;
  };
}

interface FacePlusPlusFace {
  face_token: string;
  face_rectangle: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  attributes: FacePlusPlusFaceAttributes;
}

interface FacePlusPlusResponse {
  faces: FacePlusPlusFace[];
  image_id: string;
  request_id: string;
  time_used: number;
}

/**
 * Analyzes an image using Face++ API
 * @param imageBuffer - The image buffer to analyze
 * @param settings - The analysis settings
 * @returns Analysis results including face detections and aggregated statistics
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  settings: SettingsConfig
): Promise<AnalysisResult> {
  try {
    const apiKey = process.env.FACEPP_API_KEY;
    const apiSecret = process.env.FACEPP_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Face++ API credentials not found. Please set FACEPP_API_KEY and FACEPP_API_SECRET environment variables.');
    }

    // Prepare form data for Face++ API
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('api_secret', apiSecret);
    formData.append('image_base64', imageBuffer.toString('base64'));
    
    // Build return_attributes string based on settings
    const returnAttributes = getAttributesArray(settings);
    formData.append('return_attributes', returnAttributes.join(','));
    
    // Set confidence threshold
    formData.append('threshold', settings.confidenceThreshold / 100);

    // Call Face++ API
    const response = await axios.post<FacePlusPlusResponse>(FACEPP_API_URL, formData, {
      headers: formData.getHeaders(),
    });

    // Process detected faces
    const detectedFaces = processDetectedFaces(response.data.faces, settings);
    
    // Calculate statistics
    const stats = calculateStatistics(detectedFaces);

    // Store raw response separately to avoid type errors
    const rawResponse = response.data;

    // Combine results
    const result: AnalysisResult = {
      faces: detectedFaces,
      timestamp: new Date(),
      ...stats
    };
    
    // Add raw data outside of the typed structure
    const resultWithRawData = {
      ...result,
      rawData: rawResponse
    };

    return resultWithRawData;
  } catch (error) {
    console.error('Error analyzing image with Face++:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Face++ API error data:', error.response.data);
      }
      throw new Error(`Face++ API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Determines which attributes to request from Face++ based on settings
 */
function getAttributesArray(settings: SettingsConfig): string[] {
  const attributes: string[] = [];
  
  attributes.push('gender');
  
  if (settings.enableAgeAnalysis) {
    attributes.push('age');
  }
  
  if (settings.enableEmotionAnalysis) {
    attributes.push('emotion');
  }
  
  // Always include these for a more complete analysis
  attributes.push('smiling', 'headpose', 'eyestatus', 'mouthstatus', 'glass');
  
  return attributes;
}

/**
 * Maps Face++ bounding box to our format
 */
function mapBoundingBox(faceRect: FacePlusPlusFace['face_rectangle']): BoundingBox {
  // Face++ gives top-left and width/height, normalize to proportional values
  return {
    left: faceRect.left / 100, // Normalize to 0-1 range
    top: faceRect.top / 100,
    width: faceRect.width / 100,
    height: faceRect.height / 100
  };
}

/**
 * Processes the face details returned by Face++
 * @param faces - The face details from Face++
 * @param settings - The analysis settings
 * @returns Processed face details
 */
function processDetectedFaces(
  faces: FacePlusPlusFace[],
  settings: SettingsConfig
): DetectedFace[] {
  return faces.map(face => {
    const boundingBox = mapBoundingBox(face.face_rectangle);

    // Map Face++ data to our DetectedFace structure
    const detectedFace: DetectedFace = {
      id: face.face_token || uuidv4(),
      boundingBox,
      confidence: 100, // Face++ doesn't provide a confidence score for faces, assume 100%
    };

    // Add age if available and enabled
    if (settings.enableAgeAnalysis && face.attributes?.age) {
      const ageValue = face.attributes.age.value;
      detectedFace.ageRange = {
        low: Math.max(0, ageValue - 5),
        high: ageValue + 5
      };
    }

    // Add gender if available and enabled
    if (settings.enableGenderAnalysis && face.attributes?.gender) {
      detectedFace.gender = {
        value: face.attributes.gender.value === 'Male' ? 'Male' : 'Female',
        confidence: 90 // Face++ doesn't provide confidence for gender
      };
    }

    // Add emotions if available and enabled
    if (settings.enableEmotionAnalysis && face.attributes?.emotion) {
      const emotions = face.attributes.emotion;
      detectedFace.emotions = [
        { type: 'HAPPY', confidence: emotions.happiness },
        { type: 'ANGRY', confidence: emotions.anger },
        { type: 'SAD', confidence: emotions.sadness },
        { type: 'CALM', confidence: emotions.neutral },
        { type: 'SURPRISED', confidence: emotions.surprise },
        { type: 'DISGUSTED', confidence: emotions.disgust },
        { type: 'FEAR', confidence: emotions.fear }
      ];
    }

    // Add smile if available
    if (face.attributes?.smile) {
      detectedFace.smile = {
        value: face.attributes.smile.value > face.attributes.smile.threshold,
        confidence: face.attributes.smile.value
      };
    }

    // Add eye open status if available
    if (face.attributes?.eyestatus) {
      const leftEyeOpen = face.attributes.eyestatus.left_eye_status.no_glass_eye_open + 
                          face.attributes.eyestatus.left_eye_status.normal_glass_eye_open;
      const rightEyeOpen = face.attributes.eyestatus.right_eye_status.no_glass_eye_open + 
                           face.attributes.eyestatus.right_eye_status.normal_glass_eye_open;
      
      detectedFace.eyesOpen = {
        value: (leftEyeOpen > 50 && rightEyeOpen > 50), // Consider eyes open if probability > 50%
        confidence: (leftEyeOpen + rightEyeOpen) / 2
      };
    }

    // Add mouth open status if available
    if (face.attributes?.mouthstatus) {
      detectedFace.mouthOpen = {
        value: face.attributes.mouthstatus.open > 50, // Consider mouth open if probability > 50%
        confidence: face.attributes.mouthstatus.open
      };
    }

    // Add glasses status if available
    if (face.attributes?.glass) {
      const hasGlasses = face.attributes.glass.value !== 'None';
      detectedFace.eyeglasses = {
        value: hasGlasses && face.attributes.glass.value === 'Normal',
        confidence: hasGlasses ? 90 : 10 // Face++ doesn't provide confidence for glasses
      };
      
      detectedFace.sunglasses = {
        value: hasGlasses && face.attributes.glass.value === 'Dark',
        confidence: hasGlasses ? 90 : 10
      };
    }

    // Add pose information if available
    if (face.attributes?.headpose) {
      detectedFace.pose = {
        roll: face.attributes.headpose.roll_angle,
        yaw: face.attributes.headpose.yaw_angle,
        pitch: face.attributes.headpose.pitch_angle
      };
    }

    return detectedFace;
  });
}

/**
 * Calculates statistics from detected faces
 */
function calculateStatistics(faces: DetectedFace[]): Omit<AnalysisResult, "faces" | "timestamp"> {
  if (faces.length === 0) {
    return {
      peopleCount: 0
    };
  }

  // Calculate average age
  let totalAge = 0;
  let facesWithAge = 0;
  
  faces.forEach(face => {
    if (face.ageRange) {
      totalAge += (face.ageRange.low + face.ageRange.high) / 2;
      facesWithAge++;
    }
  });
  
  const averageAge = facesWithAge > 0 ? Math.round(totalAge / facesWithAge) : undefined;
  
  // Calculate gender distribution
  let maleCount = 0;
  let femaleCount = 0;
  
  faces.forEach(face => {
    if (face.gender?.value === 'Male') {
      maleCount++;
    } else if (face.gender?.value === 'Female') {
      femaleCount++;
    }
  });
  
  const malePercentage = faces.length > 0 ? Math.round((maleCount / faces.length) * 100) : 0;
  const femalePercentage = faces.length > 0 ? Math.round((femaleCount / faces.length) * 100) : 0;
  
  // Calculate primary emotion
  const emotionCounts: Record<string, number> = {};
  
  faces.forEach(face => {
    if (face.emotions && face.emotions.length > 0) {
      // Find emotion with highest confidence
      const primaryEmotion = face.emotions.reduce((prev, current) => 
        (current.confidence > prev.confidence) ? current : prev
      );
      
      emotionCounts[primaryEmotion.type] = (emotionCounts[primaryEmotion.type] || 0) + 1;
    }
  });
  
  let primaryEmotion: string | undefined;
  let primaryEmotionCount = 0;
  
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    if (count > primaryEmotionCount) {
      primaryEmotion = emotion;
      primaryEmotionCount = count;
    }
  });
  
  const primaryEmotionPercentage = faces.length > 0 && primaryEmotionCount > 0
    ? Math.round((primaryEmotionCount / faces.length) * 100)
    : 0;
  
  // Calculate engagement score (0-100)
  let engagementScore = 0;
  
  if (faces.length > 0) {
    // Base factors for engagement calculation
    const faceFactors = faces.map(face => {
      let faceScore = 50; // Start with a baseline
      
      // Eyes open increases engagement
      if (face.eyesOpen?.value) {
        faceScore += 10;
      }
      
      // Smiling indicates engagement
      if (face.smile?.value) {
        faceScore += 10;
      }
      
      // Directly facing the camera (neutral pose) indicates engagement
      if (face.pose) {
        // Lower scores for extreme head poses
        const poseDeviation = Math.abs(face.pose.yaw) + Math.abs(face.pose.pitch);
        if (poseDeviation < 15) {
          faceScore += 10;
        } else if (poseDeviation > 45) {
          faceScore -= 10;
        }
      }
      
      // Certain emotions indicate higher engagement
      if (face.emotions && face.emotions.length > 0) {
        const primaryEmotion = face.emotions.reduce((prev, current) => 
          (current.confidence > prev.confidence) ? current : prev
        );
        
        if (['HAPPY', 'SURPRISED'].includes(primaryEmotion.type)) {
          faceScore += 15;
        } else if (['CALM', 'NEUTRAL'].includes(primaryEmotion.type)) {
          faceScore += 5;
        } else if (['ANGRY', 'DISGUSTED', 'FEAR'].includes(primaryEmotion.type)) {
          faceScore -= 5;
        }
      }
      
      return Math.max(0, Math.min(100, faceScore));
    });
    
    // Average engagement across all faces
    engagementScore = Math.round(faceFactors.reduce((sum, score) => sum + score, 0) / faces.length);
  }
  
  return {
    peopleCount: faces.length,
    averageAge,
    malePercentage,
    femalePercentage,
    primaryEmotion,
    primaryEmotionPercentage,
    engagementScore
  };
}