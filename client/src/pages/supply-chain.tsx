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
          <div className="w-16 h-16 bg-kpn-red rounded-lg flex items-center justify-center mb-2">
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
          <div className="w-16 h-16 bg-kpn-red rounded-lg flex items-center justify-center mb-2">
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
          <div className="w-16 h-16 bg-kpn-red-dark rounded-lg flex items-center justify-center mb-2">
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
  const [selectedShipment, setSelectedShipment] = useState<string>("");
  const [lineageDialog, setLineageDialog] = useState(false);
  const [lineageEntity, setLineageEntity] = useState<{ id: string; type: string } | null>(null);

  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const { data: mills } = useQuery({
    queryKey: ["/api/mills"],
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Supply Chain Traceability</h1>
                <p className="text-gray-600 mt-2">Advanced chain-of-custody tracking with EPCIS-style event monitoring</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Chain
              </Button>
            </div>

            <Tabs defaultValue="chain-of-custody" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chain-of-custody" data-testid="tab-chain-of-custody">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Chain of Custody
                </TabsTrigger>
                <TabsTrigger value="lineage" data-testid="tab-lineage">
                  <Globe className="w-4 h-4 mr-2" />
                  Lineage Mapping
                </TabsTrigger>
                <TabsTrigger value="mass-balance" data-testid="tab-mass-balance">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Mass Balance
                </TabsTrigger>
                <TabsTrigger value="shipments" data-testid="tab-shipments">
                  <Ship className="w-4 h-4 mr-2" />
                  Shipments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chain-of-custody" className="mt-6">
                <CustodyChainPanel />
              </TabsContent>

              <TabsContent value="lineage" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Interactive Lineage Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="entity-id">Entity ID</Label>
                          <Input 
                            id="entity-id" 
                            placeholder="Enter entity ID to trace"
                            value={lineageEntity?.id || ''}
                            onChange={(e) => setLineageEntity(prev => ({ 
                              ...prev, 
                              id: e.target.value, 
                              type: prev?.type || 'custody_chain' 
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="entity-type">Entity Type</Label>
                          <Select 
                            value={lineageEntity?.type || 'custody_chain'} 
                            onValueChange={(value) => setLineageEntity(prev => ({ 
                              ...prev, 
                              type: value, 
                              id: prev?.id || '' 
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custody_chain">Custody Chain</SelectItem>
                              <SelectItem value="plot">Plot</SelectItem>
                              <SelectItem value="facility">Facility</SelectItem>
                              <SelectItem value="production_lot">Production Lot</SelectItem>
                              <SelectItem value="shipment">Shipment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button 
                            onClick={() => setLineageDialog(true)}
                            disabled={!lineageEntity?.id}
                            data-testid="trace-lineage-button"
                          >
                            Trace Lineage
                          </Button>
                        </div>
                      </div>
                      
                      {lineageEntity?.id && (
                        <LineageVisualization 
                          entityId={lineageEntity.id}
                          entityType={lineageEntity.type}
                          direction="full"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mass-balance" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Mass Balance Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-blue-600">98.2%</div>
                          <p className="text-xs text-gray-600">Average Efficiency</p>
                          <p className="text-xs text-green-600 mt-1">↑ 2.1% from last month</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-orange-600">15</div>
                          <p className="text-xs text-gray-600">Active Chains</p>
                          <p className="text-xs text-gray-600 mt-1">Across 8 facilities</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-red-600">3</div>
                          <p className="text-xs text-gray-600">Anomalies Detected</p>
                          <p className="text-xs text-red-600 mt-1">Requires attention</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Recent Mass Balance Events</h4>
                      <div className="space-y-2">
                        {[
                          { id: 1, type: 'transformation', facility: 'Mill A', efficiency: '97.8%', status: 'valid' },
                          { id: 2, type: 'split', facility: 'Processing Center B', efficiency: '99.1%', status: 'valid' },
                          { id: 3, type: 'merge', facility: 'Collection Point C', efficiency: '95.2%', status: 'warning' },
                        ].map(event => (
                          <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h5 className="font-medium capitalize">{event.type} Event</h5>
                              <p className="text-sm text-gray-600">{event.facility}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{event.efficiency}</p>
                              <Badge className={event.status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipments" className="mt-6">
                {/* Controls */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Shipment Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="shipment-select">Select Shipment</Label>
                        <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose shipment for traceability" />
                          </SelectTrigger>
                          <SelectContent>
                            {shipments && Array.isArray(shipments) && shipments.map((shipment: any) => (
                              <SelectItem key={shipment.id} value={shipment.id}>
                                {shipment.shipmentId} - {shipment.destination}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mill-filter">Filter by Mill</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="All mills" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Mills</SelectItem>
                            {mills && Array.isArray(mills) && mills.map((mill: any) => (
                              <SelectItem key={mill.id} value={mill.id}>
                                {mill.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date-range">Date Range</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Last 30 days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status-filter">Status Filter</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Traceability Flow */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Supply Chain Traceability Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SupplyChainFlow shipmentId={selectedShipment} />
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <MapPin className="h-8 w-8 text-kpn-red" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Active Plots</p>
                          <p className="text-2xl font-bold text-gray-900">247</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Truck className="h-8 w-8 text-warning" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">In Transit</p>
                          <p className="text-2xl font-bold text-gray-900">12</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Factory className="h-8 w-8 text-accent" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Processing</p>
                          <p className="text-2xl font-bold text-gray-900">8</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Ship className="h-8 w-8 text-primary" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Ready to Ship</p>
                          <p className="text-2xl font-bold text-gray-900">3</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Shipments Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Shipments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">Shipment ID</th>
                            <th className="px-6 py-3">Destination</th>
                            <th className="px-6 py-3">Weight</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Ship Date</th>
                            <th className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipments && Array.isArray(shipments) && shipments.map((shipment: any) => (
                            <tr key={shipment.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {shipment.shipmentId}
                              </td>
                              <td className="px-6 py-4">{shipment.destination}</td>
                              <td className="px-6 py-4">{shipment.weight} tonnes</td>
                              <td className="px-6 py-4">
                                <Badge 
                                  className={
                                    shipment.status === 'shipped' ? 'bg-green-100 text-green-800' :
                                    shipment.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }
                                >
                                  {shipment.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                {shipment.shipDate ? new Date(shipment.shipDate).toLocaleDateString() : 'Not shipped'}
                              </td>
                              <td className="px-6 py-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setLineageEntity({ id: shipment.id, type: 'shipment' });
                                    setLineageDialog(true);
                                  }}
                                  data-testid={`trace-shipment-${shipment.id}`}
                                >
                                  View Trace
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Lineage Visualization Dialog */}
            <Dialog open={lineageDialog} onOpenChange={setLineageDialog}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Supply Chain Lineage Visualization</DialogTitle>
                </DialogHeader>
                {lineageEntity && (
                  <LineageVisualization 
                    entityId={lineageEntity.id}
                    entityType={lineageEntity.type}
                    direction="full"
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}