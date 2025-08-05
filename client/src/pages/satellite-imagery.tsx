import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Satellite, 
  Calendar, 
  MapPin, 
  Search, 
  Download, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

interface SatelliteImage {
  id: string;
  plotId: string;
  plotNumber: string;
  captureDate: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  thumbnailUrl: string;
  satellite: string;
  resolution: string;
  cloudCover: number;
  deforestationRisk: 'low' | 'medium' | 'high';
  vegetationIndex: number;
  changeDetected: boolean;
}

// Sample satellite imagery data
const sampleSatelliteData: SatelliteImage[] = [
  {
    id: "sat_001",
    plotId: "plot_001",
    plotNumber: "HR001",
    captureDate: "2024-01-15",
    coordinates: { lat: -2.234, lng: 111.456 },
    imageUrl: "/api/satellite-images/sat_001_full.jpg",
    thumbnailUrl: "/api/satellite-images/sat_001_thumb.jpg",
    satellite: "Sentinel-2",
    resolution: "10m",
    cloudCover: 5,
    deforestationRisk: 'high',
    vegetationIndex: 0.72,
    changeDetected: true
  },
  {
    id: "sat_002",
    plotId: "plot_002",
    plotNumber: "MR005",
    captureDate: "2024-01-14",
    coordinates: { lat: -1.789, lng: 112.123 },
    imageUrl: "/api/satellite-images/sat_002_full.jpg",
    thumbnailUrl: "/api/satellite-images/sat_002_thumb.jpg",
    satellite: "Landsat-8",
    resolution: "30m",
    cloudCover: 12,
    deforestationRisk: 'medium',
    vegetationIndex: 0.68,
    changeDetected: false
  },
  {
    id: "sat_003",
    plotId: "plot_003",
    plotNumber: "DF003",
    captureDate: "2024-01-13",
    coordinates: { lat: -0.567, lng: 110.789 },
    imageUrl: "/api/satellite-images/sat_003_full.jpg",
    thumbnailUrl: "/api/satellite-images/sat_003_thumb.jpg",
    satellite: "Sentinel-2",
    resolution: "10m",
    cloudCover: 8,
    deforestationRisk: 'high',
    vegetationIndex: 0.45,
    changeDetected: true
  },
  {
    id: "sat_004",
    plotId: "plot_004",
    plotNumber: "LR010",
    captureDate: "2024-01-12",
    coordinates: { lat: -1.234, lng: 113.567 },
    imageUrl: "/api/satellite-images/sat_004_full.jpg",
    thumbnailUrl: "/api/satellite-images/sat_004_thumb.jpg",
    satellite: "Planet",
    resolution: "3m",
    cloudCover: 2,
    deforestationRisk: 'low',
    vegetationIndex: 0.85,
    changeDetected: false
  }
];

export default function SatelliteImagery() {
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("30");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch satellite images from API
  const { data: satelliteImages = [], isLoading, error } = useQuery({
    queryKey: ["/api/satellite-images"],
  });

  // Filter satellite data based on selections
  const filteredImages = satelliteImages.filter((image: SatelliteImage) => {
    const matchesPlot = selectedPlot === "" || image.plotId === selectedPlot;
    const matchesRisk = riskFilter === "all" || image.deforestationRisk === riskFilter;
    const matchesSearch = searchQuery === "" || 
      image.plotNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPlot && matchesRisk && matchesSearch;
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading satellite imagery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2">Error Loading Satellite Data</p>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Satellite className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Satellite Imagery Monitoring</h1>
              </div>
              <p className="text-gray-600">Visual verification and monitoring of palm oil plots using satellite imagery</p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search & Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Plot
                    </label>
                    <Input
                      placeholder="Enter plot number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-plot"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger data-testid="select-date-range">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Level
                    </label>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger data-testid="select-risk-filter">
                        <SelectValue placeholder="Select risk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risks</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="low">Low Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-apply-filters">
                      <Search className="w-4 h-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Images</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredImages.length}</p>
                    </div>
                    <Satellite className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Changes Detected</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {filteredImages.filter(img => img.changeDetected).length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">High Risk Plots</p>
                      <p className="text-2xl font-bold text-red-600">
                        {filteredImages.filter(img => img.deforestationRisk === 'high').length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Cloud Cover</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(filteredImages.reduce((sum, img) => sum + img.cloudCover, 0) / filteredImages.length || 0)}%
                      </p>
                    </div>
                    <Layers className="w-8 h-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Satellite Images Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Satellite Images ({filteredImages.length})
                  </span>
                  <Button variant="outline" size="sm" data-testid="button-export-images">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        {/* Placeholder for satellite image */}
                        <div className="w-full h-48 bg-gradient-to-br from-green-400 via-green-500 to-green-600 relative overflow-hidden">
                          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                          <div className="absolute top-2 left-2">
                            <Badge className={getRiskBadgeColor(image.deforestationRisk)}>
                              {getRiskIcon(image.deforestationRisk)}
                              <span className="ml-1 capitalize">{image.deforestationRisk}</span>
                            </Badge>
                          </div>
                          {image.changeDetected && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-orange-100 text-orange-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Change Detected
                              </Badge>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
                            Plot {image.plotNumber}
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">Plot {image.plotNumber}</h3>
                              <p className="text-sm text-gray-600">{image.satellite} • {image.resolution}</p>
                            </div>
                            <Button size="sm" variant="outline" data-testid={`button-view-${image.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Capture Date</p>
                              <p className="font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(image.captureDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Cloud Cover</p>
                              <p className="font-medium">{image.cloudCover}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">NDVI</p>
                              <p className="font-medium">{image.vegetationIndex.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Coordinates</p>
                              <p className="font-medium flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {image.coordinates.lat.toFixed(3)}, {image.coordinates.lng.toFixed(3)}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" data-testid={`button-analyze-${image.id}`}>
                              <Satellite className="w-4 h-4 mr-2" />
                              Analyze
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-download-${image.id}`}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredImages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Satellite className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No satellite images found</p>
                    <p>Try adjusting your search criteria or date range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}