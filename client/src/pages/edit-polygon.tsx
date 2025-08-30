import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, X, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";

// Sample polygon entities data matching the image
const polygonEntities = [
  {
    id: "C",
    entityId: "ENTITY1012456788309",
    plotNumber: 1,
    status: "Major Overlapping",
    statusColor: "destructive",
    overlap: "86% Overlap with adjacent polygon",
    area: "2300 m²",
    lastUpdated: "2024-01-13",
    coordinates: [[-5.547945, 7.539989], [-5.510712, 7.539989], [-5.510712, 7.577221], [-5.547945, 7.577221], [-5.547945, 7.539989]]
  },
  {
    id: "A",
    entityId: "ENTITY1012456788390",
    plotNumber: 1,
    status: "New Data",
    statusColor: "secondary",
    statusBg: "Unproblematic",
    overlap: "No issues detected",
    area: "2300 m²",
    lastUpdated: "2024-01-13",
    coordinates: [[113.921327, -2.147871], [113.943567, -2.147871], [113.943567, -2.169234], [113.921327, -2.169234], [113.921327, -2.147871]]
  },
  {
    id: "B",
    entityId: "ENTITY1012456788390",
    plotNumber: 1,
    status: "New Data",
    statusColor: "secondary",
    statusBg: "Unproblematic",
    overlap: "No issues detected",
    area: "2300 m²",
    lastUpdated: "2024-01-13",
    coordinates: [[8.675277, 9.081999], [8.677777, 9.081999], [8.677777, 9.084499], [8.675277, 9.084499], [8.675277, 9.081999]]
  },
  {
    id: "D",
    entityId: "ENTITY1012456788309",
    plotNumber: 1,
    status: "Major Overlapping",
    statusColor: "destructive",
    overlap: "86% Overlap with adjacent polygon",
    area: "2300 m²",
    lastUpdated: "2024-01-13",
    coordinates: [[18.555696, 4.361002], [18.655696, 4.361002], [18.655696, 4.461002], [18.555696, 4.461002], [18.555696, 4.361002]]
  },
  {
    id: "E",
    entityId: "ENTITY1012456788309",
    plotNumber: 1,
    status: "Minor Overlapping",
    statusColor: "outline",
    overlap: "15% Overlap with adjacent polygon",
    area: "2300 m²",
    lastUpdated: "2024-01-13",
    coordinates: [[-1.094512, 7.946527], [-1.092012, 7.946527], [-1.092012, 7.949027], [-1.094512, 7.949027], [-1.094512, 7.946527]]
  }
];

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
  const [mapType, setMapType] = useState<'Map' | 'Satellite' | 'Silver' | 'Dark'>('Map');
  const [legendVisible, setLegendVisible] = useState(true);
  const [categories, setCategories] = useState(legendCategories);
  const mapRef = useRef<HTMLDivElement>(null);

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
      if (!mapRef.current) return;

      // Dynamic import of Leaflet to avoid SSR issues
      const L = (await import('leaflet')).default;
      
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
    };

    initializeMap();
  }, [mapType]);

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
            Showing 100 data of polygon map
          </p>
        </div>

        <div className="p-4 space-y-4">
          {polygonEntities.map((entity) => (
            <Card key={entity.id} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
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
                
                <p className="text-xs text-gray-500 mb-2">{entity.entityId}</p>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Plot {entity.plotNumber}</span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {entity.overlap}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="text-xs text-gray-500">Area</div>
                      <div className="font-medium">{entity.area}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Last Updated</div>
                      <div className="text-xs">{entity.lastUpdated}</div>
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