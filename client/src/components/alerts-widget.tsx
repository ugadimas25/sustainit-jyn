import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { useDashboardFilters } from "@/components/dashboard-filter-context";

interface Alert {
  id: string;
  type: "deforestation" | "compliance" | "risk";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  plotId?: string;
  supplierId?: string;
  supplierName?: string;
  region?: string;
  coordinates?: { lat: number; lng: number };
  detectedAt: Date;
  status: "new" | "acknowledged" | "resolved";
}

export function AlertsWidget() {
  const { filters } = useDashboardFilters();

  // Build query params from filters
  const queryParams = new URLSearchParams();
  if (filters.businessUnit) queryParams.set('businessUnit', filters.businessUnit);
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom.toISOString());
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo.toISOString());
  const queryString = queryParams.toString();

  // Build query key with filters for cache invalidation
  const queryKey = ['/api/dashboard/alerts', filters];

  const { data: alerts = [], isLoading, error } = useQuery<Alert[]>({
    queryKey,
    queryFn: async () => {
      const url = queryString ? `/api/dashboard/alerts?${queryString}` : '/api/dashboard/alerts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deforestation': return <MapPin className="h-4 w-4" />;
      case 'compliance': return <ExternalLink className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const openSpatialAnalysis = () => {
    // In a real implementation, this would navigate to spatial analysis with current filters applied
    const params = new URLSearchParams();
    if (filters.businessUnit) params.set('businessUnit', filters.businessUnit);  
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
    
    // Navigate to spatial analysis page with filters
    window.location.href = `/satellite-imagery?${params.toString()}`;
  };

  if (error) {
    return (
      <Card data-testid="alerts-widget">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            Failed to load alerts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="alerts-widget">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Recent Alerts
            {alerts.length > 0 && (
              <Badge 
                variant="outline" 
                className="ml-2 bg-red-100 text-red-800 border-red-200"
                data-testid="alert-count-badge"
              >
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={openSpatialAnalysis}
            className="gap-2"
            data-testid="button-open-spatial-analysis"
          >
            <MapPin className="h-4 w-4" />
            Open Spatial Analysis
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32" data-testid="alerts-loading">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading alerts...</p>
            </div>
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-3" data-testid="alerts-list">
            {alerts.slice(0, 5).map((alert) => (
              <div 
                key={alert.id} 
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                data-testid={`alert-item-${alert.id}`}
              >
                <div className="text-orange-500 mt-0.5">
                  {getTypeIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {alert.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSeverityColor(alert.severity)}`}
                      data-testid={`severity-badge-${alert.id}`}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {alert.supplierName && `${alert.supplierName} • `}
                      {new Date(alert.detectedAt).toLocaleDateString()}
                    </span>
                    {alert.coordinates && (
                      <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                        View on map
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {alerts.length > 5 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="view-all-alerts"
                >
                  View all {alerts.length} alerts
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8" data-testid="no-alerts-message">
            <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No active alerts</p>
            <p className="text-xs text-gray-500 mt-1">
              All plots are within acceptable risk parameters
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}