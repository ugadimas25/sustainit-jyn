import { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EudrMapViewerProps {
  analysisResults: any[];
  onClose: () => void;
}

export function EudrMapViewer({ analysisResults, onClose }: EudrMapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (mapRef.current) {
      // Create the complete HTML content for the map viewer
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
              background-color: #000;
              color: #fff;
              font-family: Arial, sans-serif;
            }

            .header {
              background-color: #1a1a1a;
              padding: 15px 20px;
              border-bottom: 1px solid #333;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .header h1 {
              margin: 0;
              font-size: 24px;
            }

            .back-btn {
              background-color: #6366f1;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
              text-decoration: none;
              display: inline-block;
            }

            .back-btn:hover {
              background-color: #5855eb;
            }

            .map-container {
              height: calc(100vh - 80px);
              position: relative;
            }

            #map {
              height: 100%;
              width: 100%;
            }

            .map-controls {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 1000;
              background-color: rgba(26, 26, 26, 0.8);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 15px;
              border-radius: 8px;
              min-width: 250px;
              backdrop-filter: blur(10px);
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .control-group {
              margin-bottom: 15px;
            }

            .control-group:last-child {
              margin-bottom: 0;
            }

            .control-group label {
              display: block;
              margin-bottom: 5px;
              font-size: 12px;
              color: #ccc;
              text-transform: uppercase;
              font-weight: bold;
            }

            .control-group select {
              width: 100%;
              padding: 8px;
              background-color: #2a2a2a;
              border: 1px solid #404040;
              border-radius: 4px;
              color: #fff;
              font-size: 14px;
            }

            .layer-controls {
              margin-top: 10px;
            }

            .layer-checkbox {
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              cursor: pointer !important;
              margin-bottom: 8px !important;
              padding: 6px !important;
              border-radius: 4px !important;
              transition: background-color 0.2s ease !important;
            }

            .layer-checkbox:hover {
              background-color: rgba(255, 255, 255, 0.05) !important;
            }

            .layer-checkbox input[type="checkbox"] {
              display: none !important;
            }

            .checkmark {
              width: 16px !important;
              height: 16px !important;
              border: 2px solid #666 !important;
              border-radius: 3px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.3s ease !important;
              flex-shrink: 0 !important;
            }

            .layer-checkbox input[type="checkbox"]:checked + .checkmark {
              background-color: #4da6ff !important;
              border-color: #4da6ff !important;
            }

            .layer-checkbox input[type="checkbox"]:checked + .checkmark::after {
              content: '✓' !important;
              color: white !important;
              font-weight: bold !important;
              font-size: 12px !important;
            }

            .layer-name {
              color: #ccc !important;
              font-size: 13px !important;
              flex: 1 !important;
            }

            .legend-panel {
              position: absolute;
              bottom: 20px;
              left: 20px;
              background-color: rgba(26, 26, 26, 0.85);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              padding: 15px;
              min-width: 250px;
              z-index: 1000;
              backdrop-filter: blur(12px);
              box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
            }

            .legend-header h4 {
              margin: 0 0 10px 0;
              color: #4da6ff;
              font-size: 16px;
            }

            .legend-item {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;
              font-size: 13px;
              color: #ccc;
            }

            .legend-color {
              width: 16px;
              height: 16px;
              border-radius: 3px;
              flex-shrink: 0;
              border: 1px solid #555;
            }

            @keyframes pulse-red {
              0% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(220, 38, 38, 0.7); }
              70% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 15px rgba(220, 38, 38, 0); }
              100% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(220, 38, 38, 0); }
            }

            @keyframes pulse-green {
              0% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(16, 185, 129, 0.7); }
              70% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 15px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0 rgba(16, 185, 129, 0); }
            }

            /* Modern Popup Styling */
            .leaflet-popup-content-wrapper {
              background: transparent !important;
              border-radius: 16px !important;
              box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) !important;
              padding: 0 !important;
              overflow: visible !important;
              backdrop-filter: blur(20px) !important;
              max-width: none !important;
              min-width: 300px !important;
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
              background: rgba(26, 26, 26, 0.95) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }

            .leaflet-popup-close-button {
              color: #fff !important;
              font-size: 20px !important;
              font-weight: 300 !important;
              right: 12px !important;
              top: 12px !important;
              width: 32px !important;
              height: 32px !important;
              background: rgba(255, 255, 255, 0.1) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              border-radius: 50% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
              text-decoration: none !important;
              backdrop-filter: blur(10px) !important;
            }

            .leaflet-popup-close-button:hover {
              background: rgba(255, 255, 255, 0.2) !important;
              border-color: rgba(255, 255, 255, 0.3) !important;
              transform: scale(1.1) rotate(90deg) !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            }

            .modern-popup-content {
              background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(42, 42, 42, 0.95)) !important;
              backdrop-filter: blur(20px) !important;
              padding: 24px !important;
              color: white !important;
              min-width: 300px !important;
              max-width: 400px !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              border-radius: 16px !important;
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
              background: linear-gradient(90deg, #dc2626, #f59e0b, #10b981, #3b82f6) !important;
            }

            .popup-header {
              display: flex !important;
              align-items: center !important;
              gap: 12px !important;
              margin-bottom: 16px !important;
              padding-bottom: 12px !important;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
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
              color: #fff !important;
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
              border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
            }

            .popup-row:last-child {
              border-bottom: none !important;
            }

            .popup-label {
              font-weight: 500 !important;
              color: rgba(255, 255, 255, 0.7) !important;
              font-size: 13px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
            }

            .popup-value {
              font-weight: 600 !important;
              color: #fff !important;
              font-size: 14px !important;
              text-align: right !important;
            }

            .risk-badge {
              padding: 4px 12px !important;
              border-radius: 20px !important;
              font-size: 12px !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
            }

            .risk-high {
              background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
              color: white !important;
            }

            .risk-low {
              background: linear-gradient(135deg, #10b981, #059669) !important;
              color: white !important;
            }

            .compliance-badge {
              padding: 4px 12px !important;
              border-radius: 20px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              text-transform: uppercase !important;
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

            .datasets-list {
              margin-top: 8px !important;
              padding: 12px !important;
              background: rgba(0, 0, 0, 0.3) !important;
              border-radius: 8px !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }

            .dataset-item {
              font-size: 12px !important;
              color: rgba(255, 255, 255, 0.8) !important;
              margin-bottom: 4px !important;
            }

            .dataset-item:last-child {
              margin-bottom: 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EUDR Map Viewer</h1>
            <button onclick="window.parent.postMessage({type: 'closeMap'}, '*')" class="back-btn">← Back to Results</button>
          </div>

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
                    <span class="layer-name">JRC Deforestation</span>
                  </label>
                  <label class="layer-checkbox">
                    <input type="checkbox" id="sbtnLayer">
                    <span class="checkmark"></span>
                    <span class="layer-name">SBTN Natural Loss</span>
                  </label>
                  <label class="layer-checkbox">
                    <input type="checkbox" id="primaryForestLayer">
                    <span class="checkmark"></span>
                    <span class="layer-name">Primary Forest 2020</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="legend-panel">
              <div class="legend-header">
                <h4>🗺️ Legend</h4>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #dc2626; animation: pulse-red 2s infinite;"></div>
                <span>High Risk - Non-Compliant</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10b981; animation: pulse-green 2s infinite;"></div>
                <span>Low Risk - Compliant</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #ff4444;"></div>
                <span>GFW Forest Loss</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #ff8800;"></div>
                <span>JRC Deforestation</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #ff00ff;"></div>
                <span>SBTN Natural Loss</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #00ff00;"></div>
                <span>Primary Forest 2020</span>
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

            // Deforestation layers from multiple sources
            const deforestationLayers = {
              gfw: L.tileLayer('https://storage.googleapis.com/wri-public/hansen_2013/gfw2015/loss_year_2015/loss_year_2015_{z}_{x}_{y}.png', {
                attribution: '© Global Forest Watch / Hansen',
                opacity: 0.8,
                maxZoom: 12,
                minZoom: 3
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
              primaryForest: L.tileLayer('https://gis-development.koltivaapi.com/data/v1/gee/tiles/primary_forest_2020/{z}/{x}/{y}', {
                attribution: '© Primary Forest',
                opacity: 0.6
              })
            };

            // Analysis results from React (contains actual polygon geometries)
            const analysisResults = ${JSON.stringify(analysisResults)};
            
            // Add polygons for each plot using actual geometry data
            const polygons = [];
            const bounds = [];
            
            analysisResults.forEach(result => {
              // Skip if no geometry data available
              if (!result.geometry || !result.geometry.coordinates) {
                console.warn('No geometry data for plot:', result.plotId);
                return;
              }
              
              const isHighRisk = result.overallRisk === 'HIGH';
              const color = isHighRisk ? '#dc2626' : '#10b981';
              
              // Convert coordinates for Leaflet (handle polygon structure)
              let coordinates = result.geometry.coordinates;
              if (result.geometry.type === 'Polygon') {
                // Polygon coordinates are [[[lng, lat], [lng, lat], ...]]
                coordinates = coordinates[0].map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
              }
              
              // Create polygon with styling
              const polygon = L.polygon(coordinates, {
                fillColor: color,
                color: isHighRisk ? '#dc2626' : '#10b981',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4,
                className: isHighRisk ? 'high-risk-polygon' : 'low-risk-polygon'
              }).addTo(map);
              
              // Add center marker for better visibility
              const center = polygon.getBounds().getCenter();
              const centerMarker = L.circleMarker(center, {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
              }).addTo(map);
              
              // Add modern popup with enhanced styling
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
              
              // Bind popup with custom options to prevent cut-off
              const popupOptions = {
                maxWidth: 400,
                minWidth: 300,
                maxHeight: 600,
                autoPan: true,
                autoPanPaddingTopLeft: [20, 20],
                autoPanPaddingBottomRight: [20, 20],
                keepInView: true,
                className: 'modern-popup'
              };
              
              polygon.bindPopup(popupContent, popupOptions);
              centerMarker.bindPopup(popupContent, popupOptions);
              
              // Add click event to zoom to polygon bounds
              polygon.on('click', function(e) {
                const bounds = polygon.getBounds();
                map.fitBounds(bounds, {
                  padding: [50, 50],
                  maxZoom: 16
                });
              });
              
              centerMarker.on('click', function(e) {
                const bounds = polygon.getBounds();
                map.fitBounds(bounds, {
                  padding: [50, 50],
                  maxZoom: 16
                });
              });
              
              // Add pulsing animation to center marker
              const animation = isHighRisk ? 'pulse-red 2s infinite' : 'pulse-green 2s infinite';
              setTimeout(() => {
                if (centerMarker.getElement()) {
                  centerMarker.getElement().style.animation = animation;
                }
              }, 100);
              
              polygons.push({ 
                polygon, 
                centerMarker, 
                risk: result.overallRisk,
                bounds: polygon.getBounds()
              });
              
              bounds.push(polygon.getBounds());
            });

            // Fit map to show all polygons
            if (bounds.length > 0) {
              const group = new L.featureGroup([]);
              bounds.forEach(bound => {
                const tempLayer = L.rectangle(bound);
                group.addLayer(tempLayer);
              });
              map.fitBounds(group.getBounds().pad(0.1));
            }

            // Base layer control
            document.getElementById('baseLayer').addEventListener('change', function(e) {
              map.eachLayer(layer => {
                if (baseLayers[layer.options?.id || 'unknown']) {
                  map.removeLayer(layer);
                }
              });
              Object.values(baseLayers).forEach(layer => map.removeLayer(layer));
              baseLayers[e.target.value].addTo(map);
            });

            // Risk filter control
            document.getElementById('riskFilter').addEventListener('change', function(e) {
              const filterValue = e.target.value;
              polygons.forEach(({polygon, centerMarker, risk}) => {
                if (filterValue === 'all') {
                  polygon.addTo(map);
                  centerMarker.addTo(map);
                } else if (filterValue === 'high' && risk === 'HIGH') {
                  polygon.addTo(map);
                  centerMarker.addTo(map);
                } else if (filterValue === 'low' && risk === 'LOW') {
                  polygon.addTo(map);
                  centerMarker.addTo(map);
                } else {
                  map.removeLayer(polygon);
                  map.removeLayer(centerMarker);
                }
              });
            });

            // Deforestation layer controls
            document.getElementById('gfwLayer').addEventListener('change', function(e) {
              if (e.target.checked) {
                try {
                  deforestationLayers.gfw.addTo(map);
                  console.log('GFW tree cover loss layer added to map');
                  console.log('GFW layer URL template:', deforestationLayers.gfw._url);
                  
                  // Force map refresh to show the layer
                  map.invalidateSize();
                  
                  // Test if tiles are loading
                  deforestationLayers.gfw.on('tileload', function(e) {
                    console.log('GFW tile loaded successfully at:', e.coords);
                  });
                  
                  deforestationLayers.gfw.on('tileerror', function(e) {
                    console.error('GFW tile load error:', e.error, 'at coords:', e.coords);
                  });
                  
                  deforestationLayers.gfw.on('loading', function() {
                    console.log('GFW layer started loading tiles');
                  });
                  
                  deforestationLayers.gfw.on('load', function() {
                    console.log('GFW layer finished loading tiles');
                  });
                  
                } catch (error) {
                  console.error('Error adding GFW layer:', error);
                }
              } else {
                try {
                  map.removeLayer(deforestationLayers.gfw);
                  console.log('GFW tree cover loss layer removed from map');
                } catch (error) {
                  console.error('Error removing GFW layer:', error);
                }
              }
            });

            document.getElementById('jrcLayer').addEventListener('change', function(e) {
              if (e.target.checked) {
                try {
                  deforestationLayers.jrc.addTo(map);
                  console.log('JRC WMS layer added to map');
                } catch (error) {
                  console.error('Error adding JRC WMS layer:', error);
                }
              } else {
                try {
                  map.removeLayer(deforestationLayers.jrc);
                  console.log('JRC WMS layer removed from map');
                } catch (error) {
                  console.error('Error removing JRC WMS layer:', error);
                }
              }
            });

            document.getElementById('sbtnLayer').addEventListener('change', function(e) {
              if (e.target.checked) {
                deforestationLayers.sbtn.addTo(map);
              } else {
                map.removeLayer(deforestationLayers.sbtn);
              }
            });

            document.getElementById('primaryForestLayer').addEventListener('change', function(e) {
              if (e.target.checked) {
                deforestationLayers.primaryForest.addTo(map);
              } else {
                map.removeLayer(deforestationLayers.primaryForest);
              }
            });

            console.log('EUDR Map loaded with', analysisResults.length, 'plots');
            console.log('Polygons rendered:', polygons.length);
            console.log('Sample geometry data:', analysisResults[0]?.geometry);
          </script>
        </body>
        </html>
      `;

      // Create iframe and inject the HTML
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.srcdoc = mapHtml;

      mapRef.current.appendChild(iframe);
      setIsLoading(false);

      // Listen for close message from iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'closeMap') {
          onClose();
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }
      };
    }
  }, [analysisResults, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-lg">Loading EUDR Map...</div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="bg-black/50 border-white/20 text-white hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}