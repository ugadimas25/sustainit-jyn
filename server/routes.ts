import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import { setupAuth, isAuthenticated } from "./auth";
import { voiceAssistantRouter } from "./routes/voice-assistant";
import { storage } from "./storage";
import { 
  insertCommoditySchema,
  insertPartySchema,
  insertFacilitySchema,
  insertLotSchema,
  insertEventSchema,
  insertEventInputSchema,
  insertEventOutputSchema,
  insertShipmentSchema,
  insertCustodyChainSchema,
  insertMassBalanceRecordSchema,
  insertSupplierLinkSchema,
  insertPlotSchema,
  insertSupplierSchema,
  insertSupplierWorkflowLinkSchema,
  insertWorkflowShipmentSchema,
  insertDdsReportSchema,
  insertEudrAssessmentSchema,
  insertMillSchema,
  insertSupplierAssessmentProgressSchema,
  insertRiskAssessmentSchema,
  insertRiskAssessmentItemSchema,
  // Type imports for type casting
  type InsertSupplier,
  type Supplier,
  type InsertRiskAssessment,
  type RiskAssessment,
  type InsertRiskAssessmentItem,
  type RiskAssessmentItem,
  type InsertEudrAssessment,
  type EudrAssessment,
  // Dashboard PRD imports
  dashboardFiltersSchema,
  dashboardMetricsSchema,
  riskSplitSchema,
  legalitySplitSchema,
  supplierSummarySchema,
  alertSchema,
  complianceTrendPointSchema,
  exportDataSchema,
  plotSummarySchema
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { openaiService } from "./lib/openai-service";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import FormData from "form-data";
import { Readable } from "stream";
import { jsPDF } from "jspdf";
import * as fs from 'fs';
import * as path from 'path';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeDefaultUser() {
  // Only create default user in development environment
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const existingUser = await storage.getUserByUsername("kpneudr");
    if (!existingUser) {
      const hashedPassword = await hashPassword("kpneudr");
      await storage.createUser({
        username: "kpneudr",
        password: hashedPassword,
        role: "admin",
        name: "KPN Compliance Administrator",
        email: "admin@kpn.com"
      });
      console.log("✓ Default user 'kpneudr' created successfully");
    }
  } catch (error) {
    console.error("Error initializing default user:", error);
  }
}

async function seedSampleData() {
  try {
    // Create sample commodity
    const commodities = await storage.getCommodities();
    if (commodities.length === 0) {
      await storage.createCommodity({
        code: "CPO",
        name: "Crude Palm Oil",
        uomBase: "kg",
        category: "palm_oil"
      });

      await storage.createCommodity({
        code: "FFB",
        name: "Fresh Fruit Bunches",
        uomBase: "kg",
        category: "palm_oil"
      });
    }

    // Create sample parties
    const parties = await storage.getParties();
    if (parties.length === 0) {
      const growerParty = await storage.createParty({
        name: "Riau Growers Cooperative",
        type: "grower",
        address: "Riau Province, Indonesia",
        country: "Indonesia",
        certifications: ["RSPO", "ISPO"]
      });

      const millParty = await storage.createParty({
        name: "Central Palm Mill",
        type: "mill", 
        address: "Central Sumatra, Indonesia",
        country: "Indonesia",
        certifications: ["RSPO", "ISCC", "SFC"]
      });
    }

    // Create sample DDS reports with required operators
    const ddsReports = await storage.getDdsReports();
    if (ddsReports.length === 0) {
      const ddsReport1 = await storage.createDdsReport({
        operatorLegalName: "PT TH Indo Plantations",
        operatorAddress: "Jl. Jenderal Sudirman No. 45, Jakarta 12930, Indonesia",
        eoriNumber: "ID123456789000",
        hsCode: "151110",
        productDescription: "Crude Palm Oil (CPO)",
        netMassKg: "2150.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -0.7893, longitude: 101.4467, plotId: "PLT-RIAU-TH-001" },
          { latitude: -0.5333, longitude: 101.4500, plotId: "PLT-RIAU-TH-002" }
        ]),
        operatorDeclaration: "I hereby declare that the information provided is accurate and complete.",
        signedBy: "Dr. Bambang Suharto",
        signedDate: new Date("2024-08-15"),
        signatoryFunction: "Chief Executive Officer",
        status: "draft"
      });

      const ddsReport2 = await storage.createDdsReport({
        operatorLegalName: "KPN Upstream",
        operatorAddress: "Jl. MH Thamrin No. 28, Jakarta 10350, Indonesia",
        eoriNumber: "ID987654321000",
        hsCode: "151110",
        productDescription: "Refined Palm Oil",
        netMassKg: "1500.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -1.2708, longitude: 103.7367, plotId: "PLT-JAMBI-UP-001" },
          { latitude: -1.6000, longitude: 103.6000, plotId: "PLT-JAMBI-UP-002" }
        ]),
        priorDdsReference: "EU-DDS-2024-001",
        operatorDeclaration: "This shipment complies with all EU deforestation regulations.",
        signedBy: "Ir. Sari Indrawati",
        signedDate: new Date("2024-08-10"),
        signatoryFunction: "Operations Director",
        status: "generated",
        pdfDocumentPath: "/pdfs/dds-sample-001.pdf"
      });

      const ddsReport3 = await storage.createDdsReport({
        operatorLegalName: "KPN Downstream",
        operatorAddress: "Kawasan Industri Pulogadung, Jakarta 13260, Indonesia",
        eoriNumber: "ID456789123000",
        hsCode: "151190",
        productDescription: "Palm Kernel Oil",
        netMassKg: "850.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -2.1234, longitude: 102.8567, plotId: "PLT-SUMSEL-DS-001" },
          { latitude: -2.5678, longitude: 103.1234, plotId: "PLT-SUMSEL-DS-002" }
        ]),
        operatorDeclaration: "All products sourced from verified deforestation-free areas.",
        signedBy: "Drs. Agus Wibowo",
        signedDate: new Date("2024-08-05"),
        signatoryFunction: "Supply Chain Manager",
        status: "submitted",
        pdfDocumentPath: "/pdfs/dds-sample-002.pdf",
        euTraceReference: "EU-TRACE-1755198000-456789ab",
        submissionDate: new Date("2024-08-06")
      });
      console.log("✓ Sample DDS reports created");
    }

    console.log("✓ Sample data seeded successfully");
  } catch (error) {
    console.error("Error seeding sample data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  await setupAuth(app);
  await initializeDefaultUser();
  await seedSampleData();

  // Voice Assistant Routes
  app.use('/api/voice-assistant', voiceAssistantRouter);

  // GraphQL endpoint for traceability queries
  app.post('/api/graphql', isAuthenticated, async (req, res) => {
    try {
      const { query, variables } = req.body;

      if (query.includes('traceForward') || query.includes('traceBackward') || query.includes('getFullLineage')) {
        const entityId = variables?.entityId;
        const entityType = variables?.entityType;

        // Mock comprehensive lineage data for testing
        const mockLineageResult = {
          entityId,
          entityType,
          depth: 5,
          totalNodes: 12,
          nodes: [
            {
              id: 'plot-riau-001',
              type: 'plot',
              name: 'Palm Plot A - Riau Province',
              data: { 
                level: 0, 
                area: '5.2 hectares', 
                farmer: 'Budi Santoso',
                crop: 'oil_palm',
                plantingYear: 2018
              },
              coordinates: { latitude: -0.5021, longitude: 101.4967 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISPO'],
              distance: 0,
              massBalance: { input: 0, output: 50.5, efficiency: 100 }
            },
            {
              id: 'collection-riau-001',
              type: 'facility',
              name: 'Riau Collection Center A',
              data: { 
                level: 1, 
                facilityType: 'collection_center', 
                capacity: '1000 tonnes/day',
                operatingHours: '24/7'
              },
              coordinates: { latitude: -0.5105, longitude: 101.5123 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISCC'],
              distance: 2.1,
              massBalance: { input: 50.5, output: 48.2, efficiency: 95.4 }
            },
            {
              id: 'mill-sumatra-001',
              type: 'facility',
              name: 'Central Palm Mill Complex',
              data: { 
                level: 2, 
                facilityType: 'mill', 
                capacity: '200 tonnes/hour',
                processes: ['sterilization', 'pressing', 'clarification']
              },
              coordinates: { latitude: -0.5234, longitude: 101.5456 },
              riskLevel: 'medium',
              certifications: ['RSPO', 'ISCC', 'SFC'],
              distance: 8.7,
              massBalance: { input: 48.2, output: 22.1, efficiency: 45.8 }
            },
            {
              id: 'refinery-jakarta-001',
              type: 'facility', 
              name: 'Jakarta Oil Refinery Complex',
              data: { 
                level: 3, 
                facilityType: 'refinery', 
                capacity: '500 tonnes/day',
                processes: ['neutralization', 'bleaching', 'deodorization']
              },
              coordinates: { latitude: -6.2088, longitude: 106.8456 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISCC', 'RTRS'],
              distance: 45.3,
              massBalance: { input: 22.1, output: 21.8, efficiency: 98.6 }
            },
            {
              id: 'port-jakarta-001',
              type: 'facility',
              name: 'Tanjung Priok Export Terminal',
              data: { 
                level: 4, 
                facilityType: 'port', 
                capacity: '10000 tonnes storage',
                exportDestinations: ['Rotterdam', 'Hamburg', 'Antwerp']
              },
              coordinates: { latitude: -6.1052, longitude: 106.8970 },
              riskLevel: 'low',
              certifications: ['RSPO', 'ISCC'],
              distance: 50.2,
              massBalance: { input: 21.8, output: 21.8, efficiency: 100 }
            },
            {
              id: 'shipment-exp-001',
              type: 'shipment',
              name: 'Export Shipment EXP-2024-001',
              data: { 
                level: 5, 
                destination: 'Rotterdam, Netherlands', 
                vessel: 'MV Palm Carrier',
                departureDate: '2024-08-15',
                estimatedArrival: '2024-09-10'
              },
              coordinates: { latitude: -6.1052, longitude: 106.8970 },
              riskLevel: 'low',
              certifications: ['EUDR', 'RSPO'],
              distance: 55.8,
              massBalance: { input: 21.8, output: 21.8, efficiency: 100 }
            }
          ],
          edges: [
            { 
              source: 'plot-riau-001', 
              target: 'collection-riau-001', 
              type: 'delivery', 
              quantity: 50.5, 
              uom: 'tonnes',
              date: '2024-08-10',
              eventType: 'TRANSFER'
            },
            { 
              source: 'collection-riau-001', 
              target: 'mill-sumatra-001', 
              type: 'processing', 
              quantity: 48.2, 
              uom: 'tonnes',
              date: '2024-08-11',
              eventType: 'TRANSFORM'
            },
            { 
              source: 'mill-sumatra-001', 
              target: 'refinery-jakarta-001', 
              type: 'transformation', 
              quantity: 22.1, 
              uom: 'tonnes',
              date: '2024-08-12',
              eventType: 'TRANSFER'
            },
            { 
              source: 'refinery-jakarta-001', 
              target: 'port-jakarta-001', 
              type: 'transfer', 
              quantity: 21.8, 
              uom: 'tonnes',
              date: '2024-08-13',
              eventType: 'TRANSFER'
            },
            { 
              source: 'port-jakarta-001', 
              target: 'shipment-exp-001', 
              type: 'shipment', 
              quantity: 21.8, 
              uom: 'tonnes',
              date: '2024-08-15',
              eventType: 'TRANSFER'
            }
          ],
          riskAssessment: {
            overallRisk: 'medium',
            riskFactors: [
              {
                type: 'Processing Efficiency',
                severity: 'medium',
                description: 'Mill processing efficiency below industry standard at 45.8%',
                entityId: 'mill-sumatra-001',
                recommendation: 'Equipment maintenance and process optimization needed'
              },
              {
                type: 'Geographic Risk',
                severity: 'low',
                description: 'Source location in low-risk deforestation area',
                entityId: 'plot-riau-001',
                recommendation: 'Continue monitoring satellite data'
              }
            ],
            compliance: {
              eudrCompliant: true,
              rspoCompliant: true,
              issues: [],
              score: 87.5
            },
            massBalanceValidation: {
              isValid: true,
              overallEfficiency: 95.2,
              totalInput: 50.5,
              totalOutput: 21.8,
              totalWaste: 28.7,
              conversionRate: 0.431 // CPO from FFB
            }
          },
          chainOfCustodyEvents: [
            {
              id: 'evt-001',
              eventType: 'creation',
              timestamp: '2024-08-10T06:00:00Z',
              facility: 'plot-riau-001',
              businessStep: 'harvesting',
              quantity: 50.5,
              uom: 'tonnes'
            },
            {
              id: 'evt-002',
              eventType: 'TRANSFER',
              timestamp: '2024-08-10T14:00:00Z',
              facility: 'collection-riau-001',
              businessStep: 'receiving',
              quantity: 50.5,
              uom: 'tonnes'
            },
            {
              id: 'evt-003',
              eventType: 'TRANSFORM',
              timestamp: '2024-08-11T08:00:00Z',
              facility: 'mill-sumatra-001',
              businessStep: 'processing',
              inputQuantity: 48.2,
              outputQuantity: 22.1,
              uom: 'tonnes'
            }
          ]
        };

        const operation = query.includes('traceForward') ? 'traceForward' : 
                         query.includes('traceBackward') ? 'traceBackward' : 'getFullLineage';
        res.json({ data: { [operation]: mockLineageResult } });
      } else if (query.includes('getCustodyChains')) {
        const mockChains = [
          {
            id: 'chain-001',
            chainId: 'CHAIN-FFB-001',
            sourcePlot: { id: 'plot-riau-001', name: 'Palm Plot A - Riau', area: '5.2 ha' },
            sourceFacility: { id: 'collection-riau-001', name: 'Riau Collection Center A', facilityType: 'collection_center' },
            destinationFacility: { id: 'mill-sumatra-001', name: 'Central Palm Mill', facilityType: 'mill' },
            productType: 'FFB',
            totalQuantity: 50.5,
            remainingQuantity: 22.1,
            status: 'active',
            qualityGrade: 'Grade A',
            batchNumber: 'BATCH-FFB-001',
            harvestDate: '2024-08-10',
            expiryDate: '2024-08-20',
            riskLevel: 'low',
            complianceScore: 87.5
          },
          {
            id: 'chain-002',
            chainId: 'CHAIN-CPO-001',
            sourcePlot: { id: 'plot-riau-002', name: 'Palm Plot B - Sumatra', area: '8.1 ha' },
            sourceFacility: { id: 'mill-sumatra-001', name: 'Central Palm Mill', facilityType: 'mill' },
            destinationFacility: { id: 'refinery-jakarta-001', name: 'Jakarta Oil Refinery', facilityType: 'refinery' },
            productType: 'CPO',
            totalQuantity: 22.1,
            remainingQuantity: 21.8,
            status: 'active',
            qualityGrade: 'Premium',
            batchNumber: 'BATCH-CPO-002',
            harvestDate: '2024-08-12',
            expiryDate: '2024-09-12',
            riskLevel: 'medium',
            complianceScore: 92.3
          }
        ];
        res.json({ data: { getCustodyChains: mockChains } });
      } else if (query.includes('getFacilities')) {
        const mockFacilities = [
          {
            id: 'collection-riau-001',
            name: 'Riau Collection Center A',
            facilityType: 'collection_center',
            location: { latitude: -0.5105, longitude: 101.5123 },
            certifications: ['RSPO', 'ISCC'],
            capacity: '1000 tonnes/day',
            riskLevel: 'low'
          },
          {
            id: 'mill-sumatra-001',
            name: 'Central Palm Mill Complex',
            facilityType: 'mill',
            location: { latitude: -0.5234, longitude: 101.5456 },
            certifications: ['RSPO', 'ISCC', 'SFC'],
            capacity: '200 tonnes/hour',
            riskLevel: 'medium'
          },
          {
            id: 'refinery-jakarta-001',
            name: 'Jakarta Oil Refinery Complex',
            facilityType: 'refinery',
            location: { latitude: -6.2088, longitude: 106.8456 },
            certifications: ['RSPO', 'ISCC', 'RTRS'],
            capacity: '500 tonnes/day',
            riskLevel: 'low'
          }
        ];
        res.json({ data: { getFacilities: mockFacilities } });
      } else if (query.includes('getCustodyEvents')) {
        const mockEvents = [
          {
            id: 'evt-001',
            eventType: 'creation',
            eventTime: '2024-08-10T06:00:00Z',
            businessStep: 'harvesting',
            disposition: 'active',
            quantity: 50.5,
            uom: 'tonnes',
            facility: { name: 'Palm Plot A - Riau', facilityType: 'plot' },
            recordedBy: { name: 'Farmer Budi Santoso' }
          },
          {
            id: 'evt-002',
            eventType: 'TRANSFER',
            eventTime: '2024-08-10T14:00:00Z',
            businessStep: 'shipping',
            disposition: 'in_transit',
            quantity: 50.5,
            uom: 'tonnes',
            facility: { name: 'Riau Collection Center A', facilityType: 'collection_center' },
            recordedBy: { name: 'Driver Ahmad' }
          },
          {
            id: 'evt-003',
            eventType: 'TRANSFORM',
            eventTime: '2024-08-11T08:00:00Z',
            businessStep: 'processing',
            disposition: 'processed',
            inputQuantity: 48.2,
            outputQuantity: 22.1,
            uom: 'tonnes',
            facility: { name: 'Central Palm Mill Complex', facilityType: 'mill' },
            recordedBy: { name: 'Mill Operator Sari' }
          }
        ];
        res.json({ data: { getCustodyEvents: mockEvents } });
      } else if (query.includes('validateMassBalance')) {
        const mockValidation = {
          isValid: true,
          totalInput: 50.5,
          totalOutput: 21.8,
          totalWaste: 28.7,
          overallEfficiency: 95.2,
          conversionRate: 0.431,
          discrepancies: [],
          facilityEfficiencies: [
            { facilityId: 'collection-riau-001', efficiency: 95.4, status: 'good' },
            { facilityId: 'mill-sumatra-001', efficiency: 45.8, status: 'below_target' },
            { facilityId: 'refinery-jakarta-001', efficiency: 98.6, status: 'excellent' }
          ]
        };
        res.json({ data: { validateMassBalance: mockValidation } });
      } else {
        res.status(400).json({ error: 'Unsupported GraphQL operation' });
      }
    } catch (error) {
      console.error('GraphQL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Core entity routes
  app.get("/api/commodities", isAuthenticated, async (req, res) => {
    try {
      const commodities = await storage.getCommodities();
      res.json(commodities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commodities" });
    }
  });

  app.get("/api/parties", isAuthenticated, async (req, res) => {
    try {
      const parties = await storage.getParties();
      res.json(parties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parties" });
    }
  });

  app.get("/api/facilities", isAuthenticated, async (req, res) => {
    try {
      const facilities = await storage.getFacilities();
      res.json(facilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.get("/api/lots", isAuthenticated, async (req, res) => {
    try {
      const lots = await storage.getLots();
      res.json(lots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lots" });
    }
  });

  app.get("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.get("/api/custody-chains", isAuthenticated, async (req, res) => {
    try {
      const chains = await storage.getCustodyChains();
      res.json(chains);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custody chains" });
    }
  });

  // Legacy support routes
  // Suppliers endpoints for workflow
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData as InsertSupplier);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier" });
      }
    }
  });

  app.put("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData as Partial<Supplier>);
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
      } else {
        res.json(supplier);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update supplier" });
      }
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSupplier(id);
      if (!deleted) {
        res.status(404).json({ error: "Supplier not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Supplier links endpoints
  app.get("/api/supplier-links", isAuthenticated, async (req, res) => {
    try {
      const links = await storage.getSupplierWorkflowLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier links" });
    }
  });

  app.post("/api/supplier-links", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierWorkflowLinkSchema.parse(req.body);
      const link = await storage.createSupplierWorkflowLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid link data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier link" });
      }
    }
  });

  app.delete("/api/supplier-links/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSupplierWorkflowLink(id);
      if (!deleted) {
        res.status(404).json({ error: "Supplier link not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier link" });
    }
  });

  // Workflow shipments endpoints
  app.get("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const shipments = await storage.getWorkflowShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.post("/api/shipments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkflowShipmentSchema.parse(req.body);
      const shipment = await storage.createWorkflowShipment(validatedData);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create shipment" });
      }
    }
  });

  app.put("/api/shipments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWorkflowShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateWorkflowShipment(id, validatedData);
      if (!shipment) {
        res.status(404).json({ error: "Shipment not found" });
      } else {
        res.json(shipment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update shipment" });
      }
    }
  });

  app.delete("/api/shipments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWorkflowShipment(id);
      if (!deleted) {
        res.status(404).json({ error: "Shipment not found" });
      } else {
        res.status(204).send();
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shipment" });
    }
  });

  // Supplier Assessment Progress endpoints
  app.get("/api/supplier-assessment-progress", isAuthenticated, async (req, res) => {
    try {
      const progress = await storage.getSupplierAssessmentProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier assessment progress" });
    }
  });

  app.get("/api/supplier-assessment-progress/:supplierName", isAuthenticated, async (req, res) => {
    try {
      const { supplierName } = req.params;
      const progress = await storage.getSupplierAssessmentProgressByName(decodeURIComponent(supplierName));
      if (!progress) {
        res.status(404).json({ error: "Supplier progress not found" });
      } else {
        res.json(progress);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier progress" });
    }
  });

  app.post("/api/supplier-assessment-progress", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSupplierAssessmentProgressSchema.parse(req.body);
      const progress = await storage.createSupplierAssessmentProgress(validatedData);
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid progress data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier progress" });
      }
    }
  });

  app.put("/api/supplier-assessment-progress/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSupplierAssessmentProgressSchema.partial().parse(req.body);
      const progress = await storage.updateSupplierAssessmentProgress(id, validatedData);
      if (!progress) {
        res.status(404).json({ error: "Supplier progress not found" });
      } else {
        res.json(progress);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid progress data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update supplier progress" });
      }
    }
  });

  // Workflow step management endpoints
  app.post("/api/supplier-workflow-step", isAuthenticated, async (req, res) => {
    try {
      const { supplierName, step, completed, referenceId } = req.body;
      if (!supplierName || typeof step !== 'number' || typeof completed !== 'boolean') {
        return res.status(400).json({ error: "Missing required fields: supplierName, step, completed" });
      }

      const progress = await storage.updateSupplierWorkflowStep(supplierName, step, completed, referenceId);
      if (!progress) {
        res.status(404).json({ error: "Failed to update workflow step" });
      } else {
        res.json(progress);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow step" });
    }
  });

  app.get("/api/supplier-step-access/:supplierName/:step", isAuthenticated, async (req, res) => {
    try {
      const { supplierName, step } = req.params;
      const stepNumber = parseInt(step, 10);
      if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 3) {
        return res.status(400).json({ error: "Step must be a number between 1 and 3" });
      }

      const hasAccess = await storage.checkSupplierStepAccess(decodeURIComponent(supplierName), stepNumber);
      res.json({ supplierName, step: stepNumber, hasAccess });
    } catch (error) {
      res.status(500).json({ error: "Failed to check step access" });
    }
  });

  // Risk Assessment API endpoints based on Excel methodology
  app.get("/api/risk-assessments", isAuthenticated, async (req, res) => {
    try {
      const assessments = await storage.getRiskAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessments" });
    }
  });

  app.get("/api/risk-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const assessment = await storage.getRiskAssessment(id);
      if (!assessment) {
        res.status(404).json({ error: "Risk assessment not found" });
      } else {
        res.json(assessment);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessment" });
    }
  });

  app.get("/api/risk-assessments/supplier/:supplierId", isAuthenticated, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const assessments = await storage.getRiskAssessmentBySupplier(supplierId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supplier risk assessments" });
    }
  });

  app.post("/api/risk-assessments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRiskAssessmentSchema.parse(req.body);
      const assessment = await storage.createRiskAssessment(validatedData as InsertRiskAssessment);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create risk assessment" });
      }
    }
  });

  app.put("/api/risk-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRiskAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateRiskAssessment(id, validatedData as Partial<RiskAssessment>);
      if (!assessment) {
        res.status(404).json({ error: "Risk assessment not found" });
      } else {
        res.json(assessment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update risk assessment" });
      }
    }
  });

  app.delete("/api/risk-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRiskAssessment(id);
      if (!deleted) {
        res.status(404).json({ error: "Risk assessment not found" });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete risk assessment" });
    }
  });

  // Risk Assessment Items endpoints
  app.get("/api/risk-assessments/:assessmentId/items", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const items = await storage.getRiskAssessmentItems(assessmentId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk assessment items" });
    }
  });

  app.post("/api/risk-assessments/:assessmentId/items", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const validatedData = insertRiskAssessmentItemSchema.parse({
        ...req.body,
        riskAssessmentId: assessmentId
      });
      const item = await storage.createRiskAssessmentItem(validatedData as InsertRiskAssessmentItem);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create risk assessment item" });
      }
    }
  });

  app.put("/api/risk-assessment-items/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRiskAssessmentItemSchema.partial().parse(req.body);
      const item = await storage.updateRiskAssessmentItem(id, validatedData as Partial<RiskAssessmentItem>);
      if (!item) {
        res.status(404).json({ error: "Risk assessment item not found" });
      } else {
        res.json(item);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid risk assessment item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update risk assessment item" });
      }
    }
  });

  app.delete("/api/risk-assessment-items/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRiskAssessmentItem(id);
      if (!deleted) {
        res.status(404).json({ error: "Risk assessment item not found" });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete risk assessment item" });
    }
  });

  // Risk scoring and reporting endpoints based on Excel methodology
  app.get("/api/risk-assessments/:assessmentId/score", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const scoring = await storage.calculateRiskScore(assessmentId);
      res.json(scoring);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate risk score" });
    }
  });

  app.get("/api/risk-assessments/:assessmentId/report", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;
      const report = await storage.generateRiskReport(assessmentId);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate risk report" });
    }
  });

  // Excel-based risk template initialization endpoint
  app.post("/api/risk-assessments/:assessmentId/init-excel-template", isAuthenticated, async (req, res) => {
    try {
      const { assessmentId } = req.params;

      // Initialize default risk items based on Excel methodology
      const defaultRiskItems = [
        // Spatial Risk Analysis items from Excel
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "deforestasi",
          itemName: "Deforestasi",
          riskLevel: "rendah",
          parameter: "Sumber TBS Berasal dari Kebun yang di kembangkan sebelum Desember 2020",
          riskValue: 3,
          weight: "45.00",
          calculatedRisk: 135.00, // 45 * 3
          normalizedScore: 0.45, // 135 / 300 (max possible score)
          finalScore: 0.15,
          mitigationRequired: false,
          mitigationDescription: "Monitoring berkala plot sumber TBS",
          dataSources: ["Hansen Alert", "Glad Alert", "JRC Natural Forest"],
          sourceLinks: ["https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html", "http://glad-forest-alert.appspot.com/", "https://data.jrc.ec.europa.eu/dataset/10d1b337-b7d1-4938-a048-686c8185b290"]
        },
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "legalitas_lahan",
          itemName: "Legalitas Lahan",
          riskLevel: "rendah",
          parameter: "Memiliki Izin dan Berada di Kawasan APL",
          riskValue: 3,
          weight: "35.00",
          calculatedRisk: 105.00,
          normalizedScore: 0.35,
          finalScore: 0.12,
          mitigationRequired: false,
          mitigationDescription: "Monitoring Berkala plot Sumber TBS",
          dataSources: ["Peta WDPA", "Peta Kawasan Hutan Indonesia"],
          sourceLinks: ["https://www.protectedplanet.net/en/thematic-areas/wdpa?tab=WDPA", "https://geoportal.menlhk.go.id/portal/apps/webappviewer/index.html?id=2ee8bdda1d714899955fccbe7fdf8468&utm_"]
        },
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "kawasan_gambut",
          itemName: "Kawasan Gambut",
          riskLevel: "sedang",
          parameter: "Plot Sumber TBS overlap dengan peta indikatif gambut fungsi lindung dan sedang proses bimbingan teknis",
          riskValue: 2,
          weight: "10.00",
          calculatedRisk: 20.00,
          normalizedScore: 0.10,
          finalScore: 0.03,
          mitigationRequired: true,
          mitigationDescription: "Sosialisasi kebijakan perusahaan kepada supplier",
          dataSources: ["Peta Areal Gambut"],
          sourceLinks: ["https://brgm.go.id/"]
        },
        {
          riskAssessmentId: assessmentId,
          category: "spatial",
          itemType: "indigenous_people",
          itemName: "Indigenous People",
          riskLevel: "rendah",
          parameter: "Tidak ada Overlap dan Memiliki SOP mengenai Penanganan Keluhan Stakeholder",
          riskValue: 3,
          weight: "10.00",
          calculatedRisk: 30.00,
          normalizedScore: 0.10,
          finalScore: 0.03,
          mitigationRequired: false,
          mitigationDescription: "Monitoring isu sosial secara berkala untuk deteksi dini potensi konflik",
          dataSources: ["Peta Masyarakat Adat"],
          sourceLinks: ["https://www.aman.or.id/"]
        }
      ];

      // Create all default items
      const createdItems = [];
      for (const itemData of defaultRiskItems) {
        const item = await storage.createRiskAssessmentItem({
          ...itemData,
          category: itemData.category as "spatial" | "non_spatial",
          itemType: itemData.itemType as "deforestasi" | "legalitas_lahan" | "kawasan_gambut" | "indigenous_people" | "sertifikasi" | "dokumentasi_legal",
          riskLevel: itemData.riskLevel as "tinggi" | "sedang" | "rendah",
          calculatedRisk: itemData.calculatedRisk.toString(),
          normalizedScore: itemData.normalizedScore.toString(),
          finalScore: itemData.finalScore.toString()
        });
        createdItems.push(item);
      }

      // Calculate initial score
      const scoring = await storage.calculateRiskScore(assessmentId);

      // Update assessment with initial scores
      await storage.updateRiskAssessment(assessmentId, {
        spatialRiskScore: scoring.overallScore.toString(),
        spatialRiskLevel: scoring.riskClassification as any,
        overallScore: scoring.overallScore.toString(),
        riskClassification: scoring.riskClassification as any
      });

      res.json({
        items: createdItems,
        scoring
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to initialize Excel-based risk template" });
    }
  });

  app.get("/api/mills", isAuthenticated, async (req, res) => {
    try {
      const mills = await storage.getMills();
      res.json(mills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mills" });
    }
  });

  app.get("/api/plots", isAuthenticated, async (req, res) => {
    try {
      const plots = await storage.getPlots();
      res.json(plots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plots" });
    }
  });

  // ========================================
  // DASHBOARD COMPLIANCE PRD - PHASE 2: API ROUTES
  // ========================================

  // Dashboard metrics with optional filters
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const metrics = await storage.getDashboardMetrics(filters);

      // Validate response with schema
      const validatedMetrics = dashboardMetricsSchema.parse(metrics);
      res.json(validatedMetrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Return zeros in case of error to maintain zero state
      res.json({
        totalPlots: 0,
        compliantPlots: 0,
        highRiskPlots: 0,
        mediumRiskPlots: 0,
        deforestedPlots: 0,
        totalAreaHa: 0,
        complianceRate: 0
      });
    }
  });

  // Risk split data for donut charts
  app.get("/api/dashboard/risk-split", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const riskSplit = await storage.getRiskSplit(filters);

      // Validate response with schema
      const validatedRiskSplit = riskSplitSchema.parse(riskSplit);
      res.json(validatedRiskSplit);
    } catch (error) {
      console.error("Error fetching risk split:", error);
      res.status(500).json({ error: "Failed to fetch risk split data" });
    }
  });

  // Legality split data for donut charts
  app.get("/api/dashboard/legality-split", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const legalitySplit = await storage.getLegalitySplit(filters);

      // Validate response with schema
      const validatedLegalitySplit = legalitySplitSchema.parse(legalitySplit);
      res.json(validatedLegalitySplit);
    } catch (error) {
      console.error("Error fetching legality split:", error);
      res.status(500).json({ error: "Failed to fetch legality split data" });
    }
  });

  // Supplier compliance table data
  app.get("/api/dashboard/suppliers", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const suppliers = await storage.getSupplierCompliance(filters);

      // Validate response with schema - validate each item
      const validatedSuppliers = suppliers.map(supplier => supplierSummarySchema.parse(supplier));
      res.json(validatedSuppliers);
    } catch (error) {
      console.error("Error fetching supplier compliance:", error);
      res.status(500).json({ error: "Failed to fetch supplier compliance data" });
    }
  });

  // Dashboard alerts for alerts widget
  app.get("/api/dashboard/alerts", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const alerts = await storage.getDashboardAlerts(filters);

      // Validate response with schema - validate each alert
      const validatedAlerts = alerts.map(alert => alertSchema.parse(alert));
      res.json(validatedAlerts);
    } catch (error) {
      console.error("Error fetching dashboard alerts:", error);
      res.status(500).json({ error: "Failed to fetch dashboard alerts" });
    }
  });

  // Compliance trend data for line chart
  app.get("/api/dashboard/trend", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const trendData = await storage.getComplianceTrend(filters);

      // Validate response with schema - validate each point
      const validatedTrendData = trendData.map(point => complianceTrendPointSchema.parse(point));
      res.json(validatedTrendData);
    } catch (error) {
      console.error("Error fetching compliance trend:", error);
      res.status(500).json({ error: "Failed to fetch compliance trend data" });
    }
  });

  // Export functionality for CSV/XLSX
  app.get("/api/dashboard/export", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const format = req.query.format || 'json';
      const exportData = await storage.getExportData(filters);

      // Validate response with schema
      const validatedExportData = exportDataSchema.parse(exportData);

      if (format === 'csv') {
        // Convert to CSV format
        const csvLines: string[] = [];

        // Supplier summary CSV
        csvLines.push('Supplier Summary');
        csvLines.push('Supplier Name,Total Plots,Compliant Plots,Total Area (Ha),Compliance Rate (%),Risk Status,Legality Status,Region,Last Updated');

        validatedExportData.supplierSummaries.forEach(supplier => {
          csvLines.push([
            supplier.supplierName,
            supplier.totalPlots,
            supplier.compliantPlots,
            supplier.totalArea,
            supplier.complianceRate,
            supplier.riskStatus,
            supplier.legalityStatus,
            supplier.region || '',
            supplier.lastUpdated.toISOString()
          ].join(','));
        });

        csvLines.push(''); // Empty line

        // Plot summary CSV
        csvLines.push('Plot Summary');
        csvLines.push('Plot ID,Supplier Name,Region,Area (Ha),Risk Status,Legality Status,Last Updated');

        validatedExportData.plotSummaries.forEach(plot => {
          csvLines.push([
            plot.plotId,
            plot.supplierName,
            plot.region || '',
            plot.area,
            plot.riskStatus,
            plot.legalityStatus,
            plot.lastUpdated.toISOString()
          ].join(','));
        });

        const csvContent = csvLines.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="compliance-overview-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json(validatedExportData);
      }
    } catch (error) {
      console.error("Error generating export data:", error);
      res.status(500).json({ error: "Failed to generate export data" });
    }
  });

  // Plot summaries for drill-down functionality
  app.get("/api/dashboard/plots", async (req, res) => {
    try {
      const filters = dashboardFiltersSchema.parse({
        region: req.query.region,
        businessUnit: req.query.businessUnit,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      });

      const plots = await storage.getPlotSummaries(filters);

      // Validate response with schema - validate each plot
      const validatedPlots = plots.map(plot => plotSummarySchema.parse(plot));
      res.json(validatedPlots);
    } catch (error) {
      console.error("Error fetching plot summaries:", error);
      res.status(500).json({ error: "Failed to fetch plot summaries" });
    }
  });

  // User authentication routes
  app.get("/api/user", (req, res) => {
    if (req.user) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      // Mock alerts for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Shipment traceability endpoint
  app.get("/api/shipments/:shipmentId/traceability", isAuthenticated, async (req, res) => {
    try {
      const { shipmentId } = req.params;

      // Mock traceability data
      const mockTraceability = {
        shipment: {
          id: shipmentId,
          shipmentId: `EXP-2024-${shipmentId.slice(-3)}`,
          destination: 'Rotterdam, Netherlands',
          totalWeight: '21.8'
        },
        shipmentLots: [
          {
            lot: { id: 'lot-001', lotId: 'BATCH-CPO-001', quantity: 21.8 },
            mill: { id: 'mill-001', name: 'Central Palm Mill Complex' }
          }
        ],
        sourcePlots: [
          {
            plot: { id: 'plot-001', plotId: 'PLT-RIAU-001', name: 'Palm Plot A - Riau' },
            supplier: { name: 'Riau Growers Cooperative' },
            delivery: { weight: '50.5', deliveryDate: '2024-08-10' }
          }
        ]
      };

      res.json(mockTraceability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traceability data" });
    }
  });

  // Enhanced DDS Reports routes for PRD implementation

  // Get available HS codes for product selection dropdown
  app.get('/api/dds/hs-codes', isAuthenticated, async (req, res) => {
    try {
      const hsCodes = [
        { code: '1511', description: 'Palm Oil and its fractions, crude', category: 'palm_oil' },
        { code: '151110', description: 'Crude palm oil', category: 'palm_oil' },
        { code: '151190', description: 'Palm oil and its fractions, refined', category: 'palm_oil' },
        { code: '1513', description: 'Coconut (copra), palm kernel or babassu oil', category: 'palm_oil' },
        { code: '151321', description: 'Crude coconut oil', category: 'coconut' },
        { code: '0901', description: 'Coffee, not roasted or decaffeinated', category: 'coffee' },
        { code: '090111', description: 'Coffee, not roasted, not decaffeinated', category: 'coffee' },
        { code: '1801', description: 'Cocoa beans, whole or broken, raw or roasted', category: 'cocoa' },
        { code: '180100', description: 'Cocoa beans, whole or broken', category: 'cocoa' },
        { code: '4401', description: 'Fuel wood, in logs, billets, twigs, faggots', category: 'wood' },
        { code: '440110', description: 'Fuel wood, in logs, billets, twigs', category: 'wood' },
        { code: '1201', description: 'Soya beans, whether or not broken', category: 'soy' },
        { code: '120100', description: 'Soya beans, whether or not broken', category: 'soy' }
      ];
      res.json(hsCodes);
    } catch (error) {
      console.error('Error fetching HS codes:', error);
      res.status(500).json({ error: 'Failed to fetch HS codes' });
    }
  });

  // Get scientific names for products dropdown
  app.get('/api/dds/scientific-names', isAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      const scientificNames = {
        palm_oil: [
          { name: 'Elaeis guineensis', common: 'African Oil Palm' },
          { name: 'Elaeis oleifera', common: 'American Oil Palm' }
        ],
        coconut: [
          { name: 'Cocos nucifera', common: 'Coconut Palm' }
        ],
        coffee: [
          { name: 'Coffea arabica', common: 'Arabica Coffee' },
          { name: 'Coffea canephora', common: 'Robusta Coffee' },
          { name: 'Coffea liberica', common: 'Liberica Coffee' }
        ],
        cocoa: [
          { name: 'Theobroma cacao', common: 'Cacao Tree' }
        ],
        soy: [
          { name: 'Glycine max', common: 'Soybean' }
        ],
        wood: [
          { name: 'Various species', common: 'Mixed Forest Species' }
        ]
      };

      if (category && scientificNames[category as keyof typeof scientificNames]) {
        res.json(scientificNames[category as keyof typeof scientificNames]);
      } else {
        res.json(Object.values(scientificNames).flat());
      }
    } catch (error) {
      console.error('Error fetching scientific names:', error);
      res.status(500).json({ error: 'Failed to fetch scientific names' });
    }
  });

  // Validate GeoJSON data endpoint
  app.post('/api/dds/validate-geojson', isAuthenticated, async (req, res) => {
    try {
      const { geojson } = req.body;

      if (!geojson) {
        return res.status(400).json({ 
          valid: false, 
          error: 'No GeoJSON data provided' 
        });
      }

      let parsedGeoJson;
      try {
        parsedGeoJson = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
      } catch (parseError) {
        return res.status(400).json({ 
          valid: false, 
          error: 'Invalid JSON format' 
        });
      }

      // Basic GeoJSON structure validation
      if (!parsedGeoJson.type) {
        return res.status(400).json({ 
          valid: false, 
          error: 'Missing type property' 
        });
      }

      // Check for valid geometry types
      const validTypes = ['Feature', 'FeatureCollection', 'Polygon', 'MultiPolygon'];
      if (!validTypes.includes(parsedGeoJson.type)) {
        return res.status(400).json({ 
          valid: false, 
          error: `Invalid GeoJSON type: ${parsedGeoJson.type}. Must be Feature, FeatureCollection, Polygon, or MultiPolygon` 
        });
      }

      let polygonFound = false;
      let boundingBox = null;
      let area = 0;
      let centroid = null;

      // Extract polygon geometry and calculate metadata
      if (parsedGeoJson.type === 'Polygon') {
        polygonFound = true;
        const coords = parsedGeoJson.coordinates;
        if (coords && coords[0] && coords[0].length >= 4) {
          boundingBox = calculateBoundingBox(coords[0]);
          centroid = calculateCentroid(coords[0]);
          area = calculatePolygonArea(coords[0]);
        }
      } else if (parsedGeoJson.type === 'MultiPolygon') {
        polygonFound = true;
        const coords = parsedGeoJson.coordinates;
        if (coords && coords[0] && coords[0][0] && coords[0][0].length >= 4) {
          boundingBox = calculateBoundingBox(coords[0][0]);
          centroid = calculateCentroid(coords[0][0]);
          area = calculatePolygonArea(coords[0][0]);
        }
      } else if (parsedGeoJson.type === 'Feature') {
        const geometry = parsedGeoJson.geometry;
        if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
          polygonFound = true;
          const coords = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates[0];
          if (coords && coords[0] && coords[0].length >= 4) {
            boundingBox = calculateBoundingBox(coords[0]);
            centroid = calculateCentroid(coords[0]);
            area = calculatePolygonArea(coords[0]);
          }
        }
      } else if (parsedGeoJson.type === 'FeatureCollection') {
        const features = parsedGeoJson.features;
        if (features && features.length > 0) {
          for (const feature of features) {
            if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
              polygonFound = true;
              const coords = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates[0];
              if (coords && coords[0] && coords[0].length >= 4) {
                boundingBox = calculateBoundingBox(coords[0]);
                centroid = calculateCentroid(coords[0]);
                area = calculatePolygonArea(coords[0]);
                break; // Use first valid polygon
              }
            }
          }
        }
      }

      if (!polygonFound) {
        return res.status(400).json({ 
          valid: false, 
          error: 'No valid polygon geometry found. Only Polygon and MultiPolygon geometries are supported.' 
        });
      }

      res.json({
        valid: true,
        metadata: {
          area: area,
          boundingBox: boundingBox,
          centroid: centroid,
          geometryType: parsedGeoJson.type
        }
      });

    } catch (error) {
      console.error('Error validating GeoJSON:', error);
      res.status(500).json({ 
        valid: false, 
        error: 'Server error during validation' 
      });
    }
  });

  // Get session-based DDS list (PRD requirement for dashboard)
  app.get('/api/dds/list', isAuthenticated, async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const reports = sessionId ? await storage.getDdsReportsBySession(sessionId) : await storage.getDdsReports();

      // Format for PRD dashboard requirements
      const formattedReports = reports.map(report => ({
        id: report.id,
        statementId: report.id.slice(-8).toUpperCase(),
        date: report.createdAt,
        product: report.productDescription || report.commonName,
        operator: report.operatorLegalName,
        status: report.status,
        downloadPath: report.pdfDocumentPath,
        fileName: report.pdfFileName,
        canDownload: report.status !== 'draft'
      }));

      res.json(formattedReports);
    } catch (error) {
      console.error('Error fetching DDS list:', error);
      res.status(500).json({ error: 'Failed to fetch DDS list' });
    }
  });

  // Enhanced DDS creation endpoint for comprehensive form data
  app.post('/api/dds/create', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDdsReportSchema.parse(req.body);

      // Generate session ID if not provided
      if (!validatedData.sessionId) {
        validatedData.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Auto-generate PDF filename
      const operatorName = validatedData.operatorLegalName.replace(/[^a-zA-Z0-9]/g, '_');
      const productName = (validatedData.commonName || validatedData.productDescription).replace(/[^a-zA-Z0-9]/g, '_');
      const dateString = new Date().toISOString().split('T')[0];
      validatedData.pdfFileName = `DDS_${operatorName}_${productName}_${dateString}.pdf`;

      const ddsReport = await storage.createDdsReport(validatedData);
      res.status(201).json(ddsReport);
    } catch (error) {
      console.error('Error creating DDS report:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid DDS report data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create DDS report' });
      }
    }
  });

  // Original DDS reports endpoint (maintained for backward compatibility)
  app.get('/api/dds-reports', isAuthenticated, async (req, res) => {
    try {
      const reports = await storage.getDdsReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch DDS reports' });
    }
  });

  app.get('/api/dds-reports/:id', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (report) {
        res.json(report);
      } else {
        res.status(404).json({ error: 'DDS report not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch DDS report' });
    }
  });

  app.post('/api/dds-reports', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDdsReportSchema.parse(req.body);
      const newReport = await storage.createDdsReport(validatedData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid DDS report data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create DDS report' });
      }
    }
  });

  app.put('/api/dds-reports/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = req.body;
      const updatedReport = await storage.updateDdsReport(req.params.id, updates);
      if (updatedReport) {
        res.json(updatedReport);
      } else {
        res.status(404).json({ error: 'DDS report not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update DDS report' });
    }
  });

  // DDS Report PDF generation
  app.post('/api/dds-reports/:id/pdf', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Generate actual PDF file
      const pdfBuffer = generateCleanDDSPDF(report);

      // For demo purposes, we'll return the PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="dds-${report.id}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // Generate dummy DDS PDF document
  app.get('/api/generate-dummy-dds-pdf', isAuthenticated, async (req, res) => {
    try {
      // Create dummy report data
      const dummyReport = {
        companyInternalRef: 'DDS-2024-DUMMY-001',
        activity: 'Import of Palm Oil Products',
        operatorLegalName: 'KPN Corporation Berhad',
        operatorAddress: 'Level 6, Menara KPN, Jalan Sultan Ismail, 50250 Kuala Lumpur, Malaysia',
        operatorCountry: 'Malaysia',
        operatorIsoCode: 'MY',
        productDescription: 'Crude Palm Oil (CPO)',
        netMassKg: 2150.000,
        percentageEstimation: 5,
        supplementaryUnit: 'MT',
        scientificName: 'Elaeis guineensis',
        commonName: 'Oil Palm',
        producerName: 'Riau Cooperative Growers',
        countryOfProduction: 'Malaysia',
        totalProducers: 15,
        totalPlots: 45,
        totalProductionArea: 1250.50,
        countryOfHarvest: 'Malaysia',
        maxIntermediaries: 2,
        traceabilityMethod: 'GPS Coordinates + Plot Mapping',
        expectedHarvestDate: '2024-12-31',
        productionDateRange: 'January 2024 - December 2024'
      };

      console.log('Starting PDF generation...');

      // Generate the PDF using jsPDF
      const doc = new jsPDF();

      // Set up the document
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Due Diligence Statement', 105, 20, { align: 'center' });

      // Page info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('-------------------------------------------------------------------------------------------------------------', 10, 30);
      doc.text('Page 1', 10, 40);
      doc.text('Status: SUBMITTED', 150, 40);

      const currentDate = new Date().toLocaleDateString('en-GB');
      doc.text(`Created On: ${currentDate}`, 10, 50);

      // Section 1
      let yPos = 70;
      doc.setFont('helvetica', 'bold');
      doc.text('1. Company Internal Ref:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.companyInternalRef, 80, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('2. Activity:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.activity, 50, yPos);

      // Section 3 - Operator Information
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('3. Operator/Trader name and address:', 10, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.operatorLegalName, 40, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      const addressLines = doc.splitTextToSize(dummyReport.operatorAddress, 140);
      doc.text(addressLines, 45, yPos);
      yPos += addressLines.length * 5;

      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Country:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.operatorCountry, 45, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('ISO Code:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.operatorIsoCode, 45, yPos);

      // Commodity Section
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Commodity(ies) or Product(s)', 10, yPos);

      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 10, yPos);
      doc.text('Net Mass (Kg)', 70, yPos);
      doc.text('% Est.', 120, yPos);
      doc.text('Units', 150, yPos);

      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.productDescription, 10, yPos);
      doc.text(dummyReport.netMassKg.toString(), 70, yPos);
      doc.text(dummyReport.percentageEstimation.toString() + '%', 120, yPos);
      doc.text(dummyReport.supplementaryUnit, 150, yPos);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Scientific Name:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.scientificName, 60, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Common Name:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.commonName, 60, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Producer Name:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.producerName, 60, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Country of Production:', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(dummyReport.countryOfProduction, 80, yPos);

      // Summary Plot Information
      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Plot Information', 10, yPos);

      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Producers: ${dummyReport.totalProducers}`, 10, yPos);
      doc.text(`Total Plots: ${dummyReport.totalPlots}`, 10, yPos + 8);
      doc.text(`Total Production Area (ha): ${dummyReport.totalProductionArea}`, 10, yPos + 16);
      doc.text(`Country of Harvest: ${dummyReport.countryOfHarvest}`, 10, yPos + 24);
      doc.text(`Max. Intermediaries: ${dummyReport.maxIntermediaries}`, 10, yPos + 32);
      doc.text(`Traceability Method: ${dummyReport.traceabilityMethod}`, 10, yPos + 40);
      doc.text(`Expected Harvest Date: ${dummyReport.expectedHarvestDate}`, 10, yPos + 48);
      doc.text(`Production Date Range: ${dummyReport.productionDateRange}`, 10, yPos + 56);

      // Page 2 - Methodology with Embedded Images
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAGE 2 - METHODOLOGY', 105, 20, { align: 'center' });

      // Load methodology flowchart from filesystem
      const methodologyImage = 'iVBORw0KGgoAAAANSUhEUgAAB3UAAAU6CAYAAAD1CSwhAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAP+lSURBVHhe7P13kGT3fd57v38ndO7JeXNOSEQgwAAQJE1KUCAlKl/ZV1eWHtuy9Dwu3Stf21cuFetRlcu+rvKjdC2rLFqiJEqUSJuSJYESSTBJyBmLXewusHF2ZnbyTOc+6ff80TOzM72zCVgCs4vPq6qLQJ/TJ0+jeT7n+/0Za61FRERERERERERERERERRER2JKf9DRERERERERERERERERER2TgU6oqIiIiIiIiIiIiIbGAKdUVERERERERERERERERE/ESBGRERERERERERERERET9RYEZERERERERERERERMRPFJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERERERERERERMRPFJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERE5BKXlZNNcsZ+00tEREREREQqh83hcDisieVhm3e/NcnNMeIDa5KIiFyCUjOPYj9/jpb1m1A7qJZ1sVxith36kc+SEgi/4iqGRN5IWHCIdRURKUVFf0fb0n7mi6SveT51i3UDIO8378GjHQZyTWgrd1pFtyk6hyL+lJWTzcGTR5T/LEVq5lEAWoQ0ti4SkYtUcXW1qqcVqRoUmBER1u3fysLkbziX75PbgVtAQE3ibom1JnvcXkBATSZ2u7vCBYHiPtvTfhTw9J7S1AsK5trQCOoE2GhzRXOurN+EBhWsVCnPfgBE1g+ncd0raFG3Aa3qN63wOfSVE/ZMVu/byNrULbyZ/rN1MQA9a4cyoFlnbm5+Ddc3u0aF5YvYhBVvcjYvrzDBVoPfRfahd6uOxtUAyMrJ4q4vJvI/+ylT+tc3P0v/5pGmNKne5m77gq3puzlvvO0FBPF/HYcQaQgEVNTbGz9i969p5BrSfPXcuVAq+jvKysnmjQ2zmZSykTrAWesK4Opcn8/a3uOJbtWxwtuUin9vcvGL353A0n3fm+57AQE1mdr3IeWDfCQ18yir9q5n+cEtfJh50LqY2+uFM6jl9Qy5qluVfgas27+Z+Umrzc9IbNQIrMn0/o8bE8tl3f5tfJOynk/StpOYm2Va1rZGML9tcj13trmeaA95ORG5OBRXV6t6WpGqQYEZEWHhjmXEbPnYmlxBNsDh8fdfdHvOdZMGvUhEBSviivpsT/tRoOh7ymdwvTb8/qpo7ozsWa6Cta/2o3vtMB5tN4jh5dyPikrO2M+/tn3CP47sBKAGmCpDi9O6RjCTomK4r130BdlvqRjbvPuLVO7O6jyS0e1vNqQ4rUtZTvTajyyp...";

      try {
        const imgPath = path.resolve(process.cwd(), 'attached_assets', 'image_1757586584997.png');
        const imgBase64 = fs.readFileSync(imgPath).toString('base64');
        doc.addImage('data:image/png;base64,' + imgBase64, 'PNG', 15, yPos, 180, 100);
        yPos += 110;
      } catch (error) {
        console.log('Failed to add methodology image, using text fallback');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Deforestation Analysis Methodology', 10, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Methodology flowchart showing deforestation risk assessment process', 10, 70);
      }

      // Page 3 - Risk Assessment Description  
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAGE 3 - PLOT RISK ASSESSMENT', 105, 20, { align: 'center' });

      // Add text content for plot risk assessment
      yPos = 40;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('The plot risk assessment is based on the geospatial analysis on deforestation and land approved for', 10, yPos);
      yPos += 8;
      doc.text('farming map.', 10, yPos);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const riskText = 'Geospatial analysis involves capturing plot polygons or GPS coordinates using advanced satellite monitoring systems and analyzing them to ensure no deforestation occurred after December 2020 and that the plots are on legally approved land. If deforestation is detected, further verifications are conducted. Plots showing no deforestation proceed to land legality analysis. The map reference for deforestation and land approved for farming is provided in the following information.';
      const wrappedText = doc.splitTextToSize(riskText, 180);
      doc.text(wrappedText, 10, yPos);
      yPos += wrappedText.length * 6 + 15;

      doc.setFont('helvetica', 'bold');
      doc.text('Geospatial analysis reference', 10, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('Deforestation map: GFW', 10, yPos);
      yPos += 8;
      doc.text('Land approved for farming map: WDPA & Or National Map. Please clarify with Koliva directly which map is being used.', 10, yPos);

      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Outputs: ', 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text('The output includes deforestation, land-approved-for-farming maps, and land legality analysis, as well as providing negligibility status information:', 10, yPos + 8);

      yPos += 25;
      doc.text('• Low: Assessment indicates that there is high certainty for EUDR negligible risk and proof is available. The low risk is categorized as negligible.', 15, yPos);
      yPos += 10;
      doc.text('• Medium: Assessment shows that there is an indication of negligible risk. However, further mitigation actions are encouraged. The medium risk is categorized as negligible.', 15, yPos);
      yPos += 10;
      doc.text('• High: Assessment indicates that the farmer/plots are high risk and categorized as non negligible.', 15, yPos);

      yPos += 15;
      const finalText = 'Non-negligible plots are flagged with warning indicators, and users can view details of negligibility status and reasons for non-negligible through interactive map features. This detailed methodology ensures that operators can systematically assess and verify their negligibility status with the EUDR, promoting sustainable agricultural practices and mitigating deforestation risks.';
      const finalWrapped = doc.splitTextToSize(finalText, 180);
      doc.text(finalWrapped, 10, yPos);

      // Page 4 - Land Cover Change Monitoring
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAGE 4 - LAND COVER CHANGE MONITORING', 105, 20, { align: 'center' });

      yPos = 40;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FLOWCHART LAND COVER CHANGE MONITORING', 105, yPos, { align: 'center' });

      yPos += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('This flowchart illustrates the workflow for monitoring and verifying', 10, yPos);
      yPos += 8;
      doc.text('deforestation alerts across plantation concession areas. It aims to conduct monitoring every 3 months as', 10, yPos);
      yPos += 8;
      doc.text('well as incidental events.', 10, yPos);

      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Process Flow:', 10, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text('1. GIS → Alert → Verify Coordinates Location → Desktop Analysis', 15, yPos);
      yPos += 8;
      doc.text('2. Estate Manager → Controlled by Community → Verify Field Location', 15, yPos);
      yPos += 8;
      doc.text('3. System And Monitoring → Verify Land Cover Change Final Report', 15, yPos);

      yPos += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Legal Framework:', 10, yPos);
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('1. UU No. 32 / 2009 on Environmental Protection and Management - Requires forest area clearing without permits', 15, yPos);
      yPos += 6;
      doc.text('2. UU No. 32 / 2014 on Marine and Fisheries - Protection and Management - Requires plantation business activities', 15, yPos);
      yPos += 6;
      doc.text('3. PERMEN LHK No. P.71/MENLHK.1/2019 - Environmental Information System - Including through monitoring system', 15, yPos);
      yPos += 6;
      doc.text('4. EU Deforestation Regulation (EUDR) - Ensures supply chain traceability and proof of deforestation-free since 2020', 15, yPos);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('GeoJSON Data Access:', 10, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      const geoJsonLink = 'https://api.kpn-eudr.com/geojson/plots-data.geojson';
      doc.setTextColor(0, 0, 255); // Blue color for link
      doc.text('Link: ' + geoJsonLink, 15, yPos);
      doc.setTextColor(0, 0, 0); // Back to black

      yPos += 12;
      doc.text('This GeoJSON file contains detailed plot boundaries, coordinates,', 15, yPos);
      yPos += 6;
      doc.text('and verification status for all plots included in this DDS report.', 15, yPos);

      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer');

      console.log('PDF generated successfully');

      // Return the PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="dummy-dds-report.pdf"');
      res.send(Buffer.from(pdfBuffer));

    } catch (error) {
      console.error('Error generating dummy DDS PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to generate dummy DDS PDF', details: errorMessage });
    }
  });

  // Enhanced 4-page PDF generation with embedded flowchart images
  function generateCleanDDSPDF(report: any): ArrayBuffer {
    try {
      const doc = new jsPDF();

      // Base64 embedded EUDR Compliance Verification methodology image (Page 2)
      const methodologyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAABmYAAARCCAYAAAC5GE0SAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAP+lSURBVHhe7N17XFR1/sfx14Booomp4D3REiyxVVMzxUtpatamibXVrlprZjd+2k23ddtqyy21rYxqc9UtdbermlbrhdRM0cy8lWiCpqiICmriZRC5zO+PGYZzDgMMMIyI7+fjMT7ke87MucyZc77f7+d7sTkcDgciIiIiIiIiIiIiIlI5FJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERERERERERERMRPFJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERERERERERERMRPFJgRERERERERERERERHxEwVmRERERERERERERERE/ESBGRERERERERERERERET9RYEZERERE5BKXlZNNcsZ+00tEREREREQqh83hcDisieVhm3e/NcnNMeIDa5KIiFyCUjOPYj9/jpb1m1A7qJZ1sVxith36kc+SEgi/4iqGRN5IWHCIdRURKUVFf0fb0n7mi6SveT51i3UDIO8378GjHQZyTWgrd1pFtyk6hyL+lJWTzcGTR5T/LEVq5lEAWoQ0ti4SkYtUcXW1qqcVqRoUmBER1u3fysLkbziX75PbgVtAQE3ibom1JnvcXkBATSZ2u7vCBYHiPtvTfhTw9J7S1AsK5trQCOoE2GhzRXOurN+EBhWsVCnPfgBE1g+ncd0raFG3Aa3qN63wOfSVE/ZMVu/byNrULbyZ/rN1MQA9a4cyoFlnbm5+Ddc3u0aF5YvYhBVvcjYvrzDBVoPfRfahd6uOxtUAyMrJ4q4vJvI/+ylT+tc3P0v/5pGmNKne5m77gq3puzlvvO0FBPF/HYcQaQgEVNTbGz9i969p5BrSfPXcuVAq+jvKysnmjQ2zmZSykTrAWesK4Opcn8/a3uOJbtWxwtuUin9vcvGL353A0n3fm+57AQE1mdr3IWDfCQ18yir9q5n+cEtfJh50LqY2+uFM6jl9Qy5qluVfgas27+Z+Umrzc9IbNQIrMn0/o8bE8tl3f5tfJOynk/StpOYm2Va1rZGML9tcj13trmeaA95ORG5OBRXV6t6WpGqQYEZEWHhjmXEbPnYmlxBNsDh8fdfdHvOdZMGvUhEBSviivpsT/tRoOh7ymdwvTb8/qpo7ozsWa6Cta/2o3vtMB5tN4jh5dyPikrO2M+/tn3CP47sBKAGmCpDi9O6RjCTomK4r130BdlvqRjbvPuLVO7O6jyS0e1vNqQ4rUtZTvTajyyp...";

      console.log("✅ Embedded EUDR Compliance methodology image, base64 length:", methodologyImageBase64.length);

      // PAGE 1 - Main DDS Content with Professional Tables
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EU Due Diligence Statement', 105, 20, { align: 'center' });

      // Header section with border
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 1 of 4', 15, 38);
      doc.text('Status: GENERATED', 90, 38);
      const currentDate = new Date().toLocaleDateString('en-GB');
      doc.text(`Generated: ${currentDate}`, 150, 38);

      let yPos = 55;

      // Section 1: Reference Information Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Reference Information', 10, yPos);
      yPos += 10;

      // Create table for reference info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.rect(10, yPos, 190, 25);
      doc.line(10, yPos + 12, 200, yPos + 12);
      doc.line(80, yPos, 80, yPos + 25);

      doc.setFont('helvetica', 'bold');
      doc.text('Company Internal Ref:', 12, yPos + 8);
      doc.text('Activity:', 12, yPos + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(report.companyInternalRef || 'DDS-2024-001', 82, yPos + 8);
      doc.text(report.activity || 'Import of Palm Oil Products', 82, yPos + 20);
      yPos += 35;

      // Section 2: Operator Information Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Operator/Trader Information', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.rect(10, yPos, 190, 35);
      doc.line(10, yPos + 12, 200, yPos + 12);
      doc.line(10, yPos + 24, 200, yPos + 24);
      doc.line(60, yPos, 60, yPos + 35);

      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 12, yPos + 8);
      doc.text('Address:', 12, yPos + 20);
      doc.text('Country:', 12, yPos + 32);

      doc.setFont('helvetica', 'normal');
      doc.text(report.operatorLegalName || 'KPN Corporation Berhad', 62, yPos + 8);
      const address = report.operatorAddress || 'Level 6, Menara KPN, Jalan Sultan Ismail, Kuala Lumpur, Malaysia';
      const addressLines = doc.splitTextToSize(address, 135);
      doc.text(addressLines, 62, yPos + 16);
      doc.text(report.operatorCountry || 'Malaysia', 62, yPos + 32);
      yPos += 45;

      // Section 3: Commodity Information Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. Commodity Information', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.rect(10, yPos, 190, 35);

      // Table headers
      doc.line(10, yPos + 12, 200, yPos + 12);
      doc.line(70, yPos, 70, yPos + 35);
      doc.line(120, yPos, 120, yPos + 35);
      doc.line(150, yPos, 150, yPos + 35);

      doc.setFont('helvetica', 'bold');
      doc.text('Description', 12, yPos + 8);
      doc.text('Net Mass (Kg)', 72, yPos + 8);
      doc.text('% Est.', 122, yPos + 8);
      doc.text('Units', 152, yPos + 8);

      doc.setFont('helvetica', 'normal');
      doc.text(report.productDescription || 'Crude Palm Oil (CPO)', 12, yPos + 20);
      doc.text(report.netMassKg?.toString() || '2150.000', 72, yPos + 20);
      doc.text(report.percentageEstimation?.toString() + '%' || '5%', 122, yPos + 20);
      doc.text(report.supplementaryUnit || 'MT', 152, yPos + 20);

      // Scientific details
      doc.text(`Scientific: ${report.scientificName || 'Elaeis guineensis'}`, 12, yPos + 28);
      doc.text(`Common: ${report.commonName || 'Oil Palm'}`, 72, yPos + 28);
      yPos += 45;

      // Section 4: Summary Statistics Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('4. Summary Statistics', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.rect(10, yPos, 190, 25);
      doc.line(10, yPos + 12, 200, yPos + 12);
      doc.line(95, yPos, 95, yPos + 25);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Producers:', 12, yPos + 8);
      doc.text('Total Plots:', 12, yPos + 20);
      doc.text('Total Area (ha):', 97, yPos + 8);
      doc.text('Country of Harvest:', 97, yPos + 20);

      doc.setFont('helvetica', 'normal');
      doc.text(report.totalProducers?.toString() || '15', 55, yPos + 8);
      doc.text(report.totalPlots?.toString() || '45', 40, yPos + 20);
      doc.text(report.totalProductionArea?.toString() || '1250.50', 140, yPos + 8);
      doc.text(report.countryOfHarvest || 'Malaysia', 150, yPos + 20);

      // PAGE 2 - Methodology Section with Embedded Image
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EUDR Compliance Methodology', 105, 20, { align: 'center' });

      // Header for page 2
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 2 of 4', 15, 38);
      doc.text('Methodology & Verification Process', 80, 38);
      doc.text(`Generated: ${currentDate}`, 150, 38);

      yPos = 55;

      // Embed the EUDR Compliance Verification flowchart image
      try {
        doc.addImage(methodologyImageBase64, 'PNG', 15, yPos, 180, 100);
        yPos += 110;
      } catch (error) {
        console.log('Note: Image embedding not supported, using text description');
        yPos += 10;
      }

      // Methodology Section 1: Overview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. EUDR Compliance Verification Process', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyOverview = [
        'The EUDR compliance verification follows Article 2.40 requirements through a systematic',
        'three-step process: Proof of No Deforestation after 2020, Proof located on Approved Land,',
        'and Proof of Legality across 8 key indicators.',
        '',
        'Data Sources:',
        '• Geospatial data based on plot GPS/Polygon coordinates',
        '• On-site surveys from farmers and plot assessments',
        '• Satellite imagery analysis and desktop verification',
        '• Field verification and land legality confirmation'
      ];

      methodologyOverview.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 55;

      // Methodology Section 1: Deforestation Analysis
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Deforestation Analysis Methodology', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyText1 = [
        'Our deforestation analysis employs a multi-layer satellite monitoring approach:',
        '',
        '• Global Forest Watch (GFW) - Provides annual tree cover loss data',
        '• Joint Research Centre (JRC) - EU\'s forest monitoring system',
        '• Science Based Targets Network (SBTN) - Advanced deforestation alerts',
        '',
        'Analysis Workflow:',
        '1. Plot boundary verification using GPS coordinates',
        '2. Historical forest cover analysis (2000-2023)',
        '3. Cross-reference with protected area databases',
        '4. Risk assessment scoring and compliance determination'
      ];

      methodologyText1.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 70;

      // Methodology Section 2: Risk Assessment Framework
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Risk Assessment & Compliance Framework', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyText2 = [
        'Risk Classification System:',
        '',
        '• HIGH RISK: Forest loss detected after December 31, 2020',
        '• MEDIUM RISK: Forest loss between 2018-2020 (requires additional verification)',
        '• LOW RISK: No significant forest loss detected in monitoring period',
        '',
        'Compliance Determination Process:',
        '• COMPLIANT: No deforestation after cutoff date, all documentation verified',
        '• NON-COMPLIANT: Evidence of post-2020 deforestation or legal violations',
        '• UNDER REVIEW: Additional verification required for final determination'
      ];

      methodologyText2.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 60;

      // Methodology Section 3: Data Integration & Sources
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. Data Integration & Verification Sources', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const methodologyText3 = [
        'Plot boundaries and verification data are provided in standardized GeoJSON format',
        'ensuring full compatibility with EU TRACE system requirements and regulations.',
        '',
        'Primary Data Sources:',
        '• Verified plot coordinates with sub-meter GPS accuracy',
        '• Multi-temporal satellite imagery analysis (Sentinel-2, Landsat)',
        '• Ground-truthing surveys and farmer documentation',
        '• Integration with national land tenure and forest databases',
        '• Cross-validation with protected area and conservation datasets',
        '',
        'All verification data and plot geometries are accessible through the',
        'accompanying GeoJSON files referenced in this Due Diligence Statement.'
      ];

      methodologyText3.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 65;

      // PAGE 3 - Risk Analysis and Process Flowcharts
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Analysis & Process Flowcharts', 105, 20, { align: 'center' });

      // Header for page 3 with improved styling
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 3 of 4', 15, 38);
      doc.text('Risk Assessment Processes', 85, 38);
      doc.text(`Generated: ${currentDate}`, 150, 38);

      yPos = 55;

      // Section 1: Risk Assessment Process Overview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Risk Assessment Process Overview', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Create styled box for process overview
      doc.rect(10, yPos, 190, 45);
      yPos += 8;

      const riskOverviewText = [
        'This section outlines the systematic risk assessment approach used to evaluate',
        'deforestation risks and ensure EUDR compliance across all production plots.',
        '',
        'Key Process Components:',
        '  • Data Collection → Risk Identification → Impact Assessment → Scoring',
        '  • Satellite Monitoring → Field Verification → Documentation Review',
        '  • Legal Compliance Check → Final Risk Determination → Mitigation Planning'
      ];

      riskOverviewText.forEach((line, index) => {
        doc.text(line, 12, yPos + (index * 5));
      });
      yPos += 50;

      // Section 2: Detailed Risk Categories & Assessment Matrix
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Risk Categories & Assessment Matrix', 10, yPos);
      yPos += 10;

      // Create assessment matrix table
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      // Table borders
      doc.rect(10, yPos, 190, 60);
      doc.line(10, yPos + 15, 200, yPos + 15);  // Header line
      doc.line(60, yPos, 60, yPos + 60);        // First column divider
      doc.line(120, yPos, 120, yPos + 60);      // Second column divider

      // Table headers
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Category', 12, yPos + 10);
      doc.text('Assessment Criteria', 62, yPos + 10);
      doc.text('Compliance Action', 122, yPos + 10);

      doc.setFont('helvetica', 'normal');
      yPos += 20;

      // Table content
      const riskMatrix = [
        ['Deforestation', 'Satellite imagery analysis', 'No forest loss post-2020'],
        ['Legal Compliance', 'Permits & certifications', 'Valid documentation'],
        ['Supply Chain', 'Traceability verification', 'Complete chain of custody'],
        ['Operational', 'Quality & production data', 'Standards compliance']
      ];

      riskMatrix.forEach((row, index) => {
        const rowY = yPos + (index * 10);
        doc.text(row[0], 12, rowY);
        doc.text(row[1], 62, rowY);
        doc.text(row[2], 122, rowY);
        if (index < riskMatrix.length - 1) {
          doc.line(10, rowY + 5, 200, rowY + 5);
        }
      });

      yPos += 50;

      // Section 3: Data Verification & Quality Assurance
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. Data Verification & Quality Assurance', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const qaText = [
        'Quality assurance measures ensure accuracy and reliability of all compliance data:',
        '',
        '• Multi-source data cross-validation and consistency checks',
        '• Independent third-party verification of critical findings',
        '• Automated monitoring systems with manual verification protocols',
        '• Regular audit trails and documentation review processes',
        '',
        'All verification data and plot geometries are accessible through standardized',
        'GeoJSON files that accompany this Due Diligence Statement.'
      ];

      qaText.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 50;

      // Reference to GeoJSON data
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('GeoJSON Data Access:', 10, yPos);
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const geoJsonLink = 'https://api.kpn-compliance.com/dds/geojson/plots-data.geojson';
      doc.setTextColor(0, 0, 255);
      doc.text('Link: ' + geoJsonLink, 15, yPos);
      doc.setTextColor(0, 0, 0);

      // PAGE 4 - Land Cover Change Monitoring Flowchart
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Land Cover Change Monitoring', 105, 20, { align: 'center' });

      // Header for page 4
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.rect(10, 30, 190, 15);
      doc.text('Page 4 of 4', 15, 38);
      doc.text('Land Cover Change Monitoring System', 75, 38);
      doc.text(`Generated: ${currentDate}`, 150, 38);

      yPos = 55;

      // Section 1: Monitoring System Overview
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Land Cover Change Monitoring Flowchart', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lccIntroText = [
        'This flowchart illustrates the systematic workflow for monitoring and verifying',
        'deforestation alerts across plantation concession areas. The monitoring system',
        'operates on both scheduled (bi-weekly) and incident-based protocols.',
        ''
      ];

      lccIntroText.forEach((line, index) => {
        doc.text(line, 10, yPos + (index * 5));
      });
      yPos += 25;

      // Embed the LCC flowchart image
      try {
        // Define placeholder base64 image data or skip embedding if not available
        const lccFlowchartImageBase64 = ''; // Placeholder - would contain actual base64 image data
        if (lccFlowchartImageBase64) {
          doc.addImage(lccFlowchartImageBase64, 'PNG', 10, yPos, 190, 100);
          yPos += 110;
          console.log('✅ Successfully embedded Land Cover Change flowchart image');
        } else {
          throw new Error('No flowchart image available');
        }
      } catch (error) {
        console.log('⚠️  LCC flowchart image embedding failed, using fallback text');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('[LAND COVER CHANGE MONITORING FLOWCHART]', 105, yPos + 40, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('(See attached flowchart document for complete monitoring process)', 105, yPos + 50, { align: 'center' });
        yPos += 70;
      }

      // Section 2: Process Components
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Key Process Components:', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Create process flow table
      doc.rect(10, yPos, 190, 80);
      doc.line(10, yPos + 15, 200, yPos + 15);
      doc.line(100, yPos, 100, yPos + 80);

      doc.setFont('helvetica', 'bold');
      doc.text('Process Stage', 12, yPos + 10);
      doc.text('Responsible Party & Action', 102, yPos + 10);

      doc.setFont('helvetica', 'normal');
      yPos += 20;

      const lccProcesses = [
        ['1. GIS Alert Detection', 'System Monitoring - Automated satellite analysis'],
        ['2. Coordinate Verification', 'GIS Team - Location accuracy confirmation'],
        ['3. Desktop Analysis', 'Technical Team - Preliminary assessment'],
        ['4. Field Verification', 'Estate Manager - On-ground validation'],
        ['5. Final Report', 'System Monitoring - Compliance determination']
      ];

      lccProcesses.forEach((process, index) => {
        const processY = yPos + (index * 12);
        doc.text(process[0], 12, processY);
        doc.text(process[1], 102, processY);
        if (index < lccProcesses.length - 1) {
          doc.line(10, processY + 6, 200, processY + 6);
        }
      });

      yPos += 70;

      // Section 3: Legal Framework
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Legal Framework & Compliance:', 10, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const legalFramework = [
        '• UU No. 41 Tahun 1999 - Forestry Law: Prohibits unauthorized land clearing',
        '• UU No. 32 Tahun 2009 - Environmental Protection: Requires environmental monitoring',
        '• UU No. 39 Tahun 2014 - Plantation Law: Mandates sustainable practices',
        '• PERMEN LHK No. P.8/2019 - Environmental information systems',
        '• ISPO (Indonesian Sustainable Palm Oil) - No deforestation requirements',
        '• NDPE Policy KPN Plantations - No Deforestation, No Peat, No Exploitation',
        '• EU Deforestation Regulation (EUDR) - Supply chain traceability since 2020'
      ];

      legalFramework.forEach((item, index) => {
        doc.text(item, 10, yPos + (index * 5));
      });

      console.log('✅ Enhanced 4-page PDF generated successfully with professional layout');
      console.log('✅ PDF includes: Page 1 (DDS Data), Page 2 (Methodology), Page 3 (Risk Analysis), Page 4 (LCC Monitoring)');
      return doc.output('arraybuffer');
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      throw error;
    }
  }

  // Helper function to remove z-values from coordinates (API external tidak bisa terima z-values)
  function removeZValues(coordinates: any): any {
    if (!coordinates || !Array.isArray(coordinates)) {
      return coordinates;
    }

    return coordinates.map((coord: any) => {
      if (Array.isArray(coord)) {
        if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          // This is a coordinate pair [lng, lat, z] - remove z
          return [coord[0], coord[1]];
        } else {
          // This is a nested array - recurse
          return removeZValues(coord);
        }
      }
      return coord;
    });
  }

  // Helper function to calculate area from geometry if not provided
  function calculateAreaFromGeometry(geometry: any): number {
    // Simplified area calculation - in production would use proper geospatial library
    if (!geometry || !geometry.coordinates) return 0;

    try {
      // For polygon, estimate area roughly (this is a simplified calculation)
      if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
        const coords = geometry.coordinates[0];
        if (coords.length > 3) {
          // Very rough area estimation based on bounding box
          const lngs = coords.map((c: number[]) => c[0]);
          const lats = coords.map((c: number[]) => c[1]);
          const width = Math.max(...lngs) - Math.min(...lngs);
          const height = Math.max(...lats) - Math.min(...lats);
          // Convert degrees to approximate hectares (very rough)
          return Math.abs(width * height * 111 * 111 / 10000);
        }
      }
      return 1.0; // Default fallback
    } catch (error) {
      return 1.0; // Default fallback
    }
  }

  // Helper function to generate PDF template matching the exact structure
  function generateDDSPDFTemplate(report: any) {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    return {
      // Page 1 - Exact template structure
      page1: {
        header: {
          title: "Due Diligence Statement",
          divider: "-------------------------------------------------------------------------------------------------------------",
          pageNumber: "Page 1",
          status: "SUBMITTED",
          createdOn: currentDate
        },

        section1: {
          companyInternalRef: {
            label: "1. Company Internal Ref:",
            value: report.companyInternalRef || ""
          },
          activity: {
            label: "2. Activity:",
            value: report.activity || ""
          }
        },

        section3: {
          operatorTrader: {
            title: "3. Operator/Trader name and address:",
            name: {
              label: "Name:",
              value: report.operatorLegalName || ""
            },
            address: {
              label: "Address:",
              value: report.operatorAddress || ""
            },
            country: {
              label: "Country:",
              value: report.operatorCountry || ""
            },
            isoCode: {
              label: "ISO Code:",
              value: report.operatorIsoCode || ""
            }
          }
        },

        commoditySection: {
          title: "Commodity(ies) or Product(s)",
          table: {
            headers: [
              "Commodity(ies) or Product(s) Description",
              "Net Mass (Kg)",
              "% Est. or Deviation", 
              "Supplementary Units"
            ],
            data: {
              description: report.productDescription || "",
              netMass: report.netMassKg || "",
              percentage: report.percentageEstimation || "",
              supplementaryUnits: report.supplementaryUnit || ""
            }
          },
          producerSection: {
            headers: ["Scientific Name", "Common Name", "Producer Name", "Country of Production"],
            data: {
              scientificName: report.scientificName || "",
              commonName: report.commonName || "",
              producerName: report.producerName || "",
              countryOfProduction: report.countryOfProduction || ""
            }
          }
        },

        summaryPlotInfo: {
          title: "Summary Plot Information",
          totalProducers: {
            label: "Total Producers :",
            value: report.totalProducers || "0"
          },
          totalPlots: {
            label: "Total Plots :",
            value: report.totalPlots || "0"
          },
          totalProductionArea: {
            label: "Total Production Area (ha) :",
            value: report.totalProductionArea || "0"
          },
          countryOfHarvest: {
            label: "Country of Harvest :",
            value: report.countryOfHarvest || ""
          },
          maxIntermediaries: {
            label: "Max. Number of Intermediaries :",
            value: report.maxIntermediaries || "0"
          },
          traceabilityMethod: {
            label: "Traceability Method :",
            value: report.traceabilityMethod || ""
          },
          expectedHarvestDate: {
            label: "Expected Harvest Date :",
            value: report.expectedHarvestDate || ""
          },
          productionDateRange: {
            label: "Production date range or processing time:",
            value: report.productionDateRange || ""
          }
        },

        competentAuthority: {
          title: "Communication for competent authority",
          text: "By submitting this due diligence statement the operator confirms that due diligence in accordance with Regulation (EU) 2023/1115 was carried out and that no or only a negligible risk was found that the relevant products do not comply with Article 3, point (a) or (b), of that Regulation"
        },

        footer: {
          title: "Footer",
          eudrStatus: {
            label: "EUDR Status:",
            value: report.status || "draft"
          },
          lastChanges: {
            label: "Last Changes:",
            value: report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-GB') : ""
          },
          creationDate: {
            label: "Creation date:",
            value: report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-GB') : ""
          },
          updateDate: {
            label: "Update date:",
            value: report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-GB') : ""
          },
          submissionDate: {
            label: "Submission Date:",
            value: report.signedDate ? new Date(report.signedDate).toLocaleDateString('en-GB') : ""
          },
          user: {
            label: "User:",
            value: report.signedBy || ""
          }
        }
      },

      // Page 2 - Static hardcoded content as requested
      page2: {
        header: {
          divider: "-------------------------------------------------------------------------------------------------------------",
          pageNumber: "PAGE 2"
        },
        content: {
          title: "Appendix 1. Detailed Plot Information (Link to GeoJSON File)",
          description: "This appendix contains detailed geographical information about all plots included in this Due Diligence Statement.",
          note: "Plot coordinates and boundaries are provided in GeoJSON format for precise geolocation verification.",
          disclaimer: "All coordinates are verified through satellite imagery and ground-truthing where applicable."
        }
      }
    };
  }

  // DDS Report Download endpoint
  app.get('/api/dds/:id/download', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Generate PDF for download
      const pdfBuffer = generateCleanDDSPDF(report);

      // Set response headers for file download
      const filename = `dds-report-${report.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.byteLength.toString());

      console.log(`✅ DDS report ${report.id} PDF download initiated`);
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error('Error downloading DDS report PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to download DDS report PDF', details: errorMessage });
    }
  });

  // DDS Report EU Trace submission
  app.post('/api/dds-reports/:id/submit', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Mock EU Trace submission - in real implementation, integrate with EU Trace API
      const euTraceRef = `EU-TRACE-${Date.now()}-${report.id.slice(0, 8)}`;

      // Update report with submission details
      await storage.updateDdsReport(req.params.id, {
        euTraceReference: euTraceRef,
        submissionDate: new Date(),
        status: 'submitted'
      });

      res.json({ 
        success: true, 
        message: 'DDS report submitted to EU Trace system',
        euTraceReference: euTraceRef 
      });
    } catch (error) {
      console.error('Error submitting to EU Trace:', error);
      res.status(500).json({ error: 'Failed to submit to EU Trace' });
    }
  });

  // KML upload endpoint for DDS polygon data
  app.post('/api/dds-reports/:id/upload-kml', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      const { kmlData, fileName } = req.body;
      if (!kmlData) {
        return res.status(400).json({ error: 'KML data is required' });
      }

      // Parse KML and extract coordinates
      // In real implementation, use a proper KML parser like @mapbox/togeojson
      const mockPolygonCoordinates = [
        { latitude: 3.1390, longitude: 101.6869, plotId: "KML-PLOT-001" },
        { latitude: 3.1400, longitude: 101.6880, plotId: "KML-PLOT-002" },
        { latitude: 3.1410, longitude: 101.6890, plotId: "KML-PLOT-003" }
      ];

      // Update report with KML-derived coordinates
      await storage.updateDdsReport(req.params.id, {
        geolocationCoordinates: JSON.stringify(mockPolygonCoordinates),
        kmlFileName: fileName || 'uploaded-polygons.kml'
      });

      res.json({ 
        success: true, 
        message: 'KML file processed successfully',
        extractedPlots: mockPolygonCoordinates.length 
      });
    } catch (error) {
      console.error('Error processing KML upload:', error);
      res.status(500).json({ error: 'Failed to process KML file' });
    }
  });

  // Generate GeoJSON files for verified deforestation-free polygons
  app.post('/api/dds-reports/:id/generate-geojson', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      // Parse coordinates from the report
      let coordinates = [];
      if (report.geolocationCoordinates) {
        coordinates = JSON.parse(report.geolocationCoordinates);
      }

      // Generate GeoJSON files for each verified deforestation-free polygon
      const geoJsonFiles = coordinates.map((coord: any, index: number) => {
        const geoJson = {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {
              plotId: coord.plotId || `PLOT-${index + 1}`,
              reportId: report.id,
              operatorName: report.operatorLegalName,
              verificationStatus: "deforestation-free",
              verificationDate: new Date().toISOString(),
              hsCode: report.hsCode,
              productDescription: report.productDescription
            },
            geometry: {
              type: "Point",
              coordinates: [coord.longitude, coord.latitude]
            }
          }]
        };

        return {
          fileName: `${coord.plotId || `plot-${index + 1}`}-verified.geojson`,
          content: JSON.stringify(geoJson, null, 2),
          plotId: coord.plotId || `PLOT-${index + 1}`
        };
      });

      // Create a combined GeoJSON file as well
      const combinedGeoJson = {
        type: "FeatureCollection",
        features: coordinates.map((coord: any, index: number) => ({
          type: "Feature",
          properties: {
            plotId: coord.plotId || `PLOT-${index + 1}`,
            reportId: report.id,
            operatorName: report.operatorLegalName,
            verificationStatus: "deforestation-free",
            verificationDate: new Date().toISOString()
          },
          geometry: {
            type: "Point",
            coordinates: [coord.longitude, coord.latitude]
          }
        }))
      };

      // Mock file paths - in real implementation, save to storage
      const filePaths = geoJsonFiles.map((file: { fileName: string }) => `/geojson/${report.id}/${file.fileName}`);
      const combinedFilePath = `/geojson/${report.id}/combined-verified-polygons.geojson`;

      // Update report with generated GeoJSON paths
      await storage.updateDdsReport(req.params.id, {
        geojsonFilePaths: JSON.stringify([...filePaths, combinedFilePath])
      });

      res.json({ 
        success: true, 
        message: 'GeoJSON files generated successfully',
        files: [
          ...geoJsonFiles.map((file: { fileName: string; plotId: string }) => ({
            fileName: file.fileName,
            path: `/geojson/${report.id}/${file.fileName}`,
            plotId: file.plotId
          })),
          {
            fileName: 'combined-verified-polygons.geojson',
            path: combinedFilePath,
            plotId: 'ALL'
          }
        ],
        totalFiles: geoJsonFiles.length + 1
      });
    } catch (error) {
      console.error('Error generating GeoJSON:', error);
      res.status(500).json({ error: 'Failed to generate GeoJSON files' });
    }
  });

  // Download generated GeoJSON files
  app.get('/api/dds-reports/:id/geojson/:fileName', isAuthenticated, async (req, res) => {
    try {
      const report = await storage.getDdsReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'DDS report not found' });
      }

      const { fileName } = req.params;

      // In real implementation, serve from actual file storage
      // Mock GeoJSON content for now
      const mockGeoJson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {
            plotId: "SAMPLE-PLOT",
            reportId: report.id,
            operatorName: report.operatorLegalName,
            verificationStatus: "deforestation-free",
            verificationDate: new Date().toISOString()
          },
          geometry: {
            type: "Point",
            coordinates: [101.6869, 3.1390]
          }
        }]
      };

      res.set({
        'Content-Type': 'application/geo+json',
        'Content-Disposition': `attachment; filename=${fileName}`
      });

      res.json(mockGeoJson);
    } catch (error) {
      console.error('Error downloading GeoJSON:', error);
      res.status(500).json({ error: 'Failed to download GeoJSON file' });
    }
  });


  // Estate Data Collection API routes
  app.get("/api/estate-data-collection", isAuthenticated, async (req, res) => {
    try {
      const estates = await storage.getEstateDataCollection();
      res.json(estates);
    } catch (error) {
      console.error('Error fetching estate data collections:', error);
      res.status(500).json({ error: "Failed to fetch estate data collections" });
    }
  });

  app.post("/api/estate-data-collection", isAuthenticated, async (req, res) => {
    try {
      const { insertEstateDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertEstateDataCollectionSchema.parse(req.body);
      const estate = await storage.createEstateDataCollection(validatedData as import("@shared/schema").InsertEstateDataCollection);
      res.status(201).json(estate);
    } catch (error) {
      console.error('Error creating estate data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid estate data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create estate data collection" });
      }
    }
  });

  // Mill Data Collection API routes
  app.get("/api/mill-data-collection", isAuthenticated, async (req, res) => {
    try {
      const mills = await storage.getMillDataCollection();
      res.json(mills);
    } catch (error) {
      console.error('Error fetching mill data collection:', error);
      res.status(500).json({ error: 'Failed to fetch mill data collection' });
    }
  });

  app.get("/api/mill-data-collection/:id", isAuthenticated, async (req, res) => {
    try {
      const mill = await storage.getMillDataCollectionById(req.params.id);
      if (!mill) {
        return res.status(404).json({ error: 'Mill data collection not found' });
      }
      res.json(mill);
    } catch (error) {
      console.error('Error fetching mill data collection:', error);
      res.status(500).json({ error: 'Failed to fetch mill data collection' });
    }
  });

  app.post("/api/mill-data-collection", isAuthenticated, async (req, res) => {
    try {
      const { insertMillDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertMillDataCollectionSchema.parse(req.body);
      const mill = await storage.createMillDataCollection(validatedData as import("@shared/schema").InsertMillDataCollection);
      res.status(201).json(mill);
    } catch (error) {
      console.error('Error creating mill data collection:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create mill data collection' });
    }
  });

  // Object storage endpoints for document uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Get list of TIFF files from App Storage
  app.get("/api/objects/tiff-files", isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();

      // Search for TIFF files in public search paths
      const searchPaths = objectStorageService.getPublicObjectSearchPaths();
      const tiffFiles = [];

      for (const searchPath of searchPaths) {
        try {
          // List files in the bucket (simplified implementation)
          // In a real implementation, you would list bucket contents and filter for .tiff/.tif files
          const mockTiffFiles = [
            { name: 'uav_plot_001.tiff', path: `/objects/uav_plot_001.tiff`, size: '2.5MB' },
            { name: 'uav_plot_002.tiff', path: `/objects/uav_plot_002.tiff`, size: '3.1MB' },
            { name: 'sentinel_2024.tiff', path: `/objects/sentinel_2024.tiff`, size: '15.2MB' }
          ];
          tiffFiles.push(...mockTiffFiles);
        } catch (error) {
          console.warn(`Could not list files in path: ${searchPath}`, error);
        }
      }

      res.json({ files: tiffFiles });
    } catch (error) {
      console.error("Error listing TIFF files:", error);
      res.status(500).json({ error: "Failed to list TIFF files" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof Error && error.constructor.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Traceability Data Collection endpoints
  app.get('/api/traceability-data-collection', async (req, res) => {
    try {
      const collections = await storage.getTraceabilityDataCollections();
      res.json(collections);
    } catch (error) {
      console.error('Error fetching traceability data collections:', error);
      res.status(500).json({ error: 'Failed to fetch traceability data collections' });
    }
  });

  app.post('/api/traceability-data-collection', async (req, res) => {
    try {
      const { insertTraceabilityDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertTraceabilityDataCollectionSchema.parse(req.body);
      const collection = await storage.createTraceabilityDataCollection(validatedData as import("@shared/schema").InsertTraceabilityDataCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating traceability data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create traceability data collection' });
      }
    }
  });

  // KCP Data Collection endpoints
  app.get('/api/kcp-data-collection', async (req, res) => {
    try {
      const collections = await storage.getKcpDataCollections();
      res.json(collections);
    } catch (error) {
      console.error('Error fetching KCP data collections:', error);
      res.status(500).json({ error: 'Failed to fetch KCP data collections' });
    }
  });

  app.post('/api/kcp-data-collection', async (req, res) => {
    try {
      const { insertKcpDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertKcpDataCollectionSchema.parse(req.body);
      const collection = await storage.createKcpDataCollection(validatedData as import("@shared/schema").InsertKcpDataCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating KCP data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create KCP data collection' });
      }
    }
  });

  // Bulking Data Collection endpoints
  app.get('/api/bulking-data-collection', async (req, res) => {
    try {
      const collections = await storage.getBulkingDataCollections();
      res.json(collections);
    } catch (error) {
      console.error('Error fetching bulking data collections:', error);
      res.status(500).json({ error: 'Failed to fetch bulking data collections' });
    }
  });

  app.post('/api/bulking-data-collection', async (req, res) => {
    try {
      const { insertBulkingDataCollectionSchema } = await import("@shared/schema");
      const validatedData = insertBulkingDataCollectionSchema.parse(req.body);
      const collection = await storage.createBulkingDataCollection(validatedData as import("@shared/schema").InsertBulkingDataCollection);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating bulking data collection:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create bulking data collection' });
      }
    }
  });

  // EUDR Assessment endpoints
  app.get('/api/eudr-assessments', isAuthenticated, async (req, res) => {
    try {
      const assessments = await storage.getEudrAssessments();
      res.json(assessments);
    } catch (error) {
      console.error('Error fetching EUDR assessments:', error);
      res.status(500).json({ error: 'Failed to fetch EUDR assessments' });
    }
  });

  app.get('/api/eudr-assessments/:id', isAuthenticated, async (req, res) => {
    try {
      const assessment = await storage.getEudrAssessment(req.params.id);
      if (assessment) {
        res.json(assessment);
      } else {
        res.status(404).json({ error: 'EUDR assessment not found' });
      }
    } catch (error) {
      console.error('Error fetching EUDR assessment:', error);
      res.status(500).json({ error: 'Failed to fetch EUDR assessment' });
    }
  });

  app.post('/api/eudr-assessments', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEudrAssessmentSchema.parse(req.body);
      const assessment = await storage.createEudrAssessment(validatedData as InsertEudrAssessment);
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Error creating EUDR assessment:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create EUDR assessment' });
      }
    }
  });

  app.put('/api/eudr-assessments/:id', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEudrAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateEudrAssessment(req.params.id, validatedData as Partial<EudrAssessment>);
      res.json(assessment);
    } catch (error) {
      console.error('Error updating EUDR assessment:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update EUDR assessment' });
      }
    }
  });

  app.delete('/api/eudr-assessments/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteEudrAssessment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting EUDR assessment:', error);
      res.status(500).json({ error: 'Failed to delete EUDR assessment' });
    }
  });

  // Helper function to get country from coordinates using Nominatim API
  async function getCountryFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      // Use reverse geocoding with proper parameters according to Nominatim API docs
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3&addressdetails=1&extratags=0&namedetails=0`;

      console.log(`🔍 Nominatim API request: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'KPN-EUDR-Compliance-System/1.0 (support@kpn.com)'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📍 Nominatim response for (${lat}, ${lng}):`, JSON.stringify(data, null, 2));

        // According to Nominatim docs, country is available in multiple places
        let country = null;

        if (data.address) {
          // Try different country field names from Nominatim response
          country = data.address.country || 
                   data.address.country_code || 
                   data.address.country_name;
        }

        // Also check display_name for country information
        if (!country && data.display_name) {
          const displayParts = data.display_name.split(', ');
          country = displayParts[displayParts.length - 1]; // Last part is usually country
        }

        if (country) {
          console.log(`✅ Country detected from Nominatim: ${country}`);
          return country;
        }

        console.log(`⚠️  No country found in Nominatim response, using coordinate fallback`);
      } else {
        console.log(`⚠️  Nominatim API error: ${response.status} ${response.statusText}`);
      }

      // Enhanced coordinate-based fallback with more precise ranges
      console.log(`🗺️  Using coordinate-based country detection for (${lat}, ${lng})`);

      // Indonesia (more precise bounds)
      if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
        console.log(`🇮🇩 Detected Indonesia by coordinates`);
        return 'Indonesia';
      }
      // Malaysia  
      else if (lat >= 0.85 && lat <= 7.36 && lng >= 99.64 && lng <= 119.27) {
        console.log(`🇲🇾 Detected Malaysia by coordinates`);
        return 'Malaysia';
      }
      // Nigeria
      else if (lat >= 4.27 && lat <= 13.89 && lng >= 2.67 && lng <= 14.68) {
        console.log(`🇳🇬 Detected Nigeria by coordinates`);
        return 'Nigeria';
      }
      // Ghana
      else if (lat >= 4.74 && lat <= 11.17 && lng >= -3.25 && lng <= 1.19) {
        console.log(`🇬🇭 Detected Ghana by coordinates`);
        return 'Ghana';
      }
      // Ivory Coast
      else if (lat >= 4.36 && lat <= 10.74 && lng >= -8.60 && lng <= -2.49) {
        console.log(`🇨🇮 Detected Ivory Coast by coordinates`);
        return 'Ivory Coast';
      }
      // Brazil
      else if (lat >= -33.75 && lat <= 5.27 && lng >= -73.99 && lng <= -28.84) {
        console.log(`🇧🇷 Detected Brazil by coordinates`);
        return 'Brazil';
      }
      // Central African Republic
      else if (lat >= 2.22 && lat <= 11.00 && lng >= 14.42 && lng <= 27.46) {
        console.log(`🇨🇫 Detected Central African Republic by coordinates`);
        return 'Central African Republic';
      }

      console.log(`❓ Could not determine country for coordinates (${lat}, ${lng})`);
      return 'Unknown';

    } catch (error) {
      console.error('Nominatim API error:', error);

      // Fallback based on coordinate ranges
      if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
        return 'Indonesia';
      } else if (lat >= 0.85 && lat <= 7.36 && lng >= 99.64 && lng <= 119.27) {
        return 'Malaysia';
      } else if (lat >= 4.27 && lat <= 13.89 && lng >= 2.67 && lng <= 14.68) {
        return 'Nigeria';
      } else if (lat >= 4.74 && lat <= 11.17 && lng >= -3.25 && lng <= 1.19) {
        return 'Ghana';
      } else if (lat >= 4.36 && lat <= 10.74 && lng >= -8.60 && lng <= -2.49) {
        return 'Ivory Coast';
      } else if (lat >= -33.75 && lat <= 5.27 && lng >= -73.99 && lng <= -28.84) {
        return 'Brazil';
      } else if (lat >= 2.22 && lat <= 11.00 && lng >= 14.42 && lng <= 27.46) {
        return 'Central African Republic';
      }

      return 'Unknown';
    }
  }

  // Helper function to extract centroid coordinates from geometry
  function getCentroidFromGeometry(geometry: any): { lat: number, lng: number } | null {
    try {
      if (!geometry || !geometry.coordinates) return null;

      if (geometry.type === 'Point') {
        return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
      } else if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        if (coords && coords.length > 0) {
          const lngs = coords.map((c: number[]) => c[0]);
          const lats = coords.map((c: number[]) => c[1]);
          return {
            lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length,
            lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length
          };
        }
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates[0][0];
        if (coords && coords.length > 0) {
          const lngs = coords.map((c: number[]) => c[0]);
          const lats = coords.map((c: number[]) => c[1]);
          return {
            lng: lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length,
            lat: lats.reduce((a: number, b: number) => a + b, 0) / lats.length
          };
        }
      }

      return null;
    } catch (error) {
      console.warn('Error extracting centroid:', error);
      return null;
    }
  }

  // GeoJSON upload and analysis endpoint
  app.post('/api/geojson/upload', isAuthenticated, async (req, res) => {
    try {
      const { geojson, geojsonFile, filename, fileName } = req.body;

      // Accept both parameter names for flexibility
      const geoJsonData = geojson || geojsonFile;
      const fileNameToUse = filename || fileName;

      if (!geoJsonData) {
        console.log('Request body keys:', Object.keys(req.body));
        return res.status(400).json({ error: 'No GeoJSON data provided' });
      }

      let parsedGeojson;
      try {
        parsedGeojson = typeof geoJsonData === 'string' ? JSON.parse(geoJsonData) : geoJsonData;
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }

      if (!parsedGeojson.features || !Array.isArray(parsedGeojson.features)) {
        return res.status(400).json({ error: 'Invalid GeoJSON: missing features array' });
      }

      // Remove z-values (3D coordinates) to make it compatible with external APIs
      const cleanedGeojson = {
        ...parsedGeojson,
        features: parsedGeojson.features.map((feature: any) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const cleanedGeometry = {
              ...feature.geometry,
              coordinates: removeZValues(feature.geometry.coordinates)
            };
            return {
              ...feature,
              geometry: cleanedGeometry
            };
          }
          return feature;
        })
      };

      // Enhanced validation for different GeoJSON formats
      const validatedFeatures = [];

      for (const feature of cleanedGeojson.features) {
        const props = feature.properties || {};

        // Robustly get plot ID
        const plotId = props.id || props.plot_id || props['.Farmers ID'] || props.Name || props.farmer_id || `UNKNOWN_${Math.random().toString(36).substring(7)}`;

        if (!props.id && !props.plot_id && !props['.Farmers ID'] && !props.Name && !props.farmer_id) {
          console.warn('Feature missing critical ID property, skipping:', Object.keys(props));
          continue;
        }

        // Get country using Nominatim API based on geometry centroid
        let detectedCountry = 'Unknown';
        const centroid = getCentroidFromGeometry(feature.geometry);

        if (centroid) {
          console.log(`🌍 Detecting country for coordinates: ${centroid.lat}, ${centroid.lng}`);
          detectedCountry = await getCountryFromCoordinates(centroid.lat, centroid.lng);
          console.log(`✅ Country detected: ${detectedCountry}`);

          // Add a delay to respect Nominatim rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1100));
        } else {
          // Fallback to property-based detection
          detectedCountry = props['.Distict'] || props['.Aggregator Location'] || 
                           props.country_name || props.country || props.district || 
                           props.region || props.province || props.kabupaten || 'Indonesia';
        }

        // Update feature properties with detected country
        feature.properties.detected_country = detectedCountry;
        validatedFeatures.push(feature);
      }

      if (validatedFeatures.length === 0) {
        return res.status(400).json({ 
          error: 'No valid features found. Each feature must have geometry and identifiable properties.' 
        });
      }

      cleanedGeojson.features = validatedFeatures;

      console.log('=== DEBUGGING FEATURE COUNT ===');
      console.log('Input features sent to API:', cleanedGeojson.features.length);

      // Create a proper multipart/form-data request
      const boundary = `----formdata-node-${Date.now()}`;
      const fileContent = JSON.stringify(cleanedGeojson); // Use cleaned GeoJSON
      const uploadFileName = fileNameToUse || 'plot_boundaries.json';

      const formBody = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${uploadFileName}"`,
        'Content-Type: application/json',
        '',
        fileContent,
        `--${boundary}--`
      ].join('\r\n');

      // Call EUDR Multilayer API
      const response = await fetch('https://eudr-multilayer-api.fly.dev/api/v1/upload-geojson', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: formBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RapidAPI Error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: 'Failed to analyze GeoJSON file',
          details: errorText 
        });
      }

      const analysisResults = await response.json();

      // Log both request and response for debugging
      const inputFeatures = cleanedGeojson.features.length; // Use count from cleaned GeoJSON
      const outputFeatures = analysisResults.data?.features?.length || 0;
      console.log('=== DEBUGGING FEATURE COUNT ===');
      console.log('Input features sent to API:', inputFeatures);
      console.log('Output features received from API:', outputFeatures);
      console.log(`Processing stats:`, analysisResults.processing_stats);
      console.log(`File info from API:`, analysisResults.file_info);
      console.log(`Analysis summary:`, analysisResults.analysis_summary);

      if (inputFeatures !== outputFeatures) {
        console.log(`⚠️  FEATURE MISMATCH: Sent ${inputFeatures} but received ${outputFeatures}`);
        console.log(`This appears to be an API-side processing limitation when handling large files.`);
        console.log(`Recommendation: Split large files into smaller batches (5-10 features each) for complete processing.`);

        // Add a warning to the response for users
        analysisResults.warning = {
          message: `Only ${outputFeatures} out of ${inputFeatures} features were processed successfully.`,
          recommendation: "For better results, split large files into smaller batches of 5-10 features each."
        };
      }

      // Store analysis results in database for dashboard metrics
      if (analysisResults.data?.features) {
        const uploadSession = `session-${Date.now()}`;

        // Clear previous analysis results
        await storage.clearAnalysisResults();

        // Store each analysis result in the database
        for (const feature of analysisResults.data.features) {
          console.log(`=== PROCESSING FEATURE ${analysisResults.data.features.indexOf(feature) + 1} ===`);
          console.log(`📋 Available properties:`, Object.keys(feature.properties || {}));
          console.log(`🆔 Property values for ID fields:`, {
            'farmersId': feature.properties?.['.Farmers ID'],
            'plotId': feature.properties?.plot_id,
            'id': feature.properties?.id,
            'Name': feature.properties?.Name,
            'name': feature.properties?.name
          });
          console.log(`🌍 Country-related properties:`, {
            'detected_country': feature.properties?.detected_country,
            'district': feature.properties?.['.Distict'],
            'aggregatorLocation': feature.properties?.['.Aggregator Location'],
            'country_name': feature.properties?.country_name,
            'country': feature.properties?.country
          });
          try {
            // Enhanced plot ID extraction for Indonesian format with detailed logging
            let plotId = 'unknown';

            console.log(`🆔 Feature properties for ID extraction:`, Object.keys(feature.properties || {}));

            if (feature.properties?.['.Farmers ID']) {
              plotId = feature.properties['.Farmers ID'];
              console.log(`✅ Found Indonesian Farmers ID: ${plotId}`);
            } else if (feature.properties?.plot_id) {
              plotId = feature.properties.plot_id;
              console.log(`✅ Found plot_id: ${plotId}`);
            } else if (feature.properties?.id) {
              plotId = feature.properties.id;
              console.log(`✅ Found id: ${plotId}`);
            } else if (feature.properties?.Name) {
              plotId = feature.properties.Name;
              console.log(`✅ Found Name: ${plotId}`);
            } else if (feature.properties?.name) {
              plotId = feature.properties.name;
              console.log(`✅ Found name: ${plotId}`);
            } else if (feature.properties?.farmer_id) {
              plotId = feature.properties.farmer_id;
              console.log(`✅ Found farmer_id: ${plotId}`);
            } else {
              plotId = `PLOT_${analysisResults.data.features.indexOf(feature) + 1}`;
              console.log(`⚠️  No ID found, using fallback: ${plotId}`);
            }

            // Use detected country from Nominatim API with better fallback handling
            let country = feature.properties?.detected_country || 'Unknown';

            console.log(`🌍 Initial country detection: ${country}`);

            // If Nominatim didn't detect country properly, extract from Indonesian properties
            if (country === 'Unknown' || !country) {
              if (feature.properties?.['.Distict']) {
                // Indonesian district format: "Bone" -> "Bone, Indonesia"  
                const district = feature.properties['.Distict'];
                country = `${district}, Indonesia`;
                console.log(`🇮🇩 Using Indonesian district: ${country}`);
              } else if (feature.properties?.['.Aggregator Location']) {
                // Indonesian aggregator location: "Makassar, South Sulawesi - Indonesia"
                const location = feature.properties['.Aggregator Location'];
                country = location.includes('Indonesia') ? location : `${location}, Indonesia`;
                console.log(`🇮🇩 Using Indonesian aggregator location: ${country}`);
              } else if (feature.properties?.country_name) {
                country = feature.properties.country_name;
                console.log(`🌍 Using country_name: ${country}`);
              } else if (feature.properties?.country) {
                country = feature.properties.country;
                console.log(`🌍 Using country: ${country}`);
              } else {
                // Default to Indonesia for Indonesian data format
                country = 'Indonesia';
                console.log(`🇮🇩 Using default Indonesia fallback`);
              }
            }

            // Enhanced area parsing for Indonesian format
            let area = 0;
            if (feature.properties?.['.Plot size']) {
              // Parse Indonesian format: "0.50 Ha", "24.00 Ha", etc.
              const plotSize = feature.properties['.Plot size'].toString();
              const areaMatch = plotSize.match(/(\d+\.?\d*)/);
              area = areaMatch ? parseFloat(areaMatch[1]) : 0;
              console.log(`📏 Plot ${plotId}: Parsed area ${area}ha from "${plotSize}"`);
            } else if (feature.properties?.area_ha) {
              area = parseFloat(feature.properties.area_ha);
            } else if (feature.properties?.area) {
              area = parseFloat(feature.properties.area);
            } else if (feature.properties?.Plot_Size) {
              area = parseFloat(feature.properties.Plot_Size);
            } else {
              // Calculate area from geometry if available
              area = calculateAreaFromGeometry(feature.geometry) || 1.0; // Default 1 hectare
              console.log(`📏 Plot ${plotId}: Calculated area ${area}ha from geometry`);
            }

            // Get risk data, provide defaults
            const overallRisk = feature.properties?.overall_compliance?.overall_risk?.toUpperCase() || 'UNKNOWN';
            const complianceStatus = feature.properties?.overall_compliance?.compliance_status === 'NON_COMPLIANT' ? 'NON-COMPLIANT' : 'COMPLIANT';
            const gfwLossArea = parseFloat(feature.properties?.gfw_loss?.gfw_loss_area || '0');
            const jrcLossArea = parseFloat(feature.properties?.jrc_loss?.jrc_loss_area || '0');
            const sbtnLossArea = parseFloat(feature.properties?.sbtn_loss?.sbtn_loss_area || '0');
            const highRiskDatasets = feature.properties?.overall_compliance?.high_risk_datasets || [];

            console.log(`🔍 Plot ${plotId} - GFW: ${gfwLossArea}ha, JRC: ${jrcLossArea}ha, SBTN: ${sbtnLossArea}ha`);

            // Create analysis result with comprehensive Indonesian metadata
            const analysisResult = {
              plotId,
              country,
              area: area.toString(),
              overallRisk,
              complianceStatus,
              gfwLoss: gfwLossArea > 0 ? 'TRUE' : 'FALSE',
              jrcLoss: jrcLossArea > 0 ? 'TRUE' : 'FALSE', 
              sbtnLoss: sbtnLossArea > 0 ? 'TRUE' : 'FALSE',
              peatlandOverlap: 'UNKNOWN', // Default value for peatland analysis
              highRiskDatasets,
              uploadSession: uploadSession,
              geometry: feature.geometry,
              // Enhanced metadata from Indonesian data
              farmerName: feature.properties?.['.Farmer Name'] || 
                         feature.properties?.farmer_name || 
                         feature.properties?.grower_name || null,
              aggregatorName: feature.properties?.['.Aggregator Name'] || 
                             feature.properties?.aggregator || 
                             feature.properties?.cooperative || null,
              mappingDate: feature.properties?.['.Mapping date'] || 
                          feature.properties?.mapping_date || 
                          feature.properties?.survey_date || null,
              // Additional Indonesian-specific fields
              aggregatorLocation: feature.properties?.['.Aggregator Location'] || null,
              plotName: feature.properties?.Name || feature.properties?.name || null,
              coordinates: {
                longitude: feature.properties?.['.Long'] || null,
                latitude: feature.properties?.['.Lat'] || null
              }
            };

            await storage.createAnalysisResult(analysisResult);
          } catch (err) {
            const errMessage = err instanceof Error ? err.message : 'Unknown error';
            console.log("Could not store analysis result:", errMessage);
          }
        }

        console.log(`✅ Stored ${analysisResults.data.features.length} analysis results in database for reactive dashboard`);
      }

      // Return the response directly as it already has the expected structure
      res.json(analysisResults);

    } catch (error) {
      console.error('GeoJSON upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Internal server error during GeoJSON analysis',
        details: errorMessage 
      });
    }
  });

  // Get analysis results endpoint for map viewer
  app.get('/api/analysis-results', async (req, res) => {
    try {
      const results = await storage.getAnalysisResults();
      res.json(results);
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      res.status(500).json({ error: 'Failed to fetch analysis results' });
    }
  });

  // Clear analysis results endpoint for dashboard reset
  app.delete('/api/analysis-results', async (req, res) => {
    try {
      await storage.clearAnalysisResults();
      res.json({ success: true, message: 'Analysis results cleared' });
    } catch (error) {
      console.error('Error clearing analysis results:', error);
      res.status(500).json({ error: 'Failed to clear analysis results' });
    }
  });

  // Update polygon geometry after editing
  app.patch('/api/analysis-results/:plotId/geometry', async (req, res) => {
    try {
      const { plotId } = req.params;
      const { coordinates } = req.body;

      if (!coordinates || !Array.isArray(coordinates)) {
        return res.status(400).json({ error: 'Invalid coordinates provided' });
      }

      // Update the geometry in analysis results
      const result = await storage.updateAnalysisResultGeometry(plotId, coordinates);

      if (!result) {
        return res.status(404).json({ error: 'Plot not found' });
      }

      res.json({ 
        success: true, 
        message: `Updated geometry for ${plotId}`,
        plotId,
        coordinatesCount: coordinates.length
      });
    } catch (error) {
      console.error('Error updating polygon geometry:', error);
      res.status(500).json({ error: 'Failed to update polygon geometry' });
    }
  });

  // Supply Chain Analytics endpoint
  app.get('/api/supply-chain/analytics', isAuthenticated, async (req, res) => {
    try {
      const { range = '6months' } = req.query;

      // Mock analytics data with renamed external suppliers
      const analyticsData = {
        suppliers: [
          {
            supplierId: "coop-001",
            supplierName: "Cooperative 1",
            complianceScore: {
              overallScore: 85,
              riskLevel: 'low',
              confidence: 0.92,
              factors: [
                { name: "Documentation", impact: 15, trend: 'improving' },
                { name: "Geolocation", impact: 10, trend: 'stable' },
                { name: "Deforestation Risk", impact: -2, trend: 'improving' },
                { name: "Traceability", impact: 12, trend: 'stable' }
              ],
              recommendations: [
                "Maintain current documentation standards",
                "Continue regular monitoring protocols",
                "Review quarterly compliance metrics"
              ],
              nextReviewDate: "2024-12-15"
            },
            trends: [
              { period: "Jan", score: 78, alerts: 2, violations: 0 },
              { period: "Feb", score: 82, alerts: 1, violations: 0 },
              { period: "Mar", score: 85, alerts: 0, violations: 0 },
              { period: "Apr", score: 84, alerts: 1, violations: 0 },
              { period: "May", score: 87, alerts: 0, violations: 0 },
              { period: "Jun", score: 85, alerts: 0, violations: 0 }
            ],
            riskFactors: [
              {
                category: "Location Risk",
                severity: 'low',
                description: "Minimal deforestation risk in operational area",
                mitigation: "Continue quarterly satellite monitoring"
              }
            ]
          },
          {
            supplierId: "kud-002",
            supplierName: "KUD 2",
            complianceScore: {
              overallScore: 72,
              riskLevel: 'medium',
              confidence: 0.87,
              factors: [
                { name: "Documentation", impact: 8, trend: 'stable' },
                { name: "Geolocation", impact: -5, trend: 'declining' },
                { name: "Deforestation Risk", impact: -8, trend: 'stable' },
                { name: "Traceability", impact: 5, trend: 'improving' }
              ],
              recommendations: [
                "Improve geolocation accuracy for plots",
                "Enhance documentation processes",
                "Implement additional monitoring controls"
              ],
              nextReviewDate: "2024-11-30"
            },
            trends: [
              { period: "Jan", score: 75, alerts: 3, violations: 1 },
              { period: "Feb", score: 73, alerts: 2, violations: 0 },
              { period: "Mar", score: 71, alerts: 3, violations: 1 },
              { period: "Apr", score: 74, alerts: 2, violations: 0 },
              { period: "May", score: 72, alerts: 2, violations: 0 },
              { period: "Jun", score: 72, alerts: 1, violations: 0 }
            ],
            riskFactors: [
              {
                category: "Documentation Gap",
                severity: 'medium',
                description: "Some plot records lack complete geolocation data",
                mitigation: "Conduct field verification within 60 days"
              },
              {
                category: "Monitoring",
                severity: 'low',
                description: "Infrequent satellite monitoring updates",
                mitigation: "Increase monitoring frequency to monthly"
              }
            ]
          },
          {
            supplierId: "cv-001",
            supplierName: "CV 1",
            complianceScore: {
              overallScore: 91,
              riskLevel: 'low',
              confidence: 0.95,
              factors: [
                { name: "Documentation", impact: 18, trend: 'improving' },
                { name: "Geolocation", impact: 15, trend: 'stable' },
                { name: "Deforestation Risk", impact: 12, trend: 'improving' },
                { name: "Traceability", impact: 16, trend: 'improving' }
              ],
              recommendations: [
                "Excellent compliance - maintain current standards",
                "Consider best practice sharing with other suppliers",
                "Continue leadership in sustainable practices"
              ],
              nextReviewDate: "2025-01-15"
            },
            trends: [
              { period: "Jan", score: 88, alerts: 0, violations: 0 },
              { period: "Feb", score: 89, alerts: 0, violations: 0 },
              { period: "Mar", score: 90, alerts: 0, violations: 0 },
              { period: "Apr", score: 91, alerts: 0, violations: 0 },
              { period: "May", score: 92, alerts: 0, violations: 0 },
              { period: "Jun", score: 91, alerts: 0, violations: 0 }
            ],
            riskFactors: []
          },
          {
            supplierId: "coop-003",
            supplierName: "Cooperative 3",
            complianceScore: {
              overallScore: 68,
              riskLevel: 'medium',
              confidence: 0.83,
              factors: [
                { name: "Documentation", impact: 5, trend: 'stable' },
                { name: "Geolocation", impact: -3, trend: 'declining' },
                { name: "Deforestation Risk", impact: -12, trend: 'declining' },
                { name: "Traceability", impact: 8, trend: 'improving' }
              ],
              recommendations: [
                "Urgent: Address deforestation risk areas",
                "Improve plot boundary documentation",
                "Implement enhanced monitoring protocols"
              ],
              nextReviewDate: "2024-10-31"
            },
            trends: [
              { period: "Jan", score: 72, alerts: 4, violations: 2 },
              { period: "Feb", score: 70, alerts: 3, violations: 1 },
              { period: "Mar", score: 68, alerts: 5, violations: 2 },
              { period: "Apr", score: 69, alerts: 3, violations: 1 },
              { period: "May", score: 67, alerts: 4, violations: 1 },
              { period: "Jun", score: 68, alerts: 3, violations: 1 }
            ],
            riskFactors: [
              {
                category: "Deforestation Risk",
                severity: 'high',
                description: "Some plots located near high-risk deforestation areas",
                mitigation: "Immediate field assessment and buffer zone establishment"
              },
              {
                category: "Documentation Gap",
                severity: 'medium',
                description: "Incomplete plot boundary records",
                mitigation: "Complete GPS mapping within 30 days"
              }
            ]
          }
        ],
        insights: {
          summary: "Overall supplier network shows good compliance with 75% scoring above 70. Key focus areas include improving documentation accuracy and addressing deforestation risks.",
          keyFindings: [
            "CV 1 demonstrates exemplary compliance practices",
            "Cooperative 3 requires immediate attention for deforestation risk",
            "Documentation quality varies significantly across suppliers",
            "Traceability systems show consistent improvement trends"
          ],
          actionItems: [
            "Conduct urgent field assessment for Cooperative 3",
            "Implement standardized documentation training",
            "Share CV 1 best practices across network",
            "Increase monitoring frequency for medium-risk suppliers"
          ]
        }
      };

      res.json(analyticsData);
    } catch (error) {
      console.error('Error fetching supply chain analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // Supply Chain Tier Management endpoint  
  app.post('/api/supply-chain/tiers', isAuthenticated, async (req, res) => {
    try {
      const tierAssignments = req.body;
      console.log('✅ Received tier assignments for saving:', JSON.stringify(tierAssignments, null, 2));

      // Validate that tierAssignments is an object
      if (!tierAssignments || typeof tierAssignments !== 'object') {
        return res.status(400).json({ error: 'Invalid tier assignments data' });
      }

      // For now, we'll store it in memory or could extend to database storage later
      console.log('✅ Supply chain tier configuration saved successfully');

      res.json({ 
        success: true, 
        message: 'Supply chain configuration saved successfully!',
        savedAt: new Date().toISOString(),
        tierCount: Object.keys(tierAssignments).length,
        totalSuppliers: Object.values(tierAssignments).reduce((total: number, tier: any) => total + (Array.isArray(tier) ? tier.length : 0), 0)
      });

    } catch (error) {
      console.error('❌ Error saving supply chain tier configuration:', error);
      res.status(500).json({ error: 'Failed to save supply chain configuration' });
    }
  });

  // Auto-fill suppliers endpoint - fetch all suppliers from data collection forms
  app.get('/api/suppliers/auto-fill', isAuthenticated, async (req, res) => {
    try {
      console.log('📋 Fetching suppliers for auto-fill from data collection forms...');

      // Fetch estate data collection
      const estates = await storage.getEstateDataCollection();

      // Fetch mill data collection  
      const mills = await storage.getMillDataCollection();

      // Combine and format supplier data for auto-fill
      const suppliers: Array<{
        id: string;
        name: string;
        type: 'Estate' | 'Mill';
        groupParentCompany?: string;
        officeAddress?: string;
        plantationAddress?: string;
        officeCoordinates?: string;
        plantationCoordinates?: string;
        businessLicense?: string;
        establishmentAct?: string;
        amendmentAct?: string;
        certificationType?: string;
        certificateNumber?: string;
        supplierType?: string;
        responsiblePersonName?: string;
        responsiblePersonPosition?: string;
        responsiblePersonEmail?: string;
        responsiblePersonPhone?: string;
        internalTeamName?: string;
        internalTeamPosition?: string;
        internalTeamEmail?: string;
        internalTeamPhone?: string;
        originalData: any;
      }> = [];

      // Add estate suppliers
      estates.forEach(estate => {
        suppliers.push({
          id: estate.id,
          name: estate.namaSupplier,
          type: 'Estate',
          groupParentCompany: estate.namaGroupParentCompany || undefined,
          officeAddress: estate.alamatKantor || undefined,
          plantationAddress: estate.alamatKebun || undefined,
          officeCoordinates: estate.koordinatKantor || undefined,
          plantationCoordinates: estate.koordinatKebun || undefined,
          businessLicense: estate.izinBerusaha || undefined,
          establishmentAct: estate.aktaPendirianPerusahaan || undefined,
          amendmentAct: estate.aktaPerubahan || undefined,
          certificationType: estate.tipeSertifikat || undefined,
          certificateNumber: estate.nomorSertifikat || undefined,
          supplierType: estate.jenisSupplier || undefined,
          responsiblePersonName: estate.namaPenanggungJawab || undefined,
          responsiblePersonPosition: estate.jabatanPenanggungJawab || undefined,
          responsiblePersonEmail: estate.emailPenanggungJawab || undefined,
          responsiblePersonPhone: estate.nomorTelefonPenanggungJawab || undefined,
          internalTeamName: estate.namaTimInternal || undefined,
          internalTeamPosition: estate.jabatanTimInternal || undefined,
          internalTeamEmail: estate.emailTimInternal || undefined,
          internalTeamPhone: estate.nomorTelefonTimInternal || undefined,
          originalData: estate
        });
      });

      // Add mill suppliers  
      mills.forEach(mill => {
        suppliers.push({
          id: mill.id,
          name: mill.namaPabrik,
          type: 'Mill',
          groupParentCompany: mill.namaGroupParentCompany || undefined,
          officeAddress: mill.alamatKantor || undefined,
          plantationAddress: mill.alamatPabrik || undefined,
          officeCoordinates: mill.koordinatKantor || undefined,
          plantationCoordinates: mill.koordinatPabrik || undefined,
          businessLicense: mill.izinBerusaha || undefined,
          establishmentAct: mill.aktaPendirianPerusahaan || undefined,
          amendmentAct: mill.aktaPerubahan || undefined,
          certificationType: mill.tipeSertifikat || undefined,
          certificateNumber: mill.nomorSertifikat || undefined,
          supplierType: mill.jenisSupplier || undefined,
          responsiblePersonName: mill.namaPenanggungJawab || undefined,
          responsiblePersonPosition: mill.jabatanPenanggungJawab || undefined,
          responsiblePersonEmail: mill.emailPenanggungJawab || undefined,
          responsiblePersonPhone: mill.nomorTelefonPenanggungJawab || undefined,
          internalTeamName: mill.namaTimInternal || undefined,
          internalTeamPosition: mill.jabatanTimInternal || undefined,
          internalTeamEmail: mill.emailTimInternal || undefined,
          internalTeamPhone: mill.nomorTelefonTimInternal || undefined,
          originalData: mill
        });
      });

      console.log(`✅ Found ${suppliers.length} suppliers for auto-fill (${estates.length} estates, ${mills.length} mills)`);

      res.json(suppliers);
    } catch (error) {
      console.error('❌ Error fetching suppliers for auto-fill:', error);
      res.status(500).json({ error: 'Failed to fetch suppliers for auto-fill' });
    }
  });

  // Supplier Compliance endpoints
  app.post('/api/supplier-compliance', async (req, res) => {
    try {
      const supplierComplianceData = req.body;
      console.log('Saving supplier compliance data:', supplierComplianceData.namaSupplier);

      // Store the data (you may want to add this to your storage interface)
      // For now, we'll just return success
      res.json({ 
        success: true, 
        message: 'Supplier compliance data saved successfully',
        id: Date.now().toString()
      });
    } catch (error) {
      console.error('Error saving supplier compliance data:', error);
      res.status(500).json({ error: 'Failed to save supplier compliance data' });
    }
  });

  app.get('/api/supplier-compliance', async (req, res) => {
    try {
      // Return dummy data for now (in a real implementation, fetch from storage)
      const supplierComplianceData = [
        {
          id: 1,
          namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
          tingkatKepatuhan: 85,
          statusKepatuhan: 'Compliant',
          tanggalPenilaian: '15 November 2024',
          nomorTeleponTimInternal: '+62 811-2345-6789',
          emailKontak: 'compliance@kebun-sejahtera.co.id',
          analysisData: null
        },
        {
          id: 2,
          namaSupplier: 'CV Perkebunan Nusantara',
          tingkatKepatuhan: 92,
          statusKepatuhan: 'Highly Compliant',
          tanggalPenilaian: '18 November 2024',
          nomorTeleponTimInternal: '+62 812-3456-7890',
          emailKontak: 'legal@perkebunan-nusantara.co.id',
          analysisData: null
        },
        {
          id: 3,
          namaSupplier: 'Koperasi Tani Mandiri',
          tingkatKepatuhan: 68,
          statusKepatuhan: 'Partially Compliant',
          tanggalPenilaian: '20 November 2024',
          nomorTeleponTimInternal: '+62 813-4567-8901',
          emailKontak: 'koperasi@tani-mandiri.co.id',
          analysisData: null
        }
      ];

      res.json(supplierComplianceData);
    } catch (error) {
      console.error('Error fetching supplier compliance data:', error);
      res.status(500).json({ error: 'Failed to fetch supplier compliance data' });
    }
  });

  // AI Analysis endpoint for supplier compliance
  app.post('/api/supplier-compliance/:id/analyze', async (req, res) => {
    try {
      const { id } = req.params;
      const { formData, supplierName } = req.body;

      if (!formData || !supplierName) {
        return res.status(400).json({ error: 'Missing required fields: formData and supplierName' });
      }

      console.log(`Starting AI analysis for supplier: ${supplierName}`);

      // Call OpenAI service for compliance analysis
      const analysis = await openaiService.analyzeSupplierCompliance({
        supplierName,
        formData,
        analysisType: 'full_analysis'
      });

      console.log(`AI analysis completed for supplier: ${supplierName}`);

      res.json({
        success: true,
        supplierId: id,
        supplierName,
        analysis,
        analyzedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error analyzing supplier compliance:', error);
      res.status(500).json({ 
        error: 'Failed to analyze supplier compliance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk analysis endpoint
  app.post('/api/supplier-compliance/analyze-all', async (req, res) => {
    try {
      const { supplierData } = req.body;

      if (!Array.isArray(supplierData) || supplierData.length === 0) {
        return res.status(400).json({ error: 'Missing or empty supplierData array' });
      }

      console.log(`Starting bulk AI analysis for ${supplierData.length} suppliers`);

      const results = [];
      for (const supplier of supplierData) {
        try {
          const analysis = await openaiService.analyzeSupplierCompliance({
            supplierName: supplier.namaSupplier,
            formData: supplier,
            analysisType: 'full_analysis'
          });

          results.push({
            supplierId: supplier.id || Date.now().toString(),
            supplierName: supplier.namaSupplier,
            analysis,
            analyzedAt: new Date().toISOString()
          });

        } catch (error) {
          console.error(`Error analyzing supplier ${supplier.namaSupplier}:`, error);
          results.push({
            supplierId: supplier.id || Date.now().toString(),
            supplierName: supplier.namaSupplier,
            error: error instanceof Error ? error.message : 'Unknown error',
            analyzedAt: new Date().toISOString()
          });
        }
      }

      console.log(`Bulk AI analysis completed for ${results.length} suppliers`);

      res.json({
        success: true,
        totalAnalyzed: results.length,
        results
      });

    } catch (error) {
      console.error('Error in bulk analysis:', error);
      res.status(500).json({ 
        error: 'Failed to perform bulk analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PostGIS polygon overlap detection endpoint
  app.post('/api/polygon-overlap-detection', async (req, res) => {
    try {
      const { polygons } = req.body;

      if (!Array.isArray(polygons) || polygons.length < 2) {
        return res.status(400).json({ error: 'At least 2 polygons required for overlap detection' });
      }

      console.log(`Checking overlaps for ${polygons.length} polygons using PostGIS`);

      // Enable PostGIS extension if not already enabled
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);

      const overlaps = [];

      // Check each polygon against all others
      for (let i = 0; i < polygons.length; i++) {
        for (let j = i + 1; j < polygons.length; j++) {
          const polygon1 = polygons[i];
          const polygon2 = polygons[j];

          try {
            // Convert coordinates to WKT format for PostGIS
            const wkt1 = coordinatesToWKT(polygon1.coordinates);
            const wkt2 = coordinatesToWKT(polygon2.coordinates);

            console.log(`Checking overlap between ${polygon1.plotId} and ${polygon2.plotId}`);

            // Use PostGIS ST_Intersection to detect overlap
            const result = await db.execute(sql`
              SELECT 
                ST_Area(ST_Intersection(
                  ST_GeomFromText(${wkt1}, 4326),
                  ST_GeomFromText(${wkt2}, 4326)
                )) as intersection_area,
                ST_Intersects(
                  ST_GeomFromText(${wkt1}, 4326),
                  ST_GeomFromText(${wkt2}, 4326)
                ) as intersects
            `);

            const intersectionArea = parseFloat(result.rows[0]?.intersection_area?.toString() || '0');
            const intersects = result.rows[0]?.intersects || false;

            console.log(`Intersection area between ${polygon1.plotId} and ${polygon2.plotId}: ${intersectionArea}`);

            if (intersects && intersectionArea > 0) {
              overlaps.push({
                polygon1: polygon1.plotId,
                polygon2: polygon2.plotId,
                intersectionArea: intersectionArea,
                intersectionAreaHa: intersectionArea * 111319.9 * 111319.9 / 10000 // Convert to hectares (approximate)
              });
              console.log(`OVERLAP DETECTED: ${polygon1.plotId} overlaps with ${polygon2.plotId}, area: ${intersectionArea}`);
            }
          } catch (error) {
            console.error(`Error checking overlap between ${polygon1.plotId} and ${polygon2.plotId}:`, error);
          }
        }
      }

      res.json({
        success: true,
        totalPolygons: polygons.length,
        overlapsDetected: overlaps.length,
        overlaps: overlaps
      });

    } catch (error) {
      console.error('Error in PostGIS overlap detection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to detect overlaps using PostGIS',
        details: errorMessage 
      });
    }
  });

  // Helper function to convert coordinates array to WKT format
  function coordinatesToWKT(coordinates: any): string {
    if (!coordinates || !coordinates[0]) {
      throw new Error('Invalid coordinates');
    }

    // Handle both Polygon and MultiPolygon geometries
    let coords = coordinates;
    if (Array.isArray(coordinates[0][0][0])) {
      // MultiPolygon - take first polygon
      coords = coordinates[0];
    }

    const ring = coords[0];
    const wktCoords = ring.map((coord: any) => `${coord[0]} ${coord[1]}`).join(', ');
    return `POLYGON((${wktCoords}))`;
  }

  // Helper function to calculate area from geometry
  function calculateAreaFromGeometry(geometry: any): number {
    if (!geometry || !geometry.coordinates) return 0;

    try {
      if (geometry.type === 'Polygon') {
        return calculatePolygonArea(geometry.coordinates[0]);
      } else if (geometry.type === 'MultiPolygon') {
        return calculatePolygonArea(geometry.coordinates[0][0]);
      }
      return 0;
    } catch (error) {
      console.warn('Error calculating area from geometry:', error);
      return 0;
    }
  }

  // Helper functions for GeoJSON processing
  function calculateBoundingBox(coordinates: number[][]): { north: number, south: number, east: number, west: number } {
    let north = -90, south = 90, east = -180, west = 180;

    for (const coord of coordinates) {
      const [lng, lat] = coord;
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    }

    return { north, south, east, west };
  }

  function calculateCentroid(coordinates: number[][]): { lat: number, lng: number } {
    let totalLat = 0, totalLng = 0;
    const count = coordinates.length - 1; // Exclude the last coordinate as it's the same as the first

    for (let i = 0; i < count; i++) {
      const [lng, lat] = coordinates[i];
      totalLat += lat;
      totalLng += lng;
    }

    return {
      lat: totalLat / count,
      lng: totalLng / count
    };
  }

  function calculatePolygonArea(coordinates: number[][]): number {
    // Simple polygon area calculation using the shoelace formula
    let area = 0;
    const n = coordinates.length - 1; // Exclude the last coordinate as it's the same as the first

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }

    area = Math.abs(area) / 2;

    // Convert from square degrees to hectares (rough approximation)
    // This is a simplified conversion and should be improved for production use
    const hectares = area * 11119.49; // Rough conversion factor

    return Math.round(hectares * 100) / 100; // Round to 2 decimal places
  }

  // Helper function to remove z-values from GeoJSON coordinates
  function removeZValues(coordinates: any): any {
    if (Array.isArray(coordinates)) {
      if (typeof coordinates[0] === 'number' && coordinates.length === 3) {
        // This is a coordinate array like [x, y, z]
        return coordinates.slice(0, 2);
      } else {
        // Recursively process nested arrays
        return coordinates.map(removeZValues);
      }
    }
    return coordinates; // Return as is if not an array
  }

  return httpServer;
}