import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TreePine,
  Satellite,
  MapPin,
  Calendar,
  BarChart3,
  Loader2
} from "lucide-react";
import { verificationApi, type ComprehensiveVerificationResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Plot {
  id: string;
  plotNumber: string;
  coordinates: unknown;
  polygon?: [number, number][];
}

interface VerificationPanelProps {
  plot: Plot;
  onVerificationComplete?: (result: ComprehensiveVerificationResult) => void;
}

export function VerificationPanel({ plot, onVerificationComplete }: VerificationPanelProps) {
  const [verificationResult, setVerificationResult] = useState<ComprehensiveVerificationResult | null>(null);
  const { toast } = useToast();

  const verificationMutation = useMutation({
    mutationFn: async () => {
      // Convert plot coordinates to the expected format
      let coordinates: number[][] | number[];
      
      if (plot.polygon && plot.polygon.length > 0) {
        coordinates = plot.polygon;
      } else if (plot.coordinates && typeof plot.coordinates === 'object') {
        // Handle different coordinate formats
        const coords = plot.coordinates as any;
        if (coords.lat && coords.lng) {
          coordinates = [coords.lng, coords.lat];
        } else if (Array.isArray(coords) && coords.length === 2) {
          coordinates = coords;
        } else {
          throw new Error('Invalid coordinate format');
        }
      } else {
        throw new Error('No coordinates available for verification');
      }

      return verificationApi.comprehensiveVerification(plot.id, coordinates);
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      onVerificationComplete?.(result);
      toast({
        title: "Verification Complete",
        description: `Plot ${plot.plotNumber} has been verified with ${result.complianceStatus} status`,
      });
    },
    onError: (error) => {
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'low-risk': return 'bg-yellow-500';
      case 'medium-risk': return 'bg-orange-500';
      case 'high-risk': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'low-risk': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'medium-risk': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'high-risk': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Real-time Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          WDPA & Global Forest Watch Integration
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Plot {plot.plotNumber}</div>
            <div className="text-sm text-muted-foreground">
              Comprehensive EUDR Compliance Check
            </div>
          </div>
          <Button 
            onClick={() => verificationMutation.mutate()}
            disabled={verificationMutation.isPending}
            data-testid="button-run-verification"
          >
            {verificationMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Verification
              </>
            )}
          </Button>
        </div>

        {verificationResult && (
          <div className="space-y-4">
            <Separator />
            
            {/* Overall Status */}
            <div className="flex items-center gap-3">
              {getStatusIcon(verificationResult.complianceStatus)}
              <div>
                <div className="font-medium">
                  Status: {verificationResult.complianceStatus.replace('-', ' ').toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">
                  EUDR Compliant: {verificationResult.eudrCompliant ? 'Yes' : 'No'}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(verificationResult.complianceStatus)}`} />
            </div>

            {/* Risk Factors */}
            {verificationResult.risks.length > 0 && (
              <div>
                <div className="font-medium text-sm mb-2">Risk Factors</div>
                <div className="space-y-1">
                  {verificationResult.risks.map((risk, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WDPA Analysis */}
            <div>
              <div className="font-medium text-sm mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Protected Area Analysis (WDPA)
              </div>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Protected Area Status:</span>
                  <Badge variant={verificationResult.wdpaAnalysis.isInProtectedArea ? "destructive" : "default"}>
                    {verificationResult.wdpaAnalysis.isInProtectedArea ? 'Protected Area' : 'Not Protected'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Legal Status:</span>
                  <span className="font-medium">{verificationResult.wdpaAnalysis.legalStatus}</span>
                </div>
                {verificationResult.wdpaAnalysis.protectedAreas.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Protected Areas:</div>
                    {verificationResult.wdpaAnalysis.protectedAreas.map((area, index) => (
                      <div key={index} className="text-xs">
                        {area.name} ({area.designation})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* GFW Analysis */}
            <div>
              <div className="font-medium text-sm mb-2 flex items-center gap-2">
                <Satellite className="h-4 w-4" />
                Forest Analysis (Global Forest Watch)
              </div>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Alerts:</span>
                    <div className="font-medium">{verificationResult.gfwAnalysis.alertsCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tree Cover Loss:</span>
                    <div className="font-medium">{Math.round(verificationResult.gfwAnalysis.totalTreeCoverLoss)} ha</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Biomass Loss:</span>
                    <div className="font-medium">{Math.round(verificationResult.gfwAnalysis.totalBiomassLoss)} Mg</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CO₂ Emissions:</span>
                    <div className="font-medium">{Math.round(verificationResult.gfwAnalysis.totalCarbonEmissions)} Mg</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Primary Forest Loss:</span>
                  <Badge variant={verificationResult.gfwAnalysis.primaryForestLoss ? "destructive" : "default"}>
                    {verificationResult.gfwAnalysis.primaryForestLoss ? 'Detected' : 'None'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <div className="font-medium text-sm mb-2">Recommended Actions</div>
              <div className="space-y-1">
                {verificationResult.recommendedActions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-3 w-3 text-blue-500" />
                    {action}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Details */}
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Verified: {new Date(verificationResult.verificationDate).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}