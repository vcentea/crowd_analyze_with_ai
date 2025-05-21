import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Capture schema to store demographic analysis results
export const captures = pgTable("captures", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  peopleCount: integer("people_count").notNull(),
  averageAge: integer("average_age"),
  malePercentage: integer("male_percentage"),
  femalePercentage: integer("female_percentage"),
  primaryEmotion: text("primary_emotion"),
  primaryEmotionPercentage: integer("primary_emotion_percentage"),
  engagementScore: integer("engagement_score"),
  attentionTime: integer("attention_time"),
  rawData: jsonb("raw_data"),
});

export const insertCaptureSchema = createInsertSchema(captures).omit({
  id: true,
});

export type InsertCapture = z.infer<typeof insertCaptureSchema>;
export type Capture = typeof captures.$inferSelect;

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  frameInterval: integer("frame_interval").notNull().default(7),
  confidenceThreshold: integer("confidence_threshold").notNull().default(80),
  enableAgeAnalysis: boolean("enable_age_analysis").notNull().default(true),
  enableGenderAnalysis: boolean("enable_gender_analysis").notNull().default(true),
  enableEmotionAnalysis: boolean("enable_emotion_analysis").notNull().default(true),
  autoCapture: boolean("auto_capture").notNull().default(true),
  apiProvider: text("api_provider").notNull().default("aws"),
  autoStopTimeoutMinutes: integer("auto_stop_timeout_minutes").default(1),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Person detection schema (for people detected in a capture)
export const detectedPeople = pgTable("detected_people", {
  id: serial("id").primaryKey(),
  captureId: integer("capture_id").notNull(),
  ageRange: text("age_range"),
  gender: text("gender"),
  emotion: text("emotion"),
  confidence: integer("confidence"),
  boundingBox: jsonb("bounding_box"),
});

export const insertDetectedPersonSchema = createInsertSchema(detectedPeople).omit({
  id: true,
});

export type InsertDetectedPerson = z.infer<typeof insertDetectedPersonSchema>;
export type DetectedPerson = typeof detectedPeople.$inferSelect;
