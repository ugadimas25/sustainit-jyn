import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Layers, BarChart3 } from 'lucide-react';

interface AnalysisResult {
  plotId: string;
  country: string;
  area: number;
  overallRisk: string;
  complianceStatus: string;
  gfwLoss: string;
  jrcLoss: string;
  sbtnLoss: string;
  highRiskDatasets: string[];
  geometry?: {
    type: string;
    coordinates: any;
  };
}

export default function MapViewer() {
  const [, setLocation] = useLocation();

  // Fetch analysis results directly from database API
  const { data: dbAnalysisResults = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ['/api/analysis-results'],
  });

  // Transform database results to match expected format
  const analysisResults: AnalysisResult[] = dbAnalysisResults.map(result => ({
    plotId: result.plotId,
    country: result.country,
    area: Number(result.area) || 0,
    overallRisk: result.overallRisk || 'UNKNOWN',
    complianceStatus: result.complianceStatus || 'UNKNOWN',
    gfwLoss: result.gfwLoss || 'UNKNOWN',
    jrcLoss: result.jrcLoss || 'UNKNOWN',
    sbtnLoss: result.sbtnLoss || 'UNKNOWN',
    highRiskDatasets: result.highRiskDatasets || [],
    geometry: result.geometry // This contains the actual polygon coordinates
  }));

  // Redirect if no analysis data available
  useEffect(() => {
    if (!isLoading && !isError && analysisResults.length === 0) {
      console.log('No analysis results found, redirecting to deforestation monitoring');
      setLocation('/deforestation-monitoring');
    }
  }, [isLoading, isError, analysisResults.length, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-professional mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading analysis data</p>
          <Button onClick={() => setLocation('/deforestation-monitoring')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Monitoring
          </Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalPlots = analysisResults.length;
  const highRiskPlots = analysisResults.filter(r => r.overallRisk === 'HIGH').length;
  const compliantPlots = analysisResults.filter(r => r.complianceStatus === 'COMPLIANT').length;
  const totalArea = analysisResults.reduce((sum, r) => sum + (Number(r.area) || 0), 0).toFixed(2);

  const mapHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>EUDR Map Viewer</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body {
          margin: 0;
          background-color: hsl(0, 0%, 100%);
          color: hsl(20, 14.3%, 4.1%);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .map-container {
          height: 100vh;
          position: relative;
        }

        #map {
          height: 100%;
          width: 100%;
        }

        .map-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background-color: hsl(0, 0%, 100%);
          border: 1px solid hsl(0, 0%, 88%);
          padding: 16px;
          border-radius: 12px;
          min-width: 280px;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .legend-panel {
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          background-color: hsl(0, 0%, 100%);
          border: 1px solid hsl(0, 0%, 88%);
          padding: 16px;
          border-radius: 12px;
          min-width: 200px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-group:last-child {
          margin-bottom: 0;
        }

        .control-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          color: hsl(25, 5.3%, 44.7%);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.025em;
        }

        .control-group select {
          width: 100%;
          padding: 10px 12px;
          background-color: hsl(0, 0%, 100%);
          border: 1px solid hsl(20, 5.9%, 90%);
          border-radius: 8px;
          color: hsl(20, 14.3%, 4.1%);
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }

        .control-group select:focus {
          border-color: hsl(207, 90%, 54%);
          box-shadow: 0 0 0 3px hsl(207, 90%, 54%, 0.1);
        }

        .layer-controls {
          margin-top: 10px;
        }

        .layer-checkbox {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          cursor: pointer !important;
          margin-bottom: 10px !important;
          padding: 8px 10px !important;
          border-radius: 8px !important;
          transition: background-color 0.2s ease !important;
        }

        .layer-checkbox:hover {
          background-color: hsl(60, 4.8%, 95.9%) !important;
        }

        .layer-checkbox input[type="checkbox"] {
          display: none !important;
        }

        .checkmark {
          width: 18px !important;
          height: 18px !important;
          border: 2px solid hsl(20, 5.9%, 90%) !important;
          border-radius: 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
          flex-shrink: 0 !important;
          background-color: hsl(0, 0%, 100%) !important;
        }

        .layer-checkbox input[type="checkbox"]:checked + .checkmark {
          background-color: hsl(207, 90%, 54%) !important;
          border-color: hsl(207, 90%, 54%) !important;
        }

        .layer-checkbox input[type="checkbox"]:checked + .checkmark::after {
          content: '✓' !important;
          color: hsl(211, 100%, 99%) !important;
          font-weight: bold !important;
          font-size: 12px !important;
        }

        .legend-header h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: hsl(20, 14.3%, 4.1%);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 13px;
          color: hsl(25, 5.3%, 44.7%);
        }

        .legend-item:last-child {
          margin-bottom: 0;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          flex-shrink: 0;
          border: 1px solid hsl(0, 0%, 88%);
        }

        /* Modern Popup Styling */
        .leaflet-popup-content-wrapper {
          background: hsl(0, 0%, 100%) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          border: 1px solid hsl(0, 0%, 88%) !important;
          padding: 0 !important;
          overflow: visible !important;
          max-width: none !important;
          min-width: 320px !important;
        }

        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.5 !important;
          max-height: none !important;
          overflow: visible !important;
        }

        .leaflet-popup {
          margin-bottom: 20px !important;
        }

        .leaflet-popup-tip {
          background: hsl(0, 0%, 100%) !important;
          border: 1px solid hsl(0, 0%, 88%) !important;
        }

        .leaflet-popup-close-button {
          color: hsl(25, 5.3%, 44.7%) !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          right: 12px !important;
          top: 12px !important;
          width: 28px !important;
          height: 28px !important;
          background: hsl(60, 4.8%, 95.9%) !important;
          border: 1px solid hsl(0, 0%, 88%) !important;
          border-radius: 6px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s ease !important;
          text-decoration: none !important;
        }

        .leaflet-popup-close-button:hover {
          background: hsl(207, 90%, 54%) !important;
          color: hsl(211, 100%, 99%) !important;
          border-color: hsl(207, 90%, 54%) !important;
          transform: scale(1.05) !important;
        }

        .modern-popup-content {
          background: hsl(0, 0%, 100%) !important;
          padding: 20px !important;
          color: hsl(20, 14.3%, 4.1%) !important;
          min-width: 300px !important;
          max-width: 380px !important;
          border-radius: 12px !important;
          position: relative !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        .modern-popup-content::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 3px !important;
          background: hsl(207, 90%, 54%) !important;
          border-top-left-radius: 12px !important;
          border-top-right-radius: 12px !important;
        }

        .popup-header {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-bottom: 16px !important;
          padding-bottom: 12px !important;
          border-bottom: 1px solid hsl(0, 0%, 88%) !important;
        }

        .popup-icon {
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 18px !important;
          font-weight: bold !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }

        .popup-title {
          margin: 0 !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          color: hsl(20, 14.3%, 4.1%) !important;
          flex: 1 !important;
        }

        .popup-body {
          display: grid !important;
          gap: 12px !important;
        }

        .popup-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 8px 0 !important;
          border-bottom: 1px solid hsl(60, 4.8%, 95.9%) !important;
        }

        .popup-row:last-child {
          border-bottom: none !important;
        }

        .popup-label {
          font-weight: 500 !important;
          color: hsl(25, 5.3%, 44.7%) !important;
          font-size: 13px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .popup-value {
          font-weight: 600 !important;
          color: hsl(20, 14.3%, 4.1%) !important;
          font-size: 14px !important;
          text-align: right !important;
        }

        .risk-badge {
          padding: 4px 12px !important;
          border-radius: 20px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .risk-high {
          background: rgba(220, 38, 38, 0.2) !important;
          color: #dc2626 !important;
          border: 1px solid rgba(220, 38, 38, 0.3) !important;
        }

        .risk-low {
          background: rgba(16, 185, 129, 0.2) !important;
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }

        .compliance-badge {
          padding: 4px 12px !important;
          border-radius: 20px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .compliance-compliant {
          background: rgba(16, 185, 129, 0.2) !important;
          color: #10b981 !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }

        .compliance-non-compliant {
          background: rgba(220, 38, 38, 0.2) !important;
          color: #dc2626 !important;
          border: 1px solid rgba(220, 38, 38, 0.3) !important;
        }
      </style>
    </head>
    <body>
      <div class="map-container">
        <div id="map"></div>
        
        <div class="map-controls">
          <div class="control-group">
            <label>Base Layer</label>
            <select id="baseLayer">
              <option value="osm">OpenStreetMap</option>
              <option value="satellite" selected>Satellite</option>
              <option value="terrain">Terrain</option>
            </select>
          </div>
          
          <div class="control-group">
            <label>Risk Filter</label>
            <select id="riskFilter">
              <option value="all">Show All</option>
              <option value="high">High Risk Only</option>
              <option value="low">Low Risk Only</option>
            </select>
          </div>
          
          <div class="control-group">
            <label>Deforestation Layers</label>
            <div class="layer-controls">
              <label class="layer-checkbox">
                <input type="checkbox" id="gfwLayer">
                <span class="checkmark"></span>
                <span class="layer-name">GFW Forest Loss</span>
              </label>
              <label class="layer-checkbox">
                <input type="checkbox" id="jrcLayer">
                <span class="checkmark"></span>
                <span class="layer-name">JRC Forest</span>
              </label>
              <label class="layer-checkbox">
                <input type="checkbox" id="sbtnLayer">
                <span class="checkmark"></span>
                <span class="layer-name">SBTN Natural Loss</span>
              </label>
              <label class="layer-checkbox">
                <input type="checkbox" id="spatialLegalityLayer">
                <span class="checkmark"></span>
                <span class="layer-name">Spatial Legality (WDPA)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="legend-panel">
          <div class="legend-header">
            <h4>🗺️ Legend</h4>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #dc2626;"></div>
            <span>High Risk - Non-Compliant</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #10b981;"></div>
            <span>Low Risk - Compliant</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #ff4444;"></div>
            <span>GFW Forest Loss</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #10b981;"></div>
            <span>JRC Forest</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #ff00ff;"></div>
            <span>SBTN Natural Loss</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #3388ff;"></div>
            <span>Protected Areas (WDPA)</span>
          </div>
        </div>
      </div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        // Initialize map
        const map = L.map('map').setView([0, 0], 2);

        // Base layers
        const baseLayers = {
          osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }),
          satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics'
          }),
          terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap contributors'
          })
        };

        // Set default base layer
        baseLayers.satellite.addTo(map);

        // Deforestation layers
        const deforestationLayers = {
          gfw: L.tileLayer('https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.12/dynamic/{z}/{x}/{y}.png?start_year=2001&end_year=2023&tree_cover_density_threshold=30&render_type=true_color', {
            attribution: '© Global Forest Watch',
            opacity: 0.8,
            maxZoom: 18
          }),
          jrc: L.tileLayer.wms('https://ies-ows.jrc.ec.europa.eu/iforce/gfc2020/wms.py', {
            layers: 'gfc2020_v2',
            format: 'image/png',
            transparent: true,
            attribution: '© JRC European Commission',
            opacity: 0.8,
            version: '1.3.0'
          }),
          sbtn: L.tileLayer('https://gis-development.koltivaapi.com/data/v1/gee/tiles/sbtn_deforestation/{z}/{x}/{y}', {
            attribution: '© SBTN',
            opacity: 0.7
          }),
          spatialLegality: L.tileLayer.wms('https://geoserver.koltivaapi.com/geoserver/Koltiva-Internal/wms', {
            layers: 'Koltiva-Internal:gis_int_wdpa_ia_strict_nature_reserved',
            format: 'image/png',
            transparent: true,
            version: '1.1.0',
            opacity: 0.7,
            attribution: '© WDPA - World Database on Protected Areas'
          })
        };

        // Analysis results from React - safely embedded
        const analysisResults = JSON.parse(${JSON.stringify(JSON.stringify(analysisResults))});
        
        // Add polygons for each plot using actual geometry data
        const polygons = [];
        const bounds = [];
        
        let plotsRendered = 0;
        let plotsSkipped = 0;
        
        analysisResults.forEach(result => {
          // Skip if no geometry data available
          if (!result.geometry || !result.geometry.coordinates) {
            console.warn('No geometry data for plot:', result.plotId);
            plotsSkipped++;
            return;
          }
          
          // Special debugging for PLOT_025 and PLOT_026
          if (result.plotId === 'PLOT_025' || result.plotId === 'PLOT_026') {
            console.log(\`🔍 Debugging \${result.plotId}:\`);
            console.log('- Geometry type:', result.geometry.type);
            console.log('- Coordinates structure:', result.geometry.coordinates);
            console.log('- First level array length:', result.geometry.coordinates.length);
            if (result.geometry.coordinates[0]) {
              console.log('- Second level array length:', result.geometry.coordinates[0].length);
              if (Array.isArray(result.geometry.coordinates[0][0])) {
                console.log('- First coordinate pair:', result.geometry.coordinates[0][0]);
              }
            }
          }
          
          const isHighRisk = result.overallRisk === 'HIGH';
          const color = isHighRisk ? '#dc2626' : '#10b981';
          
          // Convert coordinates for Leaflet
          let coordinates = result.geometry.coordinates;
          let leafletPolygons = [];
          
          try {
            if (result.geometry.type === 'Polygon') {
              // Handle standard Polygon structure: [[[lng, lat], [lng, lat], ...]]
              if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) && typeof coordinates[0][0][0] === 'number') {
                coordinates = coordinates[0].map(coord => [coord[1], coord[0]]);
                leafletPolygons = coordinates;
              }
              // Handle nested structure from some GeoJSON files
              else if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) && Array.isArray(coordinates[0][0][0])) {
                coordinates = coordinates[0][0].map(coord => [coord[1], coord[0]]);
                leafletPolygons = coordinates;
              }
              else {
                console.error('Unexpected coordinate structure for plot:', result.plotId, coordinates);
                plotsSkipped++;
                return;
              }
            } else if (result.geometry.type === 'MultiPolygon') {
              // MultiPolygon: coordinates = [[[lat, lng], [lat, lng], ...], [[lat, lng], ...]]
              coordinates = result.geometry.coordinates[0][0].map(coord => [coord[1], coord[0]]);
              leafletPolygons = coordinates;
            } else {
              console.warn('Unsupported geometry type for plot:', result.plotId, result.geometry.type);
              plotsSkipped++;
              return;
            }
            
            // Special logging for PLOT_025 and PLOT_026
            if (result.plotId === 'PLOT_025' || result.plotId === 'PLOT_026') {
              console.log(\`✅ Successfully parsed \${result.plotId} coordinates:, count: \${leafletPolygons.length}\`);
              console.log('First few coordinates:', leafletPolygons.slice(0, 3));
            }
            
          } catch (error) {
            console.error('Error parsing coordinates for plot:', result.plotId, error);
            plotsSkipped++;
            return;
          }
          
          // Validate coordinates before creating polygon
          if (!leafletPolygons || leafletPolygons.length < 3) {
            console.error('Invalid polygon coordinates for plot:', result.plotId, 'count:', leafletPolygons?.length);
            plotsSkipped++;
            return;
          }
          
          // Create polygon
          const polygon = L.polygon(leafletPolygons, {
            fillColor: color,
            color: isHighRisk ? '#dc2626' : '#10b981',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.4
          }).addTo(map);
          
          // Add center marker
          const center = polygon.getBounds().getCenter();
          const centerMarker = L.circleMarker(center, {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(map);
          
          // Log successful rendering for PLOT_025 and PLOT_026
          if (result.plotId === 'PLOT_025' || result.plotId === 'PLOT_026') {
            console.log(\`🎯 Successfully rendered \${result.plotId} on map with bounds:\`, polygon.getBounds());
          }
          
          plotsRendered++;
          
          // Add click handler to zoom to polygon
          polygon.on('click', function(e) {
            map.fitBounds(polygon.getBounds(), {
              padding: [50, 50],
              maxZoom: 18
            });
          });
          
          centerMarker.on('click', function(e) {
            map.fitBounds(polygon.getBounds(), {
              padding: [50, 50],
              maxZoom: 18
            });
          });

          // Add popup
          const popupContent = \`
            <div class="modern-popup-content">
              <div class="popup-header">
                <div class="popup-icon" style="background: \${color};">
                  \${isHighRisk ? '⚠️' : '✅'}
                </div>
                <h3 class="popup-title">\${result.plotId}</h3>
              </div>
              
              <div class="popup-body">
                <div class="popup-row">
                  <span class="popup-label">Location</span>
                  <span class="popup-value">\${result.country}</span>
                </div>
                
                <div class="popup-row">
                  <span class="popup-label">Area</span>
                  <span class="popup-value">\${result.area} ha</span>
                </div>
                
                <div class="popup-row">
                  <span class="popup-label">Overall Risk</span>
                  <span class="popup-value">
                    <span class="risk-badge \${isHighRisk ? 'risk-high' : 'risk-low'}">\${result.overallRisk}</span>
                  </span>
                </div>
                
                <div class="popup-row">
                  <span class="popup-label">Compliance Status</span>
                  <span class="popup-value">
                    <span class="compliance-badge \${result.complianceStatus === 'COMPLIANT' ? 'compliance-compliant' : 'compliance-non-compliant'}">\${result.complianceStatus}</span>
                  </span>
                </div>
                
                <div class="popup-row">
                  <span class="popup-label">GFW Forest Loss</span>
                  <span class="popup-value" style="color: \${result.gfwLoss === 'HIGH' ? '#dc2626' : '#10b981'}">\${result.gfwLoss}</span>
                </div>
                
                <div class="popup-row">
                  <span class="popup-label">JRC Forest Loss</span>
                  <span class="popup-value" style="color: \${result.jrcLoss === 'HIGH' ? '#dc2626' : '#10b981'}">\${result.jrcLoss}</span>
                </div>
                
                <div class="popup-row">
                  <span class="popup-label">SBTN Natural Loss</span>
                  <span class="popup-value" style="color: \${result.sbtnLoss === 'HIGH' ? '#dc2626' : '#10b981'}">\${result.sbtnLoss}</span>
                </div>
                
                \${result.highRiskDatasets.length > 0 ? \`
                  <div style="margin-top: 16px;">
                    <div class="popup-label" style="margin-bottom: 8px;">High Risk Indicators</div>
                    <div class="datasets-list">
                      \${result.highRiskDatasets.map(dataset => \`<div class="dataset-item">• \${dataset}</div>\`).join('')}
                    </div>
                  </div>
                \` : ''}
              </div>
            </div>
          \`;
          
          polygon.bindPopup(popupContent, {
            maxWidth: 400,
            minWidth: 300,
            maxHeight: 600,
            autoPan: true,
            className: 'modern-popup'
          });
          
          centerMarker.bindPopup(popupContent, {
            maxWidth: 400,
            minWidth: 300,
            maxHeight: 600,
            autoPan: true,
            className: 'modern-popup'
          });
          
          polygons.push(polygon);
          bounds.push(polygon.getBounds());
        });

        // Log rendering summary
        console.log(\`📊 Map Rendering Summary: \${plotsRendered} plots rendered successfully, \${plotsSkipped} plots skipped\`);
        console.log(\`Total analysis results: \${analysisResults.length}\`);
        
        if (plotsSkipped > 0) {
          console.warn(\`⚠️  \${plotsSkipped} plots are missing from the map due to geometry issues\`);
        }

        // Fit map to show all polygons
        if (bounds.length > 0) {
          const group = new L.featureGroup(polygons);
          map.fitBounds(group.getBounds(), { padding: [20, 20] });
          console.log(\`🗺️  Map fitted to show \${bounds.length} polygon bounds\`);
        } else {
          console.warn('No valid polygon bounds found, using default map view');
        }

        // Control handlers
        document.getElementById('baseLayer').addEventListener('change', function(e) {
          const layer = e.target.value;
          map.eachLayer(function(mapLayer) {
            if (mapLayer instanceof L.TileLayer && baseLayers[layer] !== mapLayer) {
              map.removeLayer(mapLayer);
            }
          });
          baseLayers[layer].addTo(map);
        });

        // Layer toggle handlers
        document.getElementById('gfwLayer').addEventListener('change', function(e) {
          if (e.target.checked) {
            deforestationLayers.gfw.addTo(map);
          } else {
            map.removeLayer(deforestationLayers.gfw);
          }
        });

        document.getElementById('jrcLayer').addEventListener('change', function(e) {
          if (e.target.checked) {
            deforestationLayers.jrc.addTo(map);
          } else {
            map.removeLayer(deforestationLayers.jrc);
          }
        });

        document.getElementById('sbtnLayer').addEventListener('change', function(e) {
          if (e.target.checked) {
            deforestationLayers.sbtn.addTo(map);
          } else {
            map.removeLayer(deforestationLayers.sbtn);
          }
        });

        document.getElementById('spatialLegalityLayer').addEventListener('change', function(e) {
          if (e.target.checked) {
            deforestationLayers.spatialLegality.addTo(map);
          } else {
            map.removeLayer(deforestationLayers.spatialLegality);
          }
        });

        // Risk filter handler
        document.getElementById('riskFilter').addEventListener('change', function(e) {
          const filter = e.target.value;
          polygons.forEach((polygon, index) => {
            const result = analysisResults[index];
            if (!result) return;
            
            const show = filter === 'all' || 
                        (filter === 'high' && result.overallRisk === 'HIGH') ||
                        (filter === 'low' && result.overallRisk === 'LOW');
            
            if (show) {
              polygon.addTo(map);
            } else {
              map.removeLayer(polygon);
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">EUDR Map Viewer</h1>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-600">{totalPlots}</span>
                <span className="text-gray-500">Plots</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-600">{highRiskPlots}</span>
                <span className="text-gray-500">High Risk</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-600">{compliantPlots}</span>
                <span className="text-gray-500">Compliant</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-600">{totalArea}</span>
                <span className="text-gray-500">ha Total</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              // Reset view functionality can be added here
              window.location.reload();
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset View
          </Button>
          
          <Button
            className="flex items-center gap-2"
            onClick={() => setLocation('/deforestation-monitoring')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative">
        <iframe
          srcDoc={mapHtml}
          className="w-full h-full border-0"
          title="EUDR Map Viewer"
        />
      </div>
    </div>
  );
}