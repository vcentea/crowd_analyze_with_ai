import { CaptureResult, DetectedFace } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from "recharts";

interface AgeDistributionChartProps {
  capture: CaptureResult;
}

// These are our standard age ranges
const ageRanges = [
  { key: "0-17", label: "0-17" },
  { key: "18-24", label: "18-24" },
  { key: "25-34", label: "25-34" },
  { key: "35-44", label: "35-44" },
  { key: "45-54", label: "45-54" },
  { key: "55-64", label: "55-64" },
  { key: "65+", label: "65+" },
];

export default function AgeDistributionChart({ capture }: AgeDistributionChartProps) {
  // Process the captured face data to get age distribution
  const getAgeDistribution = () => {
    // Get faces from the appropriate location (directly or from rawData)
    const facesArray = capture?.faces?.length ? capture.faces : 
                      (capture?.rawData?.faces?.length ? capture.rawData.faces : []);
    
    if (facesArray.length === 0) {
      console.log("No faces found in capture or rawData");
      return ageRanges.map(range => ({ name: range.label, count: 0 }));
    }
    
    // Initialize counts
    const counts = ageRanges.reduce((acc, range) => {
      acc[range.key] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Count faces in each age range
    let totalFacesWithAge = 0;
    
    facesArray.forEach((face: DetectedFace) => {
      if (face.ageRange) {
        totalFacesWithAge++;
        // Calculate average age from the range
        const avg = (face.ageRange.low + face.ageRange.high) / 2;
        
        if (avg < 18) counts["0-17"]++;
        else if (avg < 25) counts["18-24"]++;
        else if (avg < 35) counts["25-34"]++;
        else if (avg < 45) counts["35-44"]++;
        else if (avg < 55) counts["45-54"]++;
        else if (avg < 65) counts["55-64"]++;
        else counts["65+"]++;
      }
    });
    
    // Enhanced debugging with full capture data
    console.log("Age distribution debugging:", {
      totalFaces: facesArray.length,
      totalFacesWithAge,
      counts,
      rawCapture: capture,
      firstFace: facesArray.length > 0 ? facesArray[0] : null,
      settings: {
        enableAgeAnalysis: true, // We've hardcoded these now on the server
        enableGenderAnalysis: true,
        enableEmotionAnalysis: true
      }
    });
    
    // Convert to chart data format
    return ageRanges.map(range => ({
      name: range.label,
      count: counts[range.key] || 0,
    }));
  };
  
  const data = getAgeDistribution();
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`${label} years`}</p>
          <p className="text-[#0078D4]">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={25} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#50E6FF" stroke="#0078D4" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
