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
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editablePolygons, setEditablePolygons] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

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

  // Function to handle interactive polygon editing
  const handleEditPolygon = () => {
    if (!mapInstanceRef.current) {
      alert('Map not initialized yet. Please wait a moment and try again.');
      return;
    }

    if (isEditingMode) {
      // Exit editing mode and save changes
      saveEditedPolygons();
      setIsEditingMode(false);
      setEditablePolygons([]);
      // Set flag to refresh table data after editing
      localStorage.setItem('refreshTableAfterEdit', 'true');
      alert('Editing mode disabled. Changes have been saved and will be reflected in the table.');
    } else {
      // Enter editing mode
      setIsEditingMode(true);
      alert('Editing mode enabled! Click and drag polygon vertices to modify their shape. Click "Edit Polygon" again to save changes.');
    }
  };

  // Function to save edited polygon coordinates
  const saveEditedPolygons = async () => {
    if (editablePolygons.length === 0) return;

    try {
      // Save to database via API
      const savePromises = editablePolygons.map(async (editedPolygon) => {
        const response = await fetch(`/api/analysis-results/${editedPolygon.plotId}/geometry`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: editedPolygon.coordinates
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${editedPolygon.plotId}: ${response.statusText}`);
        }

        return response.json();
      });

      await Promise.all(savePromises);

      // Update local state with new coordinates
      const updatedEntities = polygonEntities.map(entity => {
        const editedPolygon = editablePolygons.find(ep => ep.plotId === entity.plotId);
        if (editedPolygon) {
          return {
            ...entity,
            coordinates: editedPolygon.coordinates
          };
        }
        return entity;
      });

      setPolygonEntities(updatedEntities);

      // Update localStorage for selected polygons
      const storedPolygons = localStorage.getItem('selectedPolygonsForEdit');
      if (storedPolygons) {
        const selectedPolygons = JSON.parse(storedPolygons);
        const updatedPolygons = selectedPolygons.map((polygon: AnalysisResult) => {
          const editedEntity = updatedEntities.find(entity => entity.plotId === polygon.plotId);
          if (editedEntity) {
            return {
              ...polygon,
              geometry: {
                ...polygon.geometry,
                coordinates: [editedEntity.coordinates.map((coord: number[]) => [coord[1], coord[0]])]
              }
            };
          }
          return polygon;
        });
        localStorage.setItem('selectedPolygonsForEdit', JSON.stringify(updatedPolygons));
      }

      // Also update the main analysis results to reflect in the table
      const currentResults = localStorage.getItem('currentAnalysisResults');
      if (currentResults) {
        const allResults = JSON.parse(currentResults);
        const updatedAllResults = allResults.map((result: AnalysisResult) => {
          const editedEntity = updatedEntities.find(entity => entity.plotId === result.plotId);
          if (editedEntity) {
            return {
              ...result,
              geometry: {
                ...result.geometry,
                coordinates: [editedEntity.coordinates.map((coord: number[]) => [coord[1], coord[0]])]
              }
            };
          }
          return result;
        });
        localStorage.setItem('currentAnalysisResults', JSON.stringify(updatedAllResults));
        console.log(`✅ Updated ${editablePolygons.length} polygon(s) in main analysis results`);
      }

      console.log(`✅ Successfully saved ${editablePolygons.length} edited polygon(s) to database`);
    } catch (error) {
      console.error('Error saving edited polygons:', error);
      alert('Error saving polygon changes to database. Please try again.');
    }
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

        // Store map instance reference
        mapInstanceRef.current = map;

        // Load Leaflet.draw for editing functionality
        const drawScript = document.createElement('script');
        drawScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
        const drawCSS = document.createElement('link');
        drawCSS.rel = 'stylesheet';
        drawCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
        
        document.head.appendChild(drawCSS);
        document.head.appendChild(drawScript);
        
        // Wait for Leaflet.draw to load
        await new Promise((resolve) => {
          drawScript.onload = resolve;
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
        const createdPolygons: any[] = [];
        
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

          // Create polygon with editing capabilities
          const polygon = L.polygon(entity.coordinates.map((coord: number[]) => [coord[1], coord[0]]), {
            fillColor: color,
            color: color,
            weight: isEditingMode ? 3 : 2,
            opacity: 0.8,
            fillOpacity: isEditingMode ? 0.6 : 0.4
          }).addTo(map);

          // Store polygon reference with plot info using custom properties
          (polygon as any).plotId = entity.plotId;
          (polygon as any).originalCoordinates = entity.coordinates;
          createdPolygons.push(polygon);

          // Enable editing if in editing mode using Leaflet.draw
          if (isEditingMode) {
            console.log(`🔧 Enabling editing for ${entity.plotId}`);
            
            // Try to enable editing using Leaflet's built-in editing
            try {
              if ((polygon as any).editing) {
                (polygon as any).editing.enable();
                console.log(`✅ Enabled built-in editing for ${entity.plotId}`);
              } else {
                // Fallback: Create draggable markers for each vertex
                const coords = entity.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
                const vertexMarkers: any[] = [];
                
                coords.forEach((coord, index) => {
                  const marker = L.circleMarker(coord, {
                    radius: 6,
                    fillColor: '#fff',
                    color: '#2563eb',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 1,
                    draggable: true
                  }).addTo(map);
                  
                  // Make vertex draggable
                  marker.on('drag', function(e: any) {
                    const newPos = marker.getLatLng();
                    coords[index] = [newPos.lat, newPos.lng];
                    
                    // Update polygon shape
                    polygon.setLatLngs(coords);
                    
                    // Update state
                    setEditablePolygons(prev => {
                      const existing = prev.find(ep => ep.plotId === entity.plotId);
                      if (existing) {
                        return prev.map(ep => 
                          ep.plotId === entity.plotId 
                            ? { ...ep, coordinates: coords }
                            : ep
                        );
                      } else {
                        return [...prev, { plotId: entity.plotId, coordinates: coords }];
                      }
                    });
                  });
                  
                  marker.on('dragend', function(e: any) {
                    console.log(`📝 Vertex ${index} of ${entity.plotId} moved to:`, marker.getLatLng());
                  });
                  
                  vertexMarkers.push(marker);
                });
                
                // Store vertex markers for cleanup
                (polygon as any).vertexMarkers = vertexMarkers;
                console.log(`✅ Created ${vertexMarkers.length} draggable vertices for ${entity.plotId}`);
              }
            } catch (error) {
              console.error(`Error enabling editing for ${entity.plotId}:`, error);
            }
          }

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
  }, [mapType, polygonEntities, isEditingMode]);

  // Effect to handle editing mode changes
  useEffect(() => {
    if (mapInstanceRef.current && polygonEntities.length > 0) {
      // Clear and reinitialize map when editing mode changes
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof (window as any).L?.Polygon) {
          if (isEditingMode) {
            // Try built-in editing first
            if (layer.editing) {
              layer.editing.enable();
            }
            layer.setStyle({
              weight: 3,
              fillOpacity: 0.6
            });
          } else {
            // Disable editing and cleanup vertex markers
            if (layer.editing) {
              layer.editing.disable();
            }
            
            // Remove vertex markers if they exist
            if (layer.vertexMarkers) {
              layer.vertexMarkers.forEach((marker: any) => {
                mapInstanceRef.current.removeLayer(marker);
              });
              layer.vertexMarkers = [];
            }
            
            layer.setStyle({
              weight: 2,
              fillOpacity: 0.4
            });
          }
        }
      });
    }
  }, [isEditingMode]);

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
            onClick={() => {
              // Set flag to refresh table data when returning
              localStorage.setItem('refreshTableAfterEdit', 'true');
              setLocation('/deforestation-monitoring');
            }}
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
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  data-testid="edit-polygon-option"
                  onClick={handleEditPolygon}
                >
                  {isEditingMode ? 'Save & Exit Edit' : 'Edit Polygon'}
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
          {isEditingMode && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                ✏️ Editing Mode Active
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Drag polygon vertices on the map to modify shapes
              </p>
            </div>
          )}
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