import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, X, RotateCcw, ChevronDown } from "lucide-react";
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
  polygonIssues?: string;
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

  // Function to handle autocorrection of polygon orientation
  const handleAutocorrection = () => {
    // Find polygons with "Wrong Orientation" issues
    const polygonsToFix = polygonEntities.filter(entity => 
      entity.polygonIssues === 'Wrong Orientation'
    );

    if (polygonsToFix.length === 0) {
      alert('No polygons with orientation issues found.');
      return;
    }

    // Fix polygon orientation (reverse coordinates for ccw)
    const fixedEntities = polygonEntities.map(entity => {
      if (entity.polygonIssues === 'Wrong Orientation') {
        // Reverse coordinates to fix orientation
        const reversedCoordinates = [...entity.coordinates].reverse();
        
        return {
          ...entity,
          coordinates: reversedCoordinates,
          polygonIssues: 'No Issues Found',
          status: 'Unproblematic',
          statusColor: 'default'
        };
      }
      return entity;
    });

    // Update state and localStorage
    setPolygonEntities(fixedEntities);
    
    // Update localStorage with fixed polygons
    const storedPolygons = localStorage.getItem('selectedPolygonsForEdit');
    if (storedPolygons) {
      const selectedPolygons = JSON.parse(storedPolygons);
      const updatedPolygons = selectedPolygons.map((polygon: AnalysisResult) => {
        const fixedEntity = fixedEntities.find(entity => entity.plotId === polygon.plotId);
        if (fixedEntity && polygon.polygonIssues === 'Wrong Orientation') {
          return {
            ...polygon,
            polygonIssues: 'No Issues Found',
            geometry: {
              ...polygon.geometry,
              coordinates: [fixedEntity.coordinates.map((coord: number[]) => [coord[1], coord[0]])]
            }
          };
        }
        return polygon;
      });
      localStorage.setItem('selectedPolygonsForEdit', JSON.stringify(updatedPolygons));
    }

    alert(`Fixed ${polygonsToFix.length} polygon(s) with orientation issues.`);
  };

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

      // Use actual polygonIssues from the result data
      const polygonIssues = result.polygonIssues || 'No Issues Found';
      
      // Map polygon issues to status categories
      let status = 'Unproblematic';
      let statusColor = 'default';
      
      if (polygonIssues.includes('Overlap Detected') || polygonIssues.includes('Major Overlap')) {
        status = 'Major Overlapping';
        statusColor = 'destructive';
      } else if (polygonIssues.includes('Minor Overlap') || polygonIssues.includes('Duplicate Vertices')) {
        status = 'Minor Overlapping';
        statusColor = 'outline';
      } else if (polygonIssues.includes('Duplicate Polygon')) {
        status = 'Duplicate/Major Overlapping';
        statusColor = 'destructive';
      } else if (polygonIssues.includes('Wrong Orientation') || polygonIssues.includes('Invalid Geometry')) {
        status = 'Malformed';
        statusColor = 'secondary';
      } else if (polygonIssues === 'No Issues Found' || polygonIssues === 'No issues detected') {
        status = 'Unproblematic';
        statusColor = 'default';
      }

      return {
        id: String.fromCharCode(65 + index), // A, B, C, etc.
        plotId: result.plotId,
        country: result.country,
        status: status,
        statusColor: statusColor,
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
        if ((mapRef.current as any)._leaflet_id) {
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

        // Add polygons with center markers like EUDR Map Viewer
        polygonEntities.forEach((entity) => {
          if (!entity.coordinates || entity.coordinates.length === 0) return;
          
          let color;
          const isHighRisk = entity.polygonIssues !== 'No Issues Found' && entity.polygonIssues !== 'No issues detected';
          
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

          // Create polygon
          const polygon = L.polygon(entity.coordinates.map((coord: number[]) => [coord[1], coord[0]]), {
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.4
          }).addTo(map);

          // Add center marker for better visibility and interaction
          const center = polygon.getBounds().getCenter();
          const centerMarker = L.circleMarker(center, {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map);

          // Enhanced popup content
          const popupContent = `
            <div style="padding: 16px; min-width: 280px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                  ${isHighRisk ? '⚠️' : '✅'}
                </div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">${entity.plotId}</h3>
              </div>
              
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280; font-size: 14px;">Country</span>
                  <span style="font-weight: 600; color: #1f2937;">${entity.country}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280; font-size: 14px;">Area</span>
                  <span style="font-weight: 600; color: #1f2937;">${entity.area.toFixed(2)} ha</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6b7280; font-size: 14px;">Issues</span>
                  <span style="font-weight: 600; color: ${isHighRisk ? '#dc2626' : '#10b981'};">${entity.polygonIssues}</span>
                </div>
              </div>
            </div>
          `;

          // Popup options
          const popupOptions = {
            maxWidth: 400,
            minWidth: 300,
            autoPan: true,
            autoPanPaddingTopLeft: [20, 20] as [number, number],
            autoPanPaddingBottomRight: [20, 20] as [number, number],
            keepInView: true
          };

          // Bind popup to both polygon and center marker
          polygon.bindPopup(popupContent, popupOptions);
          centerMarker.bindPopup(popupContent, popupOptions);

          // Add click events to zoom to polygon bounds
          const zoomToPolygon = () => {
            const bounds = polygon.getBounds();
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 16
            });
          };

          polygon.on('click', zoomToPolygon);
          centerMarker.on('click', zoomToPolygon);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="action-dropdown">
                  Action
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" data-testid="edit-polygon-option">
                  Edit Polygon
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  data-testid="autocorrection-option"
                  onClick={handleAutocorrection}
                >
                  Autocorrection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Showing {polygonEntities.length} selected polygon{polygonEntities.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {polygonEntities.map((entity) => (
            <Card key={entity.id} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                {/* All Information in One Card */}
                <div className="space-y-3">
                  {/* Plot ID */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">PLOT ID</div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{entity.plotId}</div>
                  </div>
                  
                  {/* Country */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">COUNTRY</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{entity.country}</div>
                  </div>
                  
                  {/* Area */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">AREA (HA)</div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{entity.area.toFixed(2)} ha</div>
                  </div>
                  
                  {/* Polygon Issues */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">POLYGON ISSUES</div>
                    <div className={`text-sm font-medium ${
                      entity.polygonIssues === 'No Issues Found' || entity.polygonIssues === 'No issues detected'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
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