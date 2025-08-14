import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import { setupAuth, isAuthenticated } from "./auth";
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
  insertMillSchema
} from "@shared/schema";
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

  // Dashboard metrics for backward compatibility
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const plots = await storage.getPlots();
      const facilities = await storage.getFacilities();
      const shipments = await storage.getShipments();
      
      res.json({
        totalPlots: plots.length.toString(),
        compliantPlots: plots.filter(p => p.riskFlags?.length === 0).length.toString(),
        activeFacilities: facilities.filter(f => f.isActive).length.toString(),
        pendingShipments: shipments.filter(s => s.status === 'pending').length.toString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
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

  return httpServer;
}