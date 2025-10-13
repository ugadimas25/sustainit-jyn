import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, CheckCircle, AlertTriangle, XCircle, Download, Clock, TrendingUp, X } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardMetrics } from "@shared/schema";

import { DonutChart } from "@/components/charts/donut-chart";
import { ComplianceTrendChart } from "@/components/charts/compliance-trend-chart";
import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import { DashboardFilterProvider, useDashboardFilters } from "@/components/dashboard-filter-context";
import { SupplierComplianceTable } from "@/components/supplier-compliance-table";
import { AlertsWidget } from "@/components/alerts-widget";
import { kpnLogoDataUrl } from "@/assets/kpn-logo-base64";

// Sample plot data for the modals
const samplePlotData = {
  highRisk: [
    { plotNumber: "HR001", business: "Estate 1", village: "Kampung Baru", district: "Riau Timur", coordinates: "1.234, 103.567", area: "45.2" },
    { plotNumber: "HR002", business: "Estate 2", village: "Desa Makmur", district: "Jambi Selatan", coordinates: "1.456, 103.789", area: "67.8" },
    { plotNumber: "HR003", business: "3rd Party Supplier 1", village: "Sumber Jaya", district: "Kalimantan Tengah", coordinates: "0.987, 114.123", area: "23.4" },
    { plotNumber: "HR004", business: "3rd Party Supplier 2", village: "Tanjung Harapan", district: "Sumatra Utara", coordinates: "2.345, 99.456", area: "89.1" },
    { plotNumber: "HR005", business: "Smallholder 1", village: "Bangun Rejo", district: "Riau Tengah", coordinates: "0.567, 102.234", area: "34.5" }
  ],
  mediumRisk: [
    { plotNumber: "MR001", business: "Smallholder 1", village: "Desa Sejahtera", district: "Jambi Utara", coordinates: "1.789, 103.012", area: "12.3" },
    { plotNumber: "MR002", business: "Estate 1", village: "Kampung Damai", district: "Riau Selatan", coordinates: "0.234, 102.789", area: "56.7" },
    { plotNumber: "MR003", business: "Estate 2", village: "Suka Maju", district: "Sumatra Selatan", coordinates: "2.123, 104.567", area: "78.9" },
    { plotNumber: "MR004", business: "3rd Party Supplier 1", village: "Berkat Jaya", district: "Kalimantan Barat", coordinates: "1.567, 109.234", area: "43.2" },
    { plotNumber: "MR005", business: "3rd Party Supplier 2", village: "Harapan Baru", district: "Sumatra Barat", coordinates: "0.890, 100.456", area: "21.8" }
  ],
  deforested: [
    { plotNumber: "DF001", business: "Estate 1", village: "Rimba Hilang", district: "Riau Timur", coordinates: "1.345, 103.678", area: "15.6" },
    { plotNumber: "DF002", business: "Estate 2", village: "Hutan Baru", district: "Jambi Tengah", coordinates: "1.567, 103.890", area: "28.4" },
    { plotNumber: "DF003", business: "Smallholder 2", village: "Desa Terbuka", district: "Sumatra Tengah", coordinates: "0.678, 101.234", area: "9.7" }
  ],
  noPermit: [
    { plotNumber: "NP001", business: "Smallholder 1", village: "Tanah Terlarang", district: "Kalimantan Tengah", coordinates: "0.456, 114.567", area: "32.1" },
    { plotNumber: "NP002", business: "3rd Party Supplier 1", village: "Zona Lindung", district: "Sumatra Utara", coordinates: "2.789, 99.123", area: "18.9" },
    { plotNumber: "NP003", business: "3rd Party Supplier 2", village: "Kawasan Khusus", district: "Riau Tengah", coordinates: "1.012, 102.567", area: "41.3" }
  ]
};

function DashboardContent() {
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const queryClient = useQueryClient();
  const { filters } = useDashboardFilters();
  
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
  
  // Build query params from filters
  const queryParams = new URLSearchParams();
  if (filters.businessUnit) queryParams.set('businessUnit', filters.businessUnit);
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom.toISOString());
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo.toISOString());
  const queryString = queryParams.toString();

  // Default metrics query with filters
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics", filters],
    queryFn: async () => {
      const url = queryString ? `/api/dashboard/metrics?${queryString}` : '/api/dashboard/metrics';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data
  });

  // Dashboard alerts with filters
  const { data: alerts } = useQuery({
    queryKey: ["/api/dashboard/alerts", filters],
    queryFn: async () => {
      const url = queryString ? `/api/dashboard/alerts?${queryString}` : '/api/dashboard/alerts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
  });

  // Risk split data for donut chart
  const { data: riskSplitData } = useQuery({
    queryKey: ["/api/dashboard/risk-split", filters],
    queryFn: async () => {
      const url = queryString ? `/api/dashboard/risk-split?${queryString}` : '/api/dashboard/risk-split';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch risk split');
      return response.json();
    },
  });

  // Legality split data for donut chart
  const { data: legalitySplitData } = useQuery({
    queryKey: ["/api/dashboard/legality-split", filters],
    queryFn: async () => {
      const url = queryString ? `/api/dashboard/legality-split?${queryString}` : '/api/dashboard/legality-split';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch legality split');
      return response.json();
    },
  });

  // Supply Chain metrics
  const { data: supplyChainMetrics } = useQuery({
    queryKey: ["/api/dashboard/supply-chain-metrics"],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/supply-chain-metrics');
      if (!response.ok) throw new Error('Failed to fetch supply chain metrics');
      return response.json();
    },
  });

  // DDS Reports metrics
  const { data: ddsMetrics } = useQuery({
    queryKey: ["/api/dashboard/dds-metrics"],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/dds-metrics');
      if (!response.ok) throw new Error('Failed to fetch DDS metrics');
      return response.json();
    },
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

  // Monitor for data changes and refresh dashboard metrics
  useEffect(() => {
    // Force fresh metrics on mount
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    
    // Check for Table Result updates from localStorage 
    const checkForTableUpdates = () => {
      try {
        const hasRealData = localStorage.getItem('hasRealAnalysisData') === 'true';
        const storedResults = localStorage.getItem('currentAnalysisResults');
        
        if (hasRealData && storedResults) {
          // Data exists in table - refresh dashboard from server
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
        } else {
          // No data in table - dashboard should show zeros (handled by server)
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
        }
      } catch (error) {
        console.error("Error checking table updates:", error);
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      }
    };

    // Initial check and periodic updates
    checkForTableUpdates();
    const interval = setInterval(checkForTableUpdates, 3000);
    
    // Listen for storage changes (when Table Result updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentAnalysisResults' || e.key === 'hasRealAnalysisData') {
        checkForTableUpdates();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient]);

  // Use server metrics directly - server now handles zero state properly
  const defaultMetrics: DashboardMetrics = {
    totalPlots: 0,
    compliantPlots: 0, 
    highRiskPlots: 0,
    mediumRiskPlots: 0,
    deforestedPlots: 0,
    totalAreaHa: 0,
    complianceRate: 0
  };
  const displayMetrics: DashboardMetrics = metrics ? metrics as DashboardMetrics : defaultMetrics;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kpn-red mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const complianceRate = displayMetrics.totalPlots > 0 ? ((displayMetrics.compliantPlots / displayMetrics.totalPlots) * 100).toFixed(1) : '0';
  const atRiskRate = displayMetrics.totalPlots > 0 ? ((displayMetrics.highRiskPlots / displayMetrics.totalPlots) * 100).toFixed(1) : '0';
  const criticalRate = displayMetrics.totalPlots > 0 ? ((displayMetrics.deforestedPlots / displayMetrics.totalPlots) * 100).toFixed(1) : '0';

  // Export functionality using API endpoint
  const handleExportCompliance = async () => {
    try {
      const url = queryString ? `/api/dashboard/export?${queryString}` : '/api/dashboard/export';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the CSV content from response
      const csvContent = await response.text();
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url2 = URL.createObjectURL(blob);
      link.setAttribute('href', url2);
      link.setAttribute('download', `EUDR_Compliance_Overview_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url2);
    } catch (error) {
      console.error('Export failed:', error);
      // TODO: Show user-friendly error message
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-800">EUDR Compliance Dashboard</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleExportCompliance}
              data-testid="button-export-compliance"
            >
              <Download className="h-4 w-4" />
              Export Compliance Overview
            </Button>
          </div>
        </div>

        {/* Dashboard Filters */}
        <DashboardFilterBar />

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
                <p className="text-3xl font-bold text-gray-900" data-testid="text-total-plots">{displayMetrics.totalPlots || 0}</p>
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
                <p className="text-3xl font-bold text-gray-900" data-testid="text-compliant-plots">{displayMetrics.compliantPlots || 0}</p>
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
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-high-risk-plots">{displayMetrics.highRiskPlots || 0}</p>
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
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-medium-risk-plots">{displayMetrics.mediumRiskPlots || 0}</p>
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
                  <p className="text-3xl font-bold text-gray-900" data-testid="text-deforested-plots">{displayMetrics.deforestedPlots || 0}</p>
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
                <p className="text-3xl font-bold text-gray-900" data-testid="text-total-area">{(displayMetrics.totalAreaHa || 0).toFixed(2)} ha</p>
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
                <p className="text-3xl font-bold text-gray-900" data-testid="text-low-risk-area">
                  {(() => {
                    const totalPlots = displayMetrics.totalPlots || 0;
                    const highRiskPlots = displayMetrics.highRiskPlots || 0;
                    const mediumRiskPlots = displayMetrics.mediumRiskPlots || 0;
                    const totalArea = displayMetrics.totalAreaHa || 0;
                    const lowRiskPlots = totalPlots - highRiskPlots - mediumRiskPlots;
                    
                    // Calculate proportional area for low risk plots
                    const lowRiskArea = totalPlots > 0 ? (lowRiskPlots / totalPlots) * totalArea : 0;
                    return lowRiskArea.toFixed(2);
                  })()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Supply Chain Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Supply Chain</h2>
          
          <div className="grid grid-cols-4 gap-6 mb-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Total Suppliers</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-total-suppliers">
                  {supplyChainMetrics?.totalSuppliers || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Chain Links</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-chain-links">
                  {supplyChainMetrics?.totalChainLinks || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Total Shipments</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-total-shipments">
                  {supplyChainMetrics?.totalShipments || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Verified Suppliers</p>
                <p className="text-3xl font-bold text-green-600" data-testid="text-verified-suppliers">
                  {supplyChainMetrics?.verifiedSuppliers || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* DDS Reports Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Due Diligence Statements</h2>
          
          <div className="grid grid-cols-5 gap-6 mb-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900" data-testid="text-total-reports">
                  {ddsMetrics?.totalReports || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Draft</p>
                <p className="text-3xl font-bold text-gray-500" data-testid="text-draft-reports">
                  {ddsMetrics?.draftReports || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Generated</p>
                <p className="text-3xl font-bold text-blue-600" data-testid="text-generated-reports">
                  {ddsMetrics?.generatedReports || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Downloaded</p>
                <p className="text-3xl font-bold text-yellow-600" data-testid="text-downloaded-reports">
                  {ddsMetrics?.downloadedReports || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Submitted</p>
                <p className="text-3xl font-bold text-green-600" data-testid="text-submitted-reports">
                  {ddsMetrics?.submittedReports || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-5 gap-6">
            <a href="/data-collection" className="block" data-testid="link-data-collection">
              <Card className="bg-white border border-gray-200 hover:border-green-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Data Collection</p>
                  <p className="text-xs text-gray-500 mt-1">Collect supplier data</p>
                </CardContent>
              </Card>
            </a>

            <a href="/deforestation-monitoring" className="block" data-testid="link-spatial-analysis">
              <Card className="bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Spatial Analysis</p>
                  <p className="text-xs text-gray-500 mt-1">Monitor deforestation</p>
                </CardContent>
              </Card>
            </a>

            <a href="/legality-assessment" className="block" data-testid="link-legality">
              <Card className="bg-white border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Legality Assessment</p>
                  <p className="text-xs text-gray-500 mt-1">Verify compliance</p>
                </CardContent>
              </Card>
            </a>

            <a href="/due-diligence-report" className="block" data-testid="link-dds-reports">
              <Card className="bg-white border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">DDS Reports</p>
                  <p className="text-xs text-gray-500 mt-1">Generate reports</p>
                </CardContent>
              </Card>
            </a>

            <a href="/unified-supply-chain" className="block" data-testid="link-supply-chain">
              <Card className="bg-white border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Supply Chain</p>
                  <p className="text-xs text-gray-500 mt-1">Manage workflow</p>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>

        {/* Supply Chain Health Visualization */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Supply Chain Health</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tier Distribution Chart */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Suppliers by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tier 1</span>
                      <span className="text-sm font-semibold text-gray-900" data-testid="text-tier1-count">
                        {supplyChainMetrics?.tierDistribution?.tier1Suppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 
                            ? ((supplyChainMetrics.tierDistribution?.tier1Suppliers || 0) / supplyChainMetrics.totalSuppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tier 2</span>
                      <span className="text-sm font-semibold text-gray-900" data-testid="text-tier2-count">
                        {supplyChainMetrics?.tierDistribution?.tier2Suppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 
                            ? ((supplyChainMetrics.tierDistribution?.tier2Suppliers || 0) / supplyChainMetrics.totalSuppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tier 3</span>
                      <span className="text-sm font-semibold text-gray-900" data-testid="text-tier3-count">
                        {supplyChainMetrics?.tierDistribution?.tier3Suppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 
                            ? ((supplyChainMetrics.tierDistribution?.tier3Suppliers || 0) / supplyChainMetrics.totalSuppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance by Tier Chart */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Compliance by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tier 1 Compliant</span>
                      <span className="text-sm font-semibold text-green-600" data-testid="text-tier1-compliant">
                        {supplyChainMetrics?.complianceByTier?.tier1Compliant || 0} / {supplyChainMetrics?.tierDistribution?.tier1Suppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.tierDistribution?.tier1Suppliers && supplyChainMetrics.tierDistribution.tier1Suppliers > 0 
                            ? ((supplyChainMetrics.complianceByTier?.tier1Compliant || 0) / supplyChainMetrics.tierDistribution.tier1Suppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tier 2 Compliant</span>
                      <span className="text-sm font-semibold text-green-600" data-testid="text-tier2-compliant">
                        {supplyChainMetrics?.complianceByTier?.tier2Compliant || 0} / {supplyChainMetrics?.tierDistribution?.tier2Suppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.tierDistribution?.tier2Suppliers && supplyChainMetrics.tierDistribution.tier2Suppliers > 0 
                            ? ((supplyChainMetrics.complianceByTier?.tier2Compliant || 0) / supplyChainMetrics.tierDistribution.tier2Suppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Tier 3 Compliant</span>
                      <span className="text-sm font-semibold text-green-600" data-testid="text-tier3-compliant">
                        {supplyChainMetrics?.complianceByTier?.tier3Compliant || 0} / {supplyChainMetrics?.tierDistribution?.tier3Suppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.tierDistribution?.tier3Suppliers && supplyChainMetrics.tierDistribution.tier3Suppliers > 0 
                            ? ((supplyChainMetrics.complianceByTier?.tier3Compliant || 0) / supplyChainMetrics.tierDistribution.tier3Suppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Overall Compliance Rate</span>
                      <span className="text-sm font-bold text-green-600" data-testid="text-overall-compliance">
                        {supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 
                          ? ((supplyChainMetrics.verifiedSuppliers / supplyChainMetrics.totalSuppliers * 100).toFixed(1))
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linkage Completion Status */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Linkage Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Linked Suppliers</span>
                      <span className="text-sm font-semibold text-green-600" data-testid="text-linked-suppliers">
                        {supplyChainMetrics?.linkedSuppliers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 
                            ? ((supplyChainMetrics.linkedSuppliers || 0) / supplyChainMetrics.totalSuppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Unlinked Suppliers</span>
                      <span className="text-sm font-semibold text-red-600" data-testid="text-unlinked-suppliers">
                        {supplyChainMetrics?.totalSuppliers && supplyChainMetrics.linkedSuppliers 
                          ? supplyChainMetrics.totalSuppliers - supplyChainMetrics.linkedSuppliers 
                          : 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 && supplyChainMetrics.linkedSuppliers 
                            ? ((supplyChainMetrics.totalSuppliers - supplyChainMetrics.linkedSuppliers) / supplyChainMetrics.totalSuppliers * 100) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Chain Links</span>
                      <span className="text-sm font-semibold text-blue-600" data-testid="text-total-links">
                        {supplyChainMetrics?.totalChainLinks || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Linkage Completion Rate</span>
                      <span className="text-sm font-bold text-green-600" data-testid="text-linkage-rate">
                        {supplyChainMetrics?.totalSuppliers && supplyChainMetrics.totalSuppliers > 0 && supplyChainMetrics.linkedSuppliers 
                          ? ((supplyChainMetrics.linkedSuppliers / supplyChainMetrics.totalSuppliers * 100).toFixed(1))
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Phase 4: Analytics Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Risk Split Donut Chart */}
          <Card className="border-neutral-border" data-testid="risk-split-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart 
                data={riskSplitData ? [
                  { label: "Low Risk", value: riskSplitData.low || 0, color: "#059669" },
                  { label: "Medium Risk", value: riskSplitData.medium || 0, color: "#d97706" },
                  { label: "High Risk", value: riskSplitData.high || 0, color: "#dc2626" }
                ] : [
                  { label: "Low Risk", value: displayMetrics.totalPlots - displayMetrics.highRiskPlots - displayMetrics.mediumRiskPlots, color: "#059669" },
                  { label: "Medium Risk", value: displayMetrics.mediumRiskPlots, color: "#d97706" },
                  { label: "High Risk", value: displayMetrics.highRiskPlots, color: "#dc2626" }
                ]}
                title=""
                centerText={riskSplitData ? (riskSplitData.low + riskSplitData.medium + riskSplitData.high).toString() : displayMetrics.totalPlots.toString()}
                dataTestId="risk-split-chart"
              />
            </CardContent>
          </Card>

          {/* Legality Status Donut Chart */}
          <Card className="border-neutral-border" data-testid="legality-split-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Legality Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart 
                data={legalitySplitData ? [
                  { label: "Compliant", value: legalitySplitData.compliant || 0, color: "#059669" },
                  { label: "Under Review", value: legalitySplitData.underReview || 0, color: "#d97706" },
                  { label: "Non-Compliant", value: legalitySplitData.nonCompliant || 0, color: "#dc2626" }
                ] : [
                  { label: "Compliant", value: displayMetrics.compliantPlots, color: "#059669" },
                  { label: "Under Review", value: Math.floor(displayMetrics.totalPlots * 0.1), color: "#d97706" },
                  { label: "Non-Compliant", value: displayMetrics.totalPlots - displayMetrics.compliantPlots - Math.floor(displayMetrics.totalPlots * 0.1), color: "#dc2626" }
                ]}
                title=""
                centerText={legalitySplitData ? (legalitySplitData.compliant + legalitySplitData.underReview + legalitySplitData.nonCompliant).toString() : displayMetrics.totalPlots.toString()}
                dataTestId="legality-split-chart"
              />
            </CardContent>
          </Card>

          {/* Alerts Widget */}
          <AlertsWidget />
        </div>

        {/* Compliance Trend Chart */}
        <div className="mb-8">
          <Card className="border-neutral-border" data-testid="compliance-trend-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Compliance Trend Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComplianceTrendChart 
                dataTestId="compliance-trend-chart"
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Supplier Compliance Table */}
        <div className="mb-8">
          <SupplierComplianceTable />
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

export default function Dashboard() {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
}