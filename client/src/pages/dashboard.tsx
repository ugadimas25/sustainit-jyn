import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CheckCircle, AlertTriangle, XCircle, Download, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ComplianceChart } from "@/components/charts/compliance-chart";
import { kpnLogoDataUrl } from "@/assets/kpn-logo-base64";

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
          {/* Header with EUDR Compliance v3.0 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src={kpnLogoDataUrl} 
                  alt="KPN Corp Logo" 
                  className="h-8 w-8 rounded mr-3"
                  data-testid="img-kpn-logo"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">EUDR Compliance v3.0</h1>
                  <p className="text-gray-600 text-sm">Additional Dashboard / EUDR Compliance v3.0</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Supply Chain Management</p>
                <p className="text-xs text-gray-500">Administrator - System User</p>
              </div>
              <span className="text-sm font-medium bg-green-600 text-white px-3 py-1 rounded">MIS Platform</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 mb-8 border-b">
            <button className="pb-2 text-sm font-medium border-b-2 border-green-600 text-green-600">
              Summary
            </button>
            <button className="pb-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Supply Chain Linkages
            </button>
          </div>

          {/* Plot Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Plot</h2>
            
            {/* Plot Statistics Grid - 4 columns matching the screenshot */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              {/* Row 1 - Basic Plot Counts */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total plot mapped with polygon</p>
                  <p className="text-3xl font-bold text-gray-900">14,014</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total low risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">13,067</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total high risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">35</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total medium risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">912</p>
                </CardContent>
              </Card>

              {/* Row 2 - Deforestation and Compliance */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Deforested plot (after 31 Dec 2020)</p>
                  <p className="text-3xl font-bold text-gray-900">35</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Plots in no permitted area for farming</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </CardContent>
              </Card>

              {/* Empty cards for spacing */}
              <div></div>
              <div></div>

              {/* Row 3 - Polygon Areas */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total polygon area (Ha)</p>
                  <p className="text-3xl font-bold text-gray-900">7,141.02</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total polygon area (Ha) for low risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">6,532.68</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total polygon area (Ha) for high risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">22.29</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total polygon area (Ha) for medium risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">586.05</p>
                </CardContent>
              </Card>

              {/* Row 4 - Production Data */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total plot production (Kg)</p>
                  <p className="text-3xl font-bold text-gray-900">4,664,776.47</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total plot production (Kg) for low risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">4,369,798.97</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total plot production (Kg) for high risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">12,365.18</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total plot production (Kg) for medium risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">282,612.32</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Compliance Overview */}
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Compliant Plots</span>
                    <span className="font-semibold">{metrics?.compliantPlots || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compliance Rate</span>
                    <span className="font-semibold text-green-600">{complianceRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">At Risk Plots</span>
                    <span className="font-semibold text-orange-600">{metrics?.atRiskPlots || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Critical Issues</span>
                    <span className="font-semibold text-red-600">{metrics?.criticalPlots || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Deforestation Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Plot #{alert.plotId}</p>
                          <p className="text-xs text-gray-600">{alert.date}</p>
                        </div>
                        <div className="text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No recent deforestation alerts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
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
        </main>
      </div>
    </div>
  );
}