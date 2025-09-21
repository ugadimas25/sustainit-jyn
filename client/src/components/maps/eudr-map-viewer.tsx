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
              background-color: hsl(0, 0%, 100%);
              color: hsl(20, 14.3%, 4.1%);
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            .header {
              background-color: hsl(0, 0%, 100%);
              padding: 16px 24px;
              border-bottom: 1px solid hsl(0, 0%, 88%);
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              min-height: 70px;
            }

            .header-left {
              display: flex;
              align-items: center;
              gap: 24px;
              flex: 1;
            }

            .header h1 {
              margin: 0;
              font-size: 20px;
              color: hsl(20, 14.3%, 4.1%);
              font-weight: 600;
              white-space: nowrap;
            }

            .header-stats {
              display: flex;
              align-items: center;
              gap: 16px;
              margin-left: 8px;
            }

            .stat-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;
            }

            .stat-count {
              font-size: 18px;
              font-weight: 700;
              color: hsl(207, 90%, 54%);
              line-height: 1;
            }

            .stat-label {
              font-size: 11px;
              font-weight: 500;
              color: hsl(25, 5.3%, 44.7%);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1;
            }

            .stat-divider {
              color: hsl(0, 0%, 88%);
              font-weight: 300;
              font-size: 16px;
            }

            .header-right {
              display: flex;
              align-items: center;
            }

            .header-actions {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .action-btn {
              border: none;
              padding: 10px 16px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              white-space: nowrap;
              text-decoration: none;
            }

            .action-btn.primary {
              background-color: hsl(207, 90%, 54%);
              color: hsl(211, 100%, 99%);
            }

            .action-btn.primary:hover {
              background-color: hsl(207, 90%, 48%);
              transform: translateY(-1px);
              box-shadow: 0 4px 12px hsl(207, 90%, 54%, 0.3);
            }

            .action-btn.secondary {
              background-color: hsl(60, 4.8%, 95.9%);
              color: hsl(25, 5.3%, 44.7%);
              border: 1px solid hsl(0, 0%, 88%);
            }

            .action-btn.secondary:hover {
              background-color: hsl(207, 90%, 54%);
              color: hsl(211, 100%, 99%);
              border-color: hsl(207, 90%, 54%);
              transform: translateY(-1px);
            }

            .map-container {
              height: calc(100vh - 70px);
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
              background-color: hsl(0, 0%, 100%);
              border: 1px solid hsl(0, 0%, 88%);
              padding: 16px;
              border-radius: 12px;
              min-width: 280px;
              backdrop-filter: blur(10px);
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

            .layer-name {
              color: hsl(20, 14.3%, 4.1%) !important;
              font-size: 14px !important;
              flex: 1 !important;
              font-weight: 500 !important;
            }

            .legend-panel {
              position: absolute;
              bottom: 20px;
              left: 20px;
              background-color: hsl(0, 0%, 100%);
              border: 1px solid hsl(0, 0%, 88%);
              border-radius: 12px;
              padding: 16px;
              min-width: 280px;
              z-index: 1000;
              backdrop-filter: blur(12px);
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            }

            .legend-header h4 {
              margin: 0 0 12px 0;
              color: hsl(207, 90%, 54%);
              font-size: 16px;
              font-weight: 600;
            }

            .legend-item {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 10px;
              color: hsl(20, 14.3%, 4.1%);
              font-size: 14px;
              font-weight: 500;
            }

            .legend-color {
              width: 16px;
              height: 16px;
              border-radius: 4px;
              flex-shrink: 0;
              border: 1px solid hsl(0, 0%, 88%);
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
            <div class="header-left">
              <h1>EUDR Map Viewer</h1>
              <div class="header-stats">
                <span class="stat-item">
                  <span class="stat-count">${analysisResults.length}</span>
                  <span class="stat-label">Plots</span>
                </span>
                <span class="stat-divider">|</span>
                <span class="stat-item">
                  <span class="stat-count">${analysisResults.filter(r => r.overallRisk === 'HIGH').length}</span>
                  <span class="stat-label">High Risk</span>
                </span>
                <span class="stat-divider">|</span>
                <span class="stat-item">
                  <span class="stat-count">${analysisResults.filter(r => r.complianceStatus === 'COMPLIANT').length}</span>
                  <span class="stat-label">Compliant</span>
                </span>
              </div>
            </div>
            <div class="header-right">
              <div class="header-actions">
                <button class="action-btn secondary" onclick="map.setView([0, 0], 2)">
                  <span>🌍</span>
                  Reset View
                </button>
                <button class="action-btn primary" onclick="window.parent.postMessage({type: 'backToResults'}, '*')">
                  <span>←</span>
                  Back to Results
                </button>
              </div>
            </div>
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
                <label>Protected Areas</label>
                <div class="layer-controls">
                  <label class="layer-checkbox">
                    <input type="checkbox" id="wdpaLayer">
                    <span class="checkmark"></span>
                    <span class="layer-name">WDPA Protected Areas</span>
                  </label>
                </div>
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
              <div style="margin: 10px 0; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px; color: #4da6ff;">WDPA Protected Areas:</div>
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #d2b48c;"></div>
                  <span>All WDPA Protected Areas</span>
                </div>
              </div>
              <div style="margin: 10px 0; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
                <div style="font-weight: bold; margin-bottom: 5px; color: #4da6ff;">Deforestation Layers:</div>
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

            // Enhanced WDPA color mapping for all IUCN categories - All light brown
            const wdpaColors = {
              'Ia': '#d2b48c',    // Strict Nature Reserve - Light brown (tan)
              'Ib': '#d2b48c',    // Wilderness Area - Light brown (tan)
              'II': '#d2b48c',    // National Park - Light brown (tan)
              'III': '#d2b48c',   // Natural Monument - Light brown (tan)
              'IV': '#d2b48c',    // Habitat Management - Light brown (tan)
              'V': '#d2b48c',     // Protected Landscape - Light brown (tan)
              'VI': '#d2b48c',    // Sustainable Use - Light brown (tan)
              'Not Reported': '#d2b48c',    // Light brown (tan)
              'Not Assigned': '#d2b48c',    // Light brown (tan)
              // Additional variations found in data
              'I': '#d2b48c',     // Light brown (tan)
              'Ia/Ib': '#d2b48c', // Light brown (tan)
              'Other': '#d2b48c', // Light brown (tan)
              '': '#d2b48c'       // Light brown (tan)
            };

            // WDPA Protected Areas Layer
            let wdpaLayer = null;
            let wdpaTileLayer = null;

            // Function to create WDPA layer using ArcGIS tile service
            function createWDPALayer() {
              // Try multiple WDPA service URLs for better compatibility
              const wdpaUrls = [
                'https://services5.arcgis.com/Mj0hjvkNtV7NRhA7/ArcGIS/rest/services/WDPA_v0/MapServer/tile/{z}/{y}/{x}',
                'https://services5.arcgis.com/Mj0hjvkNtV7NRhA7/arcgis/rest/services/WDPA_v0/MapServer/tile/{z}/{y}/{x}'
              ];
              
              wdpaTileLayer = L.tileLayer(wdpaUrls[0], {
                attribution: '© WDPA - World Database on Protected Areas',
                opacity: 0.7,
                maxZoom: 18,
                className: 'wdpa-tile-layer',
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
              });

              console.log('Created WDPA tile layer with URL:', wdpaUrls[0]);
              return Promise.resolve(wdpaTileLayer);
            }

            // Alternative function to load WDPA as GeoJSON for detailed features
            function createWDPAGeoJSONLayer() {
              console.log('Loading WDPA GeoJSON layer...');
              
              // Get a wider bounding box to capture more features
              const bounds = map.getBounds();
              const expandedBounds = bounds.pad(1.0); // Expand bounds by 100% to get more features
              const bbox = \`\${expandedBounds.getWest()},\${expandedBounds.getSouth()},\${expandedBounds.getEast()},\${expandedBounds.getNorth()}\`;
              
              // Enhanced query using correct field name 'iucn_cat' and get ALL categories
              const query = new URLSearchParams({
                where: "1=1", // Get all features - no filtering by category
                outFields: 'wdpaid,name,desig,desig_eng,iucn_cat,status,gov_type,mang_auth,rep_area,iso3', // Specific fields we need
                geometry: bbox,
                geometryType: 'esriGeometryEnvelope',
                spatialRel: 'esriSpatialRelIntersects',
                f: 'geojson',
                returnGeometry: 'true',
                maxRecordCount: 5000, // Increase limit significantly
                orderByFields: 'iucn_cat,rep_area DESC' // Order by category then by area
              });

              const url = \`https://services5.arcgis.com/Mj0hjvkNtV7NRhA7/ArcGIS/rest/services/WDPA_v0/FeatureServer/1/query?\${query}\`;
              
              console.log('WDPA query URL:', url);
              console.log('Query bbox:', bbox);

              return fetch(url)
                .then(response => {
                  console.log('WDPA response status:', response.status);
                  if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                  }
                  return response.json();
                })
                .then(data => {
                  console.log('WDPA data received:', data);
                  
                  if (!data.features || data.features.length === 0) {
                    console.warn('No WDPA features found in current map bounds - trying global query');
                    
                    // If no features found in bounds, try a global query for a sample
                    const globalQuery = new URLSearchParams({
                      where: '1=1',
                      outFields: 'wdpaid,name,desig_eng,iucn_cat,status,gov_type,mang_auth,rep_area,iso3',
                      f: 'geojson',
                      returnGeometry: 'true',
                      maxRecordCount: 500,
                      orderByFields: 'rep_area DESC' // Get largest areas first
                    });
                    
                    const globalUrl = \`https://services5.arcgis.com/Mj0hjvkNtV7NRhA7/ArcGIS/rest/services/WDPA_v0/FeatureServer/1/query?\${globalQuery}\`;
                    console.log('Trying global WDPA query:', globalUrl);
                    
                    return fetch(globalUrl).then(resp => resp.json());
                  }

                  console.log(\`Found \${data.features.length} WDPA features\`);
                  
                  // Enhanced category analysis
                  const categoryStats = {};
                  const uniqueCategories = new Set();
                  
                  data.features.forEach(feature => {
                    const cat = feature.properties.iucn_cat || 'Not Assigned';
                    const cleanCat = cat.toString().trim() || 'Empty';
                    uniqueCategories.add(cleanCat);
                    categoryStats[cleanCat] = (categoryStats[cleanCat] || 0) + 1;
                  });
                  
                  console.log('IUCN Categories found:', Array.from(uniqueCategories));
                  console.log('Category distribution:', categoryStats);
                  
                  const layer = L.geoJSON(data, {
                    style: function(feature) {
                      // Force all WDPA features to use light brown color
                      const lightBrown = '#d2b48c';
                      
                      console.log(\`Styling WDPA feature \${feature.properties.name || feature.properties.NAME || 'Unknown'} with light brown color\`);
                      
                      return {
                        color: lightBrown,
                        fillColor: lightBrown,
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.6,
                        className: 'wdpa-protected-area'
                      };
                    },
                    onEachFeature: function(feature, layer) {
                      const props = feature.properties;
                      const name = props.name || 'Unknown';
                      const designation = props.desig_eng || 'Unknown';
                      const iucnCategory = props.iucn_cat || 'Not Assigned';
                      const status = props.status || 'Unknown';
                      const wdpaId = props.wdpaid || 'N/A';
                      const govType = props.gov_type || 'Unknown';
                      const managementAuth = props.mang_auth || 'Unknown';
                      const area = props.rep_area || 'Unknown';
                      
                      const popupContent = \`
                        <div style="min-width: 300px; font-family: Arial, sans-serif;">
                          <h4 style="margin: 0 0 10px 0; color: #264653; font-size: 16px; font-weight: bold; border-bottom: 2px solid #264653; padding-bottom: 5px;">\${name}</h4>
                          <div style="font-size: 13px; line-height: 1.4;">
                            <div style="margin-bottom: 5px;"><strong>WDPA ID:</strong> \${wdpaId}</div>
                            <div style="margin-bottom: 5px;"><strong>Designation:</strong> \${designation}</div>
                            <div style="margin-bottom: 5px;"><strong>IUCN Category:</strong> 
                              <span style="background: #d2b48c; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;">\${iucnCategory}</span>
                            </div>
                            <div style="margin-bottom: 5px;"><strong>Status:</strong> \${status}</div>
                            <div style="margin-bottom: 5px;"><strong>Governance:</strong> \${govType}</div>
                            <div style="margin-bottom: 5px;"><strong>Area:</strong> \${area} ha</div>
                            <div style="margin-bottom: 5px;"><strong>Management:</strong> \${managementAuth}</div>
                            <div style="margin-top: 10px; padding: 5px; background: #f0f8f0; border-left: 4px solid #264653; font-size: 11px;">
                              <strong>Protection Level:</strong> \${getProtectionLevel(iucnCategory)}
                            </div>
                          </div>
                        </div>
                      \`;
                      
                      layer.bindPopup(popupContent, {
                        maxWidth: 350,
                        className: 'wdpa-popup'
                      });
                    },
                    filter: function(feature) {
                      // Don't filter out any features - show all categories
                      return true;
                    }
                  });
                  
                  return layer;
                })
                .catch(error => {
                  console.error('Error loading WDPA GeoJSON layer:', error);
                  return null;
                });
            }

            // Helper function to get protection level description
            function getProtectionLevel(iucnCategory) {
              const descriptions = {
                'Ia': 'Strict Nature Reserve - No human activities, scientific research only',
                'Ib': 'Wilderness Area - Large unmodified areas, minimal human impact',
                'II': 'National Park - Ecosystem protection and education',
                'III': 'Natural Monument - Specific natural features protection',
                'IV': 'Habitat Management Area - Active conservation management',
                'V': 'Protected Landscape - Sustainable interaction with nature',
                'VI': 'Sustainable Use Area - Conservation with sustainable resource use',
                'I': 'Strict Protection - Category I protection',
                'Ia/Ib': 'Mixed strict protection areas',
                'Other': 'Other protected area designation',
                'Not Reported': 'Protection level not specified in database',
                'Not Assigned': 'No IUCN category assigned to this area',
                '': 'Category information not available'
              };
              return descriptions[iucnCategory] || \`Unknown protection level: \${iucnCategory}\`;
            }

            // Deforestation layers from multiple sources
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
              })
            };

            // Analysis results from React (contains actual polygon geometries)
            const analysisResults = ${JSON.stringify(analysisResults)};

            // Add polygons for each plot using actual geometry data
            const polygons = [];
            const bounds = [];

            let plotsWithGeometry = 0;
            let plotsWithoutGeometry = 0;

            analysisResults.forEach(result => {
              // Check if geometry data is available
              if (!result.geometry || !result.geometry.coordinates || !result.geometry.coordinates[0]) {
                console.warn('No valid geometry data for plot:', result.plotId, 'geometry:', result.geometry);
                plotsWithoutGeometry++;

                // Add a fallback marker for plots without geometry (place them in Indonesia center)
                const fallbackMarker = L.circleMarker([-2.5, 118], {
                  radius: 12,
                  fillColor: '#ff6b35',
                  color: '#fff',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.8,
                  className: 'missing-geometry-marker'
                }).addTo(map);

                // Add popup for missing geometry plots
                const popupContent = \`
                  <div class="modern-popup-content">
                    <div class="popup-header">
                      <div class="popup-icon" style="background: #ff6b35;">
                        ❌
                      </div>
                      <h3 class="popup-title">\${result.plotId}</h3>
                    </div>

                    <div class="popup-body">
                      <div class="popup-row">
                        <span class="popup-label">Status</span>
                        <span class="popup-value" style="color: #ff6b35;">Missing Geometry Data</span>
                      </div>
                      <div class="popup-row">
                        <span class="popup-label">Location</span>
                        <span class="popup-value">\${result.country}</span>
                      </div>
                      <div class="popup-row">
                        <span class="popup-label">Area</span>
                        <span class="popup-value">\${result.area} ha</span>
                      </div>
                    </div>
                  </div>
                \`;

                fallbackMarker.bindPopup(popupContent, {
                  maxWidth: 400,
                  minWidth: 300,
                  className: 'modern-popup'
                });

                return;
              }

              plotsWithGeometry++;

              const isHighRisk = result.overallRisk === 'HIGH';
              const color = isHighRisk ? '#dc2626' : '#10b981';

              try {
                // Convert coordinates for Leaflet (handle complex polygon structures)
                let coordinates = result.geometry.coordinates;

                console.log(\`Processing \${result.plotId} geometry:, type: \${result.geometry.type}, coordinates structure:\`, coordinates);

                // Handle different coordinate structures
                if (result.geometry.type === 'Polygon') {
                  // Standard Polygon: [[[lng, lat], [lng, lat], ...]]
                  if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) && typeof coordinates[0][0][0] === 'number') {
                    coordinates = coordinates[0].map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
                  }
                  // Nested structure: [[[[lng, lat], [lng, lat], ...]]]
                  else if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) && Array.isArray(coordinates[0][0][0])) {
                    coordinates = coordinates[0][0].map(coord => [coord[1], coord[0]]); // Convert nested [lng, lat] to [lat, lng]
                  }
                } else if (result.geometry.type === 'MultiPolygon') {
                  // MultiPolygon: [[[[lng, lat], [lng, lat], ...]], ...]
                  coordinates = coordinates[0][0].map(coord => [coord[1], coord[0]]); // Take first polygon and convert
                }

                console.log(\`Final coordinates for \${result.plotId}:\`, coordinates.slice(0, 3));

                // Validate coordinates before creating polygon
                if (!coordinates || coordinates.length < 3) {
                  console.warn('Invalid coordinates for plot:', result.plotId, 'coordinates:', coordinates);
                  plotsWithoutGeometry++;
                  return;
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

                // Validate that polygon was created successfully
                if (!polygon.getBounds || !polygon.getBounds().isValid()) {
                  console.warn('Invalid polygon bounds for plot:', result.plotId);
                  plotsWithoutGeometry++;
                  return;
                }
              } catch (error) {
                console.error('Error creating polygon for plot:', result.plotId, error);
                plotsWithoutGeometry++;
                return;
              }

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

            // Log polygon rendering summary
            console.log(\`📊 Map Rendering Summary: \${plotsWithGeometry} plots rendered successfully, \${plotsWithoutGeometry} plots with missing/invalid geometry\`);

            if (plotsWithoutGeometry > 0) {
              console.warn(\`⚠️  \${plotsWithoutGeometry} plots are missing from the map due to invalid geometry data. These plots will show as orange markers in Indonesia.\`);
            }

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

            // WDPA layer control with improved implementation
            document.getElementById('wdpaLayer').addEventListener('change', function(e) {
              if (e.target.checked) {
                console.log('WDPA layer checkbox checked - loading layer...');
                
                if (!wdpaLayer && !wdpaTileLayer) {
                  console.log('Creating new WDPA layer...');
                  
                  // Show loading indicator
                  console.log('🔄 Loading WDPA GeoJSON layer for detailed categories...');
                  
                  createWDPAGeoJSONLayer().then(geoLayer => {
                    if (geoLayer && geoLayer.getLayers().length > 0) {
                      wdpaLayer = geoLayer;
                      geoLayer.addTo(map);
                      console.log(\`✅ WDPA GeoJSON layer loaded successfully with \${geoLayer.getLayers().length} features\`);
                      
                      // Force map refresh and fit bounds if features exist
                      map.invalidateSize();
                      
                      // Optionally fit bounds to show WDPA features
                      try {
                        const bounds = geoLayer.getBounds();
                        if (bounds.isValid()) {
                          console.log('📍 Fitting map to WDPA features bounds');
                          map.fitBounds(bounds, { padding: [20, 20] });
                        }
                      } catch (e) {
                        console.log('Could not fit bounds to WDPA features:', e.message);
                      }
                      
                    } else {
                      console.log('🔄 GeoJSON returned no features, trying tile layer as fallback...');
                      
                      // Fallback to tile layer
                      createWDPALayer().then(layer => {
                        if (layer) {
                          wdpaTileLayer = layer;
                          layer.addTo(map);
                          console.log('✅ WDPA tile layer added as fallback');
                          
                          // Add enhanced error handling for tiles
                          layer.on('tileerror', function(e) {
                            console.error('❌ WDPA tile error:', e.error?.message || e);
                          });
                          
                          layer.on('tileload', function(e) {
                            console.log('✅ WDPA tile loaded successfully:', e.coords);
                          });
                          
                          layer.on('loading', function() {
                            console.log('🔄 WDPA tiles loading...');
                          });
                          
                          layer.on('load', function() {
                            console.log('✅ All WDPA tiles loaded');
                          });
                          
                        } else {
                          console.error('❌ Both WDPA layer methods failed');
                          alert('Unable to load WDPA Protected Areas layer. The service may be temporarily unavailable.');
                        }
                      });
                    }
                  }).catch(error => {
                    console.error('❌ Error in WDPA layer creation:', error);
                    console.log('🔄 Trying tile layer due to GeoJSON error...');
                    
                    // Try tile layer as backup when GeoJSON fails
                    createWDPALayer().then(layer => {
                      if (layer) {
                        wdpaTileLayer = layer;
                        layer.addTo(map);
                        console.log('✅ WDPA tile layer added after GeoJSON failure');
                      } else {
                        alert('Error loading WDPA layer: ' + error.message);
                      }
                    });
                  });
                } else {
                  // Layer already exists, just add to map
                  const existingLayer = wdpaLayer || wdpaTileLayer;
                  if (existingLayer) {
                    existingLayer.addTo(map);
                    console.log('✅ Existing WDPA layer restored to map');
                  }
                }
              } else {
                console.log('WDPA layer checkbox unchecked - removing layer...');
                
                // Remove both possible layer types
                if (wdpaLayer && map.hasLayer(wdpaLayer)) {
                  map.removeLayer(wdpaLayer);
                  console.log('✅ WDPA GeoJSON layer removed from map');
                }
                if (wdpaTileLayer && map.hasLayer(wdpaTileLayer)) {
                  map.removeLayer(wdpaTileLayer);
                  console.log('✅ WDPA tile layer removed from map');
                }
              }
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

                  // Force tile loading by triggering a map pan
                  setTimeout(() => {
                    map.panBy([1, 1]);
                    map.panBy([-1, -1]);
                  }, 100);

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

            console.log('EUDR Map loaded with', analysisResults.length, 'plots');
            console.log('Polygons rendered:', polygons.length);
            console.log('Sample geometry data:', analysisResults[0]?.geometry);
            
            // Test WDPA service availability
            console.log('🔍 Testing WDPA service availability...');
            fetch('https://services5.arcgis.com/Mj0hjvkNtV7NRhA7/ArcGIS/rest/services/WDPA_v0/MapServer?f=json')
              .then(response => response.json())
              .then(data => {
                console.log('✅ WDPA service is available:', data.serviceDescription || 'Service OK');
                console.log('🗺️ Available layers:', data.layers?.map(l => l.name) || 'No layers info');
              })
              .catch(error => {
                console.error('❌ WDPA service test failed:', error);
              });
            
            // Add CSS for WDPA styling - force light brown color
            const style = document.createElement('style');
            style.textContent = \`
              .wdpa-popup .leaflet-popup-content-wrapper {
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              }
              .wdpa-popup .leaflet-popup-content {
                margin: 12px;
              }
              
              /* Force WDPA tile layer to appear in light brown */
              .wdpa-tile-layer {
                filter: hue-rotate(20deg) saturate(1.2) brightness(1.1);
                mix-blend-mode: multiply;
              }
              
              /* Style for WDPA GeoJSON features */
              .wdpa-protected-area {
                stroke: #d2b48c !important;
                fill: #d2b48c !important;
                stroke-width: 2 !important;
                stroke-opacity: 0.8 !important;
                fill-opacity: 0.6 !important;
              }
            \`;
            document.head.appendChild(style);
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
        if (event.data.type === 'closeMap' || event.data.type === 'backToResults') {
          // Ensure localStorage flags are set correctly for table restoration
          console.log('🔙 Returning from EUDR Map Viewer, setting restore flags');

          // Make sure analysis results are preserved with proper number formatting
          if (analysisResults && analysisResults.length > 0) {
            // Ensure all loss areas are stored as proper numbers, not strings
            const properlyFormatted = analysisResults.map((result: any) => ({
              ...result,
              // Use parseFloat to handle both string and number inputs correctly
              gfwLossArea: result.gfwLossArea !== undefined && result.gfwLossArea !== null && result.gfwLossArea !== '' 
                ? parseFloat(result.gfwLossArea.toString()) : 0,
              jrcLossArea: result.jrcLossArea !== undefined && result.jrcLossArea !== null && result.jrcLossArea !== '' 
                ? parseFloat(result.jrcLossArea.toString()) : 0,
              sbtnLossArea: result.sbtnLossArea !== undefined && result.sbtnLossArea !== null && result.sbtnLossArea !== '' 
                ? parseFloat(result.sbtnLossArea.toString()) : 0,
              area: parseFloat(result.area?.toString() || '0')
            }));
            
            localStorage.setItem('currentAnalysisResults', JSON.stringify(properlyFormatted));
            localStorage.setItem('hasRealAnalysisData', 'true');
            
            console.log('🔧 Map viewer: Stored properly formatted data with loss areas:', 
              properlyFormatted.slice(0, 3).map(r => ({
                plotId: r.plotId,
                gfwLossArea: r.gfwLossArea,
                jrcLossArea: r.jrcLossArea,
                sbtnLossArea: r.sbtnLossArea
              }))
            );
          }

          // Set flags to trigger results table display
          localStorage.setItem('shouldShowResultsTable', 'true');
          localStorage.setItem('fromMapViewer', 'true');

          // Force a small delay to ensure localStorage is written before navigation
          setTimeout(() => {
            onClose();
          }, 100);
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