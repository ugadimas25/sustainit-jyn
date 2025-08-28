import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  MapPin,
  Leaf,
  TreePine,
  Users,
  Scale,
  Heart,
  DollarSign,
  FileText,
  Upload,
  Save,
  Send,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Building
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// EUDR Legality Assessment Form Structure
interface EUDRLegalityForm {
  // Supplier/Business Details
  supplierType: "Estate" | "Mill" | "Bulking Station" | "KCP" | "Smallholder" | "Other";
  supplierName: string;
  supplierID: string;
  location: string;
  ownership: string;
  contactDetails: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  
  // Status and metadata
  status: "Draft" | "In Progress" | "Submitted" | "Under Review" | "Complete";
  assignedAuditor?: string;
  lastUpdated: Date;
  
  // 1. Land Tenure
  landTenure: {
    landTitleNumber?: string;
    titleIssuanceDate?: Date;
    tenureType: "HGU" | "HGB" | "State Forest Permit" | "Customary Land" | "Other";
    landArea: number; // hectares
    gpsCoordinates?: string;
    plotMapReference?: string;
    documents: UploadedFile[];
  };
  
  // 2. Environmental Laws
  environmental: {
    permitType: "AMDAL" | "UKL-UPL" | "SPPL" | "None Required";
    permitNumber?: string;
    issuanceYear?: number;
    environmentalStatus: "AMDAL" | "UKL-UPL" | "SPPL";
    monitoringReportDetails?: string;
    documents: UploadedFile[];
  };
  
  // 3. Forest-Related Regulations
  forestRegulations: {
    forestLicenseNumber?: string;
    forestStatus: "Ex-Forest Area" | "Forest Area" | "Non-Forest Area";
    impactAssessmentID?: string;
    protectedAreaStatus: boolean;
    documents: UploadedFile[];
  };
  
  // 4. Third-Party Rights (including FPIC)
  thirdPartyRights: {
    fpicStatus: boolean;
    fpicDate?: Date;
    communalRights: boolean;
    landConflict: boolean;
    conflictDescription?: string;
    communityPermits: number;
    documents: UploadedFile[];
  };
  
  // 5. Labour
  labour: {
    employeeCount: number;
    permanentEmployees: number;
    contractualEmployees: number;
    hasWorkerContracts: boolean;
    bpjsKetenagakerjaanNumber?: string;
    bpjsKesehatanNumber?: string;
    lastK3AuditDate?: Date;
    documents: UploadedFile[];
  };
  
  // 6. Human Rights
  humanRights: {
    policyAdherence: boolean;
    grievanceRecords: boolean;
    grievanceDescription?: string;
    certification?: string;
    humanRightsViolations: boolean;
    documents: UploadedFile[];
  };
  
  // 7. Tax/Anti-Corruption
  taxAntiCorruption: {
    npwpNumber?: string; // 15 digits
    lastTaxReturnYear?: number;
    pbbPaymentProof: boolean;
    antiBriberyPolicy: boolean;
    codeOfEthics: boolean;
    whistleblowerMechanism: boolean;
    documents: UploadedFile[];
  };
  
  // 8. Other National Laws
  otherLaws: {
    tradeLicenses: string[];
    corporateRegistration?: string;
    customsRegistration?: string;
    dinasAgricultureRegistry?: string;
    businessLicense?: string;
    documents: UploadedFile[];
  };
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  description?: string;
  url: string;
}

const SUPPLIER_TYPES = [
  "Estate",
  "Mill", 
  "Bulking Station",
  "KCP",
  "Smallholder",
  "Other"
];

const TENURE_TYPES = [
  "HGU",
  "HGB", 
  "State Forest Permit",
  "Customary Land",
  "Other"
];

const ENVIRONMENTAL_PERMITS = [
  "AMDAL",
  "UKL-UPL",
  "SPPL",
  "None Required"
];

export default function LegalityAssessmentPage() {
  const [activeTab, setActiveTab] = useState("supplier-details");
  const [form, setForm] = useState<EUDRLegalityForm>({
    supplierType: "Estate",
    supplierName: "",
    supplierID: "",
    location: "",
    ownership: "",
    contactDetails: {
      name: "",
      position: "",
      email: "",
      phone: ""
    },
    status: "Draft",
    lastUpdated: new Date(),
    landTenure: {
      tenureType: "HGU",
      landArea: 0,
      documents: []
    },
    environmental: {
      permitType: "AMDAL",
      environmentalStatus: "AMDAL",
      documents: []
    },
    forestRegulations: {
      forestStatus: "Non-Forest Area",
      protectedAreaStatus: false,
      documents: []
    },
    thirdPartyRights: {
      fpicStatus: false,
      communalRights: false,
      landConflict: false,
      communityPermits: 0,
      documents: []
    },
    labour: {
      employeeCount: 0,
      permanentEmployees: 0,
      contractualEmployees: 0,
      hasWorkerContracts: false,
      documents: []
    },
    humanRights: {
      policyAdherence: false,
      grievanceRecords: false,
      humanRightsViolations: false,
      documents: []
    },
    taxAntiCorruption: {
      pbbPaymentProof: false,
      antiBriberyPolicy: false,
      codeOfEthics: false,
      whistleblowerMechanism: false,
      documents: []
    },
    otherLaws: {
      tradeLicenses: [],
      documents: []
    }
  });

  const { toast } = useToast();

  // Transform frontend form to backend schema
  const transformToBackendSchema = (frontendData: EUDRLegalityForm) => {
    return {
      supplierType: frontendData.supplierType,
      supplierName: frontendData.supplierName,
      supplierID: frontendData.supplierID,
      location: frontendData.location,
      ownership: frontendData.ownership || "",
      contactName: frontendData.contactDetails.name || "",
      contactPosition: frontendData.contactDetails.position || "",
      contactEmail: frontendData.contactDetails.email || "",
      contactPhone: frontendData.contactDetails.phone || "",
      status: frontendData.status,
      
      // Land tenure
      landTitleNumber: frontendData.landTenure.landTitleNumber || "",
      titleIssuanceDate: frontendData.landTenure.titleIssuanceDate ? new Date(frontendData.landTenure.titleIssuanceDate).toISOString().split('T')[0] : null,
      tenureType: frontendData.landTenure.tenureType,
      landArea: frontendData.landTenure.landArea.toString(),
      gpsCoordinates: frontendData.landTenure.gpsCoordinates || "",
      plotMapReference: frontendData.landTenure.plotMapReference || "",
      landTenureDocuments: frontendData.landTenure.documents || [],
      
      // Environmental
      permitType: frontendData.environmental.permitType,
      permitNumber: frontendData.environmental.permitNumber || "",
      issuanceYear: frontendData.environmental.issuanceYear || null,
      environmentalStatus: frontendData.environmental.environmentalStatus,
      monitoringReportDetails: frontendData.environmental.monitoringReportDetails || "",
      environmentalDocuments: frontendData.environmental.documents || [],
      
      // Forest
      forestLicenseNumber: frontendData.forestRegulations.forestLicenseNumber || "",
      forestStatus: frontendData.forestRegulations.forestStatus,
      impactAssessmentID: frontendData.forestRegulations.impactAssessmentID || "",
      protectedAreaStatus: frontendData.forestRegulations.protectedAreaStatus || false,
      forestDocuments: frontendData.forestRegulations.documents || [],
      
      // Third-party rights
      fpicStatus: frontendData.thirdPartyRights.fpicStatus || false,
      fpicDate: frontendData.thirdPartyRights.fpicDate ? new Date(frontendData.thirdPartyRights.fpicDate).toISOString().split('T')[0] : null,
      communalRights: frontendData.thirdPartyRights.communalRights || false,
      landConflict: frontendData.thirdPartyRights.landConflict || false,
      conflictDescription: frontendData.thirdPartyRights.conflictDescription || "",
      communityPermits: frontendData.thirdPartyRights.communityPermits || 0,
      thirdPartyDocuments: frontendData.thirdPartyRights.documents || [],
      
      // Labour
      employeeCount: frontendData.labour.employeeCount || 0,
      permanentEmployees: frontendData.labour.permanentEmployees || 0,
      contractualEmployees: frontendData.labour.contractualEmployees || 0,
      hasWorkerContracts: frontendData.labour.hasWorkerContracts || false,
      bpjsKetenagakerjaanNumber: frontendData.labour.bpjsKetenagakerjaanNumber || "",
      bpjsKesehatanNumber: frontendData.labour.bpjsKesehatanNumber || "",
      lastK3AuditDate: frontendData.labour.lastK3AuditDate ? new Date(frontendData.labour.lastK3AuditDate).toISOString().split('T')[0] : null,
      labourDocuments: frontendData.labour.documents || [],
      
      // Human rights
      policyAdherence: frontendData.humanRights.policyAdherence || false,
      grievanceRecords: frontendData.humanRights.grievanceRecords || false,
      grievanceDescription: frontendData.humanRights.grievanceDescription || "",
      certification: frontendData.humanRights.certification || "",
      humanRightsViolations: frontendData.humanRights.humanRightsViolations || false,
      humanRightsDocuments: frontendData.humanRights.documents || [],
      
      // Tax/Anti-corruption
      npwpNumber: frontendData.taxAntiCorruption.npwpNumber || "",
      lastTaxReturnYear: frontendData.taxAntiCorruption.lastTaxReturnYear || null,
      pbbPaymentProof: frontendData.taxAntiCorruption.pbbPaymentProof || false,
      antiBriberyPolicy: frontendData.taxAntiCorruption.antiBriberyPolicy || false,
      codeOfEthics: frontendData.taxAntiCorruption.codeOfEthics || false,
      whistleblowerMechanism: frontendData.taxAntiCorruption.whistleblowerMechanism || false,
      taxAntiCorruptionDocuments: frontendData.taxAntiCorruption.documents || [],
      
      // Other laws
      tradeLicenses: frontendData.otherLaws.tradeLicenses || [],
      corporateRegistration: frontendData.otherLaws.corporateRegistration || "",
      customsRegistration: frontendData.otherLaws.customsRegistration || "",
      dinasAgricultureRegistry: frontendData.otherLaws.dinasAgricultureRegistry || "",
      businessLicense: frontendData.otherLaws.businessLicense || "",
      otherLawsDocuments: frontendData.otherLaws.documents || []
    };
  };

  // Get existing assessments
  const { data: assessments } = useQuery({
    queryKey: ['/api/eudr-assessments'],
    queryFn: async () => {
      const response = await fetch('/api/eudr-assessments');
      if (!response.ok) throw new Error('Failed to fetch assessments');
      return response.json();
    }
  });

  // Save assessment mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: async (data: EUDRLegalityForm) => {
      const backendData = transformToBackendSchema(data);
      const response = await fetch('/api/eudr-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });
      if (!response.ok) throw new Error('Failed to save assessment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/eudr-assessments'] });
      toast({
        title: "Assessment Saved",
        description: "EUDR legality assessment has been saved successfully."
      });
    }
  });

  // Submit for review mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: async (data: EUDRLegalityForm) => {
      const backendData = transformToBackendSchema({ ...data, status: 'Submitted' });
      const response = await fetch('/api/eudr-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });
      if (!response.ok) throw new Error('Failed to submit assessment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/eudr-assessments'] });
      toast({
        title: "Assessment Submitted",
        description: "Assessment has been submitted for supervisor review."
      });
    }
  });

  // Validation logic based on supplier type and conditions
  const getRequiredFields = () => {
    const required = ['supplierName', 'supplierID', 'location'];
    
    // Smallholder specific requirements
    if (form.supplierType === "Smallholder" && form.landTenure.landArea < 25) {
      required.push('environmental.permitType');
      if (form.environmental.permitType === "SPPL") {
        required.push('environmental.permitNumber');
      }
    }
    
    // Large plantation requirements
    if (form.landTenure.landArea >= 25) {
      required.push('environmental.permitNumber');
    }
    
    // FPIC requirement for customary land
    if (form.thirdPartyRights.communalRights || form.landTenure.tenureType === "Customary Land") {
      required.push('thirdPartyRights.fpicStatus');
    }
    
    // Labour requirements for companies with employees
    if (form.labour.employeeCount > 0) {
      required.push('labour.bpjsKetenagakerjaanNumber', 'labour.bpjsKesehatanNumber');
    }
    
    // NPWP requirement for formal businesses
    if (!["Smallholder", "Other"].includes(form.supplierType)) {
      required.push('taxAntiCorruption.npwpNumber');
    }
    
    return required;
  };

  const validateForm = () => {
    const requiredFields = getRequiredFields();
    const errors: string[] = [];
    
    requiredFields.forEach(field => {
      const fieldValue = getNestedProperty(form, field);
      if (!fieldValue || fieldValue === "" || fieldValue === 0) {
        errors.push(`${field} is required`);
      }
    });
    
    return errors;
  };

  const getNestedProperty = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const setNestedProperty = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  const handleInputChange = (path: string, value: any) => {
    setForm(prev => {
      const newForm = { ...prev };
      setNestedProperty(newForm, path, value);
      newForm.lastUpdated = new Date();
      return newForm;
    });
  };

  const handleSaveDraft = () => {
    const updatedForm = { ...form, status: "Draft" as const };
    saveAssessmentMutation.mutate(updatedForm);
  };

  const handleSubmit = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please complete required fields: ${errors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    
    const updatedForm = { ...form, status: "Submitted" as const };
    submitAssessmentMutation.mutate(updatedForm);
  };

  // File upload handler
  const handleFileUpload = (section: string, files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Only PDF files are allowed.",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      // Mock file upload - in real implementation, upload to server
      const uploadedFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        url: URL.createObjectURL(file)
      };
      
      handleInputChange(`${section}.documents`, [...getNestedProperty(form, `${section}.documents`), uploadedFile]);
      
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`
      });
    });
  };

  const removeFile = (section: string, fileId: string) => {
    const currentFiles = getNestedProperty(form, `${section}.documents`);
    const updatedFiles = currentFiles.filter((f: UploadedFile) => f.id !== fileId);
    handleInputChange(`${section}.documents`, updatedFiles);
  };

  const getCompletionPercentage = () => {
    const requiredFields = getRequiredFields();
    const completedFields = requiredFields.filter(field => {
      const value = getNestedProperty(form, field);
      return value && value !== "" && value !== 0;
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const getTabStatus = (tabName: string) => {
    const tabFieldMap: Record<string, string[]> = {
      'land-tenure': ['landTenure.tenureType', 'landTenure.landArea'],
      'environmental': ['environmental.permitType'],
      'forest': ['forestRegulations.forestStatus'],
      'third-party': ['thirdPartyRights.fpicStatus'],
      'labour': ['labour.employeeCount'],
      'human-rights': ['humanRights.policyAdherence'],
      'tax': ['taxAntiCorruption.npwpNumber'],
      'other-laws': []
    };
    
    const fields = tabFieldMap[tabName] || [];
    const completed = fields.every(field => {
      const value = getNestedProperty(form, field);
      return value && value !== "" && value !== 0;
    });
    
    return completed ? "complete" : "incomplete";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            EUDR Legality Assessment
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive legal compliance audit for EU Deforestation Regulation
          </p>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <Badge 
            variant={form.status === "Complete" ? "default" : "secondary"}
            className="px-3 py-1"
          >
            {form.status}
          </Badge>
          <div className="text-sm text-gray-600">
            {getCompletionPercentage()}% Complete
          </div>
        </div>
      </div>

      {/* Progress Alert */}
      {form.status === "Draft" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Complete all mandatory fields based on your supplier type. 
            {form.supplierType === "Smallholder" && form.landTenure.landArea < 25 && 
              " As a smallholder with <25ha, SPPL documentation is required instead of AMDAL."
            }
            {form.thirdPartyRights.communalRights && 
              " FPIC documentation is required for customary/community land."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-9 mb-6">
          <TabsTrigger value="supplier-details" className="flex flex-col items-center gap-1 p-2">
            <Building className="h-4 w-4" />
            <span className="text-xs">Supplier</span>
            {getTabStatus('supplier-details') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="land-tenure" className="flex flex-col items-center gap-1 p-2">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Land Tenure</span>
            {getTabStatus('land-tenure') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="environmental" className="flex flex-col items-center gap-1 p-2">
            <Leaf className="h-4 w-4" />
            <span className="text-xs">Environmental</span>
            {getTabStatus('environmental') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="forest" className="flex flex-col items-center gap-1 p-2">
            <TreePine className="h-4 w-4" />
            <span className="text-xs">Forest</span>
            {getTabStatus('forest') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="third-party" className="flex flex-col items-center gap-1 p-2">
            <Users className="h-4 w-4" />
            <span className="text-xs">Third Party</span>
            {getTabStatus('third-party') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="labour" className="flex flex-col items-center gap-1 p-2">
            <Scale className="h-4 w-4" />
            <span className="text-xs">Labour</span>
            {getTabStatus('labour') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="human-rights" className="flex flex-col items-center gap-1 p-2">
            <Heart className="h-4 w-4" />
            <span className="text-xs">Human Rights</span>
            {getTabStatus('human-rights') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex flex-col items-center gap-1 p-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Tax/Anti-Corruption</span>
            {getTabStatus('tax') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="other-laws" className="flex flex-col items-center gap-1 p-2">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Other Laws</span>
            {getTabStatus('other-laws') === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        {/* Supplier Details Tab */}
        <TabsContent value="supplier-details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Supplier/Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-type">Supplier Type *</Label>
                  <Select 
                    value={form.supplierType} 
                    onValueChange={(value) => handleInputChange('supplierType', value)}
                  >
                    <SelectTrigger data-testid="select-supplier-type">
                      <SelectValue placeholder="Select supplier type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input
                    id="supplier-name"
                    value={form.supplierName}
                    onChange={(e) => handleInputChange('supplierName', e.target.value)}
                    placeholder="Enter supplier name"
                    data-testid="input-supplier-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-id">Supplier ID *</Label>
                  <Input
                    id="supplier-id"
                    value={form.supplierID}
                    onChange={(e) => handleInputChange('supplierID', e.target.value)}
                    placeholder="Enter supplier ID"
                    data-testid="input-supplier-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location"
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership Structure</Label>
                <Input
                  id="ownership"
                  value={form.ownership}
                  onChange={(e) => handleInputChange('ownership', e.target.value)}
                  placeholder="Enter ownership details"
                  data-testid="input-ownership"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Contact Name</Label>
                    <Input
                      id="contact-name"
                      value={form.contactDetails.name}
                      onChange={(e) => handleInputChange('contactDetails.name', e.target.value)}
                      placeholder="Enter contact name"
                      data-testid="input-contact-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-position">Position</Label>
                    <Input
                      id="contact-position"
                      value={form.contactDetails.position}
                      onChange={(e) => handleInputChange('contactDetails.position', e.target.value)}
                      placeholder="Enter position"
                      data-testid="input-contact-position"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.contactDetails.email}
                      onChange={(e) => handleInputChange('contactDetails.email', e.target.value)}
                      placeholder="Enter email"
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      value={form.contactDetails.phone}
                      onChange={(e) => handleInputChange('contactDetails.phone', e.target.value)}
                      placeholder="Enter phone number"
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Land Tenure Tab */}
        <TabsContent value="land-tenure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Land Tenure Rights
              </CardTitle>
              <p className="text-sm text-gray-600">
                Legal land ownership and usage rights documentation
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="land-title">Land Title/Certificate Number</Label>
                  <Input
                    id="land-title"
                    value={form.landTenure.landTitleNumber || ''}
                    onChange={(e) => handleInputChange('landTenure.landTitleNumber', e.target.value)}
                    placeholder="e.g., HGU# 02.03/xxx-2010"
                    data-testid="input-land-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title-date">Date of Title Issuance</Label>
                  <Input
                    id="title-date"
                    type="date"
                    value={form.landTenure.titleIssuanceDate ? form.landTenure.titleIssuanceDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('landTenure.titleIssuanceDate', new Date(e.target.value))}
                    data-testid="input-title-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenure-type">Type of Tenure *</Label>
                  <Select 
                    value={form.landTenure.tenureType} 
                    onValueChange={(value) => handleInputChange('landTenure.tenureType', value)}
                  >
                    <SelectTrigger data-testid="select-tenure-type">
                      <SelectValue placeholder="Select tenure type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TENURE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="land-area">Land Area (hectares) *</Label>
                  <Input
                    id="land-area"
                    type="number"
                    value={form.landTenure.landArea}
                    onChange={(e) => handleInputChange('landTenure.landArea', parseFloat(e.target.value) || 0)}
                    placeholder="Enter area in hectares"
                    data-testid="input-land-area"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gps-coordinates">GPS Coordinates or Digital Plot Map Reference</Label>
                <Input
                  id="gps-coordinates"
                  value={form.landTenure.gpsCoordinates || ''}
                  onChange={(e) => handleInputChange('landTenure.gpsCoordinates', e.target.value)}
                  placeholder="e.g., 3.1390, 101.6869 or plot map reference"
                  data-testid="input-gps-coordinates"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Land Title/Deed Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('landTenure', e.target.files)}
                    className="hidden"
                    id="land-tenure-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('land-tenure-upload')?.click()}
                    data-testid="button-upload-land-tenure"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.landTenure.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.landTenure.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('landTenure', file.id)}
                          data-testid={`button-remove-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environmental Laws Tab */}
        <TabsContent value="environmental" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Environmental Laws Compliance
              </CardTitle>
              <p className="text-sm text-gray-600">
                Environmental permits and impact assessments (AMDAL/UKL-UPL/SPPL)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conditional logic based on land area and supplier type */}
              {form.supplierType === "Smallholder" && form.landTenure.landArea < 25 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    As a smallholder with less than 25 hectares, SPPL (Environmental Management & Monitoring Letter) 
                    is required instead of AMDAL.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permit-type">Environmental Permit Type *</Label>
                  <Select 
                    value={form.environmental.permitType} 
                    onValueChange={(value) => handleInputChange('environmental.permitType', value)}
                  >
                    <SelectTrigger data-testid="select-permit-type">
                      <SelectValue placeholder="Select permit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTAL_PERMITS.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {form.environmental.permitType !== "None Required" && (
                  <div className="space-y-2">
                    <Label htmlFor="permit-number">
                      {form.environmental.permitType} Permit Number *
                    </Label>
                    <Input
                      id="permit-number"
                      value={form.environmental.permitNumber || ''}
                      onChange={(e) => handleInputChange('environmental.permitNumber', e.target.value)}
                      placeholder={
                        form.environmental.permitType === "SPPL" 
                          ? "e.g., SPPL No. A/N-12345" 
                          : "Enter permit number"
                      }
                      data-testid="input-permit-number"
                    />
                  </div>
                )}
              </div>

              {form.environmental.permitType !== "None Required" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issuance-year">Year of Issuance</Label>
                    <Input
                      id="issuance-year"
                      type="number"
                      min="2000"
                      max="2030"
                      value={form.environmental.issuanceYear || ''}
                      onChange={(e) => handleInputChange('environmental.issuanceYear', parseInt(e.target.value) || undefined)}
                      placeholder="e.g., 2020"
                      data-testid="input-issuance-year"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="env-status">Environmental Status</Label>
                    <Select 
                      value={form.environmental.environmentalStatus} 
                      onValueChange={(value) => handleInputChange('environmental.environmentalStatus', value)}
                    >
                      <SelectTrigger data-testid="select-env-status">
                        <SelectValue placeholder="Select environmental status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMDAL">AMDAL</SelectItem>
                        <SelectItem value="UKL-UPL">UKL-UPL</SelectItem>
                        <SelectItem value="SPPL">SPPL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="monitoring-report">Environmental Monitoring Report Details</Label>
                <Textarea
                  id="monitoring-report"
                  value={form.environmental.monitoringReportDetails || ''}
                  onChange={(e) => handleInputChange('environmental.monitoringReportDetails', e.target.value)}
                  placeholder="Details of environmental monitoring reports"
                  data-testid="textarea-monitoring-report"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Environmental Permit/SPPL Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('environmental', e.target.files)}
                    className="hidden"
                    id="environmental-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('environmental-upload')?.click()}
                    data-testid="button-upload-environmental"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.environmental.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.environmental.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('environmental', file.id)}
                          data-testid={`button-remove-env-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forest-Related Regulations Tab */}
        <TabsContent value="forest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                Forest-Related Regulations
              </CardTitle>
              <p className="text-sm text-gray-600">
                Forest concessions, utilization licenses, and protected area compliance
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forest-license">Forest License/Concession Number</Label>
                  <Input
                    id="forest-license"
                    value={form.forestRegulations.forestLicenseNumber || ''}
                    onChange={(e) => handleInputChange('forestRegulations.forestLicenseNumber', e.target.value)}
                    placeholder="e.g., IUPHHK-PS/PLH No. 78"
                    data-testid="input-forest-license"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forest-status">Forest Status *</Label>
                  <Select 
                    value={form.forestRegulations.forestStatus} 
                    onValueChange={(value) => handleInputChange('forestRegulations.forestStatus', value)}
                  >
                    <SelectTrigger data-testid="select-forest-status">
                      <SelectValue placeholder="Select forest status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ex-Forest Area">Ex-Forest Area</SelectItem>
                      <SelectItem value="Forest Area">Forest Area</SelectItem>
                      <SelectItem value="Non-Forest Area">Non-Forest Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impact-assessment">Forest-Related Impact Assessment ID</Label>
                  <Input
                    id="impact-assessment"
                    value={form.forestRegulations.impactAssessmentID || ''}
                    onChange={(e) => handleInputChange('forestRegulations.impactAssessmentID', e.target.value)}
                    placeholder="Enter assessment ID"
                    data-testid="input-impact-assessment"
                  />
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.forestRegulations.protectedAreaStatus}
                    onCheckedChange={(checked) => handleInputChange('forestRegulations.protectedAreaStatus', checked)}
                    data-testid="switch-protected-area"
                  />
                  <Label htmlFor="protected-area">Located in Protected Area</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Forest Management/Biodiversity Compliance Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('forestRegulations', e.target.files)}
                    className="hidden"
                    id="forest-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('forest-upload')?.click()}
                    data-testid="button-upload-forest"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.forestRegulations.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.forestRegulations.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('forestRegulations', file.id)}
                          data-testid={`button-remove-forest-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Third-Party Rights Tab */}
        <TabsContent value="third-party" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Third-Party Rights (Including FPIC)
              </CardTitle>
              <p className="text-sm text-gray-600">
                Free, Prior and Informed Consent and community rights documentation
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* FPIC Requirement Alert */}
              {(form.thirdPartyRights.communalRights || form.landTenure.tenureType === "Customary Land") && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    FPIC documentation is mandatory for customary/community land as per EUDR requirements.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.thirdPartyRights.fpicStatus}
                    onCheckedChange={(checked) => handleInputChange('thirdPartyRights.fpicStatus', checked)}
                    data-testid="switch-fpic-status"
                  />
                  <Label>FPIC Agreement Obtained</Label>
                </div>
                {form.thirdPartyRights.fpicStatus && (
                  <div className="space-y-2">
                    <Label htmlFor="fpic-date">Date of Community Consultation</Label>
                    <Input
                      id="fpic-date"
                      type="date"
                      value={form.thirdPartyRights.fpicDate ? form.thirdPartyRights.fpicDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('thirdPartyRights.fpicDate', new Date(e.target.value))}
                      data-testid="input-fpic-date"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.thirdPartyRights.communalRights}
                    onCheckedChange={(checked) => handleInputChange('thirdPartyRights.communalRights', checked)}
                    data-testid="switch-communal-rights"
                  />
                  <Label>Indigenous/Community Land Involved</Label>
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.thirdPartyRights.landConflict}
                    onCheckedChange={(checked) => handleInputChange('thirdPartyRights.landConflict', checked)}
                    data-testid="switch-land-conflict"
                  />
                  <Label>Unresolved Land Conflict</Label>
                </div>
              </div>

              {form.thirdPartyRights.landConflict && (
                <div className="space-y-2">
                  <Label htmlFor="conflict-description">Describe Land Conflict</Label>
                  <Textarea
                    id="conflict-description"
                    value={form.thirdPartyRights.conflictDescription || ''}
                    onChange={(e) => handleInputChange('thirdPartyRights.conflictDescription', e.target.value)}
                    placeholder="Provide details of the land conflict"
                    data-testid="textarea-conflict-description"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="community-permits">Number of Community Permits/Agreements</Label>
                <Input
                  id="community-permits"
                  type="number"
                  min="0"
                  value={form.thirdPartyRights.communityPermits}
                  onChange={(e) => handleInputChange('thirdPartyRights.communityPermits', parseInt(e.target.value) || 0)}
                  placeholder="Enter number of permits"
                  data-testid="input-community-permits"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>FPIC Agreement/Community Consent Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('thirdPartyRights', e.target.files)}
                    className="hidden"
                    id="third-party-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('third-party-upload')?.click()}
                    data-testid="button-upload-third-party"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.thirdPartyRights.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.thirdPartyRights.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('thirdPartyRights', file.id)}
                          data-testid={`button-remove-third-party-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labour Tab */}
        <TabsContent value="labour" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Labour Standards
              </CardTitle>
              <p className="text-sm text-gray-600">
                Employee information, contracts, and social security compliance (BPJS)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-count">Total Number of Employees *</Label>
                  <Input
                    id="employee-count"
                    type="number"
                    min="0"
                    value={form.labour.employeeCount}
                    onChange={(e) => handleInputChange('labour.employeeCount', parseInt(e.target.value) || 0)}
                    placeholder="Total employees"
                    data-testid="input-employee-count"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permanent-employees">Permanent Employees</Label>
                  <Input
                    id="permanent-employees"
                    type="number"
                    min="0"
                    value={form.labour.permanentEmployees}
                    onChange={(e) => handleInputChange('labour.permanentEmployees', parseInt(e.target.value) || 0)}
                    placeholder="Permanent"
                    data-testid="input-permanent-employees"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractual-employees">Contractual Employees</Label>
                  <Input
                    id="contractual-employees"
                    type="number"
                    min="0"
                    value={form.labour.contractualEmployees}
                    onChange={(e) => handleInputChange('labour.contractualEmployees', parseInt(e.target.value) || 0)}
                    placeholder="Contractual"
                    data-testid="input-contractual-employees"
                  />
                </div>
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Switch
                  checked={form.labour.hasWorkerContracts}
                  onCheckedChange={(checked) => handleInputChange('labour.hasWorkerContracts', checked)}
                  data-testid="switch-worker-contracts"
                />
                <Label>Worker Contracts Available</Label>
              </div>

              {/* BPJS Requirements - mandatory if employees > 0 */}
              {form.labour.employeeCount > 0 && (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      BPJS registration is mandatory for all employees as per Indonesian labor law.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bpjs-ketenagakerjaan">BPJS Ketenagakerjaan Number *</Label>
                      <Input
                        id="bpjs-ketenagakerjaan"
                        value={form.labour.bpjsKetenagakerjaanNumber || ''}
                        onChange={(e) => handleInputChange('labour.bpjsKetenagakerjaanNumber', e.target.value)}
                        placeholder="e.g., 123456789"
                        data-testid="input-bpjs-ketenagakerjaan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bpjs-kesehatan">BPJS Kesehatan Number *</Label>
                      <Input
                        id="bpjs-kesehatan"
                        value={form.labour.bpjsKesehatanNumber || ''}
                        onChange={(e) => handleInputChange('labour.bpjsKesehatanNumber', e.target.value)}
                        placeholder="e.g., 987654321"
                        data-testid="input-bpjs-kesehatan"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="k3-audit-date">Last K3 (Safety) Audit Date</Label>
                <Input
                  id="k3-audit-date"
                  type="date"
                  value={form.labour.lastK3AuditDate ? form.labour.lastK3AuditDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('labour.lastK3AuditDate', new Date(e.target.value))}
                  data-testid="input-k3-audit-date"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Worker Contracts/BPJS Certificates/K3 Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('labour', e.target.files)}
                    className="hidden"
                    id="labour-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('labour-upload')?.click()}
                    data-testid="button-upload-labour"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.labour.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.labour.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('labour', file.id)}
                          data-testid={`button-remove-labour-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Human Rights Tab */}
        <TabsContent value="human-rights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Human Rights
              </CardTitle>
              <p className="text-sm text-gray-600">
                Human rights policies, grievance mechanisms, and compliance certifications
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.humanRights.policyAdherence}
                    onCheckedChange={(checked) => handleInputChange('humanRights.policyAdherence', checked)}
                    data-testid="switch-policy-adherence"
                  />
                  <Label>Human Rights Policy Adherence</Label>
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.humanRights.grievanceRecords}
                    onCheckedChange={(checked) => handleInputChange('humanRights.grievanceRecords', checked)}
                    data-testid="switch-grievance-records"
                  />
                  <Label>Grievance Records Maintained</Label>
                </div>
              </div>

              {form.humanRights.grievanceRecords && (
                <div className="space-y-2">
                  <Label htmlFor="grievance-description">Grievance Mechanism Description</Label>
                  <Textarea
                    id="grievance-description"
                    value={form.humanRights.grievanceDescription || ''}
                    onChange={(e) => handleInputChange('humanRights.grievanceDescription', e.target.value)}
                    placeholder="Describe the grievance mechanism in place"
                    data-testid="textarea-grievance-description"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hr-certification">Human Rights Certification</Label>
                  <Input
                    id="hr-certification"
                    value={form.humanRights.certification || ''}
                    onChange={(e) => handleInputChange('humanRights.certification', e.target.value)}
                    placeholder="e.g., SA8000, if any"
                    data-testid="input-hr-certification"
                  />
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.humanRights.humanRightsViolations}
                    onCheckedChange={(checked) => handleInputChange('humanRights.humanRightsViolations', checked)}
                    data-testid="switch-hr-violations"
                  />
                  <Label>Known Human Rights Violations</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Human Rights Certification/Assessment Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('humanRights', e.target.files)}
                    className="hidden"
                    id="human-rights-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('human-rights-upload')?.click()}
                    data-testid="button-upload-human-rights"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.humanRights.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.humanRights.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('humanRights', file.id)}
                          data-testid={`button-remove-hr-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax/Anti-Corruption Tab */}
        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tax/Anti-Corruption
              </CardTitle>
              <p className="text-sm text-gray-600">
                Tax compliance (NPWP) and anti-corruption policies
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NPWP requirement for formal businesses */}
              {!["Smallholder", "Other"].includes(form.supplierType) && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    NPWP (Tax ID) is mandatory for formal businesses like {form.supplierType}s.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="npwp-number">
                    NPWP Tax ID {!["Smallholder", "Other"].includes(form.supplierType) && "*"}
                  </Label>
                  <Input
                    id="npwp-number"
                    value={form.taxAntiCorruption.npwpNumber || ''}
                    onChange={(e) => {
                      // Only allow digits and limit to 15 characters
                      const value = e.target.value.replace(/\D/g, '').substring(0, 15);
                      handleInputChange('taxAntiCorruption.npwpNumber', value);
                    }}
                    placeholder="15-digit NPWP number"
                    maxLength={15}
                    data-testid="input-npwp-number"
                  />
                  <p className="text-xs text-gray-500">Enter the 15-digit NPWP number</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-tax-return">Last Tax Return Year</Label>
                  <Input
                    id="last-tax-return"
                    type="number"
                    min="2015"
                    max="2030"
                    value={form.taxAntiCorruption.lastTaxReturnYear || ''}
                    onChange={(e) => handleInputChange('taxAntiCorruption.lastTaxReturnYear', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 2023"
                    data-testid="input-last-tax-return"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.taxAntiCorruption.pbbPaymentProof}
                    onCheckedChange={(checked) => handleInputChange('taxAntiCorruption.pbbPaymentProof', checked)}
                    data-testid="switch-pbb-payment"
                  />
                  <Label>Property Tax (PBB) Payment Proof</Label>
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.taxAntiCorruption.antiBriberyPolicy}
                    onCheckedChange={(checked) => handleInputChange('taxAntiCorruption.antiBriberyPolicy', checked)}
                    data-testid="switch-anti-bribery"
                  />
                  <Label>Anti-Bribery Policy</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.taxAntiCorruption.codeOfEthics}
                    onCheckedChange={(checked) => handleInputChange('taxAntiCorruption.codeOfEthics', checked)}
                    data-testid="switch-code-ethics"
                  />
                  <Label>Code of Ethics</Label>
                </div>
                <div className="space-y-2 flex items-center gap-2">
                  <Switch
                    checked={form.taxAntiCorruption.whistleblowerMechanism}
                    onCheckedChange={(checked) => handleInputChange('taxAntiCorruption.whistleblowerMechanism', checked)}
                    data-testid="switch-whistleblower"
                  />
                  <Label>Whistleblower Mechanism</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>NPWP Card/Tax Returns/Anti-Corruption Policies (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('taxAntiCorruption', e.target.files)}
                    className="hidden"
                    id="tax-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('tax-upload')?.click()}
                    data-testid="button-upload-tax"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.taxAntiCorruption.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.taxAntiCorruption.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('taxAntiCorruption', file.id)}
                          data-testid={`button-remove-tax-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other National Laws Tab */}
        <TabsContent value="other-laws" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Other National Laws
              </CardTitle>
              <p className="text-sm text-gray-600">
                Additional legal permits and business registrations
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="corporate-registration">Corporate Registration</Label>
                  <Input
                    id="corporate-registration"
                    value={form.otherLaws.corporateRegistration || ''}
                    onChange={(e) => handleInputChange('otherLaws.corporateRegistration', e.target.value)}
                    placeholder="Corporate registration number"
                    data-testid="input-corporate-registration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customs-registration">Customs Registration</Label>
                  <Input
                    id="customs-registration"
                    value={form.otherLaws.customsRegistration || ''}
                    onChange={(e) => handleInputChange('otherLaws.customsRegistration', e.target.value)}
                    placeholder="Customs registration number"
                    data-testid="input-customs-registration"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dinas-agriculture">Dinas Pertanian Registry</Label>
                  <Input
                    id="dinas-agriculture"
                    value={form.otherLaws.dinasAgricultureRegistry || ''}
                    onChange={(e) => handleInputChange('otherLaws.dinasAgricultureRegistry', e.target.value)}
                    placeholder="Agriculture department registration"
                    data-testid="input-dinas-agriculture"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-license">Business License (SIUP)</Label>
                  <Input
                    id="business-license"
                    value={form.otherLaws.businessLicense || ''}
                    onChange={(e) => handleInputChange('otherLaws.businessLicense', e.target.value)}
                    placeholder="Business license number"
                    data-testid="input-business-license"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trade/Export Permits</Label>
                <Textarea
                  value={form.otherLaws.tradeLicenses.join(', ')}
                  onChange={(e) => handleInputChange('otherLaws.tradeLicenses', e.target.value.split(', ').filter(Boolean))}
                  placeholder="List trade licenses separated by commas"
                  data-testid="textarea-trade-licenses"
                />
                <p className="text-xs text-gray-500">Enter multiple licenses separated by commas</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Business Licenses/Trade Permits/Legal Documents (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload('otherLaws', e.target.files)}
                    className="hidden"
                    id="other-laws-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('other-laws-upload')?.click()}
                    data-testid="button-upload-other-laws"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
                
                {form.otherLaws.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Documents:</Label>
                    {form.otherLaws.documents.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('otherLaws', file.id)}
                          data-testid={`button-remove-other-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {getCompletionPercentage()}% Complete
          </Badge>
          <span className="text-sm text-gray-600">
            Last updated: {form.lastUpdated.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={saveAssessmentMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitAssessmentMutation.isPending || getCompletionPercentage() < 100}
            data-testid="button-submit-assessment"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit for Review
          </Button>
        </div>
      </div>
    </div>
  );
}