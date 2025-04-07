import { CaptureResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface RecentCapturesTableProps {
  captures: CaptureResult[];
  isLoading: boolean;
  onViewCapture: (capture: CaptureResult) => void;
}

export default function RecentCapturesTable({ 
  captures, 
  isLoading, 
  onViewCapture 
}: RecentCapturesTableProps) {
  // Format time from timestamp
  const formatTime = (timestamp: Date) => {
    return format(new Date(timestamp), "hh:mm:ss a");
  };
  
  // Format gender ratio
  const formatGenderRatio = (male?: number, female?: number) => {
    if (male === undefined || female === undefined) return "N/A";
    return `M: ${male}%, F: ${female}%`;
  };
  
  // Format primary emotion
  const formatPrimaryEmotion = (emotion?: string, percentage?: number) => {
    if (!emotion || percentage === undefined) return "N/A";
    return `${emotion} (${percentage}%)`;
  };
  
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-medium">Time</th>
              <th className="text-left py-2 px-3 font-medium">People</th>
              <th className="text-left py-2 px-3 font-medium">Avg. Age</th>
              <th className="text-left py-2 px-3 font-medium">Gender Ratio</th>
              <th className="text-left py-2 px-3 font-medium">Primary Emotion</th>
              <th className="text-right py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b">
                <td className="py-2 px-3"><Skeleton className="h-4 w-20" /></td>
                <td className="py-2 px-3"><Skeleton className="h-4 w-10" /></td>
                <td className="py-2 px-3"><Skeleton className="h-4 w-12" /></td>
                <td className="py-2 px-3"><Skeleton className="h-4 w-28" /></td>
                <td className="py-2 px-3"><Skeleton className="h-4 w-24" /></td>
                <td className="py-2 px-3 text-right">
                  <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  if (captures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No captures available yet. Start capturing frames to see data.
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium">Time</th>
            <th className="text-left py-2 px-3 font-medium">People</th>
            <th className="text-left py-2 px-3 font-medium">Avg. Age</th>
            <th className="text-left py-2 px-3 font-medium">Gender Ratio</th>
            <th className="text-left py-2 px-3 font-medium">Primary Emotion</th>
            <th className="text-right py-2 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {captures.map((capture) => (
            <tr key={capture.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3 font-mono">{formatTime(capture.timestamp)}</td>
              <td className="py-2 px-3">{capture.peopleCount}</td>
              <td className="py-2 px-3">{capture.averageAge?.toFixed(1) || "N/A"}</td>
              <td className="py-2 px-3">
                {formatGenderRatio(capture.malePercentage, capture.femalePercentage)}
              </td>
              <td className="py-2 px-3">
                {formatPrimaryEmotion(capture.primaryEmotion, capture.primaryEmotionPercentage)}
              </td>
              <td className="py-2 px-3 text-right">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onViewCapture(capture)}
                  className="text-primary hover:text-primary-dark"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
