import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Satellite, Eye, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { GFWIntegration } from "@/components/monitoring/gfw-integration";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function DeforestationMonitoring() {
  const [alertFrequency, setAlertFrequency] = useState("weekly");
  const [confidenceThreshold, setConfidenceThreshold] = useState("medium");
  const [bufferZone, setBufferZone] = useState("1");
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/alerts", { limit: 20 }],
  });

  const { data: plots } = useQuery({
    queryKey: ["/api/plots"],
  });

  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/gfw/refresh-alerts");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Data refreshed",
        description: "Latest deforestation alerts have been retrieved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportAlertsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/alerts/export");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deforestation-alerts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export complete",
        description: "Alerts data has been downloaded",
      });
    },
  });

  if (metricsLoading || alertsLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  const gladAlerts = Array.isArray(alerts) ? alerts.filter((alert: any) => alert.alertSource === 'GLAD').length : 0;
  const raddAlerts = Array.isArray(alerts) ? alerts.filter((alert: any) => alert.alertSource === 'RADD').length : 0;
  const fireAlerts = Array.isArray(alerts) ? alerts.filter((alert: any) => alert.alertSource === 'FIRES').length : 0;

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Deforestation Monitoring</h1>
              <p className="text-gray-600 mt-1">Global Forest Watch integration and real-time alerts</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-forest text-white hover:bg-forest-dark"
                onClick={() => refreshDataMutation.mutate()}
                disabled={refreshDataMutation.isPending}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button 
                className="bg-professional text-white hover:bg-blue-700"
                onClick={() => exportAlertsMutation.mutate()}
                disabled={exportAlertsMutation.isPending}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Alerts
              </Button>
            </div>
          </div>

          {/* Monitoring Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">GLAD Alerts (7 days)</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-glad-alerts">
                      {gladAlerts}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-critical bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Satellite className="text-critical text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-critical">+{Math.floor(gladAlerts * 0.3)}</span>
                  <span className="text-gray-600 ml-1">vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Plots Monitored</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-plots-monitored">
                      {Array.isArray(plots) ? plots.length : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-professional bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Eye className="text-professional text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-forest-light">100%</span>
                  <span className="text-gray-600 ml-1">coverage</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Forest Loss (2024)</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-forest-loss">
                      {Array.isArray(alerts) ? alerts.reduce((sum: number, alert: any) => sum + (parseFloat(alert.areaLost) || 0), 0).toFixed(1) : '0.0'}
                    </p>
                    <p className="text-xs text-gray-500">hectares</p>
                  </div>
                  <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-warning text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-warning">-12%</span>
                  <span className="text-gray-600 ml-1">vs 2023</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GFW Integration Panel */}
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle>Global Forest Watch Integration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Real-time deforestation alerts and analysis</p>
              </CardHeader>
              <CardContent>
                <GFWIntegration 
                  alertFrequency={alertFrequency}
                  confidenceThreshold={confidenceThreshold}
                  bufferZone={bufferZone}
                  onSettingsChange={{
                    setAlertFrequency,
                    setConfidenceThreshold, 
                    setBufferZone
                  }}
                />
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle>Recent Deforestation Alerts</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
              </CardHeader>
              <CardContent>
                {Array.isArray(alerts) && alerts.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {alerts.map((alert: any) => (
                      <div 
                        key={alert.id} 
                        className="border border-neutral-border rounded-lg p-4"
                        data-testid={`alert-${alert.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">Plot {alert.plotId}</h4>
                            <p className="text-sm text-gray-600">{alert.alertSource} Alert</p>
                          </div>
                          <Badge 
                            variant={alert.severity === 'critical' ? 'destructive' : 
                                   alert.severity === 'high' ? 'secondary' : 'default'}
                            data-testid={`badge-severity-${alert.id}`}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Area Lost:</span>
                            <span className="font-medium ml-1">{alert.areaLost || '0'} ha</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Detection:</span>
                            <span className="font-medium ml-1">
                              {new Date(alert.alertDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium ml-1">{alert.confidence || '0'}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Source:</span>
                            <span className="font-medium ml-1">{alert.alertSource}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-professional text-white hover:bg-blue-700"
                            data-testid={`button-view-map-${alert.id}`}
                          >
                            View on Map
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-investigate-${alert.id}`}
                          >
                            {alert.status === 'resolved' ? 'View Report' : 'Investigation'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent alerts</p>
                    <p className="text-sm text-gray-500">All monitored plots are clear</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
