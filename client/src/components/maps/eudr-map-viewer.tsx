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

            // Analysis results from React
            const analysisResults = ${JSON.stringify(analysisResults)};
            
            // Add markers for each plot
            const markers = [];
            analysisResults.forEach(result => {
              // Generate random coordinates for demonstration (in real app, use actual coordinates)
              const lat = (Math.random() - 0.5) * 120;
              const lng = (Math.random() - 0.5) * 360;
              
              const isHighRisk = result.overallRisk === 'HIGH';
              const color = isHighRisk ? '#dc2626' : '#10b981';
              const animation = isHighRisk ? 'pulse-red 2s infinite' : 'pulse-green 2s infinite';
              
              const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }).addTo(map);
              
              // Add pulsing animation
              marker.getElement().style.animation = animation;
              
              // Add popup with plot information
              marker.bindPopup(\`
                <div style="background: linear-gradient(135deg, #1a1a1a, #2a2a2a); padding: 15px; border-radius: 8px; color: white; min-width: 200px;">
                  <h3 style="margin: 0 0 10px 0; color: #4da6ff;">\${result.plotId}</h3>
                  <p><strong>Country:</strong> \${result.country}</p>
                  <p><strong>Area:</strong> \${result.area} ha</p>
                  <p><strong>Overall Risk:</strong> <span style="color: \${color}; font-weight: bold;">\${result.overallRisk}</span></p>
                  <p><strong>Compliance:</strong> \${result.complianceStatus}</p>
                  <p><strong>GFW Loss:</strong> \${result.gfwLoss}</p>
                  <p><strong>JRC Loss:</strong> \${result.jrcLoss}</p>
                  <p><strong>SBTN Loss:</strong> \${result.sbtnLoss}</p>
                  \${result.highRiskDatasets.length > 0 ? \`<p><strong>High Risk Datasets:</strong> \${result.highRiskDatasets.join(', ')}</p>\` : ''}
                </div>
              \`);
              
              markers.push({ marker, risk: result.overallRisk });
            });

            // Fit map to show all markers
            if (markers.length > 0) {
              const group = new L.featureGroup(markers.map(m => m.marker));
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
              markers.forEach(({marker, risk}) => {
                if (filterValue === 'all') {
                  marker.addTo(map);
                } else if (filterValue === 'high' && risk === 'HIGH') {
                  marker.addTo(map);
                } else if (filterValue === 'low' && risk === 'LOW') {
                  marker.addTo(map);
                } else {
                  map.removeLayer(marker);
                }
              });
            });

            console.log('EUDR Map loaded with', analysisResults.length, 'plots');
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