import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface GenderDistributionChartProps {
  malePercentage: number;
  femalePercentage: number;
}

export default function GenderDistributionChart({ 
  malePercentage, 
  femalePercentage 
}: GenderDistributionChartProps) {
  // Calculate the actual counts based on percentages
  // If we have 0 for both, add a placeholder for "No Data"
  const total = malePercentage + femalePercentage;
  let data = [];
  
  if (total === 0) {
    data = [{ name: "No Data", value: 1 }];
  } else {
    const normalizedMale = (malePercentage / total) * 100;
    const normalizedFemale = (femalePercentage / total) * 100;
    
    data = [
      { name: "Male", value: normalizedMale },
      { name: "Female", value: normalizedFemale }
    ];
  }
  
  // Only include undetermined if it exists
  const undetermined = 100 - (malePercentage + femalePercentage);
  if (undetermined > 0) {
    data.push({ name: "Undetermined", value: undetermined });
  }
  
  const COLORS = ["#0078D4", "#50E6FF", "#E1E1E1"];
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent 
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
          <p className="font-medium">{`${payload[0].name}`}</p>
          <p>{`${payload[0].value.toFixed(1)}%`}</p>
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
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
