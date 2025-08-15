import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatedGeospatialMap } from './animated-geospatial-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapIcon, Filter, Download } from 'lucide-react';

interface SupplyChainFlowMapProps {
  className?: string;
}

export const SupplyChainFlowMap = ({ className }: SupplyChainFlowMapProps) => {
  const [playSpeed, setPlaySpeed] = useState(2);
  const [visualizationMode, setVisualizationMode] = useState<'heatmap' | 'clusters' | 'flow' | 'risk'>('flow');
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date()
  ]);

  // Fetch supply chain data
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['/api/facilities'],
  });

  const { data: shipments = [] } = useQuery<any[]>({
    queryKey: ['/api/shipments'],
  });

  const { data: workflowShipments = [] } = useQuery<any[]>({
    queryKey: ['/api/workflow-shipments'],
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: plots = [] } = useQuery<any[]>({
    queryKey: ['/api/plots'],
  });

  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ['/api/alerts'],
  });

  // Transform data for animated visualization
  const geospatialData = [
    // Facilities as data points
    ...facilities.map(facility => ({
      id: `facility-${facility.id}`,
      lat: facility.latitude || 0,
      lng: facility.longitude || 0,
      timestamp: new Date(facility.createdAt || Date.now()),
      value: 1000, // Base facility value
      type: 'facility' as const,
      metadata: {
        name: facility.name,
        category: facility.type,
        status: 'active',
      }
    })),

    // Workflow shipments as moving data points
    ...workflowShipments.map(shipment => ({
      id: `shipment-${shipment.id}`,
      lat: parseFloat(shipment.destinationCoordinates?.split(',')[0] || '0'),
      lng: parseFloat(shipment.destinationCoordinates?.split(',')[1] || '0'),
      timestamp: new Date(shipment.shipmentDate),
      value: parseFloat(shipment.quantity) || 0,
      type: 'shipment' as const,
      metadata: {
        name: `Shipment ${shipment.shipmentNumber}`,
        category: shipment.commodity,
        volume: parseFloat(shipment.quantity) || 0,
        status: shipment.status
      }
    })),

    // Plots as compliance points
    ...plots.map(plot => ({
      id: `plot-${plot.id}`,
      lat: plot.latitude || 0,
      lng: plot.longitude || 0,
      timestamp: new Date(plot.createdAt || Date.now()),
      value: plot.areaHectares || 0,
      type: 'compliance' as const,
      metadata: {
        name: plot.plotId,
        category: 'agricultural_plot',
        risk_level: plot.complianceStatus === 'compliant' ? 'low' : 
                   plot.complianceStatus === 'at_risk' ? 'medium' : 'high'
      }
    })),

    // Deforestation alerts as risk points
    ...alerts.map(alert => ({
      id: `alert-${alert.id}`,
      lat: alert.latitude,
      lng: alert.longitude,
      timestamp: new Date(alert.alertDate),
      value: alert.confidenceLevel || 0,
      type: 'deforestation' as const,
      metadata: {
        name: `Alert ${alert.id.slice(0, 8)}`,
        category: alert.alertType,
        risk_level: alert.confidenceLevel > 0.7 ? 'high' : 
                   alert.confidenceLevel > 0.4 ? 'medium' : 'low'
      }
    }))
  ].filter(point => point.lat !== 0 && point.lng !== 0); // Filter out invalid coordinates

  // Create animated routes from supply chain linkages
  const supplyChainRoutes = workflowShipments.map(shipment => {
    const origin = facilities.find(f => f.id === shipment.originFacilityId);
    const destination = facilities.find(f => f.id === shipment.destinationFacilityId);

    if (!origin || !destination) return null;

    return {
      id: `route-${shipment.id}`,
      path: [
        [origin.latitude || 0, origin.longitude || 0],
        [destination.latitude || 0, destination.longitude || 0]
      ] as [number, number][],
      color: getRouteColor(shipment.commodity),
      animated: true,
      metadata: {
        shipmentId: shipment.shipmentNumber,
        origin: origin.name,
        destination: destination.name,
        commodity: shipment.commodity,
        volume: parseFloat(shipment.quantity) || 0
      }
    };
  }).filter(Boolean) as any[];

  // Color coding for different commodities
  function getRouteColor(commodity: string): string {
    const colors: Record<string, string> = {
      'palm_oil': '#22c55e',     // green
      'palm_kernel': '#f59e0b',   // amber  
      'crude_oil': '#3b82f6',     // blue
      'refined_oil': '#8b5cf6',   // purple
      'ffb': '#10b981',           // emerald
      'cpo': '#06b6d4',           // cyan
      default: '#6b7280'          // gray
    };
    return colors[commodity] || colors.default;
  }

  const handleDataPointClick = (point: any) => {
    console.log('Data point clicked:', point);
    // Could open detailed modal or navigate to specific module
  };

  const handleRouteClick = (route: any) => {
    console.log('Route clicked:', route);
    // Could show shipment tracking details
  };

  const exportVisualization = () => {
    // Mock export functionality
    const data = {
      timestamp: new Date().toISOString(),
      visualization_mode: visualizationMode,
      data_points: geospatialData.length,
      routes: supplyChainRoutes.length,
      time_range: timeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-visualization-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-6 w-6 text-blue-500" />
              Animated Supply Chain Flow Visualization
              <Badge variant="outline" className="ml-auto">
                Real-time Data
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Visualization Mode */}
              <div>
                <label className="text-sm font-medium mb-2 block">Visualization Mode</label>
                <Select value={visualizationMode} onValueChange={(value: any) => setVisualizationMode(value)}>
                  <SelectTrigger data-testid="select-visualization-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flow">Supply Chain Flow</SelectItem>
                    <SelectItem value="heatmap">Activity Heatmap</SelectItem>
                    <SelectItem value="clusters">Point Clusters</SelectItem>
                    <SelectItem value="risk">Risk Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Animation Speed */}
              <div>
                <label className="text-sm font-medium mb-2 block">Animation Speed</label>
                <div className="px-3">
                  <Slider
                    value={[playSpeed]}
                    onValueChange={([value]) => setPlaySpeed(value)}
                    min={0.5}
                    max={5}
                    step={0.5}
                    className="w-full"
                    data-testid="slider-animation-speed"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{playSpeed}x speed</div>
                </div>
              </div>

              {/* Time Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Time Range</label>
                <Select defaultValue="30days">
                  <SelectTrigger data-testid="select-time-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Controls */}
              <div className="flex items-end gap-2">
                <Button 
                  onClick={exportVisualization}
                  variant="outline" 
                  size="sm"
                  data-testid="button-export-visualization"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-filter-layers"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Animated Map */}
        <AnimatedGeospatialMap
          data={geospatialData}
          routes={supplyChainRoutes}
          timeRange={timeRange}
          playSpeed={playSpeed}
          onDataPointClick={handleDataPointClick}
          onRouteClick={handleRouteClick}
          visualizationMode={visualizationMode}
        />

        {/* Data Insights Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supply Chain Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Active Facilities:</span>
                  <Badge variant="secondary">{facilities.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Shipments:</span>
                  <Badge variant="secondary">{workflowShipments.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monitored Plots:</span>
                  <Badge variant="secondary">{plots.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Volume:</span>
                  <Badge variant="secondary">
                    {workflowShipments.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0).toLocaleString()} MT
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">High Risk Alerts:</span>
                  <Badge variant="destructive">
                    {alerts.filter(a => (a.confidenceLevel || 0) > 0.7).length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Medium Risk:</span>
                  <Badge variant="default">
                    {alerts.filter(a => (a.confidenceLevel || 0) > 0.4 && (a.confidenceLevel || 0) <= 0.7).length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Compliant Plots:</span>
                  <Badge variant="secondary">
                    {plots.filter(p => p.complianceStatus === 'compliant').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Coverage:</span>
                  <Badge variant="outline">
                    {plots.reduce((sum, p) => sum + (p.areaHectares || 0), 0).toLocaleString()} ha
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visualization Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Data Points:</span>
                  <Badge variant="secondary">{geospatialData.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Supply Routes:</span>
                  <Badge variant="secondary">{supplyChainRoutes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Visualization Mode:</span>
                  <Badge variant="outline">{visualizationMode}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Animation Speed:</span>
                  <Badge variant="outline">{playSpeed}x</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};