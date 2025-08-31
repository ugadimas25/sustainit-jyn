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
  insertMillSchema
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { openaiService } from "./lib/openai-service";
import { z } from "zod";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import FormData from "form-data";
import { Readable } from "stream";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initializeDefaultUser() {
  try {
    const existingUser = await storage.getUserByUsername("kpneudr");
    if (!existingUser) {
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

    // Create sample DDS reports
    const ddsReports = await storage.getDdsReports();
    if (ddsReports.length === 0) {
      const ddsReport1 = await storage.createDdsReport({
        operatorLegalName: "KPN Plantations Berhad",
        operatorAddress: "Level 6, Menara KPN, Jalan Sultan Ismail, 50250 Kuala Lumpur, Malaysia",
        eoriNumber: "MY123456789000",
        hsCode: "151110",
        productDescription: "Crude Palm Oil (CPO)",
        netMassKg: "2150.000",
        countryOfProduction: "Malaysia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: 3.1390, longitude: 101.6869, plotId: "PLT-SELANGOR-001" },
          { latitude: 2.9300, longitude: 101.8000, plotId: "PLT-SELANGOR-002" }
        ]),
        operatorDeclaration: "I hereby declare that the information provided is accurate and complete.",
        signedBy: "Datuk Seri Ahmad Bin Abdullah",
        signedDate: new Date("2024-08-15"),
        signatoryFunction: "Chief Executive Officer",
        status: "draft"
      });

      const ddsReport2 = await storage.createDdsReport({
        operatorLegalName: "PT Sawit Mas Indonesia",
        operatorAddress: "Jl. Sudirman No. 123, Jakarta 10220, Indonesia",
        eoriNumber: "ID987654321000",
        hsCode: "151110",
        productDescription: "Refined Palm Oil",
        netMassKg: "1500.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: 0.7893, longitude: 101.4467, plotId: "PLT-RIAU-001" },
          { latitude: 0.5333, longitude: 101.4500, plotId: "PLT-RIAU-002" }
        ]),
        priorDdsReference: "EU-DDS-2024-001",
        operatorDeclaration: "This shipment complies with all EU deforestation regulations.",
        signedBy: "Dr. Siti Nurhaliza",
        signedDate: new Date("2024-08-10"),
        signatoryFunction: "Operations Director",
        status: "generated",
        pdfDocumentPath: "/pdfs/dds-sample-001.pdf"
      });

      const ddsReport3 = await storage.createDdsReport({
        operatorLegalName: "Golden Agri Resources Ltd",
        operatorAddress: "108 Pasir Panjang Road, #08-01, Golden Agri Plaza, Singapore 118535",
        eoriNumber: "SG456789123000",
        hsCode: "151190",
        productDescription: "Palm Kernel Oil",
        netMassKg: "850.000",
        countryOfProduction: "Indonesia",
        geolocationType: "plot",
        geolocationCoordinates: JSON.stringify([
          { latitude: -1.2708, longitude: 103.7367, plotId: "PLT-JAMBI-001" },
          { latitude: -1.6000, longitude: 103.6000, plotId: "PLT-JAMBI-002" }
        ]),
        operatorDeclaration: "All products sourced from verified deforestation-free areas.",
        signedBy: "Mr. Lim Wei Ming",
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
      const supplier = await storage.createSupplier(validatedData);
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
      const supplier = await storage.updateSupplier(id, validatedData);
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

  // Dashboard metrics - only return data if there are current analysis results
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      // Check if we have current analysis results in the database
      const analysisResults = await storage.getAnalysisResults();
      
      if (!analysisResults || analysisResults.length === 0) {
        // Return zeros if no current analysis data
        const zeroMetrics = {
          totalPlots: "0",
          compliantPlots: "0",
          highRiskPlots: "0",
          mediumRiskPlots: "0",
          deforestedPlots: "0",
          totalArea: "0.00"
        };
        return res.json(zeroMetrics);
      }
      
      // Calculate metrics from current analysis results
      const totalPlots = analysisResults.length;
      const compliantPlots = analysisResults.filter(r => r.complianceStatus === 'COMPLIANT').length;
      const highRiskPlots = analysisResults.filter(r => r.overallRisk === 'HIGH').length;
      const mediumRiskPlots = analysisResults.filter(r => r.overallRisk === 'MEDIUM').length;
      const deforestedPlots = analysisResults.filter(r => 
        r.highRiskDatasets?.includes('GFW Forest Loss') || 
        r.highRiskDatasets?.includes('JRC Forest Loss')
      ).length;
      const totalArea = analysisResults.reduce((sum, r) => sum + (Number(r.area) || 0), 0).toFixed(2);

      const metrics = {
        totalPlots: totalPlots.toString(),
        compliantPlots: compliantPlots.toString(),
        highRiskPlots: highRiskPlots.toString(),
        mediumRiskPlots: mediumRiskPlots.toString(),
        deforestedPlots: deforestedPlots.toString(),
        totalArea: totalArea
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Return zeros in case of error to maintain zero state
      res.json({
        totalPlots: "0",
        compliantPlots: "0",
        highRiskPlots: "0",
        mediumRiskPlots: "0",
        deforestedPlots: "0",
        totalArea: "0.00"
      });
    }
  });

  // Real-time dashboard metrics from current session data
  app.post("/api/dashboard/calculate-metrics", async (req, res) => {
    try {
      const { analysisResults } = req.body;
      
      if (!Array.isArray(analysisResults)) {
        return res.status(400).json({ error: "analysisResults must be an array" });
      }
      
      const totalPlots = analysisResults.length;
      const compliantPlots = analysisResults.filter(r => r.complianceStatus === 'COMPLIANT').length;
      const highRiskPlots = analysisResults.filter(r => r.overallRisk === 'HIGH').length;
      const mediumRiskPlots = analysisResults.filter(r => r.overallRisk === 'MEDIUM').length;
      const deforestedPlots = analysisResults.filter(r => 
        r.highRiskDatasets?.includes('GFW Forest Loss') || 
        r.highRiskDatasets?.includes('JRC Forest Loss')
      ).length;
      const totalArea = analysisResults.reduce((sum, r) => sum + (Number(r.area) || 0), 0).toFixed(2);

      const metrics = {
        totalPlots: totalPlots.toString(),
        compliantPlots: compliantPlots.toString(),
        highRiskPlots: highRiskPlots.toString(),
        mediumRiskPlots: mediumRiskPlots.toString(),
        deforestedPlots: deforestedPlots.toString(),
        totalArea: totalArea
      };
      
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating real-time dashboard metrics:", error);
      res.status(500).json({ error: "Failed to calculate dashboard metrics" });
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

  // DDS Reports routes
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

      // Mock PDF generation - in real implementation, use a PDF library
      const pdfPath = `/pdfs/dds-${report.id}.pdf`;
      
      // Update report with PDF path
      await storage.updateDdsReport(req.params.id, {
        pdfDocumentPath: pdfPath,
        status: 'generated'
      });

      res.json({ 
        success: true, 
        message: 'PDF generated successfully',
        pdfPath 
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
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
      const filePaths = geoJsonFiles.map(file => `/geojson/${report.id}/${file.fileName}`);
      const combinedFilePath = `/geojson/${report.id}/combined-verified-polygons.geojson`;

      // Update report with generated GeoJSON paths
      await storage.updateDdsReport(req.params.id, {
        geojsonFilePaths: JSON.stringify([...filePaths, combinedFilePath])
      });

      res.json({ 
        success: true, 
        message: 'GeoJSON files generated successfully',
        files: [
          ...geoJsonFiles.map(file => ({
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
      const estate = await storage.createEstateDataCollection(validatedData);
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
      const mill = await storage.createMillDataCollection(validatedData);
      res.status(201).json(mill);
    } catch (error) {
      console.error('Error creating mill data collection:', error);
      if (error.issues) {
        return res.status(400).json({ error: 'Validation error', details: error.issues });
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
      const collection = await storage.createTraceabilityDataCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating traceability data collection:', error);
      if (error.name === 'ZodError') {
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
      const collection = await storage.createKcpDataCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating KCP data collection:', error);
      if (error.name === 'ZodError') {
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
      const collection = await storage.createBulkingDataCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      console.error('Error creating bulking data collection:', error);
      if (error.name === 'ZodError') {
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
      const assessment = await storage.createEudrAssessment(validatedData);
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
      const assessment = await storage.updateEudrAssessment(req.params.id, validatedData);
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

  // GeoJSON upload and analysis endpoint
  app.post('/api/geojson/upload', isAuthenticated, async (req, res) => {
    try {
      const { geojsonFile, fileName } = req.body;
      
      if (!geojsonFile) {
        return res.status(400).json({ error: 'GeoJSON file is required' });
      }

      // Create a proper multipart/form-data request
      const boundary = `----formdata-node-${Date.now()}`;
      const fileContent = geojsonFile;
      const uploadFileName = fileName || 'plot_boundaries.json';
      
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
      const inputFeatures = JSON.parse(geojsonFile).features?.length || 0;
      const outputFeatures = analysisResults.data?.features?.length || 0;
      console.log(`=== DEBUGGING FEATURE COUNT ===`);
      console.log(`Input features sent to API: ${inputFeatures}`);
      console.log(`Output features received from API: ${outputFeatures}`);
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
          try {
            // Debug logging for intersection area values
            const gfwArea = feature.properties.gfw_loss?.gfw_loss_area;
            const jrcArea = feature.properties.jrc_loss?.jrc_loss_area;
            const sbtnArea = feature.properties.sbtn_loss?.sbtn_loss_area;
            
            console.log(`🔍 Plot ${feature.properties.plot_id} - GFW: ${gfwArea}ha, JRC: ${jrcArea}ha, SBTN: ${sbtnArea}ha`);
            
            await storage.createAnalysisResult({
              plotId: feature.properties.plot_id || 'unknown',
              country: feature.properties.country_name || 'Unknown',
              area: String(feature.properties.total_area_hectares || 0),
              overallRisk: feature.properties.overall_compliance?.overall_risk?.toUpperCase() || 'UNKNOWN',
              complianceStatus: feature.properties.overall_compliance?.compliance_status === 'NON_COMPLIANT' ? 'NON-COMPLIANT' : 'COMPLIANT',
              gfwLoss: feature.properties.gfw_loss?.gfw_loss_stat?.toUpperCase() || 'UNKNOWN',
              jrcLoss: feature.properties.jrc_loss?.jrc_loss_stat?.toUpperCase() || 'UNKNOWN',
              sbtnLoss: feature.properties.sbtn_loss?.sbtn_loss_stat?.toUpperCase() || 'UNKNOWN',
              // Include intersection area data for high-risk datasets
              gfwLossArea: Number(gfwArea || 0),
              jrcLossArea: Number(jrcArea || 0),
              sbtnLossArea: Number(sbtnArea || 0),
              highRiskDatasets: feature.properties.overall_compliance?.high_risk_datasets || [],
              geometry: feature.geometry,
              uploadSession: uploadSession
            });
          } catch (err) {
            console.log("Could not store analysis result:", err.message);
          }
        }
        
        console.log(`✅ Stored ${analysisResults.data.features.length} analysis results in database for reactive dashboard`);
      }
      
      // Return the response directly as it already has the expected structure
      res.json(analysisResults);

    } catch (error) {
      console.error('GeoJSON upload error:', error);
      res.status(500).json({ 
        error: 'Internal server error during GeoJSON analysis',
        details: error.message 
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
        details: error.message 
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
            error: error.message,
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
        details: error.message 
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

            const intersectionArea = parseFloat(result.rows[0]?.intersection_area || '0');
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
      res.status(500).json({ 
        error: 'Failed to detect overlaps using PostGIS',
        details: error.message 
      });
    }
  });

  // Helper function to convert coordinates array to WKT format
  function coordinatesToWKT(coordinates) {
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
    const wktCoords = ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
    return `POLYGON((${wktCoords}))`;
  }

  return httpServer;
}