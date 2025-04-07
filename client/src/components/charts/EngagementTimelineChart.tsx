import { CaptureResult } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { format, subMinutes } from "date-fns";

interface EngagementTimelineChartProps {
  captures: CaptureResult[];
  windowMinutes?: number;
}

interface TimelineDataPoint {
  time: string;
  rawTime: Date;
  score: number;
}

export default function EngagementTimelineChart({ 
  captures,
  windowMinutes = 2
}: EngagementTimelineChartProps) {
  // Process capture data to extract engagement scores over time
  const getTimelineData = (): TimelineDataPoint[] => {
    if (!captures || captures.length === 0) {
      return [];
    }
    
    // Sort captures by timestamp (oldest first)
    const sortedCaptures = [...captures]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Filter captures to only include those within the time window
    const now = new Date();
    const timeWindow = subMinutes(now, windowMinutes);
    
    const filteredCaptures = sortedCaptures.filter(
      capture => new Date(capture.timestamp) >= timeWindow
    );
    
    // Convert captures to data points
    return filteredCaptures.map(capture => {
      const time = new Date(capture.timestamp);
      return {
        time: format(time, "HH:mm:ss"),
        rawTime: time,
        score: capture.engagementScore || 0,
      };
    });
  };

  const data = getTimelineData();
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`Time: ${label}`}</p>
          <p className="text-[#0078D4]">{`Engagement: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#28A745"
            strokeWidth={2}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}