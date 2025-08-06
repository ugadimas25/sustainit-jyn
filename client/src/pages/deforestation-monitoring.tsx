import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Satellite, 
  AlertTriangle, 
  MapPin, 
  Search, 
  Download, 
  Eye, 
  Calendar,
  TreePine,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Filter,
  RefreshCw
} from "lucide-react";

interface DeforestationAlert {
  id: string;
  plotId: string;
  plotNumber: string;
  coordinates: [number, number];
  alertDate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  severity: 'critical' | 'high' | 'medium' | 'low';
  forestLossArea: number; // hectares
  alertSource: 'GLAD' | 'RADD' | 'FORMA' | 'Terra-i';
  supplierName: string;
  businessUnit: string;
  village: string;
  district: string;
  verificationStatus: 'verified' | 'under-review' | 'false-positive' | 'pending';
  gfwAnalysis: {
    treeCoverLoss: number;
    treeCoverGain: number;
    biomassLoss: number;
    carbonEmissions: number;
    protectedAreaOverlap: boolean;
    primaryForestLoss: boolean;
  };
  satelliteImagery: {
    beforeImage: string;
    afterImage: string;
    captureDate: string;
    resolution: string;
    cloudCover: number;
  };
}

// Sample deforestation data with GFW integration
const sampleDeforestationData: DeforestationAlert[] = [
  {
    id: "alert_001",
    plotId: "plot_002",
    plotNumber: "KPN-002",
    coordinates: [-1.789, 112.123],
    alertDate: "2024-01-14",
    confidenceLevel: "high",
    severity: "critical",
    forestLossArea: 12.5,
    alertSource: "GLAD",
    supplierName: "PT Wilmar International",
    businessUnit: "Plantation South",
    village: "Desa Sejahtera",
    district: "Jambi Selatan",
    verificationStatus: "verified",
    gfwAnalysis: {
      treeCoverLoss: 12.5,
      treeCoverGain: 0.2,
      biomassLoss: 420,
      carbonEmissions: 1680,
      protectedAreaOverlap: false,
      primaryForestLoss: true
    },
    satelliteImagery: {
      beforeImage: "/api/satellite-images/before_002.jpg",
      afterImage: "/api/satellite-images/after_002.jpg",
      captureDate: "2024-01-15",
      resolution: "10m",
      cloudCover: 15
    }
  },
  {
    id: "alert_002",
    plotId: "plot_005",
    plotNumber: "KPN-005",
    coordinates: [-2.567, 111.234],
    alertDate: "2024-01-11",
    confidenceLevel: "high",
    severity: "high",
    forestLossArea: 8.3,
    alertSource: "RADD",
    supplierName: "PT Musim Mas Group",
    businessUnit: "Estate Management",
    village: "Desa Maju",
    district: "Riau Selatan",
    verificationStatus: "under-review",
    gfwAnalysis: {
      treeCoverLoss: 8.3,
      treeCoverGain: 0.0,
      biomassLoss: 280,
      carbonEmissions: 1120,
      protectedAreaOverlap: true,
      primaryForestLoss: true
    },
    satelliteImagery: {
      beforeImage: "/api/satellite-images/before_005.jpg",
      afterImage: "/api/satellite-images/after_005.jpg",
      captureDate: "2024-01-12",
      resolution: "10m",
      cloudCover: 8
    }
  },
  {
    id: "alert_003",
    plotId: "plot_003",
    plotNumber: "KPN-003",
    coordinates: [-0.567, 110.789],
    alertDate: "2024-01-10",
    confidenceLevel: "medium",
    severity: "medium",
    forestLossArea: 3.2,
    alertSource: "FORMA",
    supplierName: "PT Astra Agro Lestari",
    businessUnit: "Plantation Central",
    village: "Desa Berkah",
    district: "Sumatra Utara",
    verificationStatus: "pending",
    gfwAnalysis: {
      treeCoverLoss: 3.2,
      treeCoverGain: 0.1,
      biomassLoss: 110,
      carbonEmissions: 440,
      protectedAreaOverlap: false,
      primaryForestLoss: false
    },
    satelliteImagery: {
      beforeImage: "/api/satellite-images/before_003.jpg",
      afterImage: "/api/satellite-images/after_003.jpg",
      captureDate: "2024-01-11",
      resolution: "30m",
      cloudCover: 25
    }
  }
];

export default function DeforestationMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [selectedAlert, setSelectedAlert] = useState<DeforestationAlert | null>(null);

  // Fetch deforestation alerts from API
  const { data: alerts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/deforestation-alerts"],
    queryFn: () => Promise.resolve(sampleDeforestationData) // Use sample data for now
  });

  // Filter alerts based on search and filters
  const filteredAlerts = alerts.filter((alert: DeforestationAlert) => {
    const matchesSearch = searchQuery === "" || 
      alert.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.village.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.verificationStatus === statusFilter;
    const matchesSource = sourceFilter === "all" || alert.alertSource === sourceFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesSource;
  });

  // Helper functions for status badges
  const getSeverityBadge = (severity: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    switch (severity) {
      case 'critical': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}><AlertTriangle className="w-3 h-3" />Critical</Badge>;
      case 'high': return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}><AlertTriangle className="w-3 h-3" />High</Badge>;
      case 'medium': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}><AlertTriangle className="w-3 h-3" />Medium</Badge>;
      case 'low': return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}><AlertTriangle className="w-3 h-3" />Low</Badge>;
      default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'verified': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}><XCircle className="w-3 h-3" />Verified Loss</Badge>;
      case 'under-review': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}><Clock className="w-3 h-3" />Under Review</Badge>;
      case 'false-positive': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-3 h-3" />False Positive</Badge>;
      case 'pending': return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}><Clock className="w-3 h-3" />Pending</Badge>;
      default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full";
    switch (confidence) {
      case 'high': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>High Confidence</Badge>;
      case 'medium': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium Confidence</Badge>;
      case 'low': return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>Low Confidence</Badge>;
      default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-neutral-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading deforestation alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-neutral-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium mb-2">Error Loading Alerts</p>
            <p className="text-gray-600 mb-4">Failed to load deforestation monitoring data</p>
            <Button onClick={() => refetch()} className="bg-forest text-white hover:bg-green-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <TreePine className="w-6 h-6 text-green-600" />
                  Deforestation Monitoring
                </h1>
                <p className="text-gray-600 mt-1">Real-time forest loss detection using Global Forest Watch and satellite imagery</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
                <Button className="bg-forest text-white hover:bg-green-700" data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter & Search Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Alerts
                    </label>
                    <Input
                      placeholder="Plot, supplier, location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-alerts"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity Level
                    </label>
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger data-testid="select-severity">
                        <SelectValue placeholder="All Severities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Severities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="verified">Verified Loss</SelectItem>
                        <SelectItem value="under-review">Under Review</SelectItem>
                        <SelectItem value="false-positive">False Positive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alert Source
                    </label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger data-testid="select-source">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="GLAD">GLAD</SelectItem>
                        <SelectItem value="RADD">RADD</SelectItem>
                        <SelectItem value="FORMA">FORMA</SelectItem>
                        <SelectItem value="Terra-i">Terra-i</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger data-testid="select-date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Alerts</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredAlerts.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Verified Loss</p>
                      <p className="text-2xl font-bold text-red-600">
                        {filteredAlerts.filter(alert => alert.verificationStatus === 'verified').length}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Under Review</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {filteredAlerts.filter(alert => alert.verificationStatus === 'under-review').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Forest Loss</p>
                      <p className="text-2xl font-bold text-red-600">
                        {filteredAlerts.reduce((sum, alert) => sum + alert.forestLossArea, 0).toFixed(1)} Ha
                      </p>
                    </div>
                    <TreePine className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alerts Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="w-5 h-5" />
                  Deforestation Alerts ({filteredAlerts.length} alerts)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid="button-map-view">
                    <MapPin className="w-4 h-4 mr-2" />
                    Map View
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-satellite-view">
                    <Satellite className="w-4 h-4 mr-2" />
                    Satellite View
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Alert Details</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Plot Information</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Forest Loss Analysis</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">GFW Analysis</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Verification</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="space-y-2">
                            <div className="font-medium text-blue-600">{alert.id}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(alert.alertDate).toLocaleDateString()}
                            </div>
                            <div className="flex flex-col gap-1">
                              {getSeverityBadge(alert.severity)}
                              {getConfidenceBadge(alert.confidenceLevel)}
                            </div>
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {alert.alertSource}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div>
                            <div className="font-medium">{alert.plotNumber}</div>
                            <div className="text-gray-600">{alert.supplierName}</div>
                            <div className="text-gray-500 text-xs">{alert.businessUnit}</div>
                            <div className="text-gray-500 text-xs">{alert.village}, {alert.district}</div>
                            <div className="text-gray-400 text-xs font-mono">
                              {alert.coordinates[0].toFixed(3)}, {alert.coordinates[1].toFixed(3)}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Area Lost:</span>
                              <span className="font-medium text-red-600">{alert.forestLossArea} ha</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Biomass:</span>
                              <span className="font-medium">{alert.gfwAnalysis.biomassLoss} t</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">CO₂:</span>
                              <span className="font-medium">{alert.gfwAnalysis.carbonEmissions} t</span>
                            </div>
                            {alert.gfwAnalysis.primaryForestLoss && (
                              <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Primary Forest Loss
                              </div>
                            )}
                            {alert.gfwAnalysis.protectedAreaOverlap && (
                              <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Protected Area
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tree Loss:</span>
                              <span className="font-medium">{alert.gfwAnalysis.treeCoverLoss} ha</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tree Gain:</span>
                              <span className="font-medium text-green-600">{alert.gfwAnalysis.treeCoverGain} ha</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Source: Global Forest Watch
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {getVerificationBadge(alert.verificationStatus)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedAlert(alert)}
                              data-testid={`button-view-${alert.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-satellite-${alert.id}`}>
                              <Satellite className="w-4 h-4 mr-1" />
                              Imagery
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TreePine className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No deforestation alerts found</p>
                  <p>Try adjusting your search criteria or filters</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Detail Modal would go here */}
          {selectedAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Alert Details: {selectedAlert.id}</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedAlert(null)}
                    data-testid="button-close-modal"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Satellite Imagery Comparison</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Before (Reference)</p>
                        <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                          <Satellite className="w-12 h-12 text-gray-400" />
                          <span className="ml-2 text-gray-500">Before Image</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">After (Alert Date)</p>
                        <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                          <Satellite className="w-12 h-12 text-gray-400" />
                          <span className="ml-2 text-gray-500">After Image</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Global Forest Watch Analysis</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Tree Cover Loss:</span>
                            <span className="font-medium ml-2">{selectedAlert.gfwAnalysis.treeCoverLoss} ha</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Biomass Loss:</span>
                            <span className="font-medium ml-2">{selectedAlert.gfwAnalysis.biomassLoss} tonnes</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Carbon Emissions:</span>
                            <span className="font-medium ml-2">{selectedAlert.gfwAnalysis.carbonEmissions} t CO₂</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Tree Cover Gain:</span>
                            <span className="font-medium ml-2 text-green-600">{selectedAlert.gfwAnalysis.treeCoverGain} ha</span>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="space-y-2">
                          {selectedAlert.gfwAnalysis.primaryForestLoss && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm">Primary forest loss detected</span>
                            </div>
                          )}
                          {selectedAlert.gfwAnalysis.protectedAreaOverlap && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span className="text-sm">Overlaps with protected area</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-green-600 text-white hover:bg-green-700">
                          Mark as False Positive
                        </Button>
                        <Button className="flex-1 bg-red-600 text-white hover:bg-red-700">
                          Verify Deforestation
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}