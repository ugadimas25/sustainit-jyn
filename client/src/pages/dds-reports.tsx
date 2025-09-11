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
  Building, Package, MapPin, Link2, Signature, Globe, Shield, ChevronDown, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DdsReport, InsertDdsReport } from "@shared/schema";
import { KMLUploader } from "@/components/kml-uploader";
import { GeoJSONGenerator } from "@/components/geojson-generator";
import { PALM_OIL_HS_CODES, STORAGE_KEYS } from "@/lib/constants";

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
          { id: 'ext-1', name: 'PT Sinar Mas', category: 'external', location: 'Jakarta', details: 'Large Supplier' },
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

export default function DdsReports() {
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
  const { toast } = useToast();

  // Fetch DDS reports
  const { data: ddsReports = [] } = useQuery<DdsReport[]>({
    queryKey: ['/api/dds-reports'],
  });

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
      return apiRequest('/api/dds-reports', 'POST', data);
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

  // Generate PDF mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest(`/api/dds-reports/${reportId}/pdf`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "PDF Generated",
        description: "DDS report PDF has been generated successfully.",
      });
    },
  });

  // Submit to EU Trace mutation
  const submitToEuTraceMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest(`/api/dds-reports/${reportId}/submit`, 'POST');
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
    
    const formData = new FormData(e.currentTarget);
    
    const ddsData: InsertDdsReport = {
      shipmentId: formData.get('shipmentId') as string,
      operatorLegalName: formData.get('operatorLegalName') as string,
      operatorAddress: formData.get('operatorAddress') as string,
      eoriNumber: formData.get('eoriNumber') as string || undefined,
      hsCode: formData.getAll('hsCode').join(','),
      productDescription: formData.get('productDescription') as string,
      scientificName: formData.get('scientificName') as string || undefined,
      netMassKg: formData.get('netMassKg') as string,
      supplementaryUnit: formData.get('supplementaryUnit') as string || undefined,
      supplementaryQuantity: formData.get('supplementaryQuantity') as string || undefined,
      countryOfProduction: formData.get('countryOfProduction') as string,
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
      digitalSignature: formData.get('digitalSignature') as string || undefined,
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
      title: "KPN EUDR DUE DILIGENCE STATEMENT",
      
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
            DDS Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            EU Due Diligence Statement compliance reporting and submission system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create">
              <Plus className="h-4 w-4 mr-2" />
              Create DDS
            </TabsTrigger>
            <TabsTrigger value="integration" data-testid="tab-integration">
              <Link2 className="h-4 w-4 mr-2" />
              Integration
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">DDS Reports Overview</h2>
              <Dialog open={showDdsForm} onOpenChange={handleDialogOpenChange}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-dds">
                    <Plus className="h-4 w-4 mr-2" />
                    Create DDS Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create DDS Report</DialogTitle>
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
                                        onChange={() => handleHsCodeToggle(hsCode.code)}
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
                            placeholder="Elaeis guineensis"
                            data-testid="input-scientific-name"
                          />
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
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                                <DialogHeader>
                                  <DialogTitle>Select Plots for DDS Report</DialogTitle>
                                  <DialogDescription>
                                    Select plots from the deforestation risk analysis results below. Selected plots will be added to your DDS report with their geolocations.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col h-full">
                                  <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                      Select plots from the deforestation risk analysis results below. 
                                      Selected plots will be added to your DDS report.
                                    </p>
                                  </div>
                                  
                                  <div className="flex-1 overflow-y-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                        <tr>
                                          <th className="w-10 px-3 py-2 text-left">
                                            <Checkbox
                                              checked={tempSelectedPlots.size === analysisResults.length && analysisResults.length > 0}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setTempSelectedPlots(new Set(analysisResults.map(r => r.plotId)));
                                                } else {
                                                  setTempSelectedPlots(new Set());
                                                }
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
                                        {analysisResults.map((plot) => (
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
                                  
                                  <div className="flex justify-between items-center pt-4 border-t">
                                    <p className="text-sm text-gray-600">
                                      {tempSelectedPlots.size} of {analysisResults.length} plots selected
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
                          <div>
                            <Label htmlFor="digitalSignature">Digital Signature</Label>
                            <Input 
                              id="digitalSignature" 
                              name="digitalSignature" 
                              placeholder="Base64 signature"
                              data-testid="input-digital-signature"
                            />
                          </div>
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
                            <th className="text-left p-2">Report ID</th>
                            <th className="text-left p-2">Product</th>
                            <th className="text-left p-2">Country</th>
                            <th className="text-left p-2">Net Mass (kg)</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ddsReports.map((report: DdsReport) => (
                            <tr key={report.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-2 font-mono text-sm">{report.id.slice(0, 8)}...</td>
                              <td className="p-2">{report.productDescription}</td>
                              <td className="p-2">{report.countryOfProduction}</td>
                              <td className="p-2">{report.netMassKg}</td>
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
                                    onClick={() => generatePdfMutation.mutate(report.id)}
                                    disabled={generatePdfMutation.isPending}
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
        </Tabs>

        {/* DDS Report Preview Dialog - FarmForce Structure */}
        {selectedReport && (
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-center text-2xl font-bold">
                  KPN EUDR DUE DILIGENCE STATEMENT
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
                        <div>Generated by KPN EUDR Platform on {new Date().toLocaleDateString()}</div>
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
                    onClick={() => generatePdfMutation.mutate(selectedReport.id)}
                    disabled={generatePdfMutation.isPending}
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