import fs from 'fs';
import path from 'path';

interface ApiUsage {
  provider: 'aws' | 'facepp';
  startDate: string;
  resetDate: string;
  count: number;
  reachedLimit: boolean;
  minuteStartTime?: string; // For rate limiting (Face++)
  minuteCount?: number; // For rate limiting (Face++)
}

interface UsageData {
  aws: ApiUsage;
  facepp: ApiUsage;
}

// File to store usage data
const USAGE_FILE = path.join(process.cwd(), 'api-usage.json');

// Default usage data structure
const DEFAULT_USAGE_DATA: UsageData = {
  aws: {
    provider: 'aws',
    startDate: new Date().toISOString(),
    resetDate: getNextMonthDate().toISOString(),
    count: 0,
    reachedLimit: false
  },
  facepp: {
    provider: 'facepp',
    startDate: new Date().toISOString(),
    resetDate: getNextMonthDate().toISOString(),
    count: 0,
    reachedLimit: false,
    minuteStartTime: new Date().toISOString(),
    minuteCount: 0
  }
};

/**
 * Get the date for the next month (to reset counters)
 */
function getNextMonthDate(): Date {
  const now = new Date();
  // Set date to 1st of next month
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Load usage data from file or initialize with defaults
 */
function loadUsageData(): UsageData {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
      
      // Check if reset dates have passed, and if so, reset counters
      const now = new Date();
      
      if (new Date(data.aws.resetDate) <= now) {
        data.aws.startDate = now.toISOString();
        data.aws.resetDate = getNextMonthDate().toISOString();
        data.aws.count = 0;
        data.aws.reachedLimit = false;
      }
      
      if (new Date(data.facepp.resetDate) <= now) {
        data.facepp.startDate = now.toISOString();
        data.facepp.resetDate = getNextMonthDate().toISOString();
        data.facepp.count = 0;
        data.facepp.reachedLimit = false;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error loading usage data:', error);
  }
  
  // Return default data if file doesn't exist or has errors
  return { ...DEFAULT_USAGE_DATA };
}

/**
 * Save usage data to file
 */
function saveUsageData(data: UsageData): void {
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving usage data:', error);
  }
}

/**
 * Get current usage data
 */
export function getUsageData(): UsageData {
  return loadUsageData();
}

/**
 * Track API usage for AWS Rekognition
 * @returns true if usage is allowed, false if limit reached
 */
export function trackAwsUsage(): boolean {
  const data = loadUsageData();
  const awsMonthlyLimit = parseInt(process.env.AWS_MONTHLY_LIMIT || '1000', 10);
  
  // Check if limit already reached
  if (data.aws.reachedLimit) {
    return false;
  }
  
  // Check if new usage exceeds limit
  if (data.aws.count >= awsMonthlyLimit) {
    data.aws.reachedLimit = true;
    saveUsageData(data);
    return false;
  }
  
  // Increment counter and save
  data.aws.count += 1;
  saveUsageData(data);
  return true;
}

/**
 * Track API usage for Face++
 * @returns true if usage is allowed, false if limit reached
 */
export function trackFaceppUsage(): boolean {
  const data = loadUsageData();
  const faceppMonthlyLimit = parseInt(process.env.FACEPP_MONTHLY_LIMIT || '30000', 10);
  const faceppRateLimit = parseInt(process.env.FACEPP_RATE_LIMIT_PER_MINUTE || '20', 10);
  const now = new Date();
  
  // Check if monthly limit already reached
  if (data.facepp.reachedLimit) {
    return false;
  }
  
  // Check if monthly usage exceeds limit
  if (data.facepp.count >= faceppMonthlyLimit) {
    data.facepp.reachedLimit = true;
    saveUsageData(data);
    return false;
  }
  
  // Check per-minute rate limit
  const minuteStartTime = new Date(data.facepp.minuteStartTime || now.toISOString());
  const minuteElapsed = (now.getTime() - minuteStartTime.getTime()) / 1000 / 60; // Minutes
  
  if (minuteElapsed >= 1) {
    // Reset minute counter if a minute has passed
    data.facepp.minuteStartTime = now.toISOString();
    data.facepp.minuteCount = 1;
  } else if ((data.facepp.minuteCount || 0) >= faceppRateLimit) {
    // Rate limit exceeded
    return false;
  } else {
    // Increment minute counter
    data.facepp.minuteCount = (data.facepp.minuteCount || 0) + 1;
  }
  
  // Increment monthly counter and save
  data.facepp.count += 1;
  saveUsageData(data);
  return true;
}

// Initialize the file if it doesn't exist
if (!fs.existsSync(USAGE_FILE)) {
  saveUsageData(DEFAULT_USAGE_DATA);
} 