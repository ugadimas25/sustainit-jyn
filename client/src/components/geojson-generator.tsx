import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, MapPin, FileJson, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeoJSONGeneratorProps {
  reportId: string;
  reportData?: any;
}

interface GeneratedFile {
  fileName: string;
  path: string;
  plotId: string;
}

export function GeoJSONGenerator({ reportId, reportData }: GeoJSONGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const { toast } = useToast();

  const generateGeoJSON = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/dds-reports/${reportId}/generate-geojson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate GeoJSON files');
      }

      const result = await response.json();
      
      setGeneratedFiles(result.files);
      
      toast({
        title: "GeoJSON generation successful",
        description: `Generated ${result.totalFiles} verified deforestation-free polygon files.`
      });
      
    } catch (error) {
      console.error('Error generating GeoJSON:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate GeoJSON files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = async (file: GeneratedFile) => {
    try {
      const response = await fetch(`/api/dds-reports/${reportId}/geojson/${file.fileName}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${file.fileName}`
      });
      
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Failed to download GeoJSON file.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card data-testid="card-geojson-generator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Generate Verified Polygons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Generate GeoJSON files for verified deforestation-free polygons</span>
        </div>

        {reportData?.operatorLegalName && (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Operator:</span> {reportData.operatorLegalName}
            </div>
            <div className="text-sm">
              <span className="font-medium">Product:</span> {reportData.productDescription}
            </div>
            <div className="text-sm">
              <span className="font-medium">Country:</span> {reportData.countryOfProduction}
            </div>
          </div>
        )}

        <Button 
          onClick={generateGeoJSON}
          disabled={isGenerating}
          className="w-full"
          data-testid="button-generate-geojson"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating GeoJSON Files...
            </>
          ) : (
            "Generate Verified Polygon Files"
          )}
        </Button>

        {generatedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Generated Files:</h4>
            <div className="space-y-2">
              {generatedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                  data-testid={`file-item-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{file.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        Plot: {file.plotId}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                    data-testid={`button-download-${index}`}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
          <p className="font-medium text-amber-700 dark:text-amber-300">Output Information:</p>
          <ul className="mt-1 space-y-1">
            <li>• Individual GeoJSON files per verified plot</li>
            <li>• Combined file containing all verified polygons</li>
            <li>• Includes verification metadata and timestamps</li>
            <li>• Compatible with GIS software and mapping platforms</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}