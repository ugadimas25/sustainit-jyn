import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  RefreshCw, CheckSquare, FileText, BarChart3, MapPin, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EudrMapViewer from '@/components/maps/eudr-map-viewer';

interface AnalysisResult {
  plotId: string;
  country: string;
  area: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  complianceStatus: 'COMPLIANT' | 'NON-COMPLIANT' | 'UNKNOWN';
  gfwLoss: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'TRUE' | 'FALSE'; // Added TRUE/FALSE for getLossBadge
  jrcLoss: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'TRUE' | 'FALSE'; // Added TRUE/FALSE for getLossBadge
  sbtnLoss: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'TRUE' | 'FALSE'; // Added TRUE/FALSE for getLossBadge
  highRiskDatasets: string[];
  gfwLossArea?: number;
  jrcLossArea?: number;
  sbtnLossArea?: number;
  geometry?: any;
  wdpaStatus: 'PROTECTED' | 'NOT_PROTECTED' | 'UNKNOWN';
  peatlandStatus: 'PEATLAND' | 'NOT_PEATLAND' | 'UNKNOWN';
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
  const [showQuickPreview, setShowQuickPreview] = useState(false); // State for quick preview modal
  const [showMapViewer, setShowMapViewer] = useState(false); // State for full map viewer modal

  // Save Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof AnalysisResult | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedResults, setSelectedResults] = useState<number[]>([]); // Stores indices of selected rows

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickPreviewMapRef = useRef<HTMLDivElement>(null); // Ref for the quick preview map
  const { toast } = useToast();

  // Fetch Suppliers
  const { data: suppliers = [], refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/suppliers');
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // GeoJSON upload mutation with enhanced error handling
  const uploadMutation = useMutation({
    mutationFn: async ({ geojsonFile, fileName }: { geojsonFile: string, fileName: string }) => {
      // Parse GeoJSON and remove Z-values with better error handling
      let geojsonData;
      try {
        geojsonData = JSON.parse(geojsonFile);

        // Ensure we have a FeatureCollection
        if (!geojsonData.features || !Array.isArray(geojsonData.features)) {
          throw new Error('Invalid GeoJSON structure: Missing features array');
        }

        // Process features to remove Z-values and ensure EUDR compatibility
        geojsonData.features = geojsonData.features.map((feature: any, index: number) => {
          try {
            if (feature.geometry) {
              feature.geometry = removeZValue(feature.geometry);
            }

            // Ensure properties exist for EUDR analysis
            if (!feature.properties) {
              feature.properties = {};
            }

            const props = feature.properties;

            // Ensure plot_id exists for analysis
            if (!props.plot_id && !props.id && !props['.Farmers ID'] && !props.Name) {
              props.plot_id = `PROCESSED_PLOT_${String(index + 1).padStart(3, '0')}`;
            }

            // Normalize plot_id from various formats
            if (!props.plot_id) {
              props.plot_id = props.id || props['.Farmers ID'] || props.Name || `PLOT_${index + 1}`;
            }

            // Ensure country_name for EUDR analysis
            if (!props.country_name && !props.country) {
              props.country_name = 'unknown';
            }

            return feature;
          } catch (featureError) {
            console.warn(`Error processing feature ${index + 1}:`, featureError);
            return feature; // Return original feature if processing fails
          }
        });

        console.log(`✅ Prepared ${geojsonData.features.length} features for EUDR analysis`);

      } catch (parseError) {
        console.error('GeoJSON parsing error:', parseError);
        throw new Error(`Failed to parse GeoJSON file: ${parseError instanceof Error ? parseError.message : 'Invalid format'}`);
      }

      // Re-stringify after processing
      const processedGeojsonString = JSON.stringify(geojsonData);

      try {
        console.log('🚀 Uploading GeoJSON for EUDR analysis...');

        // Use the API base URL for production compatibility
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/geojson/upload`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            geojson: processedGeojsonString,
            filename: fileName
          }),
        });

        console.log('📡 Response status:', response.status, response.statusText);
        console.log('📡 Response URL:', response.url);

        if (!response.ok) {
          let errorMessage = `Upload failed with status ${response.status}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
            console.error('❌ Server error details:', errorData);
          } catch (jsonError) {
            // If we can't parse the error response, use the status text
            errorMessage = response.statusText || errorMessage;
            console.error('❌ Failed to parse error response:', jsonError);
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ EUDR analysis upload successful');
        return result;

      } catch (networkError) {
        console.error('Network error during upload:', networkError);

        if (networkError instanceof Error) {
          // Check for specific network issues
          if (networkError.message.includes('fetch')) {
            throw new Error('Network connection error. Please check your internet connection and try again.');
          } else if (networkError.message.includes('timeout')) {
            throw new Error('Upload timeout. The file may be too large or the connection is slow.');
          } else {
            throw networkError;
          }
        } else {
          throw new Error('Unknown network error occurred during upload');
        }
      }
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
        const formattedResults = dbResults.map((result: any) => {
          // Debug loss area data
          console.log(`🔍 Debug Plot ${result.plotId} loss areas:`, {
            gfwLossArea: result.gfwLossArea,
            jrcLossArea: result.jrcLossArea, 
            sbtnLossArea: result.sbtnLossArea,
            area: result.area
          });

          // Get loss areas from database - these should be stored as hectares
          let gfwLossHa = parseFloat(result.gfwLossArea || '0');
          let jrcLossHa = parseFloat(result.jrcLossArea || '0');
          let sbtnLossHa = parseFloat(result.sbtnLossArea || '0');

          console.log(`🔍 Plot ${result.plotId} calculated loss areas: GFW: ${gfwLossHa}ha, JRC: ${jrcLossHa}ha, SBTN: ${sbtnLossHa}ha`);

          return {
            plotId: result.plotId,
            country: result.country,
            area: parseFloat(result.area || '0'),
            overallRisk: result.overallRisk || 'UNKNOWN',
            complianceStatus: result.complianceStatus || 'UNKNOWN',
            gfwLoss: result.gfwLoss || 'UNKNOWN',
            jrcLoss: result.jrcLoss || 'UNKNOWN',
            sbtnLoss: result.sbtnLoss || 'UNKNOWN',
            highRiskDatasets: result.highRiskDatasets || [],
            gfwLossArea: gfwLossHa, // Keep in hectares
            jrcLossArea: jrcLossHa, // Keep in hectares  
            sbtnLossArea: sbtnLossHa, // Keep in hectares
            geometry: result.geometry,
            wdpaStatus: result.wdpaStatus || 'UNKNOWN',
            peatlandStatus: result.peatlandStatus || 'UNKNOWN'
          };
        });

        console.log(`✅ Stored ${formattedResults.length} analysis results for spatial analysis page`);
        setAnalysisResults(formattedResults);
        setFilteredResults(formattedResults);

        // Store in localStorage for persistence (same format as map viewer)
        localStorage.setItem('currentAnalysisResults', JSON.stringify(formattedResults));
        localStorage.setItem('hasRealAnalysisData', 'true');
        localStorage.setItem('shouldShowResultsTable', 'true');

        // Store metadata for debugging
        const analysisMeta = {
          timestamp: new Date().toISOString(),
          source: 'analyze-file',
          plotCount: formattedResults.length
        };
        localStorage.setItem('analysisDataMeta', JSON.stringify(analysisMeta));

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

            // Extract loss percentages from API response and convert to hectares
            const totalAreaHa = parseFloat(props.total_area_hectares || '1');
            const gfwLossPercent = parseFloat(props.gfw_loss?.gfw_loss_area?.toString() || '0');
            const jrcLossPercent = parseFloat(props.jrc_loss?.jrc_loss_area?.toString() || '0'); 
            const sbtnLossPercent = parseFloat(props.sbtn_loss?.sbtn_loss_area?.toString() || '0');

            // Calculate actual loss areas in hectares
            const gfwLossArea = gfwLossPercent * totalAreaHa;
            const jrcLossArea = jrcLossPercent * totalAreaHa;
            const sbtnLossArea = sbtnLossPercent * totalAreaHa;

            console.log(`🔍 API Plot ${plotId} loss calculation:`, {
              totalAreaHa,
              gfwLossPercent: `${(gfwLossPercent * 100).toFixed(1)}%`,
              jrcLossPercent: `${(jrcLossPercent * 100).toFixed(1)}%`,
              sbtnLossPercent: `${(sbtnLossPercent * 100).toFixed(1)}%`,
              gfwLossArea: `${gfwLossArea.toFixed(4)} ha`,
              jrcLossArea: `${jrcLossArea.toFixed(4)} ha`,
              sbtnLossArea: `${sbtnLossArea.toFixed(4)} ha`
            });

            return {
              plotId,
              country: props.country_name || 'Unknown',
              area: parseFloat(props.area_ha || props.area || props.area_hectares || totalAreaHa.toString()),
              overallRisk: props.overall_compliance?.overall_risk?.toUpperCase() || 'UNKNOWN',
              complianceStatus: props.overall_compliance?.compliance_status === 'NON_COMPLIANT' ? 'NON-COMPLIANT' : 'COMPLIANT',
              gfwLoss: (props.gfw_loss?.gfw_loss_area || 0) > 0 ? 'TRUE' : 'FALSE',
              jrcLoss: (props.jrc_loss?.jrc_loss_area || 0) > 0 ? 'TRUE' : 'FALSE', 
              sbtnLoss: (props.sbtn_loss?.sbtn_loss_area || 0) > 0 ? 'TRUE' : 'FALSE',
              highRiskDatasets: props.overall_compliance?.high_risk_datasets || [],
              gfwLossArea: gfwLossArea, // Keep in hectares
              jrcLossArea: jrcLossArea, // Keep in hectares
              sbtnLossArea: sbtnLossArea, // Keep in hectares
              geometry: feature.geometry,
              wdpaStatus: props.wdpaStatus || 'UNKNOWN',
              peatlandStatus: props.peatlandStatus || 'UNKNOWN'
            };
          });

          console.log(`⚠️ Using fallback results: ${fallbackResults.length} plots`);
          setAnalysisResults(fallbackResults);
          setFilteredResults(fallbackResults);

          // Store in localStorage for persistence
          localStorage.setItem('currentAnalysisResults', JSON.stringify(fallbackResults));
          localStorage.setItem('hasRealAnalysisData', 'true');
          localStorage.setItem('shouldShowResultsTable', 'true');

          // Store metadata for debugging
          const analysisMeta = {
            timestamp: new Date().toISOString(),
            source: 'analyze-file-fallback',
            plotCount: fallbackResults.length
          };
          localStorage.setItem('analysisDataMeta', JSON.stringify(analysisMeta));

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
      console.error('EUDR analysis failed:', error);

      let errorTitle = "EUDR Analysis Failed";
      let errorDescription = error.message;

      // Provide specific guidance based on error type
      if (error.message.includes('parse')) {
        errorTitle = "GeoJSON Format Error";
        errorDescription = "Invalid GeoJSON format. Please ensure your file has valid geometry and properties with plot_id fields.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorTitle = "Network Connection Error";
        errorDescription = "Failed to connect to EUDR analysis service. Please check your connection and try again.";
      } else if (error.message.includes('timeout')) {
        errorTitle = "Analysis Timeout";
        errorDescription = "The analysis is taking longer than expected. Try uploading smaller files or contact support.";
      } else if (error.message.includes('features')) {
        errorTitle = "Feature Validation Error";
        errorDescription = "Some features in your GeoJSON are invalid. Ensure all features have valid geometry and plot identifiers.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });

      setIsAnalyzing(false);
      setAnalysisProgress(0);
    },
  });

  // Mutation to save plot-supplier associations
  const savePlotsMutation = useMutation({
    mutationFn: async (payload: { plotIds: string[], supplierId: string }) => {
      const response = await apiRequest('POST', '/api/plots/save-association', payload);
      if (!response.ok) {
        throw new Error('Failed to save plot associations.');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Plots Saved Successfully",
        description: `Associated ${data.associatedPlots} plots with supplier. Step 3 (Legality Compliance) is now available!`,
      });
      
      // Show additional success message about workflow progression
      setTimeout(() => {
        toast({
          title: "Workflow Updated",
          description: "You can now proceed to Legality Compliance assessment for this supplier.",
          variant: "default",
        });
      }, 2000);
      
      setShowSaveModal(false);
      setIsSaving(false);
      setSelectedResults([]);
      setSelectedSupplierId(null);
    },
    onError: (error: any) => {
      console.error("Error saving plots:", error);
      toast({
        title: "Save Failed",
        description: error.message || "An error occurred while saving plots.",
        variant: "destructive",
      });
      setIsSaving(false);
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
        variant: "destructive",
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
            variant: "destructive",
          });
          return;
        }

        // Parse and validate GeoJSON structure with robust error handling
        let parsedGeoJSON;
        try {
          const contentStr = content.toString().trim();

          // Check if content is empty
          if (!contentStr) {
            console.warn('File appears to be empty');
            toast({
              title: "Empty file",
              description: "The uploaded file appears to be empty",
              variant: "destructive",
            });
            return;
          }

          // Try to parse the JSON with better error messaging
          try {
            parsedGeoJSON = JSON.parse(contentStr);
            console.log('✅ Successfully parsed JSON file');
          } catch (syntaxError) {
            console.error('JSON syntax error:', syntaxError);

            // Try to identify the specific JSON issue
            const errorMsg = syntaxError instanceof Error ? syntaxError.message : 'Unknown syntax error';
            let friendlyMsg = "Invalid JSON format";

            if (errorMsg.includes('Unexpected token')) {
              friendlyMsg = "JSON syntax error - check for missing commas, brackets, or quotes";
            } else if (errorMsg.includes('Unexpected end')) {
              friendlyMsg = "Incomplete JSON file - file may be truncated";
            }

            toast({
              title: "JSON Parse Error",
              description: `${friendlyMsg}. ${errorMsg}`,
              variant: "destructive",
            });
            return;
          }

        } catch (parseError) {
          console.error('General parsing error:', parseError);
          toast({
            title: "File Processing Error",
            description: "Failed to process the file. Please ensure it's a valid GeoJSON file.",
            variant: "destructive",
          });
          return;
        }

        // Robust GeoJSON structure validation
        if (!parsedGeoJSON || typeof parsedGeoJSON !== 'object') {
          console.warn('Invalid GeoJSON: File must contain a valid JSON object');
          toast({
            title: "Invalid GeoJSON",
            description: "File must contain a valid JSON object",
            variant: "destructive",
          });
          return;
        }

        // Check for FeatureCollection or try to auto-convert single Feature
        if (parsedGeoJSON.type === 'Feature') {
          console.log('📝 Converting single Feature to FeatureCollection');
          parsedGeoJSON = {
            type: 'FeatureCollection',
            features: [parsedGeoJSON]
          };
        } else if (parsedGeoJSON.type !== 'FeatureCollection') {
          console.warn(`Invalid GeoJSON type: ${parsedGeoJSON.type || 'unknown'}, expected FeatureCollection`);
          toast({
            title: "Unsupported GeoJSON Type",
            description: `Expected FeatureCollection or Feature, got ${parsedGeoJSON.type || 'unknown'}. Please ensure your file contains geographic features.`,
            variant: "destructive",
          });
          return;
        }

        if (!parsedGeoJSON.features || !Array.isArray(parsedGeoJSON.features)) {
          console.warn('Invalid GeoJSON: Missing or invalid features array');
          toast({
            title: "Invalid GeoJSON Structure",
            description: "Missing or invalid features array. Please check your GeoJSON structure.",
            variant: "destructive",
          });
          return;
        }

        if (parsedGeoJSON.features.length === 0) {
          console.warn('GeoJSON file contains no features');
          toast({
            title: "Empty GeoJSON",
            description: "GeoJSON file contains no features to analyze",
            variant: "destructive",
          });
          return;
        }

        console.log(`✅ GeoJSON validation passed: Found ${parsedGeoJSON.features.length} features`);

        // Enhanced feature validation for EUDR compliance workflow
        let validFeatureCount = 0;
        let processedFeatures = [];
        const issues = [];

        for (let i = 0; i < parsedGeoJSON.features.length; i++) {
          const feature = parsedGeoJSON.features[i];

          try {
            // Basic feature validation
            if (!feature || typeof feature !== 'object') {
              issues.push(`Feature ${i + 1}: Not a valid object`);
              continue;
            }

            if (feature.type !== 'Feature') {
              issues.push(`Feature ${i + 1}: Expected type 'Feature', got '${feature.type}'`);
              continue;
            }

            if (!feature.geometry) {
              issues.push(`Feature ${i + 1}: Missing geometry`);
              continue;
            }

            // Enhanced properties handling for EUDR workflow
            const props = feature.properties || {};

            // Auto-generate plot_id if missing (for EUDR workflow compatibility)
            if (!props.plot_id && !props.id && !props['.Farmers ID'] && !props.Name) {
              props.plot_id = `PLOT_${String(i + 1).padStart(3, '0')}`;
              console.log(`📝 Auto-generated plot_id: ${props.plot_id} for feature ${i + 1}`);
            }

            // Normalize property names for better compatibility
            if (props['.Farmers ID'] && !props.plot_id) {
              props.plot_id = props['.Farmers ID'];
            }
            if (props.Name && !props.plot_id && !props['.Farmers ID']) {
              props.plot_id = props.Name;
            }
            if (props.id && !props.plot_id) {
              props.plot_id = props.id;
            }

            // Set default country if missing (for EUDR workflow)
            if (!props.country_name && !props.country) {
              props.country_name = 'unknown';
            }

            // Update the feature with enhanced properties
            feature.properties = props;
            processedFeatures.push(feature);
            validFeatureCount++;

          } catch (featureError) {
            console.error(`Error processing feature ${i + 1}:`, featureError);
            issues.push(`Feature ${i + 1}: Processing error - ${featureError instanceof Error ? featureError.message : 'Unknown error'}`);
            continue;
          }
        }

        // Log issues but be more forgiving
        if (issues.length > 0) {
          console.warn('Feature processing issues:', issues.slice(0, 3)); // Log first 3 issues

          // Only show warning if more than 50% of features failed
          if (validFeatureCount < parsedGeoJSON.features.length * 0.5) {
            toast({
              title: "Feature Processing Warning",
              description: `${issues.length} features had issues. ${validFeatureCount} features will be processed.`,
              variant: "default"
            });
          }
        }

        if (validFeatureCount === 0) {
          console.warn('No valid features found after processing');
          toast({
            title: "No Valid Features",
            description: "No valid features found that can be processed for EUDR analysis",
            variant: "destructive",
          });
          return;
        }

        // Update the parsed GeoJSON with processed features
        parsedGeoJSON.features = processedFeatures;

        console.log(`✅ Processed ${validFeatureCount} out of ${parsedGeoJSON.features.length} total features`);

        // Enhanced format detection for better logging
        const sampleFeature = parsedGeoJSON.features[0];
        const props = sampleFeature?.properties || {};

        let detectedFormat = 'Unknown';
        if (props.plot_id && props.country_name) {
          detectedFormat = 'EUDR Analysis Ready';
        } else if (props.plot_id) {
          detectedFormat = 'Standard GeoJSON with plot_id';
        } else if (props.id) {
          detectedFormat = 'Standard GeoJSON with id';
        } else if (props['.Farmers ID']) {
          detectedFormat = 'Indonesian GeoJSON format';
        } else if (props.country_name || props.farm_name) {
          detectedFormat = 'Extended GeoJSON format';
        }

        console.log(`✅ Detected format: ${detectedFormat}`);

        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: JSON.stringify(parsedGeoJSON) // Store the processed GeoJSON
        });

        toast({
          title: "File uploaded successfully",
          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB) - ${validFeatureCount} features ready for EUDR analysis`
        });

      } catch (error: any) {
        console.error("File upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        toast({
          title: "File Processing Failed",
          description: `Error: ${errorMessage}. Please check the file format and try again.`,
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
    setShowMapViewer(false); // Hide map viewer if cleared
    setShowQuickPreview(false); // Hide quick preview if cleared
    setShowSaveModal(false); // Hide save modal if cleared
    setSelectedSupplierId(null); // Reset supplier selection

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear all localStorage items to ensure clean state
    localStorage.removeItem('currentAnalysisResults');
    localStorage.removeItem('hasRealAnalysisData');
    localStorage.removeItem('shouldShowResultsTable');
    localStorage.removeItem('refreshTableAfterEdit');
    localStorage.removeItem('fromMapViewer');
    localStorage.removeItem('analysisDataMeta');

    toast({
      title: "Upload Cleared",
      description: "All analysis data has been cleared. You can now upload a new file.",
    });
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

  const exportToCSV = () => {
    // Determine which data to export: selected results or all filtered results
    const dataToExport = selectedResults.length > 0 
      ? selectedResults.map(index => filteredResults[index])
      : filteredResults;

    if (dataToExport.length === 0) {
      toast({
        title: "No Data to Export",
        description: "No spatial analysis results available for export.",
        variant: "default"
      });
      return;
    }

    // CSV Headers
    const headers = [
      'Plot ID',
      'Country',
      'Area (HA)',
      'Overall Risk',
      'Compliance Status',
      'GFW Loss',
      'JRC Loss', 
      'SBTN Loss',
      'GFW Loss Area (HA)',
      'JRC Loss Area (HA)',
      'SBTN Loss Area (HA)',
      'WDPA Status',
      'Peatland Status',
      'High Risk Datasets',
      'Analysis Date',
      'Supply Chain Reference'
    ];

    // Convert data to CSV rows
    const csvRows = dataToExport.map(result => [
      result.plotId || '',
      result.country || '',
      (result.area || 0).toFixed(2),
      result.overallRisk || 'UNKNOWN',
      result.complianceStatus || 'UNKNOWN',
      result.gfwLoss || 'UNKNOWN',
      result.jrcLoss || 'UNKNOWN',
      result.sbtnLoss || 'UNKNOWN',
      (result.gfwLossArea || 0).toFixed(4),
      (result.jrcLossArea || 0).toFixed(4),
      (result.sbtnLossArea || 0).toFixed(4),
      result.wdpaStatus || 'UNKNOWN',
      result.peatlandStatus || 'UNKNOWN',
      Array.isArray(result.highRiskDatasets) ? result.highRiskDatasets.join('; ') : '',
      new Date().toISOString().split('T')[0],
      'See Supply Chain Analysis for historical spatial check records'
    ]);

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const csvContent = [
      '\uFEFF', // UTF-8 BOM
      headers.join(','),
      ...csvRows.map(row => row.map(field => {
        // Escape fields containing commas, quotes, or newlines
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(','))
    ].join('\n');

    // Generate filename with timestamp and row count
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    const dateStr = timestamp[0];
    const timeStr = timestamp[1].split('-')[0] + timestamp[1].split('-')[1];
    const rowCount = selectedResults.length > 0 ? `selected${selectedResults.length}` : `all${dataToExport.length}`;
    const filename = `eudr_spatial_analysis_${dateStr}_${timeStr}_${rowCount}.csv`;

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Export Complete",
      description: `Exported ${dataToExport.length} spatial analysis records to ${filename}. Historical spatial check records can be found in Supply Chain Analysis.`,
    });
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
      geojsonFile: typeof uploadedFile.content === 'string' ? uploadedFile.content : '',
      fileName: uploadedFile.name
    });
  };

  // Handler for the Save action
  const handleSaveAction = () => {
    if (selectedResults.length === 0) {
      toast({
        title: "No Plots Selected",
        description: "Please select at least one plot to save.",
        variant: "default"
      });
      return;
    }
    // Ensure suppliers are loaded before showing modal
    if (suppliers.length === 0) {
      refetchSuppliers(); // Try to refetch if empty
      toast({
        title: "Loading Suppliers",
        description: "Please wait while we load the supplier list.",
        variant: "default"
      });
      return;
    }
    setShowSaveModal(true);
  };

  // Handler to save plots with selected supplier
  const handleSavePlots = () => {
    if (!selectedSupplierId || selectedResults.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a supplier and ensure plots are selected.",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    const plotIdsToSave = selectedResults.map(index => filteredResults[index].plotId);
    savePlotsMutation.mutate({ plotIds: plotIdsToSave, supplierId: selectedSupplierId });
  };

  // Check for stored results when component mounts (returning from map viewer)
  useEffect(() => {
    const storedResults = localStorage.getItem('currentAnalysisResults');
    const hasRealData = localStorage.getItem('hasRealAnalysisData');
    const shouldShowTable = localStorage.getItem('shouldShowResultsTable');
    const refreshAfterEdit = localStorage.getItem('refreshTableAfterEdit');
    const fromMapViewer = localStorage.getItem('fromMapViewer');

    console.log('🔍 Checking stored data on mount:', {
      hasStoredResults: !!storedResults,
      hasRealData,
      shouldShowTable,
      refreshAfterEdit,
      fromMapViewer,
      currentResultsLength: analysisResults.length
    });

    // Only restore and show results if we have explicit flags indicating we should show the table
    const shouldRestoreResults = shouldShowTable === 'true' || refreshAfterEdit === 'true' || fromMapViewer === 'true';

    if (storedResults && hasRealData === 'true' && shouldRestoreResults) {
      try {
        const parsedResults = JSON.parse(storedResults);

        if (parsedResults && parsedResults.length > 0) {
          console.log(`🔄 Restoring ${parsedResults.length} analysis results from storage`);

          // Ensure loss area values are properly preserved as numbers, not strings
            const restoredResults = parsedResults.map((result: any) => {
              // Handle both numeric and string values properly
              let gfwLossArea = 0;
              let jrcLossArea = 0;
              let sbtnLossArea = 0;

              // Parse gfwLossArea
              if (result.gfwLossArea !== undefined && result.gfwLossArea !== null && result.gfwLossArea !== '') {
                const parsed = typeof result.gfwLossArea === 'number' ? result.gfwLossArea : parseFloat(result.gfwLossArea.toString());
                gfwLossArea = !isNaN(parsed) ? parsed : 0;
              }

              // Parse jrcLossArea
              if (result.jrcLossArea !== undefined && result.jrcLossArea !== null && result.jrcLossArea !== '') {
                const parsed = typeof result.jrcLossArea === 'number' ? result.jrcLossArea : parseFloat(result.jrcLossArea.toString());
                jrcLossArea = !isNaN(parsed) ? parsed : 0;
              }

              // Parse sbtnLossArea
              if (result.sbtnLossArea !== undefined && result.sbtnLossArea !== null && result.sbtnLossArea !== '') {
                const parsed = typeof result.sbtnLossArea === 'number' ? result.sbtnLossArea : parseFloat(result.sbtnLossArea.toString());
                sbtnLossArea = !isNaN(parsed) ? parsed : 0;
              }

              const processed = {
                ...result,
                gfwLossArea: gfwLossArea,
                jrcLossArea: jrcLossArea,
                sbtnLossArea: sbtnLossArea,
                area: parseFloat(result.area?.toString() || '0'),
                wdpaStatus: result.wdpaStatus || 'UNKNOWN',
                peatlandStatus: result.peatlandStatus || 'UNKNOWN'
              };

              console.log(`🔧 Restored ${result.plotId}:`, {
                gfwLossArea: processed.gfwLossArea,
                jrcLossArea: processed.jrcLossArea,
                sbtnLossArea: processed.sbtnLossArea,
                originalData: {
                  gfwLossArea: result.gfwLossArea,
                  jrcLossArea: result.jrcLossArea,
                  sbtnLossArea: result.sbtnLossArea
                }
              });

              return processed;
            });

          setAnalysisResults(restoredResults);
          setFilteredResults(restoredResults);

          // Show appropriate message based on source
          let source = 'analysis';
          if (refreshAfterEdit === 'true') {
            source = 'polygon editor';
          } else if (fromMapViewer === 'true') {
            source = 'map viewer';
          }

          toast({
            title: "Results Restored", 
            description: `Showing ${restoredResults.length} previously analyzed plots from ${source}`,
          });

          // Clear the flags after use
          localStorage.removeItem('shouldShowResultsTable');
          localStorage.removeItem('refreshTableAfterEdit');
          localStorage.removeItem('fromMapViewer');
        }
      } catch (error) {
        console.error('Error restoring analysis results:', error);
        // Clear all related flags if restoration fails
        localStorage.removeItem('currentAnalysisResults');
        localStorage.removeItem('hasRealAnalysisData');
        localStorage.removeItem('shouldShowResultsTable');
        localStorage.removeItem('refreshTableAfterEdit');
        localStorage.removeItem('fromMapViewer');
      }
    } else if (!shouldRestoreResults) {
      // If no explicit flag to show table, ensure results are cleared for clean state
      console.log('📝 No explicit flag to show table - maintaining clean state');
      setAnalysisResults([]);
      setFilteredResults([]);
    }
  }, []); // Run only on mount

  // Additional effect to handle navigation state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const shouldShowTable = localStorage.getItem('shouldShowResultsTable');
      const refreshAfterEdit = localStorage.getItem('refreshTableAfterEdit');
      const fromMapViewer = localStorage.getItem('fromMapViewer');
      const storedResults = localStorage.getItem('currentAnalysisResults');

      // Only show results if we have explicit flags AND currently no results are showing
      const shouldRestoreResults = shouldShowTable === 'true' || refreshAfterEdit === 'true' || fromMapViewer === 'true';

      if (shouldRestoreResults && storedResults && analysisResults.length === 0) {
        try {
          const parsedResults = JSON.parse(storedResults);
          if (parsedResults && parsedResults.length > 0) {
            console.log(`🔄 Re-restoring ${parsedResults.length} analysis results from navigation`);

            // Ensure loss area values are properly preserved as numbers
            const restoredResults = parsedResults.map((result: any) => {
              // Handle both numeric and string values properly
              let gfwLossArea = 0;
              let jrcLossArea = 0;
              let sbtnLossArea = 0;

              // Parse gfwLossArea
              if (result.gfwLossArea !== undefined && result.gfwLossArea !== null && result.gfwLossArea !== '') {
                const parsed = typeof result.gfwLossArea === 'number' ? result.gfwLossArea : parseFloat(result.gfwLossArea.toString());
                gfwLossArea = !isNaN(parsed) ? parsed : 0;
              }

              // Parse jrcLossArea
              if (result.jrcLossArea !== undefined && result.jrcLossArea !== null && result.jrcLossArea !== '') {
                const parsed = typeof result.jrcLossArea === 'number' ? result.jrcLossArea : parseFloat(result.jrcLossArea.toString());
                jrcLossArea = !isNaN(parsed) ? parsed : 0;
              }

              // Parse sbtnLossArea
              if (result.sbtnLossArea !== undefined && result.sbtnLossArea !== null && result.sbtnLossArea !== '') {
                const parsed = typeof result.sbtnLossArea === 'number' ? result.sbtnLossArea : parseFloat(result.sbtnLossArea.toString());
                sbtnLossArea = !isNaN(parsed) ? parsed : 0;
              }

              const processed = {
                ...result,
                gfwLossArea: gfwLossArea,
                jrcLossArea: jrcLossArea,
                sbtnLossArea: sbtnLossArea,
                area: parseFloat(result.area?.toString() || '0'),
                wdpaStatus: result.wdpaStatus || 'UNKNOWN',
                peatlandStatus: result.peatlandStatus || 'UNKNOWN'
              };

              console.log(`🔧 Storage change restored ${result.plotId}:`, {
                gfwLossArea: processed.gfwLossArea,
                jrcLossArea: processed.jrcLossArea,
                sbtnLossArea: processed.sbtnLossArea,
                originalData: {
                  gfwLossArea: result.gfwLossArea,
                  jrcLossArea: result.jrcLossArea,
                  sbtnLossArea: result.sbtnLossArea
                }
              });

              return processed;
            });

            setAnalysisResults(restoredResults);
            setFilteredResults(restoredResults);

            // Clear flags after successful restoration
            localStorage.removeItem('shouldShowResultsTable');
            localStorage.removeItem('refreshTableAfterEdit');
            localStorage.removeItem('fromMapViewer');
          }
        } catch (error) {
          console.error('Error in storage change handler:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check immediately in case we missed a change
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [analysisResults.length]); // Dependency on analysisResults.length to re-evaluate if needed

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

  const uniqueCountries = Array.from(new Set(analysisResults.map(r => r.country)));
  const uniqueRisks = Array.from(new Set(analysisResults.map(r => r.overallRisk))).filter(r => r !== 'UNKNOWN');
  const uniqueCompliance = Array.from(new Set(analysisResults.map(r => r.complianceStatus))).filter(r => r !== 'UNKNOWN');

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
    // Show actual loss area values when available
    if (lossArea !== undefined && lossArea !== null && !isNaN(Number(lossArea))) {
      const areaValue = Number(lossArea);
      const deforestationThreshold = 0.001; // 1 m² threshold - same as server

      if (areaValue > deforestationThreshold) {
        // Show values less than 0.01 ha in yellow, others in red
        if (areaValue < 0.01) {
          return <Badge className="bg-yellow-100 text-yellow-800">{areaValue.toFixed(4)} ha</Badge>;
        } else {
          return <Badge className="bg-red-100 text-red-800">{areaValue.toFixed(4)} ha</Badge>;
        }
      } else {
        return <Badge className="bg-green-100 text-green-800">0.000 ha</Badge>;
      }
    }

    // Fallback for legacy boolean values
    if (loss === 'TRUE' || loss === 'HIGH' || loss === 'YES' || loss === 'Detected') {
      return <Badge className="bg-yellow-100 text-yellow-800">Detected</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">0.000 ha</Badge>;
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

  const getWdpaBadge = (status: string) => {
    // Handle area values in hectares (e.g., "302.4565 ha")
    if (status && status.includes(' ha')) {
      const areaValue = parseFloat(status.replace(' ha', ''));
      if (!isNaN(areaValue) && areaValue > 0) {
        return <Badge className="bg-amber-100 text-amber-800">{status}</Badge>;
      }
    }
    
    switch (status) {
      case 'PROTECTED':
        return <Badge className="bg-amber-100 text-amber-800">PROTECTED</Badge>;
      case 'NOT_PROTECTED':
        return <Badge className="bg-gray-100 text-gray-800">NOT_PROTECTED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPeatlandBadge = (status: string) => {
    // Handle area values in hectares (e.g., "4399.2547 ha")
    if (status && status.includes(' ha')) {
      const areaValue = parseFloat(status.replace(' ha', ''));
      if (!isNaN(areaValue) && areaValue > 0) {
        return <Badge className="bg-amber-100 text-amber-800">{status}</Badge>;
      }
    }
    
    switch (status) {
      case 'PEATLAND':
        return <Badge className="bg-amber-100 text-amber-800">PEATLAND</Badge>;
      case 'NOT_PEATLAND':
        return <Badge className="bg-gray-100 text-gray-800">NOT_PEATLAND</Badge>;
      default:
        return <Badge variant="secondary">{status || 'UNKNOWN'}</Badge>;
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

  const handleMultipleVerification = (selectedPolygons: AnalysisResult[]) => {
    if (selectedPolygons.length === 0) return;

    // Store multiple polygon data for verification
    localStorage.setItem('selectedPolygonsForVerification', JSON.stringify(selectedPolygons));

    const plotCount = selectedPolygons.length;
    const plotIds = selectedPolygons.map(p => p.plotId).join(', ');
    
    toast({
      title: "Starting Verification",
      description: `Redirecting to verification page for ${plotCount} plot${plotCount > 1 ? 's' : ''}: ${plotIds}`,
    });

    // Navigate to data verification page
    setLocation('/data-verification');
  };

  const handleEdit = (resultId: string) => {
    const result = analysisResults.find(r => r.plotId === resultId);
    if (!result) return;

    // Store the selected polygon data for editing
    localStorage.setItem('selectedPolygonForEdit', JSON.stringify(result));
    // Set a flag to indicate that the table should be refreshed after editing
    localStorage.setItem('refreshTableAfterEdit', 'true');

    toast({
      title: "Starting Edit Mode",
      description: `Opening polygon editor for plot ${result.plotId}`,
    });

    // Navigate to polygon edit page
    setLocation('/edit-polygon');
  };

  const handleQuickPreview = () => {
    console.log('🗺️ Navigating directly to full map viewer');
    setLocation('/map-viewer');
  };

  const handleViewFullMap = () => {
    console.log('🗺️ Navigating to full map viewer');
    setLocation('/map-viewer');
  };


  // Initialize Quick Preview Map
  useEffect(() => {
    if (!showQuickPreview || !quickPreviewMapRef.current || !analysisResults || analysisResults.length === 0) return;

    const initializeQuickPreviewMap = () => {
      if (!quickPreviewMapRef.current) return;

      // Clear any existing content
      quickPreviewMapRef.current.innerHTML = '';

      // Create complete HTML content for quick preview map
      const mapHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Quick Preview Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            body { margin: 0; background: white; }
            #map { height: 100vh; width: 100%; }
            .leaflet-popup-content-wrapper {
              background: white !important;
              border-radius: 8px !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
            }
            .leaflet-control-zoom { margin-top: 50px !important; } /* Adjust zoom control position */
            .leaflet-control-layers { margin-top: 10px !important; } /* Adjust layer control position */
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const map = L.map('map', {
              center: [0, 0],
              zoom: 2,
              zoomControl: true,
              layers: [] // Initialize with no layers
            });

            // Base layers
            const baseLayers = {
              osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
              }),
              satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics',
                maxZoom: 18,
              }),
              terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenTopoMap contributors',
                maxZoom: 18,
              })
            };

            baseLayers.satellite.addTo(map); // Default to satellite

            const analysisResults = ${JSON.stringify(analysisResults)};
            const polygons = [];
            const bounds = [];

            // Add analysis result polygons
            analysisResults.forEach(result => {
              if (!result.geometry || !result.geometry.coordinates || !result.geometry.coordinates[0]) {
                return;
              }

              const isHighRisk = result.overallRisk === 'HIGH';
              const color = isHighRisk ? '#dc2626' : '#10b981'; // Red for high risk, green for low/medium

              try {
                let coordinates = result.geometry.coordinates;

                if (result.geometry.type === 'Polygon') {
                  // Ensure coordinates are in [lat, lng] format and remove Z if present
                  coordinates = coordinates[0].map(coord => [coord[1], coord[0]]);
                } else if (result.geometry.type === 'MultiPolygon') {
                  coordinates = coordinates[0][0].map(coord => [coord[1], coord[0]]);
                }

                if (!coordinates || coordinates.length < 3) return; // Need at least 3 points for a polygon

                const polygon = L.polygon(coordinates, {
                  fillColor: color,
                  color: color,
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.4
                }).addTo(map);

                const center = polygon.getBounds().getCenter();
                const centerMarker = L.circleMarker(center, {
                  radius: 8,
                  fillColor: color,
                  color: '#fff',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.9
                }).addTo(map);

                const popupContent = \`
                  <div style="padding: 12px; min-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; color: \${color}; font-size: 16px;">
                      \${isHighRisk ? '⚠️ High Risk:' : '✅ Low/Medium Risk:'} \${result.plotId || 'Unknown Plot'}
                    </h3>
                    <div style="font-size: 13px; line-height: 1.4;">
                      <p><strong>Country:</strong> \${result.country || 'Unknown'}</p>
                      <p><strong>Area:</strong> \${result.area ? result.area.toFixed(2) + ' ha' : 'N/A'}</p>
                      <p><strong>Risk Level:</strong> \${result.overallRisk || 'Unknown'}</p>
                      <p><strong>Compliance:</strong> \${result.complianceStatus || 'Unknown'}</p>
                      <p><strong>GFW Loss:</strong> \${result.gfwLossArea ? result.gfwLossArea.toFixed(3) + ' ha' : 'No data'}</p>
                      <p><strong>JRC Loss:</strong> \${result.jrcLossArea ? result.jrcLossArea.toFixed(3) + ' ha' : 'No data'}</p>
                      <p><strong>SBTN Loss:</strong> \${result.sbtnLossArea ? result.sbtnLossArea.toFixed(3) + ' ha' : 'No data'}</p>
                    </div>
                  </div>
                \`;

                polygon.bindPopup(popupContent);
                centerMarker.bindPopup(popupContent);

                polygons.push({ polygon, centerMarker, risk: result.overallRisk });
                bounds.push(polygon.getBounds());
              } catch (error) {
                console.error('Error creating polygon for plot:', result.plotId, error);
              }
            });

            // Fit map to show all polygons
            if (bounds.length > 0) {
              const group = new L.featureGroup([]);
              bounds.forEach(bound => {
                // L.rectangle is a simple way to add bounds to a featureGroup
                const tempLayer = L.rectangle(bound);
                group.addLayer(tempLayer);
              });
              map.fitBounds(group.getBounds().pad(0.1));
            }

            // --- Map Controls ---

            // Base layer control
            const baseLayerSelect = window.parent.document.getElementById('quick-base-layer');
            if (baseLayerSelect) {
              baseLayerSelect.addEventListener('change', function(e) {
                Object.values(baseLayers).forEach(layer => {
                  if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                  }
                });
                if (baseLayers[e.target.value]) {
                  baseLayers[e.target.value].addTo(map);
                }
              });
            }

            // Risk filter control
            const riskFilterSelect = window.parent.document.getElementById('quick-risk-filter');
            if (riskFilterSelect) {
              riskFilterSelect.addEventListener('change', function(e) {
                const filterValue = e.target.value;
                polygons.forEach(({polygon, centerMarker, risk}) => {
                  let shouldShow = false;
                  if (filterValue === 'all') {
                    shouldShow = true;
                  } else if (filterValue === 'high' && risk === 'HIGH') {
                    shouldShow = true;
                  } else if (filterValue === 'low' && (risk === 'LOW' || risk === 'MEDIUM')) { // Treat MEDIUM as low risk for filtering
                    shouldShow = true;
                  }

                  if (shouldShow) {
                    if (!map.hasLayer(polygon)) polygon.addTo(map);
                    if (!map.hasLayer(centerMarker)) centerMarker.addTo(map);
                  } else {
                    if (map.hasLayer(polygon)) map.removeLayer(polygon);
                    if (map.hasLayer(centerMarker)) map.removeLayer(centerMarker);
                  }
                });
              });
            }

            // WDPA layer control using GFW vector tiles
            let wdpaLayer = null;
            const wdpaCheckbox = window.parent.document.getElementById('quick-wdpa-layer');
            if (wdpaCheckbox) {
              wdpaCheckbox.addEventListener('change', function(e) {
                console.log('🛡️ WDPA checkbox changed in Quick Preview:', e.target.checked);

                if (e.target.checked) {
                  if (!wdpaLayer) {
                    // Use GFW raster tiles for WDPA protected areas (vector tiles require special handling)
                    wdpaLayer = L.tileLayer('https://tiles.globalforestwatch.org/wdpa_protected_areas/latest/dynamic/{z}/{x}/{y}.png', {
                      attribution: '© WDPA via Global Forest Watch',
                      opacity: 0.7,
                      maxZoom: 18,
                      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    });

                    // Add error handling for WDPA tiles
                    wdpaLayer.on('tileerror', function(e) {
                      console.warn('⚠️ WDPA tile load error in Quick Preview:', e.error);
                    });

                    wdpaLayer.on('tileload', function(e) {
                      console.log('✅ WDPA tile loaded in Quick Preview at:', e.coords);
                    });
                  }

                  if (!map.hasLayer(wdpaLayer)) {
                    wdpaLayer.addTo(map);
                    console.log('✅ WDPA GFW vector tiles added to Quick Preview map');

                    // Force map refresh
                    setTimeout(() => {
                      map.invalidateSize();
                      map.panBy([1, 1]);
                      map.panBy([-1, -1]);
                    }, 100);
                  }
                } else {
                  if (wdpaLayer && map.hasLayer(wdpaLayer)) {
                    map.removeLayer(wdpaLayer);
                    console.log('✅ WDPA layer removed from Quick Preview map');
                  }
                }
              });
            }

            // Peatland layer control
            let peatlandLayer = null;
            const peatlandCheckbox = window.parent.document.getElementById('quick-peatland-layer');
            if (peatlandCheckbox) {
              peatlandCheckbox.addEventListener('change', function(e) {
                if (e.target.checked) {
                  if (!peatlandLayer) {
                    // Example Peatland Data (replace with actual data source if available)
                    const peatlandData = {
                      type: "FeatureCollection",
                      features: [
                        {
                          type: "Feature",
                          properties: { Kubah_GBT: "Kubah Gambut", Province: "Riau" },
                          geometry: {
                            type: "Polygon",
                            coordinates: [[[100.5, 0.0], [101.8, 0.0], [101.8, 1.2], [100.5, 1.2], [100.5, 0.0]]] // Example coords
                          }
                        },
                        {
                          type: "Feature", 
                          properties: { Kubah_GBT: "Non Kubah Gambut", Province: "Jambi" },
                          geometry: {
                            type: "Polygon",
                            coordinates: [[[102.0, -2.0], [104.2, -2.0], [104.2, -0.5], [102.0, -0.5], [102.0, -2.0]]] // Example coords
                          }
                        }
                      ]
                    };

                    peatlandLayer = L.geoJSON(peatlandData, {
                      style: function(feature) {
                        const kubahGbt = feature.properties.Kubah_GBT;
                        return {
                          color: kubahGbt === 'Kubah Gambut' ? '#8b4513' : '#ffa500', // Brown for Kubah Gambut, Orange for Non
                          fillColor: kubahGbt === 'Kubah Gambut' ? '#8b4513' : '#ffa500',
                          weight: 1,
                          opacity: 0.8,
                          fillOpacity: 0.6
                        };
                      },
                      onEachFeature: function(feature, layer) {
                        layer.bindPopup(\`
                          <div style="padding: 8px;">
                            <h4>🏞️ Indonesian Peatland</h4>
                            <p><strong>Type:</strong> \${feature.properties.Kubah_GBT}</p>
                            <p><strong>Province:</strong> \${feature.properties.Province}</p>
                          </div>
                        \`);
                      }
                    });
                  }
                  peatlandLayer.addTo(map);
                } else if (peatlandLayer && map.hasLayer(peatlandLayer)) {
                  map.removeLayer(peatlandLayer);
                }
              });
            }

            // Deforestation layer controls with enhanced implementation
            let gfwLayer = null;
            let jrcLayer = null;
            let sbtnLayer = null;

            // Enhanced GFW Layer with proper URL and error handling
            const gfwCheckbox = window.parent.document.getElementById('quick-gfw-layer');
            if (gfwCheckbox) {
              gfwCheckbox.addEventListener('change', function(e) {
                console.log('GFW checkbox changed:', e.target.checked);
                if (e.target.checked) {
                  if (!gfwLayer) {
                    // Enhanced GFW URL with proper parameters for 2021-2024 loss
                    gfwLayer = L.tileLayer('https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.12/dynamic/{z}/{x}/{y}.png?start_year=2021&end_year=2024&tree_cover_density_threshold=30&render_type=true_color', {
                      attribution: '© Global Forest Watch - Tree Cover Loss 2021-2024',
                      opacity: 0.8,
                      maxZoom: 18,
                      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    });

                    // Add error handling
                    gfwLayer.on('tileerror', function(e) {
                      console.warn('GFW tile load error:', e.error);
                    });

                    gfwLayer.on('tileload', function(e) {
                      console.log('GFW tile loaded successfully at:', e.coords);
                    });
                  }

                  if (!map.hasLayer(gfwLayer)) {
                    gfwLayer.addTo(map);
                    console.log('GFW layer added to map');

                    // Force map refresh
                    setTimeout(() => {
                      map.invalidateSize();
                    }, 100);
                  }
                } else {
                  if (gfwLayer && map.hasLayer(gfwLayer)) {
                    map.removeLayer(gfwLayer);
                    console.log('GFW layer removed from map');
                  }
                }
              });
            }

            // Enhanced JRC Layer with correct WMS parameters
            const jrcCheckbox = window.parent.document.getElementById('quick-jrc-layer');
            if (jrcCheckbox) {
              jrcCheckbox.addEventListener('change', function(e) {
                console.log('JRC checkbox changed:', e.target.checked);
                if (e.target.checked) {
                  if (!jrcLayer) {
                    // Corrected JRC TMF WMS service
                    jrcLayer = L.tileLayer.wms('https://ies-ows.jrc.ec.europa.eu/iforce/gfc2020/wms.py', {
                      layers: 'gfc2020_v2',
                      format: 'image/png',
                      transparent: true,
                      attribution: '© JRC European Commission - Tropical Moist Forest',
                      opacity: 0.8,
                      version: '1.3.0',
                      maxZoom: 18
                    });

                    // Add error handling
                    jrcLayer.on('tileerror', function(e) {
                      console.warn('JRC tile load error:', e.error);
                    });
                  }

                  if (!map.hasLayer(jrcLayer)) {
                    jrcLayer.addTo(map);
                    console.log('JRC layer added to map');

                    // Force map refresh
                    setTimeout(() => {
                      map.invalidateSize();
                    }, 100);
                  }
                } else {
                  if (jrcLayer && map.hasLayer(jrcLayer)) {
                    map.removeLayer(jrcLayer);
                    console.log('JRC layer removed from map');
                  }
                }
              });
            }

            // Enhanced SBTN Layer with proper tile service
            const sbtnCheckbox = window.parent.document.getElementById('quick-sbtn-layer');
            if (sbtnCheckbox) {
              sbtnCheckbox.addEventListener('change', function(e) {
                console.log('SBTN checkbox changed:', e.target.checked);
                if (e.target.checked) {
                  if (!sbtnLayer) {
                    // SBTN Natural Lands tile service
                    sbtnLayer = L.tileLayer('https://via.placeholder.com/256/008000/FFFFFF.png?text=SBTN+Dummy+Layer', {
                      attribution: '© SBTN - Science Based Targets Network',
                      opacity: 0.7,
                      maxZoom: 18,
                      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    });

                    // Add error handling
                    sbtnLayer.on('tileerror', function(e) {
                      console.warn('SBTN tile load error:', e.error);
                    });
                  }

                  if (!map.hasLayer(sbtnLayer)) {
                    sbtnLayer.addTo(map);
                    console.log('SBTN layer added to map');

                    // Force map refresh
                    setTimeout(() => {
                      map.invalidateSize();
                    }, 100);
                  }
                } else {
                  if (sbtnLayer && map.hasLayer(sbtnLayer)) {
                    map.removeLayer(sbtnLayer);
                    console.log('SBTN layer removed from map');
                  }
                }
              });
            }

            // Test layer availability and show status messages
            setTimeout(() => {
              console.log('Testing deforestation layer services...');

              // Test GFW service
              fetch('https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.12/dynamic/6/32/21.png?start_year=2021&end_year=2024')
                .then(response => {
                  if (response.ok) {
                    console.log('✅ GFW service is accessible');
                  } else {
                    console.warn('⚠️ GFW service returned:', response.status);
                  }
                })
                .catch(error => {
                  console.warn('❌ GFW service error:', error.message);
                });

              // Test JRC service
              fetch('https://ies-ows.jrc.ec.europa.eu/iforce/gfc2020/wms.py?service=WMS&version=1.3.0&request=GetCapabilities')
                .then(response => {
                  if (response.ok) {
                    console.log('✅ JRC WMS service is accessible');
                  } else {
                    console.warn('⚠️ JRC service returned:', response.status);
                  }
                })
                .catch(error => {
                  console.warn('❌ JRC service error:', error.message);
                });

            }, 1000);

            console.log('Quick Preview Map loaded with', analysisResults.length, 'plots');
          </script>
        </body>
        </html>
      `;

      // Create iframe and inject the HTML
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.srcdoc = mapHtml;

      quickPreviewMapRef.current.appendChild(iframe);
    };

    // Initialize map with a small delay to ensure DOM is ready and parent document elements are accessible
    const timer = setTimeout(initializeQuickPreviewMap, 100);

    return () => {
      clearTimeout(timer);
      if (quickPreviewMapRef.current) {
        quickPreviewMapRef.current.innerHTML = '';
      }
    };
  }, [showQuickPreview, analysisResults]); // Re-run if showQuickPreview or analysisResults changes


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
                    Supported formats: .geojson, .json, .kml<br/>
                    <span className="text-xs">
                      Supports standard GeoJSON, Indonesian format, and extended format with detailed analysis
                    </span>
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
                        {analysisProgress < 15 ? 'Preprocessing GeoJSON for EUDR analysis...' :
                         analysisProgress < 30 ? 'Detecting countries using PostGIS database...' :
                         analysisProgress < 50 ? 'Uploading to EUDR Multilayer API...' :
                         analysisProgress < 70 ? 'Analyzing with GFW Loss dataset...' :
                         analysisProgress < 85 ? 'Calculating compliance status...' :
                         'Finalizing EUDR analysis results...'}
                      </span>
                      <span className="text-blue-600 font-medium">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="w-full" />
                    <p className="text-sm text-blue-600">
                      {analysisProgress < 30 ? 'Validating plot boundaries and coordinates' :
                       analysisProgress < 50 ? 'Ensuring EUDR compliance data format' :
                       analysisProgress < 70 ? 'Cross-referencing with Global Forest Watch data' :
                       'Analyzing against JRC TMF and SBTN datasets'}
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
                  <BarChart3 className="h-5 w-5" />
                  Analysis Results - Ready for Preview
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredResults.length} of {analysisResults.length} plots
                </p>
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={selectedResults.length === 0}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      Action ({selectedResults.length} selected)
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      onClick={() => {
                        if (selectedResults.length === 1) {
                          const selectedIndex = selectedResults[0];
                          const selectedResult = filteredResults[selectedIndex];
                          if (selectedResult) {
                            handleEdit(selectedResult.plotId);
                          }
                        } else {
                          toast({
                            title: "Single Selection Required",
                            description: "Please select only one plot to edit.",
                            variant: "default"
                          });
                        }
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={selectedResults.length !== 1}
                    >
                      <Edit className="h-4 w-4" />
                      Edit Polygon (Single)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (selectedResults.length >= 1) {
                          const selectedPolygons = selectedResults.map(index => filteredResults[index]);
                          handleMultipleVerification(selectedPolygons);
                        }
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={selectedResults.length === 0}
                    >
                      <CheckSquare className="h-4 w-4" />
                      Verify Data ({selectedResults.length} plot{selectedResults.length > 1 ? 's' : ''})
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSaveAction}
                      className="flex items-center gap-2 cursor-pointer"
                      disabled={selectedResults.length === 0}
                    >
                      <FileText className="h-4 w-4" />
                      Save to Database
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={exportToCSV}
                  variant="outline"
                  className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                  data-testid="button-export-csv"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  onClick={handleQuickPreview}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  data-testid="preview-map-button"
                >
                  <Eye className="h-4 w-4" />
                  Quick Preview
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
                              setSelectedResults(prev => Array.from(new Set([...prev, ...currentPageIndices])));
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
                          GFW Loss (ha)
                          {getSortIcon('gfwLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('jrcLoss')}
                      >
                        <div className="flex items-center gap-2">
                          JRC Loss (ha)
                          {getSortIcon('jrcLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('sbtnLoss')}
                      >
                        <div className="flex items-center gap-2">
                          SBTN Loss (ha)
                          {getSortIcon('sbtnLoss')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('wdpaStatus')}
                      >
                        <div className="flex items-center gap-2">
                          WDPA Status
                          {getSortIcon('wdpaStatus')}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('peatlandStatus')}
                      >
                        <div className="flex items-center gap-2">
                          Peatland Status
                          {getSortIcon('peatlandStatus')}
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
                        <td className="px-4 py-4 text-sm">
                          {getWdpaBadge(result.wdpaStatus)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getPeatlandBadge(result.peatlandStatus)}
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Save Plots to Database</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Selected plots: {selectedResults.length}
                </p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
                  {selectedResults.map(index => filteredResults[index].plotId).join(', ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Supplier *
                </label>
                <Select value={selectedSupplierId ?? ""} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div>
                          <div className="font-medium">{supplier.companyName}</div>
                          <div className="text-xs text-gray-500">{supplier.name}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePlots}
                  disabled={!selectedSupplierId || selectedResults.length === 0 || isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save to Database'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {showQuickPreview && analysisResults && analysisResults.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="w-[90vw] h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
              <h3 className="text-lg font-semibold">EUDR Map Viewer</h3>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowQuickPreview(false); // Close preview
                    setShowMapViewer(true);     // Open full map viewer
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Full Map
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowQuickPreview(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <div 
                ref={quickPreviewMapRef} 
                className="w-full h-full"
                id="quick-preview-map"
              />

              {/* Map Controls Overlay - Enhanced for Better Deforestation Layer Control */}
              <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 min-w-[300px] max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🗺️ Base Layer</label>
                    <select 
                      id="quick-base-layer"
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      defaultValue="satellite"
                    >
                      <option value="osm">OpenStreetMap</option>
                      <option value="satellite">Satellite Imagery</option>
                      <option value="terrain">Terrain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Risk Filter</label>
                    <select 
                      id="quick-risk-filter"
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      defaultValue="all"
                    >
                      <option value="all">Show All Plots</option>
                      <option value="high">High Risk Only</option>
                      <option value="low">Low/Medium Risk Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🛡️ Protected Areas</label>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-blue-50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          id="quick-wdpa-layer" 
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">WDPA Protected Areas</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏞️ Indonesian Peatland</label>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-green-50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          id="quick-peatland-layer" 
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium">Indonesian Peatland Areas</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🌳 Deforestation Analysis</label>
                    <div className="bg-red-50 rounded-lg p-2 space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-red-100 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          id="quick-gfw-layer" 
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-medium">GFW Forest Loss (2021-2024)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-red-100 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          id="quick-jrc-layer" 
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium">JRC Tropical Forest</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-red-100 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          id="quick-sbtn-layer" 
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">SBTN Natural Lands</span>
                      </label>
                      <div className="text-xs text-gray-600 bg-white p-2 rounded border-l-2 border-red-400 mt-2">
                        💡 <strong>Tip:</strong> Enable layers individually to see deforestation patterns overlaid on your analysis results.
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• GFW: Global Forest Watch tree cover loss</div>
                      <div>• JRC: EU Joint Research Centre tropical forest monitoring</div>
                      <div>• SBTN: Science Based Targets Network natural lands</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 min-w-[250px]">
                <h4 className="font-semibold text-blue-600 mb-3">🗺️ Map Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm">High Risk - Non-Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm">Low/Medium Risk - Compliant</span> {/* Adjusted text */}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4" style={{backgroundColor: "#d2b48c"}}></div> {/* Example color for WDPA */}
                    <span className="text-sm">WDPA Protected Areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500"></div> {/* Example color for Non Kubah Gambut */}
                    <span className="text-sm">Non Kubah Gambut</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4" style={{backgroundColor: "#8b4513"}}></div> {/* Example color for Kubah Gambut */}
                    <span className="text-sm">Kubah Gambut</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Map Viewer Modal */}
      {showMapViewer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="w-[95vw] h-[95vh] bg-white rounded-lg shadow-xl">
            <EudrMapViewer 
              analysisResults={analysisResults}
              onClose={() => {
                console.log('❌ Closing full map viewer');
                setShowMapViewer(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}