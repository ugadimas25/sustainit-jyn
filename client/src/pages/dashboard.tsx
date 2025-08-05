import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle, AlertTriangle, XCircle, Clock, BarChart3 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">EUDR Compliance v3.0</h1>
                </div>
                <p className="text-sm text-gray-500">Additional Dashboard / EUDR Compliance v3.0</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Demo Management Coffee</p>
                  <p className="text-xs text-gray-500">Administrator - Kudeungo Sugata</p>
                </div>
                <div className="flex items-center space-x-2">
                  <img 
                    src={kpnLogoDataUrl} 
                    alt="KPN Corp Logo" 
                    className="h-8 w-8 rounded"
                    data-testid="img-kpn-logo"
                  />
                  <span className="text-sm font-medium bg-green-600 text-white px-3 py-1 rounded">MIS Kolttrace</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-8 mt-6 border-b">
              <button className="pb-3 text-sm font-medium border-b-2 border-green-600 text-green-600">
                Summary
              </button>
              <button className="pb-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                Supply Chain Linkages
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Plot Section Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Plot</h2>
          </div>

          {/* Plot Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Row 1 - Plot counts */}
            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total plot mapped with polygon</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-total-plots">
                    14,014
                  </p>
                </div>
                <div className="text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total low risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    13,067
                  </p>
                </div>
                <div className="text-gray-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total high risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    35
                  </p>
                </div>
                <div className="text-gray-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total medium risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    912
                  </p>
                </div>
                <div className="text-gray-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </Card>

            {/* Row 2 - Deforestation and permits */}
            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Deforested plot (after 31 Dec 2020)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    35
                  </p>
                </div>
                <div className="text-gray-400">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Plots in no permitted area for farming</p>
                  <p className="text-3xl font-bold text-gray-900">
                    0
                  </p>
                </div>
                <div className="text-gray-400">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <div className="col-span-2"></div>

            {/* Row 3 - Polygon areas */}
            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total polygon area (Ha)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    7,141.02
                  </p>
                </div>
                <div className="text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total polygon area (Ha) for low risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    6,532.68
                  </p>
                </div>
                <div className="text-gray-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total polygon area (Ha) for high risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    22.29
                  </p>
                </div>
                <div className="text-gray-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total polygon area (Ha) for medium risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    586.05
                  </p>
                </div>
                <div className="text-gray-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </Card>

            {/* Row 4 - Production data */}
            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total plot production (Kg)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    4,664,776.47
                  </p>
                </div>
                <div className="text-gray-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total plot production (Kg) for low risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    4,369,798.97
                  </p>
                </div>
                <div className="text-gray-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total plot production (Kg) for high risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    12,365.18
                  </p>
                </div>
                <div className="text-gray-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Total plot production (Kg) for medium risk plot</p>
                  <p className="text-3xl font-bold text-gray-900">
                    282,612.32
                  </p>
                </div>
                <div className="text-gray-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}