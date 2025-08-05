import { useEffect, useRef } from 'react';

interface Plot {
  id: string;
  plotId: string;
  name: string;
  area: string;
  status: string;
  coordinates: any;
}

interface InteractiveMapProps {
  plots: Plot[];
  onPlotSelect: (plot: Plot) => void;
  mapLayer: string;
  plotFilter: string;
}

export function InteractiveMap({ plots, onPlotSelect, mapLayer, plotFilter }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Indonesian palm oil producing region
    const map = {
      center: { lat: 2.5, lng: 99.5 },
      zoom: 8,
      plots: [],
    };

    mapInstanceRef.current = map;

    // Render map placeholder
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div class="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 bg-forest rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Interactive Map</h3>
            <p class="text-gray-600">Plot polygons will be displayed here</p>
            <p class="text-sm text-gray-500 mt-2">Layer: ${mapLayer} | Filter: ${plotFilter}</p>
          </div>
        </div>
      `;
    }

  }, []);

  useEffect(() => {
    // Update map when plots change
    if (plots && plots.length > 0) {
      console.log(`Displaying ${plots.length} plots on map`);
    }
  }, [plots]);

  const handleMapClick = (event: React.MouseEvent) => {
    // Simulate plot selection
    if (plots && plots.length > 0) {
      const randomPlot = plots[Math.floor(Math.random() * plots.length)];
      onPlotSelect(randomPlot);
    }
  };

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full cursor-pointer" 
      onClick={handleMapClick}
      data-testid="interactive-map"
    />
  );
}
