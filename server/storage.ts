import { 
  captures, 
  type Capture, 
  type InsertCapture, 
  settings,
  type Settings,
  type InsertSettings,
  detectedPeople,
  type DetectedPerson,
  type InsertDetectedPerson
} from "@shared/schema";

export interface IStorage {
  // Settings methods
  getSettings(): Promise<Settings>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  initSettings(): Promise<Settings>;
  
  // Capture methods
  createCapture(capture: InsertCapture): Promise<Capture>;
  getCapture(id: number): Promise<Capture | undefined>;
  getAllCaptures(): Promise<Capture[]>;
  resetCaptures(): Promise<void>;
  
  // Detected person methods
  createDetectedPerson(person: InsertDetectedPerson): Promise<DetectedPerson>;
  getDetectedPeopleByCapture(captureId: number): Promise<DetectedPerson[]>;
}

export class MemStorage implements IStorage {
  private settingsData: Settings | null;
  private capturesMap: Map<number, Capture>;
  private detectedPeopleMap: Map<number, DetectedPerson>;
  private captureIdCounter: number;
  private personIdCounter: number;
  
  constructor() {
    this.settingsData = null;
    this.capturesMap = new Map();
    this.detectedPeopleMap = new Map();
    this.captureIdCounter = 1;
    this.personIdCounter = 1;
  }
  
  // Settings methods
  async getSettings(): Promise<Settings> {
    if (!this.settingsData) {
      // Initialize default settings if not yet created
      return this.initSettings();
    }
    return this.settingsData;
  }
  
  async updateSettings(newSettings: InsertSettings): Promise<Settings> {
    const currentSettings = await this.getSettings();
    this.settingsData = {
      ...currentSettings,
      ...newSettings,
    };
    return this.settingsData;
  }
  
  async initSettings(): Promise<Settings> {
    if (!this.settingsData) {
      this.settingsData = {
        id: 1,
        frameInterval: 5,
        confidenceThreshold: 80,
        enableAgeAnalysis: true,
        enableGenderAnalysis: true,
        enableEmotionAnalysis: true,
        autoCapture: true,
        apiProvider: "facepp" as const, // Default to Face++ API
      };
    }
    return this.settingsData;
  }
  
  // Capture methods
  async createCapture(insertCapture: InsertCapture): Promise<Capture> {
    const id = this.captureIdCounter++;
    
    // Ensure timestamp is a Date object
    const timestamp = insertCapture.timestamp instanceof Date 
      ? insertCapture.timestamp 
      : new Date();
    
    // Create the capture with required fields
    const capture: Capture = { 
      id,
      timestamp,
      peopleCount: insertCapture.peopleCount,
      averageAge: insertCapture.averageAge ?? null,
      malePercentage: insertCapture.malePercentage ?? null,
      femalePercentage: insertCapture.femalePercentage ?? null,
      primaryEmotion: insertCapture.primaryEmotion ?? null,
      primaryEmotionPercentage: insertCapture.primaryEmotionPercentage ?? null,
      engagementScore: insertCapture.engagementScore ?? null,
      attentionTime: insertCapture.attentionTime ?? null,
      rawData: insertCapture.rawData ?? null
    };
    
    this.capturesMap.set(id, capture);
    
    // Create detected people records if provided
    if (capture.rawData && typeof capture.rawData === 'object' && 'faces' in capture.rawData && Array.isArray(capture.rawData.faces)) {
      for (const face of capture.rawData.faces) {
        await this.createDetectedPerson({
          captureId: id,
          ageRange: face.ageRange 
            ? `${face.ageRange.low}-${face.ageRange.high}` 
            : null,
          gender: face.gender?.value ?? null,
          emotion: face.emotions?.length 
            ? face.emotions.reduce((prevEmotion: any, currentEmotion: any) => 
                currentEmotion.confidence > prevEmotion.confidence ? currentEmotion : prevEmotion
              ).type 
            : null,
          confidence: face.confidence ? Math.round(face.confidence) : null,
          boundingBox: face.boundingBox ?? null,
        });
      }
    }
    
    return capture;
  }
  
  async getCapture(id: number): Promise<Capture | undefined> {
    return this.capturesMap.get(id);
  }
  
  async getAllCaptures(): Promise<Capture[]> {
    // Return captures sorted by timestamp, newest first
    return Array.from(this.capturesMap.values())
      .sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }
  
  async resetCaptures(): Promise<void> {
    this.capturesMap.clear();
    this.detectedPeopleMap.clear();
    this.captureIdCounter = 1;
    this.personIdCounter = 1;
  }
  
  // Detected person methods
  async createDetectedPerson(insertPerson: InsertDetectedPerson): Promise<DetectedPerson> {
    const id = this.personIdCounter++;
    // Create person with required fields
    const person: DetectedPerson = { 
      id,
      captureId: insertPerson.captureId,
      ageRange: insertPerson.ageRange ?? null,
      gender: insertPerson.gender ?? null,
      emotion: insertPerson.emotion ?? null,
      confidence: insertPerson.confidence ?? null,
      boundingBox: insertPerson.boundingBox ?? null
    };
    this.detectedPeopleMap.set(id, person);
    return person;
  }
  
  async getDetectedPeopleByCapture(captureId: number): Promise<DetectedPerson[]> {
    return Array.from(this.detectedPeopleMap.values())
      .filter(person => person.captureId === captureId);
  }
}

export const storage = new MemStorage();
