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

    // Render map placeholder using safe DOM methods
    if (mapRef.current) {
      // Clear any existing content
      mapRef.current.innerHTML = '';
      
      // Create container
      const container = document.createElement('div');
      container.className = 'w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center';
      
      const innerDiv = document.createElement('div');
      innerDiv.className = 'text-center';
      
      // Create icon container
      const iconContainer = document.createElement('div');
      iconContainer.className = 'w-16 h-16 bg-forest rounded-full flex items-center justify-center mx-auto mb-4';
      
      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'w-8 h-8 text-white');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('viewBox', '0 0 24 24');
      
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('stroke-linecap', 'round');
      path1.setAttribute('stroke-linejoin', 'round');
      path1.setAttribute('stroke-width', '2');
      path1.setAttribute('d', 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z');
      
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('stroke-linecap', 'round');
      path2.setAttribute('stroke-linejoin', 'round');
      path2.setAttribute('stroke-width', '2');
      path2.setAttribute('d', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z');
      
      svg.appendChild(path1);
      svg.appendChild(path2);
      iconContainer.appendChild(svg);
      
      // Create title
      const title = document.createElement('h3');
      title.className = 'text-lg font-semibold text-gray-800 mb-2';
      title.textContent = 'Interactive Map';
      
      // Create description
      const description = document.createElement('p');
      description.className = 'text-gray-600';
      description.textContent = 'Plot polygons will be displayed here';
      
      // Create layer info - safely set text content
      const layerInfo = document.createElement('p');
      layerInfo.className = 'text-sm text-gray-500 mt-2';
      layerInfo.textContent = `Layer: ${mapLayer} | Filter: ${plotFilter}`;
      
      // Assemble the structure
      innerDiv.appendChild(iconContainer);
      innerDiv.appendChild(title);
      innerDiv.appendChild(description);
      innerDiv.appendChild(layerInfo);
      container.appendChild(innerDiv);
      mapRef.current.appendChild(container);
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
