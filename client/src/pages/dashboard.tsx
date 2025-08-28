import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, CheckCircle, AlertTriangle, XCircle, Download, Clock, TrendingUp, BarChart3, X } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

import { ComplianceChart } from "@/components/charts/compliance-chart";
import { kpnLogoDataUrl } from "@/assets/kpn-logo-base64";

// Sample plot data for the modals
const samplePlotData = {
  highRisk: [
    { plotNumber: "HR001", business: "PT Sinar Mas Agro", village: "Kampung Baru", district: "Riau Timur", coordinates: "1.234, 103.567", area: "45.2" },
    { plotNumber: "HR002", business: "PT Wilmar International", village: "Desa Makmur", district: "Jambi Selatan", coordinates: "1.456, 103.789", area: "67.8" },
    { plotNumber: "HR003", business: "PT Astra Agro Lestari", village: "Sumber Jaya", district: "Kalimantan Tengah", coordinates: "0.987, 114.123", area: "23.4" },
    { plotNumber: "HR004", business: "PT IOI Corporation", village: "Tanjung Harapan", district: "Sumatra Utara", coordinates: "2.345, 99.456", area: "89.1" },
    { plotNumber: "HR005", business: "PT Musim Mas", village: "Bangun Rejo", district: "Riau Tengah", coordinates: "0.567, 102.234", area: "34.5" }
  ],
  mediumRisk: [
    { plotNumber: "MR001", business: "Smallholder Cooperatives", village: "Desa Sejahtera", district: "Jambi Utara", coordinates: "1.789, 103.012", area: "12.3" },
    { plotNumber: "MR002", business: "PT Sinar Mas Agro", village: "Kampung Damai", district: "Riau Selatan", coordinates: "0.234, 102.789", area: "56.7" },
    { plotNumber: "MR003", business: "PT Wilmar International", village: "Suka Maju", district: "Sumatra Selatan", coordinates: "2.123, 104.567", area: "78.9" },
    { plotNumber: "MR004", business: "PT Astra Agro Lestari", village: "Berkat Jaya", district: "Kalimantan Barat", coordinates: "1.567, 109.234", area: "43.2" },
    { plotNumber: "MR005", business: "PT IOI Corporation", village: "Harapan Baru", district: "Sumatra Barat", coordinates: "0.890, 100.456", area: "21.8" }
  ],
  deforested: [
    { plotNumber: "DF001", business: "PT Sinar Mas Agro", village: "Rimba Hilang", district: "Riau Timur", coordinates: "1.345, 103.678", area: "15.6" },
    { plotNumber: "DF002", business: "PT Wilmar International", village: "Hutan Baru", district: "Jambi Tengah", coordinates: "1.567, 103.890", area: "28.4" },
    { plotNumber: "DF003", business: "Smallholder Cooperatives", village: "Desa Terbuka", district: "Sumatra Tengah", coordinates: "0.678, 101.234", area: "9.7" }
  ],
  noPermit: [
    { plotNumber: "NP001", business: "PT Musim Mas", village: "Tanah Terlarang", district: "Kalimantan Tengah", coordinates: "0.456, 114.567", area: "32.1" },
    { plotNumber: "NP002", business: "PT IOI Corporation", village: "Zona Lindung", district: "Sumatra Utara", coordinates: "2.789, 99.123", area: "18.9" },
    { plotNumber: "NP003", business: "PT Astra Agro Lestari", village: "Kawasan Khusus", district: "Riau Tengah", coordinates: "1.012, 102.567", area: "41.3" }
  ]
};

export default function Dashboard() {
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  
  // Function to get modal title and data based on selected modal
  const getModalData = (modalType: string) => {
    switch (modalType) {
      case 'highRisk':
        return { title: 'Total High Risk Plots', data: samplePlotData.highRisk };
      case 'mediumRisk':
        return { title: 'Total Medium Risk Plots', data: samplePlotData.mediumRisk };
      case 'deforested':
        return { title: 'Deforested Plots (after 31 Dec 2020)', data: samplePlotData.deforested };
      case 'noPermit':
        return { title: 'Plots in No Permitted Area for Farming', data: samplePlotData.noPermit };
      default:
        return { title: '', data: [] };
    }
  };
  
  // Default metrics query - force fresh data from server
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
  });

  // Mutation to calculate real-time metrics from current table data
  const calculateMetricsMutation = useMutation({
    mutationFn: async (analysisResults: any[]) => {
      const response = await apiRequest('POST', '/api/dashboard/calculate-metrics', { analysisResults });
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentMetrics(data);
    }
  });

  // Listen for analysis results updates from localStorage or global state
  useEffect(() => {
    const checkForUpdatedResults = () => {
      try {
        const hasRealData = localStorage.getItem('hasRealAnalysisData') === 'true';
        const storedResults = localStorage.getItem('currentAnalysisResults');
        
        if (hasRealData && storedResults) {
          const analysisResults = JSON.parse(storedResults);
          if (analysisResults && Array.isArray(analysisResults) && analysisResults.length > 0) {
            // Only calculate metrics if we have real analysis data
            calculateMetricsMutation.mutate(analysisResults);
          } else {
            // Set metrics to zero if real data is empty
            setCurrentMetrics({
              totalPlots: "0",
              compliantPlots: "0",
              highRiskPlots: "0",
              mediumRiskPlots: "0",
              deforestedPlots: "0",
              totalArea: "0"
            });
          }
        } else {
          // No real data available, keep dashboard at zero
          setCurrentMetrics({
            totalPlots: "0",
            compliantPlots: "0",
            highRiskPlots: "0",
            mediumRiskPlots: "0",
            deforestedPlots: "0",
            totalArea: "0"
          });
        }
      } catch (error) {
        console.error("Error parsing stored analysis results:", error);
      }
    };

    // Initialize with zero values first, then check for real data
    setCurrentMetrics({
      totalPlots: "0",
      compliantPlots: "0",
      highRiskPlots: "0", 
      mediumRiskPlots: "0",
      deforestedPlots: "0",
      totalArea: "0"
    });
    
    // Then check for real data
    checkForUpdatedResults();
    
    // Set up periodic checking for updates
    const interval = setInterval(checkForUpdatedResults, 2000);
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentAnalysisResults' || e.key === 'hasRealAnalysisData') {
        checkForUpdatedResults();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Use current metrics from localStorage, or server metrics, or zero fallback
  const displayMetrics = currentMetrics || metrics || {
    totalPlots: "0",
    compliantPlots: "0", 
    highRiskPlots: "0",
    mediumRiskPlots: "0",
    deforestedPlots: "0",
    totalArea: "0"
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const complianceRate = (displayMetrics?.compliantPlots && displayMetrics?.totalPlots) ? ((Number(displayMetrics.compliantPlots) / Number(displayMetrics.totalPlots)) * 100).toFixed(1) : '0';
  const atRiskRate = (displayMetrics?.highRiskPlots && displayMetrics?.totalPlots) ? ((Number(displayMetrics.highRiskPlots) / Number(displayMetrics.totalPlots)) * 100).toFixed(1) : '0';
  const criticalRate = (displayMetrics?.deforestedPlots && displayMetrics?.totalPlots) ? ((Number(displayMetrics.deforestedPlots) / Number(displayMetrics.totalPlots)) * 100).toFixed(1) : '0';

  return (
    <>
      <div className="p-6">
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
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-total-plots">{displayMetrics?.totalPlots || "0"}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total compliant plots</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-compliant-plots">{displayMetrics?.compliantPlots || "0"}</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedModal('highRisk')}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total high risk plot</p>
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold text-gray-900" data-testid="text-high-risk-plots">{displayMetrics?.highRiskPlots || "0"}</p>
                    <span className="text-xs text-blue-600 font-medium">Details</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedModal('mediumRisk')}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Total medium risk plot</p>
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold text-gray-900" data-testid="text-medium-risk-plots">{displayMetrics?.mediumRiskPlots || "0"}</p>
                    <span className="text-xs text-blue-600 font-medium">Details</span>
                  </div>
                </CardContent>
              </Card>

              {/* Row 2 - Deforestation and Compliance */}
              <Card className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedModal('deforested')}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Deforested plot (after 31 Dec 2020)</p>
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold text-gray-900" data-testid="text-deforested-plots">{displayMetrics?.deforestedPlots || "0"}</p>
                    <span className="text-xs text-blue-600 font-medium">Details</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setSelectedModal('noPermit')}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-400">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Plots in no permitted area for farming</p>
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold text-gray-900">0</p>
                    <span className="text-xs text-blue-600 font-medium">Details</span>
                  </div>
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
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-total-area">{displayMetrics?.totalArea || "0"}</p>
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
        </div>
        
      {selectedModal && (
        <Dialog open={!!selectedModal} onOpenChange={() => setSelectedModal(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                {getModalData(selectedModal).title}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedModal(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Plot Number</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Business Association</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Village</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">District</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Coordinates</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Area (Ha)</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Polygon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getModalData(selectedModal).data.map((plot, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-blue-600">{plot.plotNumber}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{plot.business}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{plot.village}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{plot.district}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-mono">{plot.coordinates}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right">{plot.area}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="w-12 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded border border-green-700 relative">
                            <div className="absolute inset-1 border border-green-300 rounded-sm opacity-60"></div>
                            <div className="absolute top-1 left-1 w-1 h-1 bg-green-200 rounded-full"></div>
                            <div className="absolute bottom-1 right-1 w-1 h-1 bg-green-800 rounded-full"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {getModalData(selectedModal).data.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No plots found for this category.
                </div>
              )}
            </div>
        </DialogContent>
        </Dialog>
      )}
    </>
  );
}