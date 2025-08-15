import { useEffect, useRef, useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { scaleSequential } from 'd3-scale';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Zap, MapPin, TrendingUp } from 'lucide-react';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeospatialDataPoint {
  id: string;
  lat: number;
  lng: number;
  timestamp: Date;
  value: number;
  type: 'facility' | 'shipment' | 'deforestation' | 'compliance';
  metadata: {
    name: string;
    category: string;
    risk_level?: 'low' | 'medium' | 'high';
    status?: string;
    volume?: number;
  };
}

interface AnimatedTraceRoute {
  id: string;
  path: [number, number][];
  color: string;
  animated: boolean;
  metadata: {
    shipmentId: string;
    origin: string;
    destination: string;
    commodity: string;
    volume: number;
  };
}

interface AnimatedGeospatialMapProps {
  data: GeospatialDataPoint[];
  routes: AnimatedTraceRoute[];
  timeRange: [Date, Date];
  playSpeed: number;
  onDataPointClick?: (point: GeospatialDataPoint) => void;
  onRouteClick?: (route: AnimatedTraceRoute) => void;
  visualizationMode: 'heatmap' | 'clusters' | 'flow' | 'risk';
}

// Simple animated map marker using Leaflet
const createAnimatedMarker = (point: GeospatialDataPoint, map: L.Map) => {
  const getMarkerColor = (point: GeospatialDataPoint) => {
    switch (point.type) {
      case 'facility': return '#3b82f6'; // blue
      case 'shipment': return '#10b981'; // green
      case 'deforestation': return '#ef4444'; // red
      case 'compliance': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  };

  const customIcon = L.divIcon({
    className: 'custom-animated-marker',
    html: `
      <div style="
        background: ${getMarkerColor(point)};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        animation: pulse 2s infinite;
      ">
        ${point.type === 'facility' ? '🏭' : 
          point.type === 'shipment' ? '🚛' : 
          point.type === 'deforestation' ? '⚠️' : '✓'}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const marker = L.marker([point.lat, point.lng], { icon: customIcon });
  
  const popupContent = `
    <div class="p-2 min-w-[200px]">
      <h3 class="font-bold text-lg mb-2">${point.metadata.name}</h3>
      <div class="space-y-1 text-sm">
        <div><strong>Type:</strong> ${point.type}</div>
        <div><strong>Category:</strong> ${point.metadata.category}</div>
        <div><strong>Value:</strong> ${point.value.toLocaleString()}</div>
        ${point.metadata.risk_level ? `<div><strong>Risk Level:</strong> ${point.metadata.risk_level}</div>` : ''}
        ${point.metadata.volume ? `<div><strong>Volume:</strong> ${point.metadata.volume.toLocaleString()} MT</div>` : ''}
        <div><strong>Timestamp:</strong> ${point.timestamp.toLocaleString()}</div>
      </div>
    </div>
  `;
  
  marker.bindPopup(popupContent);
  return marker;
};

// Create animated polyline for supply chain routes
const createAnimatedRoute = (route: AnimatedTraceRoute, map: L.Map, progress: number) => {
  const visiblePathLength = Math.floor(route.path.length * progress);
  const visiblePath = route.path.slice(0, Math.max(1, visiblePathLength));

  const polyline = L.polyline(visiblePath, {
    color: route.color,
    weight: 4,
    opacity: 0.8,
    dashArray: '10, 5'
  });

  const popupContent = `
    <div class="p-2">
      <h3 class="font-bold">${route.metadata.shipmentId}</h3>
      <div class="text-sm space-y-1">
        <div><strong>From:</strong> ${route.metadata.origin}</div>
        <div><strong>To:</strong> ${route.metadata.destination}</div>
        <div><strong>Commodity:</strong> ${route.metadata.commodity}</div>
        <div><strong>Volume:</strong> ${route.metadata.volume} MT</div>
      </div>
    </div>
  `;
  
  polyline.bindPopup(popupContent);

  // Add endpoint circle when route is complete
  if (visiblePathLength === route.path.length) {
    const endPoint = route.path[route.path.length - 1];
    const circle = L.circle(endPoint, {
      radius: 1000,
      color: route.color,
      fillColor: route.color,
      fillOpacity: 0.3
    });
    return [polyline, circle];
  }

  return [polyline];
};

// Simple Leaflet-based map component without react-leaflet dependency issues
const LeafletMapComponent = ({ 
  data, 
  routes, 
  timeProgress, 
  routeProgress, 
  visualizationMode,
  onDataPointClick,
  onRouteClick 
}: {
  data: GeospatialDataPoint[];
  routes: AnimatedTraceRoute[];
  timeProgress: number;
  routeProgress: number;
  visualizationMode: string;
  onDataPointClick?: (point: GeospatialDataPoint) => void;
  onRouteClick?: (route: AnimatedTraceRoute) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([2.5, 102.5], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers based on time progress
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    
    const visibleData = data.filter((_, index) => index < data.length * timeProgress);

    if (visualizationMode === 'heatmap') {
      // Create heatmap-style visualization
      const colorScale = scaleSequential((t: number) => `hsl(${240 + t * 120}, 70%, ${30 + t * 40}%)`).domain([0, 1]);
      
      visibleData.forEach(point => {
        const intensity = Math.min(point.value / 1000, 1);
        const circle = L.circle([point.lat, point.lng], {
          radius: intensity * 5000,
          fillColor: colorScale(intensity),
          fillOpacity: 0.6,
          stroke: false
        });
        
        if (markersLayerRef.current) {
          markersLayerRef.current.addLayer(circle);
        }
      });
    } else {
      // Regular marker visualization
      visibleData.forEach(point => {
        const marker = createAnimatedMarker(point, mapInstanceRef.current!);
        marker.on('click', () => onDataPointClick?.(point));
        
        if (markersLayerRef.current) {
          markersLayerRef.current.addLayer(marker);
        }
      });
    }
  }, [data, timeProgress, visualizationMode, onDataPointClick]);

  // Update routes based on route progress
  useEffect(() => {
    if (!mapInstanceRef.current || !routesLayerRef.current) return;

    routesLayerRef.current.clearLayers();

    if (visualizationMode === 'flow' || visualizationMode === 'clusters') {
      routes.forEach(route => {
        const routeLayers = createAnimatedRoute(route, mapInstanceRef.current!, routeProgress);
        routeLayers.forEach(layer => {
          layer.on('click', () => onRouteClick?.(route));
          if (routesLayerRef.current) {
            routesLayerRef.current.addLayer(layer);
          }
        });
      });
    }
  }, [routes, routeProgress, visualizationMode, onRouteClick]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export const AnimatedGeospatialMap = ({
  data,
  routes,
  timeRange,
  playSpeed,
  onDataPointClick,
  onRouteClick,
  visualizationMode
}: AnimatedGeospatialMapProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate time progress (0 to 1)
  const timeProgress = currentTime / 100;
  const currentDate = new Date(
    timeRange[0].getTime() + 
    (timeRange[1].getTime() - timeRange[0].getTime()) * timeProgress
  );

  // Filter data based on current time
  const visibleData = data.filter(point => 
    point.timestamp <= currentDate
  );

  // Animation controls
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetAnimation = () => {
    setCurrentTime(0);
    setRouteProgress(0);
    setIsPlaying(false);
  };

  // Animation timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + playSpeed;
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
        setRouteProgress(prev => Math.min(prev + playSpeed / 100, 1));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, playSpeed]);

  // Map center - focus on Malaysia/Indonesia region
  const center: [number, number] = [2.5, 102.5];

  return (
    <div className="w-full h-full space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Animated Supply Chain Visualization
            <Badge variant="secondary" className="ml-auto">
              {visibleData.length} / {data.length} points
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={togglePlayback}
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              data-testid="button-toggle-playback"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={resetAnimation}
              variant="outline"
              size="sm"
              data-testid="button-reset-animation"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <div className="flex-1 px-4">
              <label className="text-sm font-medium mb-2 block">Timeline Progress</label>
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => setCurrentTime(value)}
                max={100}
                step={1}
                className="w-full"
                data-testid="slider-timeline"
              />
            </div>

            <div className="text-sm">
              <div className="font-medium">Current Time</div>
              <div className="text-muted-foreground">
                {currentDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Visualization Mode Selector */}
          <div className="flex gap-2">
            {(['heatmap', 'clusters', 'flow', 'risk'] as const).map(mode => (
              <Button
                key={mode}
                variant={visualizationMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => {}} // Would update visualization mode
                data-testid={`button-mode-${mode}`}
              >
                {mode === 'heatmap' && <TrendingUp className="h-4 w-4 mr-1" />}
                {mode === 'clusters' && <MapPin className="h-4 w-4 mr-1" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-lg">
        <LeafletMapComponent
          data={data}
          routes={routes}
          timeProgress={timeProgress}
          routeProgress={routeProgress}
          visualizationMode={visualizationMode}
          onDataPointClick={onDataPointClick}
          onRouteClick={onRouteClick}
        />
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{visibleData.length}</div>
            <div className="text-sm text-muted-foreground">Active Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {visibleData.filter(p => p.type === 'facility').length}
            </div>
            <div className="text-sm text-muted-foreground">Facilities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {visibleData.filter(p => p.type === 'shipment').length}
            </div>
            <div className="text-sm text-muted-foreground">Shipments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {visibleData.filter(p => p.metadata.risk_level === 'high').length}
            </div>
            <div className="text-sm text-muted-foreground">High Risk</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};