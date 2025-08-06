import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Satellite, 
  CheckCircle, 
  XCircle,
  Loader2,
  Play,
  Globe,
  TreePine
} from "lucide-react";
import { wdpaApi, gfwApi, type WDPAVerificationResult, type GFWAnalysisResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function ApiTestPanel() {
  const [wdpaResult, setWdpaResult] = useState<WDPAVerificationResult | null>(null);
  const [gfwResult, setGfwResult] = useState<GFWAnalysisResult | null>(null);
  const { toast } = useToast();

  // Test coordinates in Indonesia (Kalimantan Timur)
  const testCoordinates: [number, number] = [110.123, -1.456];

  const wdpaTestMutation = useMutation({
    mutationFn: () => wdpaApi.verifyCoordinates(testCoordinates),
    onSuccess: (result) => {
      setWdpaResult(result);
      toast({
        title: "WDPA API Test Complete",
        description: `Protected area status: ${result.isInProtectedArea ? 'Protected' : 'Not protected'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "WDPA API Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  const gfwTestMutation = useMutation({
    mutationFn: () => gfwApi.getForestAnalysis(testCoordinates, 2024),
    onSuccess: (result) => {
      setGfwResult(result);
      toast({
        title: "GFW API Test Complete", 
        description: `Found ${result.alertsCount} alerts with ${Math.round(result.totalTreeCoverLoss)} ha tree loss`,
      });
    },
    onError: (error) => {
      toast({
        title: "GFW API Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          API Integration Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test WDPA and Global Forest Watch API connections
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Test Location: Kalimantan Timur, Indonesia</div>
          <div className="text-xs text-muted-foreground">
            Coordinates: {testCoordinates[1]}°N, {testCoordinates[0]}°E
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => wdpaTestMutation.mutate()}
            disabled={wdpaTestMutation.isPending}
            data-testid="button-test-wdpa"
          >
            {wdpaTestMutation.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Shield className="h-3 w-3 mr-1" />
            )}
            Test WDPA
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={() => gfwTestMutation.mutate()}
            disabled={gfwTestMutation.isPending}
            data-testid="button-test-gfw"
          >
            {gfwTestMutation.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Satellite className="h-3 w-3 mr-1" />
            )}
            Test GFW
          </Button>
        </div>

        {/* WDPA Results */}
        {wdpaResult && (
          <div className="space-y-2">
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-medium text-sm">WDPA Results</span>
                {wdpaResult.isInProtectedArea ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Protected Area:</span>
                  <Badge variant={wdpaResult.isInProtectedArea ? "destructive" : "default"}>
                    {wdpaResult.isInProtectedArea ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Legal Status:</span>
                  <span className="font-medium">{wdpaResult.legalStatus}</span>
                </div>
                {wdpaResult.protectedAreas.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Areas found:</span>
                    <div className="mt-1">
                      {wdpaResult.protectedAreas.slice(0, 2).map((area, index) => (
                        <div key={index} className="text-xs">
                          {area.name} ({area.designation})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* GFW Results */}
        {gfwResult && (
          <div className="space-y-2">
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Satellite className="h-4 w-4" />
                <span className="font-medium text-sm">GFW Results</span>
                {gfwResult.alertsCount > 0 ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Alerts:</span>
                  <span className="font-medium">{gfwResult.alertsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tree Cover Loss:</span>
                  <span className="font-medium">{Math.round(gfwResult.totalTreeCoverLoss)} ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Primary Forest Loss:</span>
                  <Badge variant={gfwResult.primaryForestLoss ? "destructive" : "default"}>
                    {gfwResult.primaryForestLoss ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Protected Area Overlap:</span>
                  <Badge variant={gfwResult.protectedAreaOverlap ? "destructive" : "default"}>
                    {gfwResult.protectedAreaOverlap ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Status Indicator */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>WDPA API:</span>
              <span className={wdpaResult ? 'text-green-600' : 'text-gray-500'}>
                {wdpaResult ? 'Connected' : 'Not tested'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GFW API:</span>
              <span className={gfwResult ? 'text-green-600' : 'text-gray-500'}>
                {gfwResult ? 'Connected' : 'Not tested'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}