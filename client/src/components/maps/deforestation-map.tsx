import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, MapPin, AlertTriangle, Shield } from 'lucide-react';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

interface DeforestationMapProps {
  plots: Plot[];
  alerts: DeforestationAlert[];
  protectedAreas: ProtectedArea[];
  activeLayers: string[];
  onPlotClick?: (plot: Plot) => void;
  onAlertClick?: (alert: DeforestationAlert) => void;
  className?: string;
}

export function DeforestationMap({
  plots,
  alerts,
  protectedAreas,
  activeLayers,
  onPlotClick,
  onAlertClick,
  className = ""
}: DeforestationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    plots: L.LayerGroup;
    alerts: L.LayerGroup;
    protectedAreas: L.LayerGroup;
  } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Indonesia (palm oil regions)
    const map = L.map(mapRef.current, {
      center: [-2.5, 118.0], // Indonesia center
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize layer groups
    const plotsLayer = L.layerGroup().addTo(map);
    const alertsLayer = L.layerGroup().addTo(map);
    const protectedAreasLayer = L.layerGroup().addTo(map);

    layersRef.current = {
      plots: plotsLayer,
      alerts: alertsLayer,
      protectedAreas: protectedAreasLayer
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current) return;

    const { plots: plotsLayer, alerts: alertsLayer, protectedAreas: protectedAreasLayer } = layersRef.current;

    // Clear existing layers
    plotsLayer.clearLayers();
    alertsLayer.clearLayers();
    protectedAreasLayer.clearLayers();

    // Add plots if layer is active
    if (activeLayers.includes('plots')) {
      plots.forEach(plot => {
        const color = getPlotColor(plot.status);
        const fillColor = getPlotFillColor(plot.riskLevel);
        
        // Create plot polygon (simplified as circle for demo)
        const circle = L.circle([plot.coordinates.lat, plot.coordinates.lng], {
          radius: Math.sqrt(plot.area) * 100,
          color: color,
          fillColor: fillColor,
          fillOpacity: 0.6,
          weight: 2
        });

        // Add popup with plot information
        circle.bindPopup(`
          <div class="p-3">
            <h3 class="font-semibold text-lg mb-2">${plot.name}</h3>
            <div class="space-y-1 text-sm">
              <p><strong>Plot ID:</strong> ${plot.plotId}</p>
              <p><strong>Supplier:</strong> ${plot.supplier}</p>
              <p><strong>Area:</strong> ${plot.area} hectares</p>
              <p><strong>Status:</strong> <span class="capitalize">${plot.status}</span></p>
              <p><strong>Risk Level:</strong> <span class="capitalize">${plot.riskLevel}</span></p>
              <p><strong>Last Monitored:</strong> ${plot.lastMonitored}</p>
              <p><strong>Certifications:</strong> ${plot.certification.join(', ') || 'None'}</p>
            </div>
          </div>
        `);

        if (onPlotClick) {
          circle.on('click', () => onPlotClick(plot));
        }

        plotsLayer.addLayer(circle);
      });
    }

    // Add deforestation alerts if layer is active
    if (activeLayers.includes('deforestation')) {
      alerts.forEach(alert => {
        const color = getAlertColor(alert.severity);
        
        // Create alert marker
        const alertIcon = L.divIcon({
          html: `<div class="w-6 h-6 rounded-full ${color} border-2 border-white shadow-lg flex items-center justify-center">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                </div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([alert.coordinates.lat, alert.coordinates.lng], {
          icon: alertIcon
        });

        // Add popup with alert information
        marker.bindPopup(`
          <div class="p-3">
            <h3 class="font-semibold text-lg mb-2 text-red-600">Deforestation Alert</h3>
            <div class="space-y-1 text-sm">
              <p><strong>Plot:</strong> ${alert.plotName}</p>
              <p><strong>Alert Type:</strong> ${alert.alertType}</p>
              <p><strong>Severity:</strong> <span class="capitalize">${alert.severity}</span></p>
              <p><strong>Confidence:</strong> ${alert.confidence}%</p>
              <p><strong>Area:</strong> ${alert.area} hectares</p>
              <p><strong>Date:</strong> ${alert.alertDate}</p>
              <p><strong>Status:</strong> <span class="capitalize">${alert.status}</span></p>
            </div>
          </div>
        `);

        if (onAlertClick) {
          marker.on('click', () => onAlertClick(alert));
        }

        alertsLayer.addLayer(marker);
      });
    }

    // Add protected areas if layer is active
    if (activeLayers.includes('protected-areas')) {
      protectedAreas.forEach(area => {
        // Create protected area polygon (simplified as circle)
        const circle = L.circle([area.coordinates.lat, area.coordinates.lng], {
          radius: Math.sqrt(area.area) * 50,
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5'
        });

        // Add popup with protected area information
        circle.bindPopup(`
          <div class="p-3">
            <h3 class="font-semibold text-lg mb-2 text-green-600">${area.name}</h3>
            <div class="space-y-1 text-sm">
              <p><strong>Type:</strong> ${area.type}</p>
              <p><strong>Status:</strong> ${area.status}</p>
              <p><strong>Area:</strong> ${area.area.toLocaleString()} hectares</p>
            </div>
          </div>
        `);

        protectedAreasLayer.addLayer(circle);
      });
    }

    // Show/hide layers based on active layers
    if (activeLayers.includes('plots')) {
      mapInstanceRef.current.addLayer(plotsLayer);
    } else {
      mapInstanceRef.current.removeLayer(plotsLayer);
    }

    if (activeLayers.includes('deforestation')) {
      mapInstanceRef.current.addLayer(alertsLayer);
    } else {
      mapInstanceRef.current.removeLayer(alertsLayer);
    }

    if (activeLayers.includes('protected-areas')) {
      mapInstanceRef.current.addLayer(protectedAreasLayer);
    } else {
      mapInstanceRef.current.removeLayer(protectedAreasLayer);
    }

  }, [plots, alerts, protectedAreas, activeLayers, onPlotClick, onAlertClick]);

  const getPlotColor = (status: string): string => {
    switch (status) {
      case 'compliant': return '#22c55e';
      case 'at-risk': return '#eab308';
      case 'non-compliant': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPlotFillColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return '#22c55e';
      case 'medium': return '#eab308';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAlertColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Interactive OpenStreetMap
          <Badge variant="secondary" className="ml-auto">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Compliant Plots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>At-Risk Plots</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Non-Compliant Plots</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span>Deforestation Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-500" />
              <span>Protected Areas</span>
            </div>
          </div>

          {/* Map Container */}
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
            data-testid="deforestation-map"
          />

          {/* Map Stats */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Showing {plots.length} plots, {alerts.length} alerts, {protectedAreas.length} protected areas</span>
            <span>OpenStreetMap © Contributors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}