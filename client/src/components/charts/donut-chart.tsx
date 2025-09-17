import { useEffect, useRef } from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  centerText?: string;
  className?: string;
  dataTestId?: string;
}

export function DonutChart({ data, title, centerText, className = "", dataTestId }: DonutChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 200;
    const center = canvasSize / 2;
    const radius = 70;
    const innerRadius = 45;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
      // Draw empty state
      ctx.strokeStyle = '#e5e5e5';
      ctx.lineWidth = radius - innerRadius;
      ctx.beginPath();
      ctx.arc(center, center, (radius + innerRadius) / 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw center text for empty state
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No data', center, center);
      return;
    }

    // Draw donut segments
    let currentAngle = -Math.PI / 2; // Start at top
    
    data.forEach((item) => {
      const segmentAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw segment
      ctx.strokeStyle = item.color;
      ctx.lineWidth = radius - innerRadius;
      ctx.beginPath();
      ctx.arc(center, center, (radius + innerRadius) / 2, currentAngle, currentAngle + segmentAngle);
      ctx.stroke();
      
      currentAngle += segmentAngle;
    });

    // Draw center text
    if (centerText) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerText, center, center - 5);
      
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText('Total', center, center + 10);
    }

  }, [data, centerText]);

  return (
    <div className={`flex flex-col items-center ${className}`} data-testid={dataTestId}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      
      <div className="relative">
        <canvas 
          ref={chartRef} 
          width={200} 
          height={200} 
          className="w-50 h-50"
          data-testid={`${dataTestId}-canvas`}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 space-y-2" data-testid={`${dataTestId}-legend`}>
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
              data-testid={`${dataTestId}-legend-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <span className="text-gray-600">
              {item.label}: {item.value} ({((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}