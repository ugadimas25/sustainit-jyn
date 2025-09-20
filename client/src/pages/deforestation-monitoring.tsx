import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Upload, File, Download, Trash2, Play, Map, AlertTriangle, 
  CheckCircle2, XCircle, Clock, Eye, Info, Zap, ChevronUp, ChevronDown,
  Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal, Edit, 
  RefreshCw, CheckSquare, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AnalysisResult {
  plotId: string;
  country: string;
  area: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  complianceStatus: 'COMPLIANT' | 'NON-COMPLIANT';
  gfwLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  jrcLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  sbtnLoss: 'LOW' | 'MEDIUM' | 'HIGH';
  highRiskDatasets: string[];
  geometry?: any;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer | null;
}

export default function DeforestationMonitoring() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AnalysisResult[]>([]);
  const [, setLocation] = useLocation();

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof AnalysisResult | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // GeoJSON upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ geojsonFile, fileName }: { geojsonFile: string, fileName: string }) => {
      const response = await apiRequest('POST', '/api/geojson/upload', { geojsonFile, fileName });
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Analysis Complete", 
        description: `GeoJSON analysis completed successfully. Processing ${response.data?.features?.length || 0} plots.`
      });

      // Transform API response to our expected format
      if (response.data?.features) {
        const transformedResults = response.data.features.map((feature: any) => ({
          plotId: feature.properties.plot_id,
          country: feature.properties.country_name || 'Unknown',
          area: feature.properties.total_area_hectares || 0,
          overallRisk: feature.properties.overall_compliance?.overall_risk?.toUpperCase() || 'UNKNOWN',
          complianceStatus: feature.properties.overall_compliance?.compliance_status === 'NON_COMPLIANT' ? 'NON-COMPLIANT' : 'COMPLIANT',
          gfwLoss: feature.properties.gfw_loss?.gfw_loss_stat?.toUpperCase() || 'UNKNOWN',
          jrcLoss: feature.properties.jrc_loss?.jrc_loss_stat?.toUpperCase() || 'UNKNOWN',
          sbtnLoss: feature.properties.sbtn_loss?.sbtn_loss_stat?.toUpperCase() || 'UNKNOWN',
          highRiskDatasets: feature.properties.overall_compliance?.high_risk_datasets || [],
          geometry: feature.geometry
        }));

        setAnalysisResults(transformedResults);
        setFilteredResults(transformedResults);
      }

      setIsAnalyzing(false);
      setAnalysisProgress(100);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze GeoJSON file. Please try again.",
        variant: "destructive"
      });
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['.geojson', '.json', '.kml'];
    const fileName = file.name.toLowerCase();
    const isValidType = validTypes.some(type => fileName.endsWith(type));

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a GeoJSON (.json/.geojson) or KML (.kml) file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        if (!content || content.trim().length === 0) {
          toast({
            title: "Invalid file",
            description: "The uploaded file appears to be empty",
            variant: "destructive"
          });
          return;
        }

        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: content
        });

        toast({
          title: "File uploaded successfully",
          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB) is ready for analysis`
        });
      } catch (error) {
        toast({
          title: "Error reading file",
          description: "Failed to read the uploaded file. Please try again.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setAnalysisResults([]);
    setFilteredResults([]);
    setAnalysisProgress(0);
    setCurrentPage(1);
    setSearchTerm('');
    setRiskFilter('all');
    setComplianceFilter('all');
    setCountryFilter('all');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadExample = () => {
    const exampleGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            plot_id: "PLOT_001",
            name: "Sample Plot Indonesia",
            country: "Indonesia"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [113.921327, -2.147871],
              [113.943567, -2.147871],
              [113.943567, -2.169234],
              [113.921327, -2.169234],
              [113.921327, -2.147871]
            ]]
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(exampleGeoJSON, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'example_geojson.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const analyzeFile = async () => {
    if (!uploadedFile || !uploadedFile.content) return;

    setIsAnalyzing(true);
    setAnalysisProgress(10);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 800);

    uploadMutation.mutate({
      geojsonFile: uploadedFile.content as string,
      fileName: uploadedFile.name
    });
  };

  // Filter and sort functionality
  useEffect(() => {
    let filtered = [...analysisResults];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(result =>
        result.plotId.toLowerCase().includes(search) ||
        result.country.toLowerCase().includes(search) ||
        result.area.toString().includes(search)
      );
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(result => result.overallRisk === riskFilter.toUpperCase());
    }

    if (complianceFilter !== 'all') {
      filtered = filtered.filter(result => result.complianceStatus === complianceFilter.toUpperCase());
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter(result => result.country === countryFilter);
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          if (sortDirection === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
          }
        }
      });
    }

    setFilteredResults(filtered);
    setCurrentPage(1);
  }, [analysisResults, searchTerm, riskFilter, complianceFilter, countryFilter, sortColumn, sortDirection]);

  const handleSort = (column: keyof AnalysisResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const uniqueCountries = [...new Set(analysisResults.map(r => r.country))];
  const uniqueRisks = [...new Set(analysisResults.map(r => r.overallRisk))];
  const uniqueCompliance = [...new Set(analysisResults.map(r => r.complianceStatus))];

  const totalPages = Math.ceil(filteredResults.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageData = filteredResults.slice(startIndex, endIndex);

  const getSortIcon = (column: keyof AnalysisResult) => {
    if (sortColumn !== column) {
      return <div className="w-4 h-4"></div>;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">LOW</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">MEDIUM</Badge>;
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">HIGH</Badge>;
      default:
        return <Badge variant="secondary">{risk}</Badge>;
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return <Badge className="bg-green-100 text-green-800">COMPLIANT</Badge>;
      case 'NON-COMPLIANT':
        return <Badge className="bg-red-100 text-red-800">NON-COMPLIANT</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Spatial Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload GeoJSON/KML files to analyze deforestation risk and compliance status
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
              <Upload className="h-5 w-5" />
              Submit Geometry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!uploadedFile ? (
              <div className="text-center space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Click to upload or drag and drop your GeoJSON or KML file
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: .geojson, .json, .kml
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,.kml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={downloadExample}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Example
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">File uploaded: {uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={analyzeFile}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Analyze File
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearUpload}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Upload
                    </Button>
                  </div>
                </div>

                {isAnalyzing && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analyzing with satellite data...</span>
                      <span className="text-blue-600 font-medium">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-sm text-blue-600">
                      Processing against GFW Loss, JRC, SBTN, and WDPA datasets
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        {analysisResults.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Results Table
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredResults.length} of {analysisResults.length} plots
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setLocation('/map-viewer')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Map className="h-4 w-4 mr-2" />
                  View in Map
                </Button>
              </div>
            </CardHeader>

            {/* Search and Filter Controls */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search plots, countries, area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {uniqueCountries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk</SelectItem>
                      {uniqueRisks.map(risk => (
                        <SelectItem key={risk} value={risk}>{risk}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Compliance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueCompliance.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('plotId')}
                      >
                        <div className="flex items-center gap-2">
                          Plot ID
                          {getSortIcon('plotId')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('country')}
                      >
                        <div className="flex items-center gap-2">
                          Country
                          {getSortIcon('country')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('area')}
                      >
                        <div className="flex items-center gap-2">
                          Area (HA)
                          {getSortIcon('area')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('overallRisk')}
                      >
                        <div className="flex items-center gap-2">
                          Overall Risk
                          {getSortIcon('overallRisk')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('complianceStatus')}
                      >
                        <div className="flex items-center gap-2">
                          Compliance Status
                          {getSortIcon('complianceStatus')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('gfwLoss')}
                      >
                        <div className="flex items-center gap-2">
                          GFW Loss
                          {getSortIcon('gfwLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('jrcLoss')}
                      >
                        <div className="flex items-center gap-2">
                          JRC Loss
                          {getSortIcon('jrcLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('sbtnLoss')}
                      >
                        <div className="flex items-center gap-2">
                          SBTN Loss
                          {getSortIcon('sbtnLoss')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentPageData.map((result) => (
                      <tr key={result.plotId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {result.plotId}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {result.country}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {result.area}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getRiskBadge(result.overallRisk)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getComplianceBadge(result.complianceStatus)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getRiskBadge(result.gfwLoss)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getRiskBadge(result.jrcLoss)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getRiskBadge(result.sbtnLoss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Results Table
              </CardTitle>
              <p className="text-sm text-gray-600">
                No analysis results yet. Upload a GeoJSON file to see deforestation analysis data.
              </p>
            </CardHeader>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Data Available</p>
                <p className="text-sm">
                  Upload and analyze GeoJSON files to populate this table with deforestation risk assessment results.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}