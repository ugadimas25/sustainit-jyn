import { 
  users, type User, type InsertUser,
  commodities, type Commodity, type InsertCommodity,
  parties, type Party, type InsertParty,
  facilities, type Facility, type InsertFacility,
  lots, type Lot, type InsertLot,
  events, type Event, type InsertEvent,
  eventInputs, type EventInput, type InsertEventInput,
  eventOutputs, type EventOutput, type InsertEventOutput,
  shipments, type Shipment, type InsertShipment,
  supplierLinks, type SupplierLink, type InsertSupplierLink,
  plots, type Plot, type InsertPlot,
  custodyChains, type CustodyChain, type InsertCustodyChain,
  massBalanceRecords, type MassBalanceRecord, type InsertMassBalanceRecord,
  suppliers, type Supplier, type InsertSupplier,
  supplierWorkflowLinks, type SupplierWorkflowLink, type InsertSupplierWorkflowLink,
  workflowShipments, type WorkflowShipment, type InsertWorkflowShipment,
  ddsReports, type DdsReport, type InsertDdsReport,

  mills, type Mill, type InsertMill,
  analysisResults, type AnalysisResult, type InsertAnalysisResult,
  eudrAssessments, type EudrAssessment, type InsertEudrAssessment,
  supplierAssessmentProgress, type SupplierAssessmentProgress, type InsertSupplierAssessmentProgress,
  riskAssessments, type RiskAssessment, type InsertRiskAssessment,
  riskAssessmentItems, type RiskAssessmentItem, type InsertRiskAssessmentItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import MemoryStore from "memorystore";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";

// Enhanced IStorage interface for EPCIS-compliant traceability
export interface IStorage {
  sessionStore: session.Store;

  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Commodity management
  getCommodities(): Promise<Commodity[]>;
  getCommodity(id: string): Promise<Commodity | undefined>;
  createCommodity(insertCommodity: InsertCommodity): Promise<Commodity>;

  // Party management (companies/organizations)
  getParties(): Promise<Party[]>;
  getParty(id: string): Promise<Party | undefined>;
  createParty(insertParty: InsertParty): Promise<Party>;
  updateParty(id: string, updates: Partial<Party>): Promise<Party>;

  // Facility management (physical locations)
  getFacilities(): Promise<Facility[]>;
  getFacility(id: string): Promise<Facility | undefined>;
  getFacilitiesByType(type: string): Promise<Facility[]>;
  createFacility(insertFacility: InsertFacility): Promise<Facility>;
  updateFacility(id: string, updates: Partial<Facility>): Promise<Facility>;

  // Lot management (batches/assets)
  getLots(): Promise<Lot[]>;
  getLot(id: string): Promise<Lot | undefined>;
  getLotsByFacility(facilityId: string): Promise<Lot[]>;
  createLot(insertLot: InsertLot): Promise<Lot>;
  updateLot(id: string, updates: Partial<Lot>): Promise<Lot>;

  // EPCIS Event management
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByFacility(facilityId: string): Promise<Event[]>;
  createEvent(insertEvent: InsertEvent): Promise<Event>;

  // Event Input/Output management
  getEventInputs(eventId: string): Promise<EventInput[]>;
  getEventOutputs(eventId: string): Promise<EventOutput[]>;
  createEventInput(insertEventInput: InsertEventInput): Promise<EventInput>;
  createEventOutput(insertEventOutput: InsertEventOutput): Promise<EventOutput>;

  // Shipment management
  getShipments(): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  createShipment(insertShipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment>;

  // Supply chain relationship management
  getSupplierLinks(): Promise<SupplierLink[]>;
  getSupplierLinksByParty(partyId: string): Promise<SupplierLink[]>;
  createSupplierLink(insertSupplierLink: InsertSupplierLink): Promise<SupplierLink>;

  // Plot management
  getPlots(): Promise<Plot[]>;
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotsByFacility(facilityId: string): Promise<Plot[]>;
  createPlot(insertPlot: InsertPlot): Promise<Plot>;

  // Custody chain management
  getCustodyChains(): Promise<CustodyChain[]>;
  getCustodyChain(id: string): Promise<CustodyChain | undefined>;
  getCustodyChainsByStatus(status: string): Promise<CustodyChain[]>;
  createCustodyChain(insertCustodyChain: InsertCustodyChain): Promise<CustodyChain>;
  updateCustodyChain(id: string, updates: Partial<CustodyChain>): Promise<CustodyChain>;

  // Mass balance management
  getMassBalanceRecords(): Promise<MassBalanceRecord[]>;
  getMassBalanceRecord(id: string): Promise<MassBalanceRecord | undefined>;
  getMassBalanceRecordsByFacility(facilityId: string): Promise<MassBalanceRecord[]>;
  createMassBalanceRecord(insertRecord: InsertMassBalanceRecord): Promise<MassBalanceRecord>;

  // Legacy support
  getSuppliers(): Promise<Supplier[]>;
  getMills(): Promise<Mill[]>;

  // Workflow shipment management
  getWorkflowShipments(): Promise<WorkflowShipment[]>;
  createWorkflowShipment(insertWorkflowShipment: InsertWorkflowShipment): Promise<WorkflowShipment>;

  // Enhanced DDS Reports management for PRD requirements
  getDdsReports(sessionId?: string): Promise<DdsReport[]>;
  getDdsReportById(id: string): Promise<DdsReport | undefined>;
  createDdsReport(insertDdsReport: InsertDdsReport): Promise<DdsReport>;
  updateDdsReport(id: string, updates: Partial<DdsReport>): Promise<DdsReport | undefined>;

  // Session-based DDS management
  getDdsReportsBySession(sessionId: string): Promise<DdsReport[]>;
  updateDdsReportStatus(id: string, status: string): Promise<DdsReport | undefined>;
  updateDdsReportPdfPath(id: string, pdfPath: string, fileName: string): Promise<DdsReport | undefined>;

  // GeoJSON validation and metadata
  validateDdsGeojson(id: string, geojson: any): Promise<{
    valid: boolean;
    error?: string;
    metadata?: {
      area: number;
      boundingBox: { north: number, south: number, east: number, west: number };
      centroid: { lat: number, lng: number };
    };
  }>;

  // Available plots for selection
  getAvailablePlots(): Promise<Array<{
    id: string;
    name: string;
    location: string;
    area: number;
    geojson: any;
  }>>;


  // Estate Data Collection management
  getEstateDataCollection(): Promise<import("@shared/schema").EstateDataCollection[]>;
  getEstateDataCollectionById(id: string): Promise<import("@shared/schema").EstateDataCollection | undefined>;
  createEstateDataCollection(insertEstateData: import("@shared/schema").InsertEstateDataCollection): Promise<import("@shared/schema").EstateDataCollection>;
  updateEstateDataCollection(id: string, updates: Partial<import("@shared/schema").EstateDataCollection>): Promise<import("@shared/schema").EstateDataCollection | undefined>;
  deleteEstateDataCollection(id: string): Promise<boolean>;

  // Mill Data Collection management
  getMillDataCollection(): Promise<import("@shared/schema").MillDataCollection[]>;
  getMillDataCollectionById(id: string): Promise<import("@shared/schema").MillDataCollection | undefined>;
  createMillDataCollection(insertMillData: import("@shared/schema").InsertMillDataCollection): Promise<import("@shared/schema").MillDataCollection>;
  updateMillDataCollection(id: string, updates: Partial<import("@shared/schema").MillDataCollection>): Promise<import("@shared/schema").MillDataCollection | undefined>;
  deleteMillDataCollection(id: string): Promise<boolean>;

  // Traceability Data Collection methods
  getTraceabilityDataCollections(): Promise<import("@shared/schema").TraceabilityDataCollection[]>;
  getTraceabilityDataCollectionById(id: string): Promise<import("@shared/schema").TraceabilityDataCollection | undefined>;
  createTraceabilityDataCollection(insertData: import("@shared/schema").InsertTraceabilityDataCollection): Promise<import("@shared/schema").TraceabilityDataCollection>;

  // KCP Data Collection methods
  getKcpDataCollections(): Promise<import("@shared/schema").KcpDataCollection[]>;
  getKcpDataCollectionById(id: string): Promise<import("@shared/schema").KcpDataCollection | undefined>;
  createKcpDataCollection(insertData: import("@shared/schema").InsertKcpDataCollection): Promise<import("@shared/schema").KcpDataCollection>;

  // Bulking Data Collection methods
  getBulkingDataCollections(): Promise<import("@shared/schema").BulkingDataCollection[]>;
  getBulkingDataCollectionById(id: string): Promise<import("@shared/schema").BulkingDataCollection | undefined>;
  createBulkingDataCollection(insertData: import("@shared/schema").InsertBulkingDataCollection): Promise<import("@shared/schema").BulkingDataCollection>;

  // EUDR Assessment methods
  getEudrAssessments(): Promise<EudrAssessment[]>;
  getEudrAssessment(id: string): Promise<EudrAssessment | undefined>;
  createEudrAssessment(insertEudrAssessment: InsertEudrAssessment): Promise<EudrAssessment>;
  updateEudrAssessment(id: string, updates: Partial<EudrAssessment>): Promise<EudrAssessment>;
  deleteEudrAssessment(id: string): Promise<void>;

  // Analysis Results management
  getAnalysisResults(): Promise<AnalysisResult[]>;
  getAnalysisResult(id: string): Promise<AnalysisResult | undefined>;
  getAnalysisResultsBySession(uploadSession: string): Promise<AnalysisResult[]>;
  createAnalysisResult(insertAnalysisResult: InsertAnalysisResult): Promise<AnalysisResult>;
  updateAnalysisResultGeometry(plotId: string, coordinates: number[][]): Promise<AnalysisResult | undefined>;
  clearAnalysisResults(): Promise<void>;
  calculateDashboardMetrics(): Promise<{
    totalPlots: string;
    compliantPlots: string;
    highRiskPlots: string;
    mediumRiskPlots: string;
    deforestedPlots: string;
    totalArea: string;
  }>;

  // Supplier Assessment Progress management
  getSupplierAssessmentProgress(): Promise<SupplierAssessmentProgress[]>;
  getSupplierAssessmentProgressByName(supplierName: string): Promise<SupplierAssessmentProgress | undefined>;
  createSupplierAssessmentProgress(insertProgress: InsertSupplierAssessmentProgress): Promise<SupplierAssessmentProgress>;
  updateSupplierAssessmentProgress(id: string, updates: Partial<SupplierAssessmentProgress>): Promise<SupplierAssessmentProgress | undefined>;
  updateSupplierWorkflowStep(supplierName: string, step: number, completed: boolean, referenceId?: string): Promise<SupplierAssessmentProgress | undefined>;
  checkSupplierStepAccess(supplierName: string, requestedStep: number): Promise<boolean>;

  // Risk Assessment management
  getRiskAssessments(): Promise<RiskAssessment[]>;
  getRiskAssessment(id: string): Promise<RiskAssessment | undefined>;
  getRiskAssessmentBySupplier(supplierId: string): Promise<RiskAssessment[]>;
  createRiskAssessment(insertRiskAssessment: InsertRiskAssessment): Promise<RiskAssessment>;
  updateRiskAssessment(id: string, updates: Partial<RiskAssessment>): Promise<RiskAssessment | undefined>;
  deleteRiskAssessment(id: string): Promise<boolean>;

  // Risk Assessment Items management
  getRiskAssessmentItems(assessmentId: string): Promise<RiskAssessmentItem[]>;
  getRiskAssessmentItem(id: string): Promise<RiskAssessmentItem | undefined>;
  createRiskAssessmentItem(insertItem: InsertRiskAssessmentItem): Promise<RiskAssessmentItem>;
  updateRiskAssessmentItem(id: string, updates: Partial<RiskAssessmentItem>): Promise<RiskAssessmentItem | undefined>;
  deleteRiskAssessmentItem(id: string): Promise<boolean>;

  // Risk scoring and classification utilities
  calculateRiskScore(assessmentId: string): Promise<{ overallScore: number; riskClassification: string; }>;
  generateRiskReport(assessmentId: string): Promise<any>;

  // ========================================
  // DASHBOARD COMPLIANCE PRD - PHASE 1: FILTERED AGGREGATION METHODS
  // ========================================

  // Dashboard metrics with optional filters
  getDashboardMetrics(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").DashboardMetrics>;

  // Risk and legality split aggregations 
  getRiskSplit(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").RiskSplit>;
  getLegalitySplit(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").LegalitySplit>;

  // Supplier compliance table data
  getSupplierCompliance(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").SupplierSummary[]>;

  // Alert management for dashboard
  getDashboardAlerts(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").Alert[]>;

  // Compliance trend data (12 months)
  getComplianceTrend(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").ComplianceTrendPoint[]>;

  // Export functionality
  getExportData(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").ExportData>;

  // Plot summaries for detailed views and drill-downs
  getPlotSummaries(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").PlotSummary[]>;
}

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Use database session store in production, memory store in development
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      const PgSession = ConnectPgSimple(session);
      this.sessionStore = new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session',
        createTableIfMissing: true,
      });
    } else {
      // Fallback to memory store for development
      this.sessionStore = new (MemoryStore(session))({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Commodity management
  async getCommodities(): Promise<Commodity[]> {
    return await db.select().from(commodities).orderBy(commodities.name);
  }

  async getCommodity(id: string): Promise<Commodity | undefined> {
    const [commodity] = await db.select().from(commodities).where(eq(commodities.id, id));
    return commodity || undefined;
  }

  async createCommodity(insertCommodity: InsertCommodity): Promise<Commodity> {
    const [commodity] = await db
      .insert(commodities)
      .values(insertCommodity)
      .returning();
    return commodity;
  }

  // Party management
  async getParties(): Promise<Party[]> {
    return await db.select().from(parties).orderBy(parties.name);
  }

  async getParty(id: string): Promise<Party | undefined> {
    const [party] = await db.select().from(parties).where(eq(parties.id, id));
    return party || undefined;
  }

  async createParty(insertParty: InsertParty): Promise<Party> {
    const [party] = await db
      .insert(parties)
      .values(insertParty)
      .returning();
    return party;
  }

  async updateParty(id: string, updates: Partial<Party>): Promise<Party> {
    const [party] = await db
      .update(parties)
      .set(updates)
      .where(eq(parties.id, id))
      .returning();
    return party;
  }

  // Facility management
  async getFacilities(): Promise<Facility[]> {
    return await db.select().from(facilities).orderBy(facilities.name);
  }

  async getFacility(id: string): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility || undefined;
  }

  async getFacilitiesByType(type: string): Promise<Facility[]> {
    return await db.select().from(facilities).where(eq(facilities.type, type as any));
  }

  async createFacility(insertFacility: InsertFacility): Promise<Facility> {
    const [facility] = await db
      .insert(facilities)
      .values(insertFacility)
      .returning();
    return facility;
  }

  async updateFacility(id: string, updates: Partial<Facility>): Promise<Facility> {
    const [facility] = await db
      .update(facilities)
      .set(updates)
      .where(eq(facilities.id, id))
      .returning();
    return facility;
  }

  // Lot management
  async getLots(): Promise<Lot[]> {
    return await db.select().from(lots).orderBy(desc(lots.createdAt));
  }

  async getLot(id: string): Promise<Lot | undefined> {
    const [lot] = await db.select().from(lots).where(eq(lots.id, id));
    return lot || undefined;
  }

  async getLotsByFacility(facilityId: string): Promise<Lot[]> {
    return await db.select().from(lots).where(eq(lots.ownerFacilityId, facilityId));
  }

  async createLot(insertLot: InsertLot): Promise<Lot> {
    const [lot] = await db
      .insert(lots)
      .values(insertLot)
      .returning();
    return lot;
  }

  async updateLot(id: string, updates: Partial<Lot>): Promise<Lot> {
    const [lot] = await db
      .update(lots)
      .set(updates)
      .where(eq(lots.id, id))
      .returning();
    return lot;
  }

  // EPCIS Event management
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.occurredAt));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByFacility(facilityId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.readPointFacilityId, facilityId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Event Input/Output management
  async getEventInputs(eventId: string): Promise<EventInput[]> {
    return await db.select().from(eventInputs).where(eq(eventInputs.eventId, eventId));
  }

  async getEventOutputs(eventId: string): Promise<EventOutput[]> {
    return await db.select().from(eventOutputs).where(eq(eventOutputs.eventId, eventId));
  }

  async createEventInput(insertEventInput: InsertEventInput): Promise<EventInput> {
    const [input] = await db
      .insert(eventInputs)
      .values(insertEventInput)
      .returning();
    return input;
  }

  async createEventOutput(insertEventOutput: InsertEventOutput): Promise<EventOutput> {
    const [output] = await db
      .insert(eventOutputs)
      .values(insertEventOutput)
      .returning();
    return output;
  }

  // Shipment management
  async getShipments(): Promise<Shipment[]> {
    return await db.select().from(shipments).orderBy(desc(shipments.createdAt));
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment || undefined;
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const [shipment] = await db
      .insert(shipments)
      .values(insertShipment)
      .returning();
    return shipment;
  }

  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const [shipment] = await db
      .update(shipments)
      .set(updates)
      .where(eq(shipments.id, id))
      .returning();
    return shipment;
  }

  // Supply chain relationship management
  async getSupplierLinks(): Promise<SupplierLink[]> {
    return await db.select().from(supplierLinks).orderBy(supplierLinks.tier);
  }

  async getSupplierLinksByParty(partyId: string): Promise<SupplierLink[]> {
    return await db.select().from(supplierLinks).where(
      or(eq(supplierLinks.fromPartyId, partyId), eq(supplierLinks.toPartyId, partyId))
    );
  }

  async createSupplierLink(insertSupplierLink: InsertSupplierLink): Promise<SupplierLink> {
    const [link] = await db
      .insert(supplierLinks)
      .values(insertSupplierLink)
      .returning();
    return link;
  }

  // Plot management
  async getPlots(): Promise<Plot[]> {
    return await db.select().from(plots).orderBy(plots.plotId);
  }

  async getPlot(id: string): Promise<Plot | undefined> {
    const [plot] = await db.select().from(plots).where(eq(plots.id, id));
    return plot || undefined;
  }

  async getPlotsByFacility(facilityId: string): Promise<Plot[]> {
    return await db.select().from(plots).where(eq(plots.facilityId, facilityId));
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const [plot] = await db
      .insert(plots)
      .values(insertPlot)
      .returning();
    return plot;
  }

  // Custody chain management
  async getCustodyChains(): Promise<CustodyChain[]> {
    return await db.select().from(custodyChains).orderBy(desc(custodyChains.createdAt));
  }

  async getCustodyChain(id: string): Promise<CustodyChain | undefined> {
    const [chain] = await db.select().from(custodyChains).where(eq(custodyChains.id, id));
    return chain || undefined;
  }

  async getCustodyChainsByStatus(status: string): Promise<CustodyChain[]> {
    return await db.select().from(custodyChains).where(eq(custodyChains.status, status));
  }

  async createCustodyChain(insertCustodyChain: InsertCustodyChain): Promise<CustodyChain> {
    const [chain] = await db
      .insert(custodyChains)
      .values(insertCustodyChain)
      .returning();
    return chain;
  }

  async updateCustodyChain(id: string, updates: Partial<CustodyChain>): Promise<CustodyChain> {
    const [chain] = await db
      .update(custodyChains)
      .set(updates)
      .where(eq(custodyChains.id, id))
      .returning();
    return chain;
  }

  // Mass balance management
  async getMassBalanceRecords(): Promise<MassBalanceRecord[]> {
    return await db.select().from(massBalanceRecords).orderBy(desc(massBalanceRecords.createdAt));
  }

  async getMassBalanceRecord(id: string): Promise<MassBalanceRecord | undefined> {
    const [record] = await db.select().from(massBalanceRecords).where(eq(massBalanceRecords.id, id));
    return record || undefined;
  }

  async getMassBalanceRecordsByFacility(facilityId: string): Promise<MassBalanceRecord[]> {
    return await db.select().from(massBalanceRecords).where(eq(massBalanceRecords.facilityId, facilityId));
  }

  async createMassBalanceRecord(insertRecord: InsertMassBalanceRecord): Promise<MassBalanceRecord> {
    const [record] = await db
      .insert(massBalanceRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  // Enhanced supplier methods for workflow
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(suppliers.companyName);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    // Set name field for backward compatibility
    const supplierData = {
      ...insertSupplier,
      name: insertSupplier.companyName,
      supplierType: insertSupplier.businessType,
    };
    const [supplier] = await db.insert(suppliers).values(supplierData).returning();
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Supplier workflow link methods
  async getSupplierWorkflowLinks(): Promise<SupplierWorkflowLink[]> {
    return await db.select().from(supplierWorkflowLinks);
  }

  async createSupplierWorkflowLink(insertLink: InsertSupplierWorkflowLink): Promise<SupplierWorkflowLink> {
    // Calculate tiers based on parent/child relationship
    const parentSupplier = await db.select().from(suppliers).where(eq(suppliers.id, insertLink.parentSupplierId)).limit(1);
    const childSupplier = await db.select().from(suppliers).where(eq(suppliers.id, insertLink.childSupplierId)).limit(1);

    const parentTier = parentSupplier[0]?.tier || 1;
    const childTier = childSupplier[0]?.tier || 1;

    const [link] = await db.insert(supplierWorkflowLinks).values({
      ...insertLink,
      parentTier,
      childTier,
    }).returning();
    return link;
  }

  async deleteSupplierWorkflowLink(id: string): Promise<boolean> {
    const result = await db.delete(supplierWorkflowLinks).where(eq(supplierWorkflowLinks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Workflow shipment methods
  async getWorkflowShipments(): Promise<WorkflowShipment[]> {
    return await db.select().from(workflowShipments);
  }

  async createWorkflowShipment(insertShipment: InsertWorkflowShipment): Promise<WorkflowShipment> {
    const [shipment] = await db.insert(workflowShipments).values(insertShipment).returning();
    return shipment;
  }

  async updateWorkflowShipment(id: string, updates: Partial<InsertWorkflowShipment>): Promise<WorkflowShipment | undefined> {
    const [shipment] = await db
      .update(workflowShipments)
      .set(updates)
      .where(eq(workflowShipments.id, id))
      .returning();
    return shipment;
  }

  async deleteWorkflowShipment(id: string): Promise<boolean> {
    const result = await db.delete(workflowShipments).where(eq(workflowShipments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getMills(): Promise<Mill[]> {
    return await db.select().from(mills).orderBy(mills.name);
  }

  // DDS Reports management
  async getDdsReports(): Promise<DdsReport[]> {
    return await db.select().from(ddsReports).orderBy(desc(ddsReports.createdAt));
  }

  async getDdsReportById(id: string): Promise<DdsReport | undefined> {
    const [report] = await db.select().from(ddsReports).where(eq(ddsReports.id, id));
    return report || undefined;
  }

  async createDdsReport(insertDdsReport: InsertDdsReport): Promise<DdsReport> {
    const [report] = await db
      .insert(ddsReports)
      .values(insertDdsReport)
      .returning();
    return report;
  }

  async updateDdsReport(id: string, updates: Partial<DdsReport>): Promise<DdsReport | undefined> {
    const [updatedReport] = await db
      .update(ddsReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ddsReports.id, id))
      .returning();
    return updatedReport || undefined;
  }

  // Session-based DDS management
  async getDdsReportsBySession(sessionId: string): Promise<DdsReport[]> {
    return await db.select().from(ddsReports).where(eq(ddsReports.sessionId, sessionId)).orderBy(desc(ddsReports.createdAt));
  }

  async updateDdsReportStatus(id: string, status: string): Promise<DdsReport | undefined> {
    const [updatedReport] = await db
      .update(ddsReports)
      .set({ status, updatedAt: new Date() })
      .where(eq(ddsReports.id, id))
      .returning();
    return updatedReport || undefined;
  }

  async updateDdsReportPdfPath(id: string, pdfPath: string, fileName: string): Promise<DdsReport | undefined> {
    const [updatedReport] = await db
      .update(ddsReports)
      .set({ pdfDocumentPath: pdfPath, updatedAt: new Date() })
      .where(eq(ddsReports.id, id))
      .returning();
    return updatedReport || undefined;
  }

  // GeoJSON validation and metadata
  async validateDdsGeojson(id: string, geojson: any): Promise<{
    valid: boolean;
    error?: string;
    metadata?: {
      area: number;
      boundingBox: { north: number, south: number, east: number, west: number };
      centroid: { lat: number, lng: number };
    };
  }> {
    try {
      if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
        return { valid: false, error: "Invalid GeoJSON format: missing or invalid features array" };
      }

      if (geojson.features.length === 0) {
        return { valid: false, error: "GeoJSON has no features" };
      }

      let totalArea = 0;
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

      for (const feature of geojson.features) {
        if (!feature.geometry || !feature.geometry.coordinates) {
          return { valid: false, error: "Feature missing geometry or coordinates" };
        }

        // Simple area calculation (approximation)
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          if (coords.length < 4) {
            return { valid: false, error: "Polygon must have at least 4 coordinates" };
          }

          // Update bounding box
          for (const coord of coords) {
            const [lng, lat] = coord;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          }

          // Simple area calculation (not accurate for large polygons)
          totalArea += Math.abs((maxLng - minLng) * (maxLat - minLat)) * 111320 * 111320; // rough m² conversion
        }
      }

      const centroid = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      };

      return {
        valid: true,
        metadata: {
          area: totalArea,
          boundingBox: { north: maxLat, south: minLat, east: maxLng, west: minLng },
          centroid
        }
      };
    } catch (error) {
      return { valid: false, error: `GeoJSON validation error: ${error}` };
    }
  }

  // Available plots for selection
  async getAvailablePlots(): Promise<Array<{
    id: string;
    name: string;
    location: string;
    area: number;
    geojson: any;
  }>> {
    try {
      const plotList = await db.select().from(plots).limit(50);
      return plotList.map(plot => ({
        id: plot.id,
        name: plot.plotId || `Plot ${plot.id}`,
        location: plot.crop || 'Unknown',
        area: parseFloat(plot.areaHa?.toString() || '0'),
        geojson: plot.polygon ? JSON.parse(plot.polygon) : null
      }));
    } catch (error) {
      console.error("Error getting available plots:", error);
      return [];
    }
  }

  // Estate Data Collection management
  async getEstateDataCollection(): Promise<import("@shared/schema").EstateDataCollection[]> {
    try {
      const { estateDataCollection } = await import("@shared/schema");
      return await db.select().from(estateDataCollection).orderBy(desc(estateDataCollection.createdAt));
    } catch (error) {
      console.error("Error getting estate data collections:", error);
      return [];
    }
  }

  async getEstateDataCollectionById(id: string): Promise<import("@shared/schema").EstateDataCollection | undefined> {
    try {
      const { estateDataCollection } = await import("@shared/schema");
      const [result] = await db.select().from(estateDataCollection).where(eq(estateDataCollection.id, id));
      return result || undefined;
    } catch (error) {
      console.error("Error getting estate data collection by id:", error);
      return undefined;
    }
  }

  async createEstateDataCollection(insertEstateData: import("@shared/schema").InsertEstateDataCollection): Promise<import("@shared/schema").EstateDataCollection> {
    try {
      const { estateDataCollection } = await import("@shared/schema");
      const [result] = await db
        .insert(estateDataCollection)
        .values(insertEstateData)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating estate data collection:", error);
      throw error;
    }
  }

  async updateEstateDataCollection(id: string, updates: Partial<import("@shared/schema").EstateDataCollection>): Promise<import("@shared/schema").EstateDataCollection | undefined> {
    try {
      const { estateDataCollection } = await import("@shared/schema");
      const [result] = await db
        .update(estateDataCollection)
        .set(updates)
        .where(eq(estateDataCollection.id, id))
        .returning();
      return result || undefined;
    } catch (error) {
      console.error("Error updating estate data collection:", error);
      return undefined;
    }
  }

  async deleteEstateDataCollection(id: string): Promise<boolean> {
    try {
      const { estateDataCollection } = await import("@shared/schema");
      const result = await db.delete(estateDataCollection).where(eq(estateDataCollection.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting estate data collection:", error);
      return false;
    }
  }

  // Mill Data Collection management
  async getMillDataCollection(): Promise<import("@shared/schema").MillDataCollection[]> {
    try {
      const { millDataCollection } = await import("@shared/schema");
      return await db.select().from(millDataCollection).orderBy(desc(millDataCollection.createdAt));
    } catch (error) {
      console.error("Error getting mill data collections:", error);
      return [];
    }
  }

  async getMillDataCollectionById(id: string): Promise<import("@shared/schema").MillDataCollection | undefined> {
    try {
      const { millDataCollection } = await import("@shared/schema");
      const [result] = await db.select().from(millDataCollection).where(eq(millDataCollection.id, id));
      return result || undefined;
    } catch (error) {
      console.error("Error getting mill data collection by id:", error);
      return undefined;
    }
  }

  async createMillDataCollection(insertMillData: import("@shared/schema").InsertMillDataCollection): Promise<import("@shared/schema").MillDataCollection> {
    try {
      const { millDataCollection } = await import("@shared/schema");
      const [result] = await db
        .insert(millDataCollection)
        .values(insertMillData)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating mill data collection:", error);
      throw error;
    }
  }

  async updateMillDataCollection(id: string, updates: Partial<import("@shared/schema").MillDataCollection>): Promise<import("@shared/schema").MillDataCollection | undefined> {
    try {
      const { millDataCollection } = await import("@shared/schema");
      const [result] = await db
        .update(millDataCollection)
        .set(updates)
        .where(eq(millDataCollection.id, id))
        .returning();
      return result || undefined;
    } catch (error) {
      console.error("Error updating mill data collection:", error);
      return undefined;
    }
  }

  async deleteMillDataCollection(id: string): Promise<boolean> {
    try {
      const { millDataCollection } = await import("@shared/schema");
      const result = await db.delete(millDataCollection).where(eq(millDataCollection.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting mill data collection:", error);
      return false;
    }
  }

  // Traceability Data Collection methods
  async getTraceabilityDataCollections(): Promise<import("@shared/schema").TraceabilityDataCollection[]> {
    try {
      const { traceabilityDataCollection } = await import("@shared/schema");
      return await db.select().from(traceabilityDataCollection).orderBy(desc(traceabilityDataCollection.createdAt));
    } catch (error) {
      console.error("Error getting traceability data collections:", error);
      return [];
    }
  }

  async getTraceabilityDataCollectionById(id: string): Promise<import("@shared/schema").TraceabilityDataCollection | undefined> {
    try {
      const { traceabilityDataCollection } = await import("@shared/schema");
      const [result] = await db.select().from(traceabilityDataCollection).where(eq(traceabilityDataCollection.id, parseInt(id)));
      return result || undefined;
    } catch (error) {
      console.error("Error getting traceability data collection by id:", error);
      return undefined;
    }
  }

  async createTraceabilityDataCollection(insertData: import("@shared/schema").InsertTraceabilityDataCollection): Promise<import("@shared/schema").TraceabilityDataCollection> {
    try {
      const { traceabilityDataCollection } = await import("@shared/schema");
      const [result] = await db
        .insert(traceabilityDataCollection)
        .values(insertData)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating traceability data collection:", error);
      throw error;
    }
  }

  // KCP Data Collection methods
  async getKcpDataCollections(): Promise<import("@shared/schema").KcpDataCollection[]> {
    try {
      const { kcpDataCollection } = await import("@shared/schema");
      return await db.select().from(kcpDataCollection).orderBy(desc(kcpDataCollection.createdAt));
    } catch (error) {
      console.error("Error getting KCP data collections:", error);
      return [];
    }
  }

  async getKcpDataCollectionById(id: string): Promise<import("@shared/schema").KcpDataCollection | undefined> {
    try {
      const { kcpDataCollection } = await import("@shared/schema");
      const [result] = await db.select().from(kcpDataCollection).where(eq(kcpDataCollection.id, parseInt(id)));
      return result || undefined;
    } catch (error) {
      console.error("Error getting KCP data collection by id:", error);
      return undefined;
    }
  }

  async createKcpDataCollection(insertData: import("@shared/schema").InsertKcpDataCollection): Promise<import("@shared/schema").KcpDataCollection> {
    try {
      const { kcpDataCollection } = await import("@shared/schema");
      const [result] = await db
        .insert(kcpDataCollection)
        .values(insertData)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating KCP data collection:", error);
      throw error;
    }
  }

  // Bulking Data Collection methods
  async getBulkingDataCollections(): Promise<import("@shared/schema").BulkingDataCollection[]> {
    try {
      const { bulkingDataCollection } = await import("@shared/schema");
      return await db.select().from(bulkingDataCollection).orderBy(desc(bulkingDataCollection.createdAt));
    } catch (error) {
      console.error("Error getting bulking data collections:", error);
      return [];
    }
  }

  async getBulkingDataCollectionById(id: string): Promise<import("@shared/schema").BulkingDataCollection | undefined> {
    try {
      const { bulkingDataCollection } = await import("@shared/schema");
      const [result] = await db.select().from(bulkingDataCollection).where(eq(bulkingDataCollection.id, parseInt(id)));
      return result || undefined;
    } catch (error) {
      console.error("Error getting bulking data collection by id:", error);
      return undefined;
    }
  }

  async createBulkingDataCollection(insertData: import("@shared/schema").InsertBulkingDataCollection): Promise<import("@shared/schema").BulkingDataCollection> {
    try {
      const { bulkingDataCollection } = await import("@shared/schema");
      const [result] = await db
        .insert(bulkingDataCollection)
        .values(insertData)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating bulking data collection:", error);
      throw error;
    }
  }

  // EUDR Assessment implementation
  async getEudrAssessments(): Promise<EudrAssessment[]> {
    return await db.select().from(eudrAssessments).orderBy(desc(eudrAssessments.updatedAt));
  }

  async getEudrAssessment(id: string): Promise<EudrAssessment | undefined> {
    const [assessment] = await db.select().from(eudrAssessments).where(eq(eudrAssessments.id, id));
    return assessment || undefined;
  }

  async createEudrAssessment(insertEudrAssessment: InsertEudrAssessment): Promise<EudrAssessment> {
    const [assessment] = await db
      .insert(eudrAssessments)
      .values(insertEudrAssessment)
      .returning();
    return assessment;
  }

  async updateEudrAssessment(id: string, updates: Partial<EudrAssessment>): Promise<EudrAssessment> {
    const [assessment] = await db
      .update(eudrAssessments)
      .set({ ...updates, updatedAt: sql`NOW()` })
      .where(eq(eudrAssessments.id, id))
      .returning();
    return assessment;
  }

  async deleteEudrAssessment(id: string): Promise<void> {
    await db.delete(eudrAssessments).where(eq(eudrAssessments.id, id));
  }

  // Analysis Results management
  async getAnalysisResults(): Promise<AnalysisResult[]> {
    try {
      return await db.select().from(analysisResults).orderBy(desc(analysisResults.createdAt));
    } catch (error) {
      console.error("Error getting analysis results:", error);
      return [];
    }
  }

  async getAnalysisResult(id: string): Promise<AnalysisResult | undefined> {
    try {
      const [result] = await db.select().from(analysisResults).where(eq(analysisResults.id, id));
      return result || undefined;
    } catch (error) {
      console.error("Error getting analysis result by id:", error);
      return undefined;
    }
  }

  async getAnalysisResultsBySession(uploadSession: string): Promise<AnalysisResult[]> {
    try {
      return await db.select().from(analysisResults).where(eq(analysisResults.uploadSession, uploadSession));
    } catch (error) {
      console.error("Error getting analysis results by session:", error);
      return [];
    }
  }

  async createAnalysisResult(insertAnalysisResult: InsertAnalysisResult): Promise<AnalysisResult> {
    try {
      const dataToInsert = {
        ...insertAnalysisResult,
        peatlandOverlap: insertAnalysisResult.peatlandOverlap || 'UNKNOWN',
        updatedAt: new Date()
      };

      const [result] = await db
        .insert(analysisResults)
        .values(dataToInsert)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating analysis result:", error);
      throw error;
    }
  }

  async updateAnalysisResultGeometry(plotId: string, coordinates: number[][]): Promise<AnalysisResult | undefined> {
    try {
      // Frontend already sends coordinates in correct [lng, lat] format
      const geoJsonCoordinates = [coordinates]; // Use coordinates as-is
      const geometry = {
        type: 'Polygon',
        coordinates: geoJsonCoordinates
      };

      const [updatedResult] = await db
        .update(analysisResults)
        .set({ 
          geometry: geometry
        })
        .where(eq(analysisResults.plotId, plotId))
        .returning();

      console.log(`✓ Updated geometry for ${plotId} with ${coordinates.length} coordinates`);
      return updatedResult;
    } catch (error) {
      console.error("Error updating analysis result geometry:", error);
      return undefined;
    }
  }

  async clearAnalysisResults(): Promise<void> {
    try {
      await db.delete(analysisResults);
    } catch (error) {
      console.error("Error clearing analysis results:", error);
      throw error;
    }
  }

  async calculateDashboardMetrics(): Promise<{
    totalPlots: string;
    compliantPlots: string;
    highRiskPlots: string;
    mediumRiskPlots: string;
    deforestedPlots: string;
    totalArea: string;
  }> {
    try {
      const results = await this.getAnalysisResults();

      const totalPlots = results.length;
      const compliantPlots = results.filter(r => r.complianceStatus === 'COMPLIANT').length;
      const highRiskPlots = results.filter(r => r.overallRisk === 'HIGH').length;
      const mediumRiskPlots = results.filter(r => r.overallRisk === 'MEDIUM').length;
      const deforestedPlots = results.filter(r => 
        r.highRiskDatasets?.includes('GFW Forest Loss') || 
        r.highRiskDatasets?.includes('JRC Forest Loss')
      ).length;
      const totalArea = results.reduce((sum, r) => sum + Number(r.area), 0).toFixed(2);

      return {
        totalPlots: totalPlots.toString(),
        compliantPlots: compliantPlots.toString(),
        highRiskPlots: highRiskPlots.toString(),
        mediumRiskPlots: mediumRiskPlots.toString(),
        deforestedPlots: deforestedPlots.toString(),
        totalArea: totalArea
      };
    } catch (error) {
      console.error("Error calculating dashboard metrics:", error);
      // Return default values if calculation fails
      return {
        totalPlots: "0",
        compliantPlots: "0", 
        highRiskPlots: "0",
        mediumRiskPlots: "0",
        deforestedPlots: "0",
        totalArea: "0"
      };
    }
  }

  // Supplier Assessment Progress methods
  async getSupplierAssessmentProgress(): Promise<SupplierAssessmentProgress[]> {
    return await db.select().from(supplierAssessmentProgress).orderBy(supplierAssessmentProgress.supplierName);
  }

  async getSupplierAssessmentProgressByName(supplierName: string): Promise<SupplierAssessmentProgress | undefined> {
    const [progress] = await db
      .select()
      .from(supplierAssessmentProgress)
      .where(eq(supplierAssessmentProgress.supplierName, supplierName))
      .limit(1);
    return progress || undefined;
  }

  async createSupplierAssessmentProgress(insertProgress: InsertSupplierAssessmentProgress): Promise<SupplierAssessmentProgress> {
    const [progress] = await db
      .insert(supplierAssessmentProgress)
      .values(insertProgress)
      .returning();
    return progress;
  }

  async updateSupplierAssessmentProgress(id: string, updates: Partial<SupplierAssessmentProgress>): Promise<SupplierAssessmentProgress | undefined> {
    const [progress] = await db
      .update(supplierAssessmentProgress)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(supplierAssessmentProgress.id, id))
      .returning();
    return progress || undefined;
  }

  async updateSupplierWorkflowStep(supplierName: string, step: number, completed: boolean, referenceId?: string): Promise<SupplierAssessmentProgress | undefined> {
    try {
      // First, get or create the progress record
      let progress = await this.getSupplierAssessmentProgressByName(supplierName);

      if (!progress) {
        // Create new progress record
        progress = await this.createSupplierAssessmentProgress({
          supplierName,
          supplierType: 'Estate', // Default type, should be updated based on actual data
          currentStep: step,
        });
      }

      // Update the specific step completion status
      const updates: Partial<SupplierAssessmentProgress> = {
        currentStep: Math.max(progress.currentStep || 1, step),
        updatedAt: sql`now()` as any,
      };

      if (step === 1) {
        updates.dataCollectionCompleted = completed;
        if (completed) {
          updates.dataCollectionCompletedAt = sql`now()` as any;
          updates.dataCollectionId = referenceId;
        }
      } else if (step === 2) {
        updates.legalityComplianceCompleted = completed;
        if (completed) {
          updates.legalityComplianceCompletedAt = sql`now()` as any;
          updates.legalityComplianceId = referenceId;
        }
      } else if (step === 3) {
        updates.riskAssessmentCompleted = completed;
        if (completed) {
          updates.riskAssessmentCompletedAt = sql`now()` as any;
          updates.riskAssessmentId = referenceId;
        }
      }

      // Check if all steps are completed
      const isDataCompleted = step === 1 ? completed : progress.dataCollectionCompleted;
      const isLegalityCompleted = step === 2 ? completed : progress.legalityComplianceCompleted;
      const isRiskCompleted = step === 3 ? completed : progress.riskAssessmentCompleted;

      if (isDataCompleted && isLegalityCompleted && isRiskCompleted) {
        updates.workflowCompleted = true;
        updates.workflowCompletedAt = sql`now()` as any;
      }

      return await this.updateSupplierAssessmentProgress(progress.id, updates);
    } catch (error) {
      console.error("Error updating supplier workflow step:", error);
      return undefined;
    }
  }

  async checkSupplierStepAccess(supplierName: string, requestedStep: number): Promise<boolean> {
    try {
      const progress = await this.getSupplierAssessmentProgressByName(supplierName);

      if (!progress) {
        // No progress record - only allow step 1 (Data Collection)
        return requestedStep === 1;
      }

      // Step 1 (Data Collection) is always accessible
      if (requestedStep === 1) {
        return true;
      }

      // Step 2 (Legality Compliance) requires Data Collection to be completed
      if (requestedStep === 2) {
        return progress.dataCollectionCompleted || false;
      }

      // Step 3 (Risk Assessment) requires both Data Collection and Legality Compliance to be completed
      if (requestedStep === 3) {
        return (progress.dataCollectionCompleted || false) && (progress.legalityComplianceCompleted || false);
      }

      return false;
    } catch (error) {
      console.error("Error checking supplier step access:", error);
      return false;
    }
  }

  // Risk Assessment methods implementation
  async getRiskAssessments(): Promise<RiskAssessment[]> {
    return await db.select().from(riskAssessments).orderBy(desc(riskAssessments.assessmentDate));
  }

  async getRiskAssessment(id: string): Promise<RiskAssessment | undefined> {
    const [assessment] = await db.select().from(riskAssessments).where(eq(riskAssessments.id, id));
    return assessment;
  }

  async getRiskAssessmentBySupplier(supplierId: string): Promise<RiskAssessment[]> {
    return await db.select().from(riskAssessments).where(eq(riskAssessments.supplierId, supplierId)).orderBy(desc(riskAssessments.assessmentDate));
  }

  async createRiskAssessment(insertRiskAssessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const [assessment] = await db.insert(riskAssessments).values(insertRiskAssessment).returning();
    return assessment;
  }

  async updateRiskAssessment(id: string, updates: Partial<RiskAssessment>): Promise<RiskAssessment | undefined> {
    const [assessment] = await db.update(riskAssessments).set(updates).where(eq(riskAssessments.id, id)).returning();
    return assessment;
  }

  async deleteRiskAssessment(id: string): Promise<boolean> {
    try {
      // First delete all related assessment items
      await db.delete(riskAssessmentItems).where(eq(riskAssessmentItems.riskAssessmentId, id));

      // Then delete the assessment
      await db.delete(riskAssessments).where(eq(riskAssessments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting risk assessment:", error);
      return false;
    }
  }

  // Risk Assessment Items methods
  async getRiskAssessmentItems(assessmentId: string): Promise<RiskAssessmentItem[]> {
    return await db.select().from(riskAssessmentItems).where(eq(riskAssessmentItems.riskAssessmentId, assessmentId));
  }

  async getRiskAssessmentItem(id: string): Promise<RiskAssessmentItem | undefined> {
    const [item] = await db.select().from(riskAssessmentItems).where(eq(riskAssessmentItems.id, id));
    return item;
  }

  async createRiskAssessmentItem(insertItem: InsertRiskAssessmentItem): Promise<RiskAssessmentItem> {
    const [item] = await db.insert(riskAssessmentItems).values(insertItem).returning();
    return item;
  }

  async updateRiskAssessmentItem(id: string, updates: Partial<RiskAssessmentItem>): Promise<RiskAssessmentItem | undefined> {
    const [item] = await db.update(riskAssessmentItems).set(updates).where(eq(riskAssessmentItems.id, id)).returning();
    return item;
  }

  async deleteRiskAssessmentItem(id: string): Promise<boolean> {
    try {
      await db.delete(riskAssessmentItems).where(eq(riskAssessmentItems.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting risk assessment item:", error);
      return false;
    }
  }

  // Risk scoring and classification utilities based on Excel methodology
  async calculateRiskScore(assessmentId: string): Promise<{ overallScore: number; riskClassification: string; }> {
    try {
      const items = await this.getRiskAssessmentItems(assessmentId);

      if (items.length === 0) {
        return { overallScore: 0, riskClassification: "high" };
      }

      // Calculate weighted score based on Excel methodology
      let totalWeightedScore = 0;
      let totalWeight = 0;

      items.forEach(item => {
        const weight = Number(item.weight);
        const score = Number(item.finalScore);
        totalWeightedScore += weight * score;
        totalWeight += weight;
      });

      // Calculate overall score as percentage
      const overallScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

      // Apply Excel risk classification thresholds
      let riskClassification: string;
      if (overallScore >= 67) {
        riskClassification = "low";
      } else if (overallScore >= 61) {
        riskClassification = "medium";
      } else {
        riskClassification = "high";
      }

      return { overallScore, riskClassification };
    } catch (error) {
      console.error("Error calculating risk score:", error);
      return { overallScore: 0, riskClassification: "high" };
    }
  }

  async generateRiskReport(assessmentId: string): Promise<any> {
    try {
      const assessment = await this.getRiskAssessment(assessmentId);
      const items = await this.getRiskAssessmentItems(assessmentId);
      const scoring = await this.calculateRiskScore(assessmentId);

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      return {
        assessment,
        items: items.map(item => ({
          ...item,
          riskLevel: item.riskLevel,
          category: item.category,
          mitigationRequired: item.mitigationRequired,
        })),
        scoring,
        recommendations: this.generateRecommendations(items, scoring.riskClassification),
      };
    } catch (error) {
      console.error("Error generating risk report:", error);
      throw error;
    }
  }

  private generateRecommendations(items: RiskAssessmentItem[], overallRisk: string): string[] {
    const recommendations: string[] = [];

    // High-risk items require immediate action
    const highRiskItems = items.filter(item => item.riskLevel === "tinggi");
    if (highRiskItems.length > 0) {
      recommendations.push("Immediate remediation required for high-risk items");
      highRiskItems.forEach(item => {
        if (item.mitigationDescription) {
          recommendations.push(`• ${item.itemName}: ${item.mitigationDescription}`);
        }
      });
    }

    // Overall recommendations based on classification
    if (overallRisk === "high") {
      recommendations.push("Supplier requires intensive monitoring and support");
      recommendations.push("Consider exclusion from supply chain until remediation is complete");
    } else if (overallRisk === "medium") {
      recommendations.push("Enhanced monitoring and regular progress reviews recommended");
      recommendations.push("Implement targeted improvement plans for medium-risk areas");
    } else {
      recommendations.push("Continue regular monitoring and maintain current practices");
    }

    return recommendations;
  }

  // ========================================
  // DASHBOARD COMPLIANCE PRD - PHASE 1: FILTERED AGGREGATION IMPLEMENTATIONS
  // ========================================

  async getDashboardMetrics(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").DashboardMetrics> {
    try {
      // Get all analysis results (this is our main plot data source)
      const results = await db.select().from(analysisResults);

      // Apply filters if provided
      let filteredResults = results;
      if (filters?.dateFrom || filters?.dateTo) {
        filteredResults = results.filter(r => {
          const created = new Date(r.createdAt);
          if (filters.dateFrom && created < filters.dateFrom) return false;
          if (filters.dateTo && created > filters.dateTo) return false;
          return true;
        });
      }

      const totalPlots = filteredResults.length;
      const compliantPlots = filteredResults.filter(r => r.complianceStatus === 'COMPLIANT').length;
      const highRiskPlots = filteredResults.filter(r => r.overallRisk === 'HIGH').length;
      const mediumRiskPlots = filteredResults.filter(r => r.overallRisk === 'MEDIUM').length;
      const deforestedPlots = filteredResults.filter(r => 
        r.gfwLoss === 'TRUE' || r.jrcLoss === 'TRUE' || r.sbtnLoss === 'TRUE'
      ).length;
      const totalAreaHa = filteredResults.reduce((sum, r) => sum + parseFloat(r.area.toString()), 0);
      const complianceRate = totalPlots > 0 ? (compliantPlots / totalPlots) * 100 : 0;

      return {
        totalPlots,
        compliantPlots,
        highRiskPlots,
        mediumRiskPlots,
        deforestedPlots,
        totalAreaHa,
        complianceRate: Math.round(complianceRate * 100) / 100
      };
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      throw error;
    }
  }

  async getRiskSplit(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").RiskSplit> {
    try {
      const results = await db.select({
        overallRisk: analysisResults.overallRisk,
        createdAt: analysisResults.createdAt
      }).from(analysisResults);

      let filteredResults = results;
      if (filters?.dateFrom || filters?.dateTo) {
        filteredResults = results.filter(r => {
          const created = new Date(r.createdAt);
          if (filters.dateFrom && created < filters.dateFrom) return false;
          if (filters.dateTo && created > filters.dateTo) return false;
          return true;
        });
      }

      const total = filteredResults.length;
      if (total === 0) return { low: 0, medium: 0, high: 0 };

      const low = filteredResults.filter(r => r.overallRisk === 'LOW').length;
      const medium = filteredResults.filter(r => r.overallRisk === 'MEDIUM').length;
      const high = filteredResults.filter(r => r.overallRisk === 'HIGH').length;

      return { low, medium, high };
    } catch (error) {
      console.error("Error getting risk split:", error);
      return { low: 0, medium: 0, high: 0 };
    }
  }

  async getLegalitySplit(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").LegalitySplit> {
    try {
      const results = await db.select({
        complianceStatus: analysisResults.complianceStatus,
        createdAt: analysisResults.createdAt
      }).from(analysisResults);

      let filteredResults = results;
      if (filters?.dateFrom || filters?.dateTo) {
        filteredResults = results.filter(r => {
          const created = new Date(r.createdAt);
          if (filters.dateFrom && created < filters.dateFrom) return false;
          if (filters.dateTo && created > filters.dateTo) return false;
          return true;
        });
      }

      const total = filteredResults.length;
      if (total === 0) return { compliant: 0, underReview: 0, nonCompliant: 0 };

      const compliant = filteredResults.filter(r => r.complianceStatus === 'COMPLIANT').length;
      const nonCompliant = filteredResults.filter(r => r.complianceStatus === 'NON-COMPLIANT').length;
      const underReview = total - compliant - nonCompliant; // Remainder as under review

      return { 
        compliant, 
        underReview, 
        nonCompliant 
      };
    } catch (error) {
      console.error("Error getting legality split:", error);
      throw error;
    }
  }

  async getSupplierCompliance(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").SupplierSummary[]> {
    try {
      const results = await db.select({
        country: analysisResults.country,
        complianceStatus: analysisResults.complianceStatus,
        overallRisk: analysisResults.overallRisk,
        area: analysisResults.area,
        createdAt: analysisResults.createdAt,
        updatedAt: analysisResults.updatedAt
      }).from(analysisResults);
      const suppliersData = await db.select().from(suppliers);

      // Apply date filters
      let filteredResults = results;
      if (filters?.dateFrom || filters?.dateTo) {
        filteredResults = results.filter(r => {
          const created = new Date(r.createdAt);
          if (filters.dateFrom && created < filters.dateFrom) return false;
          if (filters.dateTo && created > filters.dateTo) return false;
          return true;
        });
      }

      // Group results by country (using as proxy for supplier since we don't have supplier linkage yet)
      const supplierGroups = filteredResults.reduce((groups, result) => {
        const key = result.country || 'Unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(result);
        return groups;
      }, {} as Record<string, typeof filteredResults>);

      const supplierSummaries: import("@shared/schema").SupplierSummary[] = [];

      Object.entries(supplierGroups).forEach(([supplierName, plots]) => {
        const totalPlots = plots.length;
        const compliantPlots = plots.filter(p => p.complianceStatus === 'COMPLIANT').length;
        const totalArea = plots.reduce((sum, p) => sum + parseFloat(p.area.toString()), 0);
        const complianceRate = totalPlots > 0 ? (compliantPlots / totalPlots) * 100 : 0;

        // Determine overall risk and legality status
        const highRiskCount = plots.filter(p => p.overallRisk === 'HIGH').length;
        const mediumRiskCount = plots.filter(p => p.overallRisk === 'MEDIUM').length;
        const riskStatus = highRiskCount > 0 ? 'high' : mediumRiskCount > 0 ? 'medium' : 'low';

        const nonCompliantCount = plots.filter(p => p.complianceStatus === 'NON-COMPLIANT').length;
        const legalityStatus = nonCompliantCount > 0 ? 'non_compliant' : 
          compliantPlots === totalPlots ? 'compliant' : 'under_review';

        supplierSummaries.push({
          supplierId: supplierName.replace(/\s+/g, '_').toLowerCase(),
          supplierName,
          totalPlots,
          compliantPlots,
          totalArea: Math.round(totalArea * 100) / 100,
          complianceRate: Math.round(complianceRate * 100) / 100,
          riskStatus: riskStatus as 'low' | 'medium' | 'high',
          legalityStatus: legalityStatus as 'compliant' | 'under_review' | 'non_compliant',
          region: supplierName, // Using supplier name as region for now
          lastUpdated: new Date(Math.max(...plots.map(p => new Date(p.updatedAt).getTime())))
        });
      });

      // Sort by compliance rate descending
      return supplierSummaries.sort((a, b) => b.complianceRate - a.complianceRate);
    } catch (error) {
      console.error("Error getting supplier compliance:", error);
      throw error;
    }
  }

  async getDashboardAlerts(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").Alert[]> {
    try {
      const results = await db.select({
        plotId: analysisResults.plotId,
        country: analysisResults.country,
        gfwLoss: analysisResults.gfwLoss,
        jrcLoss: analysisResults.jrcLoss,
        sbtnLoss: analysisResults.sbtnLoss,
        complianceStatus: analysisResults.complianceStatus,
        overallRisk: analysisResults.overallRisk,
        createdAt: analysisResults.createdAt,
        updatedAt: analysisResults.updatedAt
      }).from(analysisResults);

      // Apply date filters
      let filteredResults = results;
      if (filters?.dateFrom || filters?.dateTo) {
        filteredResults = results.filter(r => {
          const created = new Date(r.createdAt);
          if (filters.dateFrom && created < filters.dateFrom) return false;
          if (filters.dateTo && created > filters.dateTo) return false;
          return true;
        });
      }

      const alerts: import("@shared/schema").Alert[] = [];

      // Generate deforestation alerts for plots with forest loss
      filteredResults.forEach(result => {
        if (result.gfwLoss === 'TRUE' || result.jrcLoss === 'TRUE' || result.sbtnLoss === 'TRUE') {
          const datasets = [];
          if (result.gfwLoss === 'TRUE') datasets.push('GFW');
          if (result.jrcLoss === 'TRUE') datasets.push('JRC');
          if (result.sbtnLoss === 'TRUE') datasets.push('SBTN');

          alerts.push({
            id: `defor-${result.plotId}-${Date.now()}`,
            type: 'deforestation',
            severity: result.overallRisk.toLowerCase() as 'low' | 'medium' | 'high',
            title: `Deforestation detected in Plot ${result.plotId}`,
            description: `Forest loss detected by ${datasets.join(', ')} in ${result.country}`,
            plotId: result.plotId,
            region: result.country,
            detectedAt: new Date(result.updatedAt),
            status: 'new'
          });
        }

        // Generate compliance alerts for non-compliant plots
        if (result.complianceStatus === 'NON-COMPLIANT') {
          alerts.push({
            id: `comp-${result.plotId}-${Date.now()}`,
            type: 'compliance',
            severity: result.overallRisk.toLowerCase() as 'low' | 'medium' | 'high',
            title: `Compliance issue in Plot ${result.plotId}`,
            description: `Non-compliant plot identified in ${result.country}`,
            plotId: result.plotId,
            region: result.country,
            detectedAt: new Date(result.updatedAt),
            status: 'new'
          });
        }

        // Generate risk alerts for high-risk plots
        if (result.overallRisk === 'HIGH') {
          alerts.push({
            id: `risk-${result.plotId}-${Date.now()}`,
            type: 'risk',
            severity: 'high',
            title: `High risk plot ${result.plotId}`,
            description: `Plot classified as high risk in ${result.country}`,
            plotId: result.plotId,
            region: result.country,
            detectedAt: new Date(result.updatedAt),
            status: 'new'
          });
        }
      });

      // Sort by detected date, most recent first
      return alerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime()).slice(0, 50); // Limit to 50 alerts
    } catch (error) {
      console.error("Error getting dashboard alerts:", error);
      throw error;
    }
  }

  async getComplianceTrend(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").ComplianceTrendPoint[]> {
    try {
      // Generate 12 months of mock trend data since we don't have historical data yet
      const trend: import("@shared/schema").ComplianceTrendPoint[] = [];
      const currentDate = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const period = date.toISOString().substring(0, 7); // YYYY-MM format

        // Mock data with slight variation (would be real historical data in production)
        const baseCompliance = 75;
        const variation = Math.sin(i * 0.5) * 10 + Math.random() * 5;
        const complianceRate = Math.max(60, Math.min(95, baseCompliance + variation));

        const totalPlots = 100 + Math.floor(Math.random() * 50);
        const compliantPlots = Math.floor((totalPlots * complianceRate) / 100);

        trend.push({
          period,
          complianceRate: Math.round(complianceRate * 100) / 100,
          totalPlots,
          compliantPlots,
          date
        });
      }

      return trend;
    } catch (error) {
      console.error("Error getting compliance trend:", error);
      throw error;
    }
  }

  async getExportData(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").ExportData> {
    try {
      const metrics = await this.getDashboardMetrics(filters);
      const plotSummaries = await this.getPlotSummaries(filters);
      const supplierSummaries = await this.getSupplierCompliance(filters);

      return {
        plotSummaries,
        supplierSummaries,
        metrics,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error("Error getting export data:", error);
      throw error;
    }
  }

  async getAnalysisResultsByPlotIds(plotIds: string[]): Promise<any[]> {
    try {
      const results = await db.select().from(analysisResults).where(
        inArray(analysisResults.plotId, plotIds)
      );
      return results;
    } catch (error) {
      console.error("Error getting analysis results by plot IDs:", error);
      throw error;
    }
  }

  async saveAnalysisResultsWithSupplier(plotIds: string[], supplierId: string): Promise<void> {
    try {
      const supplier = await this.getSupplier(supplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Update all matching analysis results with supplier information
      await db.update(analysisResults)
        .set({ 
          supplierId: supplierId,
          supplierName: supplier.companyName || supplier.name,
          updatedAt: new Date()
        })
        .where(inArray(analysisResults.plotId, plotIds));

      console.log(`✅ Updated ${plotIds.length} analysis results with supplier ${supplier.companyName || supplier.name}`);
    } catch (error) {
      console.error("Error saving analysis results with supplier:", error);
      throw error;
    }
  }

  async updateAnalysisResult(id: string, updates: any): Promise<any> {
    try {
      const [updated] = await db.update(analysisResults)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(analysisResults.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating analysis result:", error);
      throw error;
    }
  }

  async getPlotByPlotId(plotId: string): Promise<any> {
    try {
      const [plot] = await db.select().from(plots).where(eq(plots.plotId, plotId));
      return plot;
    } catch (error) {
      console.error("Error getting plot by plot ID:", error);
      throw error;
    }
  }

  async createPlot(plotData: any): Promise<any> {
    try {
      const [created] = await db.insert(plots).values(plotData).returning();
      return created;
    } catch (error) {
      console.error("Error creating plot:", error);
      throw error;
    }
  }

  async updatePlot(id: string, updates: any): Promise<any> {
    try {
      const [updated] = await db.update(plots)
        .set(updates)
        .where(eq(plots.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating plot:", error);
      throw error;
    }
  }

  async getSupplier(id: string): Promise<any> {
    try {
      const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
      return supplier;
    } catch (error) {
      console.error("Error getting supplier:", error);
      throw error;
    }
  }

  async getPlotSummaries(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").PlotSummary[]> {
    try {
      const results = await db.select().from(analysisResults);

      // Apply date filters
      let filteredResults = results;
      if (filters?.dateFrom || filters?.dateTo) {
        filteredResults = results.filter(r => {
          const created = new Date(r.createdAt);
          if (filters.dateFrom && created < filters.dateFrom) return false;
          if (filters.dateTo && created > filters.dateTo) return false;
          return true;
        });
      }

      return filteredResults.map(result => ({
        plotId: result.plotId,
        supplierName: result.country || 'Unknown Supplier', // Using country as supplier proxy
        region: result.country,
        area: parseFloat(result.area.toString()),
        riskStatus: result.overallRisk.toLowerCase() as 'low' | 'medium' | 'high',
        legalityStatus: result.complianceStatus === 'COMPLIANT' ? 'compliant' : 
          result.complianceStatus === 'NON-COMPLIANT' ? 'non_compliant' : 'under_review',
        lastUpdated: new Date(result.updatedAt)
      }));
    } catch (error) {
      console.error("Error getting plot summaries:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();