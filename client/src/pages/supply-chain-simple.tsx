import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, Factory, TreePine, Home, Truck, Users, Package, ArrowRight, ArrowDown, Trash2
} from "lucide-react";

// Define supplier categories
const SUPPLIER_CATEGORIES = {
  estates: { name: 'Estates', icon: TreePine, color: 'bg-green-100 text-green-800' },
  mills: { name: 'Mills', icon: Factory, color: 'bg-blue-100 text-blue-800' },
  external: { name: 'External Suppliers', icon: Building, color: 'bg-purple-100 text-purple-800' },
  shf: { name: 'Smallholder Farmers (SHF)', icon: Home, color: 'bg-orange-100 text-orange-800' },
  businesses: { name: 'Businesses', icon: Users, color: 'bg-teal-100 text-teal-800' },
  bulking: { name: 'Bulking', icon: Package, color: 'bg-amber-100 text-amber-800' }
};

// Sample data for each category
const SAMPLE_SUPPLIERS = {
  estates: [
    { id: 'estate-1', name: 'Riau Palm Estate', location: 'Riau Province', capacity: '500 MT/month' },
    { id: 'estate-2', name: 'Sumatra Green Estate', location: 'North Sumatra', capacity: '300 MT/month' },
    { id: 'estate-3', name: 'Jambi Palm Plantation', location: 'Jambi Province', capacity: '450 MT/month' },
  ],
  mills: [
    { id: 'mill-1', name: 'Central Palm Mill', location: 'Medan', capacity: '1000 MT/day' },
    { id: 'mill-2', name: 'Riau Processing Mill', location: 'Pekanbaru', capacity: '800 MT/day' },
    { id: 'mill-3', name: 'Jambi Oil Mill', location: 'Jambi City', capacity: '600 MT/day' },
  ],
  external: [
    { id: 'ext-1', name: 'PT Sinar Mas', location: 'Jakarta', type: 'Large Supplier' },
    { id: 'ext-2', name: 'Golden Agri Resources', location: 'Singapore', type: 'International' },
    { id: 'ext-3', name: 'Wilmar Trading', location: 'Kuala Lumpur', type: 'Regional Trader' },
  ],
  shf: [
    { id: 'shf-1', name: 'Farmers Cooperative A', location: 'West Riau', members: '250 farmers' },
    { id: 'shf-2', name: 'Small Holders Group B', location: 'East Sumatra', members: '180 farmers' },
    { id: 'shf-3', name: 'Village Palm Growers', location: 'Jambi Rural', members: '320 farmers' },
    { id: 'shf-4', name: 'Community Farmers C', location: 'Central Riau', members: '140 farmers' },
    { id: 'shf-5', name: 'Cooperative Palm D', location: 'South Sumatra', members: '200 farmers' },
    { id: 'shf-6', name: 'Smallholder Union E', location: 'North Jambi', members: '160 farmers' },
    { id: 'shf-7', name: 'Rural Growers F', location: 'West Sumatra', members: '90 farmers' },
    { id: 'shf-8', name: 'Farmers Alliance G', location: 'East Jambi', members: '275 farmers' },
  ],
  businesses: [
    { id: 'business-1', name: 'KPN Plantation Business Unit 1', location: 'Jakarta HQ', type: 'Primary Processing' },
    { id: 'business-2', name: 'KPN Plantation Business Unit 2', location: 'Medan Office', type: 'Collection & Trading' },
    { id: 'business-3', name: 'KPN Plantation Business Unit 3', location: 'Pekanbaru Office', type: 'Quality Control' },
    { id: 'business-4', name: 'KPN Plantation Business Unit 4', location: 'Jambi Office', type: 'Logistics Hub' },
  ],
  bulking: [
    { id: 'bulk-1', name: 'Central Bulking Station 1', location: 'Port of Dumai', capacity: '5000 MT' },
    { id: 'bulk-2', name: 'Northern Bulking Facility', location: 'Port of Belawan', capacity: '3000 MT' },
    { id: 'bulk-3', name: 'Southern Storage Hub', location: 'Jambi Port', capacity: '2500 MT' },
  ]
};

interface SupplyConnection {
  id: string;
  from: { category: string; id: string; name: string };
  to: { category: string; id: string; name: string };
}

interface DraggedItem {
  category: string;
  supplier: any;
}

export default function SupplyChainSimple() {
  const [connections, setConnections] = useState<SupplyConnection[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleDragStart = (category: string, supplier: any) => {
    setDraggedItem({ category, supplier });
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: string, targetSupplier: any) => {
    e.preventDefault();
    setDragOverTarget(`${targetCategory}-${targetSupplier.id}`);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string, targetSupplier: any) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    if (draggedItem && draggedItem.category !== targetCategory) {
      const newConnection: SupplyConnection = {
        id: `${draggedItem.category}-${draggedItem.supplier.id}-to-${targetCategory}-${targetSupplier.id}`,
        from: { 
          category: draggedItem.category, 
          id: draggedItem.supplier.id, 
          name: draggedItem.supplier.name 
        },
        to: { 
          category: targetCategory, 
          id: targetSupplier.id, 
          name: targetSupplier.name 
        }
      };

      // Check if connection already exists
      const exists = connections.some(conn => 
        conn.from.id === newConnection.from.id && conn.to.id === newConnection.to.id
      );

      if (!exists) {
        setConnections([...connections, newConnection]);
      }
    }
    setDraggedItem(null);
  };

  const removeConnection = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };

  const clearAllConnections = () => {
    setConnections([]);
  };

  const renderSupplierCard = (supplier: any, category: string) => {
    const categoryInfo = SUPPLIER_CATEGORIES[category as keyof typeof SUPPLIER_CATEGORIES];
    const isDropTarget = dragOverTarget === `${category}-${supplier.id}`;
    
    return (
      <div
        key={supplier.id}
        draggable
        onDragStart={() => handleDragStart(category, supplier)}
        onDragOver={(e) => handleDragOver(e, category, supplier)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, category, supplier)}
        className={`p-3 border rounded-lg cursor-move transition-all duration-200 ${
          isDropTarget 
            ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
            : 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
        }`}
        data-testid={`supplier-${category}-${supplier.id}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{supplier.name}</h4>
            <p className="text-xs text-gray-500 mb-2">{supplier.location}</p>
            {supplier.capacity && (
              <Badge variant="outline" className="text-xs">
                {supplier.capacity}
              </Badge>
            )}
            {supplier.members && (
              <Badge variant="outline" className="text-xs">
                {supplier.members}
              </Badge>
            )}
            {supplier.type && (
              <Badge variant="outline" className="text-xs">
                {supplier.type}
              </Badge>
            )}
          </div>
          <categoryInfo.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  };

  const renderConnectionFlow = () => {
    if (connections.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No supply chain connections created yet.</p>
          <p className="text-sm">Drag suppliers between categories to create connections.</p>
        </div>
      );
    }

    // Group connections by flow stages
    const flowStages: { [key: string]: SupplyConnection[] } = {};
    connections.forEach(conn => {
      const stageKey = `${conn.from.category}-to-${conn.to.category}`;
      if (!flowStages[stageKey]) {
        flowStages[stageKey] = [];
      }
      flowStages[stageKey].push(conn);
    });

    return (
      <div className="space-y-6">
        {Object.entries(flowStages).map(([stageKey, stageConnections]) => {
          const [fromCat, toCat] = stageKey.split('-to-');
          const fromInfo = SUPPLIER_CATEGORIES[fromCat as keyof typeof SUPPLIER_CATEGORIES];
          const toInfo = SUPPLIER_CATEGORIES[toCat as keyof typeof SUPPLIER_CATEGORIES];

          return (
            <div key={stageKey} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-4 mb-4">
                <Badge className={fromInfo.color}>
                  <fromInfo.icon className="h-3 w-3 mr-1" />
                  {fromInfo.name}
                </Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Badge className={toInfo.color}>
                  <toInfo.icon className="h-3 w-3 mr-1" />
                  {toInfo.name}
                </Badge>
              </div>
              <div className="space-y-2">
                {stageConnections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{conn.from.name}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">{conn.to.name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeConnection(conn.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      data-testid={`remove-connection-${conn.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
            Drag and drop suppliers between categories to create product flow connections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Supplier Categories */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Supplier Categories</h2>
              <Badge variant="secondary">{connections.length} connections</Badge>
            </div>
            
            {Object.entries(SUPPLIER_CATEGORIES).map(([key, categoryInfo]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <categoryInfo.icon className="h-5 w-5" />
                    {categoryInfo.name}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {SAMPLE_SUPPLIERS[key as keyof typeof SAMPLE_SUPPLIERS].length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {SAMPLE_SUPPLIERS[key as keyof typeof SAMPLE_SUPPLIERS].map(supplier => 
                    renderSupplierCard(supplier, key)
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Supply Chain Flow */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Supply Chain Flow</h2>
              {connections.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={clearAllConnections}
                  data-testid="clear-all-connections"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <Card className="min-h-96">
              <CardContent className="p-6">
                {renderConnectionFlow()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Creating Connections:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Drag a supplier from one category</li>
                  <li>• Drop it onto a supplier in another category</li>
                  <li>• The connection will appear in the flow diagram</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Flow:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Estates/SHF → Business Units</li>
                  <li>• Business Units → Mills</li>
                  <li>• Mills → Bulking Stations</li>
                  <li>• Bulking → External/Downstream</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}