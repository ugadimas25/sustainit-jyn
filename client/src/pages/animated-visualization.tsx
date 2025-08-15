import { useState } from 'react';
import { SupplyChainFlowMap } from '@/components/animated-map/supply-chain-flow-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  MapPin, 
  TrendingUp, 
  Zap, 
  Globe,
  BarChart3,
  Layers,
  Play
} from 'lucide-react';

export function AnimatedVisualizationPage() {
  const [activeTab, setActiveTab] = useState('flow-map');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Animated Geospatial Visualization
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive supply chain data visualization with real-time animations and playful map interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Live Data
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Animated
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flow-map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Supply Chain Flow
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Activity Heatmap
          </TabsTrigger>
          <TabsTrigger value="risk-map" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Risk Visualization
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Live Analytics
          </TabsTrigger>
        </TabsList>

        {/* Supply Chain Flow Map */}
        <TabsContent value="flow-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Interactive Supply Chain Flow Visualization
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Watch animated supply chain flows with real-time shipment tracking, facility monitoring, 
                and compliance visualization. Click on markers for detailed information and watch routes animate as shipments move.
              </p>
            </CardHeader>
            <CardContent>
              <SupplyChainFlowMap />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Heatmap */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Activity Heatmap Visualization
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize supply chain activity density with animated heatmaps showing volume, 
                frequency, and intensity of operations across geographical regions.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full rounded-lg border bg-muted/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Activity Heatmap</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Heatmap visualization will show activity density, volume patterns, 
                      and operational intensity across your supply chain network.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    <Play className="h-4 w-4 mr-2" />
                    Launch Heatmap View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Visualization */}
        <TabsContent value="risk-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-500" />
                Risk Assessment Visualization
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Interactive risk mapping with deforestation alerts, compliance status, 
                and animated risk propagation through supply chain networks.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full rounded-lg border bg-muted/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Globe className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Risk Assessment Map</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Visual risk assessment with animated deforestation alerts, 
                      compliance tracking, and risk propagation analysis.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    <Play className="h-4 w-4 mr-2" />
                    Launch Risk View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">127</p>
                    <p className="text-sm text-muted-foreground">Active Facilities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-sm text-muted-foreground">Live Shipments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">892</p>
                    <p className="text-sm text-muted-foreground">Monitored Plots</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Real-time Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full rounded-lg border bg-muted/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Live Analytics Dashboard</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Real-time charts and metrics showing supply chain performance, 
                      compliance trends, and operational efficiency indicators.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Open Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">Animated Interactions</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Playful animations with bouncing markers, flowing supply routes, 
              and smooth transitions that make data exploration engaging and intuitive.
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
              Live supply chain data with real-time updates, animated timeline controls, 
              and progressive data reveal for temporal analysis.
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">Multi-layer Visualization</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Multiple visualization modes including heatmaps, cluster analysis, 
              flow networks, and risk assessment layers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}