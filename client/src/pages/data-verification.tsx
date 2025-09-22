import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AnalysisResult {
  plotId: string;
  country: string;
  area: string;
  overallRisk: string;
  complianceStatus: string;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
  gfwLoss?: number;
  jrcLoss?: number;
  sbtnLoss?: number;
}

export default function DataVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const verificationContentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    updatedDate: '',
    updatedTime: '',
    verificationType: '',
    assessedBy: '',
    finalStatus: '',
    skipConfirmation: false
  });

  // Selected polygon data
  const [selectedPolygon, setSelectedPolygon] = useState<AnalysisResult | null>(null);
  const [selectedPolygons, setSelectedPolygons] = useState<AnalysisResult[]>([]);
  const [isMultipleVerification, setIsMultipleVerification] = useState(false);
  const [detailPanelExpanded, setDetailPanelExpanded] = useState(true);
  const [mapType, setMapType] = useState<'Terrain' | 'Satellite' | 'Silver' | 'UAV'>('Satellite');

  // TIFF files state
  const [availableTiffFiles, setAvailableTiffFiles] = useState<any[]>([]);
  const [selectedTiffFile, setSelectedTiffFile] = useState<string | null>(null);
  const [isLoadingTiff, setIsLoadingTiff] = useState(false);

  // Load selected polygon(s) from localStorage
  useEffect(() => {
    // Try to load multiple polygons first
    const multipleData = localStorage.getItem('selectedPolygonsForVerification');
    if (multipleData) {
      try {
        const polygonsData = JSON.parse(multipleData);
        console.log('Loaded multiple polygons data for verification:', polygonsData);
        setSelectedPolygons(polygonsData);
        setIsMultipleVerification(true);
        
        // For multiple verification, set the first polygon as primary for form display
        if (polygonsData.length > 0) {
          setSelectedPolygon(polygonsData[0]);
        }

        // Set current date and time as defaults
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        const plotIds = polygonsData.map((p: AnalysisResult) => p.plotId).join(', ');
        setFormData(prev => ({
          ...prev,
          updatedDate: localDateTime,
          updatedTime: now.toTimeString().slice(0, 5),
          assessedBy: 'Current User',
          assessment: `Batch verification assessment for plots: ${plotIds}`
        }));
      } catch (error) {
        console.error('Error parsing multiple polygons data:', error);
        toast({
          title: "Data Loading Error",
          description: "Failed to load polygons data. Redirecting to spatial analysis.",
          variant: "destructive",
        });
        setLocation('/spatial-analysis');
      }
    } else {
      // Try single polygon fallback
      const singleData = localStorage.getItem('selectedPolygonForVerification');
      if (singleData) {
        try {
          const polygonData = JSON.parse(singleData);
          console.log('Loaded single polygon data for verification:', polygonData);
          setSelectedPolygon(polygonData);
          setSelectedPolygons([polygonData]);
          setIsMultipleVerification(false);

          // Set current date and time as defaults
          const now = new Date();
          const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setFormData(prev => ({
            ...prev,
            updatedDate: localDateTime,
            updatedTime: now.toTimeString().slice(0, 5),
            assessedBy: 'Current User',
            assessment: `Initial verification assessment for plot ${polygonData.plotId}`
          }));
        } catch (error) {
          console.error('Error parsing single polygon data:', error);
          toast({
            title: "Data Loading Error",
            description: "Failed to load polygon data. Redirecting to spatial analysis.",
            variant: "destructive",
          });
          setLocation('/spatial-analysis');
        }
      } else {
        // No data found, redirect back
        toast({
          title: "No Data Selected",
          description: "Please select polygon(s) from the spatial analysis page first.",
          variant: "destructive",
        });
        setLocation('/spatial-analysis');
      }
    }
  }, [setLocation, toast]);

  // Load TIFF files when UAV is selected
  useEffect(() => {
    if (mapType === 'UAV') {
      loadTiffFiles();
    }
  }, [mapType]);

  const loadTiffFiles = async () => {
    setIsLoadingTiff(true);
    try {
      const response = await apiRequest('GET', '/api/objects/tiff-files');
      const data = await response.json();
      setAvailableTiffFiles(data.files || []);
      if (data.files && data.files.length > 0) {
        setSelectedTiffFile(data.files[0].path);
      }
    } catch (error) {
      console.error('Error loading TIFF files:', error);
      toast({
        title: "Error",
        description: "Failed to load UAV TIFF files from storage",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTiff(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if ((!selectedPolygon && selectedPolygons.length === 0) || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Initializing map with type:', mapType);
        
        // Clear existing map first
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (error) {
            console.log('Map cleanup warning:', error);
          }
          mapInstanceRef.current = null;
        }

        if (!mapRef.current) {
          console.error('Map container not available');
          return;
        }

        // Clear and prepare map container
        mapRef.current.innerHTML = '';
        mapRef.current.style.height = '100%';
        mapRef.current.style.width = '100%';

        // Check for Leaflet with timeout
        let L = (window as any).L;
        let attempts = 0;
        const maxAttempts = 50;

        while (!L && attempts < maxAttempts) {
          console.log(`Waiting for Leaflet... attempt ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 100));
          L = (window as any).L;
          attempts++;
        }

        if (!L) {
          console.log('Loading Leaflet dynamically...');
          
          // Load CSS
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(css);
          }

          // Load JS
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          document.head.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            setTimeout(() => reject(new Error('Leaflet timeout')), 10000);
          });

          L = (window as any).L;
          if (!L) throw new Error('Leaflet failed to load');
        }

        console.log('✅ Leaflet ready, creating map...');

        // Create map instance
        const map = L.map(mapRef.current, {
          center: [-4.557, 119.982], // Centered on Indonesia polygons
          zoom: 14,
          zoomControl: true,
          attributionControl: true
        });

        mapInstanceRef.current = map;

        // Configure tile layers
        const tileConfigs = {
          'Terrain': {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            options: { attribution: '© OpenTopoMap', maxZoom: 17 }
          },
          'Satellite': {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            options: { attribution: '© Esri', maxZoom: 19 }
          },
          'Silver': {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            options: { attribution: '© OpenStreetMap', maxZoom: 19 }
          },
          'UAV': {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            options: { attribution: '© Esri (UAV View)', maxZoom: 19 }
          }
        };

        const config = tileConfigs[mapType] || tileConfigs['Satellite'];
        console.log(`🎨 Loading ${mapType} basemap:`, config.url);

        const tileLayer = L.tileLayer(config.url, config.options);
        tileLayer.addTo(map);

        // Wait for tiles to start loading
        await new Promise(resolve => {
          tileLayer.on('loading', () => {
            console.log(`🌍 ${mapType} tiles loading...`);
            resolve(true);
          });
          tileLayer.on('load', () => {
            console.log(`✅ ${mapType} tiles loaded`);
          });
          // Fallback timeout
          setTimeout(resolve, 2000);
        });

        console.log('🏞️ Basemap loaded successfully');

        // Add polygons
        const polygonsToRender = selectedPolygons.length > 0 ? selectedPolygons : (selectedPolygon ? [selectedPolygon] : []);
        
        if (polygonsToRender.length > 0) {
          console.log(`📍 Rendering ${polygonsToRender.length} polygons...`);
          
          const bounds = L.latLngBounds([]);
          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];

          polygonsToRender.forEach((polygon, index) => {
            try {
              if (!polygon.geometry?.coordinates) return;

              // Handle MultiPolygon and Polygon geometries properly
              let latlngs: [number, number][];
              if (polygon.geometry.type === 'MultiPolygon') {
                // For MultiPolygon, take the first polygon's outer ring
                const firstPolygon = polygon.geometry.coordinates[0] as number[][];
                const outerRing = firstPolygon[0] as number[][];
                latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
              } else if (polygon.geometry.type === 'Polygon') {
                // For Polygon, take the outer ring
                const outerRing = polygon.geometry.coordinates[0] as number[][];
                latlngs = outerRing.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
              } else {
                return; // Skip unsupported geometry types
              }

              const color = colors[index % colors.length];
              const leafletPolygon = L.polygon(latlngs, {
                fillColor: color,
                color: color,
                weight: 2,
                fillOpacity: 0.5,
                opacity: 1
              }).addTo(map);

              leafletPolygon.bindPopup(`
                <div style="padding: 10px; min-width: 200px;">
                  <h3 style="margin: 0 0 10px 0; font-weight: bold;">${polygon.plotId}</h3>
                  <p><strong>Country:</strong> ${polygon.country}</p>
                  <p><strong>Area:</strong> ${polygon.area} ha</p>
                  <p><strong>Risk:</strong> ${polygon.overallRisk}</p>
                  <p><strong>Status:</strong> ${polygon.complianceStatus}</p>
                </div>
              `);

              bounds.extend(leafletPolygon.getBounds());
            } catch (err) {
              console.error(`Error rendering polygon ${polygon.plotId}:`, err);
            }
          });

          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        }

        console.log('🎉 Map initialization completed successfully');

      } catch (error) {
        console.error('❌ Map initialization failed:', error);
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #6c757d; font-family: Arial, sans-serif;">
              <div style="text-align: center; padding: 20px;">
                <h3 style="margin-bottom: 10px;">Map Loading Failed</h3>
                <p style="margin-bottom: 15px;">Unable to load the basemap. Please try again.</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                  Reload Page
                </button>
              </div>
            </div>
          `;
        }
      }
    };

    // Add delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [selectedPolygon, selectedPolygons, isMultipleVerification, mapType, selectedTiffFile]);

  const handleCancel = () => {
    localStorage.removeItem('selectedPolygonForVerification');
    localStorage.removeItem('selectedPolygonsForVerification');
    setLocation('/spatial-analysis');
  };

  const generateVerificationPDF = async () => {
    if (!verificationContentRef.current || (selectedPolygons.length === 0 && !selectedPolygon)) return false;

    try {
      // Create PDF with professional layout
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Define margins and page dimensions
      const pageWidth = 297; // A4 landscape width
      const pageHeight = 210; // A4 landscape height
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add KPN PLANTATION Header
      pdf.setFillColor(0, 102, 51); // Dark green header
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Company logo/title area
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KPN PLANTATION', margin, 20);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('COMPLIANT VERIFICATION REPORT', margin, 32);

      // Add date/time in header
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      pdf.setFontSize(10);
      pdf.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - margin - 50, 20);

      // Reset text color for content
      pdf.setTextColor(0, 0, 0);
      let currentY = 60;

      // Plot Information Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PLOT VERIFICATION DETAILS', margin, currentY);
      currentY += 15;

      if (isMultipleVerification) {
        // Multiple plots summary
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Plots Verified: ${selectedPolygons.length}`, margin, currentY);
        currentY += 8;
        
        const highRiskCount = selectedPolygons.filter(p => p.overallRisk === 'HIGH').length;
        const mediumRiskCount = selectedPolygons.filter(p => p.overallRisk === 'MEDIUM').length;
        const lowRiskCount = selectedPolygons.filter(p => p.overallRisk === 'LOW').length;
        const nonCompliantCount = selectedPolygons.filter(p => p.complianceStatus === 'NON-COMPLIANT').length;
        
        pdf.text(`Risk Distribution: High (${highRiskCount}), Medium (${mediumRiskCount}), Low (${lowRiskCount})`, margin, currentY);
        currentY += 8;
        pdf.text(`Non-Compliant Plots: ${nonCompliantCount}`, margin, currentY);
        currentY += 15;
        
      } else if (selectedPolygon) {
        // Single plot details
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Plot ID: ${selectedPolygon.plotId}`, margin, currentY);
        currentY += 8;
        pdf.text(`Country: ${selectedPolygon.country}`, margin, currentY);
        currentY += 8;
        pdf.text(`Area: ${selectedPolygon.area} hectares`, margin, currentY);
        currentY += 8;
        pdf.text(`Risk Level: ${selectedPolygon.overallRisk}`, margin, currentY);
        currentY += 8;
        pdf.text(`Compliance Status: ${selectedPolygon.complianceStatus}`, margin, currentY);
        currentY += 15;
      }

      // Form Information Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VERIFICATION INFORMATION', margin, currentY);
      currentY += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Updated Date & Time
      if (formData.updatedDate) {
        const formattedDate = new Date(formData.updatedDate).toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        pdf.text(`Updated Date & Time: ${formattedDate}`, margin, currentY);
      } else {
        pdf.text(`Updated Date & Time: ${dateStr} ${timeStr}`, margin, currentY);
      }
      currentY += 8;
      
      // Verification Type
      if (formData.verificationType) {
        pdf.text(`Verification Type: ${formData.verificationType}`, margin, currentY);
        currentY += 8;
      }
      
      // Assessed By
      if (formData.assessedBy) {
        pdf.text(`Assessed By: ${formData.assessedBy}`, margin, currentY);
        currentY += 8;
      }
      
      // Final Status
      if (formData.finalStatus) {
        pdf.text(`Final Status: ${formData.finalStatus}`, margin, currentY);
        currentY += 15;
      }

      // Map Image Section - capture map area and place it on the right side
      const mapElement = verificationContentRef.current?.querySelector('.flex-1.relative') as HTMLElement;
      if (mapElement) {
        // Hide UI controls temporarily for cleaner map capture
        const controlsToHide = mapElement.querySelectorAll('.absolute');
        controlsToHide.forEach(el => (el as HTMLElement).style.visibility = 'hidden');

        try {
          const mapCanvas = await html2canvas(mapElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: mapElement.clientWidth,
            height: mapElement.clientHeight,
          });

          // Two-column layout: information on left, map on right
          const leftColumnWidth = contentWidth * 0.48; // 48% for text
          const rightColumnWidth = contentWidth * 0.48; // 48% for map  
          const columnGap = contentWidth * 0.04; // 4% gap between columns
          const mapX = margin + leftColumnWidth + columnGap;
          
          // Calculate map dimensions to fit in right column
          const maxMapHeight = pageHeight - 80 - margin; // Reserve space for header and footer
          const mapWidth = rightColumnWidth;
          let mapHeight = (mapCanvas.height * mapWidth) / mapCanvas.width;
          
          // If map is too tall, scale it down
          if (mapHeight > maxMapHeight) {
            mapHeight = maxMapHeight;
          }
          
          // Position map at top right starting from header area
          const mapY = 80; // Start after header
          pdf.addImage(mapCanvas.toDataURL('image/png'), 'PNG', mapX, mapY, mapWidth, mapHeight);
          
          // Add map title above the map
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('POLYGON LOCATION MAP', mapX, mapY - 5);

          // Restore UI controls
          controlsToHide.forEach(el => (el as HTMLElement).style.visibility = 'visible');
        } catch (mapError) {
          console.error('Error capturing map:', mapError);
          // Restore UI controls on error
          controlsToHide.forEach(el => (el as HTMLElement).style.visibility = 'visible');
        }
      }

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('This document was automatically generated by KPN PLANTATION EUDR Compliance System', 
               margin, pageHeight - 10);

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = isMultipleVerification 
        ? `KPN-verification-batch-${selectedPolygons.length}-plots-${timestamp}.pdf`
        : `KPN-verification-${selectedPolygon?.plotId || 'plot'}-${timestamp}.pdf`;

      // Download PDF
      pdf.save(filename);

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  };

  const handleConfirm = async () => {
    try {
      // Update compliance status if Final Status was selected and is different from original
      if (formData.finalStatus) {
        const polygonsToUpdate = isMultipleVerification ? selectedPolygons : (selectedPolygon ? [selectedPolygon] : []);
        
        for (const polygon of polygonsToUpdate) {
          const originalStatus = polygon.complianceStatus;
          const newStatus = formData.finalStatus.toUpperCase().replace('-', '');
          
          // Only update if the status has changed
          if (originalStatus !== newStatus) {
            console.log(`🔄 Updating ${polygon.plotId} status from ${originalStatus} to ${newStatus}`);
            
            try {
              const response = await apiRequest('PATCH', `/api/analysis-results/${polygon.plotId}/compliance-status`, {
                complianceStatus: newStatus,
                verificationType: formData.verificationType,
                assessedBy: formData.assessedBy,
                updatedDate: formData.updatedDate
              });
              
              const responseData = await response.json();

              if (responseData && responseData.success) {
                console.log(`✅ Successfully updated ${polygon.plotId} compliance status`);
                
                // Update the polygon object with new status
                polygon.complianceStatus = newStatus;
              }
            } catch (updateError) {
              console.error(`Failed to update ${polygon.plotId}:`, updateError);
              toast({
                title: "Update Warning",
                description: `Could not update compliance status for ${polygon.plotId}. PDF will still be generated.`,
                variant: "default",
              });
            }
          }
        }

        // Update localStorage with the modified polygons for Results Table consistency  
        const currentResults = JSON.parse(localStorage.getItem('currentAnalysisResults') || '[]');
        const updatedResults = currentResults.map((result: any) => {
          const updatedPolygon = polygonsToUpdate.find(p => p.plotId === result.plotId);
          if (updatedPolygon) {
            return { ...result, complianceStatus: updatedPolygon.complianceStatus };
          }
          return result;
        });
        
        localStorage.setItem('currentAnalysisResults', JSON.stringify(updatedResults));
        console.log('📊 Updated localStorage analysis results with new compliance status');
      }

      // Generate PDF after status updates
      const pdfGenerated = await generateVerificationPDF();

      if (pdfGenerated) {
        toast({
          title: "Verification Confirmed",
          description: isMultipleVerification 
            ? `Batch verification PDF for ${selectedPolygons.length} plots has been generated and downloaded.`
            : `Plot ${selectedPolygon?.plotId} verification PDF has been generated and downloaded.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Verification Confirmed", 
          description: `Plot ${selectedPolygon?.plotId} has been verified but PDF generation failed.`,
          variant: "default",
        });
      }

      // Clear storage and set flags for spatial analysis to show results
      localStorage.removeItem('selectedPolygonForVerification');
      localStorage.removeItem('selectedPolygonsForVerification');
      
      // Set flags to ensure spatial-analysis shows the results table after verification
      localStorage.setItem('shouldShowTable', 'true');
      localStorage.setItem('refreshAfterEdit', 'true');
      
      setLocation('/spatial-analysis');

    } catch (error) {
      console.error('Error confirming verification:', error);
      toast({
        title: "Verification Error",
        description: "Failed to confirm verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!selectedPolygon && selectedPolygons.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b p-6 text-center">
        <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          {isMultipleVerification ? `Capture ${selectedPolygons.length} Polygons?` : 'Capture Polygon?'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isMultipleVerification 
            ? `Please confirm that these are the correct polygons to proceed with core data collection.`
            : 'Please confirm that this is the correct polygon to proceed with core data collection.'
          }
        </p>
      </div>

      <div className="flex-1 flex" ref={verificationContentRef}>
        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-[1000] flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
            {['Terrain', 'Satellite', 'Silver', 'UAV'].map((type) => (
              <Button
                key={type}
                variant={mapType === type ? "default" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => setMapType(type as any)}
                data-testid={`map-type-${type.toLowerCase()}`}
              >
                {type}
              </Button>
            ))}
          </div>

          {/* UAV TIFF Files Panel - Show when UAV is selected */}
          {mapType === 'UAV' && (
            <div className="absolute bottom-4 left-4 z-[1000] w-80">
              <Card className="bg-white dark:bg-gray-800 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    UAV TIFF Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoadingTiff ? (
                    <div className="text-sm text-gray-500 text-center py-4">Loading TIFF files...</div>
                  ) : availableTiffFiles.length > 0 ? (
                    <div className="space-y-2">
                      {availableTiffFiles.map((file, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded border cursor-pointer transition-colors ${
                            selectedTiffFile === file.path
                              ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => setSelectedTiffFile(file.path)}
                          data-testid={`tiff-file-${index}`}
                        >
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Size: {file.size}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No TIFF files available in storage
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detail Information Panel */}
          <div className="absolute top-4 right-4 z-[1000] w-80">
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => setDetailPanelExpanded(!detailPanelExpanded)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isMultipleVerification ? `Selected Plots (${selectedPolygons.length})` : 'Detail Information'}
                  </CardTitle>
                  {detailPanelExpanded ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </div>
              </CardHeader>

              {detailPanelExpanded && (
                <CardContent className="pt-0">
                  {isMultipleVerification ? (
                    // Multiple polygons display
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedPolygons.map((polygon, index) => (
                        <div key={polygon.plotId} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              #{index + 1} {polygon.plotId}
                            </span>
                            <Badge variant={polygon.overallRisk === 'HIGH' ? 'destructive' : polygon.overallRisk === 'MEDIUM' ? 'default' : 'secondary'}>
                              {polygon.overallRisk}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Country:</span>
                              <span className="ml-1 font-medium">{polygon.country}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Area:</span>
                              <span className="ml-1 font-medium">{polygon.area} ha</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <Badge className="ml-1" variant={polygon.complianceStatus === 'COMPLIANT' ? 'secondary' : 'destructive'}>
                                {polygon.complianceStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Summary */}
                      <div className="border-t pt-3 mt-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div>Total Plots: <span className="font-medium">{selectedPolygons.length}</span></div>
                          <div>High Risk: <span className="font-medium text-red-600">{selectedPolygons.filter(p => p.overallRisk === 'HIGH').length}</span></div>
                          <div>Medium Risk: <span className="font-medium text-yellow-600">{selectedPolygons.filter(p => p.overallRisk === 'MEDIUM').length}</span></div>
                          <div>Low Risk: <span className="font-medium text-green-600">{selectedPolygons.filter(p => p.overallRisk === 'LOW').length}</span></div>
                          <div>Non-Compliant: <span className="font-medium text-red-600">{selectedPolygons.filter(p => p.complianceStatus === 'NON-COMPLIANT').length}</span></div>
                        </div>
                      </div>
                    </div>
                  ) : selectedPolygon ? (
                    // Single polygon display
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Plot ID</span>
                        <span className="text-sm font-medium">{selectedPolygon.plotId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Country</span>
                        <span className="text-sm font-medium">{selectedPolygon.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Area</span>
                        <span className="text-sm font-medium">{selectedPolygon.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Overall Risk</span>
                        <span className={`text-sm font-medium ${
                          selectedPolygon.overallRisk === 'HIGH' ? 'text-red-600' :
                          selectedPolygon.overallRisk === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {selectedPolygon.overallRisk}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Compliance</span>
                        <Badge variant={selectedPolygon.complianceStatus === 'COMPLIANT' ? 'secondary' : 'destructive'}>
                          {selectedPolygon.complianceStatus}
                        </Badge>
                      </div>
                    </div>
                  ) : null}

                  {/* Show UAV TIFF status when UAV mode is active */}
                  {mapType === 'UAV' && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">UAV Data</span>
                        {isLoadingTiff ? (
                          <Badge variant="outline" className="text-xs">Loading...</Badge>
                        ) : selectedTiffFile ? (
                          <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No Data</Badge>
                        )}
                      </div>
                      {selectedTiffFile && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {availableTiffFiles.find(f => f.path === selectedTiffFile)?.name || 'Unknown file'}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Map */}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>

      {/* Data Collection Form */}
      <div className="bg-white dark:bg-gray-800 border-t p-6">
        <h2 className="text-lg font-semibold mb-4">Data Collection</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="updated-date" className="text-sm font-medium">
              Updated date & time
            </Label>
            <div className="relative">
              <Input
                id="updated-date"
                type="datetime-local"
                value={formData.updatedDate}
                onChange={(e) => handleFormChange('updatedDate', e.target.value)}
                placeholder="YYYY/MM/DD • HH:MM"
                data-testid="input-updated-date"
                className="pdf-form-field"
              />
              {/* Display value for PDF */}
              <div className="pdf-only absolute inset-0 flex items-center px-3 text-sm bg-white border rounded" style={{display: 'none'}}>
                {formData.updatedDate ? new Date(formData.updatedDate).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ''}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-type" className="text-sm font-medium">
              Verification Type
            </Label>
            <div className="relative">
              <Select value={formData.verificationType} onValueChange={(value) => handleFormChange('verificationType', value)}>
                <SelectTrigger className="pdf-form-field" data-testid="select-verification-type">
                  <SelectValue placeholder="Select verification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High-Res Satellite Imagery">High-Res Satellite Imagery</SelectItem>
                  <SelectItem value="UAV Imagery">UAV Imagery</SelectItem>
                  <SelectItem value="Ground Truthing">Ground Truthing</SelectItem>
                </SelectContent>
              </Select>
              {/* Display value for PDF */}
              <div className="pdf-only absolute inset-0 flex items-center px-3 text-sm bg-white border rounded" style={{display: 'none'}}>
                {formData.verificationType}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessed-by" className="text-sm font-medium">
              Asses by
            </Label>
            <div className="relative">
              <Input
                id="assessed-by"
                value={formData.assessedBy}
                onChange={(e) => handleFormChange('assessedBy', e.target.value)}
                placeholder="Name of Data Collector"
                data-testid="input-assessed-by"
                className="pdf-form-field"
              />
              {/* Display value for PDF */}
              <div className="pdf-only absolute inset-0 flex items-center px-3 text-sm bg-white border rounded" style={{display: 'none'}}>
                {formData.assessedBy}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="final-status" className="text-sm font-medium">
              Final status
            </Label>
            <div className="relative">
              <Select value={formData.finalStatus} onValueChange={(value) => handleFormChange('finalStatus', value)}>
                <SelectTrigger className="pdf-form-field" data-testid="select-final-status">
                  <SelectValue placeholder="Select final status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compliant">Compliant</SelectItem>
                  <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>
              {/* Display value for PDF */}
              <div className="pdf-only absolute inset-0 flex items-center px-3 text-sm bg-white border rounded" style={{display: 'none'}}>
                {formData.finalStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Skip confirmation checkbox */}
        <div className="flex items-center space-x-2 mb-6">
          <Checkbox
            id="skip-confirmation"
            checked={formData.skipConfirmation}
            onCheckedChange={(checked) => handleFormChange('skipConfirmation', checked as boolean)}
            data-testid="checkbox-skip-confirmation"
          />
          <Label 
            htmlFor="skip-confirmation" 
            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            Skip this confirmation next time
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3" data-hide-in-pdf>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            data-testid="button-cancel-verification"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="button-confirm-verification"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}