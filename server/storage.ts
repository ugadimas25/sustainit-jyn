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

  mills, type Mill, type InsertMill
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Enhanced IStorage interface for EPCIS-compliant traceability
export interface IStorage {
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

  // DDS Reports management
  getDdsReports(): Promise<DdsReport[]>;
  getDdsReportById(id: string): Promise<DdsReport | undefined>;
  createDdsReport(insertDdsReport: InsertDdsReport): Promise<DdsReport>;
  updateDdsReport(id: string, updates: Partial<DdsReport>): Promise<DdsReport | undefined>;


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
}

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
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
    return await db.select().from(facilities).where(eq(facilities.type, type));
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
      return result.rowCount > 0;
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
      const [result] = await db.select().from(traceabilityDataCollection).where(eq(traceabilityDataCollection.id, id));
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
}

export const storage = new DatabaseStorage();