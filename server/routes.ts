import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeImage as analyzeImageWithAWS } from "./rekognition";
import { analyzeImage as analyzeImageWithFacePP } from "./facepp";
import { insertCaptureSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { ApiProvider } from "../client/src/lib/types";
import fs from "fs";
import path from "path";
import { getUsageData, trackAwsUsage, trackFaceppUsage } from "./usageTracker";

// Validate image data from client
const analyzeImageSchema = z.object({
  imageData: z.string()
    .startsWith("data:image/")
    .refine((val) => val.length > 0, "Image data cannot be empty")
    .refine((val) => val.includes("base64"), "Image data must be base64 encoded")
});

/**
 * Anonymizes sensitive data like face tokens in the capture data
 * @param captures - The capture data to anonymize
 * @returns The anonymized capture data
 */
function anonymizeCaptureData<T extends { rawData?: any }>(captures: T[]): T[] {
  return captures.map(capture => {
    if (!capture.rawData) return capture;
    
    const anonymizedCapture = { ...capture };
    const rawData = { ...anonymizedCapture.rawData };
    
    // Anonymize face tokens in the nested rawData.rawData structure (from Face++ API)
    if (rawData.rawData && rawData.rawData.faces && Array.isArray(rawData.rawData.faces)) {
      rawData.rawData = {
        ...rawData.rawData,
        faces: rawData.rawData.faces.map((face: any) => ({
          ...face,
          face_token: face.face_token ? "ANONYMIZED" : undefined
        }))
      };
    }
    
    // Anonymize face tokens in the main faces array
    if (rawData.faces && Array.isArray(rawData.faces)) {
      rawData.faces = rawData.faces.map((face: any) => {
        // ID in the main faces array is sometimes the face token from Face++ API
        return { ...face };
      });
    }
    
    anonymizedCapture.rawData = rawData;
    return anonymizedCapture;
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize settings if they don't exist
  await storage.initSettings();
  
  // API endpoint to get current settings
  app.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve settings" });
    }
  });
  
  // API endpoint to update settings
  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const validatedSettings = insertSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSettings(validatedSettings);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings format", details: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  
  // API endpoint to get API usage data
  app.get("/api/usage", async (_req: Request, res: Response) => {
    try {
      const usageData = getUsageData();
      res.json(usageData);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve API usage data" });
    }
  });
  
  // API endpoint to analyze an image
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const { imageData } = analyzeImageSchema.parse(req.body);
      
      // Strip the data URI prefix to get just the base64 encoded data
      const base64Data = imageData.split(',')[1];
      
      // Get current settings
      const settings = await storage.getSettings();
      
      // Choose API provider based on settings
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Convert settings to the expected SettingsConfig type
      const apiSettings = {
        ...settings,
        apiProvider: settings.apiProvider as ApiProvider
      };
      
      let analysisResult;
      if (apiSettings.apiProvider === 'facepp') {
        // Check Face++ API usage limits
        if (!trackFaceppUsage()) {
          const usageData = getUsageData();
          return res.status(429).json({ 
            message: "Face++ API monthly limit reached or rate limit exceeded", 
            usage: usageData.facepp,
            resetDate: new Date(usageData.facepp.resetDate).toLocaleDateString()
          });
        }
        
        // Use Face++ API
        analysisResult = await analyzeImageWithFacePP(imageBuffer, apiSettings);
      } else {
        // Check AWS Rekognition usage limits
        if (!trackAwsUsage()) {
          const usageData = getUsageData();
          return res.status(429).json({ 
            message: "AWS Rekognition monthly limit reached", 
            usage: usageData.aws,
            resetDate: new Date(usageData.aws.resetDate).toLocaleDateString()
          });
        }
        
        // Default to AWS Rekognition
        analysisResult = await analyzeImageWithAWS(imageBuffer, apiSettings);
      }
      
      // Save the results to storage
      const capture = {
        timestamp: new Date(),
        peopleCount: analysisResult.peopleCount,
        averageAge: analysisResult.averageAge,
        malePercentage: analysisResult.malePercentage,
        femalePercentage: analysisResult.femalePercentage,
        primaryEmotion: analysisResult.primaryEmotion,
        primaryEmotionPercentage: analysisResult.primaryEmotionPercentage,
        engagementScore: analysisResult.engagementScore,
        rawData: analysisResult,
      };
      
      const savedCapture = await storage.createCapture(capture);
      
      res.json(savedCapture);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid image data format", details: error.errors });
      } else {
        console.error("Analysis error:", error);
        res.status(500).json({ message: "Failed to analyze image" });
      }
    }
  });
  
  // API endpoint to get all captures
  app.get("/api/captures", async (_req: Request, res: Response) => {
    try {
      const captures = await storage.getAllCaptures();
      res.json(anonymizeCaptureData(captures));
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve captures" });
    }
  });
  
  // API endpoint to export data
  app.get("/api/captures/export", async (_req: Request, res: Response) => {
    try {
      const captures = await storage.getAllCaptures();
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=crowd-analytics-data-${new Date().toISOString().slice(0, 10)}.json`);
      
      res.json(anonymizeCaptureData(captures));
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });
  
  // API endpoint to reset all capture data
  app.post("/api/captures/reset", async (_req: Request, res: Response) => {
    try {
      await storage.resetCaptures();
      res.json({ message: "All captures reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset captures" });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
