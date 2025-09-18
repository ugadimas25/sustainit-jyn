import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { Trash2, Upload, Download, Pen, FileImage, AlertTriangle, CheckCircle } from "lucide-react";

export interface SignatureData {
  type: "upload" | "canvas";
  data?: string; // Base64 data for canvas signatures
  imagePath?: string; // File path for uploaded images  
  fileName?: string; // Original filename for uploads
  timestamp: string;
}

interface SignaturePadProps {
  onSignatureChange: (signature: SignatureData | null) => void;
  initialSignature?: SignatureData | null;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => SignatureData | null;
  validate: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange, initialSignature, disabled = false, required = true, className = "" }, ref) => {
    const [activeTab, setActiveTab] = useState<"upload" | "canvas">("upload");
    const [signature, setSignature] = useState<SignatureData | null>(initialSignature || null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [uploadError, setUploadError] = useState<string>("");
    const [canvasError, setCanvasError] = useState<string>("");
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        clearSignature();
      },
      getSignature: () => signature,
      validate: () => {
        if (required && !signature) {
          return false;
        }
        return true;
      }
    }));

    useEffect(() => {
      if (initialSignature) {
        setSignature(initialSignature);
        setActiveTab(initialSignature.type);
      }
    }, [initialSignature]);

    useEffect(() => {
      onSignatureChange(signature);
    }, [signature, onSignatureChange]);

    // Canvas drawing functionality
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || disabled) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set up canvas
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;

      // Clear canvas with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // If there's an existing canvas signature, restore it
      if (signature && signature.type === "canvas" && signature.data) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
        };
        img.src = signature.data;
      }
    }, [activeTab, disabled, signature]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      setIsDrawing(true);
      setCanvasError("");
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) * (canvas.width / rect.width) / 2;
      const y = (clientY - rect.top) * (canvas.height / rect.height) / 2;

      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const x = (clientX - rect.left) * (canvas.width / rect.width) / 2;
      const y = (clientY - rect.top) * (canvas.height / rect.height) / 2;

      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      saveCanvasSignature();
    };

    const saveCanvasSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const dataURL = canvas.toDataURL("image/png");
        const newSignature: SignatureData = {
          type: "canvas",
          data: dataURL,
          timestamp: new Date().toISOString()
        };
        setSignature(newSignature);
        setCanvasError("");
      } catch (error) {
        setCanvasError("Failed to save signature. Please try again.");
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (signature && signature.type === "canvas") {
        setSignature(null);
      }
      setCanvasError("");
    };

    // File upload functionality
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.match(/image\/(png|jpg|jpeg)/i)) {
        setUploadError("Please upload a PNG or JPG image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newSignature: SignatureData = {
            type: "upload",
            data: result,
            fileName: file.name,
            timestamp: new Date().toISOString()
          };
          setSignature(newSignature);
          setUploadError("");
        }
      };
      reader.onerror = () => {
        setUploadError("Failed to read the image file. Please try again.");
      };
      reader.readAsDataURL(file);
    };

    const clearSignature = () => {
      setSignature(null);
      setUploadError("");
      setCanvasError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (activeTab === "canvas") {
        clearCanvas();
      }
    };

    const downloadSignature = () => {
      if (!signature || !signature.data) return;

      const link = document.createElement("a");
      link.download = `signature-${new Date().toISOString().split('T')[0]}.png`;
      link.href = signature.data;
      link.click();
    };

    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pen className="h-5 w-5" />
            Digital Signature
            {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "canvas")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="canvas" className="flex items-center gap-2">
                <Pen className="h-4 w-4" />
                Draw Signature
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-upload" className="text-sm font-medium">
                  Upload Signature Image
                </Label>
                <p className="text-xs text-gray-500">
                  Upload a PNG or JPG image of your signature (max 5MB)
                </p>
                <Input
                  id="signature-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpg,image/jpeg"
                  onChange={handleFileUpload}
                  disabled={disabled}
                  data-testid="input-signature-upload"
                />
              </div>
              
              {uploadError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {signature && signature.type === "upload" && signature.data && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={signature.data}
                      alt="Uploaded signature"
                      className="max-h-32 mx-auto"
                      style={{ maxWidth: "100%" }}
                    />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">Signature uploaded successfully</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="canvas" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Draw Your Signature</Label>
                <p className="text-xs text-gray-500">
                  Use your mouse or finger to draw your signature in the box below
                </p>
                <div className="relative border-2 border-dashed border-gray-200 rounded-lg bg-white">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-32 cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopDrawing();
                    }}
                    style={{ touchAction: 'none' }}
                    data-testid="canvas-signature"
                  />
                  {signature && signature.type === "canvas" && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Signed
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearCanvas}
                  disabled={disabled}
                  className="flex items-center gap-2"
                  data-testid="button-clear-canvas"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Canvas
                </Button>
              </div>

              {canvasError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{canvasError}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {signature && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Signature Ready</span>
                  <Badge variant="secondary" className="text-xs">
                    {signature.type === "upload" ? "Uploaded" : "Drawn"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadSignature}
                    className="flex items-center gap-2"
                    data-testid="button-download-signature"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    disabled={disabled}
                    className="flex items-center gap-2"
                    data-testid="button-clear-signature"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Signed on: {new Date(signature.timestamp).toLocaleString()}
                {signature.fileName && ` • File: ${signature.fileName}`}
              </div>
            </div>
          )}

          {required && !signature && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A digital signature is required to complete the DDS form.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }
);

SignaturePad.displayName = "SignaturePad";