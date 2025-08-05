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
        <div className="bg-white border-b shadow-sm">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-1">EUDR Compliance v3.0</h1>
                <p className="text-gray-600 font-medium">Additional Dashboard / EUDR Compliance v3.0</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Demo Management Coffee</p>
                  <p className="text-sm text-gray-600">Administrator - Kudeungo Sugata</p>
                </div>
                <div className="flex items-center space-x-3">
                  <img 
                    src={kpnLogoDataUrl} 
                    alt="KPN Corp Logo" 
                    className="h-10 w-10 rounded-lg"
                    data-testid="img-kpn-logo"
                  />
                  <span className="font-semibold bg-green-600 text-white px-4 py-2 rounded-lg">MIS Kolttrace</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-12 mt-8 border-b border-gray-200">
              <button className="pb-4 font-semibold border-b-2 border-green-600 text-green-600">
                Summary
              </button>
              <button className="pb-4 font-medium text-gray-500 hover:text-gray-700">
                Supply Chain Linkages
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Plot Section Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Plot Statistics</h2>
          </div>

          {/* Plot Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Row 1 - Plot counts */}
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-gray-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total plot mapped with polygon</p>
                  <p className="text-4xl font-bold text-gray-900" data-testid="text-total-plots">
                    14,014
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-green-500">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total low risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    13,067
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total high risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    35
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-yellow-500">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total medium risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    912
                  </p>
                </div>
              </div>
            </Card>

            {/* Row 2 - Deforestation and permits */}
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-red-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Deforested plot (after 31 Dec 2020)</p>
                  <p className="text-4xl font-bold text-gray-900">
                    35
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-red-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Plots in no permitted area for farming</p>
                  <p className="text-4xl font-bold text-gray-900">
                    0
                  </p>
                </div>
              </div>
            </Card>

            <div className="col-span-2"></div>

            {/* Row 3 - Polygon areas */}
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-blue-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total polygon area (Ha)</p>
                  <p className="text-4xl font-bold text-gray-900">
                    7,141.02
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-green-500">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total polygon area (Ha) for low risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    6,532.68
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total polygon area (Ha) for high risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    22.29
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-yellow-500">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total polygon area (Ha) for medium risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    586.05
                  </p>
                </div>
              </div>
            </Card>

            {/* Row 4 - Production data */}
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-purple-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total plot production (Kg)</p>
                  <p className="text-4xl font-bold text-gray-900">
                    4,664,776.47
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-green-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total plot production (Kg) for low risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    4,369,798.97
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-red-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total plot production (Kg) for high risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    12,365.18
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-yellow-500">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-3">Total plot production (Kg) for medium risk plot</p>
                  <p className="text-4xl font-bold text-gray-900">
                    282,612.32
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}