import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, Factory, Truck } from "lucide-react";

interface HarvestSource {
  id: string;
  name: string;
  level: 1 | 2;
  weight: number;
  code: string;
  certified: boolean;
  center?: string;
}

interface HarvestCollection {
  id: string;
  name: string;
  code: string;
  totalWeight: number;
  facility: string;
}

interface HarvestCollectionLinkageProps {
  onUpdate?: (linkage: any) => void;
}

export function HarvestCollectionLinkage({ onUpdate }: HarvestCollectionLinkageProps) {
  const [level1Sources, setLevel1Sources] = useState<HarvestSource[]>([
    {
      id: "hc27487.19.214",
      name: "SAKERI NIAH",
      level: 1,
      weight: 44.75,
      code: "18100000025 - SAKERI NIAH\n18100000025.MK01 - SAKERI NIAH's Field",
      certified: true
    }
  ]);

  const [level2Sources, setLevel2Sources] = useState<HarvestSource[]>([
    {
      id: "hc27487.19.217",
      name: "Collection Point A",
      level: 2,
      weight: 44.75,
      code: "HC27487.19.217",
      certified: true,
      center: "Fermentation Center"
    },
    {
      id: "hc27487.19.218", 
      name: "Collection Point B",
      level: 2,
      weight: 46.75,
      code: "HC27487.19.218", 
      certified: true,
      center: "Fermentation Center"
    },
    {
      id: "hc27487.19.219",
      name: "Collection Point C", 
      level: 2,
      weight: 42.90,
      code: "HC27487.19.219",
      certified: true,
      center: "Fermentation Center"
    },
    {
      id: "hc27487.19.220",
      name: "Collection Point D",
      level: 2,
      weight: 49.75,
      code: "HC27487.19.220",
      certified: true,
      center: "Fermentation Center"
    },
    {
      id: "hc27487.19.221",
      name: "Collection Point E",
      level: 2,
      weight: 45.3,
      code: "HC27487.19.221",
      certified: true,
      center: "Fermentation Center"
    }
  ]);

  const [selectedCollection] = useState<HarvestCollection>({
    id: "hc3.1.168",
    name: "Central Collection Hub",
    code: "HC3.1.168",
    totalWeight: 229.5,
    facility: "Fermentation Center"
  });

  const addLevel1Source = () => {
    const newSource: HarvestSource = {
      id: `hc${Date.now()}`,
      name: `New Source ${level1Sources.length + 1}`,
      level: 1,
      weight: 0,
      code: `HC${Date.now()}`,
      certified: false
    };
    setLevel1Sources([...level1Sources, newSource]);
  };

  const addLevel2Source = () => {
    const newSource: HarvestSource = {
      id: `hc${Date.now()}`,
      name: `Collection Point ${String.fromCharCode(65 + level2Sources.length)}`,
      level: 2,
      weight: 0,
      code: `HC${Date.now()}`,
      certified: false,
      center: "Fermentation Center"
    };
    setLevel2Sources([...level2Sources, newSource]);
  };

  const removeLevel1Source = (id: string) => {
    setLevel1Sources(level1Sources.filter(source => source.id !== id));
  };

  const removeLevel2Source = (id: string) => {
    setLevel2Sources(level2Sources.filter(source => source.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Harvest Collection HC3.1.168
          </h1>
          <p className="text-gray-600">
            Click on a harvest collection to select it. Harvesting activities can't be selected.
          </p>
        </div>

        {/* Linkage Visualization */}
        <div className="grid grid-cols-4 gap-8 items-start">
          {/* Sources Level 1 */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">SOURCES LEVEL 1</h2>
              <Button
                onClick={addLevel1Source}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Source
              </Button>
            </div>
            
            <div className="space-y-3">
              {level1Sources.map((source, index) => (
                <Card
                  key={source.id}
                  className="bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors relative group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-purple-800">{source.code}</h3>
                      <Button
                        onClick={() => removeLevel1Source(source.id)}
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-purple-700">
                      <div className="font-medium">{source.weight} Kg</div>
                      <div className="mt-1 text-xs">
                        {source.name}
                      </div>
                    </div>
                    {source.certified && (
                      <Badge className="mt-2 text-xs bg-green-100 text-green-800 border-green-300">
                        Certified
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="flex items-center justify-center pt-20">
            <div className="flex items-center">
              <div className="w-16 h-0.5 bg-gray-400"></div>
              <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-gray-400 border-b-4 border-b-transparent"></div>
            </div>
          </div>

          {/* Sources Level 2 */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">SOURCES LEVEL 2</h2>
              <Button
                onClick={addLevel2Source}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Source
              </Button>
            </div>
            
            <div className="space-y-3">
              {level2Sources.map((source, index) => (
                <div key={source.id} className="relative">
                  <Card className="bg-teal-50 border-teal-200 hover:bg-teal-100 transition-colors relative group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-teal-800">{source.code}</h3>
                        <Button
                          onClick={() => removeLevel2Source(source.id)}
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-teal-700">
                        <div className="font-medium">{source.weight} Kg</div>
                        <div className="mt-1 text-xs">
                          {source.center}
                        </div>
                      </div>
                      {source.certified && (
                        <Badge className="mt-2 text-xs bg-green-100 text-green-800 border-green-300">
                          Certified
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Connection arrow from level 2 to selected */}
                  {index < level2Sources.length && (
                    <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Collection */}
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">SELECTED</h2>
            </div>
            
            <Card className="bg-orange-50 border-orange-300 border-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Factory className="w-6 h-6 text-orange-600 mr-2" />
                    <h3 className="text-lg font-bold text-orange-800">{selectedCollection.code}</h3>
                  </div>
                  <div className="text-2xl font-bold text-orange-700 mb-1">
                    {selectedCollection.totalWeight} Kg
                  </div>
                  <div className="text-sm text-orange-600 mb-4">
                    {selectedCollection.facility}
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    Final Destination
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Actions */}
            <div className="space-y-3 mt-8">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onUpdate?.({ level1Sources, level2Sources, selectedCollection })}
              >
                Edit "HC3.1.168"
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Move to...</div>
                <div>Sources</div>
                <div>Destinations</div>
                <div>Manual Weight Changes</div>
                <div>Certifications</div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-12 grid grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Level 1 Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{level1Sources.length}</div>
              <p className="text-xs text-gray-500">Primary collection points</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Level 2 Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{level2Sources.length}</div>
              <p className="text-xs text-gray-500">Secondary collection points</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Factory className="w-4 h-4" />
                Total Weight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedCollection.totalWeight} Kg</div>
              <p className="text-xs text-gray-500">Final collection weight</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}