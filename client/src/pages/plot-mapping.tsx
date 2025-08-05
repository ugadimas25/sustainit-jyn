import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Plus, 
  Search, 
  Download, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Edit
} from "lucide-react";

interface PlotData {
  id: string;
  plotNumber: string;
  supplierName: string;
  businessUnit: string;
  village: string;
  district: string;
  coordinates: string;
  area: number;
  deforestationStatus: 'none' | 'detected' | 'at-risk' | 'monitored';
  legalityStatus: 'compliant' | 'non-compliant' | 'pending' | 'requires-review';
  complianceStatus: 'compliant' | 'non-compliant' | 'at-risk' | 'pending';
  lastUpdated: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// Sample plot data with comprehensive status information
const samplePlotData: PlotData[] = [
  {
    id: "plot_001",
    plotNumber: "KPN-001",
    supplierName: "PT Sinar Mas Agro",
    businessUnit: "Plantation North",
    village: "Desa Makmur",
    district: "Riau Tengah",
    coordinates: "-2.234, 111.456",
    area: 45.7,
    deforestationStatus: "none",
    legalityStatus: "compliant",
    complianceStatus: "compliant",
    lastUpdated: "2024-01-15",
    riskLevel: "low"
  },
  {
    id: "plot_002",
    plotNumber: "KPN-002",
    supplierName: "PT Wilmar International",
    businessUnit: "Plantation South",
    village: "Desa Sejahtera",
    district: "Jambi Selatan",
    coordinates: "-1.789, 112.123",
    area: 52.3,
    deforestationStatus: "detected",
    legalityStatus: "requires-review",
    complianceStatus: "non-compliant",
    lastUpdated: "2024-01-14",
    riskLevel: "high"
  },
  {
    id: "plot_003",
    plotNumber: "KPN-003",
    supplierName: "PT Astra Agro Lestari",
    businessUnit: "Plantation Central",
    village: "Desa Berkah",
    district: "Sumatra Utara",
    coordinates: "-0.567, 110.789",
    area: 38.9,
    deforestationStatus: "at-risk",
    legalityStatus: "pending",
    complianceStatus: "at-risk",
    lastUpdated: "2024-01-13",
    riskLevel: "medium"
  },
  {
    id: "plot_004",
    plotNumber: "KPN-004",
    supplierName: "PT Golden Agri Resources",
    businessUnit: "Smallholder Program",
    village: "Desa Harapan",
    district: "Kalimantan Barat",
    coordinates: "-1.234, 113.567",
    area: 29.4,
    deforestationStatus: "monitored",
    legalityStatus: "compliant",
    complianceStatus: "compliant",
    lastUpdated: "2024-01-12",
    riskLevel: "low"
  },
  {
    id: "plot_005",
    plotNumber: "KPN-005",
    supplierName: "PT Musim Mas Group",
    businessUnit: "Estate Management",
    village: "Desa Maju",
    district: "Riau Selatan",
    coordinates: "-2.567, 111.234",
    area: 61.2,
    deforestationStatus: "detected",
    legalityStatus: "non-compliant",
    complianceStatus: "non-compliant",
    lastUpdated: "2024-01-11",
    riskLevel: "high"
  },
  {
    id: "plot_006",
    plotNumber: "KPN-006",
    supplierName: "PT Bumitama Agri Ltd",
    businessUnit: "Mill Operations",
    village: "Desa Subur",
    district: "Jambi Utara",
    coordinates: "-1.890, 112.456",
    area: 43.8,
    deforestationStatus: "none",
    legalityStatus: "compliant",
    complianceStatus: "compliant",
    lastUpdated: "2024-01-10",
    riskLevel: "low"
  }
];

export default function PlotMapping() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data: apiPlots, isLoading } = useQuery({
    queryKey: ["/api/plots"],
  });

  // Use sample data for now since API returns empty array
  const plots = apiPlots?.length > 0 ? apiPlots : samplePlotData;

  // Filter plots based on search and filters
  const filteredPlots = plots.filter((plot: PlotData) => {
    const matchesSearch = searchQuery === "" || 
      plot.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.village.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || plot.complianceStatus === statusFilter;
    const matchesBusinessUnit = businessUnitFilter === "all" || plot.businessUnit === businessUnitFilter;
    const matchesRisk = riskFilter === "all" || plot.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesBusinessUnit && matchesRisk;
  });

  // Helper functions for status badges
  const getStatusBadge = (status: string, type: 'deforestation' | 'legality' | 'compliance') => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    
    switch (type) {
      case 'deforestation':
        switch (status) {
          case 'none': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-3 h-3" />None</Badge>;
          case 'detected': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}><XCircle className="w-3 h-3" />Detected</Badge>;
          case 'at-risk': return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}><AlertTriangle className="w-3 h-3" />At Risk</Badge>;
          case 'monitored': return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}><Eye className="w-3 h-3" />Monitored</Badge>;
          default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
        }
      case 'legality':
        switch (status) {
          case 'compliant': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-3 h-3" />Compliant</Badge>;
          case 'non-compliant': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}><XCircle className="w-3 h-3" />Non-Compliant</Badge>;
          case 'pending': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}><Clock className="w-3 h-3" />Pending</Badge>;
          case 'requires-review': return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}><AlertTriangle className="w-3 h-3" />Review Required</Badge>;
          default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
        }
      case 'compliance':
        switch (status) {
          case 'compliant': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="w-3 h-3" />Compliant</Badge>;
          case 'non-compliant': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}><XCircle className="w-3 h-3" />Non-Compliant</Badge>;
          case 'at-risk': return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}><AlertTriangle className="w-3 h-3" />At Risk</Badge>;
          case 'pending': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}><Clock className="w-3 h-3" />Pending</Badge>;
          default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
        }
    }
  };

  const getRiskBadge = (risk: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full";
    switch (risk) {
      case 'low': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Low</Badge>;
      case 'medium': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Medium</Badge>;
      case 'high': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>High</Badge>;
      default: return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-neutral-bg">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading plots...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-green-600" />
                  Plot Management
                </h1>
                <p className="text-gray-600 mt-1">Monitor and manage palm oil plots with comprehensive compliance tracking</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="bg-forest text-white hover:bg-green-700" data-testid="button-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Polygons
                </Button>
                <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-add">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Plot
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search & Filter Plots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Plots
                    </label>
                    <Input
                      placeholder="Plot number, supplier, village..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-plots"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compliance Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="select-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                        <SelectItem value="at-risk">At Risk</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Unit
                    </label>
                    <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                      <SelectTrigger data-testid="select-business-unit">
                        <SelectValue placeholder="All Units" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Business Units</SelectItem>
                        <SelectItem value="Plantation North">Plantation North</SelectItem>
                        <SelectItem value="Plantation South">Plantation South</SelectItem>
                        <SelectItem value="Plantation Central">Plantation Central</SelectItem>
                        <SelectItem value="Smallholder Program">Smallholder Program</SelectItem>
                        <SelectItem value="Estate Management">Estate Management</SelectItem>
                        <SelectItem value="Mill Operations">Mill Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Level
                    </label>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger data-testid="select-risk-filter">
                        <SelectValue placeholder="All Risk Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Plots</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredPlots.length}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Compliant</p>
                      <p className="text-2xl font-bold text-green-600">
                        {filteredPlots.filter(plot => plot.complianceStatus === 'compliant').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">At Risk</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {filteredPlots.filter(plot => plot.complianceStatus === 'at-risk' || plot.complianceStatus === 'non-compliant').length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Area</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredPlots.reduce((sum, plot) => sum + plot.area, 0).toFixed(0)} Ha
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">Ha</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plot Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Plot Details ({filteredPlots.length} plots)
                </CardTitle>
                <Button variant="outline" size="sm" data-testid="button-export-plots">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Plot Number</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Supplier</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Business Unit</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Location</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Area (Ha)</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Deforestation Status</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Legality Status</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Compliance Status</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Risk Level</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Last Updated</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlots.map((plot) => (
                      <tr key={plot.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-blue-600">
                          {plot.plotNumber}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{plot.supplierName}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{plot.businessUnit}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div>
                            <div className="font-medium">{plot.village}</div>
                            <div className="text-gray-500 text-xs">{plot.district}</div>
                            <div className="text-gray-400 text-xs font-mono">{plot.coordinates}</div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium">
                          {plot.area}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {getStatusBadge(plot.deforestationStatus, 'deforestation')}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {getStatusBadge(plot.legalityStatus, 'legality')}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {getStatusBadge(plot.complianceStatus, 'compliance')}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {getRiskBadge(plot.riskLevel)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                          {new Date(plot.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`button-view-${plot.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-edit-${plot.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No plots found</p>
                  <p>Try adjusting your search criteria or filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
