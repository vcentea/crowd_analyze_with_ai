import { CaptureResult } from "@/lib/types";
import { Users, User, SmilePlus, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  latestCapture: CaptureResult | null;
  previousCapture: CaptureResult | null;
  isLoading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  isLoading: boolean;
}

function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  iconBgColor, 
  iconColor, 
  isLoading 
}: MetricCardProps) {
  const changeDirection = change === undefined ? undefined : change >= 0 ? 'up' : 'down';
  const absoluteChange = change !== undefined ? Math.abs(change) : undefined;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </>
          ) : (
            <>
              <p className="text-2xl font-medium font-mono">{value}</p>
              {absoluteChange !== undefined && (
                <p className="text-sm">
                  <span className={`${changeDirection === 'up' ? 'text-[#28A745]' : 'text-[#DC3545]'}`}>
                    {changeDirection === 'up' ? '↑' : '↓'} {absoluteChange}
                  </span>
                  <span className="text-gray-500 ml-1">vs previous</span>
                </p>
              )}
            </>
          )}
        </div>
        <div className={`${iconBgColor} bg-opacity-10 p-2 rounded-md`}>
          <div className={`${iconColor} text-xl`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ 
  latestCapture, 
  previousCapture, 
  isLoading 
}: SummaryCardsProps) {
  // Calculate changes if we have previous data
  const peopleDiff = latestCapture && previousCapture 
    ? latestCapture.peopleCount - previousCapture.peopleCount 
    : undefined;
    
  const ageDiff = latestCapture && previousCapture && latestCapture.averageAge && previousCapture.averageAge
    ? Number((latestCapture.averageAge - previousCapture.averageAge).toFixed(1))
    : undefined;
    
  const engagementDiff = latestCapture && previousCapture && latestCapture.engagementScore && previousCapture.engagementScore
    ? latestCapture.engagementScore - previousCapture.engagementScore
    : undefined;
    
  const attentionDiff = undefined;
  
  // Format attention time placeholder
  const formatAttentionTime = () => {
    return "0.0s";
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total People"
        value={latestCapture?.peopleCount || 0}
        change={peopleDiff}
        icon={<Users />}
        iconBgColor="bg-primary"
        iconColor="text-primary"
        isLoading={isLoading}
      />
      
      <MetricCard
        title="Avg. Age"
        value={latestCapture?.averageAge?.toFixed(1) || "N/A"}
        change={ageDiff}
        icon={<User />}
        iconBgColor="bg-[#50E6FF]"
        iconColor="text-[#50E6FF]"
        isLoading={isLoading}
      />
      
      <MetricCard
        title="Engagement"
        value={`${latestCapture?.engagementScore || 0}%`}
        change={engagementDiff}
        icon={<SmilePlus />}
        iconBgColor="bg-[#28A745]"
        iconColor="text-[#28A745]"
        isLoading={isLoading}
      />
      
      <MetricCard
        title="Attention Time"
        value={formatAttentionTime()}
        change={attentionDiff}
        icon={<Clock />}
        iconBgColor="bg-[#DC3545]"
        iconColor="text-[#DC3545]"
        isLoading={isLoading}
      />
    </div>
  );
}
