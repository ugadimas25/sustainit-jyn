import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Satellite, Map, AlertTriangle, Shield, Plus, Search, Filter,
  MapPin, Globe, Camera, Layers, Calendar, TrendingDown,
  Activity, Eye, Target, CheckCircle2, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DeforestationMap } from "@/components/maps/deforestation-map";

interface Plot {
  id: string;
  plotId: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  area: number;
  status: 'compliant' | 'at-risk' | 'non-compliant';
  lastMonitored: string;
  supplier: string;
  certification: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface DeforestationAlert {
  id: string;
  plotId: string;
  plotName: string;
  alertDate: string;
  alertType: 'GLAD' | 'RADD' | 'FORMA' | 'Terra-i';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  area: number;
  status: 'new' | 'investigating' | 'resolved' | 'false-positive';
  coordinates: { lat: number; lng: number };
}

interface ProtectedArea {
  id: string;
  name: string;
  type: 'National Park' | 'Wildlife Reserve' | 'Forest Reserve' | 'Indigenous Land';
  status: 'Active' | 'Proposed';
  area: number;
  coordinates: { lat: number; lng: number };
}

interface MonitoringLayer {
  id: string;
  name: string;
  type: 'deforestation' | 'protected-areas' | 'legal-status' | 'fire-alerts';
  source: 'GFW' | 'WDPA' | 'KLHK' | 'Internal';
  isActive: boolean;
  lastUpdated: string;
}

export default function DeforestationMonitoring() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<DeforestationAlert | null>(null);
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [filterProvince, setFilterProvince] = useState("");
  const [filterRiskLevel, setFilterRiskLevel] = useState("");
  const [filterAlertType, setFilterAlertType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLayers, setActiveLayers] = useState<string[]>(['deforestation', 'protected-areas']);
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  const mockPlots: Plot[] = [
    {
      id: "plot-001",
      plotId: "PLT-RIAU-001",
      name: "Palm Plot A - Riau",
      location: "Riau Province, Indonesia",
      coordinates: { lat: 0.2933, lng: 101.7068 },
      area: 45.2,
      status: "compliant",
      lastMonitored: "2024-08-14",
      supplier: "Riau Growers Cooperative",
      certification: ["RSPO", "MSPO"],
      riskLevel: "low"
    },
    {
      id: "plot-002", 
      plotId: "PLT-SUMATRA-002",
      name: "Small Holder Plot B - Sumatra",
      location: "North Sumatra, Indonesia",
      coordinates: { lat: 3.5952, lng: 98.6722 },
      area: 12.8,
      status: "at-risk",
      lastMonitored: "2024-08-13",
      supplier: "Sumatra Smallholders Union",
      certification: ["RSPO"],
      riskLevel: "medium"
    },
    {
      id: "plot-003",
      plotId: "PLT-KALIMANTAN-003", 
      name: "Estate Plot C - Kalimantan",
      location: "Central Kalimantan, Indonesia",
      coordinates: { lat: -2.2118, lng: 113.9213 },
      area: 156.7,
      status: "non-compliant",
      lastMonitored: "2024-08-12",
      supplier: "Kalimantan Palm Estates",
      certification: [],
      riskLevel: "high"
    }
  ];

  const mockAlerts: DeforestationAlert[] = [
    {
      id: "alert-001",
      plotId: "plot-003",
      plotName: "Estate Plot C - Kalimantan",
      alertDate: "2024-08-14",
      alertType: "GLAD",
      severity: "high",
      confidence: 87,
      area: 2.3,
      status: "new",
      coordinates: { lat: -2.2118, lng: 113.9213 }
    },
    {
      id: "alert-002",
      plotId: "plot-002",
      plotName: "Small Holder Plot B - Sumatra", 
      alertDate: "2024-08-13",
      alertType: "RADD",
      severity: "medium",
      confidence: 72,
      area: 0.8,
      status: "investigating",
      coordinates: { lat: 3.5952, lng: 98.6722 }
    }
  ];

  const mockProtectedAreas: ProtectedArea[] = [
    {
      id: "pa-001",
      name: "Leuser National Park",
      type: "National Park",
      status: "Active",
      area: 7927,
      coordinates: { lat: 3.7000, lng: 97.6500 }
    },
    {
      id: "pa-002", 
      name: "Tesso Nilo National Park",
      type: "National Park",
      status: "Active",
      area: 835,
      coordinates: { lat: 0.2500, lng: 101.8500 }
    }
  ];

  const mockLayers: MonitoringLayer[] = [
    { id: 'deforestation', name: 'Deforestation Alerts', type: 'deforestation', source: 'GFW', isActive: true, lastUpdated: '2024-08-14' },
    { id: 'protected-areas', name: 'Protected Areas', type: 'protected-areas', source: 'WDPA', isActive: true, lastUpdated: '2024-08-01' },
    { id: 'legal-status', name: 'Legal Forest Status', type: 'legal-status', source: 'KLHK', isActive: false, lastUpdated: '2024-07-28' },
    { id: 'fire-alerts', name: 'Fire Alerts', type: 'fire-alerts', source: 'GFW', isActive: false, lastUpdated: '2024-08-14' }
  ];

  const plots = mockPlots;
  const alerts = mockAlerts;
  const protectedAreas = mockProtectedAreas;
  const layers = mockLayers;

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const filteredPlots = plots.filter(plot => {
    const matchesSearch = searchTerm === "" || 
      plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.plotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = filterProvince === "" || plot.location.includes(filterProvince);
    const matchesRisk = filterRiskLevel === "" || plot.riskLevel === filterRiskLevel;
    
    return matchesSearch && matchesProvince && matchesRisk;
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterAlertType === "" || alert.alertType === filterAlertType;
    return matchesType;
  });

  const handlePlotSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Add plot creation logic here
    toast({ title: "Plot added successfully!" });
    setShowPlotForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'at-risk': return 'bg-yellow-500';
      case 'non-compliant': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Deforestation Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Integrated EUDR monitoring with satellite imagery analysis and plot mapping
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Globe className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="plots" data-testid="tab-plots">
              <Map className="h-4 w-4 mr-2" />
              Plot Mapping
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Deforestation Alerts
            </TabsTrigger>
            <TabsTrigger value="monitoring" data-testid="tab-monitoring">
              <Satellite className="h-4 w-4 mr-2" />
              Live Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Map className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Plots</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{plots.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Alerts</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{alerts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Compliant Plots</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plots.filter(p => p.status === 'compliant').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Protected Areas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{protectedAreas.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <DeforestationMap
                plots={filteredPlots}
                alerts={filteredAlerts}
                protectedAreas={protectedAreas}
                activeLayers={activeLayers}
                onPlotClick={(plot) => setSelectedPlot(plot)}
                onAlertClick={(alert) => setSelectedAlert(alert)}
                className="lg:col-span-2"
              />

              <Card>
                <CardHeader>
                  <CardTitle>Layer Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Active Layers
                    </div>
                    <div className="space-y-2">
                      {layers.map(layer => (
                        <div key={layer.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleLayer(layer.id)}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                activeLayers.includes(layer.id)
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              data-testid={`toggle-layer-${layer.id}`}
                            >
                              {activeLayers.includes(layer.id) && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <span className="text-sm">{layer.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {layer.source}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map(alert => (
                      <div key={alert.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                          <span className="text-sm">{alert.plotName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alert.alertType}
                        </Badge>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No recent activity
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plot Mapping Tab */}
          <TabsContent value="plots" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Plot Management
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Manage farm plot polygons with GPS coordinates and compliance monitoring
                  </p>
                </div>
                <Dialog open={showPlotForm} onOpenChange={setShowPlotForm}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-plot">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Plot</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePlotSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="plotId">Plot ID *</Label>
                          <Input id="plotId" name="plotId" required placeholder="PLT-REGION-001" data-testid="input-plot-id" />
                        </div>
                        <div>
                          <Label htmlFor="plotName">Plot Name *</Label>
                          <Input id="plotName" name="plotName" required placeholder="Plot name" data-testid="input-plot-name" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input id="location" name="location" required placeholder="Province, Indonesia" data-testid="input-location" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="latitude">Latitude *</Label>
                          <Input id="latitude" name="latitude" type="number" step="any" required data-testid="input-latitude" />
                        </div>
                        <div>
                          <Label htmlFor="longitude">Longitude *</Label>
                          <Input id="longitude" name="longitude" type="number" step="any" required data-testid="input-longitude" />
                        </div>
                        <div>
                          <Label htmlFor="area">Area (hectares) *</Label>
                          <Input id="area" name="area" type="number" step="0.1" required data-testid="input-area" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="supplier">Supplier *</Label>
                          <Input id="supplier" name="supplier" required placeholder="Supplier name" data-testid="input-supplier" />
                        </div>
                        <div>
                          <Label htmlFor="certification">Certifications</Label>
                          <Input id="certification" name="certification" placeholder="RSPO, MSPO" data-testid="input-certification" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowPlotForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-submit-plot">
                          Add Plot
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-48">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search plots, suppliers..."
                        className="pl-10"
                        data-testid="input-search-plots"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="filterProvince">Province</Label>
                    <Select value={filterProvince} onValueChange={setFilterProvince}>
                      <SelectTrigger className="w-40" data-testid="select-province">
                        <SelectValue placeholder="All provinces" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Provinces</SelectItem>
                        <SelectItem value="Riau">Riau</SelectItem>
                        <SelectItem value="Sumatra">North Sumatra</SelectItem>
                        <SelectItem value="Kalimantan">Central Kalimantan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filterRisk">Risk Level</Label>
                    <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                      <SelectTrigger className="w-36" data-testid="select-risk-level">
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Levels</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Plots Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlots.map(plot => (
                    <Card 
                      key={plot.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlot?.id === plot.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedPlot(plot)}
                      data-testid={`plot-card-${plot.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{plot.name}</h4>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(plot.status)}`} />
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{plot.plotId}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">{plot.location}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-gray-500">Area:</span>
                            <p className="font-medium">{plot.area} ha</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Risk:</span>
                            <p className="font-medium capitalize">{plot.riskLevel}</p>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          Last monitored: {new Date(plot.lastMonitored).toLocaleDateString()}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {plot.certification.map(cert => (
                            <Badge key={cert} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Plot Details Sidebar */}
                {selectedPlot && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Plot Details - {selectedPlot.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Basic Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Plot ID:</span>
                                <span>{selectedPlot.plotId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Area:</span>
                                <span>{selectedPlot.area} hectares</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Location:</span>
                                <span>{selectedPlot.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Supplier:</span>
                                <span>{selectedPlot.supplier}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Coordinates</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Latitude:</span>
                                <span>{selectedPlot.coordinates.lat.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Longitude:</span>
                                <span>{selectedPlot.coordinates.lng.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Compliance Status</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedPlot.status)}`} />
                                <span className="capitalize">{selectedPlot.status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Risk Level:</span>
                                <Badge 
                                  variant={selectedPlot.riskLevel === 'low' ? 'default' : 
                                          selectedPlot.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                                >
                                  {selectedPlot.riskLevel.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Certifications</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedPlot.certification.length > 0 ? (
                                selectedPlot.certification.map(cert => (
                                  <Badge key={cert} variant="outline" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">No certifications</span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Monitoring</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Last monitored: {new Date(selectedPlot.lastMonitored).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deforestation Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Deforestation Alerts
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Real-time deforestation alerts from multiple satellite sources
                </p>
              </CardHeader>
              <CardContent>
                {/* Alert Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div>
                    <Label htmlFor="filterAlertType">Alert Source</Label>
                    <Select value={filterAlertType} onValueChange={setFilterAlertType}>
                      <SelectTrigger className="w-36" data-testid="select-alert-type">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Sources</SelectItem>
                        <SelectItem value="GLAD">GLAD</SelectItem>
                        <SelectItem value="RADD">RADD</SelectItem>
                        <SelectItem value="FORMA">FORMA</SelectItem>
                        <SelectItem value="Terra-i">Terra-i</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Alerts Grid */}
                <div className="space-y-4">
                  {filteredAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Deforestation Alerts
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        No recent deforestation alerts detected for monitored areas.
                      </p>
                    </div>
                  ) : (
                    filteredAlerts.map(alert => (
                      <Card 
                        key={alert.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedAlert?.id === alert.id ? 'ring-2 ring-orange-500' : ''
                        }`}
                        onClick={() => setSelectedAlert(alert)}
                        data-testid={`alert-card-${alert.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{alert.plotName}</h4>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                              <Badge variant="outline">
                                {alert.alertType}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <p className="font-medium">{new Date(alert.alertDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Area:</span>
                              <p className="font-medium">{alert.area} hectares</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Confidence:</span>
                              <p className="font-medium">{alert.confidence}%</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <Badge 
                                variant={alert.status === 'new' ? 'destructive' : 
                                        alert.status === 'investigating' ? 'secondary' : 'default'}
                                className="text-xs"
                              >
                                {alert.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Alert Details */}
                {selectedAlert && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Alert Details - {selectedAlert.plotName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Alert Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Alert Date:</span>
                                <span>{new Date(selectedAlert.alertDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Source:</span>
                                <span>{selectedAlert.alertType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Severity:</span>
                                <Badge variant={selectedAlert.severity === 'high' ? 'destructive' : 'secondary'}>
                                  {selectedAlert.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Confidence:</span>
                                <span>{selectedAlert.confidence}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Affected Area:</span>
                                <span>{selectedAlert.area} hectares</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Location</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Latitude:</span>
                                <span>{selectedAlert.coordinates.lat.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Longitude:</span>
                                <span>{selectedAlert.coordinates.lng.toFixed(4)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Actions</h4>
                            <div className="space-y-2">
                              <Button size="sm" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                View on Map
                              </Button>
                              <Button size="sm" variant="outline" className="w-full">
                                <Camera className="h-4 w-4 mr-2" />
                                View Satellite Imagery
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Satellite className="h-5 w-5" />
                      Live Satellite Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 flex items-center justify-center">
                      <div className="text-center">
                        <Satellite className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Live Satellite Feed</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Real-time monitoring with before/after imagery analysis
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full" />
                              <span>Active Monitoring</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full" />
                              <span>GFW Integration</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Monitoring Layers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {layers.map(layer => (
                        <div key={layer.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={activeLayers.includes(layer.id) ? "default" : "outline"}
                              onClick={() => toggleLayer(layer.id)}
                              data-testid={`toggle-layer-${layer.id}`}
                            >
                              {activeLayers.includes(layer.id) ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3 opacity-50" />}
                            </Button>
                            <div>
                              <p className="text-sm font-medium">{layer.name}</p>
                              <p className="text-xs text-gray-500">{layer.source}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {new Date(layer.lastUpdated).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monitoring Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Coverage Area:</span>
                        <span className="font-medium">
                          {plots.reduce((sum, plot) => sum + plot.area, 0).toFixed(1)} ha
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Active Plots:</span>
                        <span className="font-medium">{plots.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Alert Frequency:</span>
                        <span className="font-medium">Daily</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Last Update:</span>
                        <span className="font-medium">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}