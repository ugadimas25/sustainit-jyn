import { useEffect, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useDashboardFilters } from "@/components/dashboard-filter-context";

interface ComplianceTrendPoint {
  period: string; // YYYY-MM format
  complianceRate: number;
  totalPlots: number;
  compliantPlots: number;
  date: Date;
}

interface ComplianceTrendChartProps {
  className?: string;
  dataTestId?: string;
}

export function ComplianceTrendChart({ className = "", dataTestId }: ComplianceTrendChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const { filters } = useDashboardFilters();

  // Build query params from filters
  const queryParams = new URLSearchParams();
  if (filters.businessUnit) queryParams.set('businessUnit', filters.businessUnit);
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom.toISOString());
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo.toISOString());
  const queryString = queryParams.toString();

  // Build query key with filters for cache invalidation
  const queryKey = ['/api/dashboard/trend', filters];

  const { data: trendData = [], isLoading } = useQuery<ComplianceTrendPoint[]>({
    queryKey,
    queryFn: async () => {
      const url = queryString ? `/api/dashboard/trend?${queryString}` : '/api/dashboard/trend';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch trend data');
      return response.json();
    }
  });

  useEffect(() => {
    if (!chartRef.current || trendData.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = canvasWidth - margin.left - margin.right;
    const chartHeight = canvasHeight - margin.bottom - margin.top;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate data ranges
    const maxRate = Math.max(...trendData.map(d => d.complianceRate));
    const minRate = Math.min(...trendData.map(d => d.complianceRate));
    const rateRange = maxRate - minRate;
    const yMin = Math.max(0, minRate - rateRange * 0.1);
    const yMax = Math.min(100, maxRate + rateRange * 0.1);
    const yRange = yMax - yMin;

    // Draw grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.stroke();

    // X-axis  
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    // Draw Y-axis labels (compliance rate percentages)
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const value = yMax - (i * yRange / 5);
      const y = margin.top + (i * chartHeight / 5);
      ctx.fillText(`${value.toFixed(0)}%`, margin.left - 10, y);
    }

    // Draw trend line
    ctx.strokeStyle = '#059669'; // Green color
    ctx.lineWidth = 3;
    ctx.beginPath();

    trendData.forEach((point, index) => {
      const x = margin.left + (index * chartWidth / (trendData.length - 1));
      const y = margin.top + chartHeight - ((point.complianceRate - yMin) / yRange * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#059669';
    trendData.forEach((point, index) => {
      const x = margin.left + (index * chartWidth / (trendData.length - 1));
      const y = margin.top + chartHeight - ((point.complianceRate - yMin) / yRange * chartHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw X-axis labels (months)
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Show every other month to avoid crowding
    trendData.forEach((point, index) => {
      if (index % 2 === 0 || index === trendData.length - 1) {
        const x = margin.left + (index * chartWidth / (trendData.length - 1));
        const y = margin.top + chartHeight + 8;
        const [year, month] = point.period.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
        ctx.fillText(`${monthName} ${year.slice(-2)}`, x, y);
      }
    });

    // Draw title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Compliance Rate Trend (Last 12 Months)', canvasWidth / 2, 5);

  }, [trendData]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} data-testid={`${dataTestId}-loading`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading trend data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`} data-testid={dataTestId}>
      <canvas 
        ref={chartRef}
        width={600}
        height={300}
        className="w-full h-64 border border-gray-200 rounded"
        data-testid={`${dataTestId}-canvas`}
      />
      
      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm" data-testid={`${dataTestId}-summary`}>
        <div className="text-center">
          <div className="font-semibold text-green-600">
            {trendData.length > 0 ? `${trendData[trendData.length - 1]?.complianceRate.toFixed(1)}%` : '--'}
          </div>
          <div className="text-gray-600">Current Rate</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-blue-600">
            {trendData.length > 0 ? `${(trendData.reduce((sum, d) => sum + d.complianceRate, 0) / trendData.length).toFixed(1)}%` : '--'}
          </div>
          <div className="text-gray-600">12-Month Average</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-700">
            {trendData.length > 1 ? 
              `${(trendData[trendData.length - 1]?.complianceRate - trendData[trendData.length - 2]?.complianceRate).toFixed(1)}%` : 
              '--'
            }
          </div>
          <div className="text-gray-600">Month-on-Month</div>
        </div>
      </div>
    </div>
  );
}