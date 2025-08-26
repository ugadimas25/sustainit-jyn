import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Building,
  Plus,
  Trash2,
  Save,
  FileCheck
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EstateDataForm {
  // Section 1: General Information
  supplierName: string;
  groupParentCompanyName?: string;
  establishmentAct?: string;
  amendmentAct?: string;
  businessLicense?: string;
  certificationType?: string;
  certificateNumber?: string;
  certificationBody?: string;
  certificateValidity?: string;
  certificationScope?: string;
  documentLink?: string;
  
  // Addresses & Coordinates
  officeAddress?: string;
  estateAddress?: string;
  officeCoordinates?: string;
  estateCoordinates?: string;
  
  // Section 2: FFB Sources
  ffbSources: Array<{
    no: number;
    estateName: string;
    address: string;
    landArea: number;
    longitude: string;
    latitude: string;
    plantingYear: string;
    seedType: string;
    annualProduction: number;
  }>;
  
  // Section 3: Forest and Peat Protection
  hasForestPeatPolicy?: boolean;
  forestPeatPolicyNotes?: string;
  forestPeatPolicyDocument?: string;
  attendedNdpeWorkshop?: boolean;
  ndpeWorkshopNotes?: string;
  hasConservationAreaSop?: boolean;
  hasLandOpeningSop?: boolean;
  conductedHcvAssessment?: boolean;
  submittedHcvReport?: boolean;
  conductedHcsAssessment?: boolean;
  plantingOnPeatland?: boolean;
  peatlandArea?: number;
  peatlandOpeningYear?: number;
  hasHydrologicalRestorationPermit?: boolean;
  hydrologicalPermitNotes?: string;
  hydrologicalPermitDocument?: string;
}

export default function LegalityAssessmentPage() {
  const [activeTab, setActiveTab] = useState("estate-collection");
  const [estateForm, setEstateForm] = useState<EstateDataForm>({
    supplierName: "",
    ffbSources: [{
      no: 1,
      estateName: "",
      address: "",
      landArea: 0,
      longitude: "",
      latitude: "",
      plantingYear: "",
      seedType: "",
      annualProduction: 0
    }]
  });

  // Create estate data collection mutation
  const createEstateDataMutation = useMutation({
    mutationFn: (data: EstateDataForm) => apiRequest('/api/estate-data-collection', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      // Reset form after successful submission
      setEstateForm({
        supplierName: "",
        ffbSources: [{
          no: 1,
          estateName: "",
          address: "",
          landArea: 0,
          longitude: "",
          latitude: "",
          plantingYear: "",
          seedType: "",
          annualProduction: 0
        }]
      });
    }
  });

  const addFFBSource = () => {
    setEstateForm(prev => ({
      ...prev,
      ffbSources: [...prev.ffbSources, {
        no: prev.ffbSources.length + 1,
        estateName: "",
        address: "",
        landArea: 0,
        longitude: "",
        latitude: "",
        plantingYear: "",
        seedType: "",
        annualProduction: 0
      }]
    }));
  };

  const removeFFBSource = (index: number) => {
    setEstateForm(prev => ({
      ...prev,
      ffbSources: prev.ffbSources.filter((_, i) => i !== index)
    }));
  };

  const updateFFBSource = (index: number, field: string, value: any) => {
    setEstateForm(prev => ({
      ...prev,
      ffbSources: prev.ffbSources.map((source, i) => 
        i === index ? { ...source, [field]: value } : source
      )
    }));
  };

  const handleSubmitEstateForm = () => {
    if (!estateForm.supplierName.trim()) {
      alert('Supplier name is required');
      return;
    }
    createEstateDataMutation.mutate(estateForm);
  };

  const handleSaveDraft = () => {
    // Save as draft logic here
    console.log('Saving draft:', estateForm);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Legality Assessment
          </h1>
          <p className="text-gray-600 mt-1">EUDR compliance data collection and assessment</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estate-collection" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Estate Data Collection
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Assessment
          </TabsTrigger>
        </TabsList>

        {/* Estate Data Collection Tab */}
        <TabsContent value="estate-collection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estate Data Collection Form</CardTitle>
              <p className="text-sm text-gray-600">Based on EUDR requirements for palm oil estates</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Section 1: General Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Section 1 - General Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-name">Supplier Name *</Label>
                    <Input 
                      id="supplier-name" 
                      placeholder="Enter supplier name" 
                      value={estateForm.supplierName}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, supplierName: e.target.value }))}
                      data-testid="input-supplier-name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-parent-company">Group/Parent Company Name</Label>
                    <Input 
                      id="group-parent-company" 
                      placeholder="Enter group/parent company" 
                      value={estateForm.groupParentCompanyName || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, groupParentCompanyName: e.target.value }))}
                      data-testid="input-group-parent-company" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="establishment-act">Company Establishment Act</Label>
                    <Input 
                      id="establishment-act" 
                      placeholder="Act number" 
                      value={estateForm.establishmentAct || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, establishmentAct: e.target.value }))}
                      data-testid="input-establishment-act" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amendment-act">Amendment Act (if any)</Label>
                    <Input 
                      id="amendment-act" 
                      placeholder="Amendment act number" 
                      value={estateForm.amendmentAct || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, amendmentAct: e.target.value }))}
                      data-testid="input-amendment-act" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-license">Business License (NIB)</Label>
                    <Input 
                      id="business-license" 
                      placeholder="Business identification number" 
                      value={estateForm.businessLicense || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, businessLicense: e.target.value }))}
                      data-testid="input-business-license" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certification-type">Certification Type</Label>
                    <Select value={estateForm.certificationType || ""} onValueChange={(value) => setEstateForm(prev => ({ ...prev, certificationType: value }))}>
                      <SelectTrigger data-testid="select-certification-type">
                        <SelectValue placeholder="Select certification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISPO">ISPO</SelectItem>
                        <SelectItem value="RSPO">RSPO</SelectItem>
                        <SelectItem value="ISCC">ISCC</SelectItem>
                        <SelectItem value="PROPER">PROPER Environment</SelectItem>
                        <SelectItem value="SMK3">SMK3</SelectItem>
                        <SelectItem value="multiple">Multiple Certifications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certificate-number">Certificate Number</Label>
                    <Input 
                      id="certificate-number" 
                      placeholder="Certificate number" 
                      value={estateForm.certificateNumber || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, certificateNumber: e.target.value }))}
                      data-testid="input-certificate-number" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certification-body">Certification Body</Label>
                    <Input 
                      id="certification-body" 
                      placeholder="Certifying organization" 
                      value={estateForm.certificationBody || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, certificationBody: e.target.value }))}
                      data-testid="input-certification-body" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificate-validity">Certificate Validity</Label>
                    <Input 
                      id="certificate-validity" 
                      type="date" 
                      value={estateForm.certificateValidity || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, certificateValidity: e.target.value }))}
                      data-testid="input-certificate-validity" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certification-scope">Certification Scope</Label>
                  <Textarea 
                    id="certification-scope" 
                    placeholder="Describe certification scope" 
                    value={estateForm.certificationScope || ""}
                    onChange={(e) => setEstateForm(prev => ({ ...prev, certificationScope: e.target.value }))}
                    data-testid="textarea-certification-scope" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-link">Document Link</Label>
                  <Input 
                    id="document-link" 
                    placeholder="Google Drive or website link" 
                    value={estateForm.documentLink || ""}
                    onChange={(e) => setEstateForm(prev => ({ ...prev, documentLink: e.target.value }))}
                    data-testid="input-document-link" 
                  />
                </div>
              </div>

              {/* Addresses and Coordinates */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold border-b pb-2">Addresses & Coordinates</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="office-address">Office Address</Label>
                    <Textarea 
                      id="office-address" 
                      placeholder="Head office address" 
                      value={estateForm.officeAddress || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, officeAddress: e.target.value }))}
                      data-testid="textarea-office-address" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estate-address">Estate Address</Label>
                    <Textarea 
                      id="estate-address" 
                      placeholder="Estate/plantation address" 
                      value={estateForm.estateAddress || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, estateAddress: e.target.value }))}
                      data-testid="textarea-estate-address" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="office-coordinates">Office Coordinates</Label>
                    <Input 
                      id="office-coordinates" 
                      placeholder="Lat, Long (e.g., 3.1390, 101.6869)" 
                      value={estateForm.officeCoordinates || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, officeCoordinates: e.target.value }))}
                      data-testid="input-office-coordinates" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estate-coordinates">Estate Coordinates</Label>
                    <Input 
                      id="estate-coordinates" 
                      placeholder="Lat, Long (e.g., 3.1390, 101.6869)" 
                      value={estateForm.estateCoordinates || ""}
                      onChange={(e) => setEstateForm(prev => ({ ...prev, estateCoordinates: e.target.value }))}
                      data-testid="input-estate-coordinates" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: FFB Sources */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold border-b pb-2">Section 2 - FFB Sources</h3>
                  <Button variant="outline" size="sm" onClick={addFFBSource} data-testid="button-add-ffb-source">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Estate
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Estate Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Land Area (Ha)</TableHead>
                        <TableHead>Longitude</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Planting Year</TableHead>
                        <TableHead>Seed Type</TableHead>
                        <TableHead>Annual Production (tons)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estateForm.ffbSources.map((source, index) => (
                        <TableRow key={index}>
                          <TableCell>{source.no}</TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Estate name" 
                              className="min-w-32" 
                              value={source.estateName}
                              onChange={(e) => updateFFBSource(index, 'estateName', e.target.value)}
                              data-testid={`input-estate-name-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Address" 
                              className="min-w-40" 
                              value={source.address}
                              onChange={(e) => updateFFBSource(index, 'address', e.target.value)}
                              data-testid={`input-estate-address-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="min-w-20" 
                              value={source.landArea}
                              onChange={(e) => updateFFBSource(index, 'landArea', Number(e.target.value))}
                              data-testid={`input-estate-area-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="101.6869" 
                              className="min-w-24" 
                              value={source.longitude}
                              onChange={(e) => updateFFBSource(index, 'longitude', e.target.value)}
                              data-testid={`input-estate-longitude-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="3.1390" 
                              className="min-w-24" 
                              value={source.latitude}
                              onChange={(e) => updateFFBSource(index, 'latitude', e.target.value)}
                              data-testid={`input-estate-latitude-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="2010" 
                              className="min-w-20" 
                              value={source.plantingYear}
                              onChange={(e) => updateFFBSource(index, 'plantingYear', e.target.value)}
                              data-testid={`input-estate-planting-year-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Certified seed" 
                              className="min-w-32" 
                              value={source.seedType}
                              onChange={(e) => updateFFBSource(index, 'seedType', e.target.value)}
                              data-testid={`input-estate-seed-type-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="min-w-24" 
                              value={source.annualProduction}
                              onChange={(e) => updateFFBSource(index, 'annualProduction', Number(e.target.value))}
                              data-testid={`input-estate-production-${index + 1}`} 
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFFBSource(index)}
                              disabled={estateForm.ffbSources.length === 1}
                              data-testid={`button-remove-estate-${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <p className="text-xs text-gray-500">
                  * For areas &gt; 4Ha, polygon data (SHP/GeoJSON) is required
                </p>
              </div>

              {/* Section 3: Forest and Peat Protection */}
              <div className="space-y-6">
                <h3 className="text-base font-semibold border-b pb-2">Section 3 - Forest and Peat Protection</h3>
                
                {/* 3.1 Policy */}
                <div className="space-y-4">
                  <h4 className="font-medium">3.1 Forest and Peat Protection Policy</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Do you have a policy covering forest and peat protection?</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="policy-yes" 
                            name="forestPeatPolicy" 
                            value="yes" 
                            checked={estateForm.hasForestPeatPolicy === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, hasForestPeatPolicy: true }))}
                            data-testid="radio-policy-yes" 
                          />
                          <Label htmlFor="policy-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="policy-no" 
                            name="forestPeatPolicy" 
                            value="no" 
                            checked={estateForm.hasForestPeatPolicy === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, hasForestPeatPolicy: false }))}
                            data-testid="radio-policy-no" 
                          />
                          <Label htmlFor="policy-no">No</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policy-notes">Notes</Label>
                      <Textarea 
                        id="policy-notes" 
                        placeholder="Additional information" 
                        value={estateForm.forestPeatPolicyNotes || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, forestPeatPolicyNotes: e.target.value }))}
                        data-testid="textarea-policy-notes" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policy-document">Document Link</Label>
                      <Input 
                        id="policy-document" 
                        placeholder="Google Drive link if not published on website" 
                        value={estateForm.forestPeatPolicyDocument || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, forestPeatPolicyDocument: e.target.value }))}
                        data-testid="input-policy-document" 
                      />
                    </div>
                  </div>
                </div>

                {/* 3.2 NDPE Workshop */}
                <div className="space-y-4">
                  <h4 className="font-medium">3.2 NDPE Workshop Participation</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Have you attended NDPE policy commitment workshops?</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="ndpe-yes" 
                            name="ndpeWorkshop" 
                            value="yes" 
                            checked={estateForm.attendedNdpeWorkshop === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, attendedNdpeWorkshop: true }))}
                            data-testid="radio-ndpe-yes" 
                          />
                          <Label htmlFor="ndpe-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="ndpe-no" 
                            name="ndpeWorkshop" 
                            value="no" 
                            checked={estateForm.attendedNdpeWorkshop === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, attendedNdpeWorkshop: false }))}
                            data-testid="radio-ndpe-no" 
                          />
                          <Label htmlFor="ndpe-no">No</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ndpe-notes">Notes</Label>
                      <Textarea 
                        id="ndpe-notes" 
                        placeholder="Workshop details" 
                        value={estateForm.ndpeWorkshopNotes || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, ndpeWorkshopNotes: e.target.value }))}
                        data-testid="textarea-ndpe-notes" 
                      />
                    </div>
                  </div>
                </div>

                {/* 3.3 Peatland */}
                <div className="space-y-4">
                  <h4 className="font-medium">3.3 Peatland Management</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Do you have plantings on peatland?</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="peatland-yes" 
                            name="peatlandPlanting" 
                            value="yes" 
                            checked={estateForm.plantingOnPeatland === true}
                            onChange={() => setEstateForm(prev => ({ ...prev, plantingOnPeatland: true }))}
                            data-testid="radio-peatland-yes" 
                          />
                          <Label htmlFor="peatland-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="peatland-no" 
                            name="peatlandPlanting" 
                            value="no" 
                            checked={estateForm.plantingOnPeatland === false}
                            onChange={() => setEstateForm(prev => ({ ...prev, plantingOnPeatland: false }))}
                            data-testid="radio-peatland-no" 
                          />
                          <Label htmlFor="peatland-no">No</Label>
                        </div>
                      </div>
                    </div>

                    {estateForm.plantingOnPeatland && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="peatland-area">Area (Ha)</Label>
                          <Input 
                            id="peatland-area" 
                            type="number" 
                            placeholder="Area in hectares" 
                            value={estateForm.peatlandArea || ""}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, peatlandArea: Number(e.target.value) }))}
                            data-testid="input-peatland-area" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peatland-opening-year">Year of opening</Label>
                          <Input 
                            id="peatland-opening-year" 
                            type="number" 
                            placeholder="Year" 
                            value={estateForm.peatlandOpeningYear || ""}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, peatlandOpeningYear: Number(e.target.value) }))}
                            data-testid="input-peatland-opening-year" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={createEstateDataMutation.isPending}
                  data-testid="button-save-draft"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button 
                  onClick={handleSubmitEstateForm}
                  disabled={createEstateDataMutation.isPending}
                  data-testid="button-submit-estate-form"
                >
                  {createEstateDataMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Submit Form
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab - Placeholder */}
        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation Upload</CardTitle>
              <p className="text-sm text-gray-600">Upload required documentation for EUDR compliance</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Documentation upload functionality will be added here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Tab - Placeholder */}
        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Assessment</CardTitle>
              <p className="text-sm text-gray-600">Assessment and validation of submitted data</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Assessment functionality will be added here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}