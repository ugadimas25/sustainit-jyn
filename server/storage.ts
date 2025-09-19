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
  riskAssessmentItems, type RiskAssessmentItem, InsertRiskAssessmentItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
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

  // Peatland intersection calculation method
  calculatePeatlandIntersection(geometry: any): Promise<{ intersectionArea: number; peatlandData?: any[] }>;
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
  async getEstateDataCollection(): Promise<import("@shared/schema").EstateDataCollection[]>;
  async getEstateDataCollectionById(id: string): Promise<import("@shared/schema").EstateDataCollection | undefined>;
  async createEstateDataCollection(insertEstateData: import("@shared/schema").InsertEstateDataCollection): Promise<import("@shared/schema").EstateDataCollection>;
  async updateEstateDataCollection(id: string, updates: Partial<import("@shared/schema").EstateDataCollection>): Promise<import("@shared/schema").EstateDataCollection | undefined>;
  async deleteEstateDataCollection(id: string): Promise<boolean>;

  // Mill Data Collection management
  async getMillDataCollection(): Promise<import("@shared/schema").MillDataCollection[]>;
  async getMillDataCollectionById(id: string): Promise<import("@shared/schema").MillDataCollection | undefined>;
  async createMillDataCollection(insertMillData: import("@shared/schema").InsertMillDataCollection): Promise<import("@shared/schema").MillDataCollection>;
  async updateMillDataCollection(id: string, updates: Partial<import("@shared/schema").MillDataCollection>): Promise<import("@shared/schema").MillDataCollection | undefined>;
  async deleteMillDataCollection(id: string): Promise<boolean>;

  // Traceability Data Collection methods
  async getTraceabilityDataCollections(): Promise<import("@shared/schema").TraceabilityDataCollection[]>;
  async getTraceabilityDataCollectionById(id: string): Promise<import("@shared/schema").TraceabilityDataCollection | undefined>;
  async createTraceabilityDataCollection(insertData: import("@shared/schema").InsertTraceabilityDataCollection): Promise<import("@shared/schema").TraceabilityDataCollection>;

  // KCP Data Collection methods
  async getKcpDataCollections(): Promise<import("@shared/schema").KcpDataCollection[]>;
  async getKcpDataCollectionById(id: string): Promise<import("@shared/schema").KcpDataCollection | undefined>;
  async createKcpDataCollection(insertData: import("@shared/schema").InsertKcpDataCollection): Promise<import("@shared/schema").KcpDataCollection>;

  // Bulking Data Collection methods
  async getBulkingDataCollections(): Promise<import("@shared/schema").BulkingDataCollection[]>;
  async getBulkingDataCollectionById(id: string): Promise<import("@shared/schema").BulkingDataCollection | undefined>;
  async createBulkingDataCollection(insertData: import("@shared/schema").InsertBulkingDataCollection): Promise<import("@shared/schema").BulkingDataCollection>;

  // EUDR Assessment implementation
  async getEudrAssessments(): Promise<EudrAssessment[]>;
  async getEudrAssessment(id: string): Promise<EudrAssessment | undefined>;
  async createEudrAssessment(insertEudrAssessment: InsertEudrAssessment): Promise<EudrAssessment>;
  async updateEudrAssessment(id: string, updates: Partial<EudrAssessment>): Promise<EudrAssessment>;
  async deleteEudrAssessment(id: string): Promise<void>;

  // Analysis Results management
  async getAnalysisResults(): Promise<AnalysisResult[]>;
  async getAnalysisResult(id: string): Promise<AnalysisResult | undefined>;
  async getAnalysisResultsBySession(uploadSession: string): Promise<AnalysisResult[]>;
  async createAnalysisResult(insertAnalysisResult: InsertAnalysisResult): Promise<AnalysisResult>;
  async updateAnalysisResultGeometry(plotId: string, coordinates: number[][]): Promise<AnalysisResult | undefined>;
  async clearAnalysisResults(): Promise<void>;
  async calculateDashboardMetrics(): Promise<{
    totalPlots: string;
    compliantPlots: string;
    highRiskPlots: string;
    mediumRiskPlots: string;
    deforestedPlots: string;
    totalArea: string;
  }>;

  // Supplier Assessment Progress methods
  async getSupplierAssessmentProgress(): Promise<SupplierAssessmentProgress[]>;
  async getSupplierAssessmentProgressByName(supplierName: string): Promise<SupplierAssessmentProgress | undefined>;
  async createSupplierAssessmentProgress(insertProgress: InsertSupplierAssessmentProgress): Promise<SupplierAssessmentProgress>;
  async updateSupplierAssessmentProgress(id: string, updates: Partial<SupplierAssessmentProgress>): Promise<SupplierAssessmentProgress | undefined>;
  async updateSupplierWorkflowStep(supplierName: string, step: number, completed: boolean, referenceId?: string): Promise<SupplierAssessmentProgress | undefined>;
  async checkSupplierStepAccess(supplierName: string, requestedStep: number): Promise<boolean>;

  // Risk Assessment methods implementation
  async getRiskAssessments(): Promise<RiskAssessment[]>;
  async getRiskAssessment(id: string): Promise<RiskAssessment | undefined>;
  async getRiskAssessmentBySupplier(supplierId: string): Promise<RiskAssessment[]>;
  async createRiskAssessment(insertRiskAssessment: InsertRiskAssessment): Promise<RiskAssessment>;
  async updateRiskAssessment(id: string, updates: Partial<RiskAssessment>): Promise<RiskAssessment | undefined>;
  async deleteRiskAssessment(id: string): Promise<boolean>;

  // Risk Assessment Items methods
  async getRiskAssessmentItems(assessmentId: string): Promise<RiskAssessmentItem[]>;
  async getRiskAssessmentItem(id: string): Promise<RiskAssessmentItem | undefined>;
  async createRiskAssessmentItem(insertItem: InsertRiskAssessmentItem): Promise<RiskAssessmentItem>;
  async updateRiskAssessmentItem(id: string, updates: Partial<RiskAssessmentItem>): Promise<RiskAssessmentItem | undefined>;
  async deleteRiskAssessmentItem(id: string): Promise<boolean>;

  // Risk scoring and classification utilities based on Excel methodology
  async calculateRiskScore(assessmentId: string): Promise<{ overallScore: number; riskClassification: string; }>;
  async generateRiskReport(assessmentId: string): Promise<any>;

  // ========================================
  // DASHBOARD COMPLIANCE PRD - PHASE 1: FILTERED AGGREGATION IMPLEMENTATIONS
  // ========================================

  // Dashboard metrics with optional filters
  async getDashboardMetrics(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").DashboardMetrics>;

  // Risk and legality split aggregations 
  async getRiskSplit(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").RiskSplit>;
  async getLegalitySplit(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").LegalitySplit>;

  // Supplier compliance table data
  async getSupplierCompliance(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").SupplierSummary[]>;

  // Alert management for dashboard
  async getDashboardAlerts(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").Alert[]>;

  // Compliance trend data (12 months)
  async getComplianceTrend(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").ComplianceTrendPoint[]>;

  // Export functionality
  async getExportData(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").ExportData>;

  // Plot summaries for detailed views and drill-downs
  async getPlotSummaries(filters?: import("@shared/schema").DashboardFilters): Promise<import("@shared/schema").PlotSummary[]>;

  // Peatland intersection calculation method
  async calculatePeatlandIntersection(geometry: any): Promise<{ intersectionArea: number; peatlandData?: any[] }>;
}

export const storage = new DatabaseStorage();
