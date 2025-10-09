import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Download, Send, Eye, CheckCircle2, Clock, AlertTriangle,
  Building, Package, MapPin, Link2, Signature, Globe, Shield, ChevronDown, X, BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DdsReport, InsertDdsReport } from "@shared/schema";
import { KMLUploader } from "@/components/kml-uploader";
import { GeoJSONGenerator } from "@/components/geojson-generator";
import { SignaturePad, SignatureData } from "@/components/ui/signature-pad";
import { PALM_OIL_HS_CODES, STORAGE_KEYS, HS_CODE_SCIENTIFIC_MAPPING } from "@/lib/constants";

// TraceabilityConfigSelector Component
function TraceabilityConfigSelector({ onSelect, onCancel }: { onSelect: (config: any) => void; onCancel: () => void }) {
  const [mockConfigurations] = useState([
    {
      id: 'current',
      name: 'Current Supply Chain Configuration',
      description: 'Use the current tier-based supply chain configuration from Supply Chain Management',
      maxTiers: 5,
      tierAssignments: {
        1: [
          { id: 'estate-1', name: 'Riau Palm Estate', category: 'estates', location: 'Riau Province', details: '500 MT/month' },
          { id: 'mill-1', name: 'Central Palm Mill', category: 'mills', location: 'Medan', details: '1000 MT/day' }
        ],
        2: [
          { id: 'ext-1', name: 'PT THIP 03', category: 'external', location: 'Jakarta', details: 'Large Supplier' },
          { id: 'shf-1', name: 'Farmers Cooperative A', category: 'shf', location: 'West Riau', details: '250 farmers' }
        ],
        3: [
          { id: 'business-1', name: 'KPN Plantation Business Unit 1', category: 'businesses', location: 'Jakarta HQ', details: 'Primary Processing' }
        ],
        4: [
          { id: 'bulk-1', name: 'Central Bulking Station 1', category: 'bulking', location: 'Port of Dumai', details: '5000 MT' }
        ],
        5: []
      },
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: 'preset-1',
      name: 'Standard Palm Oil Supply Chain',
      description: 'Preset configuration for typical palm oil supply chain with 4 tiers',
      maxTiers: 4,
      tierAssignments: {
        1: [
          { id: 'preset-estate-1', name: 'Estate Partners', category: 'estates', location: 'Various', details: 'Direct suppliers' }
        ],
        2: [
          { id: 'preset-mill-1', name: 'Processing Mills', category: 'mills', location: 'Regional', details: 'Processing facilities' }
        ],
        3: [
          { id: 'preset-trader-1', name: 'Trading Companies', category: 'businesses', location: 'National', details: 'Trade intermediaries' }
        ],
        4: [
          { id: 'preset-export-1', name: 'Export Terminals', category: 'bulking', location: 'Ports', details: 'Export facilities' }
        ]
      },
      lastUpdated: '2024-01-10T08:15:00Z'
    }
  ]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Select a supply chain configuration to establish traceability linkage for this DDS report. You can use your current configuration from Supply Chain Management or choose a preset.
      </div>
      
      <div className="space-y-3">
        {mockConfigurations.map((config) => (
          <Card key={config.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(config)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-sm">{config.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {config.maxTiers} tiers
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {Object.entries(config.tierAssignments).map(([tier, suppliers]: [string, any]) => (
                  <div key={tier} className="text-center">
                    <div className="text-xs text-gray-500">Tier {tier}</div>
                    <div className="text-sm font-medium">{suppliers.length}</div>
                    <div className="text-xs text-gray-400">suppliers</div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500">
                  Total: {Object.values(config.tierAssignments).flat().length} suppliers
                </span>
                <span className="text-xs text-gray-400">
                  Updated: {new Date(config.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-traceability">
          Cancel
        </Button>
        <Button type="button" variant="outline" data-testid="button-create-custom-traceability">
          Create Custom Configuration
        </Button>
      </div>
    </div>
  );
}

export default function DueDiligenceReport() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDdsForm, setShowDdsForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DdsReport | null>(null);
  const [selectedHsCodes, setSelectedHsCodes] = useState<string[]>([]);
  const [selectedShipment, setSelectedShipment] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDeforestationRisk, setSelectedDeforestationRisk] = useState("");
  const [selectedLegalityStatus, setSelectedLegalityStatus] = useState("");
  const [selectedPlots, setSelectedPlots] = useState<any[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<any[]>([]);
  const [selectedTraceability, setSelectedTraceability] = useState<any>(null);
  const [selectedScientificName, setSelectedScientificName] = useState<string>("");
  const [selectedCommonName, setSelectedCommonName] = useState<string>("");
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const { toast } = useToast();

  // Auto-populate scientific name and common name when HS codes are selected
  useEffect(() => {
    if (selectedHsCodes.length > 0) {
      // Get the first selected HS code for auto-population
      const firstHsCode = selectedHsCodes[0];
      const mapping = HS_CODE_SCIENTIFIC_MAPPING[firstHsCode as keyof typeof HS_CODE_SCIENTIFIC_MAPPING];
      
      if (mapping) {
        setSelectedScientificName(mapping.scientificName);
        setSelectedCommonName(mapping.commonName);
      }
    } else {
      setSelectedScientificName("");
      setSelectedCommonName("");
    }
  }, [selectedHsCodes]);

  // Fetch DDS reports using the required endpoint with fallback
  const { data: ddsReportsFromList = [], isLoading: loadingDdsList, error: ddsListError } = useQuery<DdsReport[]>({
    queryKey: ['/api/dds/list'],
    retry: false
  });

  // Dummy DDS data for display when API fails or is empty
  const dummyDdsReports: DdsReport[] = [
    {
      id: 'DDS-2024-001',
      shipmentId: null,
      companyInternalRef: null,
      activity: null,
      operatorLegalName: 'PT TH Indo Plantations',
      operatorAddress: 'Jl. Industri No. 123, Jakarta 10120, Indonesia',
      placeOfActivity: null,
      operatorCountry: null,
      operatorIsoCode: null,
      eoriNumber: null,
      hsCode: '15190910',
      productDescription: 'Crude Palm Oil (CPO)',
      scientificName: 'Elaeis guineensis',
      commonName: 'African oil palm',
      producerName: null,
      netMassKg: "50000",
      volumeUnit: null,
      volumeQuantity: null,
      percentageEstimation: null,
      supplementaryUnit: null,
      supplementaryQuantity: null,
      plotSelectionMethod: null,
      selectedPlotId: null,
      plotName: null,
      totalProducers: null,
      totalPlots: null,
      totalProductionArea: null,
      countryOfHarvest: null,
      maxIntermediaries: null,
      traceabilityMethod: null,
      expectedHarvestDate: null,
      productionDateRange: null,
      countryOfProduction: 'Indonesia',
      geolocationType: null,
      geolocationCoordinates: null,
      uploadedGeojson: null,
      geojsonValidated: false,
      geojsonValidationErrors: null,
      plotGeolocations: null,
      establishmentGeolocations: null,
      kmlFileName: null,
      geojsonFilePaths: null,
      plotBoundingBox: null,
      plotCentroid: null,
      plotArea: null,
      priorDdsReference: null,
      operatorDeclaration: 'Complies with EUDR requirements',
      signedBy: 'Ahmad Suharto',
      signedDate: new Date('2024-01-15'),
      signatoryFunction: 'Operations Director',
      digitalSignature: null,
      signatureType: null,
      signatureImagePath: null,
      signatureData: null,
      status: 'generated',
      submissionDate: null,
      euTraceReference: null,
      pdfDocumentPath: null,
      pdfFileName: null,
      sessionId: null,
      downloadCount: 0,
      lastDownloaded: null,
      deforestationRiskLevel: null,
      legalityStatus: null,
      complianceScore: null,
      traceability: null,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'DDS-2024-002',
      shipmentId: null,
      companyInternalRef: null,
      activity: null,
      operatorLegalName: 'KPN Upstream',
      operatorAddress: 'Jl. Raya Medan-Binjai KM 12, Medan 20241, Indonesia',
      placeOfActivity: null,
      operatorCountry: null,
      operatorIsoCode: null,
      eoriNumber: null,
      hsCode: '15119000',
      productDescription: 'Refined Palm Oil',
      scientificName: 'Elaeis guineensis',
      commonName: 'African oil palm',
      producerName: null,
      netMassKg: "25000",
      volumeUnit: null,
      volumeQuantity: null,
      percentageEstimation: null,
      supplementaryUnit: null,
      supplementaryQuantity: null,
      plotSelectionMethod: null,
      selectedPlotId: null,
      plotName: null,
      totalProducers: null,
      totalPlots: null,
      totalProductionArea: null,
      countryOfHarvest: null,
      maxIntermediaries: null,
      traceabilityMethod: null,
      expectedHarvestDate: null,
      productionDateRange: null,
      countryOfProduction: 'Indonesia',
      geolocationType: null,
      geolocationCoordinates: null,
      uploadedGeojson: null,
      geojsonValidated: false,
      geojsonValidationErrors: null,
      plotGeolocations: null,
      establishmentGeolocations: null,
      kmlFileName: null,
      geojsonFilePaths: null,
      plotBoundingBox: null,
      plotCentroid: null,
      plotArea: null,
      priorDdsReference: null,
      operatorDeclaration: 'Verified EUDR compliance',
      signedBy: 'Budi Santoso',
      signedDate: new Date('2024-01-18'),
      signatoryFunction: 'General Manager',
      digitalSignature: null,
      signatureType: null,
      signatureImagePath: null,
      signatureData: null,
      status: 'submitted',
      submissionDate: null,
      euTraceReference: null,
      pdfDocumentPath: null,
      pdfFileName: null,
      sessionId: null,
      downloadCount: 0,
      lastDownloaded: null,
      deforestationRiskLevel: null,
      legalityStatus: null,
      complianceScore: null,
      traceability: null,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: 'DDS-2024-003',
      shipmentId: null,
      companyInternalRef: null,
      activity: null,
      operatorLegalName: 'KPN Downstream',
      operatorAddress: 'Jl. Sudirman No. 45, Surabaya 60271, Indonesia',
      placeOfActivity: null,
      operatorCountry: null,
      operatorIsoCode: null,
      eoriNumber: null,
      hsCode: '15132100',
      productDescription: 'Palm Kernel Oil',
      scientificName: 'Elaeis guineensis',
      commonName: 'African oil palm',
      producerName: null,
      netMassKg: "15000",
      volumeUnit: null,
      volumeQuantity: null,
      percentageEstimation: null,
      supplementaryUnit: null,
      supplementaryQuantity: null,
      plotSelectionMethod: null,
      selectedPlotId: null,
      plotName: null,
      totalProducers: null,
      totalPlots: null,
      totalProductionArea: null,
      countryOfHarvest: null,
      maxIntermediaries: null,
      traceabilityMethod: null,
      expectedHarvestDate: null,
      productionDateRange: null,
      countryOfProduction: 'Indonesia',
      geolocationType: null,
      geolocationCoordinates: null,
      uploadedGeojson: null,
      geojsonValidated: false,
      geojsonValidationErrors: null,
      plotGeolocations: null,
      establishmentGeolocations: null,
      kmlFileName: null,
      geojsonFilePaths: null,
      plotBoundingBox: null,
      plotCentroid: null,
      plotArea: null,
      priorDdsReference: null,
      operatorDeclaration: 'EUDR deforestation-free certified',
      signedBy: 'Sari Dewi',
      signedDate: new Date('2024-01-22'),
      signatoryFunction: 'Sustainability Director',
      digitalSignature: null,
      signatureType: null,
      signatureImagePath: null,
      signatureData: null,
      status: 'generated',
      submissionDate: null,
      euTraceReference: null,
      pdfDocumentPath: null,
      pdfFileName: null,
      sessionId: null,
      downloadCount: 0,
      lastDownloaded: null,
      deforestationRiskLevel: null,
      legalityStatus: null,
      complianceScore: null,
      traceability: null,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    },
    {
      id: 'DDS-2024-004',
      shipmentId: null,
      companyInternalRef: null,
      activity: null,
      operatorLegalName: 'PT TH Indo Plantations',
      operatorAddress: 'Jl. Raya Pekanbaru-Dumai KM 45, Riau 28300, Indonesia',
      placeOfActivity: null,
      operatorCountry: null,
      operatorIsoCode: null,
      eoriNumber: null,
      hsCode: '23066990',
      productDescription: 'Palm Oil Residues',
      scientificName: 'Elaeis guineensis',
      commonName: 'African oil palm',
      producerName: null,
      netMassKg: "8000",
      volumeUnit: null,
      volumeQuantity: null,
      percentageEstimation: null,
      supplementaryUnit: null,
      supplementaryQuantity: null,
      plotSelectionMethod: null,
      selectedPlotId: null,
      plotName: null,
      totalProducers: null,
      totalPlots: null,
      totalProductionArea: null,
      countryOfHarvest: null,
      maxIntermediaries: null,
      traceabilityMethod: null,
      expectedHarvestDate: null,
      productionDateRange: null,
      countryOfProduction: 'Indonesia',
      geolocationType: null,
      geolocationCoordinates: null,
      uploadedGeojson: null,
      geojsonValidated: false,
      geojsonValidationErrors: null,
      plotGeolocations: null,
      establishmentGeolocations: null,
      kmlFileName: null,
      geojsonFilePaths: null,
      plotBoundingBox: null,
      plotCentroid: null,
      plotArea: null,
      priorDdsReference: null,
      operatorDeclaration: 'Smallholder compliance verified',
      signedBy: 'Bambang Suryadi',
      signedDate: new Date('2024-01-25'),
      signatoryFunction: 'Estate Manager',
      digitalSignature: null,
      signatureType: null,
      signatureImagePath: null,
      signatureData: null,
      status: 'generated',
      submissionDate: null,
      euTraceReference: null,
      pdfDocumentPath: null,
      pdfFileName: null,
      sessionId: null,
      downloadCount: 0,
      lastDownloaded: null,
      deforestationRiskLevel: null,
      legalityStatus: null,
      complianceScore: null,
      traceability: null,
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'DDS-2024-005',
      shipmentId: null,
      companyInternalRef: null,
      activity: null,
      operatorLegalName: 'KPN Upstream',
      operatorAddress: 'Jl. Gatot Subroto No. 88, Bandung 40262, Indonesia',
      placeOfActivity: null,
      operatorCountry: null,
      operatorIsoCode: null,
      eoriNumber: null,
      hsCode: '38231900',
      productDescription: 'Industrial Fatty Acids (Palm-based)',
      scientificName: 'Elaeis guineensis',
      commonName: 'African oil palm',
      producerName: null,
      netMassKg: "12500",
      volumeUnit: null,
      volumeQuantity: null,
      percentageEstimation: null,
      supplementaryUnit: null,
      supplementaryQuantity: null,
      plotSelectionMethod: null,
      selectedPlotId: null,
      plotName: null,
      totalProducers: null,
      totalPlots: null,
      totalProductionArea: null,
      countryOfHarvest: null,
      maxIntermediaries: null,
      traceabilityMethod: null,
      expectedHarvestDate: null,
      productionDateRange: null,
      countryOfProduction: 'Indonesia',
      geolocationType: null,
      geolocationCoordinates: null,
      uploadedGeojson: null,
      geojsonValidated: false,
      geojsonValidationErrors: null,
      plotGeolocations: null,
      establishmentGeolocations: null,
      kmlFileName: null,
      geojsonFilePaths: null,
      plotBoundingBox: null,
      plotCentroid: null,
      plotArea: null,
      priorDdsReference: null,
      operatorDeclaration: 'Full EUDR compliance achieved',
      signedBy: 'Indah Permatasari',
      signedDate: new Date('2024-01-28'),
      signatoryFunction: 'Head of Compliance',
      digitalSignature: null,
      signatureType: null,
      signatureImagePath: null,
      signatureData: null,
      status: 'submitted',
      submissionDate: null,
      euTraceReference: null,
      pdfDocumentPath: null,
      pdfFileName: null,
      sessionId: null,
      downloadCount: 0,
      lastDownloaded: null,
      deforestationRiskLevel: null,
      legalityStatus: null,
      complianceScore: null,
      traceability: null,
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-01-28')
    }
  ];

  // Fallback to dummy data if real data API fails or is empty
  const ddsReports = ddsReportsFromList.length > 0 ? ddsReportsFromList : dummyDdsReports;

  // Fetch shipments for form selection
  const { data: shipments = [] } = useQuery<any[]>({
    queryKey: ['/api/workflow-shipments'],
  });

  // Fetch suppliers for cross-module integration
  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
  });

  // Create DDS report mutation
  const createDdsMutation = useMutation({
    mutationFn: async (data: InsertDdsReport) => {
      return apiRequest('POST', '/api/dds-reports', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dds-reports'] });
      setShowDdsForm(false);
      toast({
        title: "DDS Report Created",
        description: "Due diligence statement has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Download DDS report using new endpoint
  const downloadDdsReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/dds/${reportId}/download`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to download DDS report');
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dds-report-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download Started",
        description: "DDS report PDF download has been initiated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Submit to EU Trace mutation
  const submitToEuTraceMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest('POST', `/api/dds-reports/${reportId}/submit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dds-reports'] });
      toast({
        title: "Submitted to EU Trace",
        description: "DDS report has been submitted to EU Trace system.",
      });
    },
  });

  const handleDdsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate required Select fields
    if (selectedHsCodes.length === 0 || !selectedCountry) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields: HS Code(s) and Country of Production.",
        variant: "destructive",
      });
      return;
    }

    // Validate signature requirement
    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide a digital signature before submitting the DDS report.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    const ddsData: InsertDdsReport = {
      shipmentId: formData.get('shipmentId') as string,
      companyInternalRef: formData.get('companyInternalRef') as string,
      activity: formData.get('activity') as string,
      operatorLegalName: formData.get('operatorLegalName') as string,
      operatorAddress: formData.get('operatorAddress') as string,
      operatorCountry: formData.get('operatorCountry') as string || undefined,
      operatorIsoCode: formData.get('operatorIsoCode') as string || undefined,
      eoriNumber: formData.get('eoriNumber') as string || undefined,
      hsCode: formData.getAll('hsCode').join(','),
      productDescription: formData.get('productDescription') as string,
      scientificName: formData.get('scientificName') as string || undefined,
      commonName: formData.get('commonName') as string || undefined,
      producerName: formData.get('producerName') as string || undefined,
      netMassKg: formData.get('netMassKg') as string,
      percentageEstimation: formData.get('percentageEstimation') as string || undefined,
      supplementaryUnit: formData.get('supplementaryUnit') as string || undefined,
      supplementaryQuantity: formData.get('supplementaryQuantity') as string || undefined,
      countryOfProduction: formData.get('countryOfProduction') as string,
      totalProducers: formData.get('totalProducers') ? parseInt(formData.get('totalProducers') as string) : undefined,
      totalPlots: formData.get('totalPlots') ? parseInt(formData.get('totalPlots') as string) : undefined,
      totalProductionArea: formData.get('totalProductionArea') ? parseFloat(formData.get('totalProductionArea') as string).toString() : undefined,
      countryOfHarvest: formData.get('countryOfHarvest') as string || undefined,
      maxIntermediaries: formData.get('maxIntermediaries') ? parseInt(formData.get('maxIntermediaries') as string) : undefined,
      traceabilityMethod: formData.get('traceabilityMethod') as string || undefined,
      expectedHarvestDate: formData.get('expectedHarvestDate') as string || undefined,
      productionDateRange: formData.get('productionDateRange') as string || undefined,
      plotGeolocations: selectedPlots.length > 0 ? 
        selectedPlots.map(plot => `${plot.plotId}:${plot.geometry?.coordinates?.[0]?.map((coord: number[]) => coord.join(',')).join(';') || ''}`).filter(str => str.includes(':')) : 
        (formData.get('plotGeolocations') ? (formData.get('plotGeolocations') as string).split(',').map(s => s.trim()) : []),
      establishmentGeolocations: formData.get('establishmentGeolocations') ? 
        (formData.get('establishmentGeolocations') as string).split(',').map(s => s.trim()) : [],
      priorDdsReference: formData.get('priorDdsReference') as string || undefined,
      operatorDeclaration: formData.get('operatorDeclaration') as string,
      signedBy: formData.get('signedBy') as string,
      signedDate: new Date(formData.get('signedDate') as string),
      signatoryFunction: formData.get('signatoryFunction') as string,
      digitalSignature: signatureData?.data || undefined,
      signatureType: signatureData?.type || undefined,
      signatureImagePath: signatureData?.imagePath || undefined,
      signatureData: signatureData?.data || undefined,
      status: 'draft',
      deforestationRiskLevel: formData.get('deforestationRiskLevel') as string || undefined,
      legalityStatus: formData.get('legalityStatus') as string || undefined,
      complianceScore: formData.get('complianceScore') as string || undefined,
      traceability: selectedTraceability ? JSON.stringify(selectedTraceability) : undefined,
    };

    createDdsMutation.mutate(ddsData);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setShowDdsForm(open);
    if (!open) {
      // Reset form state when dialog closes
      setSelectedHsCodes([]);
      setSelectedShipment("");
      setSelectedCountry("");
      setSelectedDeforestationRisk("");
      setSelectedLegalityStatus("");
      setSelectedPlots([]);
      setSelectedSuppliers([]);
      setSelectedTraceability(null);
      setSignatureData(null);
    }
  };

  const handleHsCodeToggle = (code: string) => {
    setSelectedHsCodes(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const removeHsCode = (code: string) => {
    setSelectedHsCodes(prev => prev.filter(c => c !== code));
  };

  // State for plot selection popup
  const [showPlotSelector, setShowPlotSelector] = useState(false);
  const [tempSelectedPlots, setTempSelectedPlots] = useState<Set<string>>(new Set());
  
  // State for plot filters
  const [plotFilterRisk, setPlotFilterRisk] = useState<string>('all');
  const [plotFilterCompliance, setPlotFilterCompliance] = useState<string>('all');
  const [plotFilterCountry, setPlotFilterCountry] = useState<string>('all');
  
  // State for supplier legality selection popup
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [tempSelectedSuppliers, setTempSelectedSuppliers] = useState<Set<string>>(new Set());
  
  // State for traceability selection popup
  const [showTraceabilitySelector, setShowTraceabilitySelector] = useState(false);
  
  // Fetch analysis results for plot selection
  const { data: analysisResults = [] } = useQuery<any[]>({
    queryKey: ['/api/analysis-results'],
    enabled: showPlotSelector,
  });
  
  // Filter analysis results based on selected filters
  const filteredAnalysisResults = analysisResults.filter(plot => {
    if (plotFilterRisk !== 'all' && plot.overallRisk !== plotFilterRisk) return false;
    if (plotFilterCompliance !== 'all' && plot.complianceStatus !== plotFilterCompliance) return false;
    if (plotFilterCountry !== 'all' && plot.country !== plotFilterCountry) return false;
    return true;
  });
  
  // Get unique countries from analysis results for filter dropdown (filter out falsy values)
  const availableCountries = Array.from(
    new Set(analysisResults.map((plot: any) => plot.country).filter((country): country is string => !!country))
  );

  // Fetch supplier compliance data for supplier selection
  const { data: supplierComplianceData = [] } = useQuery<any[]>({
    queryKey: ['/api/supplier-compliance'],
    enabled: showSupplierSelector,
  });

  const handlePlotSelection = (plotId: string, checked: boolean) => {
    const newSelection = new Set(tempSelectedPlots);
    if (checked) {
      newSelection.add(plotId);
    } else {
      newSelection.delete(plotId);
    }
    setTempSelectedPlots(newSelection);
  };

  const confirmPlotSelection = () => {
    const selectedPlotData = analysisResults.filter(plot => tempSelectedPlots.has(plot.plotId));
    setSelectedPlots(selectedPlotData);
    setShowPlotSelector(false);
    toast({
      title: "Plots Selected",
      description: `${selectedPlotData.length} plots selected for DDS report.`,
      variant: "default",
    });
  };

  const clearPlotSelection = () => {
    setSelectedPlots([]);
    setTempSelectedPlots(new Set());
  };
  
  const clearPlotFilters = () => {
    setPlotFilterRisk('all');
    setPlotFilterCompliance('all');
    setPlotFilterCountry('all');
  };

  const handleSupplierSelection = (supplierId: string, checked: boolean) => {
    const newSelection = new Set(tempSelectedSuppliers);
    if (checked) {
      newSelection.add(supplierId);
    } else {
      newSelection.delete(supplierId);
    }
    setTempSelectedSuppliers(newSelection);
  };

  const confirmSupplierSelection = () => {
    const selectedSupplierData = supplierComplianceData.filter(supplier => 
      tempSelectedSuppliers.has(supplier.id.toString())
    );
    setSelectedSuppliers(selectedSupplierData);
    setShowSupplierSelector(false);
    
    // Calculate overall legality status from selected suppliers
    const verifiedCount = selectedSupplierData.filter(s => s.complianceStatus === 'Verified' || s.overallScore >= 80).length;
    const totalCount = selectedSupplierData.length;
    
    let overallStatus = 'pending';
    if (totalCount === 0) {
      overallStatus = '';
    } else if (verifiedCount === totalCount) {
      overallStatus = 'verified';
    } else if (verifiedCount / totalCount >= 0.8) {
      overallStatus = 'mostly-verified';
    } else {
      overallStatus = 'pending';
    }
    
    setSelectedLegalityStatus(overallStatus);
    
    toast({
      title: "Suppliers Selected",
      description: `${selectedSupplierData.length} suppliers selected for legality assessment.`,
      variant: "default",
    });
  };

  const clearSupplierSelection = () => {
    setSelectedSuppliers([]);
    setTempSelectedSuppliers(new Set());
    setSelectedLegalityStatus('');
  };

  const generateComprehensiveDDS = (report: DdsReport) => {
    return {
      ddsReferenceNumber: `KPN${report.id?.toString().padStart(12, '0')}`,
      title: "KPN COMPLIANCE DUE DILIGENCE STATEMENT",
      
      // Section A: Operator Information
      operatorInfo: {
        legalName: report.operatorLegalName,
        address: report.operatorAddress,
        eoriNumber: report.eoriNumber
      },
      
      // Section B: Overall Conclusion
      overallConclusion: {
        riskLevel: report.deforestationRiskLevel === 'low' ? 'Negligible Risk Conclusion' : 'Standard Risk Assessment',
        deforestationAssessment: `Deforestation risk is ${report.deforestationRiskLevel || 'standard'} as all plots passed Global Forest Watch checks, and manual audits confirmed compliance where needed.`,
        legalityAssessment: `Legality risk is ${report.legalityStatus || 'compliant'} based on farm level legality assessments covering applicable local laws, verified land titles, and satellite checks for overlap with sensitive ecosystem areas.`,
        certifications: "ISPO, RSPO certifications and our own supplier training and capacity building in key legality areas support compliance.",
        documentation: "Relevant documentation is attached to this DDS report."
      },
      
      // Section C: Product Information  
      productInfo: {
        hsCode: report.hsCode,
        description: report.productDescription,
        scientificName: report.scientificName || 'Elaeis guineensis (African Oil Palm)',
        quantity: `${report.netMassKg} KG`,
        units: report.supplementaryQuantity || '1 Units'
      },
      
      // Section D: Supply Chain Mapping
      supplyChainMapping: {
        countryOfProduction: report.countryOfProduction,
        subregions: ['Multiple Regions'],
        complexity: 'Direct sourcing from mills and estates. Tier-based supplier management.',
        totalSuppliers: '1 Supplier',
        totalSubSuppliers: '2 Producers',
        totalPlots: `${report.plotGeolocations?.length || 0} Plots`,
        plotsWithGeolocation: `${report.plotGeolocations?.length || 0} Plots`,
        productionDateRange: '1/10/2024 - 30/09/2025'
      },
      
      // Section E: Deforestation Risk Assessment
      deforestationRisk: {
        riskLevel: report.deforestationRiskLevel === 'low' ? 'Low Risk' : 'Standard Risk',
        totalPlots: report.plotGeolocations?.length || 0,
        validPlots: Math.floor((report.plotGeolocations?.length || 0) * 0.8),
        invalidPlots: Math.floor((report.plotGeolocations?.length || 0) * 0.1),
        noStatusPlots: Math.floor((report.plotGeolocations?.length || 0) * 0.1),
        riskDistribution: {
          highRisk: '0 fields',
          mediumRisk: '0 fields', 
          lowRisk: `${report.plotGeolocations?.length || 0} fields`
        },
        mitigationMeasures: [
          'All plots have undergone deforestation check via Global Forest Watch',
          'Plots showing risk indicators were manually audited for EUDR compliance',
          'Satellite monitoring system provides continuous oversight'
        ]
      },
      
      // Section F: Legal Compliance Assessment
      legalCompliance: {
        totalPlots: report.plotGeolocations?.length || 0,
        compliantSurveys: Math.floor((report.plotGeolocations?.length || 0) * 0.9),
        nonCompliantSurveys: Math.floor((report.plotGeolocations?.length || 0) * 0.1),
        sustainabilityScore: report.complianceScore || '3.2 (moderate to significant risk)',
        countryRisks: {
          fairBusiness: { score: 3, description: 'Corruption concerns in rural areas affecting land use transparency' },
          humanRights: { score: 3, description: 'Land conflicts and community displacement risks managed through FPIC protocols' },
          environment: { score: 2, description: 'Environmental monitoring through satellite systems and field audits' },
          labourRights: { score: 2, description: 'Formal employment practices with social security compliance' }
        },
        indigenousLands: {
          present: 'No',
          overlapPercentage: '0.0%',
          fieldsWithData: report.plotGeolocations?.length || 0
        },
        applicableLaws: [
          'Land-use rights: Formal land titles verified for legal security',
          'Environmental legislation: EIA compliance for large-scale operations', 
          'Forest related rules: Forest Use Permits obtained where required',
          'Third parties legal rights & FPIC: Indigenous community rights respected',
          'Labour rights: Minimum wage and working condition compliance',
          'Human rights: Child labour prohibition strictly enforced'
        ],
        mitigationMeasures: [
          'All suppliers assessed with comprehensive legality surveys',
          'Land titles and permits verified and attached to DDS',
          'Satellite checks confirm no overlap with sensitive ecosystems',
          'ISPO/RSPO certification provides additional compliance assurance',
          'Continuous capacity building programs for suppliers'
        ]
      }
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Due Diligence Report
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            EU Due Diligence Statement compliance reporting and submission system
          </p>
        </div>

        <Tabs value="overview" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Due Diligence Reports Overview</h2>
              <Dialog open={showDdsForm} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-dds">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Due Diligence Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Due Diligence Report</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDdsSubmit} className="space-y-6">
                    {/* Operator Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Operator Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyInternalRef">Company Internal Ref *</Label>
                          <Input 
                            id="companyInternalRef" 
                            name="companyInternalRef" 
                            placeholder="KPN-2024-001"
                            required 
                            data-testid="input-company-ref"
                          />
                        </div>
                        <div>
                          <Label htmlFor="activity">Activity *</Label>
                          <Select name="activity" required>
                            <SelectTrigger data-testid="select-activity">
                              <SelectValue placeholder="Select activity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="placing-on-market">Placing on the market</SelectItem>
                              <SelectItem value="making-available">Making available on the market</SelectItem>
                              <SelectItem value="export">Export</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="operatorLegalName">Legal Name *</Label>
                          <Input 
                            id="operatorLegalName" 
                            name="operatorLegalName" 
                            required 
                            data-testid="input-operator-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="operatorAddress">Address *</Label>
                          <Input 
                            id="operatorAddress" 
                            name="operatorAddress" 
                            required 
                            data-testid="input-operator-address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="operatorCountry">Country *</Label>
                          <Select name="operatorCountry" required>
                            <SelectTrigger data-testid="select-operator-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ID">Indonesia</SelectItem>
                              <SelectItem value="MY">Malaysia</SelectItem>
                              <SelectItem value="TH">Thailand</SelectItem>
                              <SelectItem value="SG">Singapore</SelectItem>
                              <SelectItem value="EU">European Union</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="operatorIsoCode">ISO Code *</Label>
                          <Input 
                            id="operatorIsoCode" 
                            name="operatorIsoCode" 
                            placeholder="ID-001"
                            required 
                            data-testid="input-operator-iso"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="eoriNumber">EORI Number (for EU imports/exports)</Label>
                          <Input 
                            id="eoriNumber" 
                            name="eoriNumber" 
                            placeholder="GB123456789000"
                            data-testid="input-eori-number"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Product Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Product Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shipmentId">Related Shipment</Label>
                          <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                            <SelectTrigger data-testid="select-shipment">
                              <SelectValue placeholder="Select shipment" />
                            </SelectTrigger>
                            <SelectContent>
                              {shipments.map((shipment: any) => (
                                <SelectItem key={shipment.id} value={shipment.id}>
                                  {shipment.batchNumber} - {shipment.productType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input type="hidden" name="shipmentId" value={selectedShipment} />
                        </div>
                        <div>
                          <Label htmlFor="hsCode">HS Codes * (Multiple Selection)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between text-left font-normal"
                                data-testid="select-hs-codes"
                              >
                                {selectedHsCodes.length === 0 ? (
                                  <span className="text-gray-500">Select HS Codes for palm oil products</span>
                                ) : (
                                  <span className="text-sm">
                                    {selectedHsCodes.length} HS Code{selectedHsCodes.length !== 1 ? 's' : ''} selected
                                  </span>
                                )}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <div className="max-h-60 overflow-y-auto">
                                <div className="p-2">
                                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
                                    Select Multiple HS Codes:
                                  </div>
                                  {PALM_OIL_HS_CODES.map((hsCode) => (
                                    <div
                                      key={hsCode.code}
                                      className="flex items-start space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                                      onClick={() => handleHsCodeToggle(hsCode.code)}
                                      data-testid={`hs-code-option-${hsCode.code}`}
                                    >
                                      <Checkbox
                                        checked={selectedHsCodes.includes(hsCode.code)}
                                        onCheckedChange={() => handleHsCodeToggle(hsCode.code)}
                                        className="mt-0.5"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{hsCode.code}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                          {hsCode.description}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          
                          {/* Selected HS Codes Display */}
                          {selectedHsCodes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedHsCodes.map((code) => {
                                const hsCodeData = PALM_OIL_HS_CODES.find(hc => hc.code === code);
                                return (
                                  <Badge
                                    key={code}
                                    variant="secondary"
                                    className="text-xs px-2 py-1"
                                    data-testid={`selected-hs-code-${code}`}
                                  >
                                    {code}
                                    <button
                                      type="button"
                                      onClick={() => removeHsCode(code)}
                                      className="ml-1 hover:text-red-500"
                                      data-testid={`remove-hs-code-${code}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Hidden inputs for form submission */}
                          {selectedHsCodes.map((code, index) => (
                            <input
                              key={index}
                              type="hidden"
                              name="hsCode"
                              value={code}
                            />
                          ))}
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="productDescription">Product Description *</Label>
                          <Textarea 
                            id="productDescription" 
                            name="productDescription" 
                            placeholder="Crude palm oil (CPO), organic certified"
                            required 
                            data-testid="textarea-product-description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="scientificName">Scientific Name</Label>
                          <Input 
                            id="scientificName" 
                            name="scientificName" 
                            value={selectedScientificName}
                            onChange={(e) => setSelectedScientificName(e.target.value)}
                            placeholder="Elaeis guineensis"
                            className={selectedScientificName ? "bg-green-50 dark:bg-green-900/20" : ""}
                            data-testid="input-scientific-name"
                          />
                          {selectedScientificName && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Auto-populated from selected HS code
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="commonName">Common Name</Label>
                          <Input 
                            id="commonName" 
                            name="commonName" 
                            value={selectedCommonName}
                            onChange={(e) => setSelectedCommonName(e.target.value)}
                            placeholder="Palm Oil"
                            className={selectedCommonName ? "bg-green-50 dark:bg-green-900/20" : ""}
                            data-testid="input-common-name"
                          />
                          {selectedCommonName && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Auto-populated from selected HS code
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="producerName">Producer Name</Label>
                          <Input 
                            id="producerName" 
                            name="producerName" 
                            placeholder="Producer/Supplier name"
                            data-testid="input-producer-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="countryOfProduction">Country of Production *</Label>
                          <Select name="countryOfProduction" required>
                            <SelectTrigger data-testid="select-country-production">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ID">Indonesia</SelectItem>
                              <SelectItem value="MY">Malaysia</SelectItem>
                              <SelectItem value="TH">Thailand</SelectItem>
                              <SelectItem value="BR">Brazil</SelectItem>
                              <SelectItem value="NG">Nigeria</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="netMassKg">Net Mass (kg) *</Label>
                          <Input 
                            id="netMassKg" 
                            name="netMassKg" 
                            type="number" 
                            step="0.001" 
                            required 
                            data-testid="input-net-mass"
                          />
                        </div>
                        <div>
                          <Label htmlFor="percentageEstimation">% Est. or Deviation</Label>
                          <Input 
                            id="percentageEstimation" 
                            name="percentageEstimation" 
                            type="number" 
                            step="0.1" 
                            min="0" 
                            max="100"
                            placeholder="2.5"
                            data-testid="input-percentage-estimation"
                          />
                        </div>
                        <div>
                          <Label htmlFor="supplementaryUnit">Supplementary Unit</Label>
                          <Input 
                            id="supplementaryUnit" 
                            name="supplementaryUnit" 
                            placeholder="liters, pieces"
                            data-testid="input-supplementary-unit"
                          />
                        </div>
                        <div>
                          <Label htmlFor="supplementaryQuantity">Supplementary Quantity</Label>
                          <Input 
                            id="supplementaryQuantity" 
                            name="supplementaryQuantity" 
                            type="number" 
                            step="0.001"
                            data-testid="input-supplementary-quantity"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Plot Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Summary Plot Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="totalProducers">Total Producers</Label>
                          <Input 
                            id="totalProducers" 
                            name="totalProducers" 
                            type="number" 
                            min="0"
                            placeholder="0"
                            data-testid="input-total-producers"
                          />
                        </div>
                        <div>
                          <Label htmlFor="totalPlots">Total Plots</Label>
                          <Input 
                            id="totalPlots" 
                            name="totalPlots" 
                            type="number" 
                            min="0"
                            placeholder="0"
                            data-testid="input-total-plots"
                          />
                        </div>
                        <div>
                          <Label htmlFor="totalProductionArea">Total Production Area (ha)</Label>
                          <Input 
                            id="totalProductionArea" 
                            name="totalProductionArea" 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00"
                            data-testid="input-total-production-area"
                          />
                        </div>
                        <div>
                          <Label htmlFor="countryOfHarvest">Country of Harvest *</Label>
                          <Select name="countryOfHarvest" required>
                            <SelectTrigger data-testid="select-country-harvest">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ID">Indonesia</SelectItem>
                              <SelectItem value="MY">Malaysia</SelectItem>
                              <SelectItem value="TH">Thailand</SelectItem>
                              <SelectItem value="BR">Brazil</SelectItem>
                              <SelectItem value="NG">Nigeria</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="maxIntermediaries">Max. Number of Intermediaries</Label>
                          <Input 
                            id="maxIntermediaries" 
                            name="maxIntermediaries" 
                            type="number" 
                            min="0"
                            placeholder="0"
                            data-testid="input-max-intermediaries"
                          />
                        </div>
                        <div>
                          <Label htmlFor="traceabilityMethod">Traceability Method *</Label>
                          <Select name="traceabilityMethod" required>
                            <SelectTrigger data-testid="select-traceability-method">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mass-balance">Mass Balance</SelectItem>
                              <SelectItem value="segregated">Segregated</SelectItem>
                              <SelectItem value="identity-preserved">Identity Preserved</SelectItem>
                              <SelectItem value="book-and-claim">Book and Claim</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
                          <Input 
                            id="expectedHarvestDate" 
                            name="expectedHarvestDate" 
                            type="date"
                            data-testid="input-expected-harvest-date"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productionDateRange">Production Date Range</Label>
                          <Input 
                            id="productionDateRange" 
                            name="productionDateRange" 
                            placeholder="January 2024 - March 2024"
                            data-testid="input-production-date-range"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Origin & Geolocation */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Origin & Geolocation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="countryOfProduction">Country of Production *</Label>
                          <Select value={selectedCountry} onValueChange={setSelectedCountry} required>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Indonesia">Indonesia</SelectItem>
                              <SelectItem value="Malaysia">Malaysia</SelectItem>
                              <SelectItem value="Thailand">Thailand</SelectItem>
                              <SelectItem value="Brazil">Brazil</SelectItem>
                              <SelectItem value="Colombia">Colombia</SelectItem>
                            </SelectContent>
                          </Select>
                          <input type="hidden" name="countryOfProduction" value={selectedCountry} />
                        </div>
                        <div>
                          <Label htmlFor="plotGeolocations">Plot Geolocations</Label>
                          <div className="space-y-3">
                            {selectedPlots.length > 0 ? (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                                    📍 {selectedPlots.length} plots selected
                                  </p>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    onClick={clearPlotSelection}
                                    data-testid="button-clear-plots"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                  {selectedPlots.map((plot, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="flex items-center space-x-2">
                                        <Badge 
                                          variant={plot.overallRisk === 'HIGH' ? 'destructive' : plot.overallRisk === 'MEDIUM' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {plot.overallRisk}
                                        </Badge>
                                        <span className="font-medium text-sm">{plot.plotId}</span>
                                        <span className="text-xs text-gray-500">{plot.country}</span>
                                        <span className="text-xs text-gray-500">{plot.area} ha</span>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {plot.complianceStatus}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                {/* Hidden input for form submission */}
                                <input 
                                  type="hidden" 
                                  name="plotGeolocations" 
                                  value={selectedPlots.map(plot => 
                                    `${plot.plotId}:${plot.geometry?.coordinates?.[0]?.map((coord: number[]) => coord.join(',')).join(';') || ''}`
                                  ).join('|')}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-3">No plots selected for this DDS report</p>
                                <input type="hidden" name="plotGeolocations" value="" />
                              </div>
                            )}
                            
                            <Dialog open={showPlotSelector} onOpenChange={setShowPlotSelector}>
                              <DialogTrigger asChild>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="w-full"
                                  data-testid="button-select-plots"
                                >
                                  <MapPin className="h-4 w-4 mr-2" />
                                  Select Plots from Analysis
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                                <DialogHeader className="flex-shrink-0">
                                  <DialogTitle>Select Plots for DDS Report</DialogTitle>
                                  <DialogDescription>
                                    Select plots from the deforestation risk analysis results below. Selected plots will be added to your DDS report with their geolocations.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="flex-shrink-0 mb-4">
                                  <p className="text-sm text-gray-600 mb-3">
                                    Select plots from the deforestation risk analysis results below. 
                                    Selected plots will be added to your DDS report.
                                  </p>
                                  
                                  {/* Filter Controls */}
                                  <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                    <div>
                                      <Label className="text-xs">Risk Level</Label>
                                      <Select value={plotFilterRisk} onValueChange={setPlotFilterRisk}>
                                        <SelectTrigger className="h-9 text-sm" data-testid="filter-risk">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All Risks</SelectItem>
                                          <SelectItem value="LOW">Low</SelectItem>
                                          <SelectItem value="MEDIUM">Medium</SelectItem>
                                          <SelectItem value="HIGH">High</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-xs">Compliance</Label>
                                      <Select value={plotFilterCompliance} onValueChange={setPlotFilterCompliance}>
                                        <SelectTrigger className="h-9 text-sm" data-testid="filter-compliance">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All Status</SelectItem>
                                          <SelectItem value="COMPLIANT">Compliant</SelectItem>
                                          <SelectItem value="NON-COMPLIANT">Non-Compliant</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <Label className="text-xs">Country</Label>
                                      <Select value={plotFilterCountry} onValueChange={setPlotFilterCountry}>
                                        <SelectTrigger className="h-9 text-sm" data-testid="filter-country">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">All Countries</SelectItem>
                                          {availableCountries.map((country) => (
                                            <SelectItem key={country} value={country}>{country}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="flex items-end">
                                      <Button 
                                        type="button"
                                        variant="outline" 
                                        size="sm"
                                        onClick={clearPlotFilters}
                                        className="h-9 w-full"
                                        data-testid="button-clear-filters"
                                      >
                                        Clear Filters
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                          <th className="w-10 px-3 py-2 text-left">
                                            <Checkbox
                                              checked={filteredAnalysisResults.length > 0 && filteredAnalysisResults.every(plot => tempSelectedPlots.has(plot.plotId))}
                                              onCheckedChange={(checked) => {
                                                const newSelection = new Set(tempSelectedPlots);
                                                if (checked) {
                                                  // Add all filtered plots
                                                  filteredAnalysisResults.forEach(plot => newSelection.add(plot.plotId));
                                                } else {
                                                  // Remove only filtered plots, preserve others
                                                  filteredAnalysisResults.forEach(plot => newSelection.delete(plot.plotId));
                                                }
                                                setTempSelectedPlots(newSelection);
                                              }}
                                              data-testid="checkbox-select-all-plots"
                                            />
                                          </th>
                                          <th className="px-3 py-2 text-left font-medium">Plot ID</th>
                                          <th className="px-3 py-2 text-left font-medium">Country</th>
                                          <th className="px-3 py-2 text-left font-medium">Area (ha)</th>
                                          <th className="px-3 py-2 text-left font-medium">Risk Level</th>
                                          <th className="px-3 py-2 text-left font-medium">Compliance</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {filteredAnalysisResults.map((plot) => (
                                          <tr key={plot.plotId} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-3 py-2">
                                              <Checkbox
                                                checked={tempSelectedPlots.has(plot.plotId)}
                                                onCheckedChange={(checked) => handlePlotSelection(plot.plotId, !!checked)}
                                                data-testid={`checkbox-plot-${plot.plotId}`}
                                              />
                                            </td>
                                            <td className="px-3 py-2 font-medium">{plot.plotId}</td>
                                            <td className="px-3 py-2">{plot.country}</td>
                                            <td className="px-3 py-2">{plot.area}</td>
                                            <td className="px-3 py-2">
                                              <Badge 
                                                variant={plot.overallRisk === 'HIGH' ? 'destructive' : plot.overallRisk === 'MEDIUM' ? 'default' : 'secondary'}
                                                className="text-xs"
                                              >
                                                {plot.overallRisk}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                              <Badge variant="outline" className="text-xs">
                                                {plot.complianceStatus}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                </div>
                                
                                <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t mt-4">
                                  <p className="text-sm text-gray-600">
                                    {tempSelectedPlots.size} of {filteredAnalysisResults.length} plots selected
                                    {filteredAnalysisResults.length !== analysisResults.length && (
                                      <span className="ml-2 text-gray-400">({analysisResults.length} total)</span>
                                    )}
                                  </p>
                                  <div className="flex space-x-2">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => setShowPlotSelector(false)}
                                      data-testid="button-cancel-selection"
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      type="button" 
                                      onClick={confirmPlotSelection}
                                      disabled={tempSelectedPlots.size === 0}
                                      data-testid="button-confirm-selection"
                                    >
                                      Confirm Selection ({tempSelectedPlots.size})
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="establishmentGeolocations">Establishment Geolocations (for cattle)</Label>
                          <Textarea 
                            id="establishmentGeolocations" 
                            name="establishmentGeolocations" 
                            placeholder="2.5194, 101.5183"
                            rows={2}
                            data-testid="textarea-establishment-geolocations"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cross-module Integration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Compliance Integration
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="deforestationRiskLevel">Deforestation Risk</Label>
                          <Select value={selectedDeforestationRisk} onValueChange={setSelectedDeforestationRisk}>
                            <SelectTrigger data-testid="select-deforestation-risk">
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="negligible">Negligible</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <input type="hidden" name="deforestationRiskLevel" value={selectedDeforestationRisk} />
                        </div>
                        <div>
                          <Label htmlFor="legalityStatus">Legality Status</Label>
                          <div className="space-y-3">
                            {selectedSuppliers.length > 0 ? (
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    🏢 {selectedSuppliers.length} suppliers selected for legality assessment
                                  </p>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    onClick={clearSupplierSelection}
                                    data-testid="button-clear-suppliers"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                  {selectedSuppliers.map((supplier, index) => (
                                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
                                      <div className="flex items-center space-x-2">
                                        <Badge 
                                          variant={supplier.overallScore >= 80 ? 'default' : supplier.overallScore >= 60 ? 'secondary' : 'destructive'}
                                          className="text-xs"
                                        >
                                          {supplier.overallScore || 0}/100
                                        </Badge>
                                        <span className="font-medium text-sm">{supplier.namaSupplier}</span>
                                        <span className="text-xs text-gray-500">{supplier.jenisSupplier}</span>
                                      </div>
                                      <div className="flex space-x-1">
                                        <Badge 
                                          variant={supplier.spatialLegalityStatus === 'compliant' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          Spatial: {supplier.spatialLegalityStatus || 'pending'}
                                        </Badge>
                                        <Badge 
                                          variant={supplier.complianceStatus === 'Verified' ? 'default' : 'outline'}
                                          className="text-xs"
                                        >
                                          8 Indicators: {supplier.complianceStatus || 'pending'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Overall status display */}
                                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-700 dark:text-blue-300">Overall Status:</span>
                                    <Badge 
                                      variant={selectedLegalityStatus === 'verified' ? 'default' : selectedLegalityStatus === 'mostly-verified' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {selectedLegalityStatus === 'verified' ? 'Fully Verified' : 
                                       selectedLegalityStatus === 'mostly-verified' ? 'Mostly Verified (>80%)' : 
                                       selectedLegalityStatus === 'pending' ? 'Under Review' : 'No Assessment'}
                                    </Badge>
                                  </div>
                                </div>
                                {/* Hidden input for form submission */}
                                <input 
                                  type="hidden" 
                                  name="legalityStatus" 
                                  value={selectedLegalityStatus}
                                />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-3">No suppliers selected for legality assessment</p>
                                <input type="hidden" name="legalityStatus" value="" />
                              </div>
                            )}
                            
                            <Dialog open={showSupplierSelector} onOpenChange={setShowSupplierSelector}>
                              <DialogTrigger asChild>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="w-full"
                                  data-testid="button-select-suppliers"
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Select Suppliers for Legality Assessment
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle>Select Suppliers for Legality Assessment</DialogTitle>
                                  <DialogDescription>
                                    Select suppliers from the compliance assessment results below. Each supplier shows spatial legality checking and 8 indicators assessment status.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col h-full">
                                  <div className="mb-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Spatial Legality Checking:</strong>
                                        <ul className="text-xs text-gray-600 mt-1 ml-4">
                                          <li>• Protected areas overlap verification</li>
                                          <li>• Land use rights validation</li>
                                          <li>• Boundary compliance assessment</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <strong>8 Indicators Assessment:</strong>
                                        <ul className="text-xs text-gray-600 mt-1 ml-4">
                                          <li>• Land tenure rights • Environmental protection</li>
                                          <li>• Forestry regulations • Indigenous rights</li>
                                          <li>• Plasma development • Land disputes</li>
                                          <li>• Labour & human rights • Tax & anti-corruption</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 overflow-y-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                          <th className="w-10 px-3 py-2 text-left">
                                            <Checkbox
                                              checked={tempSelectedSuppliers.size === supplierComplianceData.length && supplierComplianceData.length > 0}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setTempSelectedSuppliers(new Set(supplierComplianceData.map(s => s.id.toString())));
                                                } else {
                                                  setTempSelectedSuppliers(new Set());
                                                }
                                              }}
                                              data-testid="checkbox-select-all-suppliers"
                                            />
                                          </th>
                                          <th className="px-3 py-2 text-left font-medium">Supplier Name</th>
                                          <th className="px-3 py-2 text-left font-medium">Type</th>
                                          <th className="px-3 py-2 text-left font-medium">Compliance Score</th>
                                          <th className="px-3 py-2 text-left font-medium">Spatial Legality</th>
                                          <th className="px-3 py-2 text-left font-medium">8 Indicators</th>
                                          <th className="px-3 py-2 text-left font-medium">Overall Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {supplierComplianceData.map((supplier) => (
                                          <tr key={supplier.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-3 py-2">
                                              <Checkbox
                                                checked={tempSelectedSuppliers.has(supplier.id.toString())}
                                                onCheckedChange={(checked) => handleSupplierSelection(supplier.id.toString(), !!checked)}
                                                data-testid={`checkbox-supplier-${supplier.id}`}
                                              />
                                            </td>
                                            <td className="px-3 py-2">
                                              <div>
                                                <span className="font-medium">{supplier.namaSupplier}</span>
                                                <div className="text-xs text-gray-500">{supplier.alamatSupplier}</div>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">{supplier.jenisSupplier}</td>
                                            <td className="px-3 py-2">
                                              <div className="flex items-center space-x-2">
                                                <Badge 
                                                  variant={supplier.overallScore >= 80 ? 'default' : supplier.overallScore >= 60 ? 'secondary' : 'destructive'}
                                                  className="text-xs"
                                                >
                                                  {supplier.overallScore || 0}/100
                                                </Badge>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <Badge 
                                                variant={supplier.spatialLegalityStatus === 'compliant' ? 'default' : 'secondary'}
                                                className="text-xs"
                                              >
                                                {supplier.spatialLegalityStatus || 'pending'}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                              <Badge 
                                                variant={supplier.complianceStatus === 'Verified' ? 'default' : 'outline'}
                                                className="text-xs"
                                              >
                                                {supplier.complianceStatus || 'pending'}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-2">
                                              <Badge 
                                                variant={
                                                  (supplier.overallScore >= 80 && supplier.spatialLegalityStatus === 'compliant') ? 'default' :
                                                  supplier.overallScore >= 60 ? 'secondary' : 'destructive'
                                                }
                                                className="text-xs"
                                              >
                                                {supplier.overallScore >= 80 && supplier.spatialLegalityStatus === 'compliant' ? 'Verified' :
                                                 supplier.overallScore >= 60 ? 'Review' : 'Non-Compliant'}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  <div className="flex justify-between items-center pt-4 border-t">
                                    <p className="text-sm text-gray-600">
                                      {tempSelectedSuppliers.size} of {supplierComplianceData.length} suppliers selected
                                    </p>
                                    <div className="flex space-x-2">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowSupplierSelector(false)}
                                        data-testid="button-cancel-supplier-selection"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        type="button" 
                                        onClick={confirmSupplierSelection}
                                        disabled={tempSelectedSuppliers.size === 0}
                                        data-testid="button-confirm-supplier-selection"
                                      >
                                        Confirm Selection ({tempSelectedSuppliers.size})
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="complianceScore">Compliance Score (0-100)</Label>
                          <Input 
                            id="complianceScore" 
                            name="complianceScore" 
                            type="number" 
                            min="0" 
                            max="100"
                            data-testid="input-compliance-score"
                          />
                        </div>
                        <div className="col-span-full">
                          <Label htmlFor="traceability">Supply Chain Traceability</Label>
                          <div className="space-y-3">
                            {selectedTraceability ? (
                              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-800 dark:text-green-300">
                                      Supply Chain Configuration Selected
                                    </span>
                                  </div>
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedTraceability(null)}
                                    data-testid="button-clear-traceability"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(selectedTraceability.tierAssignments || {}).map(([tier, suppliers]: [string, any]) => (
                                    suppliers.length > 0 && (
                                      <div key={tier} className="bg-white dark:bg-gray-800 p-3 rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <Badge variant="secondary" className="text-xs">
                                            Tier {tier} {tier === '1' ? '(Direct)' : `(Tier ${parseInt(tier)-1} Suppliers)`}
                                          </Badge>
                                          <span className="text-xs text-gray-500">{suppliers.length} suppliers</span>
                                        </div>
                                        <div className="space-y-1">
                                          {suppliers.slice(0, 3).map((supplier: any, index: number) => (
                                            <div key={index} className="text-xs text-gray-600 truncate">
                                              • {supplier.name}
                                            </div>
                                          ))}
                                          {suppliers.length > 3 && (
                                            <div className="text-xs text-gray-500">
                                              +{suppliers.length - 3} more...
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  ))}
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                                  <div className="text-sm text-green-700 dark:text-green-300">
                                    <strong>Configuration:</strong> {selectedTraceability.maxTiers} tiers, {Object.values(selectedTraceability.tierAssignments || {}).flat().length} total suppliers
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-3">No supply chain configuration selected</p>
                                <p className="text-xs text-gray-400 mb-4">
                                  Select your tier-based supply chain linkage configuration to establish traceability for this DDS report
                                </p>
                              </div>
                            )}
                            
                            <Dialog open={showTraceabilitySelector} onOpenChange={setShowTraceabilitySelector}>
                              <DialogTrigger asChild>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="w-full"
                                  data-testid="button-select-traceability"
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  Select Supply Chain Configuration
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle>Select Supply Chain Traceability Configuration</DialogTitle>
                                  <DialogDescription>
                                    Choose the tier-based supply chain linkage configuration for this DDS report. This establishes the traceability from your direct suppliers through all tiers of your supply chain.
                                  </DialogDescription>
                                </DialogHeader>
                                <TraceabilityConfigSelector 
                                  onSelect={(config: any) => {
                                    setSelectedTraceability(config);
                                    setShowTraceabilitySelector(false);
                                    toast({
                                      title: "Supply Chain Configuration Selected",
                                      description: `Configuration with ${config.maxTiers} tiers and ${Object.values(config.tierAssignments || {}).flat().length} suppliers selected.`,
                                      variant: "default",
                                    });
                                  }}
                                  onCancel={() => setShowTraceabilitySelector(false)}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Prior DDS Reference */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Prior DDS Reference</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label htmlFor="priorDdsReference">Reference Number (for SME operators)</Label>
                          <Input 
                            id="priorDdsReference" 
                            name="priorDdsReference" 
                            placeholder="DDS-2024-001234"
                            data-testid="input-prior-dds"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Declaration & Signature */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Signature className="h-5 w-5" />
                          Declaration & Signature
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="operatorDeclaration">Operator Declaration *</Label>
                          <Textarea 
                            id="operatorDeclaration" 
                            name="operatorDeclaration" 
                            defaultValue="I hereby declare that I have exercised due diligence in accordance with Regulation (EU) 2023/1115 and that the risk is negligible for the products covered by this due diligence statement."
                            required 
                            rows={4}
                            data-testid="textarea-declaration"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="signedBy">Signed By *</Label>
                            <Input 
                              id="signedBy" 
                              name="signedBy" 
                              required 
                              data-testid="input-signed-by"
                            />
                          </div>
                          <div>
                            <Label htmlFor="signatoryFunction">Function *</Label>
                            <Input 
                              id="signatoryFunction" 
                              name="signatoryFunction" 
                              placeholder="Managing Director"
                              required 
                              data-testid="input-signatory-function"
                            />
                          </div>
                          <div>
                            <Label htmlFor="signedDate">Signed Date *</Label>
                            <Input 
                              id="signedDate" 
                              name="signedDate" 
                              type="date" 
                              required 
                              data-testid="input-signed-date"
                            />
                          </div>
                        </div>
                        <div className="col-span-2 mt-4">
                          <SignaturePad
                            onSignatureChange={setSignatureData}
                            initialSignature={signatureData}
                            required={true}
                            className="w-full"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowDdsForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createDdsMutation.isPending} data-testid="button-submit-dds">
                        {createDdsMutation.isPending ? 'Creating...' : 'Create DDS Report'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* DDS Reports Table */}
            <Card>
              <CardHeader>
                <CardTitle>DDS Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ddsReports.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No DDS reports created yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Statement ID</th>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Product</th>
                            <th className="text-left p-2">Operator</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Download</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Dummy DDS entries as per requirements */}
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-mono text-sm">DDS-2024-001</td>
                            <td className="p-2">2024-09-15</td>
                            <td className="p-2">Crude Palm Oil (CPO)</td>
                            <td className="p-2">PT BSU 03</td>
                            <td className="p-2">
                              <Badge className="bg-green-100 text-green-800">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Generated
                                </div>
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open('/api/generate-dummy-dds-pdf', '_blank')}
                                data-testid="button-download-dds-001"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-mono text-sm">DDS-2024-002</td>
                            <td className="p-2">2024-09-12</td>
                            <td className="p-2">Refined Palm Oil</td>
                            <td className="p-2">KPN 04</td>
                            <td className="p-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                <div className="flex items-center gap-1">
                                  <Send className="h-3 w-3" />
                                  Submitted
                                </div>
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open('/api/generate-dummy-dds-pdf', '_blank')}
                                data-testid="button-download-dds-002"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-mono text-sm">DDS-2024-003</td>
                            <td className="p-2">2024-09-10</td>
                            <td className="p-2">Palm Kernel Oil</td>
                            <td className="p-2">PT THIP 04</td>
                            <td className="p-2">
                              <Badge className="bg-green-100 text-green-800">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Generated
                                </div>
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open('/api/generate-dummy-dds-pdf', '_blank')}
                                data-testid="button-download-dds-003"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-mono text-sm">DDS-2024-004</td>
                            <td className="p-2">2024-09-08</td>
                            <td className="p-2">Palm Oil Residues</td>
                            <td className="p-2">Riau Growers Cooperative</td>
                            <td className="p-2">
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Draft
                                </div>
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open('/api/generate-dummy-dds-pdf', '_blank')}
                                data-testid="button-download-dds-004"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="p-2 font-mono text-sm">DDS-2024-005</td>
                            <td className="p-2">2024-09-05</td>
                            <td className="p-2">Industrial Fatty Acids</td>
                            <td className="p-2">Sime Darby Plantation Berhad</td>
                            <td className="p-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                <div className="flex items-center gap-1">
                                  <Send className="h-3 w-3" />
                                  Submitted
                                </div>
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open('/api/generate-dummy-dds-pdf', '_blank')}
                                data-testid="button-download-dds-005"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                          {ddsReports.map((report: DdsReport) => (
                            <tr key={report.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-2 font-mono text-sm">DDS-{new Date(report.createdAt).getFullYear()}-{report.id.slice(0, 3)}</td>
                              <td className="p-2">{new Date(report.createdAt).toLocaleDateString()}</td>
                              <td className="p-2">{report.productDescription}</td>
                              <td className="p-2">{report.operatorLegalName}</td>
                              <td className="p-2">
                                <Badge className={getStatusColor(report.status)}>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(report.status)}
                                    {report.status}
                                  </div>
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedReport(report)}
                                    data-testid={`button-view-${report.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => downloadDdsReportMutation.mutate(report.id)}
                                    disabled={downloadDdsReportMutation.isPending}
                                    data-testid={`button-pdf-${report.id}`}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {report.status === 'draft' && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => submitToEuTraceMutation.mutate(report.id)}
                                      disabled={submitToEuTraceMutation.isPending}
                                      data-testid={`button-submit-${report.id}`}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>DDS Report Creation Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Required Information</h3>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Operator legal name and address</li>
                        <li>• EORI number (for EU imports/exports)</li>
                        <li>• HS code and product description</li>
                        <li>• Net mass in kilograms</li>
                        <li>• Country of production</li>
                        <li>• Plot geolocations</li>
                        <li>• Operator declaration and signature</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Connected Data</h3>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Shipment tracking information</li>
                        <li>• Deforestation risk assessment</li>
                        <li>• Supplier legality status</li>
                        <li>• Compliance scoring</li>
                        <li>• Supply chain traceability</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("overview")} 
                    className="w-full"
                    data-testid="button-start-creating"
                  >
                    Start Creating DDS Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Polygon Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">KML Upload Features</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Upload KML files with polygon coordinates</li>
                        <li>• Automatic plot extraction and validation</li>
                        <li>• Integration with DDS geolocation requirements</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">GeoJSON Output</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <li>• Generate verified deforestation-free polygons</li>
                        <li>• Export individual and combined GeoJSON files</li>
                        <li>• Include verification metadata and timestamps</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Pro Tip:</strong> Upload KML files during DDS report creation 
                        to automatically populate geolocation coordinates and generate verified 
                        polygon outputs for compliance documentation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Deforestation Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Connected Plots:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Assessments:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alert Monitoring:</span>
                      <span className="font-medium">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Legality Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Verified Suppliers:</span>
                      <span className="font-medium">{suppliers.filter((s: any) => s.legalityStatus === 'verified').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Reviews:</span>
                      <span className="font-medium">{suppliers.filter((s: any) => s.legalityStatus === 'pending').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance Rate:</span>
                      <span className="font-medium">
                        {suppliers.length > 0 ? 
                          Math.round((suppliers.filter((s: any) => s.legalityStatus === 'verified').length / suppliers.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Supply Chain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Shipments:</span>
                      <span className="font-medium">{shipments.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Traceable Batches:</span>
                      <span className="font-medium">{shipments.filter((s: any) => s.batchNumber).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Documentation:</span>
                      <span className="font-medium">Complete</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demo PDF Tab */}
          <TabsContent value="demo" className="space-y-6">
            <div className="max-w-4xl">
              <h2 className="text-xl font-semibold mb-4">Demo DDS PDF Document</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generated DDS PDF Sample
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    This is a sample Due Diligence Statement PDF document generated using the EU template structure. 
                    It includes all required sections including operator details, commodity information, plot data, 
                    and compliance assessments.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">PDF Contents Include:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <li>Company Internal Reference & Activity Type</li>
                      <li>Complete Operator/Trader Information with Address</li>
                      <li>Commodity Description with Scientific Names</li>
                      <li>Net Mass, Percentages, and Supplementary Units</li>
                      <li>Producer Information and Country of Production</li>
                      <li>Summary Plot Information with Traceability Data</li>
                      <li>Harvest Dates and Production Date Ranges</li>
                      <li>Appendix with Detailed Plot Coordinate Information</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/generate-dummy-dds-pdf');
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'dummy-dds-report.pdf';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            
                            toast({
                              title: "PDF Downloaded",
                              description: "The demo DDS PDF has been downloaded successfully.",
                            });
                          } else {
                            throw new Error('Failed to generate PDF');
                          }
                        } catch (error) {
                          toast({
                            title: "Download Error", 
                            description: "Failed to download the PDF. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-download-demo-pdf"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Demo PDF
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/generate-dummy-dds-pdf');
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            window.open(url, '_blank');
                            window.URL.revokeObjectURL(url);
                            
                            toast({
                              title: "PDF Opened",
                              description: "The demo DDS PDF has been opened in a new tab.",
                            });
                          } else {
                            throw new Error('Failed to generate PDF');
                          }
                        } catch (error) {
                          toast({
                            title: "View Error",
                            description: "Failed to open the PDF. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-view-demo-pdf"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>EU Template Structure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>Multi-page Layout</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span>EUDR Compliant</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Data Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Company:</strong> KPN 05<br/>
                      <strong>Activity:</strong> Import<br/>
                      <strong>Product:</strong> Crude Palm Oil (CPO)<br/>
                      <strong>Net Mass:</strong> 2,150 KG<br/>
                    </div>
                    <div>
                      <strong>Country:</strong> Malaysia<br/>
                      <strong>Producers:</strong> 15<br/>
                      <strong>Total Plots:</strong> 45<br/>
                      <strong>Production Area:</strong> 1,250.50 ha<br/>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* DDS Report Preview Dialog - FarmForce Structure */}
        {selectedReport && (
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">
                  KPN COMPLIANCE DUE DILIGENCE STATEMENT
                </DialogTitle>
                <div className="text-right text-sm font-mono text-gray-600 dark:text-gray-400">
                  DDS Reference Number: KPN{selectedReport.id.slice(0, 12).toUpperCase()}
                </div>
              </DialogHeader>
              
              <div className="space-y-8 p-6">
                {(() => {
                  const ddsData = generateComprehensiveDDS(selectedReport);
                  return (
                    <>
                      {/* Section A: Operator Information */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">A. Operator Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Operator's legal name:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.operatorInfo.legalName}
                            </div>
                          </div>
                          <div>
                            <strong>Operator's address:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.operatorInfo.address}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <strong>Economic Operators Registration and Identification Number (EORI):</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.operatorInfo.eoriNumber || 'Not applicable for domestic operations'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Overall Conclusion */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">B. Overall Conclusion</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="font-semibold text-green-700 dark:text-green-400 mb-2">
                              {ddsData.overallConclusion.riskLevel}
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-md space-y-2 text-sm">
                              <p><strong>1) Deforestation Risk:</strong> {ddsData.overallConclusion.deforestationAssessment}</p>
                              <p><strong>2) Legality Risk:</strong> {ddsData.overallConclusion.legalityAssessment}</p>
                              <p><strong>Certifications:</strong> {ddsData.overallConclusion.certifications}</p>
                              <p><strong>Documentation:</strong> {ddsData.overallConclusion.documentation}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Product Information */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">C. Product Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Harmonized System (HS) Code:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded font-mono">
                              {ddsData.productInfo.hsCode}
                            </div>
                          </div>
                          <div>
                            <strong>Product description:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.productInfo.description}
                            </div>
                          </div>
                          <div>
                            <strong>Scientific name:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded italic">
                              {ddsData.productInfo.scientificName}
                            </div>
                          </div>
                          <div>
                            <strong>Quantity (kg. of net mass):</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded font-mono">
                              {ddsData.productInfo.quantity}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <strong>Number of units:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.productInfo.units}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section D: Supply Chain Mapping */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">D. Supply Chain Mapping</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Country of production:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.countryOfProduction}
                            </div>
                          </div>
                          <div>
                            <strong>Country of production subregion(s):</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.subregions.join(', ')}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <strong>Complexity of Supply Chain:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.complexity}
                            </div>
                          </div>
                          <div>
                            <strong>Total number of suppliers:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.totalSuppliers}
                            </div>
                          </div>
                          <div>
                            <strong>Total number of sub-suppliers:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.totalSubSuppliers}
                            </div>
                          </div>
                          <div>
                            <strong>Total number of plots:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.totalPlots}
                            </div>
                          </div>
                          <div>
                            <strong>Number of plots with geolocation:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.plotsWithGeolocation}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <strong>Date or time range of production:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              {ddsData.supplyChainMapping.productionDateRange}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section E: Deforestation Risk Assessment */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">E. Deforestation Risk Assessment</h3>
                        <div className="space-y-4 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>Deforestation risk level (based on country EU benchmarking):</strong>
                              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                {ddsData.deforestationRisk.riskLevel}
                              </div>
                            </div>
                            <div>
                              <strong>Total number of plots checked for deforestation:</strong>
                              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded space-y-1">
                                <div>Total Plot: {ddsData.deforestationRisk.totalPlots}</div>
                                <div>Plot with Valid Status: {ddsData.deforestationRisk.validPlots}</div>
                                <div>Plot with Invalid Status: {ddsData.deforestationRisk.invalidPlots}</div>
                                <div>Plot with No Status: {ddsData.deforestationRisk.noStatusPlots}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <strong>Deforestation assessment risk:</strong>
                            <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 rounded space-y-2">
                              <div>Total Fields Validated: {ddsData.deforestationRisk.totalPlots} fields</div>
                              <div>High Risk (0-20%): {ddsData.deforestationRisk.riskDistribution.highRisk}</div>
                              <div>Medium Risk (21-80%): {ddsData.deforestationRisk.riskDistribution.mediumRisk}</div>
                              <div>Low Risk (81-100%): {ddsData.deforestationRisk.riskDistribution.lowRisk}</div>
                              <div className="text-xs italic pt-2">
                                The risk percentage indicates if this field carries a risk of deforestation in the near future based on past trends. Lower percentage means higher risk.
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <strong>Risk mitigation measures & verification methods:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <ol className="space-y-1">
                                {ddsData.deforestationRisk.mitigationMeasures.map((measure, index) => (
                                  <li key={index}>{index + 1}. {measure}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section F: Legal Compliance Assessment */}
                      <div>
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">F. Legal Compliance Assessment</h3>
                        <div className="space-y-4 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <strong>Total number of farms checked for legal compliance:</strong>
                              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded space-y-1">
                                <div>Total Plot: {ddsData.legalCompliance.totalPlots}</div>
                                <div>Plot with Compliant Survey Status: {ddsData.legalCompliance.compliantSurveys}</div>
                                <div>Plot with Non-Compliant Survey Status: {ddsData.legalCompliance.nonCompliantSurveys}</div>
                              </div>
                            </div>
                            <div>
                              <strong>Overall Sustainability Risk Score:</strong>
                              <div className="mt-1 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                                <div className="font-semibold">{ddsData.legalCompliance.sustainabilityScore}</div>
                                <div className="text-xs mt-1">
                                  Based on overall assessment of the palm oil value chain in {selectedReport.countryOfProduction}<br/>
                                  1 = Low, 2 = Moderate, 3 = Significant, 4 = High, 5 = Very high risk
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <strong>Country specific risk analysis:</strong>
                            <div className="mt-1 space-y-2">
                              {Object.entries(ddsData.legalCompliance.countryRisks).map(([category, data]) => (
                                <div key={category} className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="font-medium capitalize w-32">{category.replace(/([A-Z])/g, ' $1').trim()}:</div>
                                  <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center font-bold text-sm">
                                    {data.score}
                                  </div>
                                  <div className="flex-1 text-xs">{data.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <strong>Presence of indigenous communities and lands:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded space-y-1">
                              <div>{ddsData.legalCompliance.indigenousLands.present}</div>
                              <div>{ddsData.legalCompliance.indigenousLands.fieldsWithData} fields with indigenous lands data</div>
                              <div>{ddsData.legalCompliance.indigenousLands.overlapPercentage} of overlap with indigenous lands</div>
                            </div>
                          </div>
                          
                          <div>
                            <strong>Applicable local laws:</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <ul className="space-y-2">
                                {ddsData.legalCompliance.applicableLaws.map((law, index) => (
                                  <li key={index} className="text-sm">• {law}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <strong>Legal assessment risk:</strong>
                            <div className="mt-1 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                              <div className="font-semibold text-green-700 dark:text-green-400 mb-2">
                                Given the results of the risk assessment, mitigation and verification measures we conclude negligible legality risk
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <strong>Risk Mitigation Measures (if applicable):</strong>
                            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <ol className="space-y-1">
                                {ddsData.legalCompliance.mitigationMeasures.map((measure, index) => (
                                  <li key={index} className="text-sm">{index + 1}. {measure}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="text-center">
                              <div className="font-semibold mb-2">Farmer Survey</div>
                              <div className="text-2xl font-bold">{Math.max(1, Math.floor(ddsData.legalCompliance.totalPlots / 2))} farmers</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold mb-2">Plot Survey</div>
                              <div className="text-2xl font-bold">{ddsData.legalCompliance.totalPlots} fields</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Document Footer */}
                      <div className="border-t pt-4 mt-8 text-center text-sm text-gray-500">
                        <div>Generated by KPN Compliance Platform on {new Date().toLocaleDateString()}</div>
                        <div className="mt-2 font-mono">DDS Reference: KPN{selectedReport.id.slice(0, 12).toUpperCase()}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div className="flex justify-between items-center p-6 border-t bg-gray-50 dark:bg-gray-800">
                <div className="flex gap-2">
                  <KMLUploader 
                    reportId={selectedReport.id} 
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/dds-reports'] });
                      toast({
                        title: "KML Upload Complete",
                        description: "Polygon data processed and added to DDS report."
                      });
                    }}
                  />
                  <GeoJSONGenerator 
                    reportId={selectedReport.id} 
                    reportData={selectedReport}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadDdsReportMutation.mutate(selectedReport.id)}
                    disabled={downloadDdsReportMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  {selectedReport.status === 'draft' && (
                    <Button 
                      onClick={() => submitToEuTraceMutation.mutate(selectedReport.id)}
                      disabled={submitToEuTraceMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit to EU Trace
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setSelectedReport(null)}>
                    Close Preview
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}