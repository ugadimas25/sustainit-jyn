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
  // Intersection areas for high-risk datasets
  gfwLossArea?: number;
  jrcLossArea?: number;
  sbtnLossArea?: number;
  // Peatland analysis
  peatlandOverlap?: string;
  peatlandArea?: number;
  polygonIssues?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer | null;
}

const defaultAnalysisResults = [
  { 
    plotId: "PLOT_005", country: "Indonesia", area: 31.35, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[113.921327, -2.147871], [113.943567, -2.147871], [113.943567, -2.169234], [113.921327, -2.169234], [113.921327, -2.147871]]] }
  },
  { 
    plotId: "PLOT_002", country: "Ivory Coast", area: 1439.07, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: ["GFW Forest Loss"],
    geometry: { type: "Polygon", coordinates: [[[-5.547945, 7.539989], [-5.510712, 7.539989], [-5.510712, 7.577221], [-5.547945, 7.577221], [-5.547945, 7.539989]]] }
  },
  { 
    plotId: "PLOT_009", country: "Nigeria", area: 1.02, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[8.675277, 9.081999], [8.677777, 9.081999], [8.677777, 9.084499], [8.675277, 9.084499], [8.675277, 9.081999]]] }
  },
  { 
    plotId: "PLOT_004", country: "Ghana", area: 1.95, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[-1.094512, 7.946527], [-1.092012, 7.946527], [-1.092012, 7.949027], [-1.094512, 7.949027], [-1.094512, 7.946527]]] }
  },
  { 
    plotId: "PLOT_001", country: "Central African Republic", area: 5604.60, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "HIGH", sbtnLoss: "HIGH", highRiskDatasets: ["GFW Forest Loss", "JRC Forest Loss", "SBTN Natural Lands Loss"],
    geometry: { type: "Polygon", coordinates: [[[18.555696, 4.361002], [18.655696, 4.361002], [18.655696, 4.461002], [18.555696, 4.461002], [18.555696, 4.361002]]] }
  },
  { 
    plotId: "PLOT_010", country: "Brazil", area: 8.12, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[-60.025902, -3.119028], [-60.020902, -3.119028], [-60.020902, -3.114028], [-60.025902, -3.114028], [-60.025902, -3.119028]]] }
  },
  { 
    plotId: "PLOT_007", country: "Indonesia", area: 20.98, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[114.921327, -2.247871], [114.935327, -2.247871], [114.935327, -2.261871], [114.921327, -2.261871], [114.921327, -2.247871]]] }
  },
  { 
    plotId: "PLOT_006", country: "Indonesia", area: 1.97, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[115.421327, -2.347871], [115.423827, -2.347871], [115.423827, -2.350371], [115.421327, -2.350371], [115.421327, -2.347871]]] }
  },
  { 
    plotId: "PLOT_008", country: "Ivory Coast", area: 8.32, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "LOW", sbtnLoss: "HIGH", highRiskDatasets: ["GFW Forest Loss", "SBTN Natural Lands Loss"],
    geometry: { type: "Polygon", coordinates: [[[-5.647945, 7.639989], [-5.640945, 7.639989], [-5.640945, 7.646989], [-5.647945, 7.646989], [-5.647945, 7.639989]]] }
  },
  { 
    plotId: "PLOT_013", country: "Ghana", area: 4.17, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "LOW", sbtnLoss: "HIGH", highRiskDatasets: ["GFW Forest Loss", "SBTN Natural Lands Loss"],
    geometry: { type: "Polygon", coordinates: [[[-1.194512, 7.846527], [-1.188512, 7.846527], [-1.188512, 7.852527], [-1.194512, 7.852527], [-1.194512, 7.846527]]] }
  },
  { 
    plotId: "PLOT_003", country: "Brazil", area: 197.59, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "HIGH", sbtnLoss: "HIGH", highRiskDatasets: ["GFW Forest Loss", "JRC Forest Loss", "SBTN Natural Lands Loss"],
    geometry: { type: "Polygon", coordinates: [[[-60.125902, -3.219028], [-60.105902, -3.219028], [-60.105902, -3.199028], [-60.125902, -3.199028], [-60.125902, -3.219028]]] }
  },
  { 
    plotId: "PLOT_018", country: "Ivory Coast", area: 1.99, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: ["GFW Forest Loss"],
    geometry: { type: "Polygon", coordinates: [[[-5.447945, 7.439989], [-5.445445, 7.439989], [-5.445445, 7.442489], [-5.447945, 7.442489], [-5.447945, 7.439989]]] }
  },
  { 
    plotId: "PLOT_011", country: "China", area: 7.61, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[116.383331, 39.916668], [116.389331, 39.916668], [116.389331, 39.922668], [116.383331, 39.922668], [116.383331, 39.916668]]] }
  },
  { 
    plotId: "PLOT_015", country: "Brazil", area: 873.31, overallRisk: "HIGH", complianceStatus: "NON-COMPLIANT", 
    gfwLoss: "HIGH", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: ["GFW Forest Loss"],
    geometry: { type: "Polygon", coordinates: [[[-60.325902, -3.419028], [-60.275902, -3.419028], [-60.275902, -3.369028], [-60.325902, -3.369028], [-60.325902, -3.419028]]] }
  },
  { 
    plotId: "PLOT_017", country: "Nigeria", area: 4.26, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[8.775277, 9.181999], [8.781277, 9.181999], [8.781277, 9.187999], [8.775277, 9.187999], [8.775277, 9.181999]]] }
  },
  { 
    plotId: "PLOT_016", country: "Indonesia", area: 5.67, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[115.521327, -2.447871], [115.527327, -2.447871], [115.527327, -2.441871], [115.521327, -2.441871], [115.521327, -2.447871]]] }
  },
  { 
    plotId: "PLOT_012", country: "China", area: 6.23, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[116.483331, 39.816668], [116.489331, 39.816668], [116.489331, 39.822668], [116.483331, 39.822668], [116.483331, 39.816668]]] }
  },
  { 
    plotId: "PLOT_014", country: "Nigeria", area: 1.01, overallRisk: "LOW", complianceStatus: "COMPLIANT", 
    gfwLoss: "LOW", jrcLoss: "LOW", sbtnLoss: "LOW", highRiskDatasets: [],
    geometry: { type: "Polygon", coordinates: [[[8.875277, 9.281999], [8.877277, 9.281999], [8.877277, 9.283999], [8.875277, 9.283999], [8.875277, 9.281999]]] }
  }
] as const;

export default function DeforestationMonitoring() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>({
    name: "example_geojson_20_plots.json",
    size: 8245,
    type: "application/json",
    content: ""
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(100);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AnalysisResult[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [, setLocation] = useLocation();
  const [hasRealData, setHasRealData] = useState(false);
  
  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof AnalysisResult | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  
  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Revalidation state
  const [isValidating, setIsValidating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize from persisted data or empty state
  useEffect(() => {
    // Try to restore persisted data from localStorage and database
    const loadPersistedData = async () => {
      try {
        // Check if table needs refresh after editing
        const shouldRefresh = localStorage.getItem('refreshTableAfterEdit') === 'true';
        if (shouldRefresh) {
          localStorage.removeItem('refreshTableAfterEdit');
          console.log('🔄 Refreshing table data after polygon editing');
        }

        // Check if we have persisted analysis results
        const storedResults = localStorage.getItem('currentAnalysisResults');
        const hasRealData = localStorage.getItem('hasRealAnalysisData') === 'true';
        
        if (hasRealData && storedResults) {
          const parsedResults = JSON.parse(storedResults);
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            // Restore persisted data to UI
            setAnalysisResults(parsedResults);
            setFilteredResults(parsedResults);
            setTotalRecords(parsedResults.length);
            setHasRealData(true);
            console.log(`Restored ${parsedResults.length} analysis results from storage`);
            
            // If refresh flag was set, trigger a toast to show data was updated
            if (shouldRefresh) {
              toast({
                title: "Table Updated",
                description: "Polygon changes have been applied to the table results.",
                duration: 3000,
              });
            }
            
            return; // Exit early, don't clear data
          }
        }
        
        // Only clear if no persisted data exists
        localStorage.setItem('currentAnalysisResults', JSON.stringify([]));
        localStorage.setItem('hasRealAnalysisData', 'false');
        
        // Clear database results only if no persisted data
        await apiRequest('DELETE', '/api/analysis-results');
        
        // Initialize with empty state
        setAnalysisResults([]);
        setFilteredResults([]);
        setTotalRecords(0);
        setHasRealData(false);
        
        console.log("Table Result initialized as empty - dashboard will start with zero values");
      } catch (error) {
        console.error("Error loading persisted data:", error);
        // Fallback to empty state
        setAnalysisResults([]);
        setFilteredResults([]);
        setTotalRecords(0);
        setHasRealData(false);
      }
    };
    
    loadPersistedData();
  }, [toast]);

  // GeoJSON upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ geojsonFile, fileName }: { geojsonFile: string, fileName: string }) => {
      const response = await apiRequest('POST', '/api/geojson/upload', { geojsonFile, fileName });
      return await response.json();
    },
    onSuccess: (response) => {
      const processedFeatures = response.data?.features?.length || 0;
      const originalFeatures = response.file_info?.features_count || 0;
      
      if (response.warning) {
        toast({
          title: "Analysis Completed with Warning",
          description: response.warning.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis Complete", 
          description: `GeoJSON analysis completed successfully. Processing ${processedFeatures} plots.`
        });
      }
      
      // Transform real API response to our expected format (preserve geometry data)
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
          // Calculate actual loss area (percentage * total area, use 0.01 minimum for HIGH status)
          gfwLossArea: (Number(feature.properties.gfw_loss?.gfw_loss_area || 0) || (feature.properties.gfw_loss?.gfw_loss_stat?.toUpperCase() === 'HIGH' ? 0.01 : 0)) * (feature.properties.total_area_hectares || 0),
          jrcLossArea: (Number(feature.properties.jrc_loss?.jrc_loss_area || 0) || (feature.properties.jrc_loss?.jrc_loss_stat?.toUpperCase() === 'HIGH' ? 0.01 : 0)) * (feature.properties.total_area_hectares || 0),
          sbtnLossArea: (Number(feature.properties.sbtn_loss?.sbtn_loss_area || 0) || (feature.properties.sbtn_loss?.sbtn_loss_stat?.toUpperCase() === 'HIGH' ? 0.01 : 0)) * (feature.properties.total_area_hectares || 0),
          highRiskDatasets: feature.properties.overall_compliance?.high_risk_datasets || [],
          // Preserve the actual geometry data from GeoJSON
          geometry: feature.geometry
        }));
        
        setAnalysisResults(transformedResults);
        setFilteredResults(transformedResults);
        setTotalRecords(transformedResults.length);
        setHasRealData(true);
        
        // Store real analysis results in localStorage for dashboard reactivity
        localStorage.setItem('currentAnalysisResults', JSON.stringify(transformedResults));
        localStorage.setItem('hasRealAnalysisData', 'true');
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

    // Validate file type - accept more flexible formats
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
        
        // Basic validation for content
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
    
    reader.onerror = () => {
      toast({
        title: "File read error",
        description: "Failed to read the uploaded file. Please try again.",
        variant: "destructive"
      });
    };
    
    reader.readAsText(file);
  };

  const clearUpload = async () => {
    setUploadedFile(null);
    setAnalysisResults([]);
    setFilteredResults([]);
    setTotalRecords(0);
    setAnalysisProgress(0);
    setHasRealData(false);
    setCurrentPage(1);
    setSearchTerm('');
    setRiskFilter('all');
    setComplianceFilter('all');
    setCountryFilter('all');
    
    // Clear both localStorage and database when user explicitly clears
    localStorage.setItem('currentAnalysisResults', JSON.stringify([]));
    localStorage.setItem('hasRealAnalysisData', 'false');
    
    try {
      await apiRequest('DELETE', '/api/analysis-results');
      toast({
        title: "Data Cleared",
        description: "All analysis results and dashboard metrics have been cleared"
      });
    } catch (error) {
      console.error('Error clearing database results:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadExample = () => {
    // Create a sample GeoJSON structure
    const exampleGeoJSON = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            plot_id: "PLOT_005",
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
        },
        {
          type: "Feature",
          properties: {
            plot_id: "PLOT_002",
            name: "Sample Plot Ghana",
            country: "Ghana"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-1.094512, 7.946527],
              [-1.072272, 7.946527],
              [-1.072272, 7.925164],
              [-1.094512, 7.925164],
              [-1.094512, 7.946527]
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
    link.download = 'example_geojson_20_plots.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Real API analysis function using Global Climate Solution API
  const analyzeFile = async () => {
    if (!uploadedFile || !uploadedFile.content) return;

    setIsAnalyzing(true);
    setAnalysisProgress(10);

    // Simulate progress during API call
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 800);

    // Call the real API through our backend
    uploadMutation.mutate({
      geojsonFile: uploadedFile.content as string,
      fileName: uploadedFile.name
    });
  };

  // Filter and sort functionality
  useEffect(() => {
    let filtered = [...analysisResults];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(result =>
        result.plotId.toLowerCase().includes(search) ||
        result.country.toLowerCase().includes(search) ||
        result.area.toString().includes(search)
      );
    }
    
    // Apply risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(result => result.overallRisk === riskFilter.toUpperCase());
    }
    
    // Apply compliance filter
    if (complianceFilter !== 'all') {
      filtered = filtered.filter(result => result.complianceStatus === complianceFilter.toUpperCase());
    }
    
    // Apply country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(result => result.country === countryFilter);
    }
    
    // Apply sorting
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
    setCurrentPage(1); // Reset to first page when filtering
  }, [analysisResults, searchTerm, riskFilter, complianceFilter, countryFilter, sortColumn, sortDirection]);

  // Handle sorting
  const handleSort = (column: keyof AnalysisResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get unique values for filters
  const uniqueCountries = [...new Set(analysisResults.map(r => r.country))];
  const uniqueRisks = [...new Set(analysisResults.map(r => r.overallRisk))];
  const uniqueCompliance = [...new Set(analysisResults.map(r => r.complianceStatus))];

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageData = filteredResults.slice(startIndex, endIndex);

  // New polygon validation function using PostGIS overlap detection
  const validatePolygonWithPostGIS = (result: AnalysisResult, allResults: AnalysisResult[], overlappingPlots: Set<string>) => {
    const issues: string[] = [];
    
    console.log(`Validating polygon ${result.plotId} with PostGIS results`);
    
    if (!result.geometry?.coordinates?.[0]) {
      console.log(`No valid geometry for ${result.plotId}`);
      return ['Invalid Geometry'];
    }
    
    const coordinates = result.geometry.coordinates[0];
    
    // 1. Check for duplicate vertices
    const uniqueCoords = new Set(coordinates.map(coord => `${coord[0]},${coord[1]}`));
    if (uniqueCoords.size < coordinates.length - 1) { // -1 because first and last should be same
      issues.push('Duplicate Vertices');
    }
    
    // 2. Check right hand rule (should be counter-clockwise)
    if (!isCounterClockwise(coordinates)) {
      issues.push('Wrong Orientation');
    }
    
    // 3. Check for overlaps using PostGIS results
    if (overlappingPlots.has(result.plotId)) {
      issues.push('Overlap Detected');
      console.log(`PostGIS detected overlap for ${result.plotId}`);
    }
    
    // 4. Check for duplicate polygons (keep existing JavaScript logic for this)
    const isDuplicate = allResults.some(other => {
      if (other.plotId === result.plotId || !other.geometry?.coordinates?.[0]) return false;
      return JSON.stringify(coordinates) === JSON.stringify(other.geometry.coordinates[0]);
    });
    if (isDuplicate) {
      issues.push('Duplicate Polygon');
    }
    
    return issues;
  };

  // Original polygon validation function (keeping for backup)
  const validatePolygon = (result: AnalysisResult, allResults: AnalysisResult[]) => {
    const issues: string[] = [];
    
    console.log(`Validating polygon ${result.plotId}:`, result.geometry);
    
    if (!result.geometry?.coordinates?.[0]) {
      console.log(`No valid geometry for ${result.plotId}`);
      return ['Invalid Geometry'];
    }
    
    const coordinates = result.geometry.coordinates[0];
    console.log(`Coordinates for ${result.plotId}:`, coordinates);
    
    // 1. Check for duplicate vertices
    const uniqueCoords = new Set(coordinates.map(coord => `${coord[0]},${coord[1]}`));
    if (uniqueCoords.size < coordinates.length - 1) { // -1 because first and last should be same
      issues.push('Duplicate Vertices');
    }
    
    // 2. Check right hand rule (should be counter-clockwise)
    if (!isCounterClockwise(coordinates)) {
      issues.push('Wrong Orientation');
    }
    
    // 3. Check for overlaps with other polygons
    console.log(`Checking overlaps for ${result.plotId} against ${allResults.length - 1} other polygons`);
    const hasOverlap = allResults.some(other => {
      if (other.plotId === result.plotId || !other.geometry?.coordinates?.[0]) return false;
      console.log(`Comparing ${result.plotId} with ${other.plotId}`);
      const overlaps = polygonsOverlap(coordinates, other.geometry.coordinates[0]);
      if (overlaps) {
        console.log(`OVERLAP DETECTED: ${result.plotId} overlaps with ${other.plotId}`);
      }
      return overlaps;
    });
    if (hasOverlap) {
      issues.push('Overlap Detected');
      console.log(`Adding overlap issue for ${result.plotId}`);
    }
    
    // 4. Check for duplicate polygons
    const isDuplicate = allResults.some(other => {
      if (other.plotId === result.plotId || !other.geometry?.coordinates?.[0]) return false;
      return JSON.stringify(coordinates) === JSON.stringify(other.geometry.coordinates[0]);
    });
    if (isDuplicate) {
      issues.push('Duplicate Polygon');
    }
    
    return issues;
  };
  
  const isCounterClockwise = (coords: number[][]) => {
    let sum = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      sum += (coords[i + 1][0] - coords[i][0]) * (coords[i + 1][1] + coords[i][1]);
    }
    return sum < 0;
  };
  
  const polygonsOverlap = (coords1: number[][], coords2: number[][]) => {
    // Debug logging
    console.log('Checking overlap between:', coords1.length, 'vs', coords2.length, 'points');
    
    // More comprehensive overlap detection with bounding box check first
    const bbox1 = getBoundingBox(coords1);
    const bbox2 = getBoundingBox(coords2);
    
    // Quick bounding box check - if bounding boxes don't overlap, polygons can't overlap
    if (!boundingBoxesOverlap(bbox1, bbox2)) {
      return false;
    }
    
    console.log('Bounding boxes overlap, checking detailed overlap...');
    
    // 1. Check if any vertex of polygon1 is inside polygon2
    for (let i = 0; i < coords1.length; i++) {
      if (pointInPolygon(coords1[i], coords2)) {
        console.log('Found vertex of poly1 inside poly2');
        return true;
      }
    }
    
    // 2. Check if any vertex of polygon2 is inside polygon1
    for (let i = 0; i < coords2.length; i++) {
      if (pointInPolygon(coords2[i], coords1)) {
        console.log('Found vertex of poly2 inside poly1');
        return true;
      }
    }
    
    // 3. Check if any edges intersect
    for (let i = 0; i < coords1.length - 1; i++) {
      for (let j = 0; j < coords2.length - 1; j++) {
        if (lineSegmentsIntersect(
          coords1[i], coords1[i + 1],
          coords2[j], coords2[j + 1]
        )) {
          console.log('Found edge intersection');
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Helper function to get bounding box
  const getBoundingBox = (coords: number[][]) => {
    let minX = coords[0][0], maxX = coords[0][0];
    let minY = coords[0][1], maxY = coords[0][1];
    
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    
    return { minX, maxX, minY, maxY };
  };
  
  // Helper function to check if bounding boxes overlap
  const boundingBoxesOverlap = (box1: any, box2: any) => {
    return !(box1.maxX < box2.minX || box2.maxX < box1.minX || 
             box1.maxY < box2.minY || box2.maxY < box1.minY);
  };
  
  // Helper function to check if two line segments intersect
  const lineSegmentsIntersect = (p1: number[], q1: number[], p2: number[], q2: number[]) => {
    const orientation = (p: number[], q: number[], r: number[]) => {
      const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
      if (val === 0) return 0; // collinear
      return val > 0 ? 1 : 2; // clockwise or counterclockwise
    };
    
    const onSegment = (p: number[], q: number[], r: number[]) => {
      return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
             q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
    };
    
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);
    
    // General case
    if (o1 !== o2 && o3 !== o4) return true;
    
    // Special cases for collinear points
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;
    
    return false;
  };
  
  const pointInPolygon = (point: number[], polygon: number[][]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) &&
          (point[0] < (polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
        inside = !inside;
      }
    }
    return inside;
  };
  
  const runPolygonValidation = async () => {
    if (selectedRows.size === 0) {
      toast({
        title: "No Polygons Selected",
        description: "Please select at least one polygon to validate.",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Get selected polygons for validation
      const selectedPolygons = analysisResults.filter(result => selectedRows.has(result.plotId));
      
      // Prepare polygon data for PostGIS overlap detection
      const polygonData = selectedPolygons
        .filter(result => result.geometry?.coordinates)
        .map(result => ({
          plotId: result.plotId,
          coordinates: result.geometry.coordinates
        }));

      console.log('Sending polygons to PostGIS for overlap detection:', polygonData.length);

      // Call PostGIS overlap detection API
      const response = await apiRequest('POST', '/api/polygon-overlap-detection', { polygons: polygonData });
      const overlapResponse = await response.json();

      console.log('PostGIS overlap detection results:', overlapResponse);

      // Create a set of plot IDs that have overlaps
      const overlappingPlots = new Set();
      if (overlapResponse.overlaps) {
        overlapResponse.overlaps.forEach(overlap => {
          overlappingPlots.add(overlap.polygon1);
          overlappingPlots.add(overlap.polygon2);
        });
      }
      
      const updatedResults = analysisResults.map(result => {
        if (selectedRows.has(result.plotId)) {
          const issues = validatePolygonWithPostGIS(result, analysisResults, overlappingPlots);
          return {
            ...result,
            polygonIssues: issues.length > 0 ? issues.join(', ') : 'No Issues Found'
          };
        }
        return result;
      });
      
      setAnalysisResults(updatedResults);
      setFilteredResults(updatedResults);
      
      // Update localStorage
      localStorage.setItem('currentAnalysisResults', JSON.stringify(updatedResults));
      
      toast({
        title: "Validation Complete",
        description: `Validated ${selectedRows.size} polygon(s) successfully. Found ${overlapResponse.overlapsDetected || 0} overlaps.`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate polygons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Update select all state when filtered data changes
  useEffect(() => {
    if (filteredResults.length === 0) {
      setSelectAll(false);
    } else {
      const allSelected = filteredResults.every(row => selectedRows.has(row.plotId));
      setSelectAll(allSelected && selectedRows.size > 0);
    }
  }, [filteredResults, selectedRows]);

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

  const getLossDisplay = (riskLevel: string, lossArea?: number) => {
    // Always show the area value when it's HIGH, regardless of the area amount
    if (riskLevel === 'HIGH') {
      const areaValue = lossArea !== undefined ? Number(lossArea) : 0;
      return (
        <span className="text-sm font-medium text-red-600">
          {areaValue.toFixed(2)} ha
        </span>
      );
    } else if (riskLevel === 'LOW') {
      return <Badge className="bg-green-100 text-green-800">LOW</Badge>;
    } else if (riskLevel === 'MEDIUM') {
      return <Badge className="bg-yellow-100 text-yellow-800">MEDIUM</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">UNKNOWN</Badge>;
    }
  };



  const downloadExcel = () => {
    try {
      // Prepare data without geometry information
      const excelData = filteredResults.map(result => ({
        'Plot ID': result.plotId,
        'Country': result.country,
        'Area (ha)': result.area,
        'Overall Risk': result.overallRisk,
        'Compliance Status': result.complianceStatus,
        'GFW Forest Loss': result.gfwLoss,
        'GFW Loss Area (ha)': result.gfwLossArea || 0,
        'JRC Forest Loss': result.jrcLoss,
        'JRC Loss Area (ha)': result.jrcLossArea || 0,
        'SBTN Natural Loss': result.sbtnLoss,
        'SBTN Loss Area (ha)': result.sbtnLossArea || 0,
        'Polygon Issues': result.polygonIssues || 'No Analysis Run Yet'
      }));

      // Convert to CSV format for Excel compatibility
      const headers = Object.keys(excelData[0]);
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `eudr-analysis-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Excel Export Complete",
        description: `Downloaded ${filteredResults.length} records as CSV file.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({
        title: "Export Error",
        description: "Failed to export data as Excel file.",
        variant: "destructive",
      });
    }
  };

  const downloadGeoJSON = () => {
    try {
      // Prepare GeoJSON data with geometry information
      const features = filteredResults.map(result => ({
        type: 'Feature',
        properties: {
          plotId: result.plotId,
          country: result.country,
          area: result.area,
          overallRisk: result.overallRisk,
          complianceStatus: result.complianceStatus,
          gfwLoss: result.gfwLoss,
          gfwLossArea: result.gfwLossArea,
          jrcLoss: result.jrcLoss,
          jrcLossArea: result.jrcLossArea,
          sbtnLoss: result.sbtnLoss,
          sbtnLossArea: result.sbtnLossArea,
          polygonIssues: result.polygonIssues || 'No Analysis Run Yet',
          highRiskDatasets: result.highRiskDatasets
        },
        geometry: result.geometry || null
      }));

      const geoJsonData = {
        type: 'FeatureCollection',
        features: features
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { 
        type: 'application/json;charset=utf-8;' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `eudr-analysis-results-${new Date().toISOString().split('T')[0]}.geojson`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "GeoJSON Export Complete",
        description: `Downloaded ${filteredResults.length} records with geometry data.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading GeoJSON:', error);
      toast({
        title: "Export Error",
        description: "Failed to export data as GeoJSON file.",
        variant: "destructive",
      });
    }
  };

  const downloadEUDRRequirement = () => {
    try {
      // Create a link to download the attached PDF
      const link = document.createElement('a');
      link.href = '/attached_assets/EUDR - EUDR GEOJSON FILE DESCRIPTION 1.5_1756830662581.pdf';
      link.download = 'EUDR-GeoJSON-File-Description-v1.5.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "EUDR GeoJSON file description is being downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading EUDR requirement:', error);
      toast({
        title: "Download Error",
        description: "Failed to download EUDR requirement PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Deforestation Risk Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload GeoJSON/KML files to analyze deforestation risk and compliance status using GFW Loss, JRC, SBTN, and WDPA datasets
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
                  data-testid="file-upload-area"
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
                  data-testid="file-input"
                />
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={downloadExample}
                    className="flex items-center gap-2"
                    data-testid="download-example"
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
                      data-testid="analyze-file"
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
                      data-testid="clear-upload"
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

                {analysisResults.length > 0 && !isAnalyzing && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analysis Complete</span>
                      <span className="text-green-600 font-medium">✓ Done</span>
                    </div>
                    <Progress value={100} className="w-full" />
                    <p className="text-sm text-green-600">
                      Successfully analyzed {analysisResults.length} plots against satellite datasets
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
                  data-testid="view-map"
                >
                  <Map className="h-4 w-4 mr-2" />
                  View in EUDR Map
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      data-testid="download-dropdown"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => downloadExcel()} data-testid="download-excel-option">
                      <File className="h-4 w-4 mr-2" />
                      Excel CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadGeoJSON()} data-testid="download-geojson-option">
                      <Map className="h-4 w-4 mr-2" />
                      GeoJSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadEUDRRequirement()} data-testid="download-eudr-requirement">
                      <FileText className="h-4 w-4 mr-2" />
                      EUDR Requirement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      data-testid="action-dropdown"
                    >
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      Action
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      if (selectedRows.size === 0) {
                        toast({
                          title: "No Polygons Selected",
                          description: "Please select at least one polygon to edit.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Filter selected polygons from analysis results
                      const selectedPolygons = filteredResults.filter(result => 
                        selectedRows.has(result.plotId)
                      );
                      
                      // Store selected polygons in localStorage
                      localStorage.setItem('selectedPolygonsForEdit', JSON.stringify(selectedPolygons));
                      
                      // Navigate to edit polygon page
                      setLocation('/edit-polygon');
                    }} data-testid="action-edit-polygon">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Polygon
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={runPolygonValidation}
                      disabled={selectedRows.size === 0 || isValidating}
                      data-testid="action-revalidation"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                      {isValidating ? 'Validating...' : 'Revalidation'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (selectedRows.size === 0) {
                        toast({
                          title: "No Polygon Selected",
                          description: "Please select one polygon to verify.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      if (selectedRows.size > 1) {
                        toast({
                          title: "Multiple Polygons Selected",
                          description: "Please select only one polygon for verification.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Get the single selected polygon
                      const selectedPolygon = filteredResults.find(result => 
                        selectedRows.has(result.plotId)
                      );
                      
                      if (selectedPolygon) {
                        // Store selected polygon for verification
                        localStorage.setItem('selectedPolygonForVerification', JSON.stringify(selectedPolygon));
                        
                        // Navigate to verification page
                        setLocation('/data-verification');
                      }
                    }} data-testid="action-verification">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Verification
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
                    data-testid="search-input"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-40" data-testid="country-filter">
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
                    <SelectTrigger className="w-32" data-testid="risk-filter">
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
                    <SelectTrigger className="w-40" data-testid="compliance-filter">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <Checkbox 
                          checked={selectAll}
                          onCheckedChange={(checked) => {
                            setSelectAll(!!checked);
                            if (checked) {
                              // Select all rows across all pages
                              const allPlotIds = filteredResults.map(row => row.plotId);
                              setSelectedRows(new Set(allPlotIds));
                            } else {
                              // Deselect all
                              setSelectedRows(new Set());
                            }
                          }}
                          data-testid="select-all-checkbox"
                        />
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('plotId')}
                        data-testid="sort-plotid"
                      >
                        <div className="flex items-center gap-2">
                          Plot ID
                          {getSortIcon('plotId')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('country')}
                        data-testid="sort-country"
                      >
                        <div className="flex items-center gap-2">
                          Country
                          {getSortIcon('country')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('area')}
                        data-testid="sort-area"
                      >
                        <div className="flex items-center gap-2">
                          Area (HA)
                          {getSortIcon('area')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('overallRisk')}
                        data-testid="sort-risk"
                      >
                        <div className="flex items-center gap-2">
                          Overall Risk
                          {getSortIcon('overallRisk')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('complianceStatus')}
                        data-testid="sort-compliance"
                      >
                        <div className="flex items-center gap-2">
                          Compliance Status
                          {getSortIcon('complianceStatus')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('gfwLoss')}
                        data-testid="sort-gfw"
                      >
                        <div className="flex items-center gap-2">
                          GFW Loss
                          {getSortIcon('gfwLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('jrcLoss')}
                        data-testid="sort-jrc"
                      >
                        <div className="flex items-center gap-2">
                          JRC Loss
                          {getSortIcon('jrcLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('sbtnLoss')}
                        data-testid="sort-sbtn"
                      >
                        <div className="flex items-center gap-2">
                          SBTN Loss
                          {getSortIcon('sbtnLoss')}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Peatland
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Spatial Legality
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Polygon Issues
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentPageData.map((result, index) => {
                      const spatialLegalityValues = ['High Risk', 'Medium Risk', 'Low Risk'];
                      const randomSpatialLegality = spatialLegalityValues[index % 3];
                      const getSpatialLegalityBadge = (legality: string) => {
                        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
                        switch (legality) {
                          case 'High Risk':
                            return <Badge className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`} variant="destructive">{legality}</Badge>;
                          case 'Medium Risk':
                            return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`} variant="secondary">{legality}</Badge>;
                          case 'Low Risk':
                            return <Badge className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`} variant="default">{legality}</Badge>;
                          default:
                            return <Badge variant="outline">{legality}</Badge>;
                        }
                      };
                      
                      return (
                        <tr key={result.plotId} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`table-row-${result.plotId}`}>
                          <td className="px-4 py-4 text-sm">
                            <Checkbox 
                              checked={selectedRows.has(result.plotId)}
                              onCheckedChange={(checked) => {
                                const newSelectedRows = new Set(selectedRows);
                                if (checked) {
                                  newSelectedRows.add(result.plotId);
                                } else {
                                  newSelectedRows.delete(result.plotId);
                                }
                                setSelectedRows(newSelectedRows);
                                
                                // Update select all state
                                const allSelected = filteredResults.every(row => newSelectedRows.has(row.plotId));
                                setSelectAll(allSelected && newSelectedRows.size > 0);
                              }}
                              data-testid={`checkbox-${result.plotId}`}
                            />
                          </td>
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
                            {getLossDisplay(result.gfwLoss, result.gfwLossArea)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {getLossDisplay(result.jrcLoss, result.jrcLossArea)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {getLossDisplay(result.sbtnLoss, result.sbtnLossArea)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {result.peatlandOverlap === 'No overlap' ? (
                              <span className="text-sm font-medium text-green-600">No overlap</span>
                            ) : (
                              <span className="text-sm font-medium text-red-600">
                                {result.peatlandArea?.toFixed(2) || '0.00'} ha
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {getSpatialLegalityBadge(randomSpatialLegality)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`font-medium ${
                              result.polygonIssues === 'No Issues Found' 
                                ? 'text-green-600 dark:text-green-400'
                                : result.polygonIssues === 'No Analysis Run Yet'
                                ? 'text-gray-600 dark:text-gray-300'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {result.polygonIssues || 'No Analysis Run Yet'}
                            </span>
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
                        data-testid="prev-page"
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
                              data-testid={`page-${pageNum}`}
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
                        data-testid="next-page"
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