import { useState } from "react";
import { Button } from "@/components/ui/button";
import SummaryCards from "@/components/SummaryCards";
import AgeDistributionChart from "@/components/charts/AgeDistributionChart";
import GenderDistributionChart from "@/components/charts/GenderDistributionChart";
import EmotionDistributionChart from "@/components/charts/EmotionDistributionChart";
import TimelineChart from "@/components/charts/TimelineChart";
import EngagementTimelineChart from "@/components/charts/EngagementTimelineChart";
import RecentCapturesTable from "@/components/RecentCapturesTable";
import { CaptureResult } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsDashboardProps {
  captures: CaptureResult[];
  isLoading: boolean;
  onViewCaptureDetails: (capture: CaptureResult) => void;
}

export default function AnalyticsDashboard({ 
  captures, 
  isLoading, 
  onViewCaptureDetails 
}: AnalyticsDashboardProps) {
  const [showAllCaptures, setShowAllCaptures] = useState(false);
  
  // Get the most recent capture
  const latestCapture = captures.length > 0 ? captures[0] : null;
  
  // Get previous capture for comparison
  const previousCapture = captures.length > 1 ? captures[1] : null;
  
  // Prepare timeline data
  const timelineData = captures.slice().reverse().map(capture => ({
    time: new Date(capture.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    count: capture.peopleCount
  }));
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards 
        latestCapture={latestCapture}
        previousCapture={previousCapture}
        isLoading={isLoading}
      />
      
      {/* Demographics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Age Distribution</h3>
            {isLoading || !latestCapture ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <AgeDistributionChart capture={latestCapture} />
            )}
          </CardContent>
        </Card>
        
        {/* Gender Distribution */}
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Gender Distribution</h3>
            {isLoading || !latestCapture ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <GenderDistributionChart 
                malePercentage={latestCapture.malePercentage || 0}
                femalePercentage={latestCapture.femalePercentage || 0}
              />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Emotion Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Emotion Distribution</h3>
            {isLoading || !latestCapture ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <EmotionDistributionChart capture={latestCapture} />
            )}
          </CardContent>
        </Card>
        
        {/* People Count Timeline */}
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">People Count Timeline</h3>
            {isLoading || timelineData.length < 2 ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <TimelineChart data={timelineData} />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Engagement Timeline */}
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-4">Engagement Score Timeline (Last 2 Minutes)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Real-time tracking of audience engagement levels based on facial expressions, attention cues, and emotional responses.
          </p>
          {isLoading || captures.length < 2 ? (
            <div className="h-[200px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <EngagementTimelineChart captures={captures} windowMinutes={2} />
          )}
        </CardContent>
      </Card>
      
      {/* Recent Captures Table */}
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Recent Captures</h3>
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => setShowAllCaptures(!showAllCaptures)}
            >
              {showAllCaptures ? 'Show Less' : 'View All'}
            </Button>
          </div>
          
          <RecentCapturesTable 
            captures={showAllCaptures ? captures : captures.slice(0, 5)} 
            isLoading={isLoading}
            onViewCapture={onViewCaptureDetails}
          />
        </CardContent>
      </Card>
    </div>
  );
}
