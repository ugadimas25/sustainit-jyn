import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GFWIntegrationProps {
  alertFrequency: string;
  confidenceThreshold: string;
  bufferZone: string;
  onSettingsChange: {
    setAlertFrequency: (value: string) => void;
    setConfidenceThreshold: (value: string) => void;
    setBufferZone: (value: string) => void;
  };
}

export function GFWIntegration({ 
  alertFrequency, 
  confidenceThreshold, 
  bufferZone, 
  onSettingsChange 
}: GFWIntegrationProps) {
  const [connectionStatus, setConnectionStatus] = useState({
    glad: "connected",
    radd: "connected", 
    fires: "rate_limited"
  });
  const { toast } = useToast();

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/gfw/test-connection");
      return response.json();
    },
    onSuccess: (data) => {
      setConnectionStatus(data.status || connectionStatus);
      toast({
        title: "Connection test complete",
        description: "GFW API endpoints tested successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("POST", "/api/gfw/settings", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "GFW monitoring settings have been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      alertFrequency,
      confidenceThreshold,
      bufferZone: parseFloat(bufferZone)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-forest-light";
      case "rate_limited": return "bg-warning";
      case "error": return "bg-critical";
      default: return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="w-4 h-4 text-forest-light" />;
      case "rate_limited": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <AlertTriangle className="w-4 h-4 text-critical" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Configuration */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800">Alert Configuration</h4>
          <Badge className="bg-forest-light text-white">Active</Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Alert Frequency</Label>
            <Select value={alertFrequency} onValueChange={onSettingsChange.setAlertFrequency}>
              <SelectTrigger data-testid="select-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Confidence Threshold</Label>
            <Select value={confidenceThreshold} onValueChange={onSettingsChange.setConfidenceThreshold}>
              <SelectTrigger data-testid="select-confidence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (&gt;50%)</SelectItem>
                <SelectItem value="medium">Medium (&gt;70%)</SelectItem>
                <SelectItem value="high">High (&gt;90%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Buffer Zone (km)</Label>
            <Input 
              type="number" 
              value={bufferZone}
              onChange={(e) => onSettingsChange.setBufferZone(e.target.value)}
              min="0.1"
              max="10"
              step="0.1"
              data-testid="input-buffer-zone"
            />
          </div>

          <Button 
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            className="w-full bg-forest text-white hover:bg-forest-dark"
            data-testid="button-save-settings"
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* API Status */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">API Status</h4>
        <div className="space-y-2">
          <div className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(connectionStatus.glad)} bg-opacity-10`}>
            <div className="flex items-center">
              {getStatusIcon(connectionStatus.glad)}
              <span className="text-sm font-medium ml-2">GLAD Alerts</span>
            </div>
            <span className="text-xs text-gray-600 capitalize">{connectionStatus.glad.replace('_', ' ')}</span>
          </div>
          
          <div className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(connectionStatus.radd)} bg-opacity-10`}>
            <div className="flex items-center">
              {getStatusIcon(connectionStatus.radd)}
              <span className="text-sm font-medium ml-2">RADD Alerts</span>
            </div>
            <span className="text-xs text-gray-600 capitalize">{connectionStatus.radd.replace('_', ' ')}</span>
          </div>
          
          <div className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(connectionStatus.fires)} bg-opacity-10`}>
            <div className="flex items-center">
              {getStatusIcon(connectionStatus.fires)}
              <span className="text-sm font-medium ml-2">Fire Alerts</span>
            </div>
            <span className="text-xs text-gray-600 capitalize">{connectionStatus.fires.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => testConnectionMutation.mutate()}
        disabled={testConnectionMutation.isPending}
        className="w-full bg-professional text-white hover:bg-blue-700"
        data-testid="button-test-connection"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
        Test Connection
      </Button>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Data Sources:</strong></p>
        <ul className="space-y-1">
          <li>• GLAD: University of Maryland tree loss alerts</li>
          <li>• RADD: Radar-based deforestation detection</li>
          <li>• FIRES: MODIS/VIIRS active fire detection</li>
        </ul>
        <p className="mt-2"><strong>Update Frequency:</strong> Real-time to weekly depending on source</p>
      </div>
    </div>
  );
}
