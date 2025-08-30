import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, X, RotateCcw } from "lucide-react";
import { useLocation, useRouter } from "wouter";

interface AnalysisResult {
  plotId: string;
  country: string;
  area: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  complianceStatus: 'COMPLIANT' | 'NON-COMPLIANT';
  gfwLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  jrcLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  sbtnLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  highRiskDatasets: string[];
  gfwLossArea?: number;
  jrcLossArea?: number;
  sbtnLossArea?: number;
  geometry?: any;
}

const legendCategories = [
  { name: "Unproblematic", color: "#10b981", enabled: true },
  { name: "Major Overlapping", color: "#dc2626", enabled: true },
  { name: "Minor Overlapping", color: "#3b82f6", enabled: true },
  { name: "Duplicate/Major Overlapping", color: "#9333ea", enabled: true },
  { name: "Malformed/Major Overlapping", color: "#eab308", enabled: false },
  { name: "Malformed/Minor Overlapping", color: "#a16207", enabled: false },
  { name: "Self-intersect/Malformed", color: "#6b7280", enabled: false },
  { name: "Malformed", color: "#f97316", enabled: false },
  { name: "Core System", color: "#1f2937", enabled: false },
  { name: "Undefined", color: "#9ca3af", enabled: false }
];

export default function EditPolygon() {
  const [, setLocation] = useLocation();
  const router = useRouter();
  const [mapType, setMapType] = useState<'Map' | 'Satellite' | 'Silver' | 'Dark'>('Map');
  const [legendVisible, setLegendVisible] = useState(true);
  const [categories, setCategories] = useState(legendCategories);
  const [polygonEntities, setPolygonEntities] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get selected polygons from localStorage
  useEffect(() => {
    const storedPolygons = localStorage.getItem('selectedPolygonsForEdit');
    const selectedPolygons: AnalysisResult[] = storedPolygons ? JSON.parse(storedPolygons) : [];
    
    if (selectedPolygons.length === 0) {
      // No selected polygons, redirect back or show message
      setLocation('/deforestation-monitoring');
      return;
    }

    // Transform analysis results to polygon entities format
    const transformedEntities = selectedPolygons.map((result, index) => {
      const statusMapping = {
        'HIGH': 'Major Overlapping',
        'MEDIUM': 'Minor Overlapping', 
        'LOW': 'Unproblematic'
      };
      
      const colorMapping = {
        'HIGH': 'destructive',
        'MEDIUM': 'outline',
        'LOW': 'default'
      };

      // Determine polygon issues based on analysis
      let polygonIssues = 'No issues detected';
      if (result.overallRisk === 'HIGH') {
        const issues = [];
        if (result.highRiskDatasets.includes('GFW')) issues.push('GFW deforestation');
        if (result.highRiskDatasets.includes('JRC')) issues.push('JRC alerts');
        if (result.highRiskDatasets.includes('SBTN')) issues.push('SBTN forest loss');
        if (issues.length > 0) {
          polygonIssues = issues.join(', ');
        } else {
          polygonIssues = 'High risk detected';
        }
      } else if (result.overallRisk === 'MEDIUM') {
        polygonIssues = 'Medium risk - requires monitoring';
      }

      return {
        id: String.fromCharCode(65 + index), // A, B, C, etc.
        plotId: result.plotId,
        country: result.country,
        status: statusMapping[result.overallRisk] || 'Unproblematic',
        statusColor: colorMapping[result.overallRisk] || 'default',
        statusBg: result.complianceStatus === 'COMPLIANT' ? 'Unproblematic' : undefined,
        polygonIssues: polygonIssues,
        area: result.area, // Keep as hectares
        lastUpdated: '2024-01-13',
        coordinates: result.geometry?.coordinates?.[0] || []
      };
    });

    setPolygonEntities(transformedEntities);
  }, [setLocation]);

  const getStatusBadge = (status: string, variant: any) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded text-xs font-medium";
    
    switch (status) {
      case 'Major Overlapping':
        return <Badge variant="destructive" className={baseClasses}>{status}</Badge>;
      case 'Minor Overlapping':
        return <Badge variant="outline" className={`${baseClasses} border-yellow-300 text-yellow-700`}>{status}</Badge>;
      case 'New Data':
        return <Badge variant="secondary" className={`${baseClasses} bg-blue-100 text-blue-700`}>{status}</Badge>;
      case 'Unproblematic':
        return <Badge variant="default" className={`${baseClasses} bg-green-100 text-green-700`}>{status}</Badge>;
      default:
        return <Badge variant="outline" className={baseClasses}>{status}</Badge>;
    }
  };

  const toggleCategory = (index: number) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, enabled: !cat.enabled } : cat
    ));
  };

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || polygonEntities.length === 0) return;

      try {
        // Dynamic import of Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Clear any existing map
        if (mapRef.current._leaflet_id) {
          return;
        }
        
        // Initialize map
        const map = L.map(mapRef.current, {
          center: [-2.5, 107.5], // Center on Indonesia
          zoom: 6,
          zoomControl: true
        });

        // Add tile layer based on map type
        let tileLayer;
        switch (mapType) {
          case 'Satellite':
            tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '&copy; Esri'
            });
            break;
          case 'Silver':
            tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
            });
            break;
          case 'Dark':
            tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
              attribution: '&copy; CartoDB'
            });
            break;
          default:
            tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
            });
        }
        
        tileLayer.addTo(map);

        // Add polygons
        polygonEntities.forEach((entity) => {
          if (!entity.coordinates || entity.coordinates.length === 0) return;
          
          let color;
          switch (entity.status) {
            case 'Major Overlapping':
              color = '#dc2626';
              break;
            case 'Minor Overlapping':
              color = '#3b82f6';
              break;
            case 'Unproblematic':
              color = '#10b981';
              break;
            default:
              color = '#6b7280';
          }

          const polygon = L.polygon(entity.coordinates.map(coord => [coord[1], coord[0]]), {
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
          }).addTo(map);

          polygon.bindPopup(`
            <div class="p-2">
              <strong>Entity ${entity.id}</strong><br/>
              <span class="text-sm text-gray-600">${entity.entityId}</span><br/>
              <span class="text-sm">${entity.status}</span><br/>
              <span class="text-sm">Area: ${entity.area}</span>
            </div>
          `);
        });

        return () => {
          map.remove();
        };
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
  }, [mapType, polygonEntities]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-[1000] flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
          {['Map', 'Satellite', 'Silver', 'Dark'].map((type) => (
            <Button
              key={type}
              variant={mapType === type ? "default" : "ghost"}
              size="sm"
              className="text-xs"
              onClick={() => setMapType(type as any)}
              data-testid={`map-type-${type.toLowerCase()}`}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Back Button */}
        <div className="absolute top-4 right-4 z-[1000]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/deforestation-monitoring')}
            className="bg-white dark:bg-gray-800 shadow-lg"
            data-testid="back-to-monitoring"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Legend */}
        {legendVisible && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Legend</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLegendVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div key={category.name} className="flex items-center space-x-2">
                  <Checkbox
                    checked={category.enabled}
                    onCheckedChange={() => toggleCategory(index)}
                    className="h-4 w-4"
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!legendVisible && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLegendVisible(true)}
            className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 shadow-lg"
          >
            Show Legend
          </Button>
        )}

        {/* Map */}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editing Polygon
            </h2>
            <Button variant="outline" size="sm" data-testid="see-all">
              See all
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Showing {polygonEntities.length} selected polygon{polygonEntities.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {polygonEntities.map((entity) => (
            <Card key={entity.id} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      Entity {entity.id}
                    </span>
                    {getStatusBadge(entity.status, entity.statusColor)}
                    {entity.statusBg && (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        {entity.statusBg}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Plot ID</div>
                    <div className="font-medium text-gray-900 dark:text-white">{entity.plotId}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Country</div>
                    <div className="font-medium text-gray-900 dark:text-white">{entity.country}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Area (HA)</div>
                    <div className="font-medium text-gray-900 dark:text-white">{entity.area.toFixed(2)} ha</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Polygon Issues</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {entity.polygonIssues}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}