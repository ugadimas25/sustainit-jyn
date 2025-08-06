import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import { WDPAService } from "./lib/wdpa-service";
import { GFWService } from "./lib/gfw-service";
import { insertPlotSchema, insertSupplierSchema, insertDocumentSchema, insertDeliverySchema, insertShipmentSchema, insertDDSReportSchema, insertSurveySchema, insertSurveyResponseSchema } from "@shared/schema";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeDefaultUser() {
  try {
    // Check if any users exist
    const existingUser = await storage.getUserByUsername("kpneudr");
    if (!existingUser) {
      // Create default user
      const hashedPassword = await hashPassword("kpneudr");
      await storage.createUser({
        username: "kpneudr",
        password: hashedPassword,
        role: "admin",
        name: "KPN EUDR Administrator",
        email: "admin@kpn.com"
      });
      console.log("✓ Default user 'kpneudr' created successfully");
    }
  } catch (error) {
    console.error("Error initializing default user:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Initialize default user if none exists
  await initializeDefaultUser();

  // Dashboard API
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Suppliers API
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  // Plots API
  app.get("/api/plots", isAuthenticated, async (req, res) => {
    try {
      const plots = await storage.getAllPlots();
      res.json(plots);
    } catch (error) {
      console.error("Error fetching plots:", error);
      res.status(500).json({ error: "Failed to fetch plots" });
    }
  });

  app.get("/api/plots/:id", isAuthenticated, async (req, res) => {
    try {
      const plot = await storage.getPlot(req.params.id);
      if (!plot) {
        return res.status(404).json({ error: "Plot not found" });
      }
      res.json(plot);
    } catch (error) {
      console.error("Error fetching plot:", error);
      res.status(500).json({ error: "Failed to fetch plot" });
    }
  });

  app.post("/api/plots", isAuthenticated, async (req, res) => {
    try {
      const plotData = insertPlotSchema.parse(req.body);
      const plot = await storage.createPlot(plotData);
      res.status(201).json(plot);
    } catch (error) {
      console.error("Error creating plot:", error);
      res.status(400).json({ error: "Invalid plot data" });
    }
  });

  app.put("/api/plots/:id", isAuthenticated, async (req, res) => {
    try {
      const plotData = insertPlotSchema.partial().parse(req.body);
      const plot = await storage.updatePlot(req.params.id, plotData);
      res.json(plot);
    } catch (error) {
      console.error("Error updating plot:", error);
      res.status(400).json({ error: "Invalid plot data" });
    }
  });

  // Documents API
  app.get("/api/plots/:plotId/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocumentsByPlot(req.params.plotId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ error: "Invalid document data" });
    }
  });

  // Deforestation Alerts API
  app.get("/api/alerts", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const alerts = await storage.getRecentAlerts(limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/plots/:plotId/alerts", isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getAlertsByPlot(req.params.plotId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching plot alerts:", error);
      res.status(500).json({ error: "Failed to fetch plot alerts" });
    }
  });

  // Global Forest Watch API Integration
  app.post("/api/gfw/check-deforestation", isAuthenticated, async (req, res) => {
    try {
      const { plotId, coordinates } = req.body;
      
      // Mock GFW API call - in production, this would call the actual GFW API
      const gfwApiKey = process.env.GFW_API_KEY || "mock_key";
      
      // Simulate API response
      const mockResponse = {
        alerts: [
          {
            date: "2024-01-15",
            confidence: 85,
            areaLost: 2.3,
            source: "GLAD",
            severity: "high"
          }
        ],
        summary: {
          totalAlerts: 1,
          totalAreaLost: 2.3,
          lastUpdated: new Date().toISOString()
        }
      };

      // If there are alerts, create them in the database
      if (mockResponse.alerts.length > 0) {
        for (const alert of mockResponse.alerts) {
          await storage.createAlert({
            plotId,
            alertSource: alert.source,
            alertDate: new Date(alert.date),
            confidence: alert.confidence.toString(),
            areaLost: alert.areaLost.toString(),
            severity: alert.severity,
            status: "active"
          });
        }
      }

      res.json(mockResponse);
    } catch (error) {
      console.error("Error checking deforestation:", error);
      res.status(500).json({ error: "Failed to check deforestation" });
    }
  });

  // WDPA API Integration
  app.post("/api/wdpa/check-protected-areas", isAuthenticated, async (req, res) => {
    try {
      const { plotId, coordinates } = req.body;
      
      // Mock WDPA API call - in production, this would call the actual WDPA API
      const wdpaApiKey = process.env.WDPA_API_KEY || "mock_key";
      
      // Simulate API response
      const mockResponse = {
        overlaps: [],
        summary: {
          hasOverlap: false,
          protectedAreas: [],
          checkedAgainst: [
            "National Parks",
            "Wildlife Reserves", 
            "UNESCO World Heritage Sites",
            "Ramsar Wetlands"
          ]
        }
      };

      res.json(mockResponse);
    } catch (error) {
      console.error("Error checking protected areas:", error);
      res.status(500).json({ error: "Failed to check protected areas" });
    }
  });

  // Mills API
  app.get("/api/mills", isAuthenticated, async (req, res) => {
    try {
      const mills = await storage.getAllMills();
      res.json(mills);
    } catch (error) {
      console.error("Error fetching mills:", error);
      res.status(500).json({ error: "Failed to fetch mills" });
    }
  });

  // Deliveries API
  app.post("/api/deliveries", isAuthenticated, async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(400).json({ error: "Invalid delivery data" });
    }
  });

  // Shipments API
  app.get("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const shipments = await storage.getAllShipments();
      res.json(shipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.get("/api/shipments/:shipmentId/traceability", isAuthenticated, async (req, res) => {
    try {
      const traceability = await storage.getShipmentTraceability(req.params.shipmentId);
      if (!traceability) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(traceability);
    } catch (error) {
      console.error("Error fetching shipment traceability:", error);
      res.status(500).json({ error: "Failed to fetch shipment traceability" });
    }
  });

  app.post("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(400).json({ error: "Invalid shipment data" });
    }
  });

  // DDS Reports API
  app.get("/api/dds-reports", isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getAllDDSReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching DDS reports:", error);
      res.status(500).json({ error: "Failed to fetch DDS reports" });
    }
  });

  app.post("/api/dds-reports", isAuthenticated, async (req, res) => {
    try {
      const reportData = insertDDSReportSchema.parse({
        ...req.body,
        generatedBy: req.user?.id
      });
      const report = await storage.createDDSReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating DDS report:", error);
      res.status(400).json({ error: "Invalid DDS report data" });
    }
  });

  app.post("/api/dds-reports/:id/generate", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { format } = req.body; // pdf, xml
      
      // Mock report generation - in production, this would generate actual PDF/XML
      const report = await storage.getDDSReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Update report status
      await storage.updateDDSReport(id, { status: "generated" });

      res.json({
        success: true,
        downloadUrl: `/api/dds-reports/${id}/download?format=${format}`,
        format
      });
    } catch (error) {
      console.error("Error generating DDS report:", error);
      res.status(500).json({ error: "Failed to generate DDS report" });
    }
  });

  // Satellite Imagery endpoints
  app.get("/api/satellite-images", isAuthenticated, async (req, res) => {
    try {
      // Mock satellite imagery data for now - in production this would fetch from actual satellite providers
      const sampleImages = [
        {
          id: "sat_001",
          plotId: "plot_001",
          plotNumber: "HR001",
          captureDate: "2024-01-15",
          coordinates: { lat: -2.234, lng: 111.456 },
          imageUrl: "/api/satellite-images/sat_001_full.jpg",
          thumbnailUrl: "/api/satellite-images/sat_001_thumb.jpg",
          satellite: "Sentinel-2",
          resolution: "10m",
          cloudCover: 5,
          deforestationRisk: 'high',
          vegetationIndex: 0.72,
          changeDetected: true
        },
        {
          id: "sat_002",
          plotId: "plot_002",
          plotNumber: "MR005",
          captureDate: "2024-01-14",
          coordinates: { lat: -1.789, lng: 112.123 },
          imageUrl: "/api/satellite-images/sat_002_full.jpg",
          thumbnailUrl: "/api/satellite-images/sat_002_thumb.jpg",
          satellite: "Landsat-8",
          resolution: "30m",
          cloudCover: 12,
          deforestationRisk: 'medium',
          vegetationIndex: 0.68,
          changeDetected: false
        },
        {
          id: "sat_003",
          plotId: "plot_003",
          plotNumber: "DF003",
          captureDate: "2024-01-13",
          coordinates: { lat: -0.567, lng: 110.789 },
          imageUrl: "/api/satellite-images/sat_003_full.jpg",
          thumbnailUrl: "/api/satellite-images/sat_003_thumb.jpg",
          satellite: "Sentinel-2",
          resolution: "10m",
          cloudCover: 8,
          deforestationRisk: 'high',
          vegetationIndex: 0.45,
          changeDetected: true
        },
        {
          id: "sat_004",
          plotId: "plot_004",
          plotNumber: "LR010",
          captureDate: "2024-01-12",
          coordinates: { lat: -1.234, lng: 113.567 },
          imageUrl: "/api/satellite-images/sat_004_full.jpg",
          thumbnailUrl: "/api/satellite-images/sat_004_thumb.jpg",
          satellite: "Planet",
          resolution: "3m",
          cloudCover: 2,
          deforestationRisk: 'low',
          vegetationIndex: 0.85,
          changeDetected: false
        }
      ];

      res.json(sampleImages);
    } catch (error) {
      console.error("Error fetching satellite images:", error);
      res.status(500).json({ error: "Failed to fetch satellite images" });
    }
  });

  app.get("/api/satellite-images/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      // Mock single image lookup - in production would fetch from database
      res.json({ 
        message: `Satellite image ${id} details would be served here`,
        imageId: id
      });
    } catch (error) {
      console.error("Error fetching satellite image:", error);
      res.status(500).json({ error: "Failed to fetch satellite image" });
    }
  });

  // Endpoint to serve satellite image files (placeholder for integration with satellite providers)
  app.get("/api/satellite-images/:id/:type", (req, res) => {
    const { id, type } = req.params;
    // In production, this would integrate with satellite imagery providers like:
    // - Google Earth Engine
    // - Planet Labs
    // - Sentinel Hub
    // - Landsat (via USGS)
    res.status(200).json({ 
      message: `Satellite image ${id} (${type}) would be served here`,
      imageUrl: `/placeholder-satellite-${id}-${type}.jpg`
    });
  });

  // Initialize API services
  const wdpaService = new WDPAService();
  const gfwService = new GFWService();

  // Real-time WDPA Protected Area Verification API
  app.post("/api/wdpa/verify-coordinates", isAuthenticated, async (req, res) => {
    try {
      const { coordinates } = req.body;
      
      if (!coordinates) {
        return res.status(400).json({ error: "Coordinates are required" });
      }

      const verificationResult = await wdpaService.checkProtectedAreaOverlap(coordinates);
      res.json(verificationResult);
    } catch (error) {
      console.error("WDPA verification error:", error);
      res.status(500).json({ 
        error: "Protected area verification failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get protected area details
  app.get("/api/wdpa/protected-area/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const protectedArea = await wdpaService.getProtectedAreaDetails(id);
      
      if (!protectedArea) {
        return res.status(404).json({ error: "Protected area not found" });
      }
      
      res.json(protectedArea);
    } catch (error) {
      console.error("WDPA details error:", error);
      res.status(500).json({ 
        error: "Failed to get protected area details",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Search protected areas by region
  app.get("/api/wdpa/search", isAuthenticated, async (req, res) => {
    try {
      const { country, province } = req.query;
      
      if (!country) {
        return res.status(400).json({ error: "Country parameter is required" });
      }
      
      const protectedAreas = await wdpaService.searchProtectedAreasByRegion(
        country as string, 
        province as string
      );
      res.json(protectedAreas);
    } catch (error) {
      console.error("WDPA search error:", error);
      res.status(500).json({ 
        error: "Protected area search failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Real-time GFW Forest Analysis API
  app.post("/api/gfw/forest-analysis", isAuthenticated, async (req, res) => {
    try {
      const { coordinates, year } = req.body;
      
      if (!coordinates) {
        return res.status(400).json({ error: "Coordinates are required" });
      }

      const analysisResult = await gfwService.getForestAnalysis(coordinates, year);
      res.json(analysisResult);
    } catch (error) {
      console.error("GFW forest analysis error:", error);
      res.status(500).json({ 
        error: "Forest analysis failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get GLAD deforestation alerts
  app.post("/api/gfw/glad-alerts", isAuthenticated, async (req, res) => {
    try {
      const { coordinates, startDate, endDate } = req.body;
      
      if (!coordinates) {
        return res.status(400).json({ error: "Coordinates are required" });
      }

      const alerts = await gfwService.getGLADAlerts(coordinates, startDate, endDate);
      res.json(alerts);
    } catch (error) {
      console.error("GFW GLAD alerts error:", error);
      res.status(500).json({ 
        error: "Failed to fetch GLAD alerts",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced plot verification combining WDPA and GFW data
  app.post("/api/plots/comprehensive-verification", isAuthenticated, async (req, res) => {
    try {
      const { plotId, coordinates } = req.body;
      
      if (!plotId || !coordinates) {
        return res.status(400).json({ error: "Plot ID and coordinates are required" });
      }

      // Run WDPA and GFW analysis in parallel
      const [wdpaResult, gfwResult] = await Promise.all([
        wdpaService.checkProtectedAreaOverlap(coordinates),
        gfwService.getForestAnalysis(coordinates)
      ]);

      // Determine overall compliance status
      let complianceStatus = 'compliant';
      const risks: string[] = [];

      if (wdpaResult.legalStatus === 'prohibited') {
        complianceStatus = 'high-risk';
        risks.push('Located in strictly protected area');
      } else if (wdpaResult.legalStatus === 'restricted') {
        complianceStatus = gfwResult.alertsCount > 0 ? 'high-risk' : 'medium-risk';
        risks.push('Located in protected/restricted area');
      }

      if (gfwResult.alertsCount > 0) {
        if (complianceStatus === 'compliant') complianceStatus = 'medium-risk';
        risks.push(`${gfwResult.alertsCount} deforestation alert(s) detected`);
      }

      if (gfwResult.primaryForestLoss) {
        complianceStatus = 'high-risk';
        risks.push('Primary forest loss detected');
      }

      if (gfwResult.protectedAreaOverlap) {
        risks.push('Deforestation detected in protected areas');
      }

      const verificationResult = {
        plotId,
        verificationDate: new Date().toISOString(),
        complianceStatus,
        risks,
        wdpaAnalysis: wdpaResult,
        gfwAnalysis: gfwResult,
        eudrCompliant: complianceStatus === 'compliant',
        recommendedActions: risks.length > 0 ? [
          'Immediate field verification required',
          'Contact local forestry authorities',
          'Provide additional documentation'
        ] : ['Continue monitoring']
      };

      res.json(verificationResult);
    } catch (error) {
      console.error("Comprehensive verification error:", error);
      res.status(500).json({ 
        error: "Comprehensive verification failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Deforestation Alerts API (merged satellite imagery and monitoring with GFW integration)
  app.get("/api/deforestation-alerts", isAuthenticated, async (req, res) => {
    try {
      // Mock deforestation alert data with GFW integration
      const mockAlertData = [
        {
          id: "alert_001",
          plotId: "plot_002",
          plotNumber: "KPN-002",
          coordinates: [-1.789, 112.123],
          alertDate: "2024-01-14",
          confidenceLevel: "high",
          severity: "critical",
          forestLossArea: 12.5,
          alertSource: "GLAD",
          supplierName: "PT Wilmar International",
          businessUnit: "Plantation South",
          village: "Desa Sejahtera",
          district: "Jambi Selatan",
          verificationStatus: "verified",
          gfwAnalysis: {
            treeCoverLoss: 12.5,
            treeCoverGain: 0.2,
            biomassLoss: 420,
            carbonEmissions: 1680,
            protectedAreaOverlap: false,
            primaryForestLoss: true
          },
          satelliteImagery: {
            beforeImage: "/api/satellite-images/before_002.jpg",
            afterImage: "/api/satellite-images/after_002.jpg",
            captureDate: "2024-01-15",
            resolution: "10m",
            cloudCover: 15
          }
        },
        {
          id: "alert_002",
          plotId: "plot_005",
          plotNumber: "KPN-005",
          coordinates: [-2.567, 111.234],
          alertDate: "2024-01-11",
          confidenceLevel: "high",
          severity: "high",
          forestLossArea: 8.3,
          alertSource: "RADD",
          supplierName: "PT Musim Mas Group",
          businessUnit: "Estate Management",
          village: "Desa Maju",
          district: "Riau Selatan",
          verificationStatus: "under-review",
          gfwAnalysis: {
            treeCoverLoss: 8.3,
            treeCoverGain: 0.0,
            biomassLoss: 280,
            carbonEmissions: 1120,
            protectedAreaOverlap: true,
            primaryForestLoss: true
          },
          satelliteImagery: {
            beforeImage: "/api/satellite-images/before_005.jpg",
            afterImage: "/api/satellite-images/after_005.jpg",
            captureDate: "2024-01-12",
            resolution: "10m",
            cloudCover: 8
          }
        },
        {
          id: "alert_003",
          plotId: "plot_003",
          plotNumber: "KPN-003",
          coordinates: [-0.567, 110.789],
          alertDate: "2024-01-10",
          confidenceLevel: "medium",
          severity: "medium",
          forestLossArea: 3.2,
          alertSource: "FORMA",
          supplierName: "PT Astra Agro Lestari",
          businessUnit: "Plantation Central",
          village: "Desa Berkah",
          district: "Sumatra Utara",
          verificationStatus: "pending",
          gfwAnalysis: {
            treeCoverLoss: 3.2,
            treeCoverGain: 0.1,
            biomassLoss: 110,
            carbonEmissions: 440,
            protectedAreaOverlap: false,
            primaryForestLoss: false
          },
          satelliteImagery: {
            beforeImage: "/api/satellite-images/before_003.jpg",
            afterImage: "/api/satellite-images/after_003.jpg",
            captureDate: "2024-01-11",
            resolution: "30m",
            cloudCover: 25
          }
        }
      ];
      
      res.json(mockAlertData);
    } catch (error) {
      console.error("Error fetching deforestation alerts:", error);
      res.status(500).json({ error: "Failed to fetch deforestation alerts" });
    }
  });

  // Update alert verification status
  app.patch("/api/deforestation-alerts/:id/verify", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { verificationStatus, notes } = req.body;
      
      // In production, update the alert in the database
      res.json({ 
        message: `Alert ${id} verification status updated to ${verificationStatus}`,
        alertId: id,
        verificationStatus,
        notes,
        updatedBy: req.user?.id,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating alert verification:", error);
      res.status(500).json({ error: "Failed to update alert verification" });
    }
  });

  // Surveys API
  app.get("/api/surveys", isAuthenticated, async (req, res) => {
    try {
      const surveys = await storage.getAllSurveys();
      res.json(surveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  app.post("/api/surveys", isAuthenticated, async (req, res) => {
    try {
      const surveyData = insertSurveySchema.parse({
        ...req.body,
        createdBy: req.user?.id
      });
      const survey = await storage.createSurvey(surveyData);
      res.status(201).json(survey);
    } catch (error) {
      console.error("Error creating survey:", error);
      res.status(400).json({ error: "Invalid survey data" });
    }
  });

  // Survey Responses API
  app.post("/api/survey-responses", isAuthenticated, async (req, res) => {
    try {
      const responseData = insertSurveyResponseSchema.parse({
        ...req.body,
        completedBy: req.user?.id
      });
      const response = await storage.createSurveyResponse(responseData);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating survey response:", error);
      res.status(400).json({ error: "Invalid survey response data" });
    }
  });

  // Country Map - Plot data with geospatial information
  app.get("/api/country-map/plots", isAuthenticated, async (req, res) => {
    try {
      const plots = await storage.getAllPlots();
      const enhancedPlots = plots.map((plot, index) => ({
        ...plot,
        // Indonesian coordinates for real WDPA and GFW verification testing
        polygon: index === 0 ? [
          [110.123, -1.456], [110.134, -1.456], [110.134, -1.467], [110.123, -1.467], [110.123, -1.456]
        ] : index === 1 ? [
          [112.789, -1.234], [112.801, -1.234], [112.801, -1.245], [112.789, -1.245], [112.789, -1.234]
        ] : [
          [113.456, -0.678], [113.467, -0.678], [113.467, -0.689], [113.456, -0.689], [113.456, -0.678]
        ],
        coordinates: index === 0 ? { lat: -1.456, lng: 110.123 } : 
                    index === 1 ? { lat: -1.234, lng: 112.789 } : 
                    { lat: -0.678, lng: 113.456 },
        businessEntity: plot.supplierId || 'KPN Plantations',
        province: index === 0 ? 'Kalimantan Timur' : index === 1 ? 'Sumatra Selatan' : 'Kalimantan Barat',
        district: index === 0 ? 'Kutai Kartanegara' : index === 1 ? 'Musi Banyuasin' : 'Sanggau',
        village: index === 0 ? 'Desa Makmur' : index === 1 ? 'Desa Berkah' : 'Desa Sejahtera',
        complianceStatus: plot.status === 'compliant' ? 'compliant' : 
                         plot.deforestationRisk === 'high' ? 'high-risk' :
                         plot.deforestationRisk === 'medium' ? 'medium-risk' : 'low-risk',
        risks: plot.deforestationRisk === 'high' ? ['Deforestation detected', 'Located in protected area'] :
               plot.deforestationRisk === 'medium' ? ['Permit expiring soon'] : [],
        permitStatus: plot.deforestationRisk === 'high' ? 'Expired' : 
                     plot.deforestationRisk === 'medium' ? 'Expiring Soon' : 'Valid',
        permitExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isInProtectedArea: plot.deforestationRisk === 'high',
        deforestationDetected: plot.deforestationRisk === 'high',
        treecoverLoss: plot.deforestationRisk === 'high' ? 15 : plot.deforestationRisk === 'medium' ? 5 : 0,
        lastVerified: new Date().toISOString().split('T')[0],
        plantingDate: plot.createdAt.toISOString().split('T')[0]
      }));
      res.json(enhancedPlots);
    } catch (error) {
      console.error("Error fetching country map plots:", error);
      res.status(500).json({ error: "Failed to fetch country map plots" });
    }
  });

  // Layer data for WDPA, KLHK, GFW analysis
  app.get("/api/country-map/layers/:layerType", isAuthenticated, async (req, res) => {
    try {
      const { layerType } = req.params;
      
      const layerData = {
        wdpa: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Leuser National Park', status: 'Strict Protection', category: 'National Park' },
              geometry: { type: 'Polygon', coordinates: [[[97.0, 3.0], [98.5, 3.0], [98.5, 4.5], [97.0, 4.5], [97.0, 3.0]]] }
            },
            {
              type: 'Feature',
              properties: { name: 'Tesso Nilo National Park', status: 'Protected Area', category: 'National Park' },
              geometry: { type: 'Polygon', coordinates: [[[101.8, 0.0], [102.2, 0.0], [102.2, 0.4], [101.8, 0.4], [101.8, 0.0]]] }
            }
          ]
        },
        klhk: {
          type: 'FeatureCollection', 
          features: [
            {
              type: 'Feature',
              properties: { legalStatus: 'Production Forest', permit: 'Valid', category: 'HPH' },
              geometry: { type: 'Polygon', coordinates: [[[99.0, 2.0], [99.5, 2.0], [99.5, 2.5], [99.0, 2.5], [99.0, 2.0]]] }
            },
            {
              type: 'Feature',
              properties: { legalStatus: 'Convertible Production Forest', permit: 'Valid', category: 'HPK' },
              geometry: { type: 'Polygon', coordinates: [[[101.0, 0.5], [101.5, 0.5], [101.5, 1.0], [101.0, 1.0], [101.0, 0.5]]] }
            }
          ]
        },
        gfw: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature', 
              properties: { forestLoss: 12, year: 2024, confidence: 'High', source: 'GLAD' },
              geometry: { type: 'Polygon', coordinates: [[[109.0, -0.5], [109.5, -0.5], [109.5, 0.0], [109.0, 0.0], [109.0, -0.5]]] }
            },
            {
              type: 'Feature',
              properties: { forestLoss: 8, year: 2024, confidence: 'Medium', source: 'RADD' },
              geometry: { type: 'Polygon', coordinates: [[[102.0, 1.0], [102.3, 1.0], [102.3, 1.3], [102.0, 1.3], [102.0, 1.0]]] }
            }
          ]
        }
      };

      res.json(layerData[layerType as keyof typeof layerData] || { type: 'FeatureCollection', features: [] });
    } catch (error) {
      console.error("Error fetching layer data:", error);
      res.status(500).json({ error: "Failed to fetch layer data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
