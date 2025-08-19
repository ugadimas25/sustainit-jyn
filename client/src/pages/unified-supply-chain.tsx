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
import { 
  Building, Link2, Package, Plus, Users, MapPin, CheckCircle2, AlertTriangle, 
  Clock, GitBranch, BarChart3, FileText, Search, Network, TrendingUp,
  Target, Shield, Activity, Globe, Zap, Play
} from "lucide-react";
import { SupplyChainFlowMap } from '@/components/animated-map/supply-chain-flow-map';
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ComplianceProgressTracker from "@/components/compliance-progress-tracker";

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

interface TraceabilityNode {
  id: string;
  name: string;
  type: string;
  level: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  certifications: string[];
  coordinates?: { latitude: number; longitude: number };
  massBalance: { input: number; output: number; efficiency: number };
  data: Record<string, any>;
}

export default function UnifiedSupplyChain() {
  const [activeTab, setActiveTab] = useState("progress");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [traceEntityId, setTraceEntityId] = useState("");
  const [traceabilityData, setTraceabilityData] = useState<TraceabilityNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TraceabilityNode | null>(null);
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

  const handleTraceSubmit = () => {
    // Mock traceability data - replace with actual API call
    const mockNodes: TraceabilityNode[] = [
      {
        id: "business-001",
        name: "KPN Plantations Berhad",
        type: "Business",
        level: 0,
        riskLevel: "low",
        certifications: ["RSPO", "MSPO"],
        massBalance: { input: 0, output: 2500, efficiency: 100 },
        data: { location: "Kuala Lumpur, Malaysia", entityType: "Headquarters" }
      },
      {
        id: "tier1-001", 
        name: "Riau Palm Mill Complex",
        type: "Mill",
        level: 1,
        riskLevel: "low",
        certifications: ["RSPO", "ISCC"],
        coordinates: { latitude: 0.2933, longitude: 101.7068 },
        massBalance: { input: 2650, output: 2500, efficiency: 94.3 },
        data: { capacity: "120 tonnes/hour", operatingDays: "365" }
      },
      {
        id: "tier2-001",
        name: "Sumatra Collection Center",
        type: "Collection Center", 
        level: 2,
        riskLevel: "medium",
        certifications: ["RSPO"],
        coordinates: { latitude: 0.7893, longitude: 100.6543 },
        massBalance: { input: 2800, output: 2650, efficiency: 94.6 },
        data: { storageCapacity: "500 tonnes", suppliers: "45" }
      },
      {
        id: "tier3-001",
        name: "West Riau Smallholders Cooperative",
        type: "Cooperative",
        level: 3,
        riskLevel: "medium", 
        certifications: ["RSPO"],
        coordinates: { latitude: 0.5234, longitude: 100.1234 },
        massBalance: { input: 1400, output: 1400, efficiency: 100 },
        data: { members: "125", avgPlotSize: "2.3 ha" }
      },
      {
        id: "tier4-001",
        name: "Ahmad Plantation Estate",
        type: "Estate",
        level: 4,
        riskLevel: "low",
        certifications: ["RSPO", "Organic"],
        coordinates: { latitude: 0.4321, longitude: 100.5678 },
        massBalance: { input: 1400, output: 1400, efficiency: 100 },
        data: { area: "450 ha", workers: "85", manager: "Ahmad bin Hassan" }
      }
    ];
    
    setTraceabilityData(mockNodes);
    toast({ title: "Traceability data loaded successfully!" });
  };

  const getSuppliersByTier = (tier: number) => {
    return suppliers.filter((supplier: Supplier) => supplier.tier === tier);
  };

  const getTier1Suppliers = () => {
    return suppliers.filter((supplier: Supplier) => supplier.tier === 1);
  };

  const getSupplyChainVisualization = () => {
    const tiers = [0, 1, 2, 3, 4, 5];
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

  const renderTraceabilityMap = () => {
    if (traceabilityData.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Traceability Data
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Enter an entity ID above and click "Trace" to visualize the supply chain
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Supply Chain Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Supply Chain Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {traceabilityData.map((node, index) => (
                  <div key={node.id} className="flex flex-col items-center">
                    <Card 
                      className={`w-full max-w-md p-4 cursor-pointer transition-all hover:shadow-lg ${
                        selectedNode?.id === node.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => setSelectedNode(node)}
                      data-testid={`node-${node.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            node.riskLevel === 'low' ? 'bg-green-500' :
                            node.riskLevel === 'medium' ? 'bg-yellow-500' :
                            node.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <h4 className="font-medium">{node.name}</h4>
                        </div>
                        <Badge variant="outline">Level {node.level}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{node.type}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {node.certifications.map(cert => (
                          <Badge key={cert} variant="secondary" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{node.massBalance.input}</div>
                          <div className="text-gray-500">Input</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{node.massBalance.output}</div>
                          <div className="text-gray-500">Output</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{node.massBalance.efficiency}%</div>
                          <div className="text-gray-500">Efficiency</div>
                        </div>
                      </div>
                    </Card>
                    
                    {index < traceabilityData.length - 1 && (
                      <div className="flex items-center justify-center my-4">
                        <div className="h-8 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="absolute">
                          <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Entity Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedNode.type}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Risk Assessment</h4>
                    <Badge 
                      variant={selectedNode.riskLevel === 'low' ? 'default' : 
                              selectedNode.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                    >
                      {selectedNode.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Mass Balance</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <div className="flex justify-between">
                        <span>Input:</span>
                        <span>{selectedNode.massBalance.input} tonnes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Output:</span>
                        <span>{selectedNode.massBalance.output} tonnes</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Efficiency:</span>
                        <span>{selectedNode.massBalance.efficiency}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedNode.coordinates && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Location</h4>
                      <div className="text-sm">
                        <div>Lat: {selectedNode.coordinates.latitude.toFixed(4)}</div>
                        <div>Lng: {selectedNode.coordinates.longitude.toFixed(4)}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Certifications</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.certifications.map(cert => (
                        <Badge key={cert} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {Object.entries(selectedNode.data).map(([key, value]) => {
                    if (key === 'level' || !value) return null;
                    return (
                      <div key={key} className="space-y-1">
                        <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Click on a node in the supply chain map to view detailed information
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Supply Chain Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete supply chain workflow, traceability, and analytics platform
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="progress" data-testid="tab-progress">
              <Target className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="workflow" data-testid="tab-workflow">
              <Building className="h-4 w-4 mr-2" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="traceability" data-testid="tab-traceability">
              <GitBranch className="h-4 w-4 mr-2" />
              Traceability
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="visualization" data-testid="tab-visualization">
              <Zap className="h-4 w-4 mr-2" />
              Animated Visualization
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <ComplianceProgressTracker 
              suppliers={suppliers}
              supplierLinks={supplierLinks}
              shipments={shipments}
              onStepClick={(stepId) => {
                // Navigate to appropriate tab based on step
                switch (stepId) {
                  case 'supplier-registration':
                    setActiveTab('workflow');
                    break;
                  case 'tier-linkage':
                    setActiveTab('workflow');
                    break;
                  case 'shipment-tracking':
                    setActiveTab('workflow');
                    break;
                  case 'compliance-verification':
                    setActiveTab('analytics');
                    break;
                  case 'documentation-export':
                    setActiveTab('reports');
                    break;
                  default:
                    setActiveTab('workflow');
                }
              }}
            />
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Step 1: Suppliers */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Suppliers
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Manage supplier registration and details
                    </p>
                  </div>
                  <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-supplier">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
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
                            <Label htmlFor="registrationNumber">Registration Number</Label>
                            <Input id="registrationNumber" name="registrationNumber" data-testid="input-registration-number" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="address">Address *</Label>
                          <Textarea id="address" name="address" required data-testid="input-address" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input id="contactPerson" name="contactPerson" data-testid="input-contact-person" />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" data-testid="input-email" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" data-testid="input-phone" />
                          </div>
                          <div>
                            <Label htmlFor="businessType">Business Type *</Label>
                            <Select name="businessType" required>
                              <SelectTrigger data-testid="select-business-type">
                                <SelectValue placeholder="Select type" />
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
                        </div>
                        <div>
                          <Label htmlFor="legalityScore">Legality Score (0-100)</Label>
                          <Input 
                            id="legalityScore" 
                            name="legalityScore" 
                            type="number" 
                            min="0" 
                            max="100"
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {suppliers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No suppliers registered</p>
                    ) : (
                      suppliers.map((supplier: Supplier) => (
                        <div key={supplier.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{supplier.companyName}</p>
                            <p className="text-xs text-gray-500">Tier {supplier.tier} • {supplier.businessType}</p>
                          </div>
                          <Badge 
                            variant={supplier.legalityStatus === 'verified' ? 'default' : 
                                    supplier.legalityStatus === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {supplier.legalityStatus}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Supply Chain Links */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="h-5 w-5" />
                      Chain Links
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Create tier-based supplier connections
                    </p>
                  </div>
                  <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={suppliers.length < 2} data-testid="button-add-link">
                        <Plus className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Supplier Link</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleLinkSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="parentSupplierId">Parent Supplier *</Label>
                          <Select name="parentSupplierId" required>
                            <SelectTrigger data-testid="select-parent-supplier">
                              <SelectValue placeholder="Select parent" />
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
                          <Label htmlFor="childSupplierId">Child Supplier *</Label>
                          <Select name="childSupplierId" required>
                            <SelectTrigger data-testid="select-child-supplier">
                              <SelectValue placeholder="Select child" />
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
                              <SelectValue placeholder="Select type" />
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {supplierLinks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No links created</p>
                    ) : (
                      supplierLinks.map((link: SupplierLink) => {
                        const parent = suppliers.find((s: Supplier) => s.id === link.parentSupplierId);
                        const child = suppliers.find((s: Supplier) => s.id === link.childSupplierId);
                        return (
                          <div key={link.id} className="p-2 border rounded">
                            <div className="text-sm">
                              <span className="font-medium">{parent?.companyName}</span>
                              <span className="text-gray-500 mx-2">→</span>
                              <span className="font-medium">{child?.companyName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {link.linkType}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Shipments */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Shipments
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Track shipments from tier 1 suppliers
                    </p>
                  </div>
                  <Dialog open={showShipmentForm} onOpenChange={setShowShipmentForm}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={getTier1Suppliers().length === 0} data-testid="button-add-shipment">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Shipment</DialogTitle>
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {shipments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No shipments tracked</p>
                    ) : (
                      shipments.map((shipment: Shipment) => {
                        const supplier = suppliers.find((s: Supplier) => s.id === shipment.supplierId);
                        return (
                          <div key={shipment.id} className="p-2 border rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{shipment.batchNumber}</span>
                              <Badge 
                                variant={shipment.status === 'delivered' ? 'default' : 
                                        shipment.status === 'in-transit' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {shipment.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">{supplier?.companyName}</p>
                            <p className="text-xs text-gray-500">{shipment.quantity} {shipment.unit} {shipment.productType}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supply Chain Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Supply Chain Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 max-h-96 overflow-y-auto">
                  {getSupplyChainVisualization()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traceability Tab */}
          <TabsContent value="traceability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Traceability Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="traceEntityId">Entity ID</Label>
                    <Input
                      id="traceEntityId"
                      value={traceEntityId}
                      onChange={(e) => setTraceEntityId(e.target.value)}
                      placeholder="Enter entity ID to trace (e.g., business-001, tier1-001)"
                      data-testid="input-trace-entity"
                    />
                  </div>
                  <Button onClick={handleTraceSubmit} data-testid="button-trace">
                    <Search className="h-4 w-4 mr-2" />
                    Trace
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <h4 className="font-medium mb-2">Sample Entity IDs:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><code>business-001</code> - Your Business</div>
                    <div><code>tier1-001</code> - Riau Palm Mill Complex</div>
                    <div><code>tier2-001</code> - Sumatra Collection Center</div>
                    <div><code>tier3-001</code> - West Riau Smallholders Cooperative</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {renderTraceabilityMap()}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Suppliers</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{suppliers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Link2 className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Chain Links</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{supplierLinks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Shipments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{shipments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-amber-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Compliance Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {suppliers.length > 0 
                          ? Math.round((suppliers.filter((s: Supplier) => s.legalityStatus === 'verified').length / suppliers.length) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Distribution by Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map(tier => {
                      const tierSuppliers = getSuppliersByTier(tier);
                      const percentage = suppliers.length > 0 ? (tierSuppliers.length / suppliers.length) * 100 : 0;
                      return (
                        <div key={tier} className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tier {tier}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">
                              {tierSuppliers.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { status: 'verified', label: 'Verified', color: 'bg-green-600' },
                      { status: 'pending', label: 'Pending', color: 'bg-yellow-600' },
                      { status: 'non-compliant', label: 'Non-Compliant', color: 'bg-red-600' }
                    ].map(({ status, label, color }) => {
                      const statusSuppliers = suppliers.filter((s: Supplier) => s.legalityStatus === status);
                      const percentage = suppliers.length > 0 ? (statusSuppliers.length / suppliers.length) * 100 : 0;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`${color} h-2 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">
                              {statusSuppliers.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Animated Visualization Tab */}
          <TabsContent value="visualization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-blue-500" />
                  Interactive Supply Chain Visualization
                  <Badge variant="secondary" className="ml-auto flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Real-time Animation
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Explore your supply chain with animated geospatial visualization featuring playful map interactions, 
                  flowing routes, bouncing markers, and real-time data exploration.
                </p>
              </CardHeader>
              <CardContent>
                <SupplyChainFlowMap className="w-full" />
              </CardContent>
            </Card>

            {/* Visualization Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">Animated Flows</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Watch supply chain movements come alive with animated shipment routes, 
                    temporal data progression, and interactive timeline controls.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold">Real-time Data</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Live supply chain data with bouncing facility markers, 
                    animated shipment tracking, and instant compliance updates.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">Multi-layer Views</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Switch between heatmaps, flow networks, risk assessment, 
                    and cluster analysis for comprehensive supply chain insights.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Supply Chain Summary Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Total Suppliers:</span>
                        <p className="font-medium">{suppliers.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Active Links:</span>
                        <p className="font-medium">{supplierLinks.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Total Shipments:</span>
                        <p className="font-medium">{shipments.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Compliance Rate:</span>
                        <p className="font-medium">
                          {suppliers.length > 0 
                            ? Math.round((suppliers.filter((s: Supplier) => s.legalityStatus === 'verified').length / suppliers.length) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>
                    <Button className="w-full" data-testid="button-export-summary">
                      <FileText className="h-4 w-4 mr-2" />
                      Export Summary Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Compliance Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm">
                      <p className="text-gray-600 dark:text-gray-300 mb-2">Compliance Breakdown:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Verified:</span>
                          <span className="text-green-600">
                            {suppliers.filter((s: Supplier) => s.legalityStatus === 'verified').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="text-yellow-600">
                            {suppliers.filter((s: Supplier) => s.legalityStatus === 'pending').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Non-Compliant:</span>
                          <span className="text-red-600">
                            {suppliers.filter((s: Supplier) => s.legalityStatus === 'non-compliant').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" data-testid="button-export-compliance">
                      <Shield className="h-4 w-4 mr-2" />
                      Export Compliance Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}