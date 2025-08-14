import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Truck, Split, Merge, BarChart3, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustodyChain {
  id: string;
  chainId: string;
  sourcePlot?: any;
  sourceFacility?: any;
  destinationFacility?: any;
  productType: string;
  totalQuantity: number;
  remainingQuantity: number;
  status: string;
  qualityGrade?: string;
  batchNumber?: string;
  harvestDate?: string;
  expiryDate?: string;
}

interface CustodyEvent {
  id: string;
  eventType: string;
  eventTime: string;
  businessStep: string;
  disposition: string;
  quantity?: number;
  uom: string;
  facility?: any;
  recordedBy?: any;
}

interface MassBalanceValidation {
  isValid: boolean;
  totalInput: number;
  totalOutput: number;
  totalWaste: number;
  efficiency: number;
  discrepancies: any[];
}

export function CustodyChainPanel() {
  const [selectedChain, setSelectedChain] = useState<CustodyChain | null>(null);
  const [newChainDialog, setNewChainDialog] = useState(false);
  const [splitDialog, setSplitDialog] = useState(false);
  const [eventDialog, setEventDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch custody chains
  const { data: chains = [], isLoading } = useQuery({
    queryKey: ['/api/custody-chains'],
    queryFn: async () => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetCustodyChains {
              getCustodyChains {
                id
                chainId
                sourcePlot { id name }
                sourceFacility { id name facilityType }
                destinationFacility { id name facilityType }
                productType
                totalQuantity
                remainingQuantity
                status
                qualityGrade
                batchNumber
                harvestDate
                expiryDate
              }
            }
          `
        })
      });
      const result = await response.json();
      return result.data?.getCustodyChains || [];
    }
  });

  // Fetch events for selected chain
  const { data: events = [] } = useQuery({
    queryKey: ['/api/custody-events', selectedChain?.id],
    queryFn: async () => {
      if (!selectedChain) return [];
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetCustodyEvents($chainId: ID!) {
              getCustodyEvents(chainId: $chainId) {
                id
                eventType
                eventTime
                businessStep
                disposition
                quantity
                uom
                facility { name facilityType }
                recordedBy { name }
              }
            }
          `,
          variables: { chainId: selectedChain.id }
        })
      });
      const result = await response.json();
      return result.data?.getCustodyEvents || [];
    },
    enabled: !!selectedChain
  });

  // Fetch mass balance validation for selected chain
  const { data: massBalance } = useQuery({
    queryKey: ['/api/mass-balance', selectedChain?.id],
    queryFn: async () => {
      if (!selectedChain) return null;
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query ValidateMassBalance($chainId: ID!) {
              validateMassBalance(chainId: $chainId) {
                isValid
                totalInput
                totalOutput
                totalWaste
                efficiency
                discrepancies {
                  type
                  expected
                  actual
                  variance
                  description
                }
              }
            }
          `,
          variables: { chainId: selectedChain.id }
        })
      });
      const result = await response.json();
      return result.data?.validateMassBalance;
    },
    enabled: !!selectedChain
  });

  // Create new custody chain mutation
  const createChainMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateCustodyChain($input: CustodyChainInput!) {
              createCustodyChain(input: $input) {
                id
                chainId
                productType
                totalQuantity
                status
              }
            }
          `,
          variables: { input: data }
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custody-chains'] });
      setNewChainDialog(false);
      toast({ title: "Custody chain created successfully" });
    }
  });

  // Record event mutation
  const recordEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation RecordCustodyEvent($input: CustodyEventInput!) {
              recordCustodyEvent(input: $input) {
                id
                eventType
                eventTime
              }
            }
          `,
          variables: { input: data }
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custody-events'] });
      setEventDialog(false);
      toast({ title: "Event recorded successfully" });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading custody chains...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chain of Custody Management</h2>
        <div className="flex gap-2">
          <Dialog open={newChainDialog} onOpenChange={setNewChainDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-chain-button">
                <Plus className="w-4 h-4 mr-2" />
                New Chain
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Custody Chain</DialogTitle>
              </DialogHeader>
              <NewChainForm onSubmit={(data) => createChainMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chains List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Custody Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chains.map((chain: CustodyChain) => (
                <div
                  key={chain.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChain?.id === chain.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedChain(chain)}
                  data-testid={`chain-item-${chain.chainId}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{chain.chainId}</h4>
                    <Badge className={getStatusColor(chain.status)}>
                      {chain.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-1">{chain.productType}</p>
                  
                  <div className="flex justify-between text-xs">
                    <span>Total: {chain.totalQuantity} kg</span>
                    <span>Remaining: {chain.remainingQuantity} kg</span>
                  </div>
                  
                  {chain.totalQuantity > 0 && (
                    <Progress 
                      value={(chain.remainingQuantity / chain.totalQuantity) * 100} 
                      className="h-1 mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chain Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedChain ? `Chain Details: ${selectedChain.chainId}` : 'Select a Chain'}
              {selectedChain && (
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => setEventDialog(true)}>
                    <Truck className="w-4 h-4 mr-1" />
                    Record Event
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSplitDialog(true)}>
                    <Split className="w-4 h-4 mr-1" />
                    Split Chain
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedChain ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="mass-balance">Mass Balance</TabsTrigger>
                  <TabsTrigger value="lineage">Lineage</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-4">
                  <ChainDetailsTab chain={selectedChain} />
                </TabsContent>
                
                <TabsContent value="events" className="mt-4">
                  <EventsTab events={events} />
                </TabsContent>
                
                <TabsContent value="mass-balance" className="mt-4">
                  <MassBalanceTab validation={massBalance} />
                </TabsContent>
                
                <TabsContent value="lineage" className="mt-4">
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">View complete supply chain lineage</p>
                    <Button 
                      onClick={() => {
                        // Navigate to lineage visualization or trigger modal
                        window.dispatchEvent(new CustomEvent('showLineage', {
                          detail: { entityId: selectedChain.id, entityType: 'custody_chain' }
                        }));
                      }}
                    >
                      View Full Lineage
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a custody chain to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Recording Dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Custody Event</DialogTitle>
          </DialogHeader>
          {selectedChain && (
            <EventForm 
              chainId={selectedChain.id} 
              onSubmit={(data) => recordEventMutation.mutate(data)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components
function ChainDetailsTab({ chain }: { chain: CustodyChain }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-medium mb-3">Basic Information</h4>
        <div className="space-y-2 text-sm">
          <p><strong>Chain ID:</strong> {chain.chainId}</p>
          <p><strong>Product Type:</strong> {chain.productType}</p>
          <p><strong>Status:</strong> {chain.status}</p>
          <p><strong>Quality Grade:</strong> {chain.qualityGrade || 'N/A'}</p>
          <p><strong>Batch Number:</strong> {chain.batchNumber || 'N/A'}</p>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Quantity Information</h4>
        <div className="space-y-2 text-sm">
          <p><strong>Total Quantity:</strong> {chain.totalQuantity} kg</p>
          <p><strong>Remaining:</strong> {chain.remainingQuantity} kg</p>
          <p><strong>Processed:</strong> {chain.totalQuantity - chain.remainingQuantity} kg</p>
          <Progress 
            value={(chain.remainingQuantity / chain.totalQuantity) * 100} 
            className="mt-2"
          />
        </div>
      </div>
      
      {chain.sourceFacility && (
        <div>
          <h4 className="font-medium mb-3">Source Facility</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {chain.sourceFacility.name}</p>
            <p><strong>Type:</strong> {chain.sourceFacility.facilityType}</p>
          </div>
        </div>
      )}
      
      {chain.destinationFacility && (
        <div>
          <h4 className="font-medium mb-3">Destination Facility</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Name:</strong> {chain.destinationFacility.name}</p>
            <p><strong>Type:</strong> {chain.destinationFacility.facilityType}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EventsTab({ events }: { events: CustodyEvent[] }) {
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No events recorded</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{event.eventType}</h4>
              <span className="text-xs text-gray-500">
                {new Date(event.eventTime).toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Business Step:</strong> {event.businessStep}</p>
              <p><strong>Disposition:</strong> {event.disposition}</p>
              {event.quantity && (
                <p><strong>Quantity:</strong> {event.quantity} {event.uom}</p>
              )}
              {event.facility && (
                <p><strong>Location:</strong> {event.facility.name}</p>
              )}
            </div>
            
            {event.recordedBy && (
              <p className="text-xs text-gray-600 mt-2">
                Recorded by: {event.recordedBy.name}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function MassBalanceTab({ validation }: { validation: MassBalanceValidation | null }) {
  if (!validation) {
    return (
      <div className="text-center py-8 text-gray-500">
        No mass balance data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <div className={`p-4 rounded-lg ${validation.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          {validation.isValid ? (
            <>
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Mass Balance Valid</h4>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-800">Mass Balance Issues Detected</h4>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Efficiency: {validation.efficiency.toFixed(2)}%
        </p>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {validation.totalInput.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Total Input (kg)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {validation.totalOutput.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Total Output (kg)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {validation.totalWaste.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">Total Waste (kg)</p>
          </CardContent>
        </Card>
      </div>

      {/* Discrepancies */}
      {validation.discrepancies.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Discrepancies</h4>
          <div className="space-y-2">
            {validation.discrepancies.map((discrepancy, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <h5 className="font-medium text-red-800">{discrepancy.type}</h5>
                <p className="text-sm text-red-600">{discrepancy.description}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <span>Expected: {discrepancy.expected.toFixed(4)}</span>
                  <span>Actual: {discrepancy.actual.toFixed(4)}</span>
                  <span>Variance: {discrepancy.variance.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Form Components
function NewChainForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    chainId: '',
    sourcePlotId: '',
    productType: '',
    totalQuantity: '',
    qualityGrade: '',
    batchNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      totalQuantity: parseFloat(formData.totalQuantity)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="chainId">Chain ID</Label>
        <Input
          id="chainId"
          value={formData.chainId}
          onChange={(e) => setFormData({ ...formData, chainId: e.target.value })}
          placeholder="e.g., CHAIN-001"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="productType">Product Type</Label>
        <Select 
          value={formData.productType} 
          onValueChange={(value) => setFormData({ ...formData, productType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select product type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FFB">Fresh Fruit Bunches (FFB)</SelectItem>
            <SelectItem value="CPO">Crude Palm Oil (CPO)</SelectItem>
            <SelectItem value="PKO">Palm Kernel Oil (PKO)</SelectItem>
            <SelectItem value="PKC">Palm Kernel Cake (PKC)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="totalQuantity">Total Quantity (kg)</Label>
        <Input
          id="totalQuantity"
          type="number"
          step="0.01"
          value={formData.totalQuantity}
          onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="qualityGrade">Quality Grade</Label>
        <Input
          id="qualityGrade"
          value={formData.qualityGrade}
          onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
          placeholder="e.g., Grade A"
        />
      </div>
      
      <div>
        <Label htmlFor="batchNumber">Batch Number</Label>
        <Input
          id="batchNumber"
          value={formData.batchNumber}
          onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
          placeholder="e.g., BATCH-001"
        />
      </div>
      
      <Button type="submit" className="w-full">
        Create Chain
      </Button>
    </form>
  );
}

function EventForm({ chainId, onSubmit }: { chainId: string; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    eventType: '',
    businessStep: '',
    disposition: '',
    quantity: '',
    locationId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      chainId,
      ...formData,
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="eventType">Event Type</Label>
        <Select 
          value={formData.eventType} 
          onValueChange={(value) => setFormData({ ...formData, eventType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creation">Creation</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="transformation">Transformation</SelectItem>
            <SelectItem value="aggregation">Aggregation</SelectItem>
            <SelectItem value="disaggregation">Disaggregation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="businessStep">Business Step</Label>
        <Select 
          value={formData.businessStep} 
          onValueChange={(value) => setFormData({ ...formData, businessStep: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select business step" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="harvesting">Harvesting</SelectItem>
            <SelectItem value="collecting">Collecting</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="storing">Storing</SelectItem>
            <SelectItem value="shipping">Shipping</SelectItem>
            <SelectItem value="receiving">Receiving</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="disposition">Disposition</Label>
        <Select 
          value={formData.disposition} 
          onValueChange={(value) => setFormData({ ...formData, disposition: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select disposition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="destroyed">Destroyed</SelectItem>
            <SelectItem value="recalled">Recalled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="quantity">Quantity (kg) - Optional</Label>
        <Input
          id="quantity"
          type="number"
          step="0.01"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          placeholder="Enter quantity if applicable"
        />
      </div>
      
      <Button type="submit" className="w-full">
        Record Event
      </Button>
    </form>
  );
}