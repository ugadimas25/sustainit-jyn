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
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  complianceStatus: 'COMPLIANT' | 'NON-COMPLIANT' | 'UNKNOWN';
  gfwLoss: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  jrcLoss: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  sbtnLoss: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  highRiskDatasets: string[];
  gfwLossArea?: number;
  jrcLossArea?: number;
  sbtnLossArea?: number;
  geometry?: any;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer | null;
}

// Helper function to remove Z-coordinate from GeoJSON geometry
const removeZValue = (geometry: any) => {
  if (!geometry) return geometry;

  if (geometry.type.includes('Polygon')) {
    geometry.coordinates = geometry.coordinates.map((coords: any[]) => {
      return coords.map((ring: any[]) => 
        ring.map((coord: number[]) => coord.slice(0, 2)) // Keep only [x, y]
      );
    });
  } else if (geometry.type.includes('LineString')) {
    geometry.coordinates = geometry.coordinates.map((coord: number[]) => coord.slice(0, 2));
  } else if (geometry.type.includes('Point')) {
    geometry.coordinates = geometry.coordinates.slice(0, 2);
  } else if (geometry.type.includes('Multi')) {
    // Recursively apply to MultiPolygon, MultiLineString, MultiPoint
    const multiType = geometry.type.replace('Multi', '');
    geometry.coordinates = geometry.coordinates.map((geomArray: any[]) => 
      removeZValue({ type: multiType, coordinates: geomArray })
    );
  } else if (geometry.type === 'GeometryCollection') {
    geometry.geometries = geometry.geometries.map(removeZValue);
  }
  return geometry;
};


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
  const [selectedResults, setSelectedResults] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // GeoJSON upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ geojsonFile, fileName }: { geojsonFile: string, fileName: string }) => {
      // Parse GeoJSON and remove Z-values
      let geojsonData;
      try {
        geojsonData = JSON.parse(geojsonFile);
        geojsonData.features = geojsonData.features.map((feature: any) => {
          if (feature.geometry) {
            feature.geometry = removeZValue(feature.geometry);
          }
          return feature;
        });
      } catch (e) {
        throw new Error('Failed to parse GeoJSON file.');
      }

      // Re-stringify after processing
      const processedGeojsonString = JSON.stringify(geojsonData);

      const response = await fetch('/api/geojson/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          geojson: processedGeojsonString,
          filename: fileName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      console.log('✅ Upload successful, fetching latest results from database...');

      try {
        // Fetch the latest analysis results from the database API
        const dbResponse = await fetch('/api/analysis-results');
        if (!dbResponse.ok) {
          throw new Error('Failed to fetch analysis results from database');
        }

        const dbResults = await dbResponse.json();
        console.log(`✅ Fetched ${dbResults.length} analysis results from database`);

        // Transform database results to match the expected format (same as map-viewer.tsx)
        const formattedResults = dbResults.map((result: any) => ({
          plotId: result.plotId,
          country: result.country,
          area: Number(result.area) || 0,
          overallRisk: result.overallRisk || 'UNKNOWN',
          complianceStatus: result.complianceStatus || 'UNKNOWN',
          gfwLoss: result.gfwLoss || 'UNKNOWN',
          jrcLoss: result.jrcLoss || 'UNKNOWN',
          sbtnLoss: result.sbtnLoss || 'UNKNOWN',
          highRiskDatasets: result.highRiskDatasets || [],
          gfwLossArea: Number(result.gfwLossArea) || 0,
          jrcLossArea: Number(result.jrcLossArea) || 0,
          sbtnLossArea: Number(result.sbtnLossArea) || 0,
          geometry: result.geometry // This contains the actual polygon coordinates
        }));

        console.log(`✅ Stored ${formattedResults.length} analysis results for spatial analysis page`);
        setAnalysisResults(formattedResults);
        setFilteredResults(formattedResults);

        // Store in localStorage for persistence (same format as map viewer)
        localStorage.setItem('currentAnalysisResults', JSON.stringify(formattedResults));
        localStorage.setItem('hasRealAnalysisData', 'true');

        toast({
          title: "Analysis Complete",
          description: `Successfully analyzed ${formattedResults.length} plots`,
        });

      } catch (error) {
        console.error('Error fetching database results:', error);

        // Fallback to using API response data if database fetch fails
        if (data?.data?.features) {
          const fallbackResults = data.data.features.map((feature: any) => {
            const props = feature.properties || {};
            const plotId = props.plot_id || props.id || `PLOT_${Math.random().toString(36).substring(7)}`;

            return {
              plotId,
              country: props.country_name || 'Unknown',
              area: parseFloat(props.total_area_hectares || '1'),
              overallRisk: props.overall_compliance?.overall_risk?.toUpperCase() || 'UNKNOWN',
              complianceStatus: props.overall_compliance?.compliance_status === 'NON_COMPLIANT' ? 'NON-COMPLIANT' : 'COMPLIANT',
              gfwLoss: props.gfw_loss?.gfw_loss_area > 0 ? 'TRUE' : 'FALSE',
              jrcLoss: props.jrc_loss?.jrc_loss_area > 0 ? 'TRUE' : 'FALSE',
              sbtnLoss: props.sbtn_loss?.sbtn_loss_area > 0 ? 'TRUE' : 'FALSE',
              highRiskDatasets: props.overall_compliance?.high_risk_datasets || [],
              gfwLossArea: parseFloat(props.gfw_loss?.gfw_loss_area || '0'),
              jrcLossArea: parseFloat(props.jrc_loss?.jrc_loss_area || '0'),
              sbtnLossArea: parseFloat(props.sbtn_loss?.sbtn_loss_area || '0'),
              geometry: feature.geometry
            };
          });

          console.log(`⚠️ Using fallback results: ${fallbackResults.length} plots`);
          setAnalysisResults(fallbackResults);
          setFilteredResults(fallbackResults);

          // Store in localStorage for persistence
          localStorage.setItem('currentAnalysisResults', JSON.stringify(fallbackResults));
          localStorage.setItem('hasRealAnalysisData', 'true');

          toast({
            title: "Analysis Complete",
            description: `Successfully analyzed ${fallbackResults.length} plots (fallback mode)`,
          });
        }
      }

      setIsAnalyzing(false);
      setAnalysisProgress(100);
      setUploadedFile(null);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast({
        title: "Analysis Failed", 
        description: error.message,
        variant: "destructive"
      });
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    },
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
        const content = e.target?.result;

        if (!content || content.toString().trim().length === 0) {
          toast({
            title: "Invalid file",
            description: "The uploaded file appears to be empty",
            variant: "destructive"
          });
          return;
        }

        // Parse and validate GeoJSON structure early
        let parsedGeoJSON;
        try {
          parsedGeoJSON = JSON.parse(content.toString());
        } catch (error) {
          throw new Error('Failed to parse GeoJSON file. Please ensure it is valid JSON.');
        }

        // Enhanced validation for multiple GeoJSON formats
        if (parsedGeoJSON.type !== 'FeatureCollection' || !parsedGeoJSON.features || !Array.isArray(parsedGeoJSON.features)) {
          throw new Error('Invalid GeoJSON format. Must be a FeatureCollection with features array.');
        }

        if (parsedGeoJSON.features.length === 0) {
          throw new Error('GeoJSON file contains no features.');
        }

        // Flexible validation for different property naming conventions
        const hasValidFeatures = parsedGeoJSON.features.some((feature: any) => {
          const props = feature.properties || {};

          // Check for ID fields (prioritize 'id' field, then other formats)
          const hasId = props.id || props.plot_id || props['.Farmers ID'] || props.Name || props.farmer_id;

          // Check for area fields (Indonesian or standard format)  
          const hasArea = props['.Plot size'] || props.area_ha || props.area || props.area_hectares;

          // Check for location fields (Indonesian or standard format)
          const hasLocation = props['.Distict'] || props['.Aggregator Location'] || 
                            props.country || props.district || props.region;

          return hasId && (hasArea || hasLocation);
        });

        if (!hasValidFeatures) {
          console.warn('Some features may be missing required properties. Supported formats include:');
          console.warn('- Indonesian format: .Farmers ID, .Plot size, .Distict');
          console.warn('- Standard format: id/plot_id, area_ha/area, country');
          toast({
            title: "Potential Data Issues",
            description: "Some features might be missing expected properties. Please check the console for details.",
            variant: "warning"
          });
        } else {
          console.log('✅ GeoJSON format appears valid and contains necessary fields.');
        }

        // Log detected format for debugging
        const sampleFeature = parsedGeoJSON.features[0];
        const props = sampleFeature?.properties || {};
        if (props.id) {
          console.log('✅ Detected standard GeoJSON format with "id" field');
        } else if (props['.Farmers ID']) {
          console.log('✅ Detected Indonesian GeoJSON format');
        } else if (props.plot_id) {
          console.log('✅ Detected standard GeoJSON format with "plot_id" field');
        } else {
          console.log('ℹ️ Could not definitively detect GeoJSON format, but essential fields seem present.');
        }


        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: content.toString() // Store as string for parsing later
        });

        toast({
          title: "File uploaded successfully",
          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB) is ready for analysis`
        });
      } catch (error: any) {
        console.error("File upload error:", error);
        toast({
          title: "Error processing file",
          description: error.message || "Failed to process the uploaded file. Please check the file format and try again.",
          variant: "destructive",
        });
        // Clear the file input if there's an error
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadedFile(null);
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
    setSelectedResults([]);

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
            country: "Indonesia",
            ".Farmers ID": "FMR001",
            ".Plot size": "0.50 Ha",
            ".Distict": "Central Java"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [113.921327, -2.147871, 10], // Example with Z value
              [113.943567, -2.147871, 10],
              [113.943567, -2.169234, 10],
              [113.921327, -2.169234, 10],
              [113.921327, -2.147871, 10]
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
      geojsonFile: uploadedFile.content,
      fileName: uploadedFile.name
    });
  };

  // Check for stored results when component mounts (returning from map viewer)
  useEffect(() => {
    const shouldShowResults = localStorage.getItem('shouldShowResultsTable');
    const storedResults = localStorage.getItem('currentAnalysisResults');

    if (shouldShowResults === 'true' && storedResults && analysisResults.length === 0) {
      try {
        const parsedResults = JSON.parse(storedResults);
        console.log(`🔄 Restoring ${parsedResults.length} analysis results from storage`);
        setAnalysisResults(parsedResults);
        setFilteredResults(parsedResults);

        // Clear the flag after restoring
        localStorage.removeItem('shouldShowResultsTable');

        toast({
          title: "Results Restored",
          description: `Showing ${parsedResults.length} previously analyzed plots`,
        });
      } catch (error) {
        console.error('Error restoring analysis results:', error);
        localStorage.removeItem('currentAnalysisResults');
        localStorage.removeItem('shouldShowResultsTable');
      }
    }
  }, []); // Run only on mount

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
  const uniqueRisks = [...new Set(analysisResults.map(r => r.overallRisk))].filter(r => r !== 'UNKNOWN');
  const uniqueCompliance = [...new Set(analysisResults.map(r => r.complianceStatus))].filter(r => r !== 'UNKNOWN');

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

  const getLossBadge = (loss: string, lossArea?: number) => {
    // Check if we have actual loss area data
    if (lossArea !== undefined && lossArea !== null) {
      if (lossArea > 0) {
        return <Badge className="bg-red-100 text-red-800">{lossArea.toFixed(2)} ha</Badge>;
      } else {
        return <Badge className="bg-green-100 text-green-800">0 ha</Badge>;
      }
    }

    // Fallback to original logic for backward compatibility
    switch (loss.toUpperCase()) {
      case 'TRUE':
      case 'HIGH':
      case 'YES':
        return <Badge className="bg-red-100 text-red-800">1</Badge>;
      case 'FALSE':
      case 'LOW':
      case 'NO':
      case 'NONE':
        return <Badge className="bg-green-100 text-green-800">0</Badge>;
      default:
        return <Badge variant="secondary">0</Badge>;
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

  const handleRevalidation = async (resultId: string) => {
    const result = analysisResults.find(r => r.plotId === resultId);
    if (!result) return;

    try {
      // Show loading state
      toast({
        title: "Revalidating Analysis",
        description: `Revalidating analysis for plot ${result.plotId}...`,
      });

      // Create a minimal GeoJSON for revalidation, ensuring no Z value
      const revalidationData = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {
            plot_id: result.plotId,
            name: `Revalidation - ${result.plotId}`,
            country: result.country
          },
          geometry: result.geometry ? removeZValue({...result.geometry}) : { // Ensure geometry is copied and Z removed
            type: "Point",
            coordinates: [0, 0] // Fallback coordinates
          }
        }]
      };

      // Call the analysis API again
      const response = await apiRequest('POST', '/api/geojson/upload', {
        geojson: JSON.stringify(revalidationData),
        filename: `revalidation-${result.plotId}.json`
      });

      if (response.ok) {
        const newResults = await response.json();

        toast({
          title: "Revalidation Complete",
          description: `Plot ${result.plotId} has been revalidated successfully.`,
        });

        // Refresh the analysis results by refetching or reloading
        // For simplicity, we reload. A more sophisticated approach would update the state directly.
        window.location.reload();
      } else {
        throw new Error('Revalidation failed');
      }
    } catch (error) {
      console.error('Revalidation error:', error);
      toast({
        title: "Revalidation Failed",
        description: `Failed to revalidate plot ${result.plotId}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleVerification = (resultId: string) => {
    const result = analysisResults.find(r => r.plotId === resultId);
    if (!result) return;

    // Store the selected polygon data for verification
    localStorage.setItem('selectedPolygonForVerification', JSON.stringify(result));

    toast({
      title: "Starting Verification",
      description: `Redirecting to verification page for plot ${result.plotId}`,
    });

    // Navigate to data verification page
    setLocation('/data-verification');
  };

  const handleEdit = (resultId: string) => {
    const result = analysisResults.find(r => r.plotId === resultId);
    if (!result) return;

    // Store the selected polygon data for editing
    localStorage.setItem('selectedPolygonForEdit', JSON.stringify(result));

    toast({
      title: "Starting Edit Mode",
      description: `Opening polygon editor for plot ${result.plotId}`,
    });

    // Navigate to polygon edit page
    setLocation('/edit-polygon');
  };

  const handleViewInMap = (result: AnalysisResult) => {
    localStorage.setItem('selectedPlotForMap', JSON.stringify(result));
    localStorage.setItem('shouldShowResultsTable', 'false'); // Hide table when navigating to map
    setLocation('/map-viewer');
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
                      <span>
                        {analysisProgress < 20 ? 'Detecting countries using Nominatim API...' :
                         analysisProgress < 40 ? 'Uploading cleaned GeoJSON data...' :
                         analysisProgress < 70 ? 'Analyzing with satellite data...' :
                         analysisProgress < 90 ? 'Processing against datasets...' :
                         'Finalizing results...'}
                      </span>
                      <span className="text-blue-600 font-medium">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-sm text-blue-600">
                      {analysisProgress < 20 ? 'Using reverse geocoding for accurate country detection' :
                       'Processing against GFW Loss, JRC, SBTN, and WDPA datasets'}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={selectedResults.length === 0}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      Actions ({selectedResults.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        selectedResults.forEach(rowIndex => {
                          const result = filteredResults[rowIndex];
                          if (result) handleRevalidation(result.plotId);
                        });
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Revalidate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        selectedResults.forEach(rowIndex => {
                          const result = filteredResults[rowIndex];
                          if (result) handleVerification(result.plotId);
                        });
                      }}
                    >
                      <CheckSquare className="h-3 w-3 mr-2" />
                      Verify Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        selectedResults.forEach(rowIndex => {
                          const result = filteredResults[rowIndex];
                          if (result) handleEdit(result.plotId);
                        });
                      }}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <Checkbox
                          checked={currentPageData.length > 0 && currentPageData.every((_, idx) => selectedResults.includes(startIndex + idx))}
                          {...(currentPageData.some((_, idx) => selectedResults.includes(startIndex + idx)) && !currentPageData.every((_, idx) => selectedResults.includes(startIndex + idx)) ? { 'data-indeterminate': 'true' } : {})}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Select all items on current page using their indices
                              const currentPageIndices = currentPageData.map((_, idx) => startIndex + idx);
                              setSelectedResults(prev => [...new Set([...prev, ...currentPageIndices])]);
                            } else {
                              // Deselect all items on current page using their indices
                              const currentPageIndices = currentPageData.map((_, idx) => startIndex + idx);
                              setSelectedResults(prev => prev.filter(idx => !currentPageIndices.includes(idx)));
                            }
                          }}
                        />
                      </th>
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
                    {currentPageData.map((result, index) => {
                      // Create a unique key that handles duplicate plotIds
                      const uniqueKey = result.plotId === 'unknown' 
                        ? `unknown-${index}-${currentPage}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                        : `${result.plotId}-${index}-${currentPage}`;

                      return (
                      <tr key={uniqueKey} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          <Checkbox
                            checked={selectedResults.includes(startIndex + index)}
                            onCheckedChange={(checked) => {
                              const rowIndex = startIndex + index;
                              if (checked) {
                                setSelectedResults(prev => [...prev, rowIndex]);
                              } else {
                                setSelectedResults(prev => prev.filter(idx => idx !== rowIndex));
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
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
                          {getLossBadge(result.gfwLoss, result.gfwLossArea)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getLossBadge(result.jrcLoss, result.jrcLossArea)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getLossBadge(result.sbtnLoss, result.sbtnLossArea)}
                        </td>
                      </tr>
                      );
                    })}
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