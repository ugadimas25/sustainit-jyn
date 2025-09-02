import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  plotId: string;
  country: string;
  area: string;
  overallRisk: string;
  complianceStatus: string;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
  gfwLoss?: number;
  jrcLoss?: number;
  sbtnLoss?: number;
}

export default function DataVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    updatedDate: '',
    updatedTime: '',
    assessment: '',
    assessedBy: '',
    skipConfirmation: false
  });
  
  // Selected polygon data
  const [selectedPolygon, setSelectedPolygon] = useState<AnalysisResult | null>(null);
  const [detailPanelExpanded, setDetailPanelExpanded] = useState(true);
  const [mapType, setMapType] = useState<'Terrain' | 'Satellite' | 'Silver' | 'UAV'>('Satellite');

  // Load selected polygon from localStorage
  useEffect(() => {
    const storedPolygon = localStorage.getItem('selectedPolygonForVerification');
    if (storedPolygon) {
      const polygon = JSON.parse(storedPolygon);
      setSelectedPolygon(polygon);
    } else {
      // No polygon selected, redirect back
      setLocation('/deforestation-monitoring');
      return;
    }
  }, [setLocation]);

  // Initialize map
  useEffect(() => {
    if (!selectedPolygon || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Load Leaflet
        const L = (window as any).L;
        if (!L) {
          const leafletScript = document.createElement('script');
          leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          leafletScript.crossOrigin = '';
          document.head.appendChild(leafletScript);

          await new Promise((resolve) => {
            leafletScript.onload = resolve;
          });
        }

        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create map
        const map = L.map(mapRef.current, {
          center: [1.190, 100.187], // Default Indonesia coordinates
          zoom: 16,
          zoomControl: true
        });

        mapInstanceRef.current = map;

        // Add tile layer based on map type
        let tileLayer;
        switch (mapType) {
          case 'Terrain':
            tileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenTopoMap contributors'
            });
            break;
          case 'Satellite':
            tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Esri'
            });
            break;
          case 'Silver':
            tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            });
            break;
          case 'UAV':
            tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Esri (UAV View)'
            });
            break;
        }
        
        tileLayer.addTo(map);

        // Add polygon if geometry exists
        if (selectedPolygon.geometry?.coordinates) {
          const coordinates = selectedPolygon.geometry.coordinates[0];
          const leafletCoords = coordinates.map((coord: number[]) => [coord[1], coord[0]]); // Convert to [lat, lng]
          
          // Create polygon
          const polygon = L.polygon(leafletCoords, {
            fillColor: '#FFD700',
            color: '#FFD700',
            weight: 3,
            fillOpacity: 0.6,
            opacity: 1
          }).addTo(map);

          // Add center marker
          const center = polygon.getBounds().getCenter();
          const centerMarker = L.marker(center, {
            icon: L.divIcon({
              html: '<div style="background: #FFD700; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 12px;">📍</span></div>',
              className: 'custom-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(map);

          // Fit map to polygon bounds
          map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
        }

      } catch (error) {
        console.error('Error initializing verification map:', error);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [selectedPolygon, mapType]);

  const handleCancel = () => {
    localStorage.removeItem('selectedPolygonForVerification');
    setLocation('/deforestation-monitoring');
  };

  const handleConfirm = () => {
    try {
      // Process verification confirmation
      toast({
        title: "Verification Confirmed",
        description: `Plot ${selectedPolygon?.plotId} has been verified for data collection.`,
        variant: "default",
      });
      
      // Clear storage and redirect
      localStorage.removeItem('selectedPolygonForVerification');
      setLocation('/deforestation-monitoring');
      
    } catch (error) {
      console.error('Error confirming verification:', error);
      toast({
        title: "Verification Error",
        description: "Failed to confirm verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!selectedPolygon) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b p-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          Capture Polygon?
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please confirm that this is the correct polygon to proceed with core data collection.
        </p>
      </div>

      <div className="flex-1 flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-[1000] flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
            {['Terrain', 'Satellite', 'Silver', 'UAV'].map((type) => (
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

          {/* Detail Information Panel */}
          <div className="absolute top-4 right-4 z-[1000] w-80">
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => setDetailPanelExpanded(!detailPanelExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Detail information
                  </CardTitle>
                  {detailPanelExpanded ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
              </CardHeader>
              
              {detailPanelExpanded && (
                <CardContent className="pt-0 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Plot ID</span>
                    <span className="text-sm font-medium">{selectedPolygon.plotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Country</span>
                    <span className="text-sm font-medium">{selectedPolygon.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Area</span>
                    <span className="text-sm font-medium">{selectedPolygon.area}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Risk</span>
                    <span className={`text-sm font-medium ${
                      selectedPolygon.overallRisk === 'HIGH' ? 'text-red-600' :
                      selectedPolygon.overallRisk === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {selectedPolygon.overallRisk}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Map */}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>

      {/* Data Collection Form */}
      <div className="bg-white dark:bg-gray-800 border-t p-6">
        <h2 className="text-lg font-semibold mb-4">Data Collection</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="updated-date" className="text-sm font-medium">
              Updated date & time
            </Label>
            <Input
              id="updated-date"
              type="datetime-local"
              value={formData.updatedDate}
              onChange={(e) => handleFormChange('updatedDate', e.target.value)}
              placeholder="YYYY/MM/DD • HH:MM"
              data-testid="input-updated-date"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assessment" className="text-sm font-medium">
              Assessment
            </Label>
            <Input
              id="assessment"
              value={formData.assessment}
              onChange={(e) => handleFormChange('assessment', e.target.value)}
              placeholder="Name of assessment"
              data-testid="input-assessment"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assessed-by" className="text-sm font-medium">
              Asses by
            </Label>
            <Input
              id="assessed-by"
              value={formData.assessedBy}
              onChange={(e) => handleFormChange('assessedBy', e.target.value)}
              placeholder="Name of Data Collector"
              data-testid="input-assessed-by"
            />
          </div>
        </div>

        {/* Skip confirmation checkbox */}
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            id="skip-confirmation"
            checked={formData.skipConfirmation}
            onCheckedChange={(checked) => handleFormChange('skipConfirmation', checked as boolean)}
            data-testid="checkbox-skip-confirmation"
          />
          <Label 
            htmlFor="skip-confirmation" 
            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            Skip this confirmation next time
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            data-testid="button-cancel-verification"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="button-confirm-verification"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}