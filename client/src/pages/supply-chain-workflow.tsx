import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Building, Link2, Package, Plus, Users, MapPin, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Supplier {
  id: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  tier: number;
  legalityStatus: 'verified' | 'pending' | 'non-compliant';
  legalityScore: number;
  certifications: string[];
  linkedSuppliers: string[];
  createdAt: string;
}

interface SupplierLink {
  id: string;
  parentSupplierId: string;
  childSupplierId: string;
  parentTier: number;
  childTier: number;
  linkType: string;
  createdAt: string;
}

interface Shipment {
  id: string;
  supplierId: string;
  productType: string;
  quantity: string;
  unit: string;
  shipmentDate: string;
  destination: string;
  batchNumber: string;
  qualityGrade: string;
  status: 'pending' | 'in-transit' | 'delivered';
}

export default function SupplyChainWorkflow() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const { toast } = useToast();

  // Fetch suppliers
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // Fetch supplier links
  const { data: supplierLinks = [], isLoading: loadingLinks } = useQuery<SupplierLink[]>({
    queryKey: ['/api/supplier-links'],
  });

  // Fetch shipments
  const { data: shipments = [], isLoading: loadingShipments } = useQuery<Shipment[]>({
    queryKey: ['/api/shipments'],
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/suppliers', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setShowSupplierForm(false);
      toast({ title: "Supplier registered successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to register supplier", variant: "destructive" });
    }
  });

  // Create supplier link mutation
  const createLinkMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supplier-links', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-links'] });
      setShowLinkForm(false);
      toast({ title: "Supplier link created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create supplier link", variant: "destructive" });
    }
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/shipments', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      setShowShipmentForm(false);
      toast({ title: "Shipment added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add shipment", variant: "destructive" });
    }
  });

  const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      companyName: formData.get('companyName'),
      registrationNumber: formData.get('registrationNumber'),
      address: formData.get('address'),
      contactPerson: formData.get('contactPerson'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      businessType: formData.get('businessType'),
      tier: parseInt(formData.get('tier') as string),
      legalityStatus: formData.get('legalityStatus'),
      legalityScore: parseInt(formData.get('legalityScore') as string),
      certifications: (formData.get('certifications') as string).split(',').map(cert => cert.trim()).filter(Boolean),
    };
    createSupplierMutation.mutate(data);
  };

  const handleLinkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      parentSupplierId: formData.get('parentSupplierId'),
      childSupplierId: formData.get('childSupplierId'),
      linkType: formData.get('linkType'),
    };
    createLinkMutation.mutate(data);
  };

  const handleShipmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      supplierId: formData.get('supplierId'),
      productType: formData.get('productType'),
      quantity: parseFloat(formData.get('quantity') as string),
      unit: formData.get('unit'),
      shipmentDate: formData.get('shipmentDate'),
      destination: formData.get('destination'),
      batchNumber: formData.get('batchNumber'),
      qualityGrade: formData.get('qualityGrade'),
      status: 'pending',
    };
    createShipmentMutation.mutate(data);
  };

  const getSuppliersByTier = (tier: number) => {
    return suppliers.filter((supplier: Supplier) => supplier.tier === tier);
  };

  const getTier1Suppliers = () => {
    return suppliers.filter((supplier: Supplier) => supplier.tier === 1);
  };

  const getSupplyChainVisualization = () => {
    const tiers = [0, 1, 2, 3, 4, 5]; // Business, Tier 1-4, Plots
    const tierNames = ['Your Business', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Plots'];
    
    return (
      <div className="space-y-6">
        {tiers.map((tier, index) => (
          <div key={tier} className="flex flex-col items-center">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tierNames[index]}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tier === 0 ? 'Your Company' : 
                 tier === 5 ? 'Farm Plots' : 
                 `${getSuppliersByTier(tier).length} suppliers`}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {tier === 0 ? (
                <Card className="w-48 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium">Your Business</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Primary Entity</p>
                  </div>
                </Card>
              ) : tier === 5 ? (
                <Card className="w-48 p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium">Farm Plots</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Origin Points</p>
                  </div>
                </Card>
              ) : (
                getSuppliersByTier(tier).map((supplier: Supplier) => (
                  <Card key={supplier.id} className="w-48 p-4 hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <Users className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <h4 className="font-medium text-sm">{supplier.companyName}</h4>
                      <p className="text-xs text-gray-500 mb-2">{supplier.businessType}</p>
                      <Badge 
                        variant={supplier.legalityStatus === 'verified' ? 'default' : 
                                supplier.legalityStatus === 'pending' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {supplier.legalityStatus === 'verified' ? 'Verified' :
                         supplier.legalityStatus === 'pending' ? 'Pending' : 'Non-Compliant'}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            {index < tiers.length - 1 && (
              <div className="flex items-center justify-center mb-4">
                <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                <div className="absolute">
                  <Link2 className="h-4 w-4 text-gray-400 bg-white dark:bg-gray-900 p-0.5" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Supply Chain Workflow
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Simple 3-step process: Register suppliers → Create tier linkages → Track shipments
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl">
            {[
              { step: 1, title: "Register Suppliers", icon: Building },
              { step: 2, title: "Create Linkages", icon: Link2 },
              { step: 3, title: "Track Shipments", icon: Package }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-colors ${
                    activeStep >= step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}
                  onClick={() => setActiveStep(step)}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    activeStep >= step ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Step {step}
                  </p>
                  <p className={`text-xs ${
                    activeStep >= step ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}>
                    {title}
                  </p>
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 ml-6 ${
                    activeStep > step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Tabs value={activeStep.toString()} onValueChange={(value) => setActiveStep(parseInt(value))}>
          {/* Step 1: Register Suppliers */}
          <TabsContent value="1" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Step 1: Register Suppliers
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Add suppliers with complete company details and legality assessments
                  </p>
                </div>
                <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-supplier">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Register New Supplier</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSupplierSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="companyName">Company Name *</Label>
                          <Input id="companyName" name="companyName" required data-testid="input-company-name" />
                        </div>
                        <div>
                          <Label htmlFor="registrationNumber">Registration Number *</Label>
                          <Input id="registrationNumber" name="registrationNumber" required data-testid="input-registration-number" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Address *</Label>
                        <Textarea id="address" name="address" required data-testid="input-address" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactPerson">Contact Person *</Label>
                          <Input id="contactPerson" name="contactPerson" required data-testid="input-contact-person" />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" name="email" type="email" required data-testid="input-email" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone *</Label>
                          <Input id="phone" name="phone" required data-testid="input-phone" />
                        </div>
                        <div>
                          <Label htmlFor="businessType">Business Type *</Label>
                          <Select name="businessType" required>
                            <SelectTrigger data-testid="select-business-type">
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mill">Palm Oil Mill</SelectItem>
                              <SelectItem value="refinery">Refinery</SelectItem>
                              <SelectItem value="trader">Trader</SelectItem>
                              <SelectItem value="plantation">Plantation</SelectItem>
                              <SelectItem value="smallholder">Smallholder</SelectItem>
                              <SelectItem value="collection-center">Collection Center</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tier">Supplier Tier *</Label>
                          <Select name="tier" required>
                            <SelectTrigger data-testid="select-tier">
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Tier 1 (Direct)</SelectItem>
                              <SelectItem value="2">Tier 2</SelectItem>
                              <SelectItem value="3">Tier 3</SelectItem>
                              <SelectItem value="4">Tier 4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="legalityStatus">Legality Status *</Label>
                          <Select name="legalityStatus" required>
                            <SelectTrigger data-testid="select-legality-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="pending">Pending Assessment</SelectItem>
                              <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="legalityScore">Legality Score (0-100)</Label>
                        <Input 
                          id="legalityScore" 
                          name="legalityScore" 
                          type="number" 
                          min="0" 
                          max="100" 
                          placeholder="85"
                          data-testid="input-legality-score"
                        />
                      </div>

                      <div>
                        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                        <Input 
                          id="certifications" 
                          name="certifications" 
                          placeholder="RSPO, ISCC, FSC"
                          data-testid="input-certifications"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowSupplierForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createSupplierMutation.isPending} data-testid="button-submit-supplier">
                          {createSupplierMutation.isPending ? 'Adding...' : 'Add Supplier'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingSuppliers ? (
                  <div className="text-center py-8">Loading suppliers...</div>
                ) : suppliers.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Suppliers Registered
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Start by registering your first supplier to begin building your supply chain.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map((supplier: Supplier) => (
                      <Card key={supplier.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{supplier.companyName}</h4>
                          <Badge 
                            variant={supplier.legalityStatus === 'verified' ? 'default' : 
                                    supplier.legalityStatus === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {supplier.legalityStatus === 'verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {supplier.legalityStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {supplier.legalityStatus === 'non-compliant' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            Tier {supplier.tier}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{supplier.businessType}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{supplier.contactPerson}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Score: {supplier.legalityScore || 'N/A'}</span>
                          <span className="text-gray-500">
                            {supplier.certifications?.length || 0} certs
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Create Linkages */}
          <TabsContent value="2" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Step 2: Create Tier-based Linkages
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Link suppliers to show full supply chain visibility from business to plots
                  </p>
                </div>
                <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-link" disabled={suppliers.length < 2}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Supplier Linkage</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="parentSupplierId">Parent Supplier (Higher Tier) *</Label>
                        <Select name="parentSupplierId" required>
                          <SelectTrigger data-testid="select-parent-supplier">
                            <SelectValue placeholder="Select parent supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.companyName} (Tier {supplier.tier})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="childSupplierId">Child Supplier (Lower Tier) *</Label>
                        <Select name="childSupplierId" required>
                          <SelectTrigger data-testid="select-child-supplier">
                            <SelectValue placeholder="Select child supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.companyName} (Tier {supplier.tier})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="linkType">Link Type *</Label>
                        <Select name="linkType" required>
                          <SelectTrigger data-testid="select-link-type">
                            <SelectValue placeholder="Select link type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct-supplier">Direct Supplier</SelectItem>
                            <SelectItem value="indirect-supplier">Indirect Supplier</SelectItem>
                            <SelectItem value="service-provider">Service Provider</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowLinkForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createLinkMutation.isPending} data-testid="button-submit-link">
                          {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Supply Chain Visualization */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Supply Chain Visualization</h3>
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 max-h-96 overflow-y-auto">
                      {getSupplyChainVisualization()}
                    </div>
                  </div>

                  {/* Links List */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Created Links</h3>
                    {loadingLinks ? (
                      <div className="text-center py-8">Loading links...</div>
                    ) : supplierLinks.length === 0 ? (
                      <div className="text-center py-8">
                        <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                          No Links Created
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Create links between suppliers to map your supply chain.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {supplierLinks.map((link: SupplierLink) => {
                          const parentSupplier = suppliers.find((s: Supplier) => s.id === link.parentSupplierId);
                          const childSupplier = suppliers.find((s: Supplier) => s.id === link.childSupplierId);
                          return (
                            <Card key={link.id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">
                                    <span className="font-medium">{parentSupplier?.companyName}</span>
                                    <span className="text-gray-500 mx-2">→</span>
                                    <span className="font-medium">{childSupplier?.companyName}</span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {link.linkType}
                                </Badge>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Track Shipments */}
          <TabsContent value="3" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Step 3: Track Shipments from Tier 1 Suppliers
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Add shipment details from your direct (Tier 1) suppliers
                  </p>
                </div>
                <Dialog open={showShipmentForm} onOpenChange={setShowShipmentForm}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-shipment" disabled={getTier1Suppliers().length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Shipment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleShipmentSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="supplierId">Tier 1 Supplier *</Label>
                        <Select name="supplierId" required>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTier1Suppliers().map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="productType">Product Type *</Label>
                          <Select name="productType" required>
                            <SelectTrigger data-testid="select-product-type">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CPO">Crude Palm Oil (CPO)</SelectItem>
                              <SelectItem value="FFB">Fresh Fruit Bunches (FFB)</SelectItem>
                              <SelectItem value="PKO">Palm Kernel Oil (PKO)</SelectItem>
                              <SelectItem value="PFAD">Palm Fatty Acid Distillate (PFAD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="qualityGrade">Quality Grade *</Label>
                          <Select name="qualityGrade" required>
                            <SelectTrigger data-testid="select-quality-grade">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Premium">Premium</SelectItem>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="Low Grade">Low Grade</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity *</Label>
                          <Input 
                            id="quantity" 
                            name="quantity" 
                            type="number" 
                            step="0.01" 
                            required 
                            data-testid="input-quantity"
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit">Unit *</Label>
                          <Select name="unit" required>
                            <SelectTrigger data-testid="select-unit">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tonnes">Tonnes</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="mt">Metric Tons</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shipmentDate">Shipment Date *</Label>
                          <Input 
                            id="shipmentDate" 
                            name="shipmentDate" 
                            type="date" 
                            required 
                            data-testid="input-shipment-date"
                          />
                        </div>
                        <div>
                          <Label htmlFor="batchNumber">Batch Number *</Label>
                          <Input 
                            id="batchNumber" 
                            name="batchNumber" 
                            required 
                            placeholder="BAT-2024-001"
                            data-testid="input-batch-number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="destination">Destination *</Label>
                        <Input 
                          id="destination" 
                          name="destination" 
                          required 
                          placeholder="Processing facility or port"
                          data-testid="input-destination"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setShowShipmentForm(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createShipmentMutation.isPending} data-testid="button-submit-shipment">
                          {createShipmentMutation.isPending ? 'Adding...' : 'Add Shipment'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {getTier1Suppliers().length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Tier 1 Suppliers
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      You need to register at least one Tier 1 supplier before adding shipments.
                    </p>
                  </div>
                ) : loadingShipments ? (
                  <div className="text-center py-8">Loading shipments...</div>
                ) : shipments.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Shipments Tracked
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Start tracking shipments from your Tier 1 suppliers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {shipments.map((shipment: Shipment) => {
                      const supplier = suppliers.find((s: Supplier) => s.id === shipment.supplierId);
                      return (
                        <Card key={shipment.id} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-500" />
                              <h4 className="font-medium">{shipment.batchNumber}</h4>
                              <Badge 
                                variant={shipment.status === 'delivered' ? 'default' : 
                                        shipment.status === 'in-transit' ? 'secondary' : 'outline'}
                              >
                                {shipment.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(shipment.shipmentDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Supplier:</span>
                              <p className="font-medium">{supplier?.companyName}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Product:</span>
                              <p className="font-medium">{shipment.productType}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <p className="font-medium">{shipment.quantity} {shipment.unit}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Quality:</span>
                              <p className="font-medium">{shipment.qualityGrade}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Destination:</span>
                            <p className="font-medium">{shipment.destination}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}