import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Supplier,
  InsertSupplier,
  Plot,
  InsertPlot,
  Document,
  InsertDocument,
  DeforestationAlert,
  InsertDeforestationAlert,
  Mill,
  InsertMill,
  Delivery,
  InsertDelivery,
  ProductionLot,
  InsertProductionLot,
  Shipment,
  InsertShipment,
  DDSReport,
  InsertDDSReport,
  Survey,
  InsertSurvey,
  SurveyResponse,
  InsertSurveyResponse,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Suppliers
  getSupplier(id: string): Promise<Supplier | undefined>;
  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;

  // Plots
  getPlot(id: string): Promise<Plot | undefined>;
  getPlotByPlotId(plotId: string): Promise<Plot | undefined>;
  getAllPlots(): Promise<Plot[]>;
  getPlotsBySupplier(supplierId: string): Promise<Plot[]>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot>;
  getPlotsWithAlerts(): Promise<any[]>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByPlot(plotId: string): Promise<Document[]>;
  getDocumentsBySupplier(supplierId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document>;

  // Deforestation Alerts
  getAlert(id: string): Promise<DeforestationAlert | undefined>;
  getAlertsByPlot(plotId: string): Promise<DeforestationAlert[]>;
  getRecentAlerts(limit?: number): Promise<DeforestationAlert[]>;
  createAlert(alert: InsertDeforestationAlert): Promise<DeforestationAlert>;
  updateAlert(id: string, alert: Partial<InsertDeforestationAlert>): Promise<DeforestationAlert>;

  // Mills
  getMill(id: string): Promise<Mill | undefined>;
  getAllMills(): Promise<Mill[]>;
  createMill(mill: InsertMill): Promise<Mill>;

  // Deliveries
  getDelivery(id: string): Promise<Delivery | undefined>;
  getDeliveriesByPlot(plotId: string): Promise<Delivery[]>;
  getDeliveriesByMill(millId: string): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;

  // Production Lots
  getProductionLot(id: string): Promise<ProductionLot | undefined>;
  getProductionLotsByMill(millId: string): Promise<ProductionLot[]>;
  createProductionLot(lot: InsertProductionLot): Promise<ProductionLot>;

  // Shipments
  getShipment(id: string): Promise<Shipment | undefined>;
  getAllShipments(): Promise<Shipment[]>;
  getShipmentByShipmentId(shipmentId: string): Promise<Shipment | undefined>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipmentTraceability(shipmentId: string): Promise<any>;

  // DDS Reports
  getDDSReport(id: string): Promise<DDSReport | undefined>;
  getAllDDSReports(): Promise<DDSReport[]>;
  getDDSReportsByShipment(shipmentId: string): Promise<DDSReport[]>;
  createDDSReport(report: InsertDDSReport): Promise<DDSReport>;
  updateDDSReport(id: string, report: Partial<InsertDDSReport>): Promise<DDSReport>;

  // Surveys
  getSurvey(id: string): Promise<Survey | undefined>;
  getAllSurveys(): Promise<Survey[]>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;

  // Survey Responses
  getSurveyResponse(id: string): Promise<SurveyResponse | undefined>;
  getSurveyResponsesByPlot(plotId: string): Promise<SurveyResponse[]>;
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Suppliers
  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id));
    return supplier || undefined;
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(schema.suppliers).orderBy(desc(schema.suppliers.createdAt));
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(schema.suppliers).values(insertSupplier).returning();
    return supplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updated] = await db.update(schema.suppliers).set(supplier).where(eq(schema.suppliers.id, id)).returning();
    return updated;
  }

  // Plots
  async getPlot(id: string): Promise<Plot | undefined> {
    const [plot] = await db.select().from(schema.plots).where(eq(schema.plots.id, id));
    return plot || undefined;
  }

  async getPlotByPlotId(plotId: string): Promise<Plot | undefined> {
    const [plot] = await db.select().from(schema.plots).where(eq(schema.plots.plotId, plotId));
    return plot || undefined;
  }

  async getAllPlots(): Promise<Plot[]> {
    return await db.select().from(schema.plots).orderBy(desc(schema.plots.createdAt));
  }

  async getPlotsBySupplier(supplierId: string): Promise<Plot[]> {
    return await db.select().from(schema.plots).where(eq(schema.plots.supplierId, supplierId));
  }

  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const [plot] = await db.insert(schema.plots).values(insertPlot).returning();
    return plot;
  }

  async updatePlot(id: string, plot: Partial<InsertPlot>): Promise<Plot> {
    const [updated] = await db.update(schema.plots).set(plot).where(eq(schema.plots.id, id)).returning();
    return updated;
  }

  async getPlotsWithAlerts(): Promise<any[]> {
    return await db
      .select({
        plot: schema.plots,
        supplier: schema.suppliers,
        alertCount: sql<number>`count(${schema.deforestationAlerts.id})`,
      })
      .from(schema.plots)
      .leftJoin(schema.suppliers, eq(schema.plots.supplierId, schema.suppliers.id))
      .leftJoin(schema.deforestationAlerts, eq(schema.plots.id, schema.deforestationAlerts.plotId))
      .groupBy(schema.plots.id, schema.suppliers.id);
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    return document || undefined;
  }

  async getDocumentsByPlot(plotId: string): Promise<Document[]> {
    return await db.select().from(schema.documents).where(eq(schema.documents.plotId, plotId));
  }

  async getDocumentsBySupplier(supplierId: string): Promise<Document[]> {
    return await db.select().from(schema.documents).where(eq(schema.documents.supplierId, supplierId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(schema.documents).values(insertDocument).returning();
    return document;
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document> {
    const [updated] = await db.update(schema.documents).set(document).where(eq(schema.documents.id, id)).returning();
    return updated;
  }

  // Deforestation Alerts
  async getAlert(id: string): Promise<DeforestationAlert | undefined> {
    const [alert] = await db.select().from(schema.deforestationAlerts).where(eq(schema.deforestationAlerts.id, id));
    return alert || undefined;
  }

  async getAlertsByPlot(plotId: string): Promise<DeforestationAlert[]> {
    return await db.select().from(schema.deforestationAlerts).where(eq(schema.deforestationAlerts.plotId, plotId));
  }

  async getRecentAlerts(limit: number = 10): Promise<DeforestationAlert[]> {
    return await db
      .select()
      .from(schema.deforestationAlerts)
      .orderBy(desc(schema.deforestationAlerts.alertDate))
      .limit(limit);
  }

  async createAlert(insertAlert: InsertDeforestationAlert): Promise<DeforestationAlert> {
    const [alert] = await db.insert(schema.deforestationAlerts).values(insertAlert).returning();
    return alert;
  }

  async updateAlert(id: string, alert: Partial<InsertDeforestationAlert>): Promise<DeforestationAlert> {
    const [updated] = await db.update(schema.deforestationAlerts).set(alert).where(eq(schema.deforestationAlerts.id, id)).returning();
    return updated;
  }

  // Mills
  async getMill(id: string): Promise<Mill | undefined> {
    const [mill] = await db.select().from(schema.mills).where(eq(schema.mills.id, id));
    return mill || undefined;
  }

  async getAllMills(): Promise<Mill[]> {
    return await db.select().from(schema.mills).orderBy(desc(schema.mills.createdAt));
  }

  async createMill(insertMill: InsertMill): Promise<Mill> {
    const [mill] = await db.insert(schema.mills).values(insertMill).returning();
    return mill;
  }

  // Deliveries
  async getDelivery(id: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(schema.deliveries).where(eq(schema.deliveries.id, id));
    return delivery || undefined;
  }

  async getDeliveriesByPlot(plotId: string): Promise<Delivery[]> {
    return await db.select().from(schema.deliveries).where(eq(schema.deliveries.plotId, plotId));
  }

  async getDeliveriesByMill(millId: string): Promise<Delivery[]> {
    return await db.select().from(schema.deliveries).where(eq(schema.deliveries.millId, millId));
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db.insert(schema.deliveries).values(insertDelivery).returning();
    return delivery;
  }

  // Production Lots
  async getProductionLot(id: string): Promise<ProductionLot | undefined> {
    const [lot] = await db.select().from(schema.productionLots).where(eq(schema.productionLots.id, id));
    return lot || undefined;
  }

  async getProductionLotsByMill(millId: string): Promise<ProductionLot[]> {
    return await db.select().from(schema.productionLots).where(eq(schema.productionLots.millId, millId));
  }

  async createProductionLot(insertLot: InsertProductionLot): Promise<ProductionLot> {
    const [lot] = await db.insert(schema.productionLots).values(insertLot).returning();
    return lot;
  }

  // Shipments
  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(schema.shipments).where(eq(schema.shipments.id, id));
    return shipment || undefined;
  }

  async getAllShipments(): Promise<Shipment[]> {
    return await db.select().from(schema.shipments).orderBy(desc(schema.shipments.createdAt));
  }

  async getShipmentByShipmentId(shipmentId: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(schema.shipments).where(eq(schema.shipments.shipmentId, shipmentId));
    return shipment || undefined;
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const [shipment] = await db.insert(schema.shipments).values(insertShipment).returning();
    return shipment;
  }

  async getShipmentTraceability(shipmentId: string): Promise<any> {
    // Complex query to get full traceability from shipment to plots
    const shipment = await this.getShipmentByShipmentId(shipmentId);
    if (!shipment) return null;

    // Get shipment lots
    const shipmentLots = await db
      .select({
        shipmentLot: schema.shipmentLots,
        productionLot: schema.productionLots,
        mill: schema.mills,
      })
      .from(schema.shipmentLots)
      .leftJoin(schema.productionLots, eq(schema.shipmentLots.lotId, schema.productionLots.id))
      .leftJoin(schema.mills, eq(schema.productionLots.millId, schema.mills.id))
      .where(eq(schema.shipmentLots.shipmentId, shipment.id));

    // Get source plots for each lot
    const sourcePlots = [];
    for (const shipmentLot of shipmentLots) {
      if (!shipmentLot.productionLot) continue;
      
      const lotDeliveries = await db
        .select({
          delivery: schema.deliveries,
          plot: schema.plots,
          supplier: schema.suppliers,
        })
        .from(schema.lotDeliveries)
        .leftJoin(schema.deliveries, eq(schema.lotDeliveries.deliveryId, schema.deliveries.id))
        .leftJoin(schema.plots, eq(schema.deliveries.plotId, schema.plots.id))
        .leftJoin(schema.suppliers, eq(schema.plots.supplierId, schema.suppliers.id))
        .where(eq(schema.lotDeliveries.lotId, shipmentLot.productionLot.id));

      sourcePlots.push(...lotDeliveries);
    }

    return {
      shipment,
      shipmentLots,
      sourcePlots,
    };
  }

  // DDS Reports
  async getDDSReport(id: string): Promise<DDSReport | undefined> {
    const [report] = await db.select().from(schema.ddsReports).where(eq(schema.ddsReports.id, id));
    return report || undefined;
  }

  async getAllDDSReports(): Promise<DDSReport[]> {
    return await db.select().from(schema.ddsReports).orderBy(desc(schema.ddsReports.createdAt));
  }

  async getDDSReportsByShipment(shipmentId: string): Promise<DDSReport[]> {
    return await db.select().from(schema.ddsReports).where(eq(schema.ddsReports.shipmentId, shipmentId));
  }

  async createDDSReport(insertReport: InsertDDSReport): Promise<DDSReport> {
    const [report] = await db.insert(schema.ddsReports).values(insertReport).returning();
    return report;
  }

  async updateDDSReport(id: string, report: Partial<InsertDDSReport>): Promise<DDSReport> {
    const [updated] = await db.update(schema.ddsReports).set(report).where(eq(schema.ddsReports.id, id)).returning();
    return updated;
  }

  // Surveys
  async getSurvey(id: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(schema.surveys).where(eq(schema.surveys.id, id));
    return survey || undefined;
  }

  async getAllSurveys(): Promise<Survey[]> {
    return await db.select().from(schema.surveys).orderBy(desc(schema.surveys.createdAt));
  }

  async createSurvey(insertSurvey: InsertSurvey): Promise<Survey> {
    const [survey] = await db.insert(schema.surveys).values(insertSurvey).returning();
    return survey;
  }

  // Survey Responses
  async getSurveyResponse(id: string): Promise<SurveyResponse | undefined> {
    const [response] = await db.select().from(schema.surveyResponses).where(eq(schema.surveyResponses.id, id));
    return response || undefined;
  }

  async getSurveyResponsesByPlot(plotId: string): Promise<SurveyResponse[]> {
    return await db.select().from(schema.surveyResponses).where(eq(schema.surveyResponses.plotId, plotId));
  }

  async createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse> {
    const [response] = await db.insert(schema.surveyResponses).values(insertResponse).returning();
    return response;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    const totalPlots = await db.select({ count: sql<number>`count(*)` }).from(schema.plots);
    const compliantPlots = await db.select({ count: sql<number>`count(*)` }).from(schema.plots).where(eq(schema.plots.status, 'compliant'));
    const atRiskPlots = await db.select({ count: sql<number>`count(*)` }).from(schema.plots).where(eq(schema.plots.status, 'at_risk'));
    const criticalPlots = await db.select({ count: sql<number>`count(*)` }).from(schema.plots).where(eq(schema.plots.status, 'critical'));
    
    const recentAlerts = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.deforestationAlerts)
      .where(and(
        eq(schema.deforestationAlerts.status, 'active'),
        sql`${schema.deforestationAlerts.alertDate} >= current_date - interval '30 days'`
      ));

    return {
      totalPlots: totalPlots[0].count,
      compliantPlots: compliantPlots[0].count,
      atRiskPlots: atRiskPlots[0].count,
      criticalPlots: criticalPlots[0].count,
      recentAlerts: recentAlerts[0].count,
    };
  }
}

export const storage = new DatabaseStorage();
