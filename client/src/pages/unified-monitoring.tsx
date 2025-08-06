import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Map, 
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
  RefreshCw,
  BarChart3,
  Globe,
  Shield,
  FileText
} from "lucide-react";

interface Plot {
  id: string;
  plotNumber: string;
  polygon: [number, number][];
  businessEntity: string;
  province: string;
  district: string;
  village: string;
  complianceStatus: 'compliant' | 'low-risk' | 'medium-risk' | 'high-risk';
  risks: string[];
  permitStatus: string;
  permitExpiryDate: string;
  isInProtectedArea: boolean;
  deforestationDetected: boolean;
  treecoverLoss: number;
  lastVerified: string;
  plantingDate: string;
  area: string;
  coordinates: unknown;
  supplier: string;
}

interface DeforestationAlert {
  id: string;
  plotId: string;
  plotNumber: string;
  coordinates: [number, number];
  alertDate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  severity: 'critical' | 'high' | 'medium' | 'low';
  forestLossArea: number;
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

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  color: string;
}

export default function UnifiedMonitoring() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<DeforestationAlert | null>(null);
  
  // Filters for both map and alerts
  const [filters, setFilters] = useState({
    businessEntity: 'all',
    province: 'all',
    district: 'all',
    village: 'all',
    severity: 'all',
    source: 'all',
    status: 'all'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisType, setAnalysisType] = useState('EUDR');
  
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'wdpa', name: 'WDPA Protected Areas', description: 'World Database on Protected Areas', visible: false, color: '#22c55e' },
    { id: 'klhk', name: 'KLHK Legal Status', description: 'Ministry of Environment and Forestry', visible: false, color: '#3b82f6' },
    { id: 'gfw', name: 'GFW Deforestation', description: 'Global Forest Watch alerts', visible: true, color: '#ef4444' }
  ]);

  // Fetch data from APIs
  const { data: plots = [] } = useQuery<Plot[]>({
    queryKey: ['/api/country-map/plots']
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<DeforestationAlert[]>({
    queryKey: ['/api/deforestation-alerts'],
    refetchInterval: 30000
  });

  // Filter plots and alerts
  const filteredPlots = plots.filter(plot => {
    return (filters.businessEntity === 'all' || plot.businessEntity === filters.businessEntity) &&
           (filters.province === 'all' || plot.province === filters.province) &&
           (filters.district === 'all' || plot.district === filters.district) &&
           (filters.village === 'all' || plot.village === filters.village) &&
           (searchTerm === '' || plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const filteredAlerts = alerts.filter(alert => {
    return (filters.severity === 'all' || alert.severity === filters.severity) &&
           (filters.source === 'all' || alert.alertSource === filters.source) &&
           (filters.status === 'all' || alert.verificationStatus === filters.status) &&
           (searchTerm === '' || alert.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const uniqueValues = {
    businessEntities: Array.from(new Set(plots.map(p => p.businessEntity))),
    provinces: Array.from(new Set(plots.map(p => p.province))),
    districts: Array.from(new Set(plots.map(p => p.district))),
    villages: Array.from(new Set(plots.map(p => p.village)))
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const getRiskBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'low-risk': return 'secondary';
      case 'medium-risk': return 'outline';
      case 'high-risk': return 'destructive';
      default: return 'default';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'under-review': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'false-positive': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Controls */}
      <div className="w-80 border-r bg-card p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" data-testid="title-unified-monitoring">
              <Globe className="h-5 w-5" />
              EUDR Monitoring
            </h1>
            <p className="text-sm text-muted-foreground">
              Unified deforestation monitoring and spatial analysis
            </p>
          </div>

          {/* Analysis Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Analysis Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger data-testid="select-analysis-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUDR">EUDR Compliance</SelectItem>
                  <SelectItem value="deforestation">Deforestation Monitor</SelectItem>
                  <SelectItem value="legality">Legality Assessment</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search plots, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Business Entity</Label>
                <Select value={filters.businessEntity} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, businessEntity: value }))}>
                  <SelectTrigger data-testid="filter-business-entity">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    {uniqueValues.businessEntities.map(entity => (
                      <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Province</Label>
                <Select value={filters.province} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, province: value }))}>
                  <SelectTrigger data-testid="filter-province">
                    <SelectValue placeholder="All provinces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All provinces</SelectItem>
                    {uniqueValues.provinces.map(province => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Severity</Label>
                <Select value={filters.severity} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger data-testid="filter-severity">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Alert Source</Label>
                <Select value={filters.source} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger data-testid="filter-source">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="GLAD">GLAD</SelectItem>
                    <SelectItem value="RADD">RADD</SelectItem>
                    <SelectItem value="FORMA">FORMA</SelectItem>
                    <SelectItem value="Terra-i">Terra-i</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilters({ businessEntity: 'all', province: 'all', district: 'all', village: 'all', severity: 'all', source: 'all', status: 'all' })}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* Layer Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Layer Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {layers.map(layer => (
                <div key={layer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: layer.color }}
                    />
                    <div>
                      <div className="text-sm font-medium">{layer.name}</div>
                      <div className="text-xs text-muted-foreground">{layer.description}</div>
                    </div>
                  </div>
                  <Button
                    variant={layer.visible ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLayer(layer.id)}
                    data-testid={`toggle-layer-${layer.id}`}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Plots</span>
                <span className="font-medium">{filteredPlots.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Alerts</span>
                <span className="font-medium text-red-500">{filteredAlerts.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>High Risk</span>
                <span className="font-medium text-red-500">
                  {filteredPlots.filter(p => p.complianceStatus === 'high-risk').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Compliant</span>
                <span className="font-medium text-green-500">
                  {filteredPlots.filter(p => p.complianceStatus === 'compliant').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="map" data-testid="tab-map">
                <Map className="h-4 w-4 mr-2" />
                Spatial Map
              </TabsTrigger>
              <TabsTrigger value="alerts" data-testid="tab-alerts">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Deforestation Alerts
              </TabsTrigger>
              <TabsTrigger value="satellite" data-testid="tab-satellite">
                <Satellite className="h-4 w-4 mr-2" />
                Satellite Imagery
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 flex">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="hidden">
            <TabsList>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="satellite">Satellite</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1">
            <TabsContent value="map" className="h-full m-0">
              <div className="h-full bg-slate-100 dark:bg-slate-800 relative">
                {/* Map visualization placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Map className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">Interactive Map</h3>
                      <p className="text-sm text-muted-foreground">
                        Showing {filteredPlots.length} plots across Indonesia
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        {filteredPlots.slice(0, 4).map(plot => (
                          <div 
                            key={plot.id}
                            className="bg-background/80 p-3 rounded-lg cursor-pointer hover:bg-background"
                            onClick={() => setSelectedPlot(plot)}
                            data-testid={`plot-marker-${plot.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                plot.complianceStatus === 'compliant' ? 'bg-green-500' :
                                plot.complianceStatus === 'low-risk' ? 'bg-yellow-500' :
                                plot.complianceStatus === 'medium-risk' ? 'bg-orange-500' :
                                'bg-red-500'
                              }`} />
                              <span className="font-medium">{plot.plotNumber}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {plot.province}, {plot.district}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="h-full m-0">
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {alertsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold mt-4">No alerts found</h3>
                    <p className="text-muted-foreground">No deforestation alerts match your current filters</p>
                  </div>
                ) : (
                  filteredAlerts.map(alert => (
                    <Card 
                      key={alert.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedAlert(alert)}
                      data-testid={`alert-card-${alert.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {alert.plotNumber}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.supplierName} • {alert.district}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            {getStatusIcon(alert.verificationStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Forest Loss:</span>
                            <div className="font-medium">{alert.forestLossArea} hectares</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Alert Date:</span>
                            <div className="font-medium">{new Date(alert.alertDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Source:</span>
                            <div className="font-medium">{alert.alertSource}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <div className="font-medium capitalize">{alert.confidenceLevel}</div>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">GFW Analysis</div>
                          <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                            <div>
                              <div className="font-medium">{alert.gfwAnalysis.treeCoverLoss}%</div>
                              <div className="text-muted-foreground">Tree Loss</div>
                            </div>
                            <div>
                              <div className="font-medium">{alert.gfwAnalysis.biomassLoss}</div>
                              <div className="text-muted-foreground">Biomass Loss</div>
                            </div>
                            <div>
                              <div className="font-medium">{alert.gfwAnalysis.carbonEmissions}</div>
                              <div className="text-muted-foreground">CO₂ Emissions</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="satellite" className="h-full m-0">
              <div className="h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Satellite className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Satellite Imagery Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Select an alert or plot to view satellite imagery comparison
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

          {/* Details Panel */}
          {(selectedPlot || selectedAlert) && (
            <div className="w-96 border-l bg-card p-4 overflow-y-auto">
              {selectedPlot && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold" data-testid="plot-details-title">
                        Plot {selectedPlot.plotNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlot.businessEntity}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlot(null)}
                      data-testid="button-close-plot-details"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Badge variant={getRiskBadgeVariant(selectedPlot.complianceStatus)}>
                        {selectedPlot.complianceStatus}
                      </Badge>
                      {selectedPlot.deforestationDetected && (
                        <Badge variant="destructive" className="ml-2">
                          Deforestation Alert
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Area:</span>
                        <div className="font-medium">{selectedPlot.area} hectares</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Permit Status:</span>
                        <div className="font-medium">{selectedPlot.permitStatus}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Province:</span>
                        <div className="font-medium">{selectedPlot.province}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">District:</span>
                        <div className="font-medium">{selectedPlot.district}</div>
                      </div>
                    </div>

                    {selectedPlot.risks.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Risk Factors</div>
                        <div className="space-y-1">
                          {selectedPlot.risks.map((risk, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-medium mb-2">Forest Analysis</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tree Cover Loss:</span>
                          <span className="font-medium">{selectedPlot.treecoverLoss}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protected Area:</span>
                          <span className="font-medium">
                            {selectedPlot.isInProtectedArea ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Verified:</span>
                          <span className="font-medium">{selectedPlot.lastVerified}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAlert && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold" data-testid="alert-details-title">
                        Alert {selectedAlert.plotNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedAlert.supplierName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAlert(null)}
                      data-testid="button-close-alert-details"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(selectedAlert.severity)}>
                        {selectedAlert.severity}
                      </Badge>
                      {getStatusIcon(selectedAlert.verificationStatus)}
                      <span className="text-sm">{selectedAlert.verificationStatus}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Forest Loss:</span>
                        <div className="font-medium">{selectedAlert.forestLossArea} ha</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Alert Date:</span>
                        <div className="font-medium">{new Date(selectedAlert.alertDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <div className="font-medium">{selectedAlert.alertSource}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <div className="font-medium capitalize">{selectedAlert.confidenceLevel}</div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-medium mb-2">GFW Analysis</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tree Cover Loss:</span>
                          <span className="font-medium">{selectedAlert.gfwAnalysis.treeCoverLoss}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Biomass Loss:</span>
                          <span className="font-medium">{selectedAlert.gfwAnalysis.biomassLoss} tons</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CO₂ Emissions:</span>
                          <span className="font-medium">{selectedAlert.gfwAnalysis.carbonEmissions} tons</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protected Area:</span>
                          <span className="font-medium">
                            {selectedAlert.gfwAnalysis.protectedAreaOverlap ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Primary Forest:</span>
                          <span className="font-medium">
                            {selectedAlert.gfwAnalysis.primaryForestLoss ? 'Loss Detected' : 'No Loss'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-medium mb-2">Satellite Imagery</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Capture Date:</span>
                          <span className="font-medium">{selectedAlert.satelliteImagery.captureDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resolution:</span>
                          <span className="font-medium">{selectedAlert.satelliteImagery.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cloud Cover:</span>
                          <span className="font-medium">{selectedAlert.satelliteImagery.cloudCover}%</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" data-testid="button-verify-alert">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Alert
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}