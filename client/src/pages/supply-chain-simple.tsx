import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, Factory, TreePine, Home, Truck, Users, Package, ArrowRight, ArrowDown, Trash2, Eye, MapPin, Navigation
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface TierSupplier {
  id: string;
  name: string;
  category: string;
  location: string;
  details: string;
  assignedTier?: number;
}

interface TierAssignment {
  [tierNumber: number]: TierSupplier[];
}

interface DraggedItem {
  category: string;
  supplier: any;
}

export default function SupplyChainSimple() {
  const [tierAssignments, setTierAssignments] = useState<TierAssignment>({
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  });
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleDragStart = (category: string, supplier: any) => {
    setDraggedItem({ category, supplier });
  };

  const handleDragStartFromTier = (supplier: TierSupplier, fromTier: number) => {
    setDraggedItem({ 
      category: supplier.category, 
      supplier: {
        id: supplier.id.split('-')[1], // Extract original ID
        name: supplier.name,
        location: supplier.location,
        details: supplier.details
      }
    });
    
    // Remove from current tier when starting drag
    removeFromTier(fromTier, supplier.id);
  };

  const handleDragOver = (e: React.DragEvent, tierNumber: number) => {
    e.preventDefault();
    setDragOverTarget(`tier-${tierNumber}`);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDropToTier = (e: React.DragEvent, tierNumber: number) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    if (draggedItem) {
      const supplier = draggedItem.supplier;
      const tierSupplier: TierSupplier = {
        id: `${draggedItem.category}-${supplier.id}`,
        name: supplier.name,
        category: draggedItem.category,
        location: supplier.location,
        details: supplier.capacity || supplier.members || supplier.type || '',
        assignedTier: tierNumber
      };

      // Check if supplier already exists in this tier
      const exists = tierAssignments[tierNumber].some(s => s.id === tierSupplier.id);
      
      if (!exists) {
        setTierAssignments(prev => ({
          ...prev,
          [tierNumber]: [...prev[tierNumber], tierSupplier]
        }));
      }
    }
    setDraggedItem(null);
  };

  const removeFromTier = (tierNumber: number, supplierId: string) => {
    setTierAssignments(prev => ({
      ...prev,
      [tierNumber]: prev[tierNumber].filter(s => s.id !== supplierId)
    }));
  };

  const clearTier = (tierNumber: number) => {
    setTierAssignments(prev => ({
      ...prev,
      [tierNumber]: []
    }));
  };

  const saveTierAssignments = async () => {
    try {
      console.log('Saving tier assignments:', tierAssignments);
      // Here you would normally send to API
      // await apiRequest('/api/supply-chain/tiers', {
      //   method: 'POST',
      //   data: tierAssignments
      // });
      alert('Supply chain configuration saved successfully!');
    } catch (error) {
      console.error('Error saving tier assignments:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  const clearAllTiers = () => {
    setTierAssignments({
      1: [],
      2: [],
      3: [],
      4: [],
      5: []
    });
  };

  const renderTraceabilityVisualization = () => {
    const hasAssignments = Object.values(tierAssignments).some(tier => tier.length > 0);
    
    if (!hasAssignments) {
      return (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Supply Chain Configuration</h3>
            <p>Configure your tier assignments first to view the traceability map.</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">End-to-End Traceability Map</h2>
          <p className="text-gray-600">Complete supply chain flow from source to destination</p>
        </div>
        
        <Card className="p-8">
          <div className="space-y-8">
            {[1, 2, 3, 4, 5].map(tierNumber => {
              const suppliers = tierAssignments[tierNumber] || [];
              if (suppliers.length === 0) return null;
              
              return (
                <div key={tierNumber}>
                  <div className="flex items-center mb-4">
                    <Badge className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1">
                      Tier {tierNumber}
                    </Badge>
                    <div className="ml-4 h-px bg-gray-300 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                    {suppliers.map(supplier => {
                      const categoryInfo = SUPPLIER_CATEGORIES[supplier.category as keyof typeof SUPPLIER_CATEGORIES];
                      return (
                        <div key={supplier.id} className="bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <categoryInfo.icon className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{supplier.name}</div>
                              <div className="text-xs text-gray-500 truncate">{supplier.location}</div>
                              <Badge className={`${categoryInfo.color} text-xs mt-1`}>
                                {supplier.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {tierNumber < 5 && tierAssignments[tierNumber + 1]?.length > 0 && (
                    <div className="flex justify-center mb-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <ArrowDown className="h-5 w-5" />
                        <span className="text-sm">Flows to Tier {tierNumber + 1}</span>
                        <ArrowDown className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Supply Chain Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              {[1, 2, 3, 4, 5].map(tierNumber => (
                <div key={tierNumber} className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {tierAssignments[tierNumber]?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Tier {tierNumber}</div>
                  <div className="text-xs text-gray-500">
                    {tierAssignments[tierNumber]?.length > 0 ? 'Active' : 'Empty'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>Total Suppliers:</span>
                <span className="font-medium">{Object.values(tierAssignments).flat().length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Active Tiers:</span>
                <span className="font-medium">
                  {Object.values(tierAssignments).filter(tier => tier.length > 0).length} of 5
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGPSJourneyMap = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    
    // Mock GPS coordinates for each supplier with realistic Indonesian palm oil locations
    const supplierGPSData = {
      'estate': [
        { id: 1, name: 'PT Astra Agro Lestari', lat: -2.5489, lng: 111.2183, tier: 1 }, // Central Kalimantan
        { id: 2, name: 'PT Sampoerna Agro', lat: -1.2379, lng: 116.8444, tier: 1 }, // East Kalimantan
        { id: 3, name: 'PT Golden Agri-Resources', lat: -0.5014, lng: 117.1436, tier: 1 }, // East Kalimantan
      ],
      'mill': [
        { id: 4, name: 'Sawit Sumbermas Mill', lat: -2.2885, lng: 111.6644, tier: 2 }, // Central Kalimantan
        { id: 5, name: 'Astra Agro Mill Complex', lat: -1.5537, lng: 117.1436, tier: 2 }, // East Kalimantan
      ],
      'shf': [
        { id: 6, name: 'Kelompok Tani Makmur', lat: -2.6444, lng: 111.5183, tier: 2 }, // Central Kalimantan
        { id: 7, name: 'Koperasi Sawit Bersama', lat: -1.1879, lng: 116.7944, tier: 2 }, // East Kalimantan
      ],
      'business': [
        { id: 8, name: 'PT Sinar Mas Trading', lat: -6.2088, lng: 106.8456, tier: 3 }, // Jakarta
        { id: 9, name: 'PT Indo Food Agri', lat: -6.1751, lng: 106.8650, tier: 3 }, // Jakarta
      ],
      'bulking': [
        { id: 10, name: 'Tanjung Perak Port', lat: -7.2575, lng: 112.7521, tier: 4 }, // Surabaya
        { id: 11, name: 'Jakarta Port Authority', lat: -6.1045, lng: 106.8779, tier: 4 }, // Jakarta
      ]
    };

    useEffect(() => {
      if (!mapRef.current) return;

      // Initialize map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([-2.5, 113.9], 6);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;

      // Clear existing layers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Get assigned suppliers and their GPS coordinates
      const assignedSuppliers = Object.values(tierAssignments).flat();
      const supplierCoords: any[] = [];

      // Add markers for assigned suppliers
      assignedSuppliers.forEach((supplier, index) => {
        // Map supplier category to GPS data key
        const categoryMap: {[key: string]: string} = {
          'estates': 'estate',
          'mills': 'mill', 
          'shf': 'shf',
          'businesses': 'business',
          'bulking': 'bulking'
        };
        
        const gpsKey = categoryMap[supplier.category] || supplier.category;
        const categoryGPSData = supplierGPSData[gpsKey as keyof typeof supplierGPSData] || [];
        
        // Get a GPS point for this supplier (cycling through available points)
        const gpsData = categoryGPSData[index % categoryGPSData.length];
        
        if (gpsData) {
          supplierCoords.push({...gpsData, supplier, assignedTier: supplier.assignedTier});
          
          // Create custom icon based on category
          const iconHtml = supplier.category === 'estates' ? '🌴' : 
                          supplier.category === 'mills' ? '🏭' : 
                          supplier.category === 'shf' ? '👥' : 
                          supplier.category === 'businesses' ? '🏢' : 
                          supplier.category === 'bulking' ? '🚢' : '📍';
          
          const customIcon = L.divIcon({
            html: `<div style="background: white; border-radius: 50%; padding: 4px; border: 2px solid #3B82F6; font-size: 16px;">${iconHtml}</div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          const marker = L.marker([gpsData.lat, gpsData.lng], { icon: customIcon })
            .bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">${supplier.name}</h3>
                <p style="margin: 4px 0;"><strong>Category:</strong> ${supplier.category}</p>
                <p style="margin: 4px 0;"><strong>Assigned Tier:</strong> ${supplier.assignedTier}</p>
                <p style="margin: 4px 0;"><strong>Location:</strong> ${supplier.location}</p>
                <p style="margin: 4px 0;"><strong>GPS:</strong> ${gpsData.lat.toFixed(4)}, ${gpsData.lng.toFixed(4)}</p>
              </div>
            `)
            .addTo(map);
        }
      });

      // Draw arrows between tiers to show product flow
      const tierCoords: { [key: number]: any[] } = {};
      supplierCoords.forEach(coord => {
        if (!tierCoords[coord.assignedTier]) tierCoords[coord.assignedTier] = [];
        tierCoords[coord.assignedTier].push(coord);
      });

      // Create flow lines between tiers
      for (let tier = 1; tier <= 4; tier++) {
        const currentTier = tierCoords[tier];
        const nextTier = tierCoords[tier + 1];
        
        if (currentTier && nextTier) {
          currentTier.forEach(source => {
            nextTier.forEach(destination => {
              // Create curved line for better visualization
              const latlngs = [
                [source.lat, source.lng],
                [(source.lat + destination.lat) / 2, (source.lng + destination.lng) / 2],
                [destination.lat, destination.lng]
              ];
              
              const polyline = L.polyline(latlngs, {
                color: '#EF4444',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 5'
              }).addTo(map);
              
              // Add arrow decorator
              const arrowIcon = L.divIcon({
                html: '➤',
                className: '',
                iconSize: [20, 20]
              });
              
              const midPoint: [number, number] = [(source.lat + destination.lat) / 2, (source.lng + destination.lng) / 2];
              L.marker(midPoint, { icon: arrowIcon }).addTo(map);
            });
          });
        }
      }

      // Fit map to show all markers
      if (supplierCoords.length > 0) {
        const group = new L.FeatureGroup(
          supplierCoords.map(coord => L.marker([coord.lat, coord.lng]))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [tierAssignments]);

    const hasAssignments = Object.values(tierAssignments).some(tier => tier.length > 0);
    
    if (!hasAssignments) {
      return (
        <Card className="p-12 text-center">
          <div className="text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Supply Chain to Map</h3>
            <p>Configure your tier assignments first to view the GPS journey map with product flow arrows.</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">GPS Journey Map</h2>
          <p className="text-gray-600">Interactive map showing product traceability journey with GPS coordinates and flow arrows</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              OpenStreetMap Traceability Visualization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-[600px] rounded-lg border"
              style={{ minHeight: '600px' }}
            />
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Map Legend:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>🌴 Estates (Tier 1) - Source plantations</li>
                  <li>🏭 Mills (Tier 2) - Processing facilities</li>
                  <li>👥 SHF Groups (Tier 2) - Smallholder cooperatives</li>
                  <li>🏢 Business (Tier 3) - Trading companies</li>
                  <li>🚢 Bulking (Tier 4) - Ports and distribution</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Journey Flow:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Red dashed lines show product flow paths</li>
                  <li>• Arrows indicate direction of movement</li>
                  <li>• Click markers for detailed GPS information</li>
                  <li>• Map auto-fits to show your supply chain network</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Journey Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(tierAssignments).flat().length}
                </div>
                <div className="text-sm text-gray-600">Total Locations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(tierAssignments).filter(tier => tier.length > 0).length}
                </div>
                <div className="text-sm text-gray-600">Active Tiers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(tierAssignments).flat().reduce((total, supplier) => {
                    const gpsData = Object.values(supplierGPSData).flat().find(gps => 
                      gps.name.toLowerCase().includes(supplier.name.toLowerCase().substring(0, 10))
                    );
                    return total + (gpsData ? 1 : 0);
                  }, 0)}
                </div>
                <div className="text-sm text-gray-600">GPS Mapped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Object.values(tierAssignments).length - 1}
                </div>
                <div className="text-sm text-gray-600">Flow Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSupplierCard = (supplier: any, category: string) => {
    const categoryInfo = SUPPLIER_CATEGORIES[category as keyof typeof SUPPLIER_CATEGORIES];
    
    return (
      <div
        key={supplier.id}
        draggable
        onDragStart={() => handleDragStart(category, supplier)}
        className="p-3 border rounded-lg cursor-move transition-all duration-200 border-gray-200 bg-white hover:shadow-md hover:border-gray-300"
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

  const renderTierDropZone = (tierNumber: number) => {
    const suppliers = tierAssignments[tierNumber] || [];
    const isDropTarget = dragOverTarget === `tier-${tierNumber}`;
    const isEmpty = suppliers.length === 0;

    return (
      <div
        onDragOver={(e) => handleDragOver(e, tierNumber)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDropToTier(e, tierNumber)}
        className={`min-h-32 p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
          isDropTarget 
            ? 'border-blue-500 bg-blue-50' 
            : isEmpty 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-gray-200 bg-white'
        }`}
        data-testid={`tier-${tierNumber}-drop-zone`}
      >
        {isEmpty ? (
          <div className="text-center text-gray-500 py-4">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Drop suppliers here for Tier {tierNumber}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map(supplier => (
              <div 
                key={supplier.id} 
                draggable
                onDragStart={() => handleDragStartFromTier(supplier, tierNumber)}
                className="flex items-center justify-between p-2 bg-white rounded border cursor-move hover:shadow-md transition-all duration-200"
                data-testid={`tier-supplier-${supplier.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={SUPPLIER_CATEGORIES[supplier.category as keyof typeof SUPPLIER_CATEGORIES].color}>
                      {supplier.category}
                    </Badge>
                    <span className="font-medium text-sm">{supplier.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{supplier.location}</p>
                  {supplier.details && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {supplier.details}
                    </Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeFromTier(tierNumber, supplier.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  data-testid={`remove-tier-${tierNumber}-${supplier.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
            Configure your supply chain tiers and visualize the complete traceability flow
          </p>
        </div>

        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration">Tier Configuration</TabsTrigger>
            <TabsTrigger value="traceability">Traceability Flow</TabsTrigger>
            <TabsTrigger value="map">GPS Journey Map</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuration" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Supplier Categories - Compact Layout */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Supplier Pool</h2>
              <Badge variant="secondary" className="text-xs">
                {Object.values(tierAssignments).flat().length} assigned
              </Badge>
            </div>
            
            <div className="max-h-[800px] overflow-y-auto space-y-3">
              {Object.entries(SUPPLIER_CATEGORIES).map(([key, categoryInfo]) => (
                <Card key={key} className="border-l-4" style={{ borderLeftColor: '#4B5563' }}>
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <categoryInfo.icon className="h-4 w-4" />
                      <span className="truncate">{categoryInfo.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {SAMPLE_SUPPLIERS[key as keyof typeof SAMPLE_SUPPLIERS].length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 max-h-32 overflow-y-auto pt-0">
                    {SAMPLE_SUPPLIERS[key as keyof typeof SAMPLE_SUPPLIERS].map(supplier => (
                      <div
                        key={supplier.id}
                        draggable
                        onDragStart={() => handleDragStart(key, supplier)}
                        className="p-2 border rounded cursor-move transition-all duration-200 border-gray-200 bg-white hover:shadow-sm hover:border-gray-300 text-xs"
                        data-testid={`supplier-${key}-${supplier.id}`}
                      >
                        <div className="font-medium truncate">{supplier.name}</div>
                        <div className="text-gray-500 text-xs truncate">{supplier.location}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tier Assignment System */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tier-Based Supply Chain</h2>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={saveTierAssignments}
                  disabled={!Object.values(tierAssignments).some(tier => tier.length > 0)}
                  data-testid="save-tier-assignments"
                >
                  Save Configuration
                </Button>
                {Object.values(tierAssignments).some(tier => tier.length > 0) && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={clearAllTiers}
                    data-testid="clear-all-tiers"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(tierNumber => (
                <Card key={tierNumber}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowDown className="h-4 w-4" />
                      Tier {tierNumber}
                      <Badge variant="outline" className="ml-auto">
                        {tierAssignments[tierNumber]?.length || 0} suppliers
                      </Badge>
                      {tierAssignments[tierNumber]?.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => clearTier(tierNumber)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          data-testid={`clear-tier-${tierNumber}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderTierDropZone(tierNumber)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">How to Use Tier-Based Supply Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Assigning Suppliers to Tiers:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Drag any supplier from the Supplier Pool</li>
                  <li>• Drop it into any Tier (1-5) drop zone</li>
                  <li>• Multiple suppliers can be assigned to each tier</li>
                  <li>• Remove individual suppliers or clear entire tiers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Typical Tier Structure:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Tier 1:</strong> Direct suppliers (Estates, Mills)</li>
                  <li>• <strong>Tier 2:</strong> Regional suppliers (SHF groups)</li>
                  <li>• <strong>Tier 3:</strong> Business intermediaries</li>
                  <li>• <strong>Tier 4:</strong> Processing facilities</li>
                  <li>• <strong>Tier 5:</strong> Final distribution (Bulking, External)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
          
          <TabsContent value="traceability" className="space-y-6 mt-6">
            {renderTraceabilityVisualization()}
          </TabsContent>
          
          <TabsContent value="map" className="space-y-6 mt-6">
            {renderGPSJourneyMap()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}