import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface TimelineDataPoint {
  time: string;
  count: number;
}

interface TimelineChartProps {
  data: TimelineDataPoint[];
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`People: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Add padding to ensure at least 7 data points for better visualization
  const paddedData = () => {
    if (data.length >= 7) return data;
    
    // Generate empty data points if we have fewer than 7
    const padding = [];
    for (let i = 0; i < 7 - data.length; i++) {
      padding.push({
        time: `N/A ${i + 1}`,
        count: 0
      });
    }
    
    return [...padding, ...data];
  };
  
  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={paddedData()}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0078D4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0078D4" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            width={25}
            domain={[0, 'dataMax + 5']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#0078D4" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#colorCount)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
