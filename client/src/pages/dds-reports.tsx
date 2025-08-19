import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Download, Send, Eye, CheckCircle2, Clock, AlertTriangle,
  Building, Package, MapPin, Link2, Signature, Globe, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DdsReport, InsertDdsReport } from "@shared/schema";
import { KMLUploader } from "@/components/kml-uploader";
import { GeoJSONGenerator } from "@/components/geojson-generator";

export default function DdsReports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDdsForm, setShowDdsForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DdsReport | null>(null);
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
    const formData = new FormData(e.currentTarget);
    
    const ddsData: InsertDdsReport = {
      shipmentId: formData.get('shipmentId') as string,
      operatorLegalName: formData.get('operatorLegalName') as string,
      operatorAddress: formData.get('operatorAddress') as string,
      eoriNumber: formData.get('eoriNumber') as string || undefined,
      hsCode: formData.get('hsCode') as string,
      productDescription: formData.get('productDescription') as string,
      scientificName: formData.get('scientificName') as string || undefined,
      netMassKg: formData.get('netMassKg') as string,
      supplementaryUnit: formData.get('supplementaryUnit') as string || undefined,
      supplementaryQuantity: formData.get('supplementaryQuantity') as string || undefined,
      countryOfProduction: formData.get('countryOfProduction') as string,
      plotGeolocations: formData.get('plotGeolocations') ? 
        (formData.get('plotGeolocations') as string).split(',').map(s => s.trim()) : [],
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
    };

    createDdsMutation.mutate(ddsData);
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
              <Dialog open={showDdsForm} onOpenChange={setShowDdsForm}>
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
                          <Select name="shipmentId">
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
                        </div>
                        <div>
                          <Label htmlFor="hsCode">HS Code *</Label>
                          <Input 
                            id="hsCode" 
                            name="hsCode" 
                            placeholder="15119010"
                            required 
                            data-testid="input-hs-code"
                          />
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
                          <Select name="countryOfProduction" required>
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
                        </div>
                        <div>
                          <Label htmlFor="plotGeolocations">Plot Geolocations (comma-separated coordinates)</Label>
                          <Textarea 
                            id="plotGeolocations" 
                            name="plotGeolocations" 
                            placeholder="2.5194, 101.5183, 2.5298, 101.5287"
                            rows={3}
                            data-testid="textarea-plot-geolocations"
                          />
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
                          <Select name="deforestationRiskLevel">
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
                        </div>
                        <div>
                          <Label htmlFor="legalityStatus">Legality Status</Label>
                          <Select name="legalityStatus">
                            <SelectTrigger data-testid="select-legality-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                            </SelectContent>
                          </Select>
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

        {/* Report Detail Modal */}
        {selectedReport && (
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>DDS Report Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Report ID:</span>
                    <p className="font-mono">{selectedReport.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p>{selectedReport.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Operator:</span>
                    <p>{selectedReport.operatorLegalName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Product:</span>
                    <p>{selectedReport.productDescription}</p>
                  </div>
                  <div>
                    <span className="font-medium">Country:</span>
                    <p>{selectedReport.countryOfProduction}</p>
                  </div>
                  <div>
                    <span className="font-medium">Net Mass:</span>
                    <p>{selectedReport.netMassKg} kg</p>
                  </div>
                </div>
                
                {/* KML Upload and GeoJSON Generation */}
                <div className="grid md:grid-cols-2 gap-6">
                  <KMLUploader 
                    reportId={selectedReport.id} 
                    onUploadComplete={() => {
                      // Refresh the report data after KML upload
                      queryClient.invalidateQueries({ queryKey: ['/api/dds-reports'] });
                      toast({
                        title: "KML Upload Complete",
                        description: "Polygon data has been processed and added to the DDS report."
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
                    onClick={() => generatePdfMutation.mutate(selectedReport.id)}
                    disabled={generatePdfMutation.isPending}
                    data-testid="button-modal-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  {selectedReport.status === 'draft' && (
                    <Button 
                      onClick={() => submitToEuTraceMutation.mutate(selectedReport.id)}
                      disabled={submitToEuTraceMutation.isPending}
                      data-testid="button-modal-submit"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit to EU Trace
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}