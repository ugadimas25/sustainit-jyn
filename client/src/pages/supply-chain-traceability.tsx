import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Search, 
  Filter, 
  Download, 
  Share2, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapIcon,
  Package,
  Truck,
  Factory,
  Leaf,
  FileText,
  GitBranch,
  BarChart3,
  Target,
  Layers,
  Route,
  Eye,
  Zap,
  Activity
} from "lucide-react";

interface TraceabilityNode {
  id: string;
  type: string;
  name: string;
  data: any;
  coordinates?: { latitude: number; longitude: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  certifications: string[];
  distance: number;
  massBalance: {
    input: number;
    output: number;
    efficiency: number;
  };
}

interface TraceabilityEdge {
  source: string;
  target: string;
  type: string;
  quantity: number;
  uom: string;
  date: string;
  eventType: string;
}

interface TraceabilityResult {
  entityId: string;
  entityType: string;
  depth: number;
  totalNodes: number;
  nodes: TraceabilityNode[];
  edges: TraceabilityEdge[];
  riskAssessment: {
    overallRisk: string;
    riskFactors: Array<{
      type: string;
      severity: string;
      description: string;
      entityId: string;
      recommendation: string;
    }>;
    compliance: {
      eudrCompliant: boolean;
      rspoCompliant: boolean;
      issues: string[];
      score: number;
    };
    massBalanceValidation: {
      isValid: boolean;
      overallEfficiency: number;
      totalInput: number;
      totalOutput: number;
      totalWaste: number;
      conversionRate: number;
    };
  };
  chainOfCustodyEvents: Array<{
    id: string;
    eventType: string;
    timestamp: string;
    facility: string;
    businessStep: string;
    quantity?: number;
    inputQuantity?: number;
    outputQuantity?: number;
    uom: string;
  }>;
}

interface CustodyChain {
  id: string;
  chainId: string;
  sourcePlot: { id: string; name: string; area: string };
  sourceFacility: { id: string; name: string; facilityType: string };
  destinationFacility: { id: string; name: string; facilityType: string };
  productType: string;
  totalQuantity: number;
  remainingQuantity: number;
  status: string;
  qualityGrade: string;
  batchNumber: string;
  harvestDate: string;
  expiryDate: string;
  riskLevel: string;
  complianceScore: number;
}

interface Facility {
  id: string;
  name: string;
  facilityType: string;
  location: { latitude: number; longitude: number };
  certifications: string[];
  capacity: string;
  riskLevel: string;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getFacilityIcon = (type: string) => {
  switch (type) {
    case 'plot': return <Leaf className="h-4 w-4" />;
    case 'collection_center': return <Package className="h-4 w-4" />;
    case 'mill': return <Factory className="h-4 w-4" />;
    case 'refinery': return <Factory className="h-4 w-4" />;
    case 'port': return <Truck className="h-4 w-4" />;
    case 'shipment': return <Truck className="h-4 w-4" />;
    default: return <MapPin className="h-4 w-4" />;
  }
};

export default function SupplyChainTraceability() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState('lot');
  const [traceDirection, setTraceDirection] = useState<'forward' | 'backward' | 'full'>('full');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNode, setSelectedNode] = useState<TraceabilityNode | null>(null);
  const { toast } = useToast();

  // Query for traceability data
  const { data: traceabilityData, isLoading: isTracing, error: traceError } = useQuery<TraceabilityResult>({
    queryKey: ['/api/graphql', 'traceability', selectedEntity, selectedEntityType, traceDirection],
    queryFn: async () => {
      if (!selectedEntity) return null;
      
      const query = traceDirection === 'forward' ? 
        `query TraceForward($entityId: String!, $entityType: String!) {
          traceForward(entityId: $entityId, entityType: $entityType) {
            entityId entityType depth totalNodes
            nodes { id type name data coordinates riskLevel certifications distance massBalance { input output efficiency } }
            edges { source target type quantity uom date eventType }
            riskAssessment { 
              overallRisk 
              riskFactors { type severity description entityId recommendation }
              compliance { eudrCompliant rspoCompliant issues score }
              massBalanceValidation { isValid overallEfficiency totalInput totalOutput totalWaste conversionRate }
            }
            chainOfCustodyEvents { id eventType timestamp facility businessStep quantity inputQuantity outputQuantity uom }
          }
        }` : traceDirection === 'backward' ?
        `query TraceBackward($entityId: String!, $entityType: String!) {
          traceBackward(entityId: $entityId, entityType: $entityType) {
            entityId entityType depth totalNodes
            nodes { id type name data coordinates riskLevel certifications distance massBalance { input output efficiency } }
            edges { source target type quantity uom date eventType }
            riskAssessment { 
              overallRisk 
              riskFactors { type severity description entityId recommendation }
              compliance { eudrCompliant rspoCompliant issues score }
              massBalanceValidation { isValid overallEfficiency totalInput totalOutput totalWaste conversionRate }
            }
            chainOfCustodyEvents { id eventType timestamp facility businessStep quantity inputQuantity outputQuantity uom }
          }
        }` :
        `query GetFullLineage($entityId: String!, $entityType: String!) {
          getFullLineage(entityId: $entityId, entityType: $entityType) {
            entityId entityType depth totalNodes
            nodes { id type name data coordinates riskLevel certifications distance massBalance { input output efficiency } }
            edges { source target type quantity uom date eventType }
            riskAssessment { 
              overallRisk 
              riskFactors { type severity description entityId recommendation }
              compliance { eudrCompliant rspoCompliant issues score }
              massBalanceValidation { isValid overallEfficiency totalInput totalOutput totalWaste conversionRate }
            }
            chainOfCustodyEvents { id eventType timestamp facility businessStep quantity inputQuantity outputQuantity uom }
          }
        }`;
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { entityId: selectedEntity, entityType: selectedEntityType }
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch traceability data');
      
      const result = await response.json();
      const operationName = traceDirection === 'forward' ? 'traceForward' : 
                           traceDirection === 'backward' ? 'traceBackward' : 'getFullLineage';
      
      return result.data?.[operationName];
    },
    enabled: !!selectedEntity,
  });

  // Query for custody chains
  const { data: custodyChains } = useQuery<CustodyChain[]>({
    queryKey: ['/api/graphql', 'custody-chains'],
    queryFn: async () => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query GetCustodyChains {
            getCustodyChains {
              id chainId
              sourcePlot { id name area }
              sourceFacility { id name facilityType }
              destinationFacility { id name facilityType }
              productType totalQuantity remainingQuantity
              status qualityGrade batchNumber harvestDate expiryDate
              riskLevel complianceScore
            }
          }`,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch custody chains');
      const result = await response.json();
      return result.data?.getCustodyChains || [];
    },
  });

  // Query for facilities
  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/graphql', 'facilities'],
    queryFn: async () => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query GetFacilities {
            getFacilities {
              id name facilityType
              location { latitude longitude }
              certifications capacity riskLevel
            }
          }`,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch facilities');
      const result = await response.json();
      return result.data?.getFacilities || [];
    },
  });

  const handleTrace = () => {
    if (!selectedEntity.trim()) {
      toast({
        title: "Missing Entity ID",
        description: "Please enter an entity ID to trace",
        variant: "destructive"
      });
      return;
    }
    // Trigger refetch by updating the query key dependency
  };

  const exportReport = () => {
    if (!traceabilityData) return;
    
    const report = {
      title: `Supply Chain Traceability Report - ${traceabilityData.entityId}`,
      generated: new Date().toISOString(),
      entity: {
        id: traceabilityData.entityId,
        type: traceabilityData.entityType
      },
      summary: {
        totalNodes: traceabilityData.totalNodes,
        depth: traceabilityData.depth,
        overallRisk: traceabilityData.riskAssessment.overallRisk,
        complianceScore: traceabilityData.riskAssessment.compliance.score
      },
      nodes: traceabilityData.nodes,
      riskAssessment: traceabilityData.riskAssessment,
      chainOfCustody: traceabilityData.chainOfCustodyEvents
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-report-${traceabilityData.entityId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Supply chain traceability report has been downloaded"
    });
  };

  const shareReport = () => {
    if (!traceabilityData) return;
    
    const shareUrl = `${window.location.origin}/supply-chain?entity=${traceabilityData.entityId}&type=${traceabilityData.entityType}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link Copied",
      description: "Traceability report link copied to clipboard"
    });
  };

  const filteredChains = custodyChains?.filter(chain => {
    const matchesSearch = !searchTerm || 
      chain.chainId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chain.sourcePlot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chain.sourceFacility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chain.destinationFacility.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || chain.productType.toLowerCase() === filterType;
    
    return matchesSearch && matchesFilter;
  }) || [];

  const filteredFacilities = facilities?.filter(facility => {
    const matchesSearch = !searchTerm || 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.facilityType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || facility.facilityType === filterType;
    
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <GitBranch className="h-8 w-8 text-blue-600" />
                Supply Chain Traceability Platform
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Complete provenance tracking with GS1 EPCIS 2.0 compliance and interactive visualization
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportReport} disabled={!traceabilityData} data-testid="button-export-report">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={shareReport} disabled={!traceabilityData} variant="outline" data-testid="button-share-report">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Search and Trace Controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Enter Entity ID to trace (e.g., lot-001, shipment-exp-001)"
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                data-testid="input-entity-id"
              />
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger data-testid="select-entity-type">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lot">Lot/Batch</SelectItem>
                <SelectItem value="shipment">Shipment</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="plot">Plot</SelectItem>
                <SelectItem value="party">Party/Company</SelectItem>
              </SelectContent>
            </Select>
            <Select value={traceDirection} onValueChange={(value: 'forward' | 'backward' | 'full') => setTraceDirection(value)}>
              <SelectTrigger data-testid="select-trace-direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Lineage</SelectItem>
                <SelectItem value="forward">Trace Forward</SelectItem>
                <SelectItem value="backward">Trace Backward</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleTrace} disabled={isTracing} data-testid="button-trace">
              {isTracing ? <Activity className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isTracing ? 'Tracing...' : 'Trace'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="lineage" data-testid="tab-lineage">
              <Route className="h-4 w-4 mr-2" />
              Supply Chain Map
            </TabsTrigger>
            <TabsTrigger value="custody" data-testid="tab-custody">
              <Package className="h-4 w-4 mr-2" />
              Chain of Custody
            </TabsTrigger>
            <TabsTrigger value="facilities" data-testid="tab-facilities">
              <Factory className="h-4 w-4 mr-2" />
              Facilities
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Risk Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get started with supply chain traceability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-1">
                        <span className="text-blue-600 text-xs font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Enter Entity ID</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Start with a lot ID (e.g., "lot-001"), shipment ID (e.g., "shipment-exp-001"), or facility ID
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-1">
                        <span className="text-blue-600 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Choose Trace Direction</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Select "Full Lineage" for complete provenance, "Forward" for downstream, "Backward" for upstream
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-1">
                        <span className="text-blue-600 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Visualize & Analyze</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Explore the interactive supply chain map, risk analytics, and compliance reports
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Sample Entity IDs to Try:</h4>
                    <div className="space-y-1">
                      <button 
                        onClick={() => { setSelectedEntity('plot-riau-001'); setSelectedEntityType('plot'); }}
                        className="block text-sm text-blue-600 hover:text-blue-800 text-left"
                        data-testid="button-sample-plot"
                      >
                        plot-riau-001 (Palm Oil Plot in Riau)
                      </button>
                      <button 
                        onClick={() => { setSelectedEntity('shipment-exp-001'); setSelectedEntityType('shipment'); }}
                        className="block text-sm text-blue-600 hover:text-blue-800 text-left"
                        data-testid="button-sample-shipment"
                      >
                        shipment-exp-001 (Export Shipment to Rotterdam)
                      </button>
                      <button 
                        onClick={() => { setSelectedEntity('mill-sumatra-001'); setSelectedEntityType('facility'); }}
                        className="block text-sm text-blue-600 hover:text-blue-800 text-left"
                        data-testid="button-sample-mill"
                      >
                        mill-sumatra-001 (Central Palm Mill Complex)
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-green-600" />
                    Platform Features
                  </CardTitle>
                  <CardDescription>
                    Comprehensive traceability and compliance management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">GS1 EPCIS 2.0 Compliant</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Full event sourcing with standardized traceability events
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Mass Balance Validation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Automatic verification of material flows and conversion rates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Risk Assessment</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          AI-powered compliance scoring and risk factor identification
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Interactive Mapping</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Geospatial visualization with facility locations and plot boundaries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Shareable Reports</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Export chain-of-custody reports for regulatory compliance
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Supply Chain Map Tab */}
          <TabsContent value="lineage" className="space-y-6">
            {traceabilityData ? (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Supply Chain Visualization */}
                <div className="xl:col-span-3">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Route className="h-5 w-5 text-blue-600" />
                          Supply Chain Map - {traceabilityData.entityId}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getRiskColor(traceabilityData.riskAssessment.overallRisk)}>
                            Risk: {traceabilityData.riskAssessment.overallRisk}
                          </Badge>
                          <Badge variant="outline">
                            Compliance: {traceabilityData.riskAssessment.compliance.score}%
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Supply Chain Flow Visualization */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                          <div className="space-y-6">
                            {traceabilityData.nodes
                              .sort((a, b) => (a.data.level || 0) - (b.data.level || 0))
                              .map((node, index) => {
                                const isSelected = selectedNode?.id === node.id;
                                return (
                                  <div key={node.id} className="relative">
                                    <div 
                                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                      }`}
                                      onClick={() => setSelectedNode(isSelected ? null : node)}
                                      data-testid={`node-${node.id}`}
                                    >
                                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900">
                                        {getFacilityIcon(node.type)}
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {node.name}
                                          </h3>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={getRiskColor(node.riskLevel)}>
                                              {node.riskLevel} risk
                                            </Badge>
                                            <Badge variant="secondary">
                                              Level {node.data.level || 0}
                                            </Badge>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Type:</span>
                                            <span className="ml-2 capitalize">{node.type.replace('_', ' ')}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Distance:</span>
                                            <span className="ml-2">{node.distance} km</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500 dark:text-gray-400">Efficiency:</span>
                                            <span className="ml-2">{node.massBalance.efficiency}%</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {node.certifications.map(cert => (
                                            <Badge key={cert} variant="outline" className="text-xs">
                                              {cert}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Arrow to next node */}
                                    {index < traceabilityData.nodes.length - 1 && (
                                      <div className="flex justify-center my-2">
                                        <div className="flex flex-col items-center">
                                          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                          <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Node Details Panel */}
                <div className="xl:col-span-1">
                  <Card className="sticky top-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        {selectedNode ? 'Node Details' : 'Select a Node'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedNode ? (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">{selectedNode.name}</h3>
                            <Badge className={getRiskColor(selectedNode.riskLevel)}>
                              {selectedNode.riskLevel} risk
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Mass Balance</h4>
                            <div className="space-y-1 text-sm">
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
            ) : (
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
            )}
          </TabsContent>

          {/* Chain of Custody Tab */}
          <TabsContent value="custody" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Chain of Custody Management</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor active custody chains and lot tracking
                </p>
              </div>
              <div className="flex gap-4">
                <Input
                  placeholder="Search chains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                  data-testid="input-search-chains"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48" data-testid="select-filter-type">
                    <SelectValue placeholder="Filter by product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="FFB">Fresh Fruit Bunches</SelectItem>
                    <SelectItem value="CPO">Crude Palm Oil</SelectItem>
                    <SelectItem value="refined">Refined Oil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredChains.map((chain) => (
                <Card key={chain.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{chain.chainId}</CardTitle>
                      <Badge className={getRiskColor(chain.riskLevel)}>
                        {chain.riskLevel} risk
                      </Badge>
                    </div>
                    <CardDescription>
                      {chain.productType} • Grade {chain.qualityGrade}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Source Plot</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                        {chain.sourcePlot.name} ({chain.sourcePlot.area})
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Collection</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                        {chain.sourceFacility.name}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Destination</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                        {chain.destinationFacility.name}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Batch Number:</span>
                        <span className="font-mono">{chain.batchNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Quantity:</span>
                        <span>{chain.totalQuantity} tonnes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining:</span>
                        <span>{chain.remainingQuantity} tonnes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compliance Score:</span>
                        <span className="font-semibold">{chain.complianceScore}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Harvested: {new Date(chain.harvestDate).toLocaleDateString()}</span>
                      <span>Expires: {new Date(chain.expiryDate).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Facility Management</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor facilities across the supply chain network
                </p>
              </div>
              <div className="flex gap-4">
                <Input
                  placeholder="Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                  data-testid="input-search-facilities"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48" data-testid="select-filter-facility-type">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="collection_center">Collection Centers</SelectItem>
                    <SelectItem value="mill">Mills</SelectItem>
                    <SelectItem value="refinery">Refineries</SelectItem>
                    <SelectItem value="port">Ports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFacilities.map((facility) => (
                <Card key={facility.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getFacilityIcon(facility.facilityType)}
                        {facility.name}
                      </CardTitle>
                      <Badge className={getRiskColor(facility.riskLevel)}>
                        {facility.riskLevel} risk
                      </Badge>
                    </div>
                    <CardDescription className="capitalize">
                      {facility.facilityType.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Location</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                        {facility.location.latitude.toFixed(4)}, {facility.location.longitude.toFixed(4)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Capacity</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                        {facility.capacity}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Certifications</span>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-6">
                        {facility.certifications.map(cert => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Risk Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {traceabilityData ? (
              <div className="space-y-6">
                {/* Risk Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Risk</p>
                          <p className="text-2xl font-bold capitalize">{traceabilityData.riskAssessment.overallRisk}</p>
                        </div>
                        <AlertTriangle className={`h-8 w-8 ${
                          traceabilityData.riskAssessment.overallRisk === 'low' ? 'text-green-600' :
                          traceabilityData.riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Compliance Score</p>
                          <p className="text-2xl font-bold">{traceabilityData.riskAssessment.compliance.score}%</p>
                        </div>
                        <Target className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="mt-2">
                        <Progress value={traceabilityData.riskAssessment.compliance.score} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Mass Balance</p>
                          <p className="text-2xl font-bold">
                            {traceabilityData.riskAssessment.massBalanceValidation.overallEfficiency}%
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {traceabilityData.riskAssessment.massBalanceValidation.isValid ? 'Valid' : 'Invalid'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Supply Chain Depth</p>
                          <p className="text-2xl font-bold">{traceabilityData.depth}</p>
                        </div>
                        <Layers className="h-8 w-8 text-indigo-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {traceabilityData.totalNodes} total nodes
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Risk Factors & Recommendations
                    </CardTitle>
                    <CardDescription>
                      Identified risks and suggested mitigation actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {traceabilityData.riskAssessment.riskFactors.map((risk, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <Badge className={getRiskColor(risk.severity)}>
                                  {risk.severity}
                                </Badge>
                                {risk.type}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                Entity: {risk.entityId}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm mb-3">{risk.description}</p>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <p className="text-sm"><strong>Recommendation:</strong> {risk.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mass Balance Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Mass Balance Analysis
                    </CardTitle>
                    <CardDescription>
                      Material flow validation and efficiency metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Material Flow Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Total Input:</span>
                              <span className="font-medium">{traceabilityData.riskAssessment.massBalanceValidation.totalInput} tonnes</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Output:</span>
                              <span className="font-medium">{traceabilityData.riskAssessment.massBalanceValidation.totalOutput} tonnes</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Waste:</span>
                              <span className="font-medium">{traceabilityData.riskAssessment.massBalanceValidation.totalWaste} tonnes</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Conversion Rate:</span>
                              <span className="font-medium">{(traceabilityData.riskAssessment.massBalanceValidation.conversionRate * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Validation Status</h4>
                          <div className="flex items-center gap-2 mb-2">
                            {traceabilityData.riskAssessment.massBalanceValidation.isValid ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-green-600 font-medium">Valid</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <span className="text-red-600 font-medium">Invalid</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Overall efficiency: {traceabilityData.riskAssessment.massBalanceValidation.overallEfficiency}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Compliance Status
                    </CardTitle>
                    <CardDescription>
                      Regulatory compliance verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                          traceabilityData.riskAssessment.compliance.eudrCompliant ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          {traceabilityData.riskAssessment.compliance.eudrCompliant ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <h4 className="font-semibold">EUDR Compliant</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {traceabilityData.riskAssessment.compliance.eudrCompliant ? 'Yes' : 'No'}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                          traceabilityData.riskAssessment.compliance.rspoCompliant ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          {traceabilityData.riskAssessment.compliance.rspoCompliant ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                          )}
                        </div>
                        <h4 className="font-semibold">RSPO Compliant</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {traceabilityData.riskAssessment.compliance.rspoCompliant ? 'Yes' : 'No'}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="font-semibold">Overall Score</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {traceabilityData.riskAssessment.compliance.score}%
                        </p>
                      </div>
                    </div>
                    
                    {traceabilityData.riskAssessment.compliance.issues.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Compliance Issues</h4>
                        <div className="space-y-2">
                          {traceabilityData.riskAssessment.compliance.issues.map((issue, index) => (
                            <Alert key={index}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{issue}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Analytics Data
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Perform a traceability query to view risk analytics and compliance metrics
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {traceError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error loading traceability data: {traceError.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}