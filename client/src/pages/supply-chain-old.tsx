import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, MapPin, Truck, Factory, Ship, GitBranch, BarChart3, Globe } from "lucide-react";
import { LineageVisualization } from "@/components/traceability/lineage-visualization";
import { CustodyChainPanel } from "@/components/traceability/custody-chain-panel";

interface SupplyChainFlowProps {
  shipmentId: string;
}

function SupplyChainFlow({ shipmentId }: SupplyChainFlowProps) {
  const { data: traceability } = useQuery({
    queryKey: ["/api/shipments", shipmentId, "traceability"],
    enabled: !!shipmentId,
  });

  if (!traceability) {
    return (
      <div className="text-center py-8 text-gray-500">
        Select a shipment to view traceability flow
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {/* Farm Plots */}
        <div className="text-center">
          <div className="w-16 h-16 bg-forest rounded-lg flex items-center justify-center mb-2">
            <MapPin className="text-white text-xl" />
          </div>
          <h4 className="font-medium text-gray-800 text-sm">Farm Plots</h4>
          <p className="text-xs text-gray-600">{Array.isArray(traceability.sourcePlots) ? traceability.sourcePlots.length : 0} suppliers</p>
          <p className="text-xs text-gray-600">
            {Array.isArray(traceability.sourcePlots) ? traceability.sourcePlots.reduce((sum: number, plot: any) => 
              sum + (parseFloat(plot.delivery?.weight) || 0), 0).toFixed(1) : '0.0'} tonnes
          </p>
        </div>

        {/* Arrow */}
        <div className="flex-1 mx-4">
          <div className="border-t-2 border-gray-300 relative">
            <div className="absolute right-0 top-0 transform -translate-y-1/2">
              <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </div>
        </div>

        {/* Collection */}
        <div className="text-center">
          <div className="w-16 h-16 bg-warning rounded-lg flex items-center justify-center mb-2">
            <Truck className="text-white text-xl" />
          </div>
          <h4 className="font-medium text-gray-800 text-sm">Collection</h4>
          <p className="text-xs text-gray-600">Multiple routes</p>
          <p className="text-xs text-gray-600">Processing</p>
        </div>

        {/* Arrow */}
        <div className="flex-1 mx-4">
          <div className="border-t-2 border-gray-300 relative">
            <div className="absolute right-0 top-0 transform -translate-y-1/2">
              <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </div>
        </div>

        {/* Mill Processing */}
        <div className="text-center">
          <div className="w-16 h-16 bg-professional rounded-lg flex items-center justify-center mb-2">
            <Factory className="text-white text-xl" />
          </div>
          <h4 className="font-medium text-gray-800 text-sm">Mill Processing</h4>
          <p className="text-xs text-gray-600">
            {Array.isArray(traceability.shipmentLots) && traceability.shipmentLots[0]?.mill?.name || 'Processing Mill'}
          </p>
          <p className="text-xs text-gray-600">Refined CPO</p>
        </div>

        {/* Arrow */}
        <div className="flex-1 mx-4">
          <div className="border-t-2 border-gray-300 relative">
            <div className="absolute right-0 top-0 transform -translate-y-1/2">
              <div className="w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="text-center">
          <div className="w-16 h-16 bg-forest-dark rounded-lg flex items-center justify-center mb-2">
            <Ship className="text-white text-xl" />
          </div>
          <h4 className="font-medium text-gray-800 text-sm">Export</h4>
          <p className="text-xs text-gray-600">
            {parseFloat(traceability.shipment?.totalWeight || '0').toFixed(1)} tonnes
          </p>
          <p className="text-xs text-gray-600">
            {traceability.shipment?.destinationCountry || 'Destination'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SupplyChain() {
  const [searchBatchId, setSearchBatchId] = useState("");
  const [selectedMill, setSelectedMill] = useState("all");
  const [selectedShipment, setSelectedShipment] = useState("");
  const [lineageDialog, setLineageDialog] = useState(false);
  const [lineageEntity, setLineageEntity] = useState<{ id: string; type: string } | null>(null);

  const { data: shipments, isLoading } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const { data: mills } = useQuery({
    queryKey: ["/api/mills"],
  });

  const { data: traceability } = useQuery({
    queryKey: ["/api/shipments", selectedShipment, "traceability"],
    enabled: !!selectedShipment,
  });

  // Listen for lineage visualization requests
  useEffect(() => {
    const handleShowLineage = (event: CustomEvent) => {
      setLineageEntity({
        id: event.detail.entityId,
        type: event.detail.entityType
      });
      setLineageDialog(true);
    };

    window.addEventListener('showLineage', handleShowLineage as EventListener);
    return () => window.removeEventListener('showLineage', handleShowLineage as EventListener);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading supply chain data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Supply Chain Traceability</h1>
              <p className="text-gray-600 mt-1">Advanced chain-of-custody tracking with EPCIS-style event monitoring</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-forest text-white hover:bg-forest-dark" data-testid="button-new-batch">
                <Plus className="w-4 h-4 mr-2" />
                New Batch
              </Button>
              <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-trace">
                <Search className="w-4 h-4 mr-2" />
                Trace Shipment
              </Button>
            </div>
          </div>

          {/* Traceability Search */}
          <Card className="border-neutral-border mb-6">
            <CardHeader>
              <CardTitle>Shipment Traceability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</Label>
                  <Input 
                    placeholder="EXP-2024-0156" 
                    value={searchBatchId}
                    onChange={(e) => setSearchBatchId(e.target.value)}
                    data-testid="input-batch-id"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Mill</Label>
                  <Select value={selectedMill} onValueChange={setSelectedMill}>
                    <SelectTrigger data-testid="select-mill">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Mills</SelectItem>
                      {Array.isArray(mills) ? mills.map((mill: any) => (
                        <SelectItem key={mill.id} value={mill.id}>
                          {mill.name}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Shipment</Label>
                  <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                    <SelectTrigger data-testid="select-shipment">
                      <SelectValue placeholder="Select shipment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(shipments) ? shipments.map((shipment: any) => (
                        <SelectItem key={shipment.id} value={shipment.shipmentId}>
                          {shipment.shipmentId}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</Label>
                  <Button 
                    className="w-full bg-professional text-white hover:bg-blue-700"
                    data-testid="button-search"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supply Chain Flow Visualization */}
          {selectedShipment && (
            <Card className="border-neutral-border mb-6">
              <CardHeader>
                <CardTitle>Supply Chain Flow: {selectedShipment}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Complete traceability from source to export</p>
              </CardHeader>
              <CardContent>
                <SupplyChainFlow shipmentId={selectedShipment} />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Plots Details */}
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle>
                  Source Plots {selectedShipment ? `(${selectedShipment})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(traceability?.sourcePlots) && traceability.sourcePlots.length > 0 ? (
                  <div className="space-y-4">
                    {traceability.sourcePlots.slice(0, 5).map((plotData: any, index: number) => (
                      <div key={index} className="border border-neutral-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {plotData.plot?.plotId || `Plot ${index + 1}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {plotData.supplier?.name || 'Unknown Supplier'}
                            </p>
                          </div>
                          <Badge 
                            variant={plotData.plot?.status === 'compliant' ? 'default' : 'secondary'}
                            data-testid={`badge-plot-status-${index}`}
                          >
                            {plotData.plot?.status || 'pending'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Delivered:</span>
                            <span className="font-medium ml-1">
                              {plotData.delivery?.weight || '0'} tonnes
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium ml-1">
                              {plotData.delivery?.deliveryDate ? 
                                new Date(plotData.delivery.deliveryDate).toLocaleDateString() : 
                                'N/A'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Quality:</span>
                            <span className="font-medium ml-1">
                              {plotData.delivery?.quality || 'Grade A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Area:</span>
                            <span className="font-medium ml-1">
                              {plotData.plot?.area || '0'} ha
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {Array.isArray(traceability?.sourcePlots) && traceability.sourcePlots.length > 5 && (
                      <div className="text-center">
                        <Button variant="outline" data-testid="button-view-all-plots">
                          View All {traceability?.sourcePlots?.length || 0} Source Plots
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p>No source plots data available</p>
                    <p className="text-sm">Select a shipment to view source details</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Timeline */}
            <Card className="border-neutral-border">
              <CardHeader>
                <CardTitle>Processing Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Timeline events would come from traceability data */}
                  <div className="flex">
                    <div className="flex-shrink-0 w-3 h-3 bg-forest-light rounded-full mt-1"></div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-800">Collection Started</h4>
                        <span className="ml-2 text-xs text-gray-500">
                          {traceability?.shipment?.shipmentDate ? 
                            new Date(traceability.shipment.shipmentDate).toLocaleDateString() : 
                            'Date pending'
                          }
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Fresh fruit bunches collected from {Array.isArray(traceability?.sourcePlots) ? traceability.sourcePlots.length : 0} supplier plots
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline">Collection Team</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 w-3 h-3 bg-forest-light rounded-full mt-1"></div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-800">Quality Inspection</h4>
                        <span className="ml-2 text-xs text-gray-500">Processing</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Quality control assessment completed - {traceability?.shipment?.totalWeight || '0'} tonnes processed
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline">QC Inspector</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 w-3 h-3 bg-professional rounded-full mt-1"></div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-800">Mill Processing</h4>
                        <span className="ml-2 text-xs text-gray-500">Completed</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Sterilization and extraction process at {traceability?.shipmentLots?.[0]?.mill?.name || 'Processing Mill'}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline">Mill Operator</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0 w-3 h-3 bg-professional rounded-full mt-1"></div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-800">Export Shipped</h4>
                        <span className="ml-2 text-xs text-gray-500">
                          {traceability?.shipment?.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {traceability?.shipment?.totalWeight || '0'} tonnes crude palm oil to {traceability?.shipment?.destinationCountry || 'destination'}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline">Export Team</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
