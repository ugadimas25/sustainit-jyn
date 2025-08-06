import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Map, 
  Layers, 
  Filter, 
  Search,
  MapPin,
  AlertTriangle,
  Shield,
  Calendar,
  Trees,
  Building2,
  Info
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Plot {
  id: string;
  plotNumber: string;
  supplier: string;
  businessEntity: string;
  province: string;
  district: string;
  village: string;
  polygon: number[][];
  area: number;
  plantingDate: string;
  complianceStatus: 'compliant' | 'high-risk' | 'medium-risk' | 'low-risk';
  risks: string[];
  permitStatus: string;
  permitExpiryDate: string;
  isInProtectedArea: boolean;
  deforestationDetected: boolean;
  treecoverLoss: number;
  lastVerified: string;
}

interface LayerConfig {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

const riskColors = {
  'compliant': '#22c55e',
  'low-risk': '#eab308',
  'medium-risk': '#f97316',
  'high-risk': '#ef4444'
};

const mockPlots: Plot[] = [
  {
    id: '1',
    plotNumber: 'KPN-001',
    supplier: 'PT Sari Tani',
    businessEntity: 'KPN Plantations',
    province: 'Riau',
    district: 'Pelalawan',
    village: 'Pangkalan Kerinci',
    polygon: [[101.2345, 0.1234], [101.2400, 0.1234], [101.2400, 0.1300], [101.2345, 0.1300]],
    area: 25,
    plantingDate: '2019-03-15',
    complianceStatus: 'compliant',
    risks: [],
    permitStatus: 'Valid',
    permitExpiryDate: '2029-03-15',
    isInProtectedArea: false,
    deforestationDetected: false,
    treecoverLoss: 0,
    lastVerified: '2025-08-05'
  },
  {
    id: '2',
    plotNumber: 'KPN-002',
    supplier: 'CV Mandiri Jaya',
    businessEntity: 'KPN Plantations',
    province: 'Sumatra Utara',
    district: 'Labuhan Batu',
    village: 'Sei Balai',
    polygon: [[99.1234, 2.3456], [99.1300, 2.3456], [99.1300, 2.3520], [99.1234, 2.3520]],
    area: 18,
    plantingDate: '2020-11-22',
    complianceStatus: 'high-risk',
    risks: ['Located in protected forest area', 'Deforestation detected'],
    permitStatus: 'Expired',
    permitExpiryDate: '2024-11-22',
    isInProtectedArea: true,
    deforestationDetected: true,
    treecoverLoss: 12,
    lastVerified: '2025-08-03'
  },
  {
    id: '3',
    plotNumber: 'KPN-003',
    supplier: 'PT Green Palm',
    businessEntity: 'KPN Plantations',
    province: 'Kalimantan Barat',
    district: 'Pontianak',
    village: 'Sungai Raya',
    polygon: [[109.3456, -0.0234], [109.3520, -0.0234], [109.3520, -0.0170], [109.3456, -0.0170]],
    area: 32,
    plantingDate: '2018-07-08',
    complianceStatus: 'medium-risk',
    risks: ['Permit expiring soon'],
    permitStatus: 'Expiring Soon',
    permitExpiryDate: '2025-12-08',
    isInProtectedArea: false,
    deforestationDetected: false,
    treecoverLoss: 3,
    lastVerified: '2025-08-04'
  }
];

export default function CountryMap() {
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [filters, setFilters] = useState({
    businessEntity: '',
    province: '',
    district: '',
    village: ''
  });
  
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'wdpa', name: 'WDPA Protected Areas', visible: true, color: '#10b981' },
    { id: 'klhk', name: 'KLHK Legal Status', visible: true, color: '#3b82f6' },
    { id: 'gfw', name: 'GFW Forest Cover', visible: true, color: '#f59e0b' },
    { id: 'plots', name: 'Plot Polygons', visible: true, color: '#8b5cf6' }
  ]);

  const [analysisType, setAnalysisType] = useState('EUDR');

  const { data: plots = mockPlots } = useQuery<Plot[]>({
    queryKey: ['/api/country-map/plots']
  });

  const filteredPlots = plots.filter(plot => {
    return (!filters.businessEntity || plot.businessEntity === filters.businessEntity) &&
           (!filters.province || plot.province === filters.province) &&
           (!filters.district || plot.district === filters.district) &&
           (!filters.village || plot.village === filters.village);
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

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Controls */}
      <div className="w-80 border-r bg-card p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" data-testid="title-country-map">
              <Map className="h-5 w-5" />
              Country Map Analysis
            </h1>
            <p className="text-sm text-muted-foreground">
              Interactive map with plot visualization and layer analysis
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
                  <SelectItem value="deforestation">Deforestation Reference</SelectItem>
                  <SelectItem value="legality">Legality Map</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectItem value="">All entities</SelectItem>
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
                    <SelectItem value="">All provinces</SelectItem>
                    {uniqueValues.provinces.map(province => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">District</Label>
                <Select value={filters.district} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, district: value }))}>
                  <SelectTrigger data-testid="filter-district">
                    <SelectValue placeholder="All districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All districts</SelectItem>
                    {uniqueValues.districts.map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Village</Label>
                <Select value={filters.village} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, village: value }))}>
                  <SelectTrigger data-testid="filter-village">
                    <SelectValue placeholder="All villages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All villages</SelectItem>
                    {uniqueValues.villages.map(village => (
                      <SelectItem key={village} value={village}>{village}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFilters({ businessEntity: '', province: '', district: '', village: '' })}
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
            <CardContent className="space-y-3">
              {layers.map(layer => (
                <div key={layer.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={layer.id}
                    checked={layer.visible}
                    onCheckedChange={() => toggleLayer(layer.id)}
                    data-testid={`layer-${layer.id}`}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: layer.color }}
                    />
                    <Label htmlFor={layer.id} className="text-xs">{layer.name}</Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plot Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Plot Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="location" defaultChecked data-testid="action-plot-location" />
                <Label htmlFor="location" className="text-xs">Plot Location</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="info" defaultChecked data-testid="action-plot-info" />
                <Label htmlFor="info" className="text-xs">Plot Info</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="polygon" defaultChecked data-testid="action-plot-polygon" />
                <Label htmlFor="polygon" className="text-xs">Plot Polygon</Label>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search plots..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
              data-testid="input-search-plots"
            />
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        {/* Map Container */}
        <div className="w-full h-full bg-slate-100 relative overflow-hidden">
          {/* Simulated Map Background */}
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-200 to-green-200 relative"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          >
            {/* Simulated Country Outline */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Indonesia outline simulation */}
                <div className="w-96 h-64 bg-green-300 opacity-60 rounded-3xl transform rotate-12 relative">
                  <div className="absolute top-4 right-8 w-20 h-16 bg-green-400 rounded-2xl"></div>
                  <div className="absolute bottom-8 left-12 w-32 h-12 bg-green-400 rounded-xl"></div>
                  <div className="absolute top-12 left-8 w-16 h-8 bg-green-400 rounded-lg"></div>
                </div>
                
                {/* Plot markers */}
                {filteredPlots.map((plot, index) => (
                  <div
                    key={plot.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${30 + (index * 15)}%`,
                      top: `${40 + (index * 10)}%`
                    }}
                    onClick={() => setSelectedPlot(plot)}
                    data-testid={`plot-marker-${plot.id}`}
                  >
                    {/* Polygon representation */}
                    <div 
                      className="w-8 h-8 border-2 rounded opacity-80"
                      style={{ 
                        backgroundColor: riskColors[plot.complianceStatus as keyof typeof riskColors],
                        borderColor: plot.complianceStatus === 'high-risk' ? '#dc2626' : '#374151'
                      }}
                    />
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white px-1 rounded shadow">
                      {plot.plotNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map controls */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button size="sm" variant="outline" data-testid="button-satellite-view">
                Satellite
              </Button>
              <Button size="sm" variant="outline" data-testid="button-terrain-view">
                Terrain
              </Button>
              <Button size="sm" variant="outline" data-testid="button-dark-view">
                Dark
              </Button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
              <h4 className="text-sm font-medium mb-2">Compliance Status</h4>
              <div className="space-y-1">
                {Object.entries(riskColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                    <span className="text-xs capitalize">{status.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plot Details Panel */}
        {selectedPlot && (
          <div className="absolute top-4 left-4 w-80 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg" data-testid="plot-details-title">
                  {selectedPlot.plotNumber}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedPlot(null)}
                  data-testid="button-close-plot-details"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getRiskBadgeVariant(selectedPlot.complianceStatus)}>
                    {selectedPlot.complianceStatus.replace('-', ' ').toUpperCase()}
                  </Badge>
                  {selectedPlot.deforestationDetected && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Deforestation
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{selectedPlot.supplier}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Area</Label>
                    <p className="font-medium">{selectedPlot.area} ha</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Province</Label>
                    <p className="font-medium">{selectedPlot.province}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">District</Label>
                    <p className="font-medium">{selectedPlot.district}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Planting Date
                  </Label>
                  <p className="font-medium text-sm">
                    {new Date(selectedPlot.plantingDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Permit Status
                  </Label>
                  <p className="font-medium text-sm">{selectedPlot.permitStatus}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(selectedPlot.permitExpiryDate).toLocaleDateString()}
                  </p>
                </div>

                {selectedPlot.risks.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Risk Factors
                    </Label>
                    <div className="space-y-1">
                      {selectedPlot.risks.map((risk, index) => (
                        <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Trees className="h-3 w-3" />
                    Forest Analysis
                  </Label>
                  <div className="text-sm space-y-1">
                    <p>Tree Cover Loss: {selectedPlot.treecoverLoss}%</p>
                    <p>Protected Area: {selectedPlot.isInProtectedArea ? 'Yes' : 'No'}</p>
                    <p className="text-xs text-muted-foreground">
                      Last Verified: {new Date(selectedPlot.lastVerified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}