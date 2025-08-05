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
          {/* Header */}
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
                  <h1 className="text-2xl font-bold text-gray-800">EUDR Compliance</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select defaultValue="all-units">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-units">All Business Units</SelectItem>
                  <SelectItem value="plantation-north">Plantation North</SelectItem>
                  <SelectItem value="plantation-south">Plantation South</SelectItem>
                  <SelectItem value="plantation-central">Plantation Central</SelectItem>
                  <SelectItem value="mill-operations">Mill Operations</SelectItem>
                  <SelectItem value="smallholder-program">Smallholder Program</SelectItem>
                  <SelectItem value="estate-management">Estate Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 mb-8 border-b">
            <button className="pb-2 text-sm font-medium border-b-2 border-green-600 text-green-600">
              Summary
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

              {/* Row 2 continued - Polygon Areas */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total polygon area (Ha)</p>
                  <p className="text-3xl font-bold text-gray-900">7,141</p>
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
                  <p className="text-3xl font-bold text-gray-900">6,533</p>
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

          {/* EUDR Compliance by Supplier Table */}
          <div className="mb-8">
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">EUDR Compliance by Supplier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Supplier Name</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Total Plots</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Compliant</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Low Risk</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Medium Risk</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">High Risk</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Area (Ha)</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Compliance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">PT Sinar Mas Agro</td>
                        <td className="py-3 px-4 text-right">2,847</td>
                        <td className="py-3 px-4 text-right text-green-600">2,765</td>
                        <td className="py-3 px-4 text-right">2,765</td>
                        <td className="py-3 px-4 text-right">67</td>
                        <td className="py-3 px-4 text-right text-red-600">15</td>
                        <td className="py-3 px-4 text-right">1,423</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">97.1%</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">PT Astra Agro Lestari</td>
                        <td className="py-3 px-4 text-right">3,256</td>
                        <td className="py-3 px-4 text-right text-green-600">3,198</td>
                        <td className="py-3 px-4 text-right">3,198</td>
                        <td className="py-3 px-4 text-right">45</td>
                        <td className="py-3 px-4 text-right text-red-600">13</td>
                        <td className="py-3 px-4 text-right">1,628</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">98.2%</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">PT Wilmar International</td>
                        <td className="py-3 px-4 text-right">2,134</td>
                        <td className="py-3 px-4 text-right text-green-600">2,067</td>
                        <td className="py-3 px-4 text-right">2,067</td>
                        <td className="py-3 px-4 text-right">59</td>
                        <td className="py-3 px-4 text-right text-red-600">8</td>
                        <td className="py-3 px-4 text-right">1,067</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">96.9%</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">PT IOI Corporation</td>
                        <td className="py-3 px-4 text-right">1,892</td>
                        <td className="py-3 px-4 text-right text-green-600">1,834</td>
                        <td className="py-3 px-4 text-right">1,834</td>
                        <td className="py-3 px-4 text-right">58</td>
                        <td className="py-3 px-4 text-right text-red-600">0</td>
                        <td className="py-3 px-4 text-right">946</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">96.9%</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">PT Musim Mas</td>
                        <td className="py-3 px-4 text-right">1,567</td>
                        <td className="py-3 px-4 text-right text-green-600">1,498</td>
                        <td className="py-3 px-4 text-right">1,498</td>
                        <td className="py-3 px-4 text-right">69</td>
                        <td className="py-3 px-4 text-right text-red-600">0</td>
                        <td className="py-3 px-4 text-right">784</td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">95.6%</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">Smallholder Cooperatives</td>
                        <td className="py-3 px-4 text-right">2,318</td>
                        <td className="py-3 px-4 text-right text-green-600">1,905</td>
                        <td className="py-3 px-4 text-right">1,905</td>
                        <td className="py-3 px-4 text-right">413</td>
                        <td className="py-3 px-4 text-right text-red-600">0</td>
                        <td className="py-3 px-4 text-right">1,159</td>
                        <td className="py-3 px-4 text-right text-orange-600 font-semibold">82.2%</td>
                      </tr>
                      <tr className="bg-gray-50 font-semibold">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4 text-right">14,014</td>
                        <td className="py-3 px-4 text-right text-green-600">13,267</td>
                        <td className="py-3 px-4 text-right">13,267</td>
                        <td className="py-3 px-4 text-right">711</td>
                        <td className="py-3 px-4 text-right text-red-600">36</td>
                        <td className="py-3 px-4 text-right">7,007</td>
                        <td className="py-3 px-4 text-right text-green-600">94.7%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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