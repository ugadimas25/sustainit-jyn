import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KMLUploaderProps {
  reportId: string;
  onUploadComplete?: (result: any) => void;
}

export function KMLUploader({ reportId, onUploadComplete }: KMLUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.google-earth.kml+xml' || file.name.endsWith('.kml')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a KML file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a KML file to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Read the file content
      const fileContent = await selectedFile.text();
      
      // Send to backend for processing
      const response = await fetch(`/api/dds-reports/${reportId}/upload-kml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kmlData: fileContent,
          fileName: selectedFile.name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload KML file');
      }

      const result = await response.json();
      
      toast({
        title: "KML upload successful",
        description: `Processed ${result.extractedPlots} plot polygons from KML file.`
      });

      onUploadComplete?.(result);
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Error uploading KML:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process KML file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card data-testid="card-kml-uploader">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload KML Polygons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kml-file">KML File</Label>
          <Input
            id="kml-file"
            type="file"
            accept=".kml,application/vnd.google-earth.kml+xml"
            onChange={handleFileSelect}
            data-testid="input-kml-file"
          />
          <p className="text-sm text-muted-foreground">
            Upload KML files containing deforestation-free polygon data
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md" data-testid="selected-file-info">
            <FileText className="h-4 w-4" />
            <span className="text-sm">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">KML Processing Info:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Extracts polygon coordinates from KML files</li>
              <li>• Validates geolocation data for EU compliance</li>
              <li>• Generates plot references for DDS reporting</li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="w-full"
          data-testid="button-upload-kml"
        >
          {isUploading ? "Processing KML..." : "Upload and Process KML"}
        </Button>
      </CardContent>
    </Card>
  );
}