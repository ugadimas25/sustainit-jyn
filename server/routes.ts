import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
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

  const httpServer = createServer(app);
  return httpServer;
}
