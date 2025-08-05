import { useEffect, useRef } from 'react';

export function ComplianceChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Simple chart implementation without external dependencies
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sample data
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      compliant: [89, 91, 93, 92, 94, 92.5],
      atRisk: [8, 7, 5.5, 6, 4.5, 5.5]
    };

    const width = canvas.width;
    const height = canvas.height;
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;

    // Draw axes
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, height - margin);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.stroke();

    // Draw grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(width - margin, y);
      ctx.stroke();
    }

    // Draw compliant line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.compliant.forEach((value, index) => {
      const x = margin + (index * chartWidth / (data.compliant.length - 1));
      const y = height - margin - (value / 100 * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw at risk line
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.atRisk.forEach((value, index) => {
      const x = margin + (index * chartWidth / (data.atRisk.length - 1));
      const y = height - margin - (value / 100 * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    data.labels.forEach((label, index) => {
      const x = margin + (index * chartWidth / (data.labels.length - 1));
      ctx.fillText(label, x, height - 10);
    });

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = margin + (i * chartHeight / 5);
      const value = 100 - (i * 20);
      ctx.fillText(value + '%', margin - 10, y + 4);
    }

  }, []);

  return (
    <div className="relative">
      <canvas 
        ref={chartRef} 
        width={400} 
        height={200} 
        className="w-full h-48"
        data-testid="chart-compliance"
      />
      <div className="mt-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-forest-light rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Compliant</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">At Risk</span>
        </div>
      </div>
    </div>
  );
}
