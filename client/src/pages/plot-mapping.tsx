import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Plus, X, Edit, Trash2, Grid, Ruler } from "lucide-react";
import { InteractiveMap } from "@/components/mapping/interactive-map";

export default function PlotMapping() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [showPlotDetails, setShowPlotDetails] = useState(false);
  const [mapLayer, setMapLayer] = useState("satellite");
  const [plotFilter, setPlotFilter] = useState("all");

  const { data: plots, isLoading } = useQuery({
    queryKey: ["/api/plots"],
  });

  const handlePlotSelect = (plot: any) => {
    setSelectedPlot(plot);
    setShowPlotDetails(true);
  };

  const closePlotDetails = () => {
    setShowPlotDetails(false);
    setSelectedPlot(null);
  };

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-border bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Plot Mapping</h1>
              <p className="text-gray-600 mt-1">Manage farm plot polygons and geospatial data</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-forest text-white hover:bg-forest-dark" data-testid="button-upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload Polygons
              </Button>
              <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-draw">
                <Plus className="w-4 h-4 mr-2" />
                Draw New Plot
              </Button>
            </div>
          </div>

          {/* Map Controls */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-gray-700">Layer:</Label>
              <Select value={mapLayer} onValueChange={setMapLayer}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satellite">Satellite</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="forest">Forest Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-gray-700">Filter:</Label>
              <Select value={plotFilter} onValueChange={setPlotFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plots</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" data-testid="button-grid">
                <Grid className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button variant="outline" size="sm" data-testid="button-measure">
                <Ruler className="w-4 h-4 mr-1" />
                Measure
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Map Container */}
          <div className="flex-1 relative">
            <InteractiveMap 
              plots={Array.isArray(plots) ? plots : []}
              onPlotSelect={handlePlotSelect}
              mapLayer={mapLayer}
              plotFilter={plotFilter}
            />
            
            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-neutral-border">
              <h4 className="font-semibold text-gray-800 mb-3">Plot Status</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-forest-light rounded mr-2"></div>
                  <span className="text-sm text-gray-700">Compliant</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-warning rounded mr-2"></div>
                  <span className="text-sm text-gray-700">At Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-critical rounded mr-2"></div>
                  <span className="text-sm text-gray-700">Critical</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-700">Pending Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Plot Details Panel */}
          {showPlotDetails && selectedPlot && (
            <div className="w-80 bg-white border-l border-neutral-border p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Plot Details</h3>
                <Button variant="ghost" size="sm" onClick={closePlotDetails} data-testid="button-close-details">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Plot ID</Label>
                  <Input 
                    type="text" 
                    value={selectedPlot.plotId || ""} 
                    readOnly 
                    className="bg-gray-50"
                    data-testid="input-plot-id"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</Label>
                  <Input 
                    type="text" 
                    value={selectedPlot.name || ""} 
                    data-testid="input-supplier-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Area (ha)</Label>
                    <Input 
                      type="text" 
                      value={selectedPlot.area || ""} 
                      data-testid="input-area"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Status</Label>
                    <Select value={selectedPlot.status || "pending"}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Coordinates (WGS84)</Label>
                  <Textarea 
                    rows={3} 
                    className="text-xs font-mono" 
                    readOnly
                    value={selectedPlot.coordinates ? JSON.stringify(selectedPlot.coordinates, null, 2) : ""}
                    data-testid="textarea-coordinates"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</Label>
                  <Input 
                    type="text" 
                    value={selectedPlot.createdAt ? new Date(selectedPlot.createdAt).toLocaleString() : ""} 
                    readOnly 
                    className="bg-gray-50"
                    data-testid="input-last-updated"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border border-neutral-border rounded">
                      <span className="text-sm text-gray-700">Land Title Certificate</span>
                      <div className="w-4 h-4 bg-forest-light rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-2 border border-neutral-border rounded">
                      <span className="text-sm text-gray-700">Environmental Permit</span>
                      <div className="w-4 h-4 bg-warning rounded-full"></div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-dashed"
                      data-testid="button-upload-document"
                    >
                      + Upload Document
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button className="flex-1 bg-forest text-white hover:bg-forest-dark" data-testid="button-save">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={closePlotDetails} data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
