import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DownloadCloud, 
  FileText, 
  FileBarChart2,
  Users,
  BarChart2,
  X 
} from "lucide-react";
import { CaptureResult, DetectedFace } from "@/lib/types";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts";
import FaceAttributesPanel from "./FaceAttributesPanel";

interface CaptureDetailModalProps {
  capture: CaptureResult;
  onClose: () => void;
}

export default function CaptureDetailModal({ 
  capture, 
  onClose 
}: CaptureDetailModalProps) {
  if (!capture) return null;
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("summary");
  
  // Prepare chart data
  const genderData = [
    { name: "Male", value: capture.malePercentage || 0 },
    { name: "Female", value: capture.femalePercentage || 0 }
  ].filter(item => item.value > 0);
  
  // Age chart data
  const getAgeData = () => {
    // Get faces from the appropriate location (directly or from rawData)
    const facesArray = capture?.faces?.length ? capture.faces : 
                      (capture?.rawData?.faces?.length ? capture.rawData.faces : []);
    
    if (facesArray.length === 0) return [];
    
    const ageGroups: Record<string, number> = {};
    
    facesArray.forEach((face: DetectedFace) => {
      if (face.ageRange) {
        const avg = (face.ageRange.low + face.ageRange.high) / 2;
        
        if (avg < 18) ageGroups["0-17"] = (ageGroups["0-17"] || 0) + 1;
        else if (avg < 25) ageGroups["18-24"] = (ageGroups["18-24"] || 0) + 1;
        else if (avg < 35) ageGroups["25-34"] = (ageGroups["25-34"] || 0) + 1;
        else if (avg < 45) ageGroups["35-44"] = (ageGroups["35-44"] || 0) + 1;
        else ageGroups["45+"] = (ageGroups["45+"] || 0) + 1;
      }
    });
    
    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  };
  
  // Emotion chart data
  const getEmotionData = () => {
    // Get faces from the appropriate location (directly or from rawData)
    const facesArray = capture?.faces?.length ? capture.faces : 
                      (capture?.rawData?.faces?.length ? capture.rawData.faces : []);
    
    if (facesArray.length === 0) return [];
    
    const emotionCounts: Record<string, number> = {};
    
    facesArray.forEach((face: DetectedFace) => {
      if (face.emotions && face.emotions.length > 0) {
        // Find the emotion with the highest confidence
        const primaryEmotion = face.emotions.reduce((prev: any, current: any) => 
          (current.confidence > prev.confidence) ? current : prev
        );
        
        const emotion = primaryEmotion.type;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    });
    
    // Sort by count (descending) and take top 3
    return Object.entries(emotionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };
  
  // Use real engagement score
  const attentionData = [
    { name: "Engaged", value: capture.engagementScore || 50 },
    { name: "Not Engaged", value: 100 - (capture.engagementScore || 50) }
  ];
  
  // Colors for charts
  const genderColors = ["#0078D4", "#50E6FF"];
  const emotionColors = ["#0078D4", "#28A745", "#E1E1E1"];
  const attentionColors = ["#28A745", "#E1E1E1"];
  
  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return format(new Date(timestamp), "hh:mm:ss a - MM/dd/yyyy");
  };
  
  // Download functions
  const downloadRawData = () => {
    const dataStr = JSON.stringify(capture, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capture-${capture.id}-raw.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-medium">Capture Details</DialogTitle>
            <DialogClose className="text-gray-500 hover:text-primary">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
          <div className="border-b px-4">
            <TabsList className="bg-transparent border-b-0">
              <TabsTrigger value="summary" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                <BarChart2 className="mr-1 h-4 w-4" /> Summary
              </TabsTrigger>
              <TabsTrigger value="attributes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                <Users className="mr-1 h-4 w-4" /> Face Attributes
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="summary" className="p-6 pb-4 m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Capture Information</h3>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Timestamp:</span>
                    <span>{formatTimestamp(capture.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">People detected:</span>
                    <span>{capture.peopleCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average age:</span>
                    <span>{capture.averageAge?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Primary emotion:</span>
                    <span>{capture.primaryEmotion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Engagement score:</span>
                    <span>{capture.engagementScore ? `${capture.engagementScore}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Attention time:</span>
                    <span>{capture.attentionTime ? `${capture.attentionTime.toFixed(1)}s` : 'N/A'}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-3 mt-6">Demographics Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#F8F9FA] p-3 rounded-md">
                    <CardContent className="p-0">
                      <h4 className="text-sm text-gray-500 mb-1">Gender</h4>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={genderData.length ? genderData : [{ name: "No Data", value: 1 }]}
                              cx="50%"
                              cy="50%"
                              outerRadius={50}
                              dataKey="value"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {genderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={genderColors[index % genderColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#F8F9FA] p-3 rounded-md">
                    <CardContent className="p-0">
                      <h4 className="text-sm text-gray-500 mb-1">Age Groups</h4>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getAgeData()}>
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Bar dataKey="value" fill="#50E6FF" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#F8F9FA] p-3 rounded-md">
                    <CardContent className="p-0">
                      <h4 className="text-sm text-gray-500 mb-1">Emotions</h4>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getEmotionData().length ? getEmotionData() : [{ name: "No Data", value: 1 }]}
                              cx="50%"
                              cy="50%"
                              outerRadius={50}
                              dataKey="value"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {getEmotionData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={emotionColors[index % emotionColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#F8F9FA] p-3 rounded-md">
                    <CardContent className="p-0">
                      <h4 className="text-sm text-gray-500 mb-1">Engagement Score</h4>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={attentionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              dataKey="value"
                              label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {attentionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={attentionColors[index % attentionColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Processed Image</h3>
                <div className="bg-black rounded-md overflow-hidden mb-4 min-h-[200px] flex items-center justify-center">
                  <p className="text-white text-center p-4">
                    The processed image would be displayed here with facial detection overlays.
                    <br />
                    Due to privacy considerations, the raw camera frame is not stored.
                  </p>
                </div>
                
                <h3 className="text-lg font-medium mb-3">Detection Details</h3>
                <div className="bg-[#F8F9FA] p-4 rounded-md overflow-y-auto max-h-60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 px-2 font-medium">ID</th>
                        <th className="text-left py-1 px-2 font-medium">Age</th>
                        <th className="text-left py-1 px-2 font-medium">Gender</th>
                        <th className="text-left py-1 px-2 font-medium">Emotion</th>
                        <th className="text-left py-1 px-2 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get faces from the appropriate location (directly or from rawData)
                        const facesArray = capture?.faces?.length ? capture.faces : 
                                          (capture?.rawData?.faces?.length ? capture.rawData.faces : []);
                        
                        return facesArray.length > 0 ? (
                          facesArray.map((face: DetectedFace, index: number) => {
                            // Get the primary emotion
                            const primaryEmotion = face.emotions?.length 
                              ? face.emotions.reduce((prev: any, current: any) => 
                                  (current.confidence > prev.confidence) ? current : prev
                                )
                              : null;
                                
                            return (
                              <tr key={face.id} className="border-b">
                                <td className="py-1 px-2 font-mono">#{(index + 1).toString().padStart(3, '0')}</td>
                                <td className="py-1 px-2">
                                  {face.ageRange ? `${face.ageRange.low}-${face.ageRange.high}` : 'N/A'}
                                </td>
                                <td className="py-1 px-2">
                                  {face.gender?.value || 'N/A'}
                                </td>
                                <td className="py-1 px-2">
                                  {primaryEmotion?.type || 'N/A'}
                                </td>
                                <td className="py-1 px-2">
                                  {face.confidence ? `${Math.round(face.confidence)}%` : 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-gray-500">
                              No face detection data available
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={downloadRawData}
              >
                <FileText className="mr-1 h-4 w-4" /> Raw Data
              </Button>
              <Button 
                variant="outline"
                disabled
              >
                <DownloadCloud className="mr-1 h-4 w-4" /> Download Image
              </Button>
              <Button className="bg-primary hover:bg-primary-dark text-white">
                <FileBarChart2 className="mr-1 h-4 w-4" /> Export Report
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="attributes" className="p-6 m-0">
            <h3 className="text-lg font-medium mb-3">Detailed Face Attributes Analysis</h3>
            <p className="text-sm text-gray-500 mb-4">
              View detailed attributes for each detected face, including emotions, facial features, and engagement metrics.
            </p>
            
            {(() => {
              // Get faces from the appropriate location (directly or from rawData)
              const facesArray = capture?.faces?.length ? capture.faces : 
                                (capture?.rawData?.faces?.length ? capture.rawData.faces : []);
              
              return facesArray.length > 0 ? (
                <div className="space-y-4">
                  {facesArray.map((face: DetectedFace, index: number) => (
                    <FaceAttributesPanel 
                      key={face.id} 
                      face={face} 
                      faceIndex={index} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  No face detection data available
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}