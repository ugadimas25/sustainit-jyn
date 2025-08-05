import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle, AlertTriangle, XCircle, Download, Clock, Check } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ComplianceChart } from "@/components/charts/compliance-chart";
import kpnLogoPath from "@assets/kpn logo_1754365801347.jpg";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const complianceRate = (metrics?.compliantPlots && metrics?.totalPlots) ? ((metrics.compliantPlots / metrics.totalPlots) * 100).toFixed(1) : '0';
  const atRiskRate = (metrics?.atRiskPlots && metrics?.totalPlots) ? ((metrics.atRiskPlots / metrics.totalPlots) * 100).toFixed(1) : '0';
  const criticalRate = (metrics?.criticalPlots && metrics?.totalPlots) ? ((metrics.criticalPlots / metrics.totalPlots) * 100).toFixed(1) : '0';

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src={kpnLogoPath} 
                  alt="KPN Corp Plantation Division Logo" 
                  className="h-12 w-auto mr-4"
                  data-testid="img-kpn-logo"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">EUDR Compliance Dashboard</h1>
                  <p className="text-gray-600 mt-1">Monitor supply chain compliance and deforestation risk</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select defaultValue="all-regions">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-regions">All Regions</SelectItem>
                  <SelectItem value="sumatra">Sumatra</SelectItem>
                  <SelectItem value="kalimantan">Kalimantan</SelectItem>
                  <SelectItem value="sulawesi">Sulawesi</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Plots</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-total-plots">
                      {metrics?.totalPlots || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-professional bg-opacity-10 rounded-lg flex items-center justify-center">
                    <MapPin className="text-professional text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-forest-light">+12%</span>
                  <span className="text-gray-600 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compliant Plots</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-compliant-plots">
                      {metrics?.compliantPlots || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-forest-light bg-opacity-10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-forest-light text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-forest-light">{complianceRate}%</span>
                  <span className="text-gray-600 ml-1">compliance rate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">At Risk Plots</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-atrisk-plots">
                      {metrics?.atRiskPlots || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-warning text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-warning">{atRiskRate}%</span>
                  <span className="text-gray-600 ml-1">require attention</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                    <p className="text-2xl font-bold text-gray-800" data-testid="text-critical-plots">
                      {metrics?.criticalPlots || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-critical bg-opacity-10 rounded-lg flex items-center justify-center">
                    <XCircle className="text-critical text-xl" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-critical">{criticalRate}%</span>
                  <span className="text-gray-600 ml-1">immediate action</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle>Compliance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceChart />
              </CardContent>
            </Card>

            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Risk distribution chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card className="border-neutral-border">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts && Array.isArray(alerts) && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert: any) => (
                    <div 
                      key={alert.id} 
                      className={`flex items-center p-4 border rounded-lg ${
                        alert.severity === 'critical' ? 'bg-critical bg-opacity-5 border-critical border-opacity-20' :
                        alert.severity === 'high' ? 'bg-warning bg-opacity-5 border-warning border-opacity-20' :
                        'bg-forest-light bg-opacity-5 border-forest-light border-opacity-20'
                      }`}
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        alert.severity === 'critical' ? 'bg-critical bg-opacity-10' :
                        alert.severity === 'high' ? 'bg-warning bg-opacity-10' :
                        'bg-forest-light bg-opacity-10'
                      }`}>
                        {alert.status === 'resolved' ? (
                          <Check className={`w-5 h-5 text-forest-light`} />
                        ) : alert.severity === 'critical' ? (
                          <XCircle className={`w-5 h-5 text-critical`} />
                        ) : (
                          <Clock className={`w-5 h-5 text-warning`} />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-800">
                          {alert.alertSource} alert for Plot {alert.plotId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {alert.areaLost ? `${alert.areaLost} hectares affected` : 'Monitoring alert triggered'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.alertDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`${
                          alert.severity === 'critical' ? 'text-critical hover:text-red-700' :
                          alert.severity === 'high' ? 'text-warning hover:text-yellow-700' :
                          'text-forest-light hover:text-green-700'
                        }`}
                        data-testid={`button-investigate-${alert.id}`}
                      >
                        {alert.status === 'resolved' ? 'View Report' : 'Investigate'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent alerts</p>
                  <p className="text-sm text-gray-500">All plots are currently compliant</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
