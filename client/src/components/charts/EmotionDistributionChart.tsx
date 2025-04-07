import { CaptureResult } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface EmotionDistributionChartProps {
  capture: CaptureResult;
}

export default function EmotionDistributionChart({ capture }: EmotionDistributionChartProps) {
  // Process capture data to get emotion distribution from detected faces
  const getEmotionDistribution = () => {
    if (!capture || !capture.faces || capture.faces.length === 0) {
      return [{ name: "No Data", value: 1 }];
    }
    
    // Count emotions
    const emotionCounts: Record<string, number> = {};
    let totalEmotions = 0;
    
    capture.faces.forEach(face => {
      if (face.emotions && face.emotions.length > 0) {
        // Find the emotion with the highest confidence
        const primaryEmotion = face.emotions.reduce((prev, current) => 
          (current.confidence > prev.confidence) ? current : prev
        );
        
        const emotion = primaryEmotion.type;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        totalEmotions++;
      }
    });
    
    // If no emotions were found, return No Data
    if (totalEmotions === 0) {
      return [{ name: "No Data", value: 1 }];
    }
    
    // Convert to chart data format and sort by count
    const emotionData = Object.entries(emotionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Limit to top 5 emotions, combine the rest as "Other"
    if (emotionData.length > 5) {
      const topEmotions = emotionData.slice(0, 4);
      const otherEmotions = emotionData.slice(4);
      
      const otherValue = otherEmotions.reduce((sum, item) => sum + item.value, 0);
      topEmotions.push({ name: "Other", value: otherValue });
      
      return topEmotions;
    }
    
    return emotionData;
  };
  
  const data = getEmotionDistribution();
  
  // Color mapping for common emotions
  const getEmotionColor = (emotion: string) => {
    const colorMap: Record<string, string> = {
      "HAPPY": "#28A745",
      "SAD": "#FFC107",
      "ANGRY": "#DC3545",
      "CONFUSED": "#6610F2",
      "DISGUSTED": "#6C757D",
      "SURPRISED": "#50E6FF",
      "CALM": "#0078D4",
      "FEAR": "#FD7E14",
      "No Data": "#E1E1E1",
      "Other": "#E1E1E1"
    };
    
    return colorMap[emotion] || "#0078D4";
  };
  
  const COLORS = data.map(item => getEmotionColor(item.name));
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Calculate total faces for percentage
      const totalFaces = capture.faces && capture.faces.length > 0 ? capture.faces.length : 1;
      const percentage = ((payload[0].value / totalFaces) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`${payload[0].name}`}</p>
          <p>{`Count: ${payload[0].value} (${percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
